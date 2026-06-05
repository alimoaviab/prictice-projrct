// payment.go — Payment methods config + payment upload + verification.
package subscription

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/eduplexo/backend-go/internal/api"
	"github.com/eduplexo/backend-go/internal/store"
	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"
)

// ═══════════════════════════════════════════════════════════════════════════
// PAYMENT METHODS (Super Admin configures, Schools view)
// ═══════════════════════════════════════════════════════════════════════════

type PaymentMethod struct {
	ID            string    `json:"id"`
	MethodType    string    `json:"method_type"`
	MethodName    string    `json:"method_name"`
	AccountTitle  string    `json:"account_title"`
	AccountNumber string    `json:"account_number"`
	IBAN          string    `json:"iban,omitempty"`
	BankName      string    `json:"bank_name,omitempty"`
	BranchName    string    `json:"branch_name,omitempty"`
	Instructions  string    `json:"instructions,omitempty"`
	QRImageURL    string    `json:"qr_image_url,omitempty"`
	IsActive      bool      `json:"is_active"`
	CreatedAt     time.Time `json:"created_at"`
}

func (h *Handler) ListPaymentMethods(w http.ResponseWriter, r *http.Request) {
	api.WriteResult(w, api.ServiceTry(func() ([]PaymentMethod, error) {
		rows, err := h.Pool.Query(r.Context(), `
			SELECT id, method_type, method_name, account_title, account_number,
			       COALESCE(iban,''), COALESCE(bank_name,''), COALESCE(branch_name,''),
			       COALESCE(instructions,''), COALESCE(qr_image_url,''), is_active, created_at
			FROM payment_methods WHERE is_active = true ORDER BY display_order ASC
		`)
		if err != nil {
			return nil, fmt.Errorf("list methods: %w", err)
		}
		defer rows.Close()
		methods := make([]PaymentMethod, 0)
		for rows.Next() {
			var m PaymentMethod
			rows.Scan(&m.ID, &m.MethodType, &m.MethodName, &m.AccountTitle, &m.AccountNumber,
				&m.IBAN, &m.BankName, &m.BranchName, &m.Instructions, &m.QRImageURL, &m.IsActive, &m.CreatedAt)
			methods = append(methods, m)
		}
		return methods, nil
	}))
}

type createMethodInput struct {
	MethodType    string `json:"method_type"`
	MethodName    string `json:"method_name"`
	AccountTitle  string `json:"account_title"`
	AccountNumber string `json:"account_number"`
	IBAN          string `json:"iban"`
	BankName      string `json:"bank_name"`
	BranchName    string `json:"branch_name"`
	Instructions  string `json:"instructions"`
	QRImageURL    string `json:"qr_image_url"`
}

func (h *Handler) AdminCreatePaymentMethod(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	if ctx.Role != "super_admin" {
		api.WriteResult(w, api.Fail("FORBIDDEN", "Super admin access required.", 403, nil))
		return
	}
	var body createMethodInput
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid JSON.", 400, nil))
		return
	}
	api.WriteResult(w, api.ServiceTry(func() (*PaymentMethod, error) {
		if body.MethodName == "" || body.AccountNumber == "" {
			return nil, api.NewControlledError("VALIDATION_ERROR", "method_name and account_number required.", 400, nil)
		}
		id := store.NewID("pm")
		_, err := h.Pool.Exec(r.Context(), `
			INSERT INTO payment_methods (id, method_type, method_name, account_title, account_number, iban, bank_name, branch_name, instructions, qr_image_url, created_at, updated_at)
			VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW(),NOW())
		`, id, body.MethodType, body.MethodName, body.AccountTitle, body.AccountNumber,
			body.IBAN, body.BankName, body.BranchName, body.Instructions, body.QRImageURL)
		if err != nil {
			return nil, fmt.Errorf("create method: %w", err)
		}
		return &PaymentMethod{ID: id, MethodType: body.MethodType, MethodName: body.MethodName,
			AccountTitle: body.AccountTitle, AccountNumber: body.AccountNumber, IsActive: true, CreatedAt: time.Now()}, nil
	}))
}

