// admin.go — Super Admin subscription management + payment verification.
//
// Endpoints:
//
//	GET    /api/admin/subscription/plans     — list all plans
//	POST   /api/admin/subscription/plans     — create plan
//	PUT    /api/admin/subscription/plans/:id — update plan
//	DELETE /api/admin/subscription/plans/:id — delete plan
//
//	GET    /api/admin/payment-methods        — list payment methods
//	POST   /api/admin/payment-methods        — create payment method
//	PUT    /api/admin/payment-methods/:id    — update payment method
//	DELETE /api/admin/payment-methods/:id    — delete payment method
//
//	GET    /api/admin/payments/pending       — pending payment requests
//	GET    /api/admin/payments/all           — all payment requests
//	POST   /api/admin/payments/:id/verify    — verify payment
//	POST   /api/admin/payments/:id/reject    — reject payment
//
//	POST   /api/payment/upload               — school uploads payment proof
//	GET    /api/payment/methods              — school sees payment methods
//
//	POST   /api/admin/subscription/assign    — assign plan to school
//	POST   /api/admin/subscription/extend    — extend school subscription
package subscription

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/eduplexo/backend-go/internal/api"
	"github.com/eduplexo/backend-go/internal/store"
	"github.com/go-chi/chi/v5"
)

// ═══════════════════════════════════════════════════════════════════════════
// PLAN MANAGEMENT (Super Admin)
// ═══════════════════════════════════════════════════════════════════════════

type DBPlan struct {
	ID           string    `json:"id"`
	Name         string    `json:"name"`
	StudentLimit int       `json:"student_limit"`
	Price        int       `json:"price"`
	Currency     string    `json:"currency"`
	DurationDays int       `json:"duration_days"`
	Features     []string  `json:"features"`
	IsCustom     bool      `json:"is_custom"`
	IsActive     bool      `json:"is_active"`
	DisplayOrder int       `json:"display_order"`
	CreatedAt    time.Time `json:"created_at"`
}

func (h *Handler) AdminListPlans(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	if ctx.Role != "super_admin" && ctx.Role != "admin" {
		api.WriteResult(w, api.Fail("FORBIDDEN", "Super admin access required.", 403, nil))
		return
	}
	api.WriteResult(w, api.ServiceTry(func() ([]DBPlan, error) {
		rows, err := h.Pool.Query(r.Context(), `
			SELECT id, name, student_limit, price, COALESCE(currency,'PKR'), duration_days,
			       features, is_custom, is_active, display_order, created_at
			FROM subscription_plans ORDER BY display_order ASC, created_at ASC
		`)
		if err != nil {
			return nil, fmt.Errorf("list plans: %w", err)
		}
		defer rows.Close()
		plans := make([]DBPlan, 0)
		for rows.Next() {
			var p DBPlan
			var featuresJSON []byte
			if err := rows.Scan(&p.ID, &p.Name, &p.StudentLimit, &p.Price, &p.Currency,
				&p.DurationDays, &featuresJSON, &p.IsCustom, &p.IsActive, &p.DisplayOrder, &p.CreatedAt); err != nil {
				continue
			}
			_ = json.Unmarshal(featuresJSON, &p.Features)
			plans = append(plans, p)
		}
		return plans, nil
	}))
}

type createPlanInput struct {
	Name         string   `json:"name"`
	StudentLimit int      `json:"student_limit"`
	Price        int      `json:"price"`
	DurationDays int      `json:"duration_days"`
	Features     []string `json:"features"`
	IsCustom     bool     `json:"is_custom"`
}

func (h *Handler) AdminCreatePlan(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	if ctx.Role != "super_admin" {
		api.WriteResult(w, api.Fail("FORBIDDEN", "Super admin access required.", 403, nil))
		return
	}
	var body createPlanInput
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid JSON.", 400, nil))
		return
	}
	api.WriteResult(w, api.ServiceTry(func() (*DBPlan, error) {
		if body.Name == "" || body.StudentLimit < 1 {
			return nil, api.NewControlledError("VALIDATION_ERROR", "name and student_limit are required.", 400, nil)
		}
		if body.DurationDays < 1 {
			body.DurationDays = 30
		}
		id := store.NewID("plan")
		featuresJSON, _ := json.Marshal(body.Features)
		_, err := h.Pool.Exec(r.Context(), `
			INSERT INTO subscription_plans (id, name, student_limit, price, duration_days, features, is_custom, created_at, updated_at)
			VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),NOW())
		`, id, body.Name, body.StudentLimit, body.Price, body.DurationDays, featuresJSON, body.IsCustom)
		if err != nil {
			return nil, fmt.Errorf("create plan: %w", err)
		}
		return &DBPlan{ID: id, Name: body.Name, StudentLimit: body.StudentLimit, Price: body.Price,
			Currency: "PKR", DurationDays: body.DurationDays, Features: body.Features, IsCustom: body.IsCustom, IsActive: true}, nil
	}))
}

func (h *Handler) AdminUpdatePlan(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	if ctx.Role != "super_admin" {
		api.WriteResult(w, api.Fail("FORBIDDEN", "Super admin access required.", 403, nil))
		return
	}
	id := chi.URLParam(r, "id")
	var body createPlanInput
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid JSON.", 400, nil))
		return
	}
	api.WriteResult(w, api.ServiceTry(func() (map[string]any, error) {
		featuresJSON, _ := json.Marshal(body.Features)
		_, err := h.Pool.Exec(r.Context(), `
			UPDATE subscription_plans SET name=$2, student_limit=$3, price=$4, duration_days=$5, features=$6, is_custom=$7, updated_at=NOW()
			WHERE id=$1
		`, id, body.Name, body.StudentLimit, body.Price, body.DurationDays, featuresJSON, body.IsCustom)
		if err != nil {
			return nil, fmt.Errorf("update plan: %w", err)
		}
		return map[string]any{"id": id, "updated": true}, nil
	}))
}

func (h *Handler) AdminDeletePlan(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	if ctx.Role != "super_admin" {
		api.WriteResult(w, api.Fail("FORBIDDEN", "Super admin access required.", 403, nil))
		return
	}
	id := chi.URLParam(r, "id")
	api.WriteResult(w, api.ServiceTry(func() (map[string]any, error) {
		_, err := h.Pool.Exec(r.Context(), "DELETE FROM subscription_plans WHERE id=$1", id)
		if err != nil {
			return nil, fmt.Errorf("delete plan: %w", err)
		}
		return map[string]any{"id": id, "deleted": true}, nil
	}))
}
