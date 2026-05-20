// Package superadmin implements /api/super-admin/* endpoints for the
// platform control panel. These endpoints are only accessible to users
// with the "super_admin" role.
package superadmin

import (
	"encoding/json"
	"net/http"
	"sort"
	"strconv"
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

// ─── Enterprise Dashboard Stats ──────────────────────────────────────────

// DashboardStats returns comprehensive platform-wide statistics.
// GET /api/super-admin/dashboard
func (h *Handler) DashboardStats(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	if ctx == nil || (ctx.Role != "super_admin" && ctx.Role != "admin") {
		api.WriteResult(w, api.Fail("FORBIDDEN", "Super admin access required.", 403, nil))
		return
	}

	h.Store.RLock()
	defer h.Store.RUnlock()

	now := time.Now()
	currentMonth := now.Month()
	currentYear := now.Year()
	lastMonth := currentMonth - 1
	lastMonthYear := currentYear
	if lastMonth == 0 {
		lastMonth = 12
		lastMonthYear--
	}

	// ── School Metrics ───────────────────────────────────────────────────
	totalSchools := len(h.Store.Schools)
	activeSchools, suspendedSchools, pendingSchools, expiredSchools, trialSchools, paidSchools := 0, 0, 0, 0, 0, 0
	thisMonthNew := 0
	lastMonthNew := 0

	for _, s := range h.Store.Schools {
		switch s.Status {
		case "active":
			activeSchools++
		case "suspended":
			suspendedSchools++
		case "pending":
			pendingSchools++
		case "expired":
			expiredSchools++
		}
		if s.CreatedAt.Month() == currentMonth && s.CreatedAt.Year() == currentYear {
			thisMonthNew++
		}
		if s.CreatedAt.Month() == lastMonth && s.CreatedAt.Year() == lastMonthYear {
			lastMonthNew++
		}
	}

	// Count trial and paid from packages
	for _, pkg := range h.Store.SchoolPackages {
		if pkg.PaymentStatus == "paid" && pkg.IsActive {
			paidSchools++
		}
		if pkg.PaymentStatus == "pending" && pkg.IsActive {
			trialSchools++
		}
	}

	// Growth calculation
	growthRate := 0.0
	if lastMonthNew > 0 {
		growthRate = float64(thisMonthNew-lastMonthNew) / float64(lastMonthNew) * 100
	} else if thisMonthNew > 0 {
		growthRate = 100.0
	}

	// ── Revenue Metrics (from SchoolPackages + PaymentRequests) ──────────
	var totalRevenue, monthlyRevenue, pendingPayments, collectedRevenue float64
	var renewalsDue int

	for _, pkg := range h.Store.SchoolPackages {
		if pkg.PaymentStatus == "paid" {
			totalRevenue += pkg.Price
			collectedRevenue += pkg.Price
			if pkg.CreatedAt.Month() == currentMonth && pkg.CreatedAt.Year() == currentYear {
				monthlyRevenue += pkg.Price
			}
		}
		if pkg.PaymentStatus == "pending" {
			pendingPayments += pkg.Price
		}
		if pkg.ExpiryDate.Before(now.AddDate(0, 0, 30)) && pkg.ExpiryDate.After(now) && pkg.IsActive {
			renewalsDue++
		}
	}

	// Also count from verified payment requests
	for _, inv := range h.Store.Invoices {
		if inv.Status == "paid" {
			totalRevenue += inv.Amount
			if inv.CreatedAt.Month() == currentMonth && inv.CreatedAt.Year() == currentYear {
				monthlyRevenue += inv.Amount
			}
		}
		if inv.Status == "pending" {
			pendingPayments += inv.Amount
		}
	}

	// ─ MRR / ARR Calculation ────────────────────────────────────────────
	var mrr float64
	for _, pkg := range h.Store.SchoolPackages {
		if pkg.PaymentStatus == "paid" && pkg.IsActive {
			switch pkg.DurationType {
			case "monthly":
				mrr += pkg.Price
			case "quarterly":
				mrr += pkg.Price / 3
			case "yearly":
				mrr += pkg.Price / 12
			case "lifetime":
				mrr += pkg.Price / 12 // amortize over 12 months
			}
		}
	}
	arr := mrr * 12

	// Collection rate
	collectionRate := 0.0
	totalExpected := collectedRevenue + pendingPayments
	if totalExpected > 0 {
		collectionRate = collectedRevenue / totalExpected * 100
	}

	// ── Subscription Metrics ─────────────────────────────────────────────
	activeSubscriptions := 0
	expiredSubscriptions := 0
	for _, sub := range h.Store.Subscriptions {
		if sub.Status == "active" {
			activeSubscriptions++
		}
		if sub.Status == "expired" {
			expiredSubscriptions++
		}
	}

	// ── User Metrics (platform only) ─────────────────────────────────────
	totalPlatformUsers := len(h.Store.Users)
	adminUsers := 0
	for _, u := range h.Store.Users {
		if u.Role == "admin" || u.Role == "super_admin" {
			adminUsers++
		}
	}

	// ─ Churn Calculation ────────────────────────────────────────────────
	churnRate := 0.0
	if activeSchools > 0 {
		churnRate = float64(expiredSchools) / float64(activeSchools+expiredSchools) * 100
	}

	// ── Expenses ─────────────────────────────────────────────────────────
	var totalExpenses float64
	expenseBreakdown := map[string]float64{}
	for _, exp := range h.Store.Expenses {
		totalExpenses += exp.Amount
		expenseBreakdown[exp.ExpenseType] += exp.Amount
	}
	netRevenue := totalRevenue - totalExpenses

	// ── Monthly Growth Data (last 6 months) ─────────────────────────────
	type monthData struct {
		Month   string `json:"month"`
		Schools int    `json:"schools"`
		Revenue float64 `json:"revenue"`
	}
	monthlyGrowth := make([]monthData, 0, 6)
	monthNames := []string{"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"}

	for i := 5; i >= 0; i-- {
		m := currentMonth - time.Month(i)
		y := currentYear
		for m <= 0 {
			m += 12
			y--
		}
		schoolCount := 0
		rev := 0.0
		for _, s := range h.Store.Schools {
			if s.CreatedAt.Month() == m && s.CreatedAt.Year() == y {
				schoolCount++
			}
		}
		for _, pkg := range h.Store.SchoolPackages {
			if pkg.PaymentStatus == "paid" && pkg.CreatedAt.Month() == m && pkg.CreatedAt.Year() == y {
				rev += pkg.Price
			}
		}
		monthlyGrowth = append(monthlyGrowth, monthData{
			Month:   monthNames[m-1] + " " + strings.TrimPrefix(strconv.Itoa(y), "20"),
			Schools: schoolCount,
			Revenue: rev,
		})
	}

	// ─ Plan Distribution ────────────────────────────────────────────────
	planDistribution := map[string]int{}
	for _, pkg := range h.Store.SchoolPackages {
		if pkg.IsActive {
			planDistribution[pkg.PackageName]++
		}
	}

	// ── Recent Schools ───────────────────────────────────────────────────
	type recentSchool struct {
		ID        string    `json:"_id"`
		Name      string    `json:"name"`
		Plan      string    `json:"plan"`
		Status    string    `json:"status"`
		Revenue   float64   `json:"revenue"`
		Expiry    time.Time `json:"expiry"`
		CreatedAt time.Time `json:"created_at"`
	}
	recentSchools := make([]recentSchool, 0)
	for _, s := range h.Store.Schools {
		plan := "Free"
		revenue := 0.0
		expiry := time.Time{}
		for _, pkg := range h.Store.SchoolPackages {
			if pkg.SchoolID == s.SchoolID && pkg.IsActive {
				plan = pkg.PackageName
				revenue = pkg.Price
				expiry = pkg.ExpiryDate
				break
			}
		}
		recentSchools = append(recentSchools, recentSchool{
			ID:        s.ID,
			Name:      s.Name,
			Plan:      plan,
			Status:    s.Status,
			Revenue:   revenue,
			Expiry:    expiry,
			CreatedAt: s.CreatedAt,
		})
	}
	sort.Slice(recentSchools, func(i, j int) bool {
		return recentSchools[i].CreatedAt.After(recentSchools[j].CreatedAt)
	})
	if len(recentSchools) > 10 {
		recentSchools = recentSchools[:10]
	}

	// ── Recent Payments ──────────────────────────────────────────────────
	type recentPayment struct {
		School    string    `json:"school"`
		Amount    float64   `json:"amount"`
		Plan      string    `json:"plan"`
		Status    string    `json:"status"`
		Date      time.Time `json:"date"`
	}
	recentPayments := make([]recentPayment, 0)
	for _, pkg := range h.Store.SchoolPackages {
		schoolName := ""
		for _, s := range h.Store.Schools {
			if s.SchoolID == pkg.SchoolID {
				schoolName = s.Name
				break
			}
		}
		recentPayments = append(recentPayments, recentPayment{
			School: schoolName,
			Amount: pkg.Price,
			Plan:   pkg.PackageName,
			Status: pkg.PaymentStatus,
			Date:   pkg.CreatedAt,
		})
	}
	sort.Slice(recentPayments, func(i, j int) bool {
		return recentPayments[i].Date.After(recentPayments[j].Date)
	})
	if len(recentPayments) > 10 {
		recentPayments = recentPayments[:10]
	}

	// ── Activity Feed ────────────────────────────────────────────────────
	type activityItem struct {
		Type      string    `json:"type"`
		Message   string    `json:"message"`
		Timestamp time.Time `json:"timestamp"`
	}
	activities := make([]activityItem, 0)

	// Recent school registrations
	for i := len(h.Store.Schools) - 1; i >= 0 && len(activities) < 20; i-- {
		s := h.Store.Schools[i]
		activities = append(activities, activityItem{
			Type:      "school_joined",
			Message:   s.Name + " joined the platform",
			Timestamp: s.CreatedAt,
		})
	}

	// Recent payments
	for _, pkg := range h.Store.SchoolPackages {
		if pkg.PaymentStatus == "paid" {
			schoolName := ""
			for _, s := range h.Store.Schools {
				if s.SchoolID == pkg.SchoolID {
					schoolName = s.Name
					break
				}
			}
			activities = append(activities, activityItem{
				Type:      "payment_received",
				Message:   "Payment received from " + schoolName + " (" + pkg.PackageName + ")",
				Timestamp: pkg.CreatedAt,
			})
		}
	}

	// Sort by timestamp desc
	sort.Slice(activities, func(i, j int) bool {
		return activities[i].Timestamp.After(activities[j].Timestamp)
	})
	if len(activities) > 20 {
		activities = activities[:20]
	}

	api.WriteJSON(w, http.StatusOK, api.Ok(map[string]any{
		"schools": map[string]any{
			"total":     totalSchools,
			"active":    activeSchools,
			"pending":   pendingSchools,
			"suspended": suspendedSchools,
			"expired":   expiredSchools,
			"trial":     trialSchools,
			"paid":      paidSchools,
			"new_this_month":    thisMonthNew,
			"new_last_month":    lastMonthNew,
			"growth_rate":       growthRate,
		},
		"revenue": map[string]any{
			"total":            totalRevenue,
			"monthly":          monthlyRevenue,
			"mrr":              mrr,
			"arr":              arr,
			"collected":        collectedRevenue,
			"pending":          pendingPayments,
			"collection_rate":  collectionRate,
			"renewals_due":     renewalsDue,
		},
		"subscriptions": map[string]any{
			"active":   activeSubscriptions,
			"expired":  expiredSubscriptions,
			"churn_rate": churnRate,
		},
		"platform": map[string]any{
			"total_users":  totalPlatformUsers,
			"admin_users":  adminUsers,
			"total_expenses": totalExpenses,
			"net_revenue":  netRevenue,
			"expense_breakdown": expenseBreakdown,
		},
		"monthly_growth": monthlyGrowth,
		"plan_distribution": planDistribution,
		"recent_schools": recentSchools,
		"recent_payments": recentPayments,
		"activities": activities,
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
		OwnerPassword string    `json:"owner_password"`
		StudentCount  int       `json:"student_count"`
		TeacherCount  int       `json:"teacher_count"`
		ClassCount    int       `json:"class_count"`
		Plan          string    `json:"plan"`
		Revenue       float64   `json:"revenue"`
		Expiry        time.Time `json:"expiry"`
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

		ownerEmail := ""
		ownerPassword := ""
		for _, u := range h.Store.Users {
			if u.SchoolID == s.SchoolID && u.Role == "admin" {
				ownerEmail = u.Email
				ownerPassword = u.Password
				break
			}
		}

		plan := "Free"
		revenue := 0.0
		expiry := time.Time{}
		for _, pkg := range h.Store.SchoolPackages {
			if pkg.SchoolID == s.SchoolID && pkg.IsActive {
				plan = pkg.PackageName
				revenue = pkg.Price
				expiry = pkg.ExpiryDate
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
			Plan:          plan,
			Revenue:       revenue,
			Expiry:        expiry,
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

	for _, u := range h.Store.Users {
		if u.SchoolID == schoolID && u.Role == "admin" {
			u.PasswordHash = body.Password
			u.Password = body.Password
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