func (h *Handler) AdminUpdatePaymentMethod(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	if ctx.Role != "super_admin" {
		api.WriteResult(w, api.Fail("FORBIDDEN", "Super admin access required.", 403, nil))
		return
	}
	id := chi.URLParam(r, "id")
	var body createMethodInput
	json.NewDecoder(r.Body).Decode(&body)
	api.WriteResult(w, api.ServiceTry(func() (map[string]any, error) {
		_, err := h.Pool.Exec(r.Context(), `
			UPDATE payment_methods SET method_type=$2, method_name=$3, account_title=$4, account_number=$5,
			       iban=$6, bank_name=$7, branch_name=$8, instructions=$9, qr_image_url=$10, updated_at=NOW()
			WHERE id=$1
		`, id, body.MethodType, body.MethodName, body.AccountTitle, body.AccountNumber,
			body.IBAN, body.BankName, body.BranchName, body.Instructions, body.QRImageURL)
		if err != nil {
			return nil, fmt.Errorf("update method: %w", err)
		}
		return map[string]any{"id": id, "updated": true}, nil
	}))
}

func (h *Handler) AdminDeletePaymentMethod(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	if ctx.Role != "super_admin" {
		api.WriteResult(w, api.Fail("FORBIDDEN", "Super admin access required.", 403, nil))
		return
	}
	id := chi.URLParam(r, "id")
	api.WriteResult(w, api.ServiceTry(func() (map[string]any, error) {
		_, _ = h.Pool.Exec(r.Context(), "UPDATE payment_methods SET is_active=false WHERE id=$1", id)
		return map[string]any{"id": id, "deleted": true}, nil
	}))
}

// ═══════════════════════════════════════════════════════════════════════════
// PAYMENT UPLOAD (School Admin submits payment proof)
// ═══════════════════════════════════════════════════════════════════════════

type PaymentRequest struct {
	ID              string     `json:"id"`
	SchoolID        string     `json:"school_id"`
	PlanID          string     `json:"plan_id"`
	SelectedPackages []string  `json:"selected_packages,omitempty"`
	PaymentMethodID string     `json:"payment_method_id"`
	PaymentMethod   string     `json:"payment_method,omitempty"`
	ScreenshotURL   string     `json:"screenshot_url,omitempty"`
	TransactionID   string     `json:"transaction_id"`
	Amount          int        `json:"amount"`
	Status          string     `json:"status"`
	SubmittedAt     time.Time  `json:"submitted_at"`
	PaymentDate     *time.Time `json:"payment_date,omitempty"`
	VerifiedAt      *time.Time `json:"verified_at,omitempty"`
	VerifiedBy      string     `json:"verified_by,omitempty"`
	RejectionReason string    `json:"rejection_reason,omitempty"`
	Notes           string     `json:"notes,omitempty"`
	// Joined fields
	SchoolName      string     `json:"school_name,omitempty"`
	OwnerName       string     `json:"owner_name,omitempty"`
	Phone           string     `json:"phone,omitempty"`
	WhatsApp        string     `json:"whatsapp,omitempty"`
	StudentCount    int        `json:"student_count,omitempty"`
	PlanName        string     `json:"plan_name,omitempty"`
}

type uploadPaymentInput struct {
	PlanID          string `json:"plan_id"`
	SelectedPackages []string `json:"selected_packages"`
	PaymentMethodID string `json:"payment_method_id"`
	PaymentMethod   string `json:"payment_method"`
	ScreenshotURL   string `json:"screenshot_url"`
	TransactionID   string `json:"transaction_id"`
	Amount          int    `json:"amount"`
	PaymentDate     string `json:"payment_date"`
	Notes           string `json:"notes"`
}

