// Package exams implements /api/exams endpoints.
//
// Architecture: ONE exam → MANY subjects.
//
//	Each exam row carries a `subjects[]` array of {subject_id, max_marks}.
//	A class running "Mid-Term" with Math + English + Physics + Chemistry
//	produces a SINGLE exam row (one card on the list page) and four
//	entries in `subjects[]`. The legacy single-subject schema is still
//	read on the way out (subject + max_marks fields), so already-saved
//	exams continue to render.
//
// Marks: each student gets one Result row per exam, with a parallel
// `subjects[]` array of {subject_id, obtained_marks}. Total marks and
// percentage are computed from those breakdowns at hydrate time.
//
// Wire shapes accepted by Create/Update:
//
//	A. New (preferred):
//	   { class_id, title, starts_at, type, status, description,
//	     subjects: [{ subject_id, subject_name?, max_marks }, ...] }
//	B. Legacy single-subject:
//	   { class_id, title, ..., subject: "Math", max_marks: 100 }
//	   (auto-promoted to subjects[] internally)
//	C. Legacy bulk fan-out (subjects: ["Math","English"], max_marks: 100)
//	   (auto-promoted: each name becomes a subject with the same max)
package exams

import (
	"crypto/sha1"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"sort"
	"time"

	"github.com/eduplexo/backend-go/internal/api"
	"github.com/eduplexo/backend-go/internal/audit"
	"github.com/eduplexo/backend-go/internal/auth"
	"github.com/eduplexo/backend-go/internal/cache"
	"github.com/eduplexo/backend-go/internal/domain/access"
	"github.com/eduplexo/backend-go/internal/domain/tenant"
	"github.com/eduplexo/backend-go/internal/store"
	"github.com/go-chi/chi/v5"
)

type Handler struct {
	Store   *store.MemStore
	Persist func(table string, doc any)
	Cache   *cache.Client
}

func New(s *store.MemStore, save func(string, any)) *Handler {
	if save == nil {
		save = func(string, any) {}
	}
	return &Handler{Store: s, Persist: save}
}

// NewWithCache attaches a Redis client. Pass nil to opt out — handler
// degrades to the original behaviour with no caching.
func NewWithCache(s *store.MemStore, save func(string, any), c *cache.Client) *Handler {
	h := New(s, save)
	h.Cache = c
	return h
}

// examsListCacheTTL — short window so admin scheduling new exams or
// teachers grading results sees the change quickly. The 60-second
// window also bounds staleness from cross-cutting writes (results
// affect `results_count` in the response).
const examsListCacheTTL = 60 * time.Second

// listCacheKey hashes the filter set for a stable per-tenant key.
func listCacheKey(schoolID, yearID, classID, statusQ, typeQ, query string) string {
	src := fmt.Sprintf("%s|%s|%s|%s|%s|%s", schoolID, yearID, classID, statusQ, typeQ, query)
	h := sha1.Sum([]byte(src))
	return fmt.Sprintf("exams:list:%s:%s", schoolID, hex.EncodeToString(h[:])[:16])
}

// invalidateList drops every cached exams:list:{school}:* entry on
// write. Pattern delete is bounded — a school has a small filter
// surface (admin + teachers × class/type/status combos).
func (h *Handler) invalidateList(r *http.Request, schoolID string) {
	if h.Cache == nil || !h.Cache.Available() {
		return
	}
	_, _ = h.Cache.DelPattern(r.Context(), fmt.Sprintf("exams:list:%s:*", schoolID))
}

// ─── Hydration ──────────────────────────────────────────────────────

// resolveSubjects normalises whatever subject shape we have on disk
// (legacy `Subject` string vs new `Subjects[]`) into a single slice we
// can render and aggregate over. Subject names are looked up in
// store.Subjects when only an ID was stored.
func (h *Handler) resolveSubjects(e *store.Exam) []store.ExamSubject {
	if len(e.Subjects) > 0 {
		out := make([]store.ExamSubject, 0, len(e.Subjects))
		for _, s := range e.Subjects {
			name := s.SubjectName
			if name == "" {
				for _, sub := range h.Store.Subjects {
					if sub.ID == s.SubjectID {
						name = sub.Name
						break
					}
				}
				if name == "" {
					name = s.SubjectID
				}
			}
			out = append(out, store.ExamSubject{
				SubjectID:   s.SubjectID,
				SubjectName: name,
				MaxMarks:    s.MaxMarks,
			})
		}
		return out
	}
	// Legacy fallback: single-subject exam.
	if e.Subject == "" {
		return nil
	}
	return []store.ExamSubject{{
		SubjectID:   e.Subject,
		SubjectName: e.Subject,
		MaxMarks:    e.MaxMarks,
	}}
}

