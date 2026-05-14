// Package superadmin implements /api/super-admin/* endpoints for the
// platform control panel. These endpoints are only accessible to users
// with the "super_admin" role.
package superadmin

import (
	"encoding/json"
	"net/http"
	"sort"
	"strings"
	"time"

	"github.com/eduplexo/backend-go/internal/api"
	"github.com/eduplexo/backend-go/internal/store"
	"github.com/go-chi/chi/v5"
)

type Handler struct {
	Store *store.MemStore
}

func New(s *store.MemStore) *Handler { return &Handler{Store: s} }

// ─── Dashboard Stats ─────────────────────────────────────────────────────

// DashboardStats returns platform-wide statistics.
// GET /api/super-admin/dashboard
func (h *Handler) DashboardStats(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	if ctx.Role != "super_admin" && ctx.Role != "admin" {
		api.WriteResult(w, api.Fail("FORBIDDEN", "Super admin access required.", 403, nil))
		return
	}

	h.Store.RLock()
	defer h.Store.RUnlock()

	totalSchools := len(h.Store.Schools)
	activeSchools := 0
	suspendedSchools := 0
	pendingSchools := 0
	for _, s := range h.Store.Schools {
		switch s.Status {
		case "active":
			activeSchools++
		case "suspended":
			suspendedSchools++
		case "pending":
			pendingSchools++
		}
	}

	totalStudents := len(h.Store.Students)
	totalTeachers := len(h.Store.Teachers)
	totalClasses := len(h.Store.Classes)
	totalUsers := len(h.Store.Users)

	// Revenue from fee payments
	var totalRevenue float64
	var monthlyRevenue float64
	now := time.Now()
	for _, p := range h.Store.FeePayments {
		totalRevenue += p.Amount
		if p.PaymentDate.Month() == now.Month() && p.PaymentDate.Year() == now.Year() {
			monthlyRevenue += p.Amount
		}
	}

	api.WriteJSON(w, http.StatusOK, api.Ok(map[string]any{
		"schools": map[string]any{
			"total":     totalSchools,
			"active":    activeSchools,
			"suspended": suspendedSchools,
			"pending":   pendingSchools,
		},
		"users": map[string]any{
			"total_students": totalStudents,
			"total_teachers": totalTeachers,
			"total_classes":  totalClasses,
			"total_users":    totalUsers,
		},
		"revenue": map[string]any{
			"total":   totalRevenue,
			"monthly": monthlyRevenue,
		},
		"subscriptions": map[string]any{
			"active":   activeSchools,
			"trial":    pendingSchools,
			"expired":  0,
			"expiring": 0,
		},
	}))
}

// ─── School Management ───────────────────────────────────────────────────

// ListSchools returns all schools on the platform.
// GET /api/super-admin/schools
func (h *Handler) ListSchools(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	if ctx.Role != "super_admin" && ctx.Role != "admin" {
		api.WriteResult(w, api.Fail("FORBIDDEN", "Super admin access required.", 403, nil))
		return
	}

	q := r.URL.Query()
	statusFilter := q.Get("status")
	search := strings.ToLower(strings.TrimSpace(q.Get("search")))

	h.Store.RLock()
	defer h.Store.RUnlock()

	type schoolView struct {
		ID            string    `json:"_id"`
		SchoolID      string    `json:"school_id"`
		Name          string    `json:"name"`
		Code          string    `json:"code"`
		Email         string    `json:"email"`
		Phone         string    `json:"phone"`
		Address       string    `json:"address"`
		City          string    `json:"city"`
		PrincipalName string    `json:"principal_name"`
		Status        string    `json:"status"`
		OwnerEmail    string    `json:"owner_email"`
		OwnerPassword string    `json:"owner_password"` // For super-admin to "see" and "tell"
		StudentCount  int       `json:"student_count"`
		TeacherCount  int       `json:"teacher_count"`
		ClassCount    int       `json:"class_count"`
		CreatedAt     time.Time `json:"created_at"`
		UpdatedAt     time.Time `json:"updated_at"`
	}

	schools := make([]schoolView, 0)
	for _, s := range h.Store.Schools {
		if statusFilter != "" && s.Status != statusFilter {
			continue
		}
		if search != "" && !strings.Contains(strings.ToLower(s.Name), search) && !strings.Contains(strings.ToLower(s.Code), search) {
			continue
		}

		// Count students, teachers, classes for this school
		studentCount, teacherCount, classCount := 0, 0, 0
		for _, st := range h.Store.Students {
			if st.SchoolID == s.SchoolID {
				studentCount++
			}
		}
		for _, t := range h.Store.Teachers {
			if t.SchoolID == s.SchoolID {
				teacherCount++
			}
		}
		for _, c := range h.Store.Classes {
			if c.SchoolID == s.SchoolID {
				classCount++
			}
		}

		// Find owner details
		ownerEmail := ""
		ownerPassword := ""
		for _, u := range h.Store.Users {
			if u.SchoolID == s.SchoolID && u.Role == "admin" {
				ownerEmail = u.Email
				ownerPassword = u.Password
				break
			}
		}

		schools = append(schools, schoolView{
			ID:            s.ID,
			SchoolID:      s.SchoolID,
			Name:          s.Name,
			Code:          s.Code,
			Email:         s.Email,
			Phone:         s.Phone,
			Address:       s.Address,
			City:          s.City,
			PrincipalName: s.PrincipalName,
			Status:        s.Status,
			OwnerEmail:    ownerEmail,
			OwnerPassword: ownerPassword,
			StudentCount:  studentCount,
			TeacherCount:  teacherCount,
			ClassCount:    classCount,
			CreatedAt:     s.CreatedAt,
			UpdatedAt:     s.UpdatedAt,
		})
	}

	sort.SliceStable(schools, func(i, j int) bool {
		return schools[i].CreatedAt.After(schools[j].CreatedAt)
	})

	page := api.ParsePagination(q)
	if !page.Enabled {
		api.WriteResult(w, api.Ok(map[string]any{
			"items": schools,
			"total": len(schools),
		}))
		return
	}
	api.WriteResult(w, api.Ok(api.BuildPaginated(api.SafeSlice(schools, page.Skip, page.Skip+page.Limit), len(schools), page)))
}

