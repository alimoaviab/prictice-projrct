// Package packages implements /api/super-admin/packages endpoints.
// Packages are the core business module controlling school limits and features.
package packages

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
	Store   *store.MemStore
	Persist func(table string, doc any)
}

func New(s *store.MemStore) *Handler { return &Handler{Store: s, Persist: func(string, any) {}} }
func NewWithPersist(s *store.MemStore, save func(string, any)) *Handler {
	if save == nil {
		save = func(string, any) {}
	}
	return &Handler{Store: s, Persist: save}
}

type PackageInput struct {
	Name                string    `json:"name"`
	Price               float64   `json:"price"`
	BillingCycle        string    `json:"billing_cycle"`
	ExpiryDate          time.Time `json:"expiry_date"`
	StudentLimit        int       `json:"student_limit"`
	TeacherLimit        int       `json:"teacher_limit"`
	ParentLimit         int       `json:"parent_limit"`
	ClassLimit          int       `json:"class_limit"`
	StorageLimitMB      int       `json:"storage_limit_mb"`
	ChatbotMonthlyLimit int       `json:"chatbot_monthly_limit"`
	AIUsageLimit        int       `json:"ai_usage_limit"`
	QuestionGenLimit    int       `json:"question_gen_limit"`
	ExamGenLimit        int       `json:"exam_gen_limit"`
	LiveClassesLimit    int       `json:"live_classes_limit"`
	BroadcastLimit      int       `json:"broadcast_limit"`
	SupportType         string    `json:"support_type"`
	CustomModules       []string  `json:"custom_modules"`
	ModAttendance       bool      `json:"mod_attendance"`
	ModHomework         bool      `json:"mod_homework"`
	ModExams            bool      `json:"mod_exams"`
	ModQuestionBank     bool      `json:"mod_question_bank"`
	ModLiveClasses      bool      `json:"mod_live_classes"`
	ModBroadcast        bool      `json:"mod_broadcast"`
	ModFees             bool      `json:"mod_fees"`
	ModBehavior         bool      `json:"mod_behavior"`
	ModCertificates     bool      `json:"mod_certificates"`
	ModAnalytics        bool      `json:"mod_analytics"`
	Status              string    `json:"status"`
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	if ctx.Role != "super_admin" {
		api.WriteResult(w, api.Fail("FORBIDDEN", "Super admin access required.", 403, nil))
		return
	}

	var body PackageInput
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid request body.", 400, nil))
		return
	}

	if body.Name == "" {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Package name is required.", 400, nil))
		return
	}

	now := time.Now()
	doc := &store.Package{
		ID:                  store.NewID("pkg"),
		Name:                body.Name,
		Price:               body.Price,
		BillingCycle:        body.BillingCycle,
		StartDate:           now,
		ExpiryDate:          body.ExpiryDate,
		StudentLimit:        body.StudentLimit,
		TeacherLimit:        body.TeacherLimit,
		ParentLimit:         body.ParentLimit,
		ClassLimit:          body.ClassLimit,
		StorageLimitMB:      body.StorageLimitMB,
		ChatbotMonthlyLimit: body.ChatbotMonthlyLimit,
		AIUsageLimit:        body.AIUsageLimit,
		QuestionGenLimit:    body.QuestionGenLimit,
		ExamGenLimit:        body.ExamGenLimit,
		LiveClassesLimit:    body.LiveClassesLimit,
		BroadcastLimit:      body.BroadcastLimit,
		SupportType:         body.SupportType,
		CustomModules:       body.CustomModules,
		ModAttendance:       body.ModAttendance,
		ModHomework:         body.ModHomework,
		ModExams:            body.ModExams,
		ModQuestionBank:     body.ModQuestionBank,
		ModLiveClasses:      body.ModLiveClasses,
		ModBroadcast:        body.ModBroadcast,
		ModFees:             body.ModFees,
		ModBehavior:         body.ModBehavior,
		ModCertificates:     body.ModCertificates,
		ModAnalytics:        body.ModAnalytics,
		Status:              "active",
		CreatedAt:           now,
		UpdatedAt:           now,
	}

	h.Store.Lock()
	h.Store.Packages = append(h.Store.Packages, doc)
	h.Store.Unlock()

	h.Persist("packages", doc)

	api.WriteResult(w, api.Ok(map[string]any{"success": true, "package": doc}))
}

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
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

	packages := make([]*store.Package, 0)
	for _, p := range h.Store.Packages {
		if statusFilter != "" && p.Status != statusFilter {
			continue
		}
		if search != "" && !strings.Contains(strings.ToLower(p.Name), search) {
			continue
		}
		packages = append(packages, p)
	}

	sort.SliceStable(packages, func(i, j int) bool {
		return packages[i].CreatedAt.After(packages[j].CreatedAt)
	})

	api.WriteResult(w, api.Ok(map[string]any{"items": packages, "total": len(packages)}))
}