func sumMaxMarks(subjects []store.ExamSubject) int {
	total := 0
	for _, s := range subjects {
		total += s.MaxMarks
	}
	return total
}

func (h *Handler) hydrate(rows []*store.Exam) []map[string]any {
	classByID := map[string]*store.Class{}
	for _, c := range h.Store.Classes {
		classByID[c.ID] = c
	}
	resultsByExam := map[string]int{}
	for _, r := range h.Store.Results {
		resultsByExam[r.ExamID]++
	}
	out := make([]map[string]any, 0, len(rows))
	for _, e := range rows {
		cls := classByID[e.ClassID]
		className := ""
		if cls != nil {
			className = cls.Name
		}
		subjects := h.resolveSubjects(e)
		// Build a UI-friendly snapshot with names already resolved.
		subjectsOut := make([]map[string]any, 0, len(subjects))
		for _, s := range subjects {
			subjectsOut = append(subjectsOut, map[string]any{
				"subject_id":   s.SubjectID,
				"subject_name": s.SubjectName,
				"max_marks":    s.MaxMarks,
			})
		}
		// Concatenated subject string for old clients that still read
		// `subject` (homework/results widgets etc).
		concat := ""
		for i, s := range subjects {
			if i > 0 {
				concat += ", "
			}
			concat += s.SubjectName
		}
		totalMax := sumMaxMarks(subjects)
		if totalMax == 0 {
			totalMax = e.MaxMarks // legacy fallback
		}
		out = append(out, map[string]any{
			"_id":              e.ID,
			"school_id":        e.SchoolID,
			"academic_year_id": e.AcademicYearID,
			"class_id":         e.ClassID,
			"class_name":       className,
			"teacher_id":       e.TeacherID,
			"subject":          concat, // joined, for legacy readers
			"subjects":         subjectsOut,
			"subject_count":    len(subjects),
			"title":            e.Title,
			"type":             e.Type,
			"term":             e.Term,
			"starts_at":        api.FormatDate(e.StartsAt),
			"max_marks":        totalMax,
			"status":           e.Status,
			"description":      e.Description,
			"results_count":    resultsByExam[e.ID],
			"created_at":       e.CreatedAt,
			"updated_at":       e.UpdatedAt,
		})
	}
	return out
}