func (h *Handler) UploadPayment(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	var body uploadPaymentInput
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid JSON.", 400, nil))
		return
	}
	api.WriteResult(w, api.ServiceTry(func() (*PaymentRequest, error) {
		selected := NormalizePackages(body.SelectedPackages)
		if body.PlanID != "" && len(body.SelectedPackages) == 0 {
			selected = ParseSelectedPackages(body.PlanID, nil)
		}
		planID := strings.TrimSpace(body.PlanID)
		if planID == "" {
			planID = EncodeSelectedPackages(selected)
		}
		if (body.ScreenshotURL == "" && body.Notes == "") || body.TransactionID == "" || body.Amount < 1 {
			return nil, api.NewControlledError("VALIDATION_ERROR", "transaction_id, amount, and either screenshot or SMS text are required.", 400, nil)
		}
		var paidAt *time.Time
		if body.PaymentDate != "" {
			if parsed, err := time.Parse("2006-01-02", body.PaymentDate); err == nil {
				paidAt = &parsed
			}
		}
		if h.Pool == nil {
			now := time.Now()
			pr := &PaymentRequest{
				ID:               store.NewID("pay"),
				SchoolID:         ctx.SchoolID,
				PlanID:           planID,
				SelectedPackages: selected,
				PaymentMethodID:  body.PaymentMethodID,
				PaymentMethod:    body.PaymentMethod,
				ScreenshotURL:    body.ScreenshotURL,
				TransactionID:    body.TransactionID,
				Amount:           body.Amount,
				Status:           "pending",
				SubmittedAt:      now,
				PaymentDate:      paidAt,
				Notes:            body.Notes,
			}
			h.Store.Lock()
			for _, t := range h.Store.Transactions {
				if t.ReferenceNo == body.TransactionID && t.Status != "failed" {
					h.Store.Unlock()
					return nil, api.NewControlledError("DUPLICATE", "This transaction ID has already been submitted.", 400, nil)
				}
			}
			paymentDate := now
			if paidAt != nil {
				paymentDate = *paidAt
			}
			h.Store.Transactions = append(h.Store.Transactions, &store.Transaction{
				ID:               pr.ID,
				SchoolID:         ctx.SchoolID,
				PackageID:        planID,
				SelectedPackages: selected,
				Amount:           float64(body.Amount),
				PaymentMethod:    firstNonEmptyString(body.PaymentMethod, body.PaymentMethodID),
				ReferenceNo:      body.TransactionID,
				ScreenshotURL:    body.ScreenshotURL,
				PaymentDate:      paymentDate,
				Status:           "pending",
				Notes:            body.Notes,
				CreatedAt:        now,
			})
			h.Store.AuditLogs = append(h.Store.AuditLogs, &store.AuditLog{
				ID:         store.NewID("aud"),
				SchoolID:   ctx.SchoolID,
				ActorID:    ctx.UserID,
				ActorRole:  ctx.Role,
				ActorEmail: ctx.ActorEmail,
				Action:     "subscription_purchase",
				EntityType: "payment",
				EntityID:   pr.ID,
				After:      pr,
				CreatedAt:  now,
			})
			h.Store.Unlock()
			return pr, nil
		}
		// Check duplicate transaction ID
		var exists bool
		h.Pool.QueryRow(r.Context(), `SELECT EXISTS(SELECT 1 FROM payment_requests WHERE transaction_id=$1 AND status!='rejected')`, body.TransactionID).Scan(&exists)
		if exists {
			return nil, api.NewControlledError("DUPLICATE", "This transaction ID has already been submitted.", 400, nil)
		}

		id := store.NewID("pay")
		pr := &PaymentRequest{
			ID: id, SchoolID: ctx.SchoolID, PlanID: planID, SelectedPackages: selected,
			PaymentMethodID: body.PaymentMethodID, ScreenshotURL: body.ScreenshotURL,
			TransactionID: body.TransactionID, Amount: body.Amount,
			Status: "pending", SubmittedAt: time.Now(), PaymentDate: paidAt, Notes: body.Notes,
		}
		_, err := h.Pool.Exec(r.Context(), `
			INSERT INTO payment_requests (id, school_id, plan_id, payment_method_id, screenshot_url, transaction_id, amount, status, notes, submitted_at, created_at)
			VALUES ($1,$2,$3,$4,$5,$6,$7,'pending',$8,NOW(),NOW())
		`, pr.ID, pr.SchoolID, pr.PlanID, pr.PaymentMethodID, pr.ScreenshotURL, pr.TransactionID, pr.Amount, pr.Notes)
		if err != nil {
			return nil, fmt.Errorf("upload payment: %w", err)
		}
		return pr, nil
	}))
}

