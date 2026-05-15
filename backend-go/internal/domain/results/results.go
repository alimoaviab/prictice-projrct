// Package results implements /api/results endpoints.
//
// Architecture: each student has ONE Result row per exam. The row owns
// a `subjects[]` array of {subject_id, obtained_marks}. obtained_marks
// (top-level) is the aggregate sum kept for the legacy single-subject
// readers and to avoid recomputing on every list query.
//
// Save semantics (upsert by exam_id + student_id):
//   - Single-subject legacy payload is still accepted: a top-level
//     obtained_marks creates a synthetic single-element subjects[].
//   - New payload: subjects[] with per-subject obtained_marks.
//   - Either way the server recomputes the aggregate so totals and
//     percentages stay consistent with the breakdown.
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

type Handler struct {
	Store   *store.MemStore
	Persist func(table string, doc any)
}

func New(s *store.MemStore, save func(string, any)) *Handler {
	if save == nil {
		save = func(string, any) {}
	}
	return &Handler{Store: s, Persist: save}
}

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

// examMaxMarks returns the total max-marks across all subjects of an
// exam, falling back to the legacy aggregate column when subjects[] is
// empty.
func examMaxMarks(e *store.Exam) int {
	if e == nil {
		return 0
	}
	if len(e.Subjects) > 0 {
		total := 0
		for _, s := range e.Subjects {
			total += s.MaxMarks
		}
		return total
	}
	return e.MaxMarks
}