// ─── List ───────────────────────────────────────────────────────────

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	q := r.URL.Query()

	if err := auth.AssertPermission(ctx, "exams", auth.ActionView); err != nil {
		api.WriteResult(w, api.Fail("FORBIDDEN", err.Error(), 403, nil))
		return
	}

	yearID := tenant.ResolveAcademicYearID(h.Store, ctx, q.Get("academic_year_id"))
	classID := q.Get("class_id")
	statusQ := q.Get("status")
	typeQ := q.Get("type")

	cacheKey := listCacheKey(ctx.SchoolID, yearID, classID, statusQ, typeQ, q.Encode())
	cacheable := access.IsPrivileged(ctx)
	if cacheable && h.Cache != nil && h.Cache.Available() {
		if b, err := h.Cache.Get(r.Context(), cacheKey); err == nil && b != nil {
			w.Header().Set("Content-Type", "application/json")
			w.Header().Set("X-Cache", "HIT")
			_, _ = w.Write(b)
			return
		}
	}

	result := api.ServiceTry(func() (any, error) {
		h.Store.RLock()
		teacherClassIDs := map[string]bool{}
		parentClassIDs := map[string]bool{}
		if ctx.Role == "teacher" {
			teacherClassIDs = access.TeacherClassIDsLocked(h.Store, ctx)
			if classID != "" && !teacherClassIDs[classID] {
				h.Store.RUnlock()
				return []any{}, nil
			}
		}
		if ctx.Role == "student" {
			self := access.StudentProfileLocked(h.Store, ctx)
			if self == nil {
				h.Store.RUnlock()
				return []any{}, nil
			}
			classID = self.ClassID
		}
		if ctx.Role == "parent" {
			children := access.ParentStudentIDsLocked(h.Store, ctx)
			for _, s := range h.Store.Students {
				if s.SchoolID == ctx.SchoolID && children[s.ID] {
					parentClassIDs[s.ClassID] = true
				}
			}
			if classID != "" && !parentClassIDs[classID] {
				h.Store.RUnlock()
				return []any{}, nil
			}
		}
		rows := make([]*store.Exam, 0)
		for _, e := range h.Store.Exams {
			if e.SchoolID != ctx.SchoolID {
				continue
			}
			if typeQ != "" && e.Type != typeQ {
				continue
			}
			if yearID != "" && e.AcademicYearID != "" && e.AcademicYearID != yearID {
				continue
			}
			if classID != "" && e.ClassID != classID {
				continue
			}
			if ctx.Role == "teacher" && !teacherClassIDs[e.ClassID] {
				continue
			}
			if ctx.Role == "parent" && !parentClassIDs[e.ClassID] {
				continue
			}
			if statusQ != "" && e.Status != statusQ {
				continue
			}
			rows = append(rows, e)
		}
		h.Store.RUnlock()

		sort.SliceStable(rows, func(i, j int) bool {
			return rows[i].StartsAt.After(rows[j].StartsAt)
		})

		hydrated := h.hydrate(rows)
		page := api.ParsePagination(q)
		if !page.Enabled {
			return hydrated, nil
		}
		return api.BuildPaginated(api.SafeSlice(hydrated, page.Skip, page.Skip+page.Limit), len(hydrated), page), nil
	})

	bytes, err := json.Marshal(result)
	if err != nil {
		api.WriteResult(w, api.Fail("INTERNAL", "Failed to encode exams.", 500, nil))
		return
	}
	w.Header().Set("Content-Type", "application/json")
	if h.Cache != nil && h.Cache.Available() {
		w.Header().Set("X-Cache", "MISS")
	}
	if !result.Ok {
		status := http.StatusBadRequest
		if result.Error != nil && result.Error.Status != 0 {
			status = result.Error.Status
		}
		w.WriteHeader(status)
		_, _ = w.Write(bytes)
		return
	}
	_, _ = w.Write(bytes)

	if cacheable && h.Cache != nil && h.Cache.Available() {
		_ = h.Cache.Set(r.Context(), cacheKey, bytes, examsListCacheTTL)
	}
}

// ─── Get ────────────────────────────────────────────────────────────

func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	id := chi.URLParam(r, "id")
	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		if ctx.Role != "parent" {
			if err := auth.AssertPermission(ctx, "exams", auth.ActionView); err != nil {
				return nil, err
			}
		}
		h.Store.RLock()
		defer h.Store.RUnlock()
		for _, e := range h.Store.Exams {
			if e.ID == id && e.SchoolID == ctx.SchoolID {
				if !access.CanAccessClassLocked(h.Store, ctx, e.ClassID) {
					return nil, api.NewControlledError("FORBIDDEN", "Access denied.", 403, nil)
				}
				return h.hydrate([]*store.Exam{e})[0], nil
			}
		}
		return nil, api.NewControlledError("NOT_FOUND", "Exam not found.", 404, nil)
	}))
}

// ─── Create / Update payloads ───────────────────────────────────────

// subjectInput accepts either {subject_id, max_marks} or just a string
// subject name (legacy). UnmarshalJSON below handles both.
type subjectInput struct {
	SubjectID   string `json:"subject_id"`
	SubjectName string `json:"subject_name"`
	MaxMarks    int    `json:"max_marks"`
}

func (s *subjectInput) UnmarshalJSON(b []byte) error {
	if len(b) == 0 || string(b) == "null" {
		return nil
	}
	if b[0] == '"' {
		var name string
		if err := json.Unmarshal(b, &name); err != nil {
			return err
		}
		s.SubjectID = name
		s.SubjectName = name
		return nil
	}
	type alias subjectInput
	var raw alias
	if err := json.Unmarshal(b, &raw); err != nil {
		return err
	}
	*s = subjectInput(raw)
	return nil
}

type createInput struct {
	ClassID     string `json:"class_id"`
	Title       string `json:"title"`
	Type        string `json:"type,omitempty"` // exam | test
	StartsAt    string `json:"starts_at"`
	Status      string `json:"status,omitempty"`
	Description string `json:"description,omitempty"`
	Term        string `json:"term,omitempty"`

	// New shape — preferred.
	Subjects []subjectInput `json:"subjects,omitempty"`

	// Legacy single-subject convenience — the old form used to send
	// `subject` (string) + `max_marks` (int). We promote it to a single-
	// element subjects[] internally.
	Subject  string `json:"subject,omitempty"`
	MaxMarks int    `json:"max_marks,omitempty"`
}

