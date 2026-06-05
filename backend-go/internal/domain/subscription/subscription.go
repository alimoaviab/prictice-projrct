// Package subscription implements the subscription & billing module.
//
// Endpoints:
//
//	GET  /api/subscription/current  — current active subscription
//	GET  /api/subscription/plans    — available plans
//	POST /api/subscription/upgrade  — upgrade to a new plan
//	POST /api/subscription/start-trial — activate 14-day free trial
//	GET  /api/subscription/history  — subscription change history
//
// Student limit enforcement:
//
//	CheckStudentLimit(schoolID) is called by the students handler before
//	every student creation. It returns an error if the limit is exceeded.
package subscription

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/eduplexo/backend-go/internal/api"
	"github.com/eduplexo/backend-go/internal/domain/superadmin"
	"github.com/eduplexo/backend-go/internal/store"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// ─── Plan Definitions ────────────────────────────────────────────────────

type Plan struct {
	ID           string   `json:"id"`
	Name         string   `json:"name"`
	DisplayName  string   `json:"display_name"`
	Price        int      `json:"price"`
	Currency     string   `json:"currency"`
	StudentLimit int      `json:"student_limit"`
	Features     []string `json:"features"`
	IsCustom     bool     `json:"is_custom"`
	Popular      bool     `json:"popular"`
}

var AvailablePlans = []Plan{
	{
		ID:           "plan_starter",
		Name:         "starter",
		DisplayName:  "Starter School",
		Price:        4000,
		Currency:     "PKR",
		StudentLimit: 200,
		Features: []string{
			"Student & Staff Directory",
			"Basic Attendance Tracking",
			"Fee Collection",
			"Parent Portal App",
			"Standard Support",
		},
		IsCustom: false,
		Popular:  false,
	},
	{
		ID:           "plan_growth",
		Name:         "growth",
		DisplayName:  "Growth Plan",
		Price:        9000,
		Currency:     "PKR",
		StudentLimit: 500,
		Features: []string{
			"Everything in Starter",
			"Advanced Reporting",
			"SMS Notifications",
			"Analytics Dashboard",
			"Priority Support",
		},
		IsCustom: false,
		Popular:  true,
	},
	{
		ID:           "plan_custom",
		Name:         "custom",
		DisplayName:  "Custom Plan",
		Price:        0,
		Currency:     "PKR",
		StudentLimit: 800,
		Features: []string{
			"Everything in Growth",
			"Dedicated Support",
			"Enterprise Features",
			"Custom Integrations",
			"Custom Student Limit",
		},
		IsCustom: true,
		Popular:  false,
	},
}

// ─── Subscription Model ──────────────────────────────────────────────────