// resolveResultSubjects joins the persisted result subjects to the
// exam's subject definitions so the response carries names + max marks
// for each cell. Missing entries (a student who hasn't been graded for
// a particular subject yet) are not auto-filled — clients show "—".
func resolveResultSubjects(r *store.Result, e *store.Exam) []map[string]any {
	out := make([]map[string]any, 0)
	if r == nil {
		return out
	}
	if len(r.Subjects) > 0 {
		// Join against exam.Subjects for names + max.
		examByID := map[string]store.ExamSubject{}
		if e != nil {
			for _, s := range e.Subjects {
				examByID[s.SubjectID] = s
			}
		}
		for _, rs := range r.Subjects {
			meta := examByID[rs.SubjectID]
			name := rs.SubjectName
			if name == "" {
				name = meta.SubjectName
			}
			max := meta.MaxMarks
			out = append(out, map[string]any{
				"subject_id":     rs.SubjectID,
				"subject_name":   name,
				"obtained_marks": rs.ObtainedMarks,
				"max_marks":      max,
			})
		}
		return out
	}
	// Legacy single-subject result. Synthesize one row using the exam's
	// legacy fields so the new clients still render correctly.
	if e != nil {
		out = append(out, map[string]any{
			"subject_id":     e.Subject,
			"subject_name":   e.Subject,
			"obtained_marks": r.ObtainedMarks,
			"max_marks":      e.MaxMarks,
		})
	}
	return out
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
		if exm != nil {
			examTitle = exm.Title
			examSubject = exm.Subject
		}
		className := "N/A"
		if cls != nil {
			className = cls.Name
		}
		max := examMaxMarks(exm)
		percentage := 0.0
		if max > 0 {
			percentage = (r.ObtainedMarks / float64(max)) * 100
		}
		out = append(out, map[string]any{
			"_id":              r.ID,
			"school_id":        r.SchoolID,
			"academic_year_id": r.AcademicYearID,
			"exam_id":          r.ExamID,
			"class_id":         r.ClassID,
			"student_id":       r.StudentID,
			"obtained_marks":   r.ObtainedMarks,
			"subjects":         resolveResultSubjects(r, exm),
			"remarks":          r.Remarks,
			"graded_at":        r.GradedAt,
			"student_name":     studentName,
			"admission_no":     admission,
			"exam_title":       examTitle,
			"exam_subject":     examSubject,
			"max_marks":        max,
			"class_name":       className,
			"grade":            calculateGrade(r.ObtainedMarks, float64(max)),
			"percentage":       percentage,
			"created_at":       r.CreatedAt,
			"updated_at":       r.UpdatedAt,
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

// ─── Save payloads ──────────────────────────────────────────────────

type saveSubjectInput struct {
	SubjectID     string  `json:"subject_id"`
	SubjectName   string  `json:"subject_name,omitempty"`
	ObtainedMarks float64 `json:"obtained_marks"`
}

type saveOne struct {
	StudentID     string             `json:"student_id"`
	ObtainedMarks float64            `json:"obtained_marks,omitempty"` // legacy aggregate
	Subjects      []saveSubjectInput `json:"subjects,omitempty"`
	Remarks       string             `json:"remarks,omitempty"`
}

type saveInput struct {
	ExamID  string    `json:"exam_id,omitempty"`
	Results []saveOne `json:"results,omitempty"`

	// Single-record convenience shape (matches the original `saveResult`).
	StudentID     string             `json:"student_id,omitempty"`
	ObtainedMarks float64            `json:"obtained_marks,omitempty"`
	Subjects      []saveSubjectInput `json:"subjects,omitempty"`
	Remarks       string             `json:"remarks,omitempty"`
}

// normaliseStudentSubjects accepts either the new subjects[] breakdown
// or a legacy single obtained_marks float and produces the canonical
// store.ResultSubject slice + aggregate total.
//
// When subjects[] is provided we ignore the top-level obtained_marks
// (it would otherwise be double-counted). Subject names are pulled
// from the exam definition when missing on the wire.
func normaliseStudentSubjects(in saveOne, exam *store.Exam) ([]store.ResultSubject, float64) {
	examByID := map[string]store.ExamSubject{}
	if exam != nil {
		for _, s := range exam.Subjects {
			examByID[s.SubjectID] = s
		}
	}
	var out []store.ResultSubject
	if len(in.Subjects) > 0 {
		out = make([]store.ResultSubject, 0, len(in.Subjects))
		for _, s := range in.Subjects {
			if s.SubjectID == "" {
				continue
			}
			name := s.SubjectName
			if name == "" {
				name = examByID[s.SubjectID].SubjectName
			}
			out = append(out, store.ResultSubject{
				SubjectID:     s.SubjectID,
				SubjectName:   name,
				ObtainedMarks: s.ObtainedMarks,
			})
		}
	}
	total := 0.0
	if len(out) > 0 {
		for _, s := range out {
			total += s.ObtainedMarks
		}
	} else {
		total = in.ObtainedMarks
	}
	return out, total
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
			batch = []saveOne{{
				StudentID:     body.StudentID,
				ObtainedMarks: body.ObtainedMarks,
				Subjects:      body.Subjects,
				Remarks:       body.Remarks,
			}}
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
			subjects, total := normaliseStudentSubjects(item, exam)

			var existing *store.Result
			for _, r := range h.Store.Results {
				if r.SchoolID == ctx.SchoolID && r.ExamID == examID && r.StudentID == item.StudentID {
					existing = r
					break
				}
			}
			if existing != nil {
				existing.Subjects = subjects
				existing.ObtainedMarks = total
				existing.Remarks = item.Remarks
				existing.GradedAt = now
				existing.UpdatedAt = now
				h.Persist("results", existing)
			} else {
				newRes := &store.Result{
					ID:             store.NewID("res"),
					SchoolID:       ctx.SchoolID,
					AcademicYearID: exam.AcademicYearID,
					ExamID:         examID,
					ClassID:        exam.ClassID,
					StudentID:      item.StudentID,
					ObtainedMarks:  total,
					Subjects:       subjects,
					Remarks:        item.Remarks,
					GradedAt:       now,
					CreatedAt:      now,
					UpdatedAt:      now,
				}
				h.Store.Results = append(h.Store.Results, newRes)
				h.Persist("results", newRes)
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