// ═══════════════════════════════════════════════════════════════════════════
// PAYMENT VERIFICATION (Super Admin)
// ═══════════════════════════════════════════════════════════════════════════

func (h *Handler) AdminListPendingPayments(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	if ctx.Role != "super_admin" {
		api.WriteResult(w, api.Fail("FORBIDDEN", "Super admin access required.", 403, nil))
		return
	}
	status := r.URL.Query().Get("status")
	allStatuses := strings.Contains(r.URL.Path, "/all") || status == "all"
	if status == "" && !allStatuses {
		status = "pending"
	}
	api.WriteResult(w, api.ServiceTry(func() ([]PaymentRequest, error) {
		if h.Pool == nil {
			return h.adminListStorePayments(status, allStatuses), nil
		}
		query := `
			SELECT pr.id, pr.school_id, pr.plan_id, COALESCE(pr.payment_method_id,''), COALESCE(pr.screenshot_url,''),
			       pr.transaction_id, pr.amount, pr.status, pr.submitted_at, pr.verified_at, COALESCE(pr.verified_by,''),
			       COALESCE(pr.rejection_reason,''), COALESCE(pr.notes,''),
			       COALESCE(s.name,'Unknown') AS school_name,
			       COALESCE(s.principal_name,''), COALESCE(s.phone,''), COALESCE(s.phone,''),
			       COALESCE(sp.name, pr.plan_id) AS plan_name
			FROM payment_requests pr
			LEFT JOIN schools s ON s.school_id = pr.school_id OR s.id = pr.school_id
			LEFT JOIN subscription_plans sp ON sp.id = pr.plan_id
			WHERE ($1::text = 'all' OR pr.status = $1)
			ORDER BY pr.submitted_at DESC
			LIMIT 100
		`
		if allStatuses {
			status = "all"
		}
		rows, err := h.Pool.Query(r.Context(), query, status)
		if err != nil {
			return nil, fmt.Errorf("list payments: %w", err)
		}
		defer rows.Close()
		payments := make([]PaymentRequest, 0)
		for rows.Next() {
			var p PaymentRequest
			rows.Scan(&p.ID, &p.SchoolID, &p.PlanID, &p.PaymentMethodID, &p.ScreenshotURL,
				&p.TransactionID, &p.Amount, &p.Status, &p.SubmittedAt, &p.VerifiedAt, &p.VerifiedBy,
				&p.RejectionReason, &p.Notes, &p.SchoolName, &p.OwnerName, &p.Phone, &p.WhatsApp, &p.PlanName)
			p.SelectedPackages = ParseSelectedPackages(p.PlanID, nil)
			p.StudentCount = h.countActiveStudents(p.SchoolID)
			payments = append(payments, p)
		}
		return payments, nil
	}))
}

