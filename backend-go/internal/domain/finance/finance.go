// Package finance implements /api/super-admin/finance/* endpoints for
// package management, revenue tracking, and expense management.
package finance

import (
	"encoding/json"
	"net/http"
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

// ─── PACKAGE MANAGEMENT ──────────────────────────────────────────────────

type packageInput struct {
	PackageName    string  `json:"package_name"`
	AllowedStudents int    `json:"allowed_students"`
	Price          float64 `json:"price"`
	DurationType   string  `json:"duration_type"`
	StartDate      string  `json:"start_date"`
	ExpiryDate     string  `json:"expiry_date"`
	Notes          string  `json:"notes"`
	IsActive       bool    `json:"is_active"`
}

// CreatePackage creates a custom package for a school.
// POST /api/super-admin/packages
func (h *Handler) CreatePackage(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	if ctx.Role != "super_admin" && ctx.Role != "admin" {
		api.WriteResult(w, api.Fail("FORBIDDEN", "Super admin access required.", 403, nil))
		return
	}

	schoolID := r.URL.Query().Get("school_id")
	if schoolID == "" {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "school_id is required.", 400, nil))
		return
	}

	var body packageInput
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid JSON body.", 400, nil))
		return
	}

	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		// Validate inputs
		if body.PackageName == "" || body.AllowedStudents <= 0 || body.Price < 0 {
			return nil, api.NewControlledError("VALIDATION_ERROR", "Invalid package details.", 400, nil)
		}

		validDurations := map[string]bool{"monthly": true, "quarterly": true, "yearly": true, "lifetime": true}
		if !validDurations[body.DurationType] {
			return nil, api.NewControlledError("VALIDATION_ERROR", "Invalid duration type.", 400, nil)
		}

		// Parse dates
		startDate, err := time.Parse("2006-01-02", body.StartDate)
		if err != nil {
			return nil, api.NewControlledError("VALIDATION_ERROR", "Invalid start_date format (use YYYY-MM-DD).", 400, nil)
		}

		var expiryDate time.Time
		if body.DurationType == "lifetime" {
			expiryDate = time.Date(2099, 12, 31, 0, 0, 0, 0, time.UTC)
		} else if body.ExpiryDate != "" {
			var parseErr error
			expiryDate, parseErr = time.Parse("2006-01-02", body.ExpiryDate)
			if parseErr != nil {
				return nil, api.NewControlledError("VALIDATION_ERROR", "Invalid expiry_date format (use YYYY-MM-DD).", 400, nil)
			}
		} else {
			// Auto-calculate expiry based on duration
			switch body.DurationType {
			case "monthly":
				expiryDate = startDate.AddDate(0, 1, 0)
			case "quarterly":
				expiryDate = startDate.AddDate(0, 3, 0)
			case "yearly":
				expiryDate = startDate.AddDate(1, 0, 0)
			}
		}

		// Check if school already has a package
		h.Store.RLock()
		for _, pkg := range h.Store.SchoolPackages {
			if pkg.SchoolID == schoolID {
				h.Store.RUnlock()
				return nil, api.NewControlledError("CONFLICT", "School already has a package. Update or delete the existing one.", 409, nil)
			}
		}
		h.Store.RUnlock()

		now := time.Now()
		pkg := &store.SchoolPackage{
			ID:              store.NewID("pkg"),
			SchoolID:        schoolID,
			PackageName:     body.PackageName,
			AllowedStudents: body.AllowedStudents,
			Price:           body.Price,
			DurationType:    body.DurationType,
			StartDate:       startDate,
			ExpiryDate:      expiryDate,
			PaymentStatus:   "pending",
			IsActive:        body.IsActive,
			Notes:           body.Notes,
			CreatedBy:       ctx.UserID,
			CreatedAt:       now,
			UpdatedAt:       now,
		}

		h.Store.Lock()
		h.Store.SchoolPackages = append(h.Store.SchoolPackages, pkg)
		h.Store.Unlock()

		return h.hydratePackage(pkg), nil
	}))
}

