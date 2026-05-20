// Package questionbank implements /api/question-bank endpoints.
package questionbank

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
	Save  func(string, any)
}

func New(s *store.MemStore, save func(string, any)) *Handler {
	if save == nil {
		save = func(string, any) {}
	}
	return &Handler{Store: s, Save: save}
}

// ─── List ────────────────────────────────────────────────────────────────

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	q := r.URL.Query()

	h.Store.RLock()
	defer h.Store.RUnlock()

	out := make([]map[string]any, 0)
	for _, bq := range h.Store.BankQuestions {
		// Visibility rules:
		// - Teachers see: their own questions (any status) + globally approved questions
		// - Admins see: their school's questions + globally approved
		isOwner := bq.CreatedBy == ctx.UserID
		isSchoolQuestion := bq.SchoolID == ctx.SchoolID
		isGlobalApproved := bq.Visibility == "global" && bq.ApprovalStatus == "approved"

		if !isOwner && !isSchoolQuestion && !isGlobalApproved {
			continue
		}
		// Non-owners can only see approved global or their school's active questions
		if !isOwner && !isGlobalApproved && bq.ApprovalStatus != "approved" {
			continue
		}

		// Filters
		if v := q.Get("status"); v != "" && bq.Status != v {
			continue
		}
		if v := q.Get("board"); v != "" && !strings.EqualFold(bq.Board, v) {
			continue
		}
		if v := q.Get("class_id"); v != "" && bq.ClassID != v {
			continue
		}
		if v := q.Get("subject"); v != "" && !strings.EqualFold(bq.Subject, v) {
			continue
		}
		if v := q.Get("chapter"); v != "" && !strings.EqualFold(bq.Chapter, v) {
			continue
		}
		if v := q.Get("type"); v != "" && bq.Type != v {
			continue
		}
		if v := q.Get("difficulty"); v != "" && bq.Difficulty != v {
			continue
		}
		if v := q.Get("approval_status"); v != "" && bq.ApprovalStatus != v {
			continue
		}
		if v := q.Get("visibility"); v != "" && bq.Visibility != v {
			continue
		}
		if v := q.Get("search"); v != "" {
			search := strings.ToLower(v)
			if !strings.Contains(strings.ToLower(bq.QuestionHTML), search) &&
				!strings.Contains(strings.ToLower(bq.Subject), search) &&
				!strings.Contains(strings.ToLower(bq.Chapter), search) {
				continue
			}
		}
		out = append(out, h.toMap(bq))
	}
	sort.Slice(out, func(i, j int) bool {
		return out[i]["created_at"].(time.Time).After(out[j]["created_at"].(time.Time))
	})
	api.WriteResult(w, api.Ok(out))
}

// ─── Create ──────────────────────────────────────────────────────────────

type createInput struct {
	Board        string          `json:"board"`
	ClassID      string          `json:"class_id"`
	Subject      string          `json:"subject"`
	Chapter      string          `json:"chapter"`
	Type         string          `json:"type"`
	Difficulty   string          `json:"difficulty"`
	QuestionHTML string          `json:"question_html"`
	Options      json.RawMessage `json:"options"`
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	var body createInput
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid JSON body.", 400, nil))
		return
	}
	if strings.TrimSpace(body.QuestionHTML) == "" || body.ClassID == "" {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "question_html and class_id are required.", 400, nil))
		return
	}

	// Resolve class name
	h.Store.RLock()
	className := ""
	for _, c := range h.Store.Classes {
		if c.ID == body.ClassID {
			className = c.Name
			break
		}
	}
	h.Store.RUnlock()

	now := time.Now()
	bq := &store.BankQuestion{
		ID:             store.NewID("bq"),
		SchoolID:       ctx.SchoolID,
		CreatedBy:      ctx.UserID,
		Board:          body.Board,
		ClassID:        body.ClassID,
		ClassName:      className,
		Subject:        body.Subject,
		Chapter:        body.Chapter,
		Type:           orDefault(body.Type, "short"),
		Difficulty:     orDefault(body.Difficulty, "medium"),
		QuestionHTML:   body.QuestionHTML,
		Options:        string(body.Options),
		Status:         "active",
		Visibility:     "private",  // Private until approved
		ApprovalStatus: "pending",  // Pending super admin review
		CreatedAt:      now,
	}

	h.Store.Lock()
	h.Store.BankQuestions = append(h.Store.BankQuestions, bq)
	h.Store.Unlock()
	h.Save("bank_questions", bq)

	api.WriteResult(w, api.Ok(h.toMap(bq)))
}

// ─── Archive / Restore ───────────────────────────────────────────────────