type Subscription struct {
	ID             string     `json:"id"`
	SchoolID       string     `json:"school_id"`
	PlanName       string     `json:"plan_name"`
	StudentLimit   int        `json:"student_limit"`
	Price          int        `json:"price"`
	Currency       string     `json:"currency"`
	StartDate      time.Time  `json:"start_date"`
	EndDate        time.Time  `json:"end_date"`
	Status         string     `json:"status"`
	IsTrial        bool       `json:"is_trial"`
	TrialUsed      bool       `json:"trial_used"`
	TrialStartDate *time.Time `json:"trial_start_date,omitempty"`
	TrialEndDate   *time.Time `json:"trial_end_date,omitempty"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
}

type HistoryEntry struct {
	ID            string    `json:"id"`
	SchoolID      string    `json:"school_id"`
	PlanName      string    `json:"plan_name"`
	StudentLimit  int       `json:"student_limit"`
	Amount        int       `json:"amount"`
	PaymentStatus string    `json:"payment_status"`
	StartDate     time.Time `json:"start_date"`
	EndDate       time.Time `json:"end_date"`
	Action        string    `json:"action"`
	CreatedAt     time.Time `json:"created_at"`
}

// ─── Handler ─────────────────────────────────────────────────────────────

type Handler struct {
	Pool  *pgxpool.Pool
	Store *store.MemStore
}

func New(pool *pgxpool.Pool, s *store.MemStore) *Handler {
	return &Handler{Pool: pool, Store: s}
}

// ─── GET /api/subscription/current ───────────────────────────────────────

type CurrentResponse struct {
	Subscription           *Subscription   `json:"subscription"`
	StudentsUsed           int             `json:"students_used"`
	StudentsLimit          int             `json:"students_limit"`
	ActiveStudents         int             `json:"active_students"`
	DaysRemaining          int             `json:"days_remaining"`
	IsExpired              bool            `json:"is_expired"`
	CanTrial               bool            `json:"can_trial"`
	SelectedPackages       []string        `json:"selected_packages"`
	AvailablePackages      []ModulePackage `json:"available_packages"`
	AllowedModules         map[string]bool `json:"allowed_modules"`
	MonthlyCost            int             `json:"monthly_cost"`
	MinimumMonthlyBill     int             `json:"minimum_monthly_bill"`
	TrialWarning           string          `json:"trial_warning,omitempty"`
	PackageBuilderRequired bool            `json:"package_builder_required"`
}

func (h *Handler) GetCurrent(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	api.WriteResult(w, api.ServiceTry(func() (CurrentResponse, error) {
		sub, err := h.getActiveSubscription(r.Context(), ctx.SchoolID)
		if err != nil {
			return CurrentResponse{}, err
		}

		studentsUsed := h.countActiveStudents(ctx.SchoolID)
		rates := superadmin.GetPlatformSettings().PackageRates
		selected := []string{PackageAcademic}
		trialWarning := ""
		builderRequired := false

		// Check if trial is available
		canTrial := false
		if sub == nil || (!sub.TrialUsed && sub.Status != "trial") {
			canTrial = true
		}
		if sub != nil && sub.TrialUsed {
			canTrial = false
		}

		daysRemaining := 0
		isExpired := true
		if sub != nil {
			selected = ParseSelectedPackages(sub.PlanName, nil)
			remaining := time.Until(sub.EndDate)
			if remaining > 0 {
				daysRemaining = int(remaining.Hours() / 24)
				isExpired = false
				if sub.Status == "trial" {
					elapsedDays := int(time.Since(sub.StartDate).Hours() / 24)
					if elapsedDays >= 13 {
						trialWarning = "urgent"
					} else if elapsedDays >= 10 {
						trialWarning = "warning"
					}
					builderRequired = len(selected) == 1
				}
			} else {
				// Auto-expire
				h.expireSubscription(r.Context(), sub.ID)
				sub.Status = "expired"
			}
		}

		limit := 0
		if sub != nil {
			limit = sub.StudentLimit
		}

		return CurrentResponse{
			Subscription:           sub,
			StudentsUsed:           studentsUsed,
			StudentsLimit:          limit,
			ActiveStudents:         studentsUsed,
			DaysRemaining:          daysRemaining,
			IsExpired:              isExpired,
			CanTrial:               canTrial,
			SelectedPackages:       selected,
			AvailablePackages:      PackageCatalog(rates),
			AllowedModules:         PackageModules(selected),
			MonthlyCost:            MonthlyEstimate(studentsUsed, selected, rates),
			MinimumMonthlyBill:     500,
			TrialWarning:           trialWarning,
			PackageBuilderRequired: builderRequired,
		}, nil
	}))
}

// ─── GET /api/subscription/plans ─────────────────────────────────────────

func (h *Handler) GetPlans(w http.ResponseWriter, r *http.Request) {
	if h.Pool != nil {
		rows, err := h.Pool.Query(r.Context(), `
			SELECT id, name, student_limit, price, COALESCE(currency,'PKR'), features, is_custom, display_order
			FROM subscription_plans WHERE is_active = true ORDER BY display_order ASC, created_at ASC
		`)
		if err == nil {
			defer rows.Close()
			plans := make([]Plan, 0)
			for rows.Next() {
				var p Plan
				var dbName string
				var featuresJSON []byte
				var displayOrder int
				if err := rows.Scan(&p.ID, &dbName, &p.StudentLimit, &p.Price, &p.Currency, &featuresJSON, &p.IsCustom, &displayOrder); err == nil {
					_ = json.Unmarshal(featuresJSON, &p.Features)
					p.DisplayName = dbName
					if p.ID == "plan_starter" {
						p.Name = "starter"
						p.Popular = false
					} else if p.ID == "plan_growth" {
						p.Name = "growth"
						p.Popular = true
					} else if p.ID == "plan_custom" {
						p.Name = "custom"
						p.Popular = false
					} else {
						p.Name = p.ID
					}
					plans = append(plans, p)
				}
			}
			if len(plans) > 0 {
				api.WriteResult(w, api.Ok(plans))
				return
			}
		}
	}
	api.WriteResult(w, api.Ok(AvailablePlans))
}

// ─── POST /api/subscription/start-trial ──────────────────────────────────

func (h *Handler) StartTrial(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	api.WriteResult(w, api.ServiceTry(func() (*Subscription, error) {
		// Check if trial already used
		var trialUsed bool
		err := h.Pool.QueryRow(r.Context(), `
			SELECT EXISTS(
				SELECT 1 FROM subscriptions 
				WHERE school_id = $1 AND (trial_used = true OR is_trial = true)
			)
		`, ctx.SchoolID).Scan(&trialUsed)
		if err != nil && err != pgx.ErrNoRows {
			return nil, fmt.Errorf("check trial: %w", err)
		}

		if trialUsed {
			return nil, api.NewControlledError("TRIAL_USED", "Your school has already used the free trial. Please subscribe to a plan.", 400, nil)
		}

		// Deactivate any existing subscription
		_, _ = h.Pool.Exec(r.Context(), `
			UPDATE subscriptions SET status = 'cancelled', updated_at = NOW()
			WHERE school_id = $1 AND status IN ('active', 'trial')
		`, ctx.SchoolID)

		// Create trial subscription (Academic package for 14 days)
		now := time.Now()
		trialEnd := now.Add(14 * 24 * time.Hour)
		id := store.NewID("sub")
		selected := []string{PackageAcademic}

		sub := &Subscription{
			ID:             id,
			SchoolID:       ctx.SchoolID,
			PlanName:       EncodeSelectedPackages(selected),
			StudentLimit:   h.countActiveStudents(ctx.SchoolID),
			Price:          0,
			Currency:       "PKR",
			StartDate:      now,
			EndDate:        trialEnd,
			Status:         "trial",
			IsTrial:        true,
			TrialUsed:      true,
			TrialStartDate: &now,
			TrialEndDate:   &trialEnd,
			CreatedAt:      now,
			UpdatedAt:      now,
		}

		_, err = h.Pool.Exec(r.Context(), `
			INSERT INTO subscriptions (id, school_id, plan_name, student_limit, price, currency, start_date, end_date, status, is_trial, trial_used, trial_start_date, trial_end_date, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
		`, sub.ID, sub.SchoolID, sub.PlanName, sub.StudentLimit, sub.Price, sub.Currency,
			sub.StartDate, sub.EndDate, sub.Status, sub.IsTrial, sub.TrialUsed,
			sub.TrialStartDate, sub.TrialEndDate, sub.CreatedAt, sub.UpdatedAt)
		if err != nil {
			return nil, fmt.Errorf("create trial: %w", err)
		}

		// Record in history
		h.recordHistory(r.Context(), ctx.SchoolID, sub.PlanName, sub.StudentLimit, 0, "paid", now, trialEnd, "trial")

		return sub, nil
	}))
}

type packageUpdateInput struct {
	SelectedPackages []string `json:"selected_packages"`
	StudentLimit     int      `json:"student_limit,omitempty"`
}

func (h *Handler) UpdatePackages(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	var body packageUpdateInput
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid JSON body.", 400, nil))
		return
	}
	api.WriteResult(w, api.ServiceTry(func() (CurrentResponse, error) {
		selected := NormalizePackagesAndModules(body.SelectedPackages)
		now := time.Now()
		students := body.StudentLimit
		if students <= 0 {
			students = h.countActiveStudents(ctx.SchoolID)
		}
		if students <= 0 {
			students = 100 // fallback
		}
		rates := superadmin.GetPlatformSettings().PackageRates
		amount := MonthlyEstimate(students, selected, rates)
		planName := EncodeSelectedPackages(selected)

		if h.Pool != nil {
			var subID string
			var endDate time.Time
			err := h.Pool.QueryRow(r.Context(), `
				SELECT id, end_date FROM subscriptions
				WHERE school_id=$1 AND status IN ('active','trial')
				ORDER BY created_at DESC LIMIT 1
			`, ctx.SchoolID).Scan(&subID, &endDate)
			if err == pgx.ErrNoRows {
				subID = store.NewID("sub")
				endDate = now.AddDate(0, 0, 14)
				_, err = h.Pool.Exec(r.Context(), `
					INSERT INTO subscriptions (id, school_id, plan_name, student_limit, price, currency, start_date, end_date, status, is_trial, trial_used, trial_start_date, trial_end_date, created_at, updated_at)
					VALUES ($1,$2,$3,$4,$5,'PKR',$6,$7,'trial',true,true,$6,$7,$6,$6)
				`, subID, ctx.SchoolID, planName, students, amount, now, endDate)
			} else if err == nil {
				_, err = h.Pool.Exec(r.Context(), `
					UPDATE subscriptions SET plan_name=$2, student_limit=$3, price=$4, updated_at=NOW()
					WHERE id=$1
				`, subID, planName, students, amount)
			}
			if err != nil {
				return CurrentResponse{}, fmt.Errorf("update subscription packages: %w", err)
			}
			h.recordHistory(r.Context(), ctx.SchoolID, planName, students, amount, "pending", now, endDate, "package_change")
		}

		if h.Store != nil {
			h.Store.Lock()
			var latest *store.Subscription
			for _, sub := range h.Store.Subscriptions {
				if sub.SchoolID == ctx.SchoolID && (sub.Status == "active" || sub.Status == "trial") {
					if latest == nil || sub.CreatedAt.After(latest.CreatedAt) {
						latest = sub
					}
				}
			}
			if latest == nil {
				latest = &store.Subscription{
					ID:          store.NewID("sub"),
					SchoolID:    ctx.SchoolID,
					Status:      "trial",
					AutoRenew:   false,
					NextRenewal: now.AddDate(0, 0, 14),
					CreatedAt:   now,
				}
				h.Store.Subscriptions = append(h.Store.Subscriptions, latest)
			}
			latest.PackageID = planName
			latest.SelectedPackages = selected
			latest.StudentLimit = students
			latest.Price = amount
			latest.UpdatedAt = now
			h.Store.AuditLogs = append(h.Store.AuditLogs, &store.AuditLog{
				ID:         store.NewID("aud"),
				SchoolID:   ctx.SchoolID,
				ActorID:    ctx.UserID,
				ActorRole:  ctx.Role,
				ActorEmail: ctx.ActorEmail,
				Action:     "package_change",
				EntityType: "subscription",
				EntityID:   latest.ID,
				After:      map[string]any{"selected_packages": selected, "student_limit": students, "monthly_cost": amount},
				CreatedAt:  now,
			})
			h.Store.Unlock()
		}

		sub, err := h.getActiveSubscription(r.Context(), ctx.SchoolID)
		if err != nil {
			return CurrentResponse{}, err
		}
		days := 0
		expired := true
		if sub != nil {
			selected = ParseSelectedPackages(sub.PlanName, nil)
			if remaining := time.Until(sub.EndDate); remaining > 0 {
				days = int(remaining.Hours() / 24)
				expired = false
			}
		}
		return CurrentResponse{
			Subscription:           sub,
			StudentsUsed:           students,
			StudentsLimit:          students,
			ActiveStudents:         students,
			DaysRemaining:          days,
			IsExpired:              expired,
			CanTrial:               false,
			SelectedPackages:       selected,
			AvailablePackages:      PackageCatalog(rates),
			AllowedModules:         PackageModules(selected),
			MonthlyCost:            MonthlyEstimate(students, selected, rates),
			MinimumMonthlyBill:     500,
			PackageBuilderRequired: false,
		}, nil
	}))
}

// ─── POST /api/subscription/upgrade ──────────────────────────────────────

type upgradeInput struct {
	PlanName     string `json:"plan_name"`
	StudentLimit int    `json:"student_limit,omitempty"` // For custom plans
}

func (h *Handler) Upgrade(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	var body upgradeInput
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid JSON body.", 400, nil))
		return
	}

	api.WriteResult(w, api.ServiceTry(func() (*Subscription, error) {
		// Find the plan
		var plan *Plan
		for i := range AvailablePlans {
			if AvailablePlans[i].Name == body.PlanName {
				plan = &AvailablePlans[i]
				break
			}
		}
		if plan == nil {
			return nil, api.NewControlledError("VALIDATION_ERROR", "Invalid plan name.", 400, nil)
		}

		studentLimit := plan.StudentLimit
		price := plan.Price
		if plan.IsCustom && body.StudentLimit > 0 {
			studentLimit = body.StudentLimit
			// Custom pricing: PKR 15 per student per month
			price = body.StudentLimit * 15
		}

		// Deactivate current subscription
		_, _ = h.Pool.Exec(r.Context(), `
			UPDATE subscriptions SET status = 'cancelled', updated_at = NOW()
			WHERE school_id = $1 AND status IN ('active', 'trial')
		`, ctx.SchoolID)

		// Create new subscription (1 month)
		now := time.Now()
		endDate := now.AddDate(0, 1, 0)
		id := store.NewID("sub")

		// Preserve trial_used flag
		var trialUsed bool
		_ = h.Pool.QueryRow(r.Context(), `
			SELECT COALESCE(bool_or(trial_used), false) FROM subscriptions WHERE school_id = $1
		`, ctx.SchoolID).Scan(&trialUsed)

		sub := &Subscription{
			ID:           id,
			SchoolID:     ctx.SchoolID,
			PlanName:     plan.Name,
			StudentLimit: studentLimit,
			Price:        price,
			Currency:     "PKR",
			StartDate:    now,
			EndDate:      endDate,
			Status:       "active",
			IsTrial:      false,
			TrialUsed:    trialUsed,
			CreatedAt:    now,
			UpdatedAt:    now,
		}

		_, err := h.Pool.Exec(r.Context(), `
			INSERT INTO subscriptions (id, school_id, plan_name, student_limit, price, currency, start_date, end_date, status, is_trial, trial_used, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
		`, sub.ID, sub.SchoolID, sub.PlanName, sub.StudentLimit, sub.Price, sub.Currency,
			sub.StartDate, sub.EndDate, sub.Status, sub.IsTrial, sub.TrialUsed,
			sub.CreatedAt, sub.UpdatedAt)
		if err != nil {
			return nil, fmt.Errorf("create subscription: %w", err)
		}

		h.recordHistory(r.Context(), ctx.SchoolID, plan.Name, studentLimit, price, "paid", now, endDate, "upgrade")

		return sub, nil
	}))
}

// ─── GET /api/subscription/history ───────────────────────────────────────

func (h *Handler) GetHistory(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	api.WriteResult(w, api.ServiceTry(func() ([]HistoryEntry, error) {
		rows, err := h.Pool.Query(r.Context(), `
			SELECT id, school_id, plan_name, student_limit, amount, payment_status, start_date, end_date, action, created_at
			FROM subscription_history
			WHERE school_id = $1
			ORDER BY created_at DESC
			LIMIT 50
		`, ctx.SchoolID)
		if err != nil {
			return nil, fmt.Errorf("query history: %w", err)
		}
		defer rows.Close()

		entries := make([]HistoryEntry, 0)
		for rows.Next() {
			var e HistoryEntry
			if err := rows.Scan(&e.ID, &e.SchoolID, &e.PlanName, &e.StudentLimit, &e.Amount, &e.PaymentStatus, &e.StartDate, &e.EndDate, &e.Action, &e.CreatedAt); err != nil {
				continue
			}
			entries = append(entries, e)
		}
		return entries, nil
	}))
}

// ─── STUDENT LIMIT CHECK (called by students handler) ────────────────────

// CheckStudentLimit validates that the school hasn't exceeded their student limit.
// Returns nil if OK, or a ControlledError if limit is reached.
// This is the CRITICAL enforcement point — called before every student creation.
func (h *Handler) CheckStudentLimit(ctx context.Context, schoolID string) error {
	sub, err := h.getActiveSubscription(ctx, schoolID)
	if err != nil {
		// If we can't check, allow (don't block on DB errors)
		log.Printf("[subscription] limit check error for %s: %v (allowing)", schoolID, err)
		return nil
	}

	if sub == nil {
		return api.NewControlledError("SUBSCRIPTION_REQUIRED",
			"No active subscription found. Please subscribe to a plan to add students.", 403, nil)
	}

	// Check if subscription is expired
	if time.Now().After(sub.EndDate) {
		return api.NewControlledError("SUBSCRIPTION_EXPIRED",
			"Your subscription has expired. Please renew to add more students.", 403, nil)
	}

	// Count current active students
	activeStudents := h.countActiveStudents(schoolID)

	if len(ParseSelectedPackages(sub.PlanName, nil)) > 0 {
		return nil
	}

	if activeStudents >= sub.StudentLimit {
		return api.NewControlledError("STUDENT_LIMIT_REACHED",
			fmt.Sprintf("You have reached your subscription student limit (%d students). Please upgrade your plan to add more students.", sub.StudentLimit),
			403,
			map[string]any{
				"current_count": activeStudents,
				"limit":         sub.StudentLimit,
				"plan":          sub.PlanName,
			},
		)
	}

	return nil
}

// ─── Internal Helpers ────────────────────────────────────────────────────

func (h *Handler) getActiveSubscription(ctx context.Context, schoolID string) (*Subscription, error) {
	if h.Pool == nil {
		return h.activeSubscriptionFromStore(schoolID), nil
	}

	var sub Subscription
	var trialStart, trialEnd *time.Time
	err := h.Pool.QueryRow(ctx, `
		SELECT id, school_id, plan_name, student_limit, price, currency, start_date, end_date,
		       status, is_trial, trial_used, trial_start_date, trial_end_date, created_at, updated_at
		FROM subscriptions
		WHERE school_id = $1 AND status IN ('active', 'trial')
		ORDER BY created_at DESC
		LIMIT 1
	`, schoolID).Scan(
		&sub.ID, &sub.SchoolID, &sub.PlanName, &sub.StudentLimit, &sub.Price, &sub.Currency,
		&sub.StartDate, &sub.EndDate, &sub.Status, &sub.IsTrial, &sub.TrialUsed,
		&trialStart, &trialEnd, &sub.CreatedAt, &sub.UpdatedAt,
	)
	if err == pgx.ErrNoRows {
		return h.activeSubscriptionFromStore(schoolID), nil
	}
	if err != nil {
		if sub := h.activeSubscriptionFromStore(schoolID); sub != nil {
			return sub, nil
		}
		return nil, err
	}
	sub.TrialStartDate = trialStart
	sub.TrialEndDate = trialEnd
	return &sub, nil
}

func (h *Handler) activeSubscriptionFromStore(schoolID string) *Subscription {
	if h.Store == nil {
		return nil
	}
	h.Store.RLock()
	defer h.Store.RUnlock()
	var latest *store.Subscription
	for _, s := range h.Store.Subscriptions {
		if s.SchoolID != schoolID || (s.Status != "active" && s.Status != "trial") {
			continue
		}
		if latest == nil || s.CreatedAt.After(latest.CreatedAt) {
			latest = s
		}
	}
	if latest == nil {
		return nil
	}
	selected := ParseSelectedPackages(latest.PackageID, latest.SelectedPackages)
	planName := EncodeSelectedPackages(selected)
	studentLimit := h.countActiveStudents(latest.SchoolID)
	price := MonthlyEstimate(studentLimit, selected, superadmin.GetPlatformSettings().PackageRates)
	start := latest.CreatedAt
	if start.IsZero() {
		start = time.Now()
	}
	end := latest.NextRenewal
	if end.IsZero() {
		end = start.AddDate(0, 0, 14)
	}
	isTrial := latest.Status == "trial"
	var trialStart, trialEnd *time.Time
	if isTrial {
		trialStart = &start
		trialEnd = &end
	}
	return &Subscription{
		ID:             latest.ID,
		SchoolID:       latest.SchoolID,
		PlanName:       planName,
		StudentLimit:   studentLimit,
		Price:          price,
		Currency:       "PKR",
		StartDate:      start,
		EndDate:        end,
		Status:         latest.Status,
		IsTrial:        isTrial,
		TrialUsed:      isTrial,
		TrialStartDate: trialStart,
		TrialEndDate:   trialEnd,
		CreatedAt:      latest.CreatedAt,
		UpdatedAt:      latest.UpdatedAt,
	}
}

func (h *Handler) countActiveStudents(schoolID string) int {
	// Try PG first
	if h.Pool != nil {
		var count int
		err := h.Pool.QueryRow(context.Background(), `
			SELECT COUNT(*) FROM students WHERE school_id = $1 AND status = 'active'
		`, schoolID).Scan(&count)
		if err == nil {
			return count
		}
	}

	// Fallback to MemStore
	h.Store.RLock()
	defer h.Store.RUnlock()
	count := 0
	for _, s := range h.Store.Students {
		if s.SchoolID == schoolID && s.Status == "active" {
			count++
		}
	}
	return count
}

func (h *Handler) expireSubscription(ctx context.Context, subID string) {
	if h.Pool == nil {
		return
	}
	_, _ = h.Pool.Exec(ctx, `
		UPDATE subscriptions SET status = 'expired', updated_at = NOW() WHERE id = $1
	`, subID)
}

func (h *Handler) recordHistory(ctx context.Context, schoolID, planName string, studentLimit, amount int, paymentStatus string, start, end time.Time, action string) {
	if h.Pool == nil {
		return
	}
	_, err := h.Pool.Exec(ctx, `
		INSERT INTO subscription_history (id, school_id, plan_name, student_limit, amount, payment_status, start_date, end_date, action, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
	`, store.NewID("sh"), schoolID, planName, studentLimit, amount, paymentStatus, start, end, action)
	if err != nil {
		log.Printf("[subscription] history record failed: %v", err)
	}
}
