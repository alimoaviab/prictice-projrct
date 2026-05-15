// Package students implements /api/students endpoints. Mirrors
// old-app/shared/services/student.service.ts: list (with pagination, search,
// class+status filters), get, create, update, delete. Same projection
// fields, same admission-number generator, same audit-log writes.
//
// Performance architecture:
//   - List/Get: when a PG pool is provided, queries are served from
//     PostgreSQL with Redis caching (10 min TTL). Falls back to MemStore
//     scans when PG is unavailable.
//   - Create/Update/Delete: writes go to MemStore immediately and are
//     persisted to PG via the background snapshot queue. Each mutation
//     invalidates dashboard + composite + paginated list caches so
//     downstream views stay fresh.
package students

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

// Handler serves the /api/students/* routes.
type Handler struct {
	Store   *store.MemStore
	Persist func(table string, doc any)
	Pool    *pgxpool.Pool
	Cache   *cache.Client
	repo    *repo.StudentRepo
}

func New(s *store.MemStore, save func(string, any)) *Handler {
	if save == nil {
		save = func(string, any) {}
	}
	return &Handler{Store: s, Persist: save}
}

func NewPG(s *store.MemStore, save func(string, any), pool *pgxpool.Pool, c *cache.Client) *Handler {
	h := New(s, save)
	h.Pool = pool
	h.Cache = c
	if pool != nil {
		h.repo = repo.NewStudentRepo(pool, c)
	}
	return h
}

func (h *Handler) invalidateDashboardCaches(ctx context.Context, schoolID, yearID string) {
	if h.Cache == nil || !h.Cache.Available() {
		return
	}
	_, _ = h.Cache.Del(ctx,
		fmt.Sprintf("composite:%s:%s", schoolID, yearID),
		fmt.Sprintf("dash:%s:%s", schoolID, yearID),
	)
}

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	q := r.URL.Query()

	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		if err := auth.AssertPermission(ctx, "students", auth.ActionView); err != nil {
			return nil, err
		}

		yearID := tenant.ResolveAcademicYearID(h.Store, ctx, q.Get("academic_year_id"))
		classID := q.Get("class_id")
		status := q.Get("status")
		search := strings.TrimSpace(q.Get("search"))
		pagination := api.ParsePagination(q)

		if h.repo != nil && pagination.Enabled {
			items, total, err := h.repo.List(r.Context(), ctx.SchoolID, yearID, repo.ListOpts{
				Page:    pagination.Page,
				PerPage: pagination.Limit,
				Status:  status,
				ClassID: classID,
				Search:  search,
			})
			if err == nil {
				ptrs := make([]*store.Student, len(items))
				for i := range items {
					s := items[i]
					ptrs[i] = &s
				}
				return api.BuildPaginated(ptrs, total, pagination), nil
			}
		}

		h.Store.RLock()
		rows := make([]*store.Student, 0)
		for _, s := range h.Store.Students {
			if s.SchoolID != ctx.SchoolID {
				continue
			}
			if yearID != "" && s.AcademicYearID != yearID {
				continue
			}
			if classID != "" && s.ClassID != classID {
				continue
			}
			if status != "" && s.Status != status {
				continue
			}
			if search != "" && !studentMatchesSearch(s, search) {
				continue
			}
			rows = append(rows, s)
		}
		h.Store.RUnlock()

		sort.SliceStable(rows, func(i, j int) bool {
			if rows[i].FirstName == rows[j].FirstName {
				return rows[i].LastName < rows[j].LastName
			}
			return rows[i].FirstName < rows[j].FirstName
		})

		if !pagination.Enabled {
			return rows, nil
		}
		total := len(rows)
		start := pagination.Skip
		end := start + pagination.Limit
		if start > total {
			start = total
		}
		if end > total {
			end = total
		}
		return api.BuildPaginated(rows[start:end], total, pagination), nil
	}))
}

func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	id := chi.URLParam(r, "id")

	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		if err := auth.AssertPermission(ctx, "students", auth.ActionView); err != nil {
			return nil, err
		}

		targetID := id
		if id == "session" {
			h.Store.RLock()
			for _, s := range h.Store.Students {
				if s.UserID == ctx.UserID && s.SchoolID == ctx.SchoolID {
					h.Store.RUnlock()
					return s, nil
				}
			}
			h.Store.RUnlock()

			if h.repo != nil {
				if found, err := h.repo.GetByUserID(r.Context(), ctx.UserID, ctx.SchoolID); err == nil && found != nil {
					return found, nil
				}
			}
			return nil, api.NewControlledError("NOT_FOUND", "Student profile not found for this user.", 404, nil)
		}

		if h.repo != nil {
			if found, err := h.repo.GetByID(r.Context(), targetID, ctx.SchoolID); err == nil && found != nil {
				return found, nil
			}
		}

		h.Store.RLock()
		defer h.Store.RUnlock()
		for _, s := range h.Store.Students {
			if s.ID == targetID && s.SchoolID == ctx.SchoolID {
				return s, nil
			}
		}
		return nil, api.NewControlledError("NOT_FOUND", "Student not found.", 404, nil)
	}))
}