func (h *Handler) Archive(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	id := chi.URLParam(r, "id")

	h.Store.Lock()
	defer h.Store.Unlock()
	for _, bq := range h.Store.BankQuestions {
		if bq.ID == id && bq.SchoolID == ctx.SchoolID {
			bq.Status = "archived"
			h.Save("bank_questions", bq)
			api.WriteResult(w, api.Ok(h.toMap(bq)))
			return
		}
	}
	api.WriteResult(w, api.Fail("NOT_FOUND", "Question not found.", 404, nil))
}

func (h *Handler) Restore(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	id := chi.URLParam(r, "id")

	h.Store.Lock()
	defer h.Store.Unlock()
	for _, bq := range h.Store.BankQuestions {
		if bq.ID == id && bq.SchoolID == ctx.SchoolID {
			bq.Status = "active"
			h.Save("bank_questions", bq)
			api.WriteResult(w, api.Ok(h.toMap(bq)))
			return
		}
	}
	api.WriteResult(w, api.Fail("NOT_FOUND", "Question not found.", 404, nil))
}

// ─── Star / Unstar (per teacher) ─────────────────────────────────────────

func (h *Handler) Star(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	id := chi.URLParam(r, "id")

	h.Store.Lock()
	defer h.Store.Unlock()

	// Check if already starred
	for _, s := range h.Store.QuestionStars {
		if s.QuestionID == id && s.TeacherID == ctx.UserID {
			api.WriteResult(w, api.Ok(map[string]any{"starred": true}))
			return
		}
	}
	star := &store.QuestionStar{
		ID:         store.NewID("qs"),
		QuestionID: id,
		TeacherID:  ctx.UserID,
	}
	h.Store.QuestionStars = append(h.Store.QuestionStars, star)
	h.Save("question_stars", star)
	api.WriteResult(w, api.Ok(map[string]any{"starred": true}))
}

func (h *Handler) Unstar(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	id := chi.URLParam(r, "id")

	h.Store.Lock()
	defer h.Store.Unlock()
	for i, s := range h.Store.QuestionStars {
		if s.QuestionID == id && s.TeacherID == ctx.UserID {
			h.Store.QuestionStars = append(h.Store.QuestionStars[:i], h.Store.QuestionStars[i+1:]...)
			h.Save("question_stars:delete", s.ID)
			break
		}
	}
	api.WriteResult(w, api.Ok(map[string]any{"starred": false}))
}

func (h *Handler) GetStarred(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)

	h.Store.RLock()
	defer h.Store.RUnlock()
	ids := make([]string, 0)
	for _, s := range h.Store.QuestionStars {
		if s.TeacherID == ctx.UserID {
			ids = append(ids, s.QuestionID)
		}
	}
	api.WriteResult(w, api.Ok(ids))
}

// ─── Moderation (Super Admin) ────────────────────────────────────────────

// ListPending returns all questions with approval_status=pending across ALL schools.
// Only super_admin should call this.
func (h *Handler) ListPending(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	statusFilter := q.Get("approval_status")
	if statusFilter == "" {
		statusFilter = "pending"
	}

	h.Store.RLock()
	defer h.Store.RUnlock()

	out := make([]map[string]any, 0)
	for _, bq := range h.Store.BankQuestions {
		if bq.ApprovalStatus != statusFilter {
			continue
		}
		out = append(out, h.toMap(bq))
	}
	sort.Slice(out, func(i, j int) bool {
		return out[i]["created_at"].(time.Time).After(out[j]["created_at"].(time.Time))
	})
	api.WriteResult(w, api.Ok(out))
}

// Approve makes a question globally visible.
func (h *Handler) Approve(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	id := chi.URLParam(r, "id")

	h.Store.Lock()
	defer h.Store.Unlock()
	for _, bq := range h.Store.BankQuestions {
		if bq.ID == id {
			now := time.Now()
			bq.ApprovalStatus = "approved"
			bq.Visibility = "global"
			bq.ApprovedBy = ctx.UserID
			bq.ApprovedAt = &now
			h.Save("bank_questions", bq)
			api.WriteResult(w, api.Ok(h.toMap(bq)))
			return
		}
	}
	api.WriteResult(w, api.Fail("NOT_FOUND", "Question not found.", 404, nil))
}

// Reject keeps the question private to the creator.
func (h *Handler) Reject(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	h.Store.Lock()
	defer h.Store.Unlock()
	for _, bq := range h.Store.BankQuestions {
		if bq.ID == id {
			bq.ApprovalStatus = "rejected"
			bq.Visibility = "private"
			h.Save("bank_questions", bq)
			api.WriteResult(w, api.Ok(h.toMap(bq)))
			return
		}
	}
	api.WriteResult(w, api.Fail("NOT_FOUND", "Question not found.", 404, nil))
}