func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	if ctx.Role != "super_admin" && ctx.Role != "admin" {
		api.WriteResult(w, api.Fail("FORBIDDEN", "Super admin access required.", 403, nil))
		return
	}

	id := chi.URLParam(r, "id")
	h.Store.RLock()
	defer h.Store.RUnlock()

	for _, p := range h.Store.Packages {
		if p.ID == id {
			api.WriteResult(w, api.Ok(p))
			return
		}
	}
	api.WriteResult(w, api.Fail("NOT_FOUND", "Package not found.", 404, nil))
}

func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	if ctx.Role != "super_admin" {
		api.WriteResult(w, api.Fail("FORBIDDEN", "Super admin access required.", 403, nil))
		return
	}

	id := chi.URLParam(r, "id")
	var body PackageInput
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid request body.", 400, nil))
		return
	}

	h.Store.Lock()
	defer h.Store.Unlock()

	for _, p := range h.Store.Packages {
		if p.ID == id {
			if body.Name != "" {
				p.Name = body.Name
			}
			p.Price = body.Price
			p.BillingCycle = body.BillingCycle
			p.ExpiryDate = body.ExpiryDate
			p.StudentLimit = body.StudentLimit
			p.TeacherLimit = body.TeacherLimit
			p.ParentLimit = body.ParentLimit
			p.ClassLimit = body.ClassLimit
			p.StorageLimitMB = body.StorageLimitMB
			p.ChatbotMonthlyLimit = body.ChatbotMonthlyLimit
			p.AIUsageLimit = body.AIUsageLimit
			p.QuestionGenLimit = body.QuestionGenLimit
			p.ExamGenLimit = body.ExamGenLimit
			p.LiveClassesLimit = body.LiveClassesLimit
			p.BroadcastLimit = body.BroadcastLimit
			p.SupportType = body.SupportType
			p.CustomModules = body.CustomModules
			p.ModAttendance = body.ModAttendance
			p.ModHomework = body.ModHomework
			p.ModExams = body.ModExams
			p.ModQuestionBank = body.ModQuestionBank
			p.ModLiveClasses = body.ModLiveClasses
			p.ModBroadcast = body.ModBroadcast
			p.ModFees = body.ModFees
			p.ModBehavior = body.ModBehavior
			p.ModCertificates = body.ModCertificates
			p.ModAnalytics = body.ModAnalytics
			if body.Status != "" {
				p.Status = body.Status
			}
			p.UpdatedAt = time.Now()

			h.Persist("packages", p)

			api.WriteResult(w, api.Ok(map[string]any{"success": true, "package": p}))
			return
		}
	}
	api.WriteResult(w, api.Fail("NOT_FOUND", "Package not found.", 404, nil))
}

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	if ctx.Role != "super_admin" {
		api.WriteResult(w, api.Fail("FORBIDDEN", "Super admin access required.", 403, nil))
		return
	}

	id := chi.URLParam(r, "id")
	h.Store.Lock()
	defer h.Store.Unlock()

	for i, p := range h.Store.Packages {
		if p.ID == id {
			h.Store.Packages = append(h.Store.Packages[:i], h.Store.Packages[i+1:]...)
			h.Persist("packages:delete", id)
			api.WriteResult(w, api.Ok(map[string]any{"success": true}))
			return
		}
	}
	api.WriteResult(w, api.Fail("NOT_FOUND", "Package not found.", 404, nil))
}

func (h *Handler) Toggle(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	if ctx.Role != "super_admin" {
		api.WriteResult(w, api.Fail("FORBIDDEN", "Super admin access required.", 403, nil))
		return
	}

	id := chi.URLParam(r, "id")
	var body struct {
		Status string `json:"status"`
	}
	json.NewDecoder(r.Body).Decode(&body)

	h.Store.Lock()
	defer h.Store.Unlock()

	for _, p := range h.Store.Packages {
		if p.ID == id {
			p.Status = body.Status
			p.UpdatedAt = time.Now()
			h.Persist("packages", p)
			api.WriteResult(w, api.Ok(map[string]any{"success": true, "package": p}))
			return
		}
	}
	api.WriteResult(w, api.Fail("NOT_FOUND", "Package not found.", 404, nil))
}
