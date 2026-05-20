// Package questionpapers implements /api/question-papers endpoints.
package questionpapers

import (
	"encoding/json"
	"net/http"
	"sort"
	"strings"
	"time"

	"github.com/eduplexo/backend-go/internal/api"
	"github.com/eduplexo/backend-go/internal/auth"
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

type createInput struct {
	Title     string          `json:"title"`
	ClassID   string          `json:"class_id"`
	TeacherID string          `json:"teacher_id"`
	Date      string          `json:"date"`
	Questions json.RawMessage `json:"questions"`
}

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	if err := auth.AssertPermission(ctx, "exams", auth.ActionView); err != nil {
		api.WriteResult(w, api.Fail("FORBIDDEN", err.Error(), 403, nil))
		return
	}

	h.Store.RLock()
	defer h.Store.RUnlock()

	out := make([]map[string]any, 0)
	for _, qp := range h.Store.QuestionPapers {
		if qp.SchoolID != ctx.SchoolID {
			continue
		}
		out = append(out, h.toMap(qp))
	}
	sort.Slice(out, func(i, j int) bool {
		return out[i]["created_at"].(time.Time).After(out[j]["created_at"].(time.Time))
	})
	api.WriteResult(w, api.Ok(out))
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	var body createInput
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid JSON body.", 400, nil))
		return
	}
	if strings.TrimSpace(body.Title) == "" || body.ClassID == "" {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Title and class_id are required.", 400, nil))
		return
	}

	// Resolve names
	h.Store.RLock()
	className := ""
	for _, c := range h.Store.Classes {
		if c.ID == body.ClassID {
			className = c.Name
			break
		}
	}
	teacherName := ""
	if body.TeacherID != "" {
		for _, t := range h.Store.Teachers {
			if t.ID == body.TeacherID {
				teacherName = t.FirstName + " " + t.LastName
				break
			}
		}
	}
	h.Store.RUnlock()

	now := time.Now()
	qp := &store.QuestionPaper{
		ID:          store.NewID("qp"),
		SchoolID:    ctx.SchoolID,
		Title:       strings.TrimSpace(body.Title),
		ClassID:     body.ClassID,
		ClassName:   className,
		TeacherID:   body.TeacherID,
		TeacherName: teacherName,
		Date:        body.Date,
		Questions:   string(body.Questions),
		Status:      "draft",
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	h.Store.Lock()
	h.Store.QuestionPapers = append(h.Store.QuestionPapers, qp)
	h.Store.Unlock()
	h.Save("question_papers", qp)

	api.WriteResult(w, api.Ok(h.toMap(qp)))
}

func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	id := chi.URLParam(r, "id")

	h.Store.RLock()
	defer h.Store.RUnlock()
	for _, qp := range h.Store.QuestionPapers {
		if qp.ID == id && qp.SchoolID == ctx.SchoolID {
			api.WriteResult(w, api.Ok(h.toMap(qp)))
			return
		}
	}
	api.WriteResult(w, api.Fail("NOT_FOUND", "Question paper not found.", 404, nil))
}

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	id := chi.URLParam(r, "id")

	h.Store.Lock()
	defer h.Store.Unlock()
	for i, qp := range h.Store.QuestionPapers {
		if qp.ID == id && qp.SchoolID == ctx.SchoolID {
			h.Store.QuestionPapers = append(h.Store.QuestionPapers[:i], h.Store.QuestionPapers[i+1:]...)
			h.Save("question_papers:delete", id)
			api.WriteResult(w, api.Ok(map[string]any{"success": true}))
			return
		}
	}
	api.WriteResult(w, api.Fail("NOT_FOUND", "Question paper not found.", 404, nil))
}

func (h *Handler) toMap(qp *store.QuestionPaper) map[string]any {
	return map[string]any{
		"_id":          qp.ID,
		"school_id":    qp.SchoolID,
		"title":        qp.Title,
		"class_id":     qp.ClassID,
		"class_name":   qp.ClassName,
		"teacher_id":   qp.TeacherID,
		"teacher_name": qp.TeacherName,
		"date":         qp.Date,
		"questions":    qp.Questions,
		"status":       qp.Status,
		"created_at":   qp.CreatedAt,
		"updated_at":   qp.UpdatedAt,
	}
}