// ListPackages returns all school packages with optional filters.
// GET /api/super-admin/packages
func (h *Handler) ListPackages(w http.ResponseWriter, r *http.Request) {
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

	pkgs := make([]map[string]any, 0)
	for _, pkg := range h.Store.SchoolPackages {
		if statusFilter != "" && pkg.PaymentStatus != statusFilter {
			continue
		}
		if search != "" && !strings.Contains(strings.ToLower(pkg.PackageName), search) && !strings.Contains(pkg.SchoolID, search) {
			continue
		}

		// Count current students for this school
		studentCount := 0
		for _, s := range h.Store.Students {
			if s.SchoolID == pkg.SchoolID {
				studentCount++
			}
		}

		pkgs = append(pkgs, map[string]any{
			"_id":               pkg.ID,
			"school_id":         pkg.SchoolID,
			"package_name":      pkg.PackageName,
			"allowed_students":  pkg.AllowedStudents,
			"current_students":  studentCount,
			"price":             pkg.Price,
			"duration_type":     pkg.DurationType,
			"start_date":        pkg.StartDate.Format("2006-01-02"),
			"expiry_date":       pkg.ExpiryDate.Format("2006-01-02"),
			"payment_status":    pkg.PaymentStatus,
			"is_active":         pkg.IsActive,
			"is_expired":        time.Now().After(pkg.ExpiryDate),
			"created_at":        pkg.CreatedAt,
			"updated_at":        pkg.UpdatedAt,
		})
	}

	page := api.ParsePagination(q)
	if !page.Enabled {
		api.WriteResult(w, api.Ok(map[string]any{"items": pkgs, "total": len(pkgs)}))
		return
	}
	api.WriteResult(w, api.Ok(api.BuildPaginated(api.SafeSlice(pkgs, page.Skip, page.Skip+page.Limit), len(pkgs), page)))
}

// UpdatePackage updates a school's package.
// PUT /api/super-admin/packages/:id
func (h *Handler) UpdatePackage(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	if ctx.Role != "super_admin" && ctx.Role != "admin" {
		api.WriteResult(w, api.Fail("FORBIDDEN", "Super admin access required.", 403, nil))
		return
	}

	id := chi.URLParam(r, "id")
	var body packageInput
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid JSON body.", 400, nil))
		return
	}

	h.Store.Lock()
	defer h.Store.Unlock()

	for _, pkg := range h.Store.SchoolPackages {
		if pkg.ID == id {
			if body.PackageName != "" {
				pkg.PackageName = body.PackageName
			}
			if body.AllowedStudents > 0 {
				pkg.AllowedStudents = body.AllowedStudents
			}
			if body.Price >= 0 {
				pkg.Price = body.Price
			}
			if body.ExpiryDate != "" {
				if expiry, err := time.Parse("2006-01-02", body.ExpiryDate); err == nil {
					pkg.ExpiryDate = expiry
				}
			}
			pkg.Notes = body.Notes
			pkg.IsActive = body.IsActive
			pkg.UpdatedAt = time.Now()

			api.WriteResult(w, api.Ok(h.hydratePackage(pkg)))
			return
		}
	}

	api.WriteResult(w, api.Fail("NOT_FOUND", "Package not found.", 404, nil))
}

// DeletePackage deletes a school's package.
// DELETE /api/super-admin/packages/:id
func (h *Handler) DeletePackage(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	if ctx.Role != "super_admin" && ctx.Role != "admin" {
		api.WriteResult(w, api.Fail("FORBIDDEN", "Super admin access required.", 403, nil))
		return
	}

	id := chi.URLParam(r, "id")

	h.Store.Lock()
	defer h.Store.Unlock()

	for i, pkg := range h.Store.SchoolPackages {
		if pkg.ID == id {
			h.Store.SchoolPackages = append(h.Store.SchoolPackages[:i], h.Store.SchoolPackages[i+1:]...)
			api.WriteResult(w, api.Ok(map[string]any{"success": true, "message": "Package deleted"}))
			return
		}
	}

	api.WriteResult(w, api.Fail("NOT_FOUND", "Package not found.", 404, nil))
}

// ─── EXPENSE MANAGEMENT ──────────────────────────────────────────────────

type expenseInput struct {
	Title       string  `json:"title"`
	Amount      float64 `json:"amount"`
	ExpenseType string  `json:"expense_type"`
	Note        string  `json:"note"`
}

// CreateExpense creates a new expense record.
// POST /api/super-admin/expenses
func (h *Handler) CreateExpense(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	if ctx.Role != "super_admin" && ctx.Role != "admin" {
		api.WriteResult(w, api.Fail("FORBIDDEN", "Super admin access required.", 403, nil))
		return
	}

	var body expenseInput
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid JSON body.", 400, nil))
		return
	}

	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		if body.Title == "" || body.Amount <= 0 {
			return nil, api.NewControlledError("VALIDATION_ERROR", "Title and amount are required.", 400, nil)
		}

		validTypes := map[string]bool{"mutual": true, "ali": true, "abdul_rehman": true}
		if !validTypes[body.ExpenseType] {
			return nil, api.NewControlledError("VALIDATION_ERROR", "Invalid expense type.", 400, nil)
		}

		now := time.Now()
		exp := &store.Expense{
			ID:          store.NewID("exp"),
			Title:       body.Title,
			Amount:      body.Amount,
			ExpenseType: body.ExpenseType,
			Note:        body.Note,
			CreatedBy:   ctx.UserID,
			CreatedAt:   now,
			UpdatedAt:   now,
		}

		h.Store.Lock()
		h.Store.Expenses = append(h.Store.Expenses, exp)
		h.Store.Unlock()

		return h.hydrateExpense(exp), nil
	}))
}