// normaliseSubjects converts whatever shape the client posted into the
// canonical store.ExamSubject slice. Returns the slice plus a fallback
// MaxMarks aggregate for the legacy column.
func (in *createInput) normaliseSubjects(h *Handler) ([]store.ExamSubject, int) {
	subjectByID := map[string]*store.Subject{}
	for _, s := range h.Store.Subjects {
		subjectByID[s.ID] = s
	}
	out := make([]store.ExamSubject, 0)
	for _, s := range in.Subjects {
		if s.SubjectID == "" && s.SubjectName == "" {
			continue
		}
		name := s.SubjectName
		if name == "" {
			if found, ok := subjectByID[s.SubjectID]; ok {
				name = found.Name
			} else {
				name = s.SubjectID
			}
		}
		max := s.MaxMarks
		if max <= 0 {
			max = in.MaxMarks
		}
		if max <= 0 {
			max = 100
		}
		out = append(out, store.ExamSubject{
			SubjectID:   s.SubjectID,
			SubjectName: name,
			MaxMarks:    max,
		})
	}
	if len(out) == 0 && in.Subject != "" {
		max := in.MaxMarks
		if max <= 0 {
			max = 100
		}
		out = append(out, store.ExamSubject{
			SubjectID:   in.Subject,
			SubjectName: in.Subject,
			MaxMarks:    max,
		})
	}
	return out, sumMaxMarks(out)
}

// ─── Create ─────────────────────────────────────────────────────────

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	var body createInput
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid JSON body.", 400, nil))
		return
	}
	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		if err := auth.AssertPermission(ctx, "exams", auth.ActionCreate); err != nil {
			return nil, err
		}
		if body.ClassID == "" || body.Title == "" {
			return nil, api.NewControlledError("VALIDATION_ERROR", "class_id and title are required.", 400, nil)
		}

		subjects, totalMax := body.normaliseSubjects(h)
		if len(subjects) == 0 {
			return nil, api.NewControlledError("VALIDATION_ERROR", "At least one subject is required.", 400, nil)
		}

		startsAt, ok := api.ParseDate(body.StartsAt)
		if !ok {
			return nil, api.NewControlledError("VALIDATION_ERROR", "Invalid starts_at date.", 400, nil)
		}

		h.Store.Lock()
		defer h.Store.Unlock()
		if ctx.Role == "teacher" && !access.CanAccessClassLocked(h.Store, ctx, body.ClassID) {
			return nil, api.NewControlledError("FORBIDDEN", "You can only create exams for assigned classes.", 403, nil)
		}
		teacherID := ""
		if ctx.Role == "teacher" {
			if t := access.TeacherProfileLocked(h.Store, ctx); t != nil {
				teacherID = t.ID
			}
		}

		now := time.Now()
		examType := orDefault(body.Type, "exam")

		newRow := &store.Exam{
			ID:             store.NewID("exm"),
			SchoolID:       ctx.SchoolID,
			AcademicYearID: ctx.ActiveAcademicYearID,
			ClassID:        body.ClassID,
			TeacherID:      teacherID,
			// Legacy mirror so old readers still get something useful.
			Subject:     subjects[0].SubjectName,
			Subjects:    subjects,
			Title:       body.Title,
			Type:        examType,
			Term:        body.Term,
			StartsAt:    startsAt,
			MaxMarks:    totalMax,
			Status:      orDefault(body.Status, "scheduled"),
			Description: body.Description,
			CreatedAt:   now,
			UpdatedAt:   now,
		}
		h.Store.Exams = append(h.Store.Exams, newRow)
		h.Persist("exams", newRow)
		audit.Write(h.Store, ctx, audit.Input{
			Action: "create", EntityType: "exam", EntityID: newRow.ID, After: newRow,
		})
		h.invalidateList(r, ctx.SchoolID)

		return h.hydrate([]*store.Exam{newRow})[0], nil
	}))
}

// ─── Update ─────────────────────────────────────────────────────────

