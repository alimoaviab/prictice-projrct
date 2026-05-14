// Package results implements /api/results endpoints. Mirrors
// old-app/shared/services/result.service.ts. Includes the grade calc
// (`calculateGrade`) and the upsert-by-(exam, student) save behavior.
package results

import (
	"encoding/json"
	"net/http"
	"sort"
	"time"

	"github.com/eduplexo/backend-go/internal/api"
	"github.com/eduplexo/backend-go/internal/audit"
	"github.com/eduplexo/backend-go/internal/auth"
	"github.com/eduplexo/backend-go/internal/domain/tenant"
	"github.com/eduplexo/backend-go/internal/store"
	"github.com/go-chi/chi/v5"
)

type Handler struct{ Store *store.MemStore }

func New(s *store.MemStore) *Handler { return &Handler{Store: s} }

// calculateGrade matches the original `calculateGrade` thresholds.
func calculateGrade(obtained, max float64) string {
	if max == 0 {
		return "F"
	}
	p := (obtained / max) * 100
	switch {
	case p >= 90:
		return "A+"
	case p >= 80:
		return "A"
	case p >= 70:
		return "B"
	case p >= 60:
		return "C"
	case p >= 50:
		return "D"
	default:
		return "F"
	}
}

func (h *Handler) hydrate(rows []*store.Result) []map[string]any {
	studentByID := map[string]*store.Student{}
	classByID := map[string]*store.Class{}
	examByID := map[string]*store.Exam{}
	for _, s := range h.Store.Students {
		studentByID[s.ID] = s
	}
	for _, c := range h.Store.Classes {
		classByID[c.ID] = c
	}
	for _, e := range h.Store.Exams {
		examByID[e.ID] = e
	}
	out := make([]map[string]any, 0, len(rows))
	for _, r := range rows {
		stu := studentByID[r.StudentID]
		cls := classByID[r.ClassID]
		exm := examByID[r.ExamID]
		studentName, admission := "", ""
		if stu != nil {
			studentName = stu.FirstName + " " + stu.LastName
			admission = stu.AdmissionNo
		}
		examTitle, examSubject := "Unknown Exam", "N/A"
		maxMarks := 0
		if exm != nil {
			examTitle = exm.Title
			examSubject = exm.Subject
			maxMarks = exm.MaxMarks
		}
		className := "N/A"
		if cls != nil {
			className = cls.Name
		}
		out = append(out, map[string]any{
			"_id":               r.ID,
			"school_id":         r.SchoolID,
			"academic_year_id":  r.AcademicYearID,
			"exam_id":           r.ExamID,
			"class_id":          r.ClassID,
			"student_id":        r.StudentID,
			"obtained_marks":    r.ObtainedMarks,
			"remarks":           r.Remarks,
			"graded_at":         r.GradedAt,
			"student_name":      studentName,
			"admission_no":      admission,
			"exam_title":        examTitle,
			"exam_subject":      examSubject,
			"max_marks":         maxMarks,
			"class_name":        className,
			"grade":             calculateGrade(r.ObtainedMarks, float64(maxMarks)),
			"created_at":        r.CreatedAt,
			"updated_at":        r.UpdatedAt,
		})
	}
	return out
}

// List implements GET /api/results.
func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	q := r.URL.Query()
	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		if err := auth.AssertPermission(ctx, "exams", auth.ActionView); err != nil {
			return nil, err
		}
		yearID := tenant.ResolveAcademicYearID(h.Store, ctx, q.Get("academic_year_id"))
		examID := q.Get("exam_id")
		studentID := q.Get("student_id")
		classID := q.Get("class_id")

		h.Store.RLock()
		rows := make([]*store.Result, 0)
		for _, r := range h.Store.Results {
			if r.SchoolID != ctx.SchoolID {
				continue
			}
			if yearID != "" && r.AcademicYearID != "" && r.AcademicYearID != yearID {
				continue
			}
			if examID != "" && r.ExamID != examID {
				continue
			}
			if studentID != "" && r.StudentID != studentID {
				continue
			}
			if classID != "" && r.ClassID != classID {
				continue
			}
			rows = append(rows, r)
		}
		h.Store.RUnlock()
		sort.SliceStable(rows, func(i, j int) bool {
			return rows[i].GradedAt.After(rows[j].GradedAt)
		})

		hydrated := h.hydrate(rows)
		page := api.ParsePagination(q)
		if !page.Enabled {
			return hydrated, nil
		}
		return api.BuildPaginated(api.SafeSlice(hydrated, page.Skip, page.Skip+page.Limit), len(hydrated), page), nil
	}))
}