// ListExpenses returns all expenses with optional filters.
// GET /api/super-admin/expenses
func (h *Handler) ListExpenses(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	if ctx.Role != "super_admin" && ctx.Role != "admin" {
		api.WriteResult(w, api.Fail("FORBIDDEN", "Super admin access required.", 403, nil))
		return
	}

	q := r.URL.Query()
	typeFilter := q.Get("type")

	h.Store.RLock()
	defer h.Store.RUnlock()

	exps := make([]map[string]any, 0)
	for _, exp := range h.Store.Expenses {
		if typeFilter != "" && exp.ExpenseType != typeFilter {
			continue
		}
		exps = append(exps, h.hydrateExpense(exp))
	}

	page := api.ParsePagination(q)
	if !page.Enabled {
		api.WriteResult(w, api.Ok(map[string]any{"items": exps, "total": len(exps)}))
		return
	}
	api.WriteResult(w, api.Ok(api.BuildPaginated(api.SafeSlice(exps, page.Skip, page.Skip+page.Limit), len(exps), page)))
}

// ─── FINANCE ANALYTICS ───────────────────────────────────────────────────

// GetFinanceDashboard returns revenue, expenses, and profit analytics.
// GET /api/super-admin/finance/dashboard
func (h *Handler) GetFinanceDashboard(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	if ctx.Role != "super_admin" && ctx.Role != "admin" {
		api.WriteResult(w, api.Fail("FORBIDDEN", "Super admin access required.", 403, nil))
		return
	}

	h.Store.RLock()
	defer h.Store.RUnlock()

	now := time.Now()
	currentMonth := now.Month()
	currentYear := now.Year()

	// Calculate total revenue (paid packages)
	var totalRevenue float64
	var monthlyRevenue float64
	for _, pkg := range h.Store.SchoolPackages {
		if pkg.PaymentStatus == "paid" {
			totalRevenue += pkg.Price
			if pkg.CreatedAt.Month() == currentMonth && pkg.CreatedAt.Year() == currentYear {
				monthlyRevenue += pkg.Price
			}
		}
	}

	// Calculate total expenses by type
	var totalExpenses float64
	mutualExp, aliExp, abdulExp := 0.0, 0.0, 0.0
	for _, exp := range h.Store.Expenses {
		totalExpenses += exp.Amount
		switch exp.ExpenseType {
		case "mutual":
			mutualExp += exp.Amount
		case "ali":
			aliExp += exp.Amount
		case "abdul_rehman":
			abdulExp += exp.Amount
		}
	}

	netProfit := totalRevenue - totalExpenses

	api.WriteResult(w, api.Ok(map[string]any{
		"total_revenue":    totalRevenue,
		"monthly_revenue":  monthlyRevenue,
		"total_expenses":   totalExpenses,
		"net_profit":       netProfit,
		"expense_breakdown": map[string]any{
			"mutual":       mutualExp,
			"ali":          aliExp,
			"abdul_rehman": abdulExp,
		},
		"total_schools":    len(h.Store.Schools),
		"active_packages":  len(h.Store.SchoolPackages),
	}))
}

// ─── HELPERS ─────────────────────────────────────────────────────────────

func (h *Handler) hydratePackage(pkg *store.SchoolPackage) map[string]any {
	return map[string]any{
		"_id":               pkg.ID,
		"school_id":         pkg.SchoolID,
		"package_name":      pkg.PackageName,
		"allowed_students":  pkg.AllowedStudents,
		"price":             pkg.Price,
		"duration_type":     pkg.DurationType,
		"start_date":        pkg.StartDate.Format("2006-01-02"),
		"expiry_date":       pkg.ExpiryDate.Format("2006-01-02"),
		"payment_status":    pkg.PaymentStatus,
		"is_active":         pkg.IsActive,
		"is_expired":        time.Now().After(pkg.ExpiryDate),
		"notes":             pkg.Notes,
		"created_at":        pkg.CreatedAt,
		"updated_at":        pkg.UpdatedAt,
	}
}

func (h *Handler) hydrateExpense(exp *store.Expense) map[string]any {
	return map[string]any{
		"_id":           exp.ID,
		"title":         exp.Title,
		"amount":        exp.Amount,
		"expense_type":  exp.ExpenseType,
		"note":          exp.Note,
		"created_by":    exp.CreatedBy,
		"created_at":    exp.CreatedAt,
		"updated_at":    exp.UpdatedAt,
	}
}