func (h *Handler) AdminVerifyPayment(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	if ctx.Role != "super_admin" {
		api.WriteResult(w, api.Fail("FORBIDDEN", "Super admin access required.", 403, nil))
		return
	}
	paymentID := chi.URLParam(r, "id")
	api.WriteResult(w, api.ServiceTry(func() (map[string]any, error) {
		if h.Pool == nil {
			return h.adminVerifyStorePayment(paymentID, ctx.UserID)
		}
		// Get payment request
		var schoolID, planID string
		var amount int
		err := h.Pool.QueryRow(r.Context(), `
			SELECT school_id, plan_id, amount FROM payment_requests WHERE id=$1 AND status='pending'
		`, paymentID).Scan(&schoolID, &planID, &amount)
		if err == pgx.ErrNoRows {
			return nil, api.NewControlledError("NOT_FOUND", "Payment request not found or already processed.", 404, nil)
		}
		if err != nil {
			return nil, fmt.Errorf("get payment: %w", err)
		}

		// Get plan details. Modular package-builder payments store selected
		// package ids directly in plan_id, so there may be no subscription_plans row.
		var planName string
		var studentLimit, durationDays int
		err = h.Pool.QueryRow(r.Context(), `
			SELECT name, student_limit, duration_days FROM subscription_plans WHERE id=$1
		`, planID).Scan(&planName, &studentLimit, &durationDays)
		if err == pgx.ErrNoRows {
			selected := ParseSelectedPackages(planID, nil)
			planName = EncodeSelectedPackages(selected)
			studentLimit = h.countActiveStudents(schoolID)
			durationDays = 30
		} else if err != nil {
			return nil, fmt.Errorf("get plan: %w", err)
		}

		now := time.Now()

		// Mark payment as verified
		_, _ = h.Pool.Exec(r.Context(), `
			UPDATE payment_requests SET status='verified', verified_at=$2, verified_by=$3 WHERE id=$1
		`, paymentID, now, ctx.UserID)

		// Deactivate old subscription
		_, _ = h.Pool.Exec(r.Context(), `
			UPDATE subscriptions SET status='cancelled', updated_at=NOW()
			WHERE school_id=$1 AND status IN ('active','trial')
		`, schoolID)

		// Create new active subscription
		endDate := now.AddDate(0, 0, durationDays)
		subID := store.NewID("sub")
		_, _ = h.Pool.Exec(r.Context(), `
			INSERT INTO subscriptions (id, school_id, plan_name, student_limit, price, currency, start_date, end_date, status, is_trial, trial_used, created_at, updated_at)
			VALUES ($1,$2,$3,$4,$5,'PKR',$6,$7,'active',false,true,NOW(),NOW())
		`, subID, schoolID, planName, studentLimit, amount, now, endDate)

		// Record history
		h.recordHistory(r.Context(), schoolID, planName, studentLimit, amount, "paid", now, endDate, "subscribe")

		if h.Store != nil {
			h.Store.Lock()
			h.Store.AuditLogs = append(h.Store.AuditLogs, &store.AuditLog{
				ID:         store.NewID("aud"),
				SchoolID:   schoolID,
				ActorID:    ctx.UserID,
				ActorRole:  ctx.Role,
				Action:     "payment_approval",
				EntityType: "payment",
				EntityID:   paymentID,
				After:      map[string]any{"plan": planName, "amount": amount, "end_date": endDate},
				CreatedAt:  now,
			})
			h.Store.Unlock()
		}

		return map[string]any{
			"payment_id":     paymentID,
			"subscription_id": subID,
			"school_id":      schoolID,
			"plan":           planName,
			"student_limit":  studentLimit,
			"end_date":       endDate,
			"verified":       true,
		}, nil
	}))
}

type rejectInput struct {
	Reason string `json:"reason"`
}

func (h *Handler) AdminRejectPayment(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	if ctx.Role != "super_admin" {
		api.WriteResult(w, api.Fail("FORBIDDEN", "Super admin access required.", 403, nil))
		return
	}
	paymentID := chi.URLParam(r, "id")
	var body rejectInput
	json.NewDecoder(r.Body).Decode(&body)
	api.WriteResult(w, api.ServiceTry(func() (map[string]any, error) {
		if h.Pool == nil {
			return h.adminRejectStorePayment(paymentID, ctx.UserID, body.Reason)
		}
		reason := body.Reason
		if reason == "" {
			reason = "Payment could not be verified."
		}
		_, err := h.Pool.Exec(r.Context(), `
			UPDATE payment_requests SET status='rejected', rejection_reason=$2, verified_at=NOW(), verified_by=$3 WHERE id=$1 AND status='pending'
		`, paymentID, reason, ctx.UserID)
		if err != nil {
			return nil, fmt.Errorf("reject: %w", err)
		}
		if h.Store != nil {
			h.Store.Lock()
			h.Store.AuditLogs = append(h.Store.AuditLogs, &store.AuditLog{
				ID:         store.NewID("aud"),
				ActorID:    ctx.UserID,
				ActorRole:  ctx.Role,
				Action:     "payment_rejection",
				EntityType: "payment",
				EntityID:   paymentID,
				After:      map[string]any{"reason": reason},
				CreatedAt:  time.Now(),
			})
			h.Store.Unlock()
		}
		return map[string]any{"id": paymentID, "rejected": true, "reason": reason}, nil
	}))
}