func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	id := chi.URLParam(r, "id")
	body := map[string]json.RawMessage{}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid JSON body.", 400, nil))
		return
	}
	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		if err := auth.AssertPermission(ctx, "exams", auth.ActionUpdate); err != nil {
			return nil, err
		}
		var updated store.Exam
		var before store.Exam
		found := false
		h.Store.Lock()
		for _, e := range h.Store.Exams {
			if e.ID == id && e.SchoolID == ctx.SchoolID {
				if ctx.Role == "teacher" && !access.CanAccessClassLocked(h.Store, ctx, e.ClassID) {
					h.Store.Unlock()
					return nil, api.NewControlledError("FORBIDDEN", "You can only update exams for assigned classes.", 403, nil)
				}
				before = *e
				if v, ok := body["title"]; ok {
					_ = json.Unmarshal(v, &e.Title)
				}
				if v, ok := body["status"]; ok {
					_ = json.Unmarshal(v, &e.Status)
				}
				if v, ok := body["description"]; ok {
					_ = json.Unmarshal(v, &e.Description)
				}
				if v, ok := body["term"]; ok {
					_ = json.Unmarshal(v, &e.Term)
				}
				if v, ok := body["class_id"]; ok {
					var nextClassID string
					_ = json.Unmarshal(v, &nextClassID)
					if ctx.Role == "teacher" && !access.CanAccessClassLocked(h.Store, ctx, nextClassID) {
						h.Store.Unlock()
						return nil, api.NewControlledError("FORBIDDEN", "You can only move exams to assigned classes.", 403, nil)
					}
					e.ClassID = nextClassID
				}
				if v, ok := body["type"]; ok {
					_ = json.Unmarshal(v, &e.Type)
				}
				if v, ok := body["starts_at"]; ok {
					var s string
					_ = json.Unmarshal(v, &s)
					if d, ok := api.ParseDate(s); ok {
						e.StartsAt = d
					}
				}
				if v, ok := body["subjects"]; ok {
					var raw []subjectInput
					if err := json.Unmarshal(v, &raw); err == nil && len(raw) > 0 {
						tmp := createInput{Subjects: raw}
						subs, total := tmp.normaliseSubjects(h)
						if len(subs) > 0 {
							e.Subjects = subs
							e.Subject = subs[0].SubjectName
							e.MaxMarks = total
						}
					}
				} else {
					// Single-subject legacy patch
					if v, ok := body["subject"]; ok {
						_ = json.Unmarshal(v, &e.Subject)
					}
					if v, ok := body["max_marks"]; ok {
						_ = json.Unmarshal(v, &e.MaxMarks)
					}
				}
				e.UpdatedAt = time.Now()
				updated = *e
				found = true
				break
			}
		}
		h.Store.Unlock()
		if !found {
			return nil, api.NewControlledError("NOT_FOUND", "Exam not found.", 404, nil)
		}
		h.Persist("exams", &updated)
		audit.Write(h.Store, ctx, audit.Input{
			Action: "update", EntityType: "exam", EntityID: id, Before: before, After: updated,
		})
		h.invalidateList(r, ctx.SchoolID)
		h.Store.RLock()
		row := h.hydrate([]*store.Exam{&updated})[0]
		h.Store.RUnlock()
		return row, nil
	}))
}

// ─── Delete ─────────────────────────────────────────────────────────

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	id := chi.URLParam(r, "id")
	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		if err := auth.AssertPermission(ctx, "exams", auth.ActionDelete); err != nil {
			return nil, err
		}
		h.Store.Lock()
		defer h.Store.Unlock()
		for i, e := range h.Store.Exams {
			if e.ID == id && e.SchoolID == ctx.SchoolID {
				if ctx.Role == "teacher" && !access.CanAccessClassLocked(h.Store, ctx, e.ClassID) {
					return nil, api.NewControlledError("FORBIDDEN", "You can only delete exams for assigned classes.", 403, nil)
				}
				before := *e
				h.Store.Exams = append(h.Store.Exams[:i], h.Store.Exams[i+1:]...)
				h.Persist("exams:delete", id)
				audit.Write(h.Store, ctx, audit.Input{
					Action: "delete", EntityType: "exam", EntityID: id, Before: before,
				})
				h.invalidateList(r, ctx.SchoolID)
				return map[string]any{"success": true, "id": id}, nil
			}
		}
		return nil, api.NewControlledError("NOT_FOUND", "Exam not found.", 404, nil)
	}))
}

func orDefault(v, d string) string {
	if v == "" {
		return d
	}
	return v
}
