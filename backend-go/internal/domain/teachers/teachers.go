// Package teachers implements /api/teachers endpoints.
//
// Performance architecture:
//   - List/Get: when a PG pool is provided, queries are served from
//     PostgreSQL with Redis caching (30 min TTL via *repo.TeacherRepo).
//     Falls back to MemStore scans when PG is unavailable.
//   - Create/Update/Delete: writes go to MemStore + persistence queue
//     (preserving the existing User account + class.teacher_ids fan-out).
//     Each mutation invalidates teachers list, dashboard, and composite
//     caches so downstream views stay fresh.
package teachers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"sort"
	"strings"
	"time"

	"github.com/eduplexo/backend-go/internal/api"
	"github.com/eduplexo/backend-go/internal/audit"
	"github.com/eduplexo/backend-go/internal/auth"
	"github.com/eduplexo/backend-go/internal/cache"
	"github.com/eduplexo/backend-go/internal/domain/tenant"
	"github.com/eduplexo/backend-go/internal/repo"
	"github.com/eduplexo/backend-go/internal/store"
	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Handler serves the /api/teachers/* routes.
//
// `Pool` and `Cache` are optional — when both are provided, List queries
// are served from PostgreSQL with Redis caching. CUD operations always go
// through MemStore + persistence queue and additionally invalidate the
// composite/dashboard cache.
type Handler struct {
	Store   *store.MemStore
	Persist func(table string, doc any)
	Pool    *pgxpool.Pool
	Cache   *cache.Client
	repo    *repo.TeacherRepo
}

func New(s *store.MemStore, save func(string, any)) *Handler {
	if save == nil {
		save = func(string, any) {}
	}
	return &Handler{Store: s, Persist: save}
}

// NewPG creates a teacher handler with PostgreSQL + Redis read path.
func NewPG(s *store.MemStore, save func(string, any), pool *pgxpool.Pool, c *cache.Client) *Handler {
	h := New(s, save)
	h.Pool = pool
	h.Cache = c
	if pool != nil {
		h.repo = repo.NewTeacherRepo(pool, c)
	}
	return h
}

// invalidateCaches clears teacher list + dashboard + composite caches for
// the given tenant. Called after every mutation.
func (h *Handler) invalidateCaches(ctx context.Context, schoolID, yearID string) {
	if h.Cache == nil || !h.Cache.Available() {
		return
	}
	_, _ = h.Cache.DelPattern(ctx, fmt.Sprintf("teachers:%s:*", schoolID))
	_, _ = h.Cache.Del(ctx,
		fmt.Sprintf("composite:%s:%s", schoolID, yearID),
		fmt.Sprintf("dash:%s:%s", schoolID, yearID),
	)
}

// List implements GET /api/teachers.
//
// Read path: when PG is available and pagination is requested, the indexed
// SQL query + Redis cache fast path is used. The raw teacher row is then
// re-hydrated from the MemStore for the auxiliary `subject_ids`/`class_ids`
// arrays that aren't on the PG row directly. Without pagination params, we
// fall through to a MemStore scan to preserve the legacy flat-array
// response.
func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	if ctx == nil {
		api.WriteResult(w, api.Fail("UNAUTHENTICATED", "Authentication required.", 401, nil))
		return
	}

	q := r.URL.Query()
	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		if err := auth.AssertPermission(ctx, "teachers", auth.ActionView); err != nil {
			return nil, err
		}
		yearID := tenant.ResolveAcademicYearID(h.Store, ctx, q.Get("academic_year_id"))
		status := q.Get("status")
		search := strings.TrimSpace(q.Get("search"))
		pagination := api.ParsePagination(q)

		// ─── PG fast path (paginated only) ─────────────────────────────
		if h.repo != nil && pagination.Enabled {
			items, total, err := h.repo.List(r.Context(), ctx.SchoolID, yearID, repo.ListOpts{
				Page:    pagination.Page,
				PerPage: pagination.Limit,
				Status:  status,
				Search:  search,
			})
			if err == nil {
				// Build a quick lookup of MemStore teachers to enrich
				// subject_ids/class_ids that aren't part of the PG row.
				h.Store.RLock()
				memByID := make(map[string]*store.Teacher, len(h.Store.Teachers))
				for _, t := range h.Store.Teachers {
					if t.SchoolID == ctx.SchoolID {
						memByID[t.ID] = t
					}
				}
				h.Store.RUnlock()

				hydrated := make([]map[string]any, 0, len(items))
				for i := range items {
					t := items[i]
					mem := memByID[t.ID]
					hydrated = append(hydrated, h.hydrateTeacher(&t, mem))
				}
				return api.BuildPaginated(hydrated, total, pagination), nil
			}
			// PG failure — fall through to MemStore scan
		}

		// ─── MemStore fallback ─────────────────────────────────────────
		h.Store.RLock()
		rows := make([]*store.Teacher, 0)
		for _, t := range h.Store.Teachers {
			if t.SchoolID != ctx.SchoolID {
				continue
			}
			if yearID != "" && t.AcademicYearID != "" && t.AcademicYearID != yearID {
				continue
			}
			if status != "" && t.Status != status {
				continue
			}
			if search != "" && !teacherMatchesSearch(t, search) {
				continue
			}
			rows = append(rows, t)
		}
		h.Store.RUnlock()

		sort.SliceStable(rows, func(i, j int) bool {
			if rows[i].FirstName == rows[j].FirstName {
				return rows[i].LastName < rows[j].LastName
			}
			return rows[i].FirstName < rows[j].FirstName
		})

		hydrated := make([]map[string]any, 0, len(rows))
		for _, t := range rows {
			hydrated = append(hydrated, h.hydrateTeacher(t, t))
		}

		if !pagination.Enabled {
			return hydrated, nil
		}
		total := len(hydrated)
		start := pagination.Skip
		end := start + pagination.Limit
		if start > total {
			start = total
		}
		if end > total {
			end = total
		}
		return api.BuildPaginated(hydrated[start:end], total, pagination), nil
	}))
}

// hydrateTeacher returns the response shape the frontend expects. `pgRow`
// is the canonical record (from PG or MemStore); `mem` is the optional
// MemStore enrichment for fields that PG doesn't carry (subjects/classes).
func (h *Handler) hydrateTeacher(pgRow *store.Teacher, mem *store.Teacher) map[string]any {
	out := map[string]any{
		"_id":              pgRow.ID,
		"employee_no":      pgRow.EmployeeNo,
		"first_name":       pgRow.FirstName,
		"last_name":        pgRow.LastName,
		"email":            pgRow.Email,
		"phone":            pgRow.Phone,
		"qualification":    pgRow.Qualification,
		"status":           pgRow.Status,
		"joined_at":        pgRow.JoinedAt,
		"academic_year_id": pgRow.AcademicYearID,
		"user_id":          pgRow.UserID,
		"subjects":         orEmpty(pgRow.Subjects),
		"subject_ids":      orEmpty(pgRow.SubjectIDs),
		"class_ids":        orEmpty(pgRow.ClassIDs),
	}
	if mem != nil {
		out["subjects"] = orEmpty(mem.Subjects)
		out["subject_ids"] = orEmpty(mem.SubjectIDs)
		out["class_ids"] = orEmpty(mem.ClassIDs)
		if mem.UserID != "" {
			out["user_id"] = mem.UserID
		}
		if !mem.JoinedAt.IsZero() {
			out["joined_at"] = mem.JoinedAt
		}
	}
	return out
}

// Get implements GET /api/teachers/:id.
//
// Read path: PG when available, MemStore fallback otherwise. The MemStore
// row is preferred when present because it carries the auxiliary
// subject_ids/class_ids arrays.
func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	id := chi.URLParam(r, "id")
	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		if err := auth.AssertPermission(ctx, "teachers", auth.ActionView); err != nil {
			return nil, err
		}

		// MemStore is authoritative for subject_ids/class_ids arrays which
		// are not stored on the PG `teachers` row directly.
		h.Store.RLock()
		for _, t := range h.Store.Teachers {
			if t.ID == id && t.SchoolID == ctx.SchoolID {
				h.Store.RUnlock()
				return t, nil
			}
		}
		h.Store.RUnlock()

		// PG fallback when not in MemStore (e.g. lazy-loaded tenant).
		if h.repo != nil {
			if t, err := h.repo.GetByID(r.Context(), id, ctx.SchoolID); err == nil && t != nil {
				return t, nil
			}
		}

		return nil, api.NewControlledError("NOT_FOUND", "Teacher not found.", 404, nil)
	}))
}

type createInput struct {
	Email         string   `json:"email"`
	Password      string   `json:"password"`
	FirstName     string   `json:"first_name"`
	LastName      string   `json:"last_name"`
	Phone         string   `json:"phone"`
	Qualification string   `json:"qualification,omitempty"`
	SubjectIDs    []string `json:"subject_ids,omitempty"`
	Subjects      []string `json:"subjects,omitempty"`
	ClassIDs      []string `json:"class_ids,omitempty"`
}

// Create implements POST /api/teachers.
func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	var body createInput
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid JSON body.", 400, nil))
		return
	}
	api.WriteResult(w, api.ServiceTry(func() (*store.Teacher, error) {
		if err := auth.AssertPermission(ctx, "teachers", auth.ActionCreate); err != nil {
			return nil, err
		}
		body.Email = strings.ToLower(strings.TrimSpace(body.Email))
		if body.Email == "" || body.FirstName == "" || body.Phone == "" {
			return nil, api.NewControlledError("VALIDATION_ERROR", "email, first_name and phone are required.", 400, nil)
		}
		if body.Password != "" && len(body.Password) < 6 {
			return nil, api.NewControlledError("VALIDATION_ERROR", "Password must be at least 6 characters.", 400, nil)
		}

		yearID := tenant.ResolveAcademicYearID(h.Store, ctx, "")

		h.Store.Lock()
		// Duplicate email check.
		for _, u := range h.Store.Users {
			if u.SchoolID == ctx.SchoolID && u.Email == body.Email {
				h.Store.Unlock()
				return nil, api.NewControlledError("DUPLICATE", "A user with this email already exists.", 400, nil)
			}
		}

		now := time.Now()

		// Optional companion User account so the teacher can sign in.
		var userID string
		if body.Password != "" {
			hash, err := auth.HashPassword(body.Password)
			if err != nil {
				h.Store.Unlock()
				return nil, err
			}
			userID = store.NewID("usr")
			h.Store.Users = append(h.Store.Users, &store.User{
				ID:           userID,
				SchoolID:     ctx.SchoolID,
				Email:        body.Email,
				PasswordHash: hash,
				Role:         "teacher",
				Permissions:  []string{},
				Profile: store.UserProfile{
					FirstName: body.FirstName,
					LastName:  body.LastName,
					Phone:     body.Phone,
				},
				Status:    "active",
				CreatedAt: now,
				UpdatedAt: now,
			})
			h.Persist("users", h.Store.Users[len(h.Store.Users)-1])
		}

		count := 0
		for _, t := range h.Store.Teachers {
			if t.SchoolID == ctx.SchoolID {
				count++
			}
		}
		empNo := "TCH-" + padLeft(count+1, 4)

		newTeacher := &store.Teacher{
			ID:             store.NewID("tch"),
			SchoolID:       ctx.SchoolID,
			AcademicYearID: yearID,
			UserID:         userID,
			Email:          body.Email,
			EmployeeNo:     empNo,
			FirstName:      body.FirstName,
			LastName:       body.LastName,
			Phone:          body.Phone,
			Qualification:  body.Qualification,
			SubjectIDs:     orEmpty(body.SubjectIDs),
			Subjects:       orEmpty(body.Subjects),
			ClassIDs:       orEmpty(body.ClassIDs),
			Status:         "active",
			JoinedAt:       now,
			CreatedAt:      now,
			UpdatedAt:      now,
		}
		h.Store.Teachers = append(h.Store.Teachers, newTeacher)

		// Backfill teacher_ids on the listed classes (mirrors the original
		// `ClassModel.updateMany ... $addToSet teacher_ids`).
		if len(body.ClassIDs) > 0 {
			classIDSet := map[string]bool{}
			for _, id := range body.ClassIDs {
				classIDSet[id] = true
			}
			for _, c := range h.Store.Classes {
				if c.SchoolID != ctx.SchoolID {
					continue
				}
				if classIDSet[c.ID] {
					if !contains(c.TeacherIDs, newTeacher.ID) {
						c.TeacherIDs = append(c.TeacherIDs, newTeacher.ID)
					}
				}
			}
		}
		h.Store.Unlock()

		h.Persist("teachers", newTeacher)
		// Save classes that were updated with teacher_ids
		if len(body.ClassIDs) > 0 {
			classIDSet := map[string]bool{}
			for _, id := range body.ClassIDs {
				classIDSet[id] = true
			}
			for _, c := range h.Store.Classes {
				if c.SchoolID == ctx.SchoolID && classIDSet[c.ID] {
					h.Persist("classes", c)
				}
			}
		}

		audit.Write(h.Store, ctx, audit.Input{
			Action: "create", EntityType: "teacher", EntityID: newTeacher.ID, After: newTeacher,
		})

		// Invalidate teachers list + dashboard caches so the new row shows
		// immediately on the next list/dashboard fetch.
		h.invalidateCaches(r.Context(), ctx.SchoolID, yearID)

		return newTeacher, nil
	}))
}

// Update implements PATCH /api/teachers/:id.
func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	id := chi.URLParam(r, "id")
	body := map[string]json.RawMessage{}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid JSON body.", 400, nil))
		return
	}
	api.WriteResult(w, api.ServiceTry(func() (*store.Teacher, error) {
		if err := auth.AssertPermission(ctx, "teachers", auth.ActionUpdate); err != nil {
			return nil, err
		}
		h.Store.Lock()
		defer h.Store.Unlock()
		for _, t := range h.Store.Teachers {
			if t.ID == id && t.SchoolID == ctx.SchoolID {
				before := *t
				if v, ok := body["first_name"]; ok {
					_ = json.Unmarshal(v, &t.FirstName)
				}
				if v, ok := body["last_name"]; ok {
					_ = json.Unmarshal(v, &t.LastName)
				}
				if v, ok := body["phone"]; ok {
					_ = json.Unmarshal(v, &t.Phone)
				}
				if v, ok := body["qualification"]; ok {
					_ = json.Unmarshal(v, &t.Qualification)
				}
				if v, ok := body["subject_ids"]; ok {
					_ = json.Unmarshal(v, &t.SubjectIDs)
				}
				if v, ok := body["subjects"]; ok {
					_ = json.Unmarshal(v, &t.Subjects)
				}
				if v, ok := body["class_ids"]; ok {
					_ = json.Unmarshal(v, &t.ClassIDs)
				}
				if v, ok := body["status"]; ok {
					_ = json.Unmarshal(v, &t.Status)
				}
				t.UpdatedAt = time.Now()
				h.Persist("teachers", t)

				// Capture identifying fields then invalidate outside the
				// store lock — DelPattern uses a network call.
				schoolID := t.SchoolID
				yearID := t.AcademicYearID
				snapshot := t

				audit.Write(h.Store, ctx, audit.Input{
					Action: "update", EntityType: "teacher", EntityID: id,
					Before: before, After: *t,
				})

				go h.invalidateCaches(context.Background(), schoolID, yearID)

				return snapshot, nil
			}
		}
		return nil, api.NewControlledError("NOT_FOUND", "Teacher not found.", 404, nil)
	}))
}

// Delete implements DELETE /api/teachers/:id.
func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	id := chi.URLParam(r, "id")
	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		if err := auth.AssertPermission(ctx, "teachers", auth.ActionDelete); err != nil {
			return nil, err
		}
		h.Store.Lock()
		defer h.Store.Unlock()
		for i, t := range h.Store.Teachers {
			if t.ID == id && t.SchoolID == ctx.SchoolID {
				before := *t
				// Pull from classes' teacher_ids.
				for _, c := range h.Store.Classes {
					if c.SchoolID != ctx.SchoolID {
						continue
					}
					filtered := c.TeacherIDs[:0]
					for _, tid := range c.TeacherIDs {
						if tid != id {
							filtered = append(filtered, tid)
						}
					}
					c.TeacherIDs = filtered
				}
				// Remove companion User account if present.
				if t.UserID != "" {
					for j, u := range h.Store.Users {
						if u.ID == t.UserID && u.SchoolID == ctx.SchoolID {
							h.Store.Users = append(h.Store.Users[:j], h.Store.Users[j+1:]...)
							break
						}
					}
				}
				h.Store.Teachers = append(h.Store.Teachers[:i], h.Store.Teachers[i+1:]...)

				h.Persist("teachers:delete", before.ID)
				if before.UserID != "" {
					h.Persist("users:delete", before.UserID)
				}
				// Save classes that were updated (teacher removed)
				for _, c := range h.Store.Classes {
					if c.SchoolID == ctx.SchoolID {
						found := false
						for _, tid := range before.ClassIDs {
							if tid == c.ID {
								found = true
								break
							}
						}
						if found {
							h.Persist("classes", c)
						}
					}
				}
				audit.Write(h.Store, ctx, audit.Input{
					Action: "delete", EntityType: "teacher", EntityID: id, Before: before,
				})

				go h.invalidateCaches(context.Background(), ctx.SchoolID, before.AcademicYearID)

				return map[string]any{"success": true, "id": id}, nil
			}
		}
		return nil, api.NewControlledError("NOT_FOUND", "Teacher not found.", 404, nil)
	}))
}

// ─── helpers ─────────────────────────────────────────────────────────────

func teacherMatchesSearch(t *store.Teacher, term string) bool {
	q := strings.ToLower(term)
	full := strings.ToLower(t.FirstName + " " + t.LastName)
	return strings.Contains(full, q) ||
		strings.Contains(strings.ToLower(t.Email), q) ||
		strings.Contains(strings.ToLower(t.EmployeeNo), q)
}

func contains(values []string, target string) bool {
	for _, v := range values {
		if v == target {
			return true
		}
	}
	return false
}

func padLeft(n, width int) string {
	s := ""
	for n > 0 {
		s = string(rune('0'+n%10)) + s
		n /= 10
	}
	for len(s) < width {
		s = "0" + s
	}
	return s
}

// orEmpty guarantees a non-nil slice so JSON encodes "[]" rather than
// "null". Frontend list pages call .slice / .map directly on these fields
// and would crash if they were undefined.
func orEmpty(in []string) []string {
	if in == nil {
		return []string{}
	}
	return in
}