// ═══════════════════════════════════════════════════════════════════════════
// ASSIGN / EXTEND (Super Admin directly manages school subscriptions)
// ═══════════════════════════════════════════════════════════════════════════

type assignInput struct {
	SchoolID     string `json:"school_id"`
	PlanID       string `json:"plan_id"`
	StudentLimit int    `json:"student_limit"`
	DurationDays int    `json:"duration_days"`
	Price        int    `json:"price"`
}

func (h *Handler) AdminAssignPlan(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	if ctx.Role != "super_admin" {
		api.WriteResult(w, api.Fail("FORBIDDEN", "Super admin access required.", 403, nil))
		return
	}
	var body assignInput
	json.NewDecoder(r.Body).Decode(&body)
	api.WriteResult(w, api.ServiceTry(func() (map[string]any, error) {
		if body.SchoolID == "" {
			return nil, api.NewControlledError("VALIDATION_ERROR", "school_id required.", 400, nil)
		}
		// Get plan info
		planName := "custom"
		studentLimit := body.StudentLimit
		duration := body.DurationDays
		if duration < 1 {
			duration = 30
		}
		if body.PlanID != "" {
			var name string
			var limit, dur int
			err := h.Pool.QueryRow(r.Context(), "SELECT name, student_limit, duration_days FROM subscription_plans WHERE id=$1", body.PlanID).Scan(&name, &limit, &dur)
			if err == nil {
				planName = name
				if studentLimit == 0 {
					studentLimit = limit
				}
				if body.DurationDays == 0 {
					duration = dur
				}
			}
		}
		if studentLimit < 1 {
			studentLimit = 200
		}

		now := time.Now()
		endDate := now.AddDate(0, 0, duration)

		// Deactivate old
		_, _ = h.Pool.Exec(r.Context(), `UPDATE subscriptions SET status='cancelled', updated_at=NOW() WHERE school_id=$1 AND status IN ('active','trial')`, body.SchoolID)

		// Create new
		subID := store.NewID("sub")
		_, err := h.Pool.Exec(r.Context(), `
			INSERT INTO subscriptions (id, school_id, plan_name, student_limit, price, currency, start_date, end_date, status, is_trial, trial_used, created_at, updated_at)
			VALUES ($1,$2,$3,$4,$5,'PKR',$6,$7,'active',false,true,NOW(),NOW())
		`, subID, body.SchoolID, planName, studentLimit, body.Price, now, endDate)
		if err != nil {
			return nil, fmt.Errorf("assign: %w", err)
		}

		h.recordHistory(r.Context(), body.SchoolID, planName, studentLimit, body.Price, "paid", now, endDate, "assign")

		return map[string]any{"subscription_id": subID, "school_id": body.SchoolID, "plan": planName, "student_limit": studentLimit, "end_date": endDate}, nil
	}))
}

type extendInput struct {
	SchoolID string `json:"school_id"`
	Days     int    `json:"days"`
}