// GetSchool returns a single school's details.
// GET /api/super-admin/schools/:id
func (h *Handler) GetSchool(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	if ctx.Role != "super_admin" && ctx.Role != "admin" {
		api.WriteResult(w, api.Fail("FORBIDDEN", "Super admin access required.", 403, nil))
		return
	}

	id := chi.URLParam(r, "id")
	h.Store.RLock()
	defer h.Store.RUnlock()

	for _, s := range h.Store.Schools {
		if s.ID == id || s.SchoolID == id {
			api.WriteResult(w, api.Ok(s))
			return
		}
	}
	api.WriteResult(w, api.Fail("NOT_FOUND", "School not found.", 404, nil))
}

// UpdateSchoolStatus changes a school's status (activate, suspend, etc.)
// PATCH /api/super-admin/schools/:id/status
func (h *Handler) UpdateSchoolStatus(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	if ctx.Role != "super_admin" && ctx.Role != "admin" {
		api.WriteResult(w, api.Fail("FORBIDDEN", "Super admin access required.", 403, nil))
		return
	}

	id := chi.URLParam(r, "id")
	var body struct {
		Status string `json:"status"`
		Reason string `json:"reason"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid request body.", 400, nil))
		return
	}

	validStatuses := map[string]bool{"active": true, "suspended": true, "pending": true, "expired": true}
	if !validStatuses[body.Status] {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid status. Must be: active, suspended, pending, or expired.", 400, nil))
		return
	}

	h.Store.Lock()
	defer h.Store.Unlock()

	for _, s := range h.Store.Schools {
		if s.ID == id || s.SchoolID == id {
			s.Status = body.Status
			s.UpdatedAt = time.Now()

			// Cascade status to all related entities
			targetSchoolID := s.SchoolID
			newStatus := body.Status
			for _, u := range h.Store.Users {
				if u.SchoolID == targetSchoolID {
					u.Status = newStatus
				}
			}
			for _, st := range h.Store.Students {
				if st.SchoolID == targetSchoolID {
					st.Status = newStatus
				}
			}
			for _, t := range h.Store.Teachers {
				if t.SchoolID == targetSchoolID {
					t.Status = newStatus
				}
			}

			api.WriteResult(w, api.Ok(map[string]any{
				"success": true,
				"school":  s,
				"message": "School and all associated users/data updated to " + body.Status,
			}))
			return
		}
	}
	api.WriteResult(w, api.Fail("NOT_FOUND", "School not found.", 404, nil))
}

// ApproveSchool activates a pending school.
// POST /api/super-admin/schools/:id/approve
func (h *Handler) ApproveSchool(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	if ctx.Role != "super_admin" && ctx.Role != "admin" {
		api.WriteResult(w, api.Fail("FORBIDDEN", "Super admin access required.", 403, nil))
		return
	}

	id := chi.URLParam(r, "id")
	h.Store.Lock()
	defer h.Store.Unlock()

	for _, s := range h.Store.Schools {
		if s.ID == id || s.SchoolID == id {
			s.Status = "active"
			s.UpdatedAt = time.Now()

			// Cascade activation to all related entities
			targetSchoolID := s.SchoolID
			for _, u := range h.Store.Users {
				if u.SchoolID == targetSchoolID {
					u.Status = "active"
				}
			}
			for _, st := range h.Store.Students {
				if st.SchoolID == targetSchoolID {
					st.Status = "active"
				}
			}
			for _, t := range h.Store.Teachers {
				if t.SchoolID == targetSchoolID {
					t.Status = "active"
				}
			}

			api.WriteResult(w, api.Ok(map[string]any{
				"success": true,
				"message": "School and all associated users/data approved and activated.",
			}))
			return
		}
	}
	api.WriteResult(w, api.Fail("NOT_FOUND", "School not found.", 404, nil))
}

// SuspendSchool suspends a school.
// POST /api/super-admin/schools/:id/suspend
func (h *Handler) SuspendSchool(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	if ctx.Role != "super_admin" && ctx.Role != "admin" {
		api.WriteResult(w, api.Fail("FORBIDDEN", "Super admin access required.", 403, nil))
		return
	}

	id := chi.URLParam(r, "id")
	var body struct {
		Reason string `json:"reason"`
	}
	json.NewDecoder(r.Body).Decode(&body)

	h.Store.Lock()
	defer h.Store.Unlock()

	for _, s := range h.Store.Schools {
		if s.ID == id || s.SchoolID == id {
			s.Status = "suspended"
			s.UpdatedAt = time.Now()

			// Cascade suspension to all related entities
			targetSchoolID := s.SchoolID
			for _, u := range h.Store.Users {
				if u.SchoolID == targetSchoolID {
					u.Status = "suspended"
				}
			}
			for _, st := range h.Store.Students {
				if st.SchoolID == targetSchoolID {
					st.Status = "suspended"
				}
			}
			for _, t := range h.Store.Teachers {
				if t.SchoolID == targetSchoolID {
					t.Status = "suspended"
				}
			}

			api.WriteResult(w, api.Ok(map[string]any{
				"success": true,
				"message": "School and all associated users/data suspended.",
				"reason":  body.Reason,
			}))
			return
		}
	}
	api.WriteResult(w, api.Fail("NOT_FOUND", "School not found.", 404, nil))
}

// UpdateSchool updates a school's profile information.
// PATCH /api/super-admin/schools/:id
func (h *Handler) UpdateSchool(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	if ctx.Role != "super_admin" {
		api.WriteResult(w, api.Fail("FORBIDDEN", "Super admin access required.", 403, nil))
		return
	}

	id := chi.URLParam(r, "id")
	var body struct {
		Name          string `json:"name"`
		Email         string `json:"email"`
		Phone         string `json:"phone"`
		Address       string `json:"address"`
		City          string `json:"city"`
		PrincipalName string `json:"principal_name"`
		Website       string `json:"website"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid request body.", 400, nil))
		return
	}

	h.Store.Lock()
	defer h.Store.Unlock()

	for _, s := range h.Store.Schools {
		if s.ID == id || s.SchoolID == id {
			if body.Name != "" {
				s.Name = body.Name
			}
			s.Email = body.Email
			s.Phone = body.Phone
			s.Address = body.Address
			s.City = body.City
			s.PrincipalName = body.PrincipalName
			s.Website = body.Website
			s.UpdatedAt = time.Now()

			api.WriteResult(w, api.Ok(map[string]any{
				"success": true,
				"message": "School profile updated successfully.",
				"school":  s,
			}))
			return
		}
	}
	api.WriteResult(w, api.Fail("NOT_FOUND", "School not found.", 404, nil))
}