// ListForExam implements GET /api/exams/:id/results — same shape, scoped to one exam.
func (h *Handler) ListForExam(w http.ResponseWriter, r *http.Request) {
	examID := chi.URLParam(r, "id")
	q := r.URL.Query()
	q.Set("exam_id", examID)
	r.URL.RawQuery = q.Encode()
	h.List(w, r)
}

type saveOne struct {
	StudentID     string  `json:"student_id"`
	ObtainedMarks float64 `json:"obtained_marks"`
	Remarks       string  `json:"remarks,omitempty"`
}

type saveInput struct {
	ExamID  string    `json:"exam_id,omitempty"`
	Results []saveOne `json:"results,omitempty"`

	// Single-record convenience shape (matches the original `saveResult`).
	StudentID     string  `json:"student_id,omitempty"`
	ObtainedMarks float64 `json:"obtained_marks,omitempty"`
	Remarks       string  `json:"remarks,omitempty"`
}

// Save implements POST /api/results and POST /api/exams/:id/results.
// Same upsert semantics as the original `saveResult` / `saveExamResults`.
func (h *Handler) Save(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	pathExamID := chi.URLParam(r, "id")
	var body saveInput
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid JSON body.", 400, nil))
		return
	}
	api.WriteResult(w, api.ServiceTry(func() (map[string]any, error) {
		if err := auth.AssertPermission(ctx, "exams", auth.ActionUpdate); err != nil {
			return nil, err
		}
		examID := pathExamID
		if examID == "" {
			examID = body.ExamID
		}
		if examID == "" {
			return nil, api.NewControlledError("VALIDATION_ERROR", "exam_id is required.", 400, nil)
		}
		batch := body.Results
		if len(batch) == 0 && body.StudentID != "" {
			batch = []saveOne{{StudentID: body.StudentID, ObtainedMarks: body.ObtainedMarks, Remarks: body.Remarks}}
		}
		if len(batch) == 0 {
			return nil, api.NewControlledError("VALIDATION_ERROR", "Provide at least one result.", 400, nil)
		}

		h.Store.Lock()
		defer h.Store.Unlock()
		var exam *store.Exam
		for _, e := range h.Store.Exams {
			if e.ID == examID && e.SchoolID == ctx.SchoolID {
				exam = e
				break
			}
		}
		if exam == nil {
			return nil, api.NewControlledError("NOT_FOUND", "Exam not found.", 404, nil)
		}

		saved := 0
		now := time.Now()
		for _, item := range batch {
			if item.StudentID == "" {
				continue
			}
			var existing *store.Result
			for _, r := range h.Store.Results {
				if r.SchoolID == ctx.SchoolID && r.ExamID == examID && r.StudentID == item.StudentID {
					existing = r
					break
				}
			}
			if existing != nil {
				existing.ObtainedMarks = item.ObtainedMarks
				existing.Remarks = item.Remarks
				existing.GradedAt = now
				existing.UpdatedAt = now
			} else {
				h.Store.Results = append(h.Store.Results, &store.Result{
					ID:             store.NewID("res"),
					SchoolID:       ctx.SchoolID,
					AcademicYearID: exam.AcademicYearID,
					ExamID:         examID,
					ClassID:        exam.ClassID,
					StudentID:      item.StudentID,
					ObtainedMarks:  item.ObtainedMarks,
					Remarks:        item.Remarks,
					GradedAt:       now,
					CreatedAt:      now,
					UpdatedAt:      now,
				})
			}
			saved++
		}

		audit.Write(h.Store, ctx, audit.Input{
			Action: "update", EntityType: "exam", EntityID: examID,
			Metadata: map[string]any{"count": saved, "scope": "results"},
		})
		return map[string]any{"saved": saved}, nil
	}))
}

// Get implements GET /api/results/:id.
func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	id := chi.URLParam(r, "id")
	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		if err := auth.AssertPermission(ctx, "exams", auth.ActionView); err != nil {
			return nil, err
		}
		h.Store.RLock()
		defer h.Store.RUnlock()
		for _, r := range h.Store.Results {
			if r.ID == id && r.SchoolID == ctx.SchoolID {
				return h.hydrate([]*store.Result{r})[0], nil
			}
		}
		return nil, api.NewControlledError("NOT_FOUND", "Result not found.", 404, nil)
	}))
}