func (h *Handler) AdminExtendSubscription(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	if ctx.Role != "super_admin" {
		api.WriteResult(w, api.Fail("FORBIDDEN", "Super admin access required.", 403, nil))
		return
	}
	var body extendInput
	json.NewDecoder(r.Body).Decode(&body)
	api.WriteResult(w, api.ServiceTry(func() (map[string]any, error) {
		if body.SchoolID == "" || body.Days < 1 {
			return nil, api.NewControlledError("VALIDATION_ERROR", "school_id and days required.", 400, nil)
		}
		_, err := h.Pool.Exec(r.Context(), `
			UPDATE subscriptions SET end_date = end_date + ($2 || ' days')::interval, updated_at=NOW()
			WHERE school_id=$1 AND status IN ('active','trial')
		`, body.SchoolID, fmt.Sprintf("%d", body.Days))
		if err != nil {
			return nil, fmt.Errorf("extend: %w", err)
		}
		return map[string]any{"school_id": body.SchoolID, "extended_days": body.Days}, nil
	}))
}

// ═══════════════════════════════════════════════════════════════════════════
// ANALYTICS (Super Admin dashboard)
// ═══════════════════════════════════════════════════════════════════════════

func (h *Handler) AdminAnalytics(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	if ctx.Role != "super_admin" {
		api.WriteResult(w, api.Fail("FORBIDDEN", "Super admin access required.", 403, nil))
		return
	}
	api.WriteResult(w, api.ServiceTry(func() (map[string]any, error) {
		var totalSchools, activeSubs, expiredSubs, pendingPayments, trialUsers int
		var monthlyRevenue int

		h.Pool.QueryRow(r.Context(), "SELECT COUNT(*) FROM schools").Scan(&totalSchools)
		h.Pool.QueryRow(r.Context(), "SELECT COUNT(*) FROM subscriptions WHERE status='active'").Scan(&activeSubs)
		h.Pool.QueryRow(r.Context(), "SELECT COUNT(*) FROM subscriptions WHERE status='expired'").Scan(&expiredSubs)
		h.Pool.QueryRow(r.Context(), "SELECT COUNT(*) FROM payment_requests WHERE status='pending'").Scan(&pendingPayments)
		h.Pool.QueryRow(r.Context(), "SELECT COUNT(*) FROM subscriptions WHERE is_trial=true AND status='trial'").Scan(&trialUsers)
		h.Pool.QueryRow(r.Context(), `SELECT COALESCE(SUM(amount),0) FROM payment_requests WHERE status='verified' AND verified_at > NOW() - INTERVAL '30 days'`).Scan(&monthlyRevenue)

		return map[string]any{
			"total_schools":    totalSchools,
			"active_subs":     activeSubs,
			"expired_subs":    expiredSubs,
			"pending_payments": pendingPayments,
			"trial_users":     trialUsers,
			"monthly_revenue": monthlyRevenue,
		}, nil
	}))
}

// ═══════════════════════════════════════════════════════════════════════════
// IN-MEMORY STORE HELPERS (used when Pool == nil / dev mode)
// ═══════════════════════════════════════════════════════════════════════════

// firstNonEmptyString returns the first non-empty string from the arguments.
func firstNonEmptyString(values ...string) string {
	for _, v := range values {
		if v != "" {
			return v
		}
	}
	return ""
}

// adminListStorePayments returns payment requests from MemStore filtered by status.
func (h *Handler) adminListStorePayments(status string, allStatuses bool) []PaymentRequest {
	if h.Store == nil {
		return []PaymentRequest{}
	}
	h.Store.RLock()
	defer h.Store.RUnlock()
	payments := make([]PaymentRequest, 0)
	for _, t := range h.Store.Transactions {
		if !allStatuses && status != "" && t.Status != status {
			continue
		}
		var payDate *time.Time
		if !t.PaymentDate.IsZero() {
			d := t.PaymentDate
			payDate = &d
		}
		payments = append(payments, PaymentRequest{
			ID:              t.ID,
			SchoolID:        t.SchoolID,
			PlanID:          t.PackageID,
			SelectedPackages: t.SelectedPackages,
			PaymentMethodID: t.PaymentMethod,
			PaymentMethod:   t.PaymentMethod,
			ScreenshotURL:   t.ScreenshotURL,
			TransactionID:   t.ReferenceNo,
			Amount:          int(t.Amount),
			Status:          t.Status,
			SubmittedAt:     t.CreatedAt,
			PaymentDate:     payDate,
			Notes:           t.Notes,
			StudentCount:    h.countActiveStudents(t.SchoolID),
		})
	}
	return payments
}

