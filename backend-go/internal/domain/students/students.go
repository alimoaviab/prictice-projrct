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
	Store        *store.MemStore
	Persist      func(table string, doc any)
	Pool         *pgxpool.Pool
	Cache        *cache.Client
	repo         *repo.StudentRepo
	LimitChecker func(ctx context.Context, schoolID string) error // Subscription limit check
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
			// If we got results, or we are on a page > 1, or there was a real error, use PG.
			// But if page 1 is empty, we fall through to MemStore to catch unpersisted new items.
			if err == nil && (len(items) > 0 || pagination.Page > 1) {
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
	// When the admin clicks "Link Student to this Parent" on the form,
	// the frontend sends the existing parent's user_id here. We then
	// skip the duplicate-email error and write a StudentParents link
	// against the existing user instead of creating a new one.
	LinkParentUserID string     `json:"link_parent_user_id,omitempty"`
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

		// ─── Subscription student limit check ────────────────────────────
		if h.LimitChecker != nil {
			if err := h.LimitChecker(r.Context(), ctx.SchoolID); err != nil {
				return nil, err
			}
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
		}

		// Resolve which parent user this student should be linked to.
		// Three cases:
		//   1. link_parent_user_id is set → admin explicitly chose to
		//      link to an existing parent. Verify it belongs to this
		//      school and has role=parent.
		//   2. email matches an existing parent user in this school →
		//      treat as auto-link (don't error like before, just link).
		//   3. email matches a user with a DIFFERENT role (admin /
		//      teacher / student) → reject so we don't conflate
		//      identities across roles.
		// In all cases the link is recorded via store.StudentParents
		// after the student row is inserted, so /api/parent/children
		// returns the linked student.
		var linkedParentUser *store.User
		if body.LinkParentUserID != "" {
			h.Store.RLock()
			for _, u := range h.Store.Users {
				if u.ID == body.LinkParentUserID && u.SchoolID == ctx.SchoolID {
					linkedParentUser = u
					break
				}
			}
			h.Store.RUnlock()
			if linkedParentUser == nil {
				return nil, api.NewControlledError("NOT_FOUND", "Parent account to link not found in this school.", 404, nil)
			}
			if linkedParentUser.Role != "parent" {
				return nil, api.NewControlledError("VALIDATION_ERROR", "The selected account is not a parent and cannot be linked.", 400, nil)
			}
		} else if body.Email != "" {
			h.Store.RLock()
			for _, u := range h.Store.Users {
				if !strings.EqualFold(u.Email, body.Email) {
					continue
				}
				// Cross-tenant email collisions are not our concern —
				// users live per-school.
				if u.SchoolID != ctx.SchoolID {
					continue
				}
				if u.Role != "parent" {
					h.Store.RUnlock()
					return nil, api.NewControlledError("DUPLICATE", "This email is already registered as "+u.Role+" and cannot be reused for a parent account.", 400, nil)
				}
				linkedParentUser = u
				break
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

		// Parent provisioning + linkage. Done while we already hold the
		// write lock so the linked-children list is consistent with the
		// student row we just inserted.
		var parentUserID string
		if linkedParentUser != nil {
			// Case (1)/(2) — link to existing parent user.
			parentUserID = linkedParentUser.ID
		} else if body.Email != "" && body.Password != "" {
			// Case (3) — first child: create a fresh parent user account.
			hash, err := auth.HashPassword(body.Password)
			if err != nil {
				h.Store.Unlock()
				return nil, api.NewControlledError("INTERNAL", "Failed to hash parent password.", 500, nil)
			}
			parentUserID = store.NewID("usr")
			parentUser := &store.User{
				ID:           parentUserID,
				SchoolID:     ctx.SchoolID,
				Email:        body.Email,
				PasswordHash: hash,
				Role:         "parent",
				Status:       "active",
				Profile: store.UserProfile{
					FirstName: firstNameOf(body.Guardian.Name),
					LastName:  lastNameOf(body.Guardian.Name),
					Phone:     body.Guardian.Phone,
				},
				CreatedAt: now,
				UpdatedAt: now,
			}
			h.Store.Users = append(h.Store.Users, parentUser)
			h.Persist("users", parentUser)
		}

		var parentLink *store.StudentParent
		if parentUserID != "" {
			parentLink = &store.StudentParent{
				ID:           store.NewID("spr"),
				SchoolID:     ctx.SchoolID,
				StudentID:    newStudent.ID,
				ParentUserID: parentUserID,
				Relationship: defaultStr(body.Guardian.Name, "guardian"),
				IsPrimary:    true,
				CreatedAt:    now,
			}
			h.Store.StudentParents = append(h.Store.StudentParents, parentLink)
		}
		h.Store.Unlock()

		h.Persist("students", newStudent)
		if parentLink != nil {
			h.Persist("student_parents", parentLink)
		}

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

// firstNameOf splits a free-form guardian name into a best-effort first
// name. Provisioning a parent user from the student form must populate
// User.Profile so the parent portal greeting renders correctly; we
// don't get a separate first/last field, so we split by the first
// whitespace token.
func firstNameOf(full string) string {
	full = strings.TrimSpace(full)
	if full == "" {
		return ""
	}
	if idx := strings.IndexAny(full, " \t"); idx > 0 {
		return full[:idx]
	}
	return full
}

// lastNameOf returns everything after the first whitespace token, or an
// empty string when the name is single-word.
func lastNameOf(full string) string {
	full = strings.TrimSpace(full)
	idx := strings.IndexAny(full, " \t")
	if idx <= 0 || idx >= len(full)-1 {
		return ""
	}
	return strings.TrimSpace(full[idx+1:])
}

// ─── Parent email lookup ─────────────────────────────────────────────
//
// The student create form posts to /api/parents/check-email when the
// admin types/blurs the parent email. The response decides whether the
// form shows the "link to existing parent" inline card. We expose the
// handler from this package because parent linkage is a student-side
// concern (the link lives on the student row) and we already have the
// MemStore wired in.

type checkEmailInput struct {
	Email string `json:"email"`
}

// CheckParentEmail implements POST /api/parents/check-email. The reply
// shape matches what StudentForm.tsx expects:
//
//	{ exists: bool, parent: { _id, name, email, phone, children_count,
//	                          existing_role, role_mismatch } }
//
// `role_mismatch=true` is set when the email is registered to a non-
// parent role (admin/teacher/student); the form refuses to link in
// that case so identities don't get collapsed across roles.
func (h *Handler) CheckParentEmail(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)

	// Accept body on POST; query string on GET. Both work the same so
	// we don't lock the route into a particular verb.
	var email string
	if r.Method == http.MethodPost {
		var body checkEmailInput
		_ = json.NewDecoder(r.Body).Decode(&body)
		email = body.Email
	} else {
		email = r.URL.Query().Get("email")
	}
	email = strings.ToLower(strings.TrimSpace(email))

	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		// Admins and teachers can resolve. We don't gate strictly via
		// AssertPermission on a feature key because there isn't a
		// dedicated "parents" permission; the route already sits behind
		// the school middleware which enforces tenant isolation.
		if ctx.UserID == "" {
			return nil, api.NewControlledError("UNAUTHENTICATED", "Authentication required.", 401, nil)
		}
		if email == "" || !strings.Contains(email, "@") {
			return map[string]any{"exists": false}, nil
		}

		h.Store.RLock()
		defer h.Store.RUnlock()

		// 1) Try users in the same school first.
		var matchedUser *store.User
		for _, u := range h.Store.Users {
			if u.SchoolID != ctx.SchoolID {
				continue
			}
			if strings.EqualFold(u.Email, email) {
				matchedUser = u
				break
			}
		}

		// 2) If we didn't find a user, check student rows whose
		//    guardian.email matches — useful when a previous create
		//    captured the email but never provisioned a user (e.g.
		//    legacy data created before this handler existed).
		if matchedUser == nil {
			var sibling *store.Student
			for _, s := range h.Store.Students {
				if s.SchoolID != ctx.SchoolID {
					continue
				}
				if strings.EqualFold(s.Guardian.Email, email) {
					sibling = s
					break
				}
			}
			if sibling == nil {
				return map[string]any{"exists": false}, nil
			}
			// Synthesize a parent payload from the existing student's
			// guardian. Linking will create a fresh parent user when
			// the admin clicks the button — handled in Create.
			return map[string]any{
				"exists": true,
				"parent": map[string]any{
					"_id":            "",
					"name":           sibling.Guardian.Name,
					"email":          sibling.Guardian.Email,
					"phone":          sibling.Guardian.Phone,
					"children_count": h.countChildrenByEmail(ctx.SchoolID, email),
					"existing_role":  "parent",
					"role_mismatch":  false,
				},
			}, nil
		}

		role := matchedUser.Role
		mismatch := role != "parent"

		fullName := strings.TrimSpace(matchedUser.Profile.FirstName + " " + matchedUser.Profile.LastName)
		if fullName == "" {
			fullName = email
		}

		// Count children only for an actual parent user. For a role
		// mismatch the count is meaningless and we hide it.
		children := 0
		if !mismatch {
			children = h.countChildrenByParentUser(ctx.SchoolID, matchedUser.ID)
		}

		return map[string]any{
			"exists": true,
			"parent": map[string]any{
				"_id":            matchedUser.ID,
				"name":           fullName,
				"email":          matchedUser.Email,
				"phone":          matchedUser.Profile.Phone,
				"children_count": children,
				"existing_role":  role,
				"role_mismatch":  mismatch,
			},
		}, nil
	}))
}

// countChildrenByParentUser counts active student↔parent links for a
// given parent user inside the same school. Caller must already hold
// the read lock.
func (h *Handler) countChildrenByParentUser(schoolID, parentUserID string) int {
	count := 0
	for _, link := range h.Store.StudentParents {
		if link.SchoolID == schoolID && link.ParentUserID == parentUserID {
			count++
		}
	}
	return count
}

// countChildrenByEmail handles the legacy data path where a parent
// account hasn't been provisioned yet but multiple student rows share
// the same guardian email. Caller must already hold the read lock.
func (h *Handler) countChildrenByEmail(schoolID, email string) int {
	count := 0
	for _, s := range h.Store.Students {
		if s.SchoolID == schoolID && strings.EqualFold(s.Guardian.Email, email) {
			count++
		}
	}
	return count
}