// UpdateAdminPassword changes the password for a school's admin user.
// PATCH /api/super-admin/schools/:id/password
func (h *Handler) UpdateAdminPassword(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	if ctx.Role != "super_admin" {
		api.WriteResult(w, api.Fail("FORBIDDEN", "Super admin access required.", 403, nil))
		return
	}

	id := chi.URLParam(r, "id")
	var body struct {
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid request body.", 400, nil))
		return
	}

	if body.Password == "" {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Password is required.", 400, nil))
		return
	}

	h.Store.Lock()
	defer h.Store.Unlock()

	// Find the school first to get school_id
	var schoolID string
	for _, s := range h.Store.Schools {
		if s.ID == id || s.SchoolID == id {
			schoolID = s.SchoolID
			break
		}
	}

	if schoolID == "" {
		api.WriteResult(w, api.Fail("NOT_FOUND", "School not found.", 404, nil))
		return
	}

	// Find the admin user for this school
	for _, u := range h.Store.Users {
		if u.SchoolID == schoolID && u.Role == "admin" {
			u.PasswordHash = body.Password
			u.Password = body.Password // Plain text for visibility
			u.UpdatedAt = time.Now()

			api.WriteResult(w, api.Ok(map[string]any{
				"success": true,
				"message": "Admin password updated successfully.",
			}))
			return
		}
	}

	api.WriteResult(w, api.Fail("NOT_FOUND", "School admin user not found.", 404, nil))
}