// adminVerifyStorePayment verifies a payment in MemStore and activates the subscription.
func (h *Handler) adminVerifyStorePayment(paymentID, verifierID string) (map[string]any, error) {
	if h.Store == nil {
		return nil, api.NewControlledError("NOT_FOUND", "Payment request not found.", 404, nil)
	}
	h.Store.Lock()
	defer h.Store.Unlock()

	var found *store.Transaction
	for _, t := range h.Store.Transactions {
		if t.ID == paymentID && t.Status == "pending" {
			found = t
			break
		}
	}
	if found == nil {
		return nil, api.NewControlledError("NOT_FOUND", "Payment request not found or already processed.", 404, nil)
	}

	now := time.Now()
	found.Status = "verified"

	// Activate or update subscription in store
	selected := ParseSelectedPackages(found.PackageID, found.SelectedPackages)
	planName := EncodeSelectedPackages(selected)
	endDate := now.AddDate(0, 0, 30)

	var latest *store.Subscription
	for _, sub := range h.Store.Subscriptions {
		if sub.SchoolID == found.SchoolID && (sub.Status == "active" || sub.Status == "trial") {
			if latest == nil || sub.CreatedAt.After(latest.CreatedAt) {
				latest = sub
			}
		}
	}
	subID := store.NewID("sub")
	if latest != nil {
		latest.Status = "cancelled"
	}
	h.Store.Subscriptions = append(h.Store.Subscriptions, &store.Subscription{
		ID:               subID,
		SchoolID:         found.SchoolID,
		PackageID:        planName,
		SelectedPackages: selected,
		Status:           "active",
		NextRenewal:      endDate,
		CreatedAt:        now,
		UpdatedAt:        now,
	})
	h.Store.AuditLogs = append(h.Store.AuditLogs, &store.AuditLog{
		ID:         store.NewID("aud"),
		SchoolID:   found.SchoolID,
		ActorID:    verifierID,
		ActorRole:  "super_admin",
		Action:     "payment_approval",
		EntityType: "payment",
		EntityID:   paymentID,
		After:      map[string]any{"plan": planName, "end_date": endDate},
		CreatedAt:  now,
	})

	return map[string]any{
		"payment_id":      paymentID,
		"subscription_id": subID,
		"school_id":       found.SchoolID,
		"plan":            planName,
		"end_date":        endDate,
		"verified":        true,
	}, nil
}

// adminRejectStorePayment rejects a payment in MemStore.
func (h *Handler) adminRejectStorePayment(paymentID, verifierID, reason string) (map[string]any, error) {
	if h.Store == nil {
		return nil, api.NewControlledError("NOT_FOUND", "Payment request not found.", 404, nil)
	}
	h.Store.Lock()
	defer h.Store.Unlock()

	for _, t := range h.Store.Transactions {
		if t.ID == paymentID && t.Status == "pending" {
			t.Status = "rejected"
			if reason == "" {
				reason = "Payment could not be verified."
			}
			h.Store.AuditLogs = append(h.Store.AuditLogs, &store.AuditLog{
				ID:         store.NewID("aud"),
				SchoolID:   t.SchoolID,
				ActorID:    verifierID,
				ActorRole:  "super_admin",
				Action:     "payment_rejection",
				EntityType: "payment",
				EntityID:   paymentID,
				After:      map[string]any{"reason": reason},
				CreatedAt:  time.Now(),
			})
			return map[string]any{"id": paymentID, "rejected": true, "reason": reason}, nil
		}
	}
	return nil, api.NewControlledError("NOT_FOUND", "Payment request not found or already processed.", 404, nil)
}

// helper to suppress unused import
var _ = fmt.Sprintf