type createInput struct {
	AdmissionNo string          `json:"admission_no"`
	FirstName   string          `json:"first_name"`
	LastName    string          `json:"last_name"`
	ClassID     string          `json:"class_id"`
	Section     string          `json:"section"`
	Subjects    []string        `json:"subjects,omitempty"`
	Guardian    store.Guardian  `json:"guardian"`
	Email       string          `json:"email,omitempty"`
	Password    string          `json:"password,omitempty"`
	Status      string          `json:"status,omitempty"`
	RollNo      string          `json:"roll_no,omitempty"`
	DateOfBirth *time.Time      `json:"date_of_birth,omitempty"`
	Gender      string          `json:"gender,omitempty"`
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	var body createInput
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid JSON body.", 400, nil))
		return
	}

	api.WriteResult(w, api.ServiceTry(func() (*store.Student, error) {
		if err := auth.AssertPermission(ctx, "students", auth.ActionCreate); err != nil {
			return nil, err
		}
		if strings.TrimSpace(body.FirstName) == "" || strings.TrimSpace(body.LastName) == "" {
			return nil, api.NewControlledError("VALIDATION_ERROR", "first_name and last_name are required.", 400, nil)
		}
		if strings.TrimSpace(body.ClassID) == "" {
			return nil, api.NewControlledError("VALIDATION_ERROR", "class_id is required.", 400, nil)
		}
		if strings.TrimSpace(body.Section) == "" {
			return nil, api.NewControlledError("VALIDATION_ERROR", "section is required.", 400, nil)
		}
		if strings.TrimSpace(body.Guardian.Name) == "" || strings.TrimSpace(body.Guardian.Phone) == "" {
			return nil, api.NewControlledError("VALIDATION_ERROR", "guardian.name and guardian.phone are required.", 400, nil)
		}

		yearID := tenant.ResolveAcademicYearID(h.Store, ctx, "")
		if yearID == "" {
			return nil, api.NewControlledError("VALIDATION_ERROR", "No active academic year found for this school.", 400, nil)
		}

		if body.Email != "" {
			body.Email = strings.ToLower(strings.TrimSpace(body.Email))
			h.Store.RLock()
			for _, u := range h.Store.Users {
				if strings.EqualFold(u.Email, body.Email) {
					h.Store.RUnlock()
					return nil, api.NewControlledError("DUPLICATE", "This email is already registered in the system.", 400, nil)
				}
			}
			h.Store.RUnlock()
		}

		if body.AdmissionNo != "" {
			h.Store.RLock()
			for _, s := range h.Store.Students {
				if s.SchoolID == ctx.SchoolID && s.AdmissionNo == body.AdmissionNo {
					h.Store.RUnlock()
					return nil, api.NewControlledError("DUPLICATE", "Admission number already exists.", 400, nil)
				}
			}
			h.Store.RUnlock()
		}

		admission := body.AdmissionNo
		if admission == "" {
			admission = h.nextAdmissionNo(ctx.SchoolID)
		}

		now := time.Now()
		newStudent := &store.Student{
			ID:             store.NewID("stu"),
			SchoolID:       ctx.SchoolID,
			AcademicYearID: yearID,
			AdmissionNo:    admission,
			FirstName:      strings.TrimSpace(body.FirstName),
			LastName:       strings.TrimSpace(body.LastName),
			ClassID:        body.ClassID,
			Section:        body.Section,
			Subjects:       body.Subjects,
			Guardian:       body.Guardian,
			Status:         defaultStr(body.Status, "active"),
			RollNo:         body.RollNo,
			DateOfBirth:    body.DateOfBirth,
			Gender:         body.Gender,
			EnrolledAt:     now,
			CreatedAt:      now,
			UpdatedAt:      now,
		}

		h.Store.Lock()
		h.Store.Students = append(h.Store.Students, newStudent)
		h.Store.Unlock()

		h.Persist("students", newStudent)

		if h.Cache != nil && h.Cache.Available() {
			_, _ = h.Cache.DelPattern(r.Context(), fmt.Sprintf("students:%s:%s:*", ctx.SchoolID, yearID))
		}
		h.invalidateDashboardCaches(r.Context(), ctx.SchoolID, yearID)

		audit.Write(h.Store, ctx, audit.Input{
			Action: "create", EntityType: "student", EntityID: newStudent.ID, After: newStudent,
		})
		return newStudent, nil
	}))
}