// Edit allows the creator teacher to edit their own pending/rejected question.
func (h *Handler) Edit(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	id := chi.URLParam(r, "id")

	var body createInput
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid JSON body.", 400, nil))
		return
	}

	h.Store.Lock()
	defer h.Store.Unlock()
	for _, bq := range h.Store.BankQuestions {
		if bq.ID == id {
			// Only creator can edit
			if bq.CreatedBy != ctx.UserID {
				api.WriteResult(w, api.Fail("FORBIDDEN", "Only the creator can edit this question.", 403, nil))
				return
			}
			// Cannot edit approved questions directly
			if bq.ApprovalStatus == "approved" {
				api.WriteResult(w, api.Fail("FORBIDDEN", "Approved questions cannot be edited directly. Duplicate it instead.", 403, nil))
				return
			}
			// Apply edits
			if body.QuestionHTML != "" {
				bq.QuestionHTML = body.QuestionHTML
			}
			if body.Board != "" {
				bq.Board = body.Board
			}
			if body.Subject != "" {
				bq.Subject = body.Subject
			}
			if body.Chapter != "" {
				bq.Chapter = body.Chapter
			}
			if body.Type != "" {
				bq.Type = body.Type
			}
			if body.Difficulty != "" {
				bq.Difficulty = body.Difficulty
			}
			if len(body.Options) > 0 {
				bq.Options = string(body.Options)
			}
			// Reset to pending after edit
			bq.ApprovalStatus = "pending"
			h.Save("bank_questions", bq)
			api.WriteResult(w, api.Ok(h.toMap(bq)))
			return
		}
	}
	api.WriteResult(w, api.Fail("NOT_FOUND", "Question not found.", 404, nil))
}

// ─── Collections ─────────────────────────────────────────────────────────

func (h *Handler) ListCollections(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	h.Store.RLock()
	defer h.Store.RUnlock()

	out := make([]map[string]any, 0)
	for _, c := range h.Store.StarCollections {
		if c.UserID == ctx.UserID {
			out = append(out, map[string]any{
				"_id": c.ID, "name": c.Name, "color": c.Color, "created_at": c.CreatedAt,
			})
		}
	}
	api.WriteResult(w, api.Ok(out))
}

func (h *Handler) CreateCollection(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	var body struct {
		Name  string `json:"name"`
		Color string `json:"color"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.Name == "" {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Name is required.", 400, nil))
		return
	}
	now := time.Now()
	c := &store.StarCollection{
		ID: store.NewID("col"), UserID: ctx.UserID, SchoolID: ctx.SchoolID,
		Name: body.Name, Color: body.Color, CreatedAt: now,
	}
	h.Store.Lock()
	h.Store.StarCollections = append(h.Store.StarCollections, c)
	h.Store.Unlock()
	h.Save("star_collections", c)
	api.WriteResult(w, api.Ok(map[string]any{"_id": c.ID, "name": c.Name, "color": c.Color}))
}

func (h *Handler) DeleteCollection(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	id := chi.URLParam(r, "id")
	h.Store.Lock()
	defer h.Store.Unlock()
	for i, c := range h.Store.StarCollections {
		if c.ID == id && c.UserID == ctx.UserID {
			h.Store.StarCollections = append(h.Store.StarCollections[:i], h.Store.StarCollections[i+1:]...)
			h.Save("star_collections:delete", id)
			api.WriteResult(w, api.Ok(map[string]any{"deleted": true}))
			return
		}
	}
	api.WriteResult(w, api.Fail("NOT_FOUND", "Collection not found.", 404, nil))
}

// ─── Helpers ─────────────────────────────────────────────────────────────

func (h *Handler) toMap(bq *store.BankQuestion) map[string]any {
	m := map[string]any{
		"_id":             bq.ID,
		"school_id":       bq.SchoolID,
		"created_by":      bq.CreatedBy,
		"created_by_name": bq.CreatedByName,
		"school_name":     bq.SchoolName,
		"board":           bq.Board,
		"class_id":        bq.ClassID,
		"class_name":      bq.ClassName,
		"subject":         bq.Subject,
		"chapter":         bq.Chapter,
		"type":            bq.Type,
		"difficulty":      bq.Difficulty,
		"question_html":   bq.QuestionHTML,
		"status":          bq.Status,
		"visibility":      bq.Visibility,
		"approval_status": bq.ApprovalStatus,
		"approved_by":     bq.ApprovedBy,
		"approved_at":     bq.ApprovedAt,
		"created_at":      bq.CreatedAt,
	}
	if bq.Options != "" && bq.Options != "null" {
		var opts []map[string]any
		if err := json.Unmarshal([]byte(bq.Options), &opts); err == nil {
			m["options"] = opts
		}
	}
	return m
}

func orDefault(val, def string) string {
	if val == "" {
		return def
	}
	return val
}
