// Package chapters implements /api/chapters endpoints.
// Structure: Class → Subject → Chapters → Questions
package chapters

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

// ─── List (by class_id + subject_id) ─────────────────────────────────────

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	q := r.URL.Query()
	classID := q.Get("class_id")
	subjectID := q.Get("subject_id")
	subject := q.Get("subject") // name-based filter

	h.Store.RLock()
	defer h.Store.RUnlock()

	out := make([]map[string]any, 0)
	for _, ch := range h.Store.Chapters {
		if ch.SchoolID != ctx.SchoolID {
			continue
		}
		if classID != "" && ch.ClassID != classID {
			continue
		}
		if subjectID != "" && ch.SubjectID != subjectID {
			continue
		}
		if subject != "" && !strings.EqualFold(ch.SubjectName, subject) {
			continue
		}
		if ch.Status == "archived" && q.Get("include_archived") != "true" {
			continue
		}
		out = append(out, chapterToMap(ch))
	}
	sort.Slice(out, func(i, j int) bool {
		a := out[i]["chapter_number"].(int)
		b := out[j]["chapter_number"].(int)
		return a < b
	})
	api.WriteResult(w, api.Ok(out))
}

// ─── Create ──────────────────────────────────────────────────────────────

type createInput struct {
	ClassID       string `json:"class_id"`
	SubjectID     string `json:"subject_id"`
	SubjectName   string `json:"subject_name"`
	Title         string `json:"title"`
	ChapterNumber int    `json:"chapter_number"`
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	var body createInput
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid JSON body.", 400, nil))
		return
	}
	if strings.TrimSpace(body.Title) == "" || body.ClassID == "" {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "title and class_id are required.", 400, nil))
		return
	}

	// Auto-assign chapter number if not provided
	if body.ChapterNumber == 0 {
		h.Store.RLock()
		maxNum := 0
		for _, ch := range h.Store.Chapters {
			if ch.SchoolID == ctx.SchoolID && ch.ClassID == body.ClassID &&
				ch.SubjectID == body.SubjectID && ch.ChapterNumber > maxNum {
				maxNum = ch.ChapterNumber
			}
		}
		h.Store.RUnlock()
		body.ChapterNumber = maxNum + 1
	}

	// Resolve subject name if not provided
	if body.SubjectName == "" && body.SubjectID != "" {
		h.Store.RLock()
		for _, s := range h.Store.Subjects {
			if s.ID == body.SubjectID {
				body.SubjectName = s.Name
				break
			}
		}
		h.Store.RUnlock()
	}

	now := time.Now()
	ch := &store.Chapter{
		ID:            store.NewID("ch"),
		SchoolID:      ctx.SchoolID,
		ClassID:       body.ClassID,
		SubjectID:     body.SubjectID,
		SubjectName:   body.SubjectName,
		Title:         strings.TrimSpace(body.Title),
		ChapterNumber: body.ChapterNumber,
		Status:        "active",
		CreatedAt:     now,
		UpdatedAt:     now,
	}

	h.Store.Lock()
	h.Store.Chapters = append(h.Store.Chapters, ch)
	h.Store.Unlock()
	h.Save("chapters", ch)

	api.WriteResult(w, api.Ok(chapterToMap(ch)))
}

// ─── Archive ─────────────────────────────────────────────────────────────

func (h *Handler) Archive(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	id := chi.URLParam(r, "id")

	h.Store.Lock()
	defer h.Store.Unlock()
	for _, ch := range h.Store.Chapters {
		if ch.ID == id && ch.SchoolID == ctx.SchoolID {
			ch.Status = "archived"
			ch.UpdatedAt = time.Now()
			h.Save("chapters", ch)
			api.WriteResult(w, api.Ok(chapterToMap(ch)))
			return
		}
	}
	api.WriteResult(w, api.Fail("NOT_FOUND", "Chapter not found.", 404, nil))
}

// ─── Reorder ─────────────────────────────────────────────────────────────

type reorderInput struct {
	IDs []string `json:"ids"` // ordered list of chapter IDs
}

func (h *Handler) Reorder(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	var body reorderInput
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid JSON body.", 400, nil))
		return
	}

	h.Store.Lock()
	defer h.Store.Unlock()
	for newOrder, id := range body.IDs {
		for _, ch := range h.Store.Chapters {
			if ch.ID == id && ch.SchoolID == ctx.SchoolID {
				ch.ChapterNumber = newOrder + 1
				ch.UpdatedAt = time.Now()
				h.Save("chapters", ch)
				break
			}
		}
	}
	api.WriteResult(w, api.Ok(map[string]any{"success": true}))
}

// ─── Draft Save/Load ─────────────────────────────────────────────────────

func (h *Handler) SaveDraft(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	var body map[string]any
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid JSON body.", 400, nil))
		return
	}

	draftJSON, _ := json.Marshal(body)
	now := time.Now()

	h.Store.Lock()
	// Find existing draft for this teacher
	var existing *store.PaperDraft
	for _, d := range h.Store.PaperDrafts {
		if d.TeacherID == ctx.UserID && d.SchoolID == ctx.SchoolID {
			existing = d
			break
		}
	}
	if existing != nil {
		existing.PaperDataJSON = string(draftJSON)
		existing.UpdatedAt = now
		h.Save("paper_drafts", existing)
	} else {
		draft := &store.PaperDraft{
			ID:            store.NewID("draft"),
			TeacherID:     ctx.UserID,
			SchoolID:      ctx.SchoolID,
			PaperDataJSON: string(draftJSON),
			UpdatedAt:     now,
		}
		h.Store.PaperDrafts = append(h.Store.PaperDrafts, draft)
		h.Save("paper_drafts", draft)
	}
	h.Store.Unlock()

	api.WriteResult(w, api.Ok(map[string]any{"saved": true, "updated_at": now}))
}

func (h *Handler) LoadDraft(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)

	h.Store.RLock()
	defer h.Store.RUnlock()
	for _, d := range h.Store.PaperDrafts {
		if d.TeacherID == ctx.UserID && d.SchoolID == ctx.SchoolID {
			var data map[string]any
			_ = json.Unmarshal([]byte(d.PaperDataJSON), &data)
			api.WriteResult(w, api.Ok(map[string]any{
				"has_draft":  true,
				"data":       data,
				"updated_at": d.UpdatedAt,
			}))
			return
		}
	}
	api.WriteResult(w, api.Ok(map[string]any{"has_draft": false}))
}

func (h *Handler) DiscardDraft(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)

	h.Store.Lock()
	defer h.Store.Unlock()
	for i, d := range h.Store.PaperDrafts {
		if d.TeacherID == ctx.UserID && d.SchoolID == ctx.SchoolID {
			h.Store.PaperDrafts = append(h.Store.PaperDrafts[:i], h.Store.PaperDrafts[i+1:]...)
			h.Save("paper_drafts:delete", d.ID)
			break
		}
	}
	api.WriteResult(w, api.Ok(map[string]any{"discarded": true}))
}

// ─── Helpers ─────────────────────────────────────────────────────────────

func chapterToMap(ch *store.Chapter) map[string]any {
	return map[string]any{
		"_id":            ch.ID,
		"school_id":      ch.SchoolID,
		"class_id":       ch.ClassID,
		"subject_id":     ch.SubjectID,
		"subject_name":   ch.SubjectName,
		"title":          ch.Title,
		"chapter_number": ch.ChapterNumber,
		"status":         ch.Status,
		"created_at":     ch.CreatedAt,
		"updated_at":     ch.UpdatedAt,
	}
}