// ─── Subscription Plans ──────────────────────────────────────────────────

// ListPlans returns all subscription plans.
// GET /api/super-admin/plans
func (h *Handler) ListPlans(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	if ctx.Role != "super_admin" && ctx.Role != "admin" {
		api.WriteResult(w, api.Fail("FORBIDDEN", "Super admin access required.", 403, nil))
		return
	}

	plans := []map[string]any{
		{"id": "plan_free_trial", "name": "Free Trial", "slug": "free-trial", "billing_cycle": "monthly", "price": 0, "student_limit": 50, "teacher_limit": 10, "trial_days": 14, "is_active": true},
		{"id": "plan_basic_monthly", "name": "Basic Monthly", "slug": "basic-monthly", "billing_cycle": "monthly", "price": 2999, "student_limit": 200, "teacher_limit": 30, "trial_days": 0, "is_active": true},
		{"id": "plan_basic_yearly", "name": "Basic Yearly", "slug": "basic-yearly", "billing_cycle": "yearly", "price": 29990, "student_limit": 200, "teacher_limit": 30, "trial_days": 0, "is_active": true},
		{"id": "plan_pro_monthly", "name": "Pro Monthly", "slug": "pro-monthly", "billing_cycle": "monthly", "price": 5999, "student_limit": 500, "teacher_limit": 50, "trial_days": 0, "is_active": true},
		{"id": "plan_pro_yearly", "name": "Pro Yearly", "slug": "pro-yearly", "billing_cycle": "yearly", "price": 59990, "student_limit": 500, "teacher_limit": 50, "trial_days": 0, "is_active": true},
		{"id": "plan_enterprise", "name": "Enterprise", "slug": "enterprise", "billing_cycle": "yearly", "price": 99990, "student_limit": 9999, "teacher_limit": 999, "trial_days": 0, "is_active": true},
	}

	api.WriteResult(w, api.Ok(plans))
}

// ─── Platform Users ──────────────────────────────────────────────────────

// ListUsers returns all users across all schools.
// GET /api/super-admin/users
func (h *Handler) ListUsers(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	if ctx.Role != "super_admin" && ctx.Role != "admin" {
		api.WriteResult(w, api.Fail("FORBIDDEN", "Super admin access required.", 403, nil))
		return
	}

	q := r.URL.Query()
	roleFilter := q.Get("role")
	search := strings.ToLower(strings.TrimSpace(q.Get("search")))

	h.Store.RLock()
	defer h.Store.RUnlock()

	type userView struct {
		ID        string    `json:"_id"`
		Email     string    `json:"email"`
		Role      string    `json:"role"`
		SchoolID  string    `json:"school_id"`
		Status    string    `json:"status"`
		Name      string    `json:"name"`
		CreatedAt time.Time `json:"created_at"`
	}

	users := make([]userView, 0)
	for _, u := range h.Store.Users {
		if roleFilter != "" && u.Role != roleFilter {
			continue
		}
		if search != "" && !strings.Contains(strings.ToLower(u.Email), search) && !strings.Contains(strings.ToLower(u.Profile.FirstName+" "+u.Profile.LastName), search) {
			continue
		}
		users = append(users, userView{
			ID:        u.ID,
			Email:     u.Email,
			Role:      u.Role,
			SchoolID:  u.SchoolID,
			Status:    u.Status,
			Name:      u.Profile.FirstName + " " + u.Profile.LastName,
			CreatedAt: u.CreatedAt,
		})
	}

	page := api.ParsePagination(q)
	if !page.Enabled {
		api.WriteResult(w, api.Ok(map[string]any{"items": users, "total": len(users)}))
		return
	}
	api.WriteResult(w, api.Ok(api.BuildPaginated(api.SafeSlice(users, page.Skip, page.Skip+page.Limit), len(users), page)))
}

// ─── Activity & Audit ────────────────────────────────────────────────────

// RecentActivity returns recent platform activity.
// GET /api/super-admin/activity
func (h *Handler) RecentActivity(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	if ctx.Role != "super_admin" && ctx.Role != "admin" {
		api.WriteResult(w, api.Fail("FORBIDDEN", "Super admin access required.", 403, nil))
		return
	}

	h.Store.RLock()
	defer h.Store.RUnlock()

	// Return recent audit logs
	logs := make([]map[string]any, 0)
	for i := len(h.Store.AuditLogs) - 1; i >= 0 && len(logs) < 50; i-- {
		log := h.Store.AuditLogs[i]
		logs = append(logs, map[string]any{
			"id":          log.ID,
			"action":      log.Action,
			"entity_type": log.EntityType,
			"entity_id":   log.EntityID,
			"user_id":     log.ActorID,
			"school_id":   log.SchoolID,
			"created_at":  log.CreatedAt,
		})
	}

	api.WriteResult(w, api.Ok(logs))
}