type updateInput struct {
	FirstName *string         `json:"first_name,omitempty"`
	LastName  *string         `json:"last_name,omitempty"`
	ClassID   *string         `json:"class_id,omitempty"`
	Section   *string         `json:"section,omitempty"`
	Subjects  *[]string       `json:"subjects,omitempty"`
	Guardian  *store.Guardian `json:"guardian,omitempty"`
	Status    *string         `json:"status,omitempty"`
	RollNo    *string         `json:"roll_no,omitempty"`
	Gender    *string         `json:"gender,omitempty"`
}

func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	id := chi.URLParam(r, "id")
	var body updateInput
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid JSON body.", 400, nil))
		return
	}

	api.WriteResult(w, api.ServiceTry(func() (*store.Student, error) {
		if err := auth.AssertPermission(ctx, "students", auth.ActionUpdate); err != nil {
			return nil, err
		}

		h.Store.Lock()
		defer h.Store.Unlock()

		var target *store.Student
		for _, s := range h.Store.Students {
			if s.ID == id && s.SchoolID == ctx.SchoolID {
				target = s
				break
			}
		}
		if target == nil {
			return nil, api.NewControlledError("NOT_FOUND", "Student not found.", 404, nil)
		}

		before := *target
		if body.FirstName != nil {
			target.FirstName = *body.FirstName
		}
		if body.LastName != nil {
			target.LastName = *body.LastName
		}
		if body.ClassID != nil {
			target.ClassID = *body.ClassID
		}
		if body.Section != nil {
			target.Section = *body.Section
		}
		if body.Subjects != nil {
			target.Subjects = *body.Subjects
		}
		if body.Guardian != nil {
			target.Guardian = *body.Guardian
		}
		if body.Status != nil {
			target.Status = *body.Status
		}
		if body.RollNo != nil {
			target.RollNo = *body.RollNo
		}
		if body.Gender != nil {
			target.Gender = *body.Gender
		}
		target.UpdatedAt = time.Now()

		h.Persist("students", target)

		schoolID := target.SchoolID
		yearID := target.AcademicYearID
		studentID := target.ID
		if h.Cache != nil && h.Cache.Available() {
			_, _ = h.Cache.DelPattern(r.Context(), fmt.Sprintf("students:%s:%s:*", schoolID, yearID))
			_, _ = h.Cache.Del(r.Context(), fmt.Sprintf("student:%s:%s", schoolID, studentID))
		}
		h.invalidateDashboardCaches(r.Context(), schoolID, yearID)

		audit.Write(h.Store, ctx, audit.Input{
			Action: "update", EntityType: "student", EntityID: id, Before: before, After: *target,
		})
		return target, nil
	}))
}

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	id := chi.URLParam(r, "id")
	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		if err := auth.AssertPermission(ctx, "students", auth.ActionDelete); err != nil {
			return nil, err
		}

		h.Store.Lock()
		defer h.Store.Unlock()
		for i, s := range h.Store.Students {
			if s.ID == id && s.SchoolID == ctx.SchoolID {
				before := *s
				h.Store.Students = append(h.Store.Students[:i], h.Store.Students[i+1:]...)
				h.Persist("students:delete", before.ID)

				if h.Cache != nil && h.Cache.Available() {
					_, _ = h.Cache.DelPattern(r.Context(), fmt.Sprintf("students:%s:%s:*", ctx.SchoolID, before.AcademicYearID))
					_, _ = h.Cache.Del(r.Context(), fmt.Sprintf("student:%s:%s", ctx.SchoolID, before.ID))
				}
				h.invalidateDashboardCaches(r.Context(), ctx.SchoolID, before.AcademicYearID)

				audit.Write(h.Store, ctx, audit.Input{
					Action: "delete", EntityType: "student", EntityID: id, Before: before,
				})
				return map[string]any{"success": true, "id": id}, nil
			}
		}
		return nil, api.NewControlledError("NOT_FOUND", "Student not found.", 404, nil)
	}))
}

func studentMatchesSearch(s *store.Student, term string) bool {
	t := strings.ToLower(term)
	full := strings.ToLower(s.FirstName + " " + s.LastName)
	return strings.Contains(full, t) || strings.Contains(strings.ToLower(s.AdmissionNo), t)
}

func (h *Handler) nextAdmissionNo(schoolID string) string {
	h.Store.RLock()
	defer h.Store.RUnlock()
	count := 0
	for _, s := range h.Store.Students {
		if s.SchoolID == schoolID {
			count++
		}
	}
	return "STU-" + padLeft(count+1, 5)
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

func defaultStr(v, fallback string) string {
	if strings.TrimSpace(v) == "" {
		return fallback
	}
	return v
}
