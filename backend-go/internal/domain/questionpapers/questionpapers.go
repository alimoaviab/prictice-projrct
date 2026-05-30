// Package questionpapers implements /api/question-papers and /api/questions endpoints.
package questionpapers

import (
	"encoding/json"
	"net/http"
	"sort"
	"strconv"
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

type createPaperInput struct {
	Title      string          `json:"title"`
	ClassID    string          `json:"class_id"`
	SubjectID  string          `json:"subject_id"`
	ChapterIDs []string        `json:"chapter_ids"`
	TeacherID  string          `json:"teacher_id"`
	Date       string          `json:"date"`
	Questions  json.RawMessage `json:"questions"`
}

type createQuestionInput struct {
	ClassID      string          `json:"class_id"`
	SubjectID    string          `json:"subject_id"`
	ChapterID    string          `json:"chapter_id"`
	Type         string          `json:"type"`
	Difficulty   string          `json:"difficulty"`
	QuestionHTML string          `json:"question_html"`
	Options      json.RawMessage `json:"options"`
	Marks        int             `json:"marks"`
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
		out = append(out, h.paperToMap(qp))
	}
	sort.Slice(out, func(i, j int) bool {
		return out[i]["created_at"].(time.Time).After(out[j]["created_at"].(time.Time))
	})
	api.WriteResult(w, api.Ok(out))
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	var body createPaperInput
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
	subjectName := ""
	if body.SubjectID != "" {
		for _, s := range h.Store.Subjects {
			if s.ID == body.SubjectID {
				subjectName = s.Name
				break
			}
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
		SubjectID:   body.SubjectID,
		SubjectName: subjectName,
		ChapterIDs:  body.ChapterIDs,
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

	api.WriteResult(w, api.Ok(h.paperToMap(qp)))
}

func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	id := chi.URLParam(r, "id")

	h.Store.RLock()
	defer h.Store.RUnlock()
	for _, qp := range h.Store.QuestionPapers {
		if qp.ID == id && qp.SchoolID == ctx.SchoolID {
			api.WriteResult(w, api.Ok(h.paperToMap(qp)))
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

func (h *Handler) paperToMap(qp *store.QuestionPaper) map[string]any {
	return map[string]any{
		"_id":          qp.ID,
		"school_id":    qp.SchoolID,
		"title":        qp.Title,
		"class_id":     qp.ClassID,
		"class_name":   qp.ClassName,
		"subject_id":   qp.SubjectID,
		"subject_name": qp.SubjectName,
		"chapter_ids":  qp.ChapterIDs,
		"teacher_id":   qp.TeacherID,
		"teacher_name": qp.TeacherName,
		"date":         qp.Date,
		"questions":    qp.Questions,
		"status":       qp.Status,
		"created_at":   qp.CreatedAt,
		"updated_at":   qp.UpdatedAt,
	}
}

// ─── Questions (Internal Repository) ─────────────────────────────────────

func (h *Handler) ListQuestions(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)

	h.Store.RLock()
	defer h.Store.RUnlock()

	// Parse query filters
	classID := r.URL.Query().Get("class_id")
	subjectID := r.URL.Query().Get("subject_id")
	chapterID := r.URL.Query().Get("chapter_id")
	questionType := r.URL.Query().Get("type")
	difficulty := r.URL.Query().Get("difficulty")
	search := r.URL.Query().Get("search")
	status := r.URL.Query().Get("status")
	approvalStatus := r.URL.Query().Get("approval_status")
	if status == "" {
		status = "active"
	}

	// Super admin can see all questions for moderation
	isSuperAdmin := ctx.Role == "super_admin"

	// ── Grade-based matching for global questions ──────────────────────
	// When a school filters by class_id, resolve the class's grade/code
	// so we can also match global questions tagged with global_cls_class_X.
	var globalClassID string
	if classID != "" && !strings.HasPrefix(classID, "global_") {
		for _, c := range h.Store.Classes {
			if c.ID == classID {
				// Use the Code field (grade number: "9", "10", etc.) or
				// derive from name (e.g. "Class 9-A" → "9")
				grade := c.Code
				if grade == "" {
					grade = c.Grade
				}
				if grade != "" {
					globalClassID = "global_cls_class_" + strings.ToLower(strings.TrimSpace(grade))
				}
				break
			}
		}
	}

	// Similarly resolve subject name → global subject ID
	var globalSubjectID string
	if subjectID != "" && !strings.HasPrefix(subjectID, "global_") {
		for _, s := range h.Store.Subjects {
			if s.ID == subjectID {
				globalSubjectID = "global_sub_" + strings.ReplaceAll(strings.ToLower(strings.TrimSpace(s.Name)), " ", "_")
				break
			}
		}
	}

	out := make([]map[string]any, 0)
	for _, q := range h.Store.Questions {
		// School filter: show own school's questions + global questions
		if !isSuperAdmin {
			if q.SchoolID != ctx.SchoolID && q.SchoolID != globalSchoolID {
				continue
			}
			// Only show approved global questions to schools
			if q.SchoolID == globalSchoolID && q.ApprovalStatus != "approved" {
				continue
			}
		}
		// Status filter
		if q.Status != status {
			continue
		}
		// Approval status filter (for moderation)
		if approvalStatus != "" && q.ApprovalStatus != approvalStatus {
			continue
		}
		// Class filter — match both school class ID and equivalent global class ID
		if classID != "" {
			matchesClass := q.ClassID == classID
			if !matchesClass && globalClassID != "" && q.SchoolID == globalSchoolID {
				matchesClass = q.ClassID == globalClassID
			}
			if !matchesClass {
				continue
			}
		}
		// Subject filter — match both school subject ID and equivalent global subject ID
		if subjectID != "" {
			matchesSubject := q.SubjectID == subjectID
			if !matchesSubject && globalSubjectID != "" && q.SchoolID == globalSchoolID {
				matchesSubject = q.SubjectID == globalSubjectID
			}
			if !matchesSubject {
				continue
			}
		}
		if chapterID != "" && q.ChapterID != chapterID {
			continue
		}
		if questionType != "" && q.Type != questionType {
			continue
		}
		if difficulty != "" && q.Difficulty != difficulty {
			continue
		}
		if search != "" && !strings.Contains(strings.ToLower(q.QuestionHTML), strings.ToLower(search)) {
			continue
		}
		out = append(out, h.questionToMap(q))
	}
	sort.Slice(out, func(i, j int) bool {
		return out[i]["created_at"].(time.Time).After(out[j]["created_at"].(time.Time))
	})
	api.WriteResult(w, api.Ok(out))
}

func (h *Handler) CreateQuestion(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	var body createQuestionInput
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid JSON body.", 400, nil))
		return
	}
	if strings.TrimSpace(body.QuestionHTML) == "" || body.ClassID == "" {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Question and class_id are required.", 400, nil))
		return
	}

	// Resolve names
	h.Store.RLock()
	subjectName := ""
	if body.SubjectID != "" {
		for _, s := range h.Store.Subjects {
			if s.ID == body.SubjectID {
				subjectName = s.Name
				break
			}
		}
	}
	createdByName := ""
	if ctx.UserID != "" {
		for _, u := range h.Store.Users {
			if u.ID == ctx.UserID {
				createdByName = u.Profile.FirstName + " " + u.Profile.LastName
				break
			}
		}
	}
	h.Store.RUnlock()

	now := time.Now()
	// Normalize options to string form. Accepts:
	//   - JSON array of {option_text,is_correct}
	//   - JSON-encoded string (legacy callers)
	optsStr := ""
	if len(body.Options) > 0 && string(body.Options) != "null" {
		// If already a JSON string, unwrap it; otherwise keep raw JSON.
		var asString string
		if err := json.Unmarshal(body.Options, &asString); err == nil {
			optsStr = asString
		} else {
			optsStr = string(body.Options)
		}
	}

	q := &store.Question{
		ID:             store.NewID("q"),
		SchoolID:       ctx.SchoolID,
		CreatedBy:      ctx.UserID,
		CreatedByName:  createdByName,
		ClassID:        body.ClassID,
		SubjectID:      body.SubjectID,
		SubjectName:    subjectName,
		ChapterID:      body.ChapterID,
		Type:           body.Type,
		Difficulty:     body.Difficulty,
		QuestionHTML:   body.QuestionHTML,
		Options:        optsStr,
		Marks:          body.Marks,
		Status:         "active",
		IsGlobal:       false,
		ApprovalStatus: "pending",
		CreatedAt:      now,
	}

	h.Store.Lock()
	h.Store.Questions = append(h.Store.Questions, q)
	h.Store.Unlock()
	h.Save("questions", q)

	api.WriteResult(w, api.Ok(h.questionToMap(q)))
}

func (h *Handler) DeleteQuestion(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	id := chi.URLParam(r, "id")

	h.Store.Lock()
	defer h.Store.Unlock()
	for i, q := range h.Store.Questions {
		if q.ID == id && q.SchoolID == ctx.SchoolID {
			h.Store.Questions = append(h.Store.Questions[:i], h.Store.Questions[i+1:]...)
			h.Save("questions:delete", id)
			api.WriteResult(w, api.Ok(map[string]any{"success": true}))
			return
		}
	}
	api.WriteResult(w, api.Fail("NOT_FOUND", "Question not found.", 404, nil))
}

func (h *Handler) ArchiveQuestion(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	id := chi.URLParam(r, "id")

	h.Store.Lock()
	defer h.Store.Unlock()
	for _, q := range h.Store.Questions {
		if q.ID == id && q.SchoolID == ctx.SchoolID {
			q.Status = "archived"
			q.UpdatedAt = time.Now()
			h.Save("questions", q)
			api.WriteResult(w, api.Ok(h.questionToMap(q)))
			return
		}
	}
	api.WriteResult(w, api.Fail("NOT_FOUND", "Question not found.", 404, nil))
}

func (h *Handler) RestoreQuestion(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	id := chi.URLParam(r, "id")

	h.Store.Lock()
	defer h.Store.Unlock()
	for _, q := range h.Store.Questions {
		if q.ID == id && q.SchoolID == ctx.SchoolID {
			q.Status = "active"
			q.UpdatedAt = time.Now()
			h.Save("questions", q)
			api.WriteResult(w, api.Ok(h.questionToMap(q)))
			return
		}
	}
	api.WriteResult(w, api.Fail("NOT_FOUND", "Question not found.", 404, nil))
}

func (h *Handler) ApproveQuestion(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	id := chi.URLParam(r, "id")

	h.Store.Lock()
	defer h.Store.Unlock()
	for _, q := range h.Store.Questions {
		if q.ID == id {
			q.ApprovalStatus = "approved"
			q.IsGlobal = true
			q.ApprovedBy = ctx.UserID
			now := time.Now()
			q.ApprovedAt = &now
			h.Save("questions", q)
			api.WriteResult(w, api.Ok(h.questionToMap(q)))
			return
		}
	}
	api.WriteResult(w, api.Fail("NOT_FOUND", "Question not found.", 404, nil))
}

func (h *Handler) RejectQuestion(w http.ResponseWriter, r *http.Request) {
	_ = api.FromRequest(r)
	id := chi.URLParam(r, "id")

	h.Store.Lock()
	defer h.Store.Unlock()
	for _, q := range h.Store.Questions {
		if q.ID == id {
			q.ApprovalStatus = "rejected"
			q.IsGlobal = false
			h.Save("questions", q)
			api.WriteResult(w, api.Ok(h.questionToMap(q)))
			return
		}
	}
	api.WriteResult(w, api.Fail("NOT_FOUND", "Question not found.", 404, nil))
}

func (h *Handler) questionToMap(q *store.Question) map[string]any {
	// Resolve display names for class + chapter without holding the
	// store lock — questionToMap is called from already-locked contexts
	// (List uses RLock, Create/Archive uses Lock). We do a best-effort
	// lookup using the underlying slices directly.
	className := ""
	for _, c := range h.Store.Classes {
		if c.ID == q.ClassID {
			className = c.Name
			break
		}
	}
	chapterName := ""
	if q.ChapterID != "" {
		for _, ch := range h.Store.Chapters {
			if ch.ID == q.ChapterID {
				chapterName = ch.Title
				break
			}
		}
	}
	return map[string]any{
		"_id":              q.ID,
		"school_id":        q.SchoolID,
		"created_by":       q.CreatedBy,
		"created_by_name":  q.CreatedByName,
		"class_id":         q.ClassID,
		"class_name":       className,
		"subject_id":       q.SubjectID,
		"subject_name":     q.SubjectName,
		"chapter_id":       q.ChapterID,
		"chapter_name":     chapterName,
		"type":             q.Type,
		"difficulty":       q.Difficulty,
		"question_html":    q.QuestionHTML,
		"options":          q.Options,
		"marks":            q.Marks,
		"status":           q.Status,
		"is_global":        q.IsGlobal,
		"approval_status":  q.ApprovalStatus,
		"approved_by":      q.ApprovedBy,
		"approved_at":      q.ApprovedAt,
		"created_at":       q.CreatedAt,
	}
}

// ─── Chapters ────────────────────────────────────────────────────────────

type createChapterInput struct {
	ClassID       string `json:"class_id"`
	SubjectID     string `json:"subject_id"`
	Title         string `json:"title"`
	ChapterNumber int    `json:"chapter_number"`
}

type seedDefaultsInput struct {
	ClassID   string `json:"class_id"`
	SubjectID string `json:"subject_id"`
}

func (h *Handler) ListChapters(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)

	h.Store.RLock()
	defer h.Store.RUnlock()

	classID := r.URL.Query().Get("class_id")
	subjectID := r.URL.Query().Get("subject_id")
	subjectName := r.URL.Query().Get("subject")
	status := r.URL.Query().Get("status")
	if status == "" {
		status = "active"
	}

	// Support synthetic subject ids of the form "name:<subject name>" that
	// /api/classes/:id/subjects emits when a class subject has no school-
	// wide Subject row. We pivot to a name match in that case.
	if subjectName == "" && strings.HasPrefix(subjectID, "name:") {
		subjectName = strings.TrimPrefix(subjectID, "name:")
		subjectID = ""
	}

	// ── Grade-based matching for global chapters ──────────────────────
	var globalClassID string
	if classID != "" && !strings.HasPrefix(classID, "global_") {
		for _, c := range h.Store.Classes {
			if c.ID == classID {
				grade := c.Code
				if grade == "" {
					grade = c.Grade
				}
				if grade != "" {
					globalClassID = "global_cls_class_" + strings.ToLower(strings.TrimSpace(grade))
				}
				break
			}
		}
	}

	var globalSubjectID string
	if subjectID != "" && !strings.HasPrefix(subjectID, "global_") {
		for _, s := range h.Store.Subjects {
			if s.ID == subjectID {
				globalSubjectID = "global_sub_" + strings.ReplaceAll(strings.ToLower(strings.TrimSpace(s.Name)), " ", "_")
				break
			}
		}
	}

	out := make([]map[string]any, 0)
	for _, ch := range h.Store.Chapters {
		// Show school's own chapters + global chapters
		if ch.SchoolID != ctx.SchoolID && ch.SchoolID != globalSchoolID {
			continue
		}
		if ch.Status != status {
			continue
		}
		// Class filter — match both school class ID and equivalent global class ID
		if classID != "" {
			matchesClass := ch.ClassID == classID
			if !matchesClass && globalClassID != "" && ch.SchoolID == globalSchoolID {
				matchesClass = ch.ClassID == globalClassID
			}
			if !matchesClass {
				continue
			}
		}
		// Subject filter — match both school subject ID and equivalent global subject ID
		if subjectID != "" {
			matchesSubject := ch.SubjectID == subjectID
			if !matchesSubject && globalSubjectID != "" && ch.SchoolID == globalSchoolID {
				matchesSubject = ch.SubjectID == globalSubjectID
			}
			if !matchesSubject {
				continue
			}
		}
		if subjectName != "" && !strings.EqualFold(ch.SubjectName, subjectName) {
			continue
		}
		out = append(out, h.chapterToMap(ch))
	}
	sort.Slice(out, func(i, j int) bool {
		return out[i]["chapter_number"].(int) < out[j]["chapter_number"].(int)
	})
	api.WriteResult(w, api.Ok(out))
}

func (h *Handler) CreateChapter(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	var body createChapterInput
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid JSON body.", 400, nil))
		return
	}
	if body.ClassID == "" || strings.TrimSpace(body.Title) == "" {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Class and title are required.", 400, nil))
		return
	}

	// Resolve names. SubjectID may be a synthetic "name:<name>" emitted
	// by /api/classes/:id/subjects when the class has no Subject row;
	// in that case we keep the name and clear the id.
	subjectIDIn := body.SubjectID
	subjectName := ""
	if strings.HasPrefix(subjectIDIn, "name:") {
		subjectName = strings.TrimPrefix(subjectIDIn, "name:")
		subjectIDIn = ""
	}

	h.Store.RLock()
	className := ""
	for _, c := range h.Store.Classes {
		if c.ID == body.ClassID {
			className = c.Name
			break
		}
	}
	if subjectIDIn != "" {
		for _, s := range h.Store.Subjects {
			if s.ID == subjectIDIn {
				subjectName = s.Name
				break
			}
		}
	}
	h.Store.RUnlock()

	now := time.Now()
	ch := &store.Chapter{
		ID:            store.NewID("ch"),
		SchoolID:      ctx.SchoolID,
		ClassID:       body.ClassID,
		ClassName:     className,
		SubjectID:     subjectIDIn,
		SubjectName:   subjectName,
		Title:         strings.TrimSpace(body.Title),
		ChapterNumber: body.ChapterNumber,
		IsDefault:     false,
		Status:        "active",
		CreatedAt:     now,
		UpdatedAt:     now,
	}

	h.Store.Lock()
	h.Store.Chapters = append(h.Store.Chapters, ch)
	h.Store.Unlock()
	h.Save("chapters", ch)

	api.WriteResult(w, api.Ok(h.chapterToMap(ch)))
}

func (h *Handler) SeedDefaultChapters(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	var body seedDefaultsInput
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid JSON body.", 400, nil))
		return
	}
	if body.ClassID == "" || body.SubjectID == "" {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Class and subject are required.", 400, nil))
		return
	}

	// Accept synthetic "name:<name>" subject ids from /api/classes/:id/subjects.
	subjectIDIn := body.SubjectID
	subjectName := ""
	if strings.HasPrefix(subjectIDIn, "name:") {
		subjectName = strings.TrimPrefix(subjectIDIn, "name:")
		subjectIDIn = ""
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
	if subjectIDIn != "" {
		for _, s := range h.Store.Subjects {
			if s.ID == subjectIDIn {
				subjectName = s.Name
				break
			}
		}
	}
	h.Store.RUnlock()

	// Check if already seeded (by id when present, by name otherwise).
	h.Store.RLock()
	for _, ch := range h.Store.Chapters {
		if ch.SchoolID != ctx.SchoolID || ch.ClassID != body.ClassID || !ch.IsDefault {
			continue
		}
		if subjectIDIn != "" && ch.SubjectID == subjectIDIn {
			h.Store.RUnlock()
			api.WriteResult(w, api.Ok(map[string]any{"message": "Chapters already seeded", "count": 0}))
			return
		}
		if subjectIDIn == "" && subjectName != "" && strings.EqualFold(ch.SubjectName, subjectName) {
			h.Store.RUnlock()
			api.WriteResult(w, api.Ok(map[string]any{"message": "Chapters already seeded", "count": 0}))
			return
		}
	}
	h.Store.RUnlock()

	// Get default chapters for this subject/class
	defaults := getDefaultChapters(body.ClassID, className, subjectIDIn, subjectName)
	if len(defaults) == 0 {
		api.WriteResult(w, api.Ok(map[string]any{"message": "No default chapters for this subject", "count": 0}))
		return
	}

	now := time.Now()
	newChapters := make([]*store.Chapter, 0)
	for i, title := range defaults {
		ch := &store.Chapter{
			ID:            store.NewID("ch"),
			SchoolID:      ctx.SchoolID,
			ClassID:       body.ClassID,
			ClassName:     className,
			SubjectID:     subjectIDIn,
			SubjectName:   subjectName,
			Title:         title,
			ChapterNumber: i + 1,
			IsDefault:     true,
			Status:        "active",
			CreatedAt:     now,
			UpdatedAt:     now,
		}
		newChapters = append(newChapters, ch)
	}

	h.Store.Lock()
	h.Store.Chapters = append(h.Store.Chapters, newChapters...)
	h.Store.Unlock()

	for _, ch := range newChapters {
		h.Save("chapters", ch)
	}

	api.WriteResult(w, api.Ok(map[string]any{"message": "Default chapters seeded", "count": len(newChapters), "chapters": newChapters}))
}

func (h *Handler) chapterToMap(ch *store.Chapter) map[string]any {
	return map[string]any{
		"_id":             ch.ID,
		"school_id":       ch.SchoolID,
		"class_id":        ch.ClassID,
		"class_name":      ch.ClassName,
		"subject_id":      ch.SubjectID,
		"subject_name":    ch.SubjectName,
		"title":           ch.Title,
		"chapter_number":  ch.ChapterNumber,
		"is_default":      ch.IsDefault,
		"status":          ch.Status,
		"created_at":      ch.CreatedAt,
		"updated_at":      ch.UpdatedAt,
	}
}

// getDefaultChapters returns Pakistani curriculum default chapters for a subject/class.
func getDefaultChapters(classID, className, subjectID, subjectName string) []string {
	subjectLower := strings.ToLower(subjectName)

	// Urdu chapters
	if strings.Contains(subjectLower, "urdu") || strings.Contains(subjectLower, "اردو") {
		return []string{
			"Hamd",
			"Naat",
			"Nazm",
			"Ghazal",
			"Mazameen",
			"Qawaid",
		}
	}

	// Biology chapters
	if strings.Contains(subjectLower, "biology") || strings.Contains(subjectLower, "حیاتیات") {
		return []string{
			"Cell Biology",
			"Bioenergetics",
			"Coordination",
			"Inheritance",
			"Homeostasis",
			"Support and Movement",
		}
	}

	// Physics chapters
	if strings.Contains(subjectLower, "physics") || strings.Contains(subjectLower, "طبیعیات") {
		return []string{
			"Simple Harmonic Motion",
			"Electromagnetism",
			"Modern Physics",
			"Electronics",
			"Atomic Spectra",
			"Nuclear Physics",
		}
	}

	// Chemistry chapters
	if strings.Contains(subjectLower, "chemistry") || strings.Contains(subjectLower, "کیمیا") {
		return []string{
			"Periodic Classification",
			"Chemical Bonding",
			"States of Matter",
			"Solutions",
			"Electrochemistry",
			"Chemical Kinetics",
		}
	}

	// Mathematics chapters
	if strings.Contains(subjectLower, "math") || strings.Contains(subjectLower, "ریاضی") {
		return []string{
			"Number Systems",
			"Algebra",
			"Geometry",
			"Trigonometry",
			"Statistics",
			"Calculus",
		}
	}

	// English chapters
	if strings.Contains(subjectLower, "english") || strings.Contains(subjectLower, "انگریزی") {
		return []string{
			"Prose",
			"Poetry",
			"Grammar",
			"Composition",
			"Comprehension",
			"Translation",
		}
	}

	// Islamiat chapters
	if strings.Contains(subjectLower, "islamiat") || strings.Contains(subjectLower, "اسلامیات") {
		return []string{
			"Iman",
			"Ibadat",
			"Seerat-un-Nabi",
			"Khulafa-e-Rashideen",
			"Haqooq-ul-Ibad",
			"Quranic Teachings",
		}
	}

	// Pakistan Studies chapters
	if strings.Contains(subjectLower, "pakistan") || strings.Contains(subjectLower, "مطالعہ پاکستان") {
		return []string{
			"Ideology of Pakistan",
			"Making of Pakistan",
			"Constitutional Development",
			"Foreign Policy",
			"Economy of Pakistan",
			"Culture and Society",
		}
	}

	// Computer Science chapters
	if strings.Contains(subjectLower, "computer") || strings.Contains(subjectLower, "کمپیوٹر") {
		return []string{
			"Data Representation",
			"Boolean Algebra",
			"Computer Architecture",
			"Operating Systems",
			"Programming",
			"Database Management",
		}
	}

	return nil
}


// ─── Star / Unstar (per teacher) ─────────────────────────────────────────
//
// Star Collections store one row per (user_id, question_id) pair.
// We reuse the StarCollection.Name field as the question_id since teachers
// don't currently customize collection names — keeps the schema lean.

const starCollectionName = "favorites"

func (h *Handler) starKey(userID, qID string) string {
	return userID + ":" + qID
}

// StarQuestion adds a question to the user's starred set.
// Idempotent — duplicate stars are ignored.
func (h *Handler) StarQuestion(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	id := chi.URLParam(r, "id")
	if id == "" {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Question id required.", 400, nil))
		return
	}

	h.Store.Lock()
	defer h.Store.Unlock()

	for _, sc := range h.Store.StarCollections {
		if sc.UserID == ctx.UserID && sc.Color == id {
			api.WriteResult(w, api.Ok(map[string]any{"success": true}))
			return
		}
	}

	sc := &store.StarCollection{
		ID:        store.NewID("star"),
		UserID:    ctx.UserID,
		SchoolID:  ctx.SchoolID,
		Name:      starCollectionName,
		Color:     id, // we store question_id in Color to avoid schema change
		CreatedAt: time.Now(),
	}
	h.Store.StarCollections = append(h.Store.StarCollections, sc)
	h.Save("star_collections", sc)
	api.WriteResult(w, api.Ok(map[string]any{"success": true}))
}

// UnstarQuestion removes a star.
func (h *Handler) UnstarQuestion(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	id := chi.URLParam(r, "id")

	h.Store.Lock()
	defer h.Store.Unlock()
	for i, sc := range h.Store.StarCollections {
		if sc.UserID == ctx.UserID && sc.Color == id {
			deletedID := sc.ID
			h.Store.StarCollections = append(h.Store.StarCollections[:i], h.Store.StarCollections[i+1:]...)
			h.Save("star_collections:delete", deletedID)
			break
		}
	}
	api.WriteResult(w, api.Ok(map[string]any{"success": true}))
}

// GetStarredIds returns the question_ids the current user has starred.
func (h *Handler) GetStarredIds(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	h.Store.RLock()
	defer h.Store.RUnlock()
	ids := make([]string, 0)
	for _, sc := range h.Store.StarCollections {
		if sc.UserID == ctx.UserID {
			ids = append(ids, sc.Color)
		}
	}
	api.WriteResult(w, api.Ok(ids))
}

// ─── Question Stats (for dashboard cards) ────────────────────────────────

// QuestionStats returns counts grouped by type/difficulty for filter aware
// stats cards (Total / MCQs / Short / Long, plus easy/medium/hard).
func (h *Handler) QuestionStats(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)

	h.Store.RLock()
	defer h.Store.RUnlock()

	classID := r.URL.Query().Get("class_id")
	subjectID := r.URL.Query().Get("subject_id")
	chapterID := r.URL.Query().Get("chapter_id")

	var total, mcq, short, long, easy, medium, hard int
	for _, q := range h.Store.Questions {
		if q.SchoolID != ctx.SchoolID || q.Status != "active" {
			continue
		}
		if classID != "" && q.ClassID != classID {
			continue
		}
		if subjectID != "" && q.SubjectID != subjectID {
			continue
		}
		if chapterID != "" && q.ChapterID != chapterID {
			continue
		}
		total++
		switch q.Type {
		case "mcq":
			mcq++
		case "short":
			short++
		case "long":
			long++
		}
		switch q.Difficulty {
		case "easy":
			easy++
		case "medium":
			medium++
		case "hard":
			hard++
		}
	}

	api.WriteResult(w, api.Ok(map[string]any{
		"total":  total,
		"mcq":    mcq,
		"short":  short,
		"long":   long,
		"easy":   easy,
		"medium": medium,
		"hard":   hard,
	}))
}

// ─── Auto Paper Generator ────────────────────────────────────────────────

type autoGenerateInput struct {
	ClassID         string   `json:"class_id"`
	SubjectID       string   `json:"subject_id"`
	ChapterIDs      []string `json:"chapter_ids"`
	MCQCount        int      `json:"mcq_count"`
	ShortCount      int      `json:"short_count"`
	LongCount       int      `json:"long_count"`
	EasyRatio       float64  `json:"easy_ratio"`
	MediumRatio     float64  `json:"medium_ratio"`
	HardRatio       float64  `json:"hard_ratio"`
	MCQMarks        int      `json:"mcq_marks"`
	ShortMarks      int      `json:"short_marks"`
	LongMarks       int      `json:"long_marks"`
}

// AutoGeneratePaper picks a balanced set of questions matching the
// requested counts and difficulty ratio. Returns the picked questions
// without saving — the frontend wires them into the paper builder.
func (h *Handler) AutoGeneratePaper(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	var body autoGenerateInput
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid JSON body.", 400, nil))
		return
	}
	if body.ClassID == "" {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "class_id required.", 400, nil))
		return
	}
	// Default ratios
	if body.EasyRatio == 0 && body.MediumRatio == 0 && body.HardRatio == 0 {
		body.EasyRatio, body.MediumRatio, body.HardRatio = 0.3, 0.5, 0.2
	}
	if body.MCQMarks == 0 {
		body.MCQMarks = 1
	}
	if body.ShortMarks == 0 {
		body.ShortMarks = 3
	}
	if body.LongMarks == 0 {
		body.LongMarks = 8
	}

	h.Store.RLock()

	// Resolve grade-based global class/subject IDs (same logic as ListQuestions)
	var globalClassID string
	if body.ClassID != "" && !strings.HasPrefix(body.ClassID, "global_") {
		for _, c := range h.Store.Classes {
			if c.ID == body.ClassID {
				grade := c.Code
				if grade == "" {
					grade = c.Grade
				}
				if grade != "" {
					globalClassID = "global_cls_class_" + strings.ToLower(strings.TrimSpace(grade))
				}
				break
			}
		}
	}
	var globalSubjectID string
	if body.SubjectID != "" && !strings.HasPrefix(body.SubjectID, "global_") {
		for _, s := range h.Store.Subjects {
			if s.ID == body.SubjectID {
				globalSubjectID = "global_sub_" + strings.ReplaceAll(strings.ToLower(strings.TrimSpace(s.Name)), " ", "_")
				break
			}
		}
	}

	pool := make([]*store.Question, 0)
	chapterSet := make(map[string]bool, len(body.ChapterIDs))
	for _, c := range body.ChapterIDs {
		chapterSet[c] = true
	}
	for _, q := range h.Store.Questions {
		// Include school's own questions + global approved questions
		if q.SchoolID != ctx.SchoolID && q.SchoolID != globalSchoolID {
			continue
		}
		if q.SchoolID == globalSchoolID && q.ApprovalStatus != "approved" {
			continue
		}
		if q.Status != "active" {
			continue
		}
		// Class matching (with grade-based fallback for global)
		matchesClass := q.ClassID == body.ClassID
		if !matchesClass && globalClassID != "" && q.SchoolID == globalSchoolID {
			matchesClass = q.ClassID == globalClassID
		}
		if !matchesClass {
			continue
		}
		// Subject matching (with name-based fallback for global)
		if body.SubjectID != "" {
			matchesSubject := q.SubjectID == body.SubjectID
			if !matchesSubject && globalSubjectID != "" && q.SchoolID == globalSchoolID {
				matchesSubject = q.SubjectID == globalSubjectID
			}
			if !matchesSubject {
				continue
			}
		}
		if len(chapterSet) > 0 && !chapterSet[q.ChapterID] {
			continue
		}
		pool = append(pool, q)
	}
	h.Store.RUnlock()

	picked := make([]*store.Question, 0)
	picked = append(picked, pickByDifficulty(pool, "mcq", body.MCQCount, body.EasyRatio, body.MediumRatio, body.HardRatio)...)
	picked = append(picked, pickByDifficulty(pool, "short", body.ShortCount, body.EasyRatio, body.MediumRatio, body.HardRatio)...)
	picked = append(picked, pickByDifficulty(pool, "long", body.LongCount, body.EasyRatio, body.MediumRatio, body.HardRatio)...)

	out := make([]map[string]any, 0, len(picked))
	for _, q := range picked {
		marks := q.Marks
		if marks == 0 {
			switch q.Type {
			case "mcq":
				marks = body.MCQMarks
			case "short":
				marks = body.ShortMarks
			case "long":
				marks = body.LongMarks
			}
		}
		m := h.questionToMap(q)
		m["assigned_marks"] = marks
		out = append(out, m)
	}

	api.WriteResult(w, api.Ok(map[string]any{
		"questions":  out,
		"pool_size":  len(pool),
		"picked":     len(picked),
		"total_marks": calcTotalMarks(picked, body),
	}))
}

func pickByDifficulty(pool []*store.Question, qType string, total int, easyR, medR, hardR float64) []*store.Question {
	if total <= 0 {
		return nil
	}
	easyN := int(float64(total) * easyR)
	medN := int(float64(total) * medR)
	hardN := total - easyN - medN
	if hardN < 0 {
		hardN = 0
	}

	easy := filterByTypeAndDifficulty(pool, qType, "easy")
	medium := filterByTypeAndDifficulty(pool, qType, "medium")
	hard := filterByTypeAndDifficulty(pool, qType, "hard")

	picked := make([]*store.Question, 0, total)
	picked = append(picked, takeN(easy, easyN)...)
	picked = append(picked, takeN(medium, medN)...)
	picked = append(picked, takeN(hard, hardN)...)

	// Top up if we couldn't satisfy a difficulty bucket.
	if len(picked) < total {
		all := filterByTypeAndDifficulty(pool, qType, "")
		seen := make(map[string]bool, len(picked))
		for _, p := range picked {
			seen[p.ID] = true
		}
		for _, q := range all {
			if len(picked) >= total {
				break
			}
			if !seen[q.ID] {
				picked = append(picked, q)
				seen[q.ID] = true
			}
		}
	}
	return picked
}

func filterByTypeAndDifficulty(pool []*store.Question, qType, diff string) []*store.Question {
	out := make([]*store.Question, 0)
	for _, q := range pool {
		if q.Type != qType {
			continue
		}
		if diff != "" && q.Difficulty != diff {
			continue
		}
		out = append(out, q)
	}
	return out
}

func takeN(qs []*store.Question, n int) []*store.Question {
	if n <= 0 || len(qs) == 0 {
		return nil
	}
	if n > len(qs) {
		n = len(qs)
	}
	// Work on a copy so we don't mutate the caller's slice.
	pool := make([]*store.Question, len(qs))
	copy(pool, qs)
	// Deterministic-ish "shuffle" by id; combined with spread sampling
	// below this gives a different mix per run when len(pool) > n.
	sort.Slice(pool, func(i, j int) bool { return pool[i].ID < pool[j].ID })
	if len(pool) > n*2 {
		step := len(pool) / n
		picked := make([]*store.Question, 0, n)
		for i := 0; i < n; i++ {
			idx := i * step
			if idx >= len(pool) {
				idx = len(pool) - 1
			}
			picked = append(picked, pool[idx])
		}
		return picked
	}
	return pool[:n]
}

func calcTotalMarks(qs []*store.Question, body autoGenerateInput) int {
	total := 0
	for _, q := range qs {
		marks := q.Marks
		if marks == 0 {
			switch q.Type {
			case "mcq":
				marks = body.MCQMarks
			case "short":
				marks = body.ShortMarks
			case "long":
				marks = body.LongMarks
			}
		}
		total += marks
	}
	return total
}

// ─── Bulk archive / restore (multi-select) ───────────────────────────────

type bulkActionInput struct {
	IDs []string `json:"ids"`
}

func (h *Handler) BulkArchiveQuestions(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	var body bulkActionInput
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid JSON body.", 400, nil))
		return
	}

	idSet := make(map[string]bool, len(body.IDs))
	for _, id := range body.IDs {
		idSet[id] = true
	}

	h.Store.Lock()
	defer h.Store.Unlock()

	count := 0
	for _, q := range h.Store.Questions {
		if idSet[q.ID] && q.SchoolID == ctx.SchoolID {
			q.Status = "archived"
			q.UpdatedAt = time.Now()
			h.Save("questions", q)
			count++
		}
	}
	api.WriteResult(w, api.Ok(map[string]any{"archived": count}))
}

func (h *Handler) BulkDeleteQuestions(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	var body bulkActionInput
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid JSON body.", 400, nil))
		return
	}
	idSet := make(map[string]bool, len(body.IDs))
	for _, id := range body.IDs {
		idSet[id] = true
	}

	h.Store.Lock()
	defer h.Store.Unlock()

	kept := make([]*store.Question, 0, len(h.Store.Questions))
	count := 0
	for _, q := range h.Store.Questions {
		if idSet[q.ID] && q.SchoolID == ctx.SchoolID {
			h.Save("questions:delete", q.ID)
			count++
			continue
		}
		kept = append(kept, q)
	}
	h.Store.Questions = kept
	api.WriteResult(w, api.Ok(map[string]any{"deleted": count}))
}

// ArchiveChapter moves a chapter to the archived state. Frontend filters
// hide archived chapters by default.
func (h *Handler) ArchiveChapter(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	id := chi.URLParam(r, "id")

	h.Store.Lock()
	defer h.Store.Unlock()
	for _, ch := range h.Store.Chapters {
		if ch.ID == id && ch.SchoolID == ctx.SchoolID {
			ch.Status = "archived"
			ch.UpdatedAt = time.Now()
			h.Save("chapters", ch)
			api.WriteResult(w, api.Ok(h.chapterToMap(ch)))
			return
		}
	}
	api.WriteResult(w, api.Fail("NOT_FOUND", "Chapter not found.", 404, nil))
}

// ═══════════════════════════════════════════════════════════════════════════
// GLOBAL QUESTION BANK — Super Admin endpoints
// Data created here uses school_id="__global__" and is_global=true.
// All schools see this data merged with their own.
// ═══════════════════════════════════════════════════════════════════════════

const globalSchoolID = "__global__"

// GlobalListClasses returns all global classes.
func (h *Handler) GlobalListClasses(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	if ctx.Role != "super_admin" {
		api.WriteResult(w, api.Fail("FORBIDDEN", "Super admin only.", 403, nil))
		return
	}
	boardID := r.URL.Query().Get("board_id")
	all := r.URL.Query().Get("all") == "true"

	h.Store.RLock()
	defer h.Store.RUnlock()

	out := make([]map[string]any, 0)
	for _, c := range h.Store.Classes {
		if boardID == "__unassigned__" {
			if c.BoardID != "" {
				continue
			}
		} else if boardID != "" && c.BoardID != boardID {
			continue
		}
		if !all && c.Status != "active" {
			continue
		}
		out = append(out, map[string]any{
			"_id":        c.ID,
				"school_id":  c.SchoolID,
				"board_id":   c.BoardID,
				"name":       c.Name,
				"code":       c.Code,
				"grade":      c.Grade,
				"section":    c.Section,
				"status":     c.Status,
				"is_active":  c.Status == "active",
			"created_at": c.CreatedAt,
			"updated_at": c.UpdatedAt,
		})
	}
	api.WriteResult(w, api.Ok(out))
}

// GlobalListSubjects returns all global subjects.
func (h *Handler) GlobalListSubjects(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	if ctx.Role != "super_admin" {
		api.WriteResult(w, api.Fail("FORBIDDEN", "Super admin only.", 403, nil))
		return
	}
	classID := r.URL.Query().Get("class_id")
	all := r.URL.Query().Get("all") == "true"

	h.Store.RLock()
	defer h.Store.RUnlock()

	out := make([]map[string]any, 0)
	for _, s := range h.Store.Subjects {
		if classID != "" && s.ClassID != classID {
			continue
		}
		if !all && s.Status != "active" {
			continue
		}
		out = append(out, map[string]any{
			"_id":        s.ID,
				"school_id":  s.SchoolID,
				"class_id":   s.ClassID,
				"name":       s.Name,
				"code":       s.Code,
				"status":     s.Status,
				"is_active":  s.Status == "active",
			"created_at": s.CreatedAt,
			"updated_at": s.CreatedAt,
		})
	}
	api.WriteResult(w, api.Ok(out))
}

// GlobalListChapters returns chapters for the global bank, filtered by class/subject.
func (h *Handler) GlobalListChapters(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	if ctx.Role != "super_admin" {
		api.WriteResult(w, api.Fail("FORBIDDEN", "Super admin only.", 403, nil))
		return
	}
	classID := r.URL.Query().Get("class_id")
	subjectID := r.URL.Query().Get("subject_id")

	h.Store.RLock()
	defer h.Store.RUnlock()

	out := make([]map[string]any, 0)
	for _, ch := range h.Store.Chapters {
		if ch.Status != "active" {
			continue
		}
		if classID != "" && ch.ClassID != classID {
			continue
		}
		if subjectID != "" && ch.SubjectID != subjectID {
			continue
		}
		out = append(out, h.chapterToMap(ch))
	}
	sort.Slice(out, func(i, j int) bool {
		a, _ := out[i]["chapter_number"].(int)
		b, _ := out[j]["chapter_number"].(int)
		return a < b
	})
	api.WriteResult(w, api.Ok(out))
}

// GlobalCreateChapter creates a chapter in the global bank.
func (h *Handler) GlobalCreateChapter(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	if ctx.Role != "super_admin" {
		api.WriteResult(w, api.Fail("FORBIDDEN", "Super admin only.", 403, nil))
		return
	}
	var body struct {
		ClassID       string `json:"class_id"`
		ClassName     string `json:"class_name"`
		SubjectID     string `json:"subject_id"`
		SubjectName   string `json:"subject_name"`
		Title         string `json:"title"`
		ChapterNumber int    `json:"chapter_number"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid JSON.", 400, nil))
		return
	}
	if body.Title == "" || body.ClassID == "" {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "title and class_id required.", 400, nil))
		return
	}

	now := time.Now()
	ch := &store.Chapter{
		ID:            store.NewID("gch"),
		SchoolID:      globalSchoolID,
		ClassID:       body.ClassID,
		ClassName:     body.ClassName,
		SubjectID:     body.SubjectID,
		SubjectName:   body.SubjectName,
		Title:         body.Title,
		ChapterNumber: body.ChapterNumber,
		IsDefault:     true,
		Status:        "active",
		CreatedAt:     now,
		UpdatedAt:     now,
	}

	h.Store.Lock()
	h.Store.Chapters = append(h.Store.Chapters, ch)
	h.Store.Unlock()
	h.Save("chapters", ch)

	api.WriteResult(w, api.Ok(h.chapterToMap(ch)))
}

// GlobalDeleteChapter deletes a global chapter.
func (h *Handler) GlobalDeleteChapter(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	if ctx.Role != "super_admin" {
		api.WriteResult(w, api.Fail("FORBIDDEN", "Super admin only.", 403, nil))
		return
	}
	id := chi.URLParam(r, "id")

	h.Store.Lock()
	defer h.Store.Unlock()
	for i, ch := range h.Store.Chapters {
		if ch.ID == id && ch.SchoolID == globalSchoolID {
			h.Store.Chapters = append(h.Store.Chapters[:i], h.Store.Chapters[i+1:]...)
			h.Save("chapters:delete", id)
			api.WriteResult(w, api.Ok(map[string]any{"deleted": true}))
			return
		}
	}
	api.WriteResult(w, api.Fail("NOT_FOUND", "Chapter not found.", 404, nil))
}

// GlobalListQuestions returns all global questions, with optional filters and pagination.
func (h *Handler) GlobalListQuestions(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	if ctx.Role != "super_admin" {
		api.WriteResult(w, api.Fail("FORBIDDEN", "Super admin only.", 403, nil))
		return
	}
	boardID := r.URL.Query().Get("board_id")
	classID := r.URL.Query().Get("class_id")
	subjectID := r.URL.Query().Get("subject_id")
	chapterID := r.URL.Query().Get("chapter_id")
	topicID := r.URL.Query().Get("topic_id")
	qType := r.URL.Query().Get("type")
	difficulty := r.URL.Query().Get("difficulty")
	marksStr := r.URL.Query().Get("marks")
	statusFilter := r.URL.Query().Get("status")
	approvalStatus := r.URL.Query().Get("approval_status")
	search := r.URL.Query().Get("search")

	h.Store.RLock()
	defer h.Store.RUnlock()

	filtered := make([]*store.Question, 0)
	for _, q := range h.Store.Questions {
		if statusFilter != "" {
			if q.Status != statusFilter {
				continue
			}
		} else {
			if q.Status != "active" {
				continue
			}
		}
		if approvalStatus != "" {
			if q.ApprovalStatus != approvalStatus {
				continue
			}
		}
		if boardID != "" && q.BoardID != boardID {
			continue
		}
		if classID != "" && q.ClassID != classID {
			continue
		}
		if subjectID != "" && q.SubjectID != subjectID {
			continue
		}
		if chapterID != "" && q.ChapterID != chapterID {
			continue
		}
		if topicID != "" && q.TopicID != topicID {
			continue
		}
		if qType != "" && q.Type != qType {
			continue
		}
		if difficulty != "" && q.Difficulty != difficulty {
			continue
		}
		if marksStr != "" {
			m, _ := strconv.Atoi(marksStr)
			if q.Marks != m {
				continue
			}
		}
		if search != "" && !strings.Contains(strings.ToLower(q.QuestionHTML), strings.ToLower(search)) {
			continue
		}
		filtered = append(filtered, q)
	}

	sort.Slice(filtered, func(i, j int) bool {
		return filtered[i].CreatedAt.After(filtered[j].CreatedAt)
	})

	isPaged := r.URL.Query().Get("page") != "" || r.URL.Query().Get("limit") != ""
	if isPaged {
		limit := 10
		page := 1
		if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
			if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
				limit = l
			}
		}
		if pageStr := r.URL.Query().Get("page"); pageStr != "" {
			if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
				page = p
			}
		}

		total := len(filtered)
		start := (page - 1) * limit
		if start > total {
			start = total
		}
		end := start + limit
		if end > total {
			end = total
		}

		paginated := filtered[start:end]
		out := make([]map[string]any, 0, len(paginated))
		for _, q := range paginated {
			out = append(out, h.questionToMap(q))
		}

		api.WriteResult(w, api.Ok(map[string]any{
			"items": out,
			"total": total,
			"page":  page,
			"limit": limit,
		}))
	} else {
		out := make([]map[string]any, 0, len(filtered))
		for _, q := range filtered {
			out = append(out, h.questionToMap(q))
		}
		api.WriteResult(w, api.Ok(out))
	}
}

// GlobalCreateQuestion creates a question in the global bank (visible to all schools).
func (h *Handler) GlobalCreateQuestion(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	if ctx.Role != "super_admin" {
		api.WriteResult(w, api.Fail("FORBIDDEN", "Super admin only.", 403, nil))
		return
	}
	var body struct {
		BoardID      string          `json:"board_id"`
		ClassID      string          `json:"class_id"`
		ClassName    string          `json:"class_name"`
		SubjectID    string          `json:"subject_id"`
		SubjectName  string          `json:"subject_name"`
		ChapterID    string          `json:"chapter_id"`
		TopicID      string          `json:"topic_id"`
		Type         string          `json:"type"`
		Difficulty   string          `json:"difficulty"`
		QuestionHTML string          `json:"question_html"`
		Options      json.RawMessage `json:"options"`
		Marks        int             `json:"marks"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid JSON.", 400, nil))
		return
	}
	if body.QuestionHTML == "" || body.ClassID == "" {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "question_html and class_id required.", 400, nil))
		return
	}
	if body.Type == "" {
		body.Type = "short"
	}
	if body.Difficulty == "" {
		body.Difficulty = "medium"
	}

	optsStr := ""
	if len(body.Options) > 0 && string(body.Options) != "null" {
		var asString string
		if err := json.Unmarshal(body.Options, &asString); err == nil {
			optsStr = asString
		} else {
			optsStr = string(body.Options)
		}
	}

	now := time.Now()
	q := &store.Question{
		ID:             store.NewID("gq"),
		SchoolID:       globalSchoolID,
		CreatedBy:      ctx.UserID,
		CreatedByName:  "Super Admin",
		BoardID:        body.BoardID,
		ClassID:        body.ClassID,
		SubjectID:      body.SubjectID,
		SubjectName:    body.SubjectName,
		ChapterID:      body.ChapterID,
		TopicID:        body.TopicID,
		Type:           body.Type,
		Difficulty:     body.Difficulty,
		QuestionHTML:   body.QuestionHTML,
		Options:        optsStr,
		Marks:          body.Marks,
		Status:         "active",
		IsGlobal:       true,
		ApprovalStatus: "approved",
		CreatedAt:      now,
		UpdatedAt:      now,
	}

	h.Store.Lock()
	h.Store.Questions = append(h.Store.Questions, q)
	h.Store.Unlock()
	h.Save("questions", q)

	api.WriteResult(w, api.Ok(h.questionToMap(q)))
}

// GlobalUpdateQuestion updates a global question.
func (h *Handler) GlobalUpdateQuestion(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	if ctx.Role != "super_admin" {
		api.WriteResult(w, api.Fail("FORBIDDEN", "Super admin only.", 403, nil))
		return
	}
	id := chi.URLParam(r, "id")
	var body struct {
		BoardID      string          `json:"board_id"`
		ClassID      string          `json:"class_id"`
		ClassName    string          `json:"class_name"`
		SubjectID    string          `json:"subject_id"`
		SubjectName  string          `json:"subject_name"`
		ChapterID    string          `json:"chapter_id"`
		TopicID      string          `json:"topic_id"`
		Type         string          `json:"type"`
		Difficulty   string          `json:"difficulty"`
		QuestionHTML string          `json:"question_html"`
		Options      json.RawMessage `json:"options"`
		Marks        int             `json:"marks"`
		Status       string          `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid JSON.", 400, nil))
		return
	}

	h.Store.Lock()
	defer h.Store.Unlock()
	for _, q := range h.Store.Questions {
		if q.ID == id && q.SchoolID == globalSchoolID {
			if body.QuestionHTML != "" {
				q.QuestionHTML = body.QuestionHTML
			}
			if body.BoardID != "" {
				q.BoardID = body.BoardID
			}
			if body.ClassID != "" {
				q.ClassID = body.ClassID
			}
			if body.SubjectID != "" {
				q.SubjectID = body.SubjectID
			}
			if body.SubjectName != "" {
				q.SubjectName = body.SubjectName
			}
			if body.ChapterID != "" {
				q.ChapterID = body.ChapterID
			}
			if body.TopicID != "" {
				q.TopicID = body.TopicID
			}
			if body.Type != "" {
				q.Type = body.Type
			}
			if body.Difficulty != "" {
				q.Difficulty = body.Difficulty
			}
			if body.Marks > 0 {
				q.Marks = body.Marks
			}
			if body.Status != "" {
				q.Status = body.Status
			}
			if len(body.Options) > 0 && string(body.Options) != "null" {
				var asString string
				if err := json.Unmarshal(body.Options, &asString); err == nil {
					q.Options = asString
				} else {
					q.Options = string(body.Options)
				}
			}
			q.UpdatedAt = time.Now()
			h.Save("questions", q)
			api.WriteResult(w, api.Ok(h.questionToMap(q)))
			return
		}
	}
	api.WriteResult(w, api.Fail("NOT_FOUND", "Question not found.", 404, nil))
}

// GlobalDeleteQuestion permanently deletes a global question.
func (h *Handler) GlobalDeleteQuestion(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	if ctx.Role != "super_admin" {
		api.WriteResult(w, api.Fail("FORBIDDEN", "Super admin only.", 403, nil))
		return
	}
	id := chi.URLParam(r, "id")

	h.Store.Lock()
	defer h.Store.Unlock()
	for i, q := range h.Store.Questions {
		if q.ID == id && q.SchoolID == globalSchoolID {
			h.Store.Questions = append(h.Store.Questions[:i], h.Store.Questions[i+1:]...)
			h.Save("questions:delete", id)
			api.WriteResult(w, api.Ok(map[string]any{"deleted": true}))
			return
		}
	}
	api.WriteResult(w, api.Fail("NOT_FOUND", "Question not found.", 404, nil))
}

// GlobalStats returns stats for the global question bank.
func (h *Handler) GlobalStats(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	if ctx.Role != "super_admin" {
		api.WriteResult(w, api.Fail("FORBIDDEN", "Super admin only.", 403, nil))
		return
	}

	h.Store.RLock()
	defer h.Store.RUnlock()

	total, mcq, short, long, easy, medium, hard := 0, 0, 0, 0, 0, 0, 0
	chapters := 0
	for _, q := range h.Store.Questions {
		if q.SchoolID != globalSchoolID || q.Status != "active" {
			continue
		}
		total++
		switch q.Type {
		case "mcq":
			mcq++
		case "short":
			short++
		case "long":
			long++
		}
		switch q.Difficulty {
		case "easy":
			easy++
		case "medium":
			medium++
		case "hard":
			hard++
		}
	}
	for _, ch := range h.Store.Chapters {
		if ch.SchoolID == globalSchoolID && ch.Status == "active" {
			chapters++
		}
	}
	api.WriteResult(w, api.Ok(map[string]any{
		"total":    total,
		"mcq":      mcq,
		"short":    short,
		"long":     long,
		"easy":     easy,
		"medium":   medium,
		"hard":     hard,
		"chapters": chapters,
	}))
}

func (h *Handler) GlobalListBoards(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	if ctx.Role != "super_admin" {
		api.WriteResult(w, api.Fail("FORBIDDEN", "Super admin only.", 403, nil))
		return
	}
	all := r.URL.Query().Get("all") == "true"

	h.Store.RLock()
	defer h.Store.RUnlock()

	out := make([]*store.Board, 0)
	for _, b := range h.Store.Boards {
		if !all && !b.IsActive {
			continue
		}
		out = append(out, b)
	}
	out = append(out, &store.Board{
		ID:        "__unassigned__",
		Name:      "School Classes (Unassigned)",
		Code:      "SCHOOL",
		IsActive:  true,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	})
	api.WriteResult(w, api.Ok(out))
}

func (h *Handler) GlobalCreateBoard(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	if ctx.Role != "super_admin" {
		api.WriteResult(w, api.Fail("FORBIDDEN", "Super admin only.", 403, nil))
		return
	}
	var body struct {
		Name     string `json:"name"`
		Code     string `json:"code"`
		IsActive bool   `json:"is_active"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid JSON.", 400, nil))
		return
	}
	if body.Name == "" || body.Code == "" {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Name and Code required.", 400, nil))
		return
	}

	h.Store.Lock()
	defer h.Store.Unlock()

	for _, b := range h.Store.Boards {
		if strings.EqualFold(b.Code, body.Code) {
			api.WriteResult(w, api.Fail("DUPLICATE", "Board code already exists.", 400, nil))
			return
		}
	}

	now := time.Now()
	board := &store.Board{
		ID:        store.NewID("brd"),
		Name:      body.Name,
		Code:      body.Code,
		IsActive:  body.IsActive,
		CreatedAt: now,
		UpdatedAt: now,
	}
	h.Store.Boards = append(h.Store.Boards, board)
	h.Save("boards", board)

	api.WriteResult(w, api.Ok(board))
}

func (h *Handler) GlobalUpdateBoard(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	if ctx.Role != "super_admin" {
		api.WriteResult(w, api.Fail("FORBIDDEN", "Super admin only.", 403, nil))
		return
	}
	id := chi.URLParam(r, "id")
	var body struct {
		Name     *string `json:"name"`
		Code     *string `json:"code"`
		IsActive *bool   `json:"is_active"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid JSON.", 400, nil))
		return
	}

	h.Store.Lock()
	defer h.Store.Unlock()

	var board *store.Board
	for _, b := range h.Store.Boards {
		if b.ID == id {
			board = b
			break
		}
	}
	if board == nil {
		api.WriteResult(w, api.Fail("NOT_FOUND", "Board not found.", 404, nil))
		return
	}

	if body.Code != nil && *body.Code != board.Code {
		for _, b := range h.Store.Boards {
			if b.ID != id && strings.EqualFold(b.Code, *body.Code) {
				api.WriteResult(w, api.Fail("DUPLICATE", "Board code already exists.", 400, nil))
				return
			}
		}
		board.Code = *body.Code
	}
	if body.Name != nil {
		board.Name = *body.Name
	}
	if body.IsActive != nil {
		board.IsActive = *body.IsActive
	}
	board.UpdatedAt = time.Now()
	h.Save("boards", board)

	api.WriteResult(w, api.Ok(board))
}

func (h *Handler) GlobalDeleteBoard(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	if ctx.Role != "super_admin" {
		api.WriteResult(w, api.Fail("FORBIDDEN", "Super admin only.", 403, nil))
		return
	}
	id := chi.URLParam(r, "id")

	h.Store.Lock()
	defer h.Store.Unlock()

	found := false
	for i, b := range h.Store.Boards {
		if b.ID == id {
			h.Store.Boards = append(h.Store.Boards[:i], h.Store.Boards[i+1:]...)
			found = true
			break
		}
	}
	if !found {
		api.WriteResult(w, api.Fail("NOT_FOUND", "Board not found.", 404, nil))
		return
	}
	h.Save("boards:delete", id)
	api.WriteResult(w, api.Ok(map[string]any{"deleted": true}))
}

func (h *Handler) GlobalCreateClass(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	if ctx.Role != "super_admin" {
		api.WriteResult(w, api.Fail("FORBIDDEN", "Super admin only.", 403, nil))
		return
	}
	var body struct {
		BoardID string `json:"board_id"`
		Name    string `json:"name"`
		Code    string `json:"code"`
		Grade   string `json:"grade"`
		Section string `json:"section"`
		Status  string `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid JSON.", 400, nil))
		return
	}
	if body.Name == "" || body.BoardID == "" {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Name and BoardID required.", 400, nil))
		return
	}
	if body.Status == "" {
		body.Status = "active"
	}

	h.Store.Lock()
	defer h.Store.Unlock()

	boardExists := false
	for _, b := range h.Store.Boards {
		if b.ID == body.BoardID {
			boardExists = true
			break
		}
	}
	if !boardExists {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Board does not exist.", 400, nil))
		return
	}

	now := time.Now()
	cls := &store.Class{
		ID:        store.NewID("gcls"),
		SchoolID:  globalSchoolID,
		BoardID:   body.BoardID,
		Name:      body.Name,
		Code:      body.Code,
		Grade:     body.Grade,
		Section:   body.Section,
		Status:    body.Status,
		CreatedAt: now,
		UpdatedAt: now,
	}
	h.Store.Classes = append(h.Store.Classes, cls)
	h.Save("classes", cls)

	api.WriteResult(w, api.Ok(cls))
}

func (h *Handler) GlobalUpdateClass(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	if ctx.Role != "super_admin" {
		api.WriteResult(w, api.Fail("FORBIDDEN", "Super admin only.", 403, nil))
		return
	}
	id := chi.URLParam(r, "id")
	var body struct {
		BoardID *string `json:"board_id"`
		Name    *string `json:"name"`
		Code    *string `json:"code"`
		Grade   *string `json:"grade"`
		Section *string `json:"section"`
		Status  *string `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid JSON.", 400, nil))
		return
	}

	h.Store.Lock()
	defer h.Store.Unlock()

	var cls *store.Class
	for _, c := range h.Store.Classes {
		if c.ID == id && c.SchoolID == globalSchoolID {
			cls = c
			break
		}
	}
	if cls == nil {
		api.WriteResult(w, api.Fail("NOT_FOUND", "Global class not found.", 404, nil))
		return
	}

	if body.BoardID != nil {
		boardExists := false
		for _, b := range h.Store.Boards {
			if b.ID == *body.BoardID {
				boardExists = true
				break
			}
		}
		if !boardExists {
			api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Board does not exist.", 400, nil))
			return
		}
		cls.BoardID = *body.BoardID
	}
	if body.Name != nil {
		cls.Name = *body.Name
	}
	if body.Code != nil {
		cls.Code = *body.Code
	}
	if body.Grade != nil {
		cls.Grade = *body.Grade
	}
	if body.Section != nil {
		cls.Section = *body.Section
	}
	if body.Status != nil {
		cls.Status = *body.Status
	}
	cls.UpdatedAt = time.Now()
	h.Save("classes", cls)

	api.WriteResult(w, api.Ok(cls))
}

func (h *Handler) GlobalDeleteClass(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	if ctx.Role != "super_admin" {
		api.WriteResult(w, api.Fail("FORBIDDEN", "Super admin only.", 403, nil))
		return
	}
	id := chi.URLParam(r, "id")

	h.Store.Lock()
	defer h.Store.Unlock()

	found := false
	for i, c := range h.Store.Classes {
		if c.ID == id && c.SchoolID == globalSchoolID {
			h.Store.Classes = append(h.Store.Classes[:i], h.Store.Classes[i+1:]...)
			found = true
			break
		}
	}
	if !found {
		api.WriteResult(w, api.Fail("NOT_FOUND", "Global class not found.", 404, nil))
		return
	}
	h.Save("classes:delete", id)
	api.WriteResult(w, api.Ok(map[string]any{"deleted": true}))
}

func (h *Handler) GlobalCreateSubject(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	if ctx.Role != "super_admin" {
		api.WriteResult(w, api.Fail("FORBIDDEN", "Super admin only.", 403, nil))
		return
	}
	var body struct {
		ClassID string `json:"class_id"`
		Name    string `json:"name"`
		Code    string `json:"code"`
		Status  string `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid JSON.", 400, nil))
		return
	}
	if body.Name == "" || body.ClassID == "" {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Name and ClassID required.", 400, nil))
		return
	}
	if body.Status == "" {
		body.Status = "active"
	}

	h.Store.Lock()
	defer h.Store.Unlock()

	classExists := false
	for _, c := range h.Store.Classes {
		if c.ID == body.ClassID && c.SchoolID == globalSchoolID {
			classExists = true
			break
		}
	}
	if !classExists {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Class does not exist.", 400, nil))
		return
	}

	now := time.Now()
	subj := &store.Subject{
		ID:        store.NewID("gsub"),
		SchoolID:  globalSchoolID,
		ClassID:   body.ClassID,
		Name:      body.Name,
		Code:      body.Code,
		Status:    body.Status,
		CreatedAt: now,
	}
	h.Store.Subjects = append(h.Store.Subjects, subj)
	h.Save("subjects", subj)

	api.WriteResult(w, api.Ok(subj))
}

func (h *Handler) GlobalUpdateSubject(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	if ctx.Role != "super_admin" {
		api.WriteResult(w, api.Fail("FORBIDDEN", "Super admin only.", 403, nil))
		return
	}
	id := chi.URLParam(r, "id")
	var body struct {
		ClassID *string `json:"class_id"`
		Name    *string `json:"name"`
		Code    *string `json:"code"`
		Status  *string `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid JSON.", 400, nil))
		return
	}

	h.Store.Lock()
	defer h.Store.Unlock()

	var subj *store.Subject
	for _, s := range h.Store.Subjects {
		if s.ID == id && s.SchoolID == globalSchoolID {
			subj = s
			break
		}
	}
	if subj == nil {
		api.WriteResult(w, api.Fail("NOT_FOUND", "Global subject not found.", 404, nil))
		return
	}

	if body.ClassID != nil {
		classExists := false
		for _, c := range h.Store.Classes {
			if c.ID == *body.ClassID && c.SchoolID == globalSchoolID {
				classExists = true
				break
			}
		}
		if !classExists {
			api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Class does not exist.", 400, nil))
			return
		}
		subj.ClassID = *body.ClassID
	}
	if body.Name != nil {
		subj.Name = *body.Name
	}
	if body.Code != nil {
		subj.Code = *body.Code
	}
	if body.Status != nil {
		subj.Status = *body.Status
	}
	h.Save("subjects", subj)

	api.WriteResult(w, api.Ok(subj))
}

func (h *Handler) GlobalDeleteSubject(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	if ctx.Role != "super_admin" {
		api.WriteResult(w, api.Fail("FORBIDDEN", "Super admin only.", 403, nil))
		return
	}
	id := chi.URLParam(r, "id")

	h.Store.Lock()
	defer h.Store.Unlock()

	found := false
	for i, s := range h.Store.Subjects {
		if s.ID == id && s.SchoolID == globalSchoolID {
			h.Store.Subjects = append(h.Store.Subjects[:i], h.Store.Subjects[i+1:]...)
			found = true
			break
		}
	}
	if !found {
		api.WriteResult(w, api.Fail("NOT_FOUND", "Global subject not found.", 404, nil))
		return
	}
	h.Save("subjects:delete", id)
	api.WriteResult(w, api.Ok(map[string]any{"deleted": true}))
}

func (h *Handler) GlobalUpdateChapter(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	if ctx.Role != "super_admin" {
		api.WriteResult(w, api.Fail("FORBIDDEN", "Super admin only.", 403, nil))
		return
	}
	id := chi.URLParam(r, "id")
	var body struct {
		ClassID       *string `json:"class_id"`
		ClassName     *string `json:"class_name"`
		SubjectID     *string `json:"subject_id"`
		SubjectName   *string `json:"subject_name"`
		Title         *string `json:"title"`
		ChapterNumber *int    `json:"chapter_number"`
		Status        *string `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid JSON.", 400, nil))
		return
	}

	h.Store.Lock()
	defer h.Store.Unlock()

	var ch *store.Chapter
	for _, c := range h.Store.Chapters {
		if c.ID == id && c.SchoolID == globalSchoolID {
			ch = c
			break
		}
	}
	if ch == nil {
		api.WriteResult(w, api.Fail("NOT_FOUND", "Global chapter not found.", 404, nil))
		return
	}

	if body.ClassID != nil {
		ch.ClassID = *body.ClassID
	}
	if body.ClassName != nil {
		ch.ClassName = *body.ClassName
	}
	if body.SubjectID != nil {
		ch.SubjectID = *body.SubjectID
	}
	if body.SubjectName != nil {
		ch.SubjectName = *body.SubjectName
	}
	if body.Title != nil {
		ch.Title = *body.Title
	}
	if body.ChapterNumber != nil {
		ch.ChapterNumber = *body.ChapterNumber
	}
	if body.Status != nil {
		ch.Status = *body.Status
	}
	ch.UpdatedAt = time.Now()
	h.Save("chapters", ch)

	api.WriteResult(w, api.Ok(h.chapterToMap(ch)))
}

func (h *Handler) GlobalListTopics(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	if ctx.Role != "super_admin" {
		api.WriteResult(w, api.Fail("FORBIDDEN", "Super admin only.", 403, nil))
		return
	}
	chapterID := r.URL.Query().Get("chapter_id")
	all := r.URL.Query().Get("all") == "true"

	h.Store.RLock()
	defer h.Store.RUnlock()

	out := make([]*store.Topic, 0)
	for _, t := range h.Store.Topics {
		if chapterID != "" && t.ChapterID != chapterID {
			continue
		}
		if !all && !t.IsActive {
			continue
		}
		out = append(out, t)
	}
	api.WriteResult(w, api.Ok(out))
}

func (h *Handler) GlobalCreateTopic(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	if ctx.Role != "super_admin" {
		api.WriteResult(w, api.Fail("FORBIDDEN", "Super admin only.", 403, nil))
		return
	}
	var body struct {
		ChapterID   string `json:"chapter_id"`
		Name        string `json:"name"`
		Code        string `json:"code"`
		Description string `json:"description"`
		IsActive    bool   `json:"is_active"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid JSON.", 400, nil))
		return
	}
	if body.Name == "" || body.ChapterID == "" {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Name and ChapterID required.", 400, nil))
		return
	}

	h.Store.Lock()
	defer h.Store.Unlock()

	chapterExists := false
	for _, ch := range h.Store.Chapters {
		if ch.ID == body.ChapterID && ch.SchoolID == globalSchoolID {
			chapterExists = true
			break
		}
	}
	if !chapterExists {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Chapter does not exist.", 400, nil))
		return
	}

	now := time.Now()
	topic := &store.Topic{
		ID:          store.NewID("top"),
		ChapterID:   body.ChapterID,
		Name:        body.Name,
		Code:        body.Code,
		Description: body.Description,
		IsActive:    body.IsActive,
		CreatedAt:   now,
		UpdatedAt:   now,
	}
	h.Store.Topics = append(h.Store.Topics, topic)
	h.Save("topics", topic)

	api.WriteResult(w, api.Ok(topic))
}

func (h *Handler) GlobalUpdateTopic(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	if ctx.Role != "super_admin" {
		api.WriteResult(w, api.Fail("FORBIDDEN", "Super admin only.", 403, nil))
		return
	}
	id := chi.URLParam(r, "id")
	var body struct {
		ChapterID   *string `json:"chapter_id"`
		Name        *string `json:"name"`
		Code        *string `json:"code"`
		Description *string `json:"description"`
		IsActive    *bool   `json:"is_active"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid JSON.", 400, nil))
		return
	}

	h.Store.Lock()
	defer h.Store.Unlock()

	var topic *store.Topic
	for _, t := range h.Store.Topics {
		if t.ID == id {
			topic = t
			break
		}
	}
	if topic == nil {
		api.WriteResult(w, api.Fail("NOT_FOUND", "Topic not found.", 404, nil))
		return
	}

	if body.ChapterID != nil {
		chapterExists := false
		for _, ch := range h.Store.Chapters {
			if ch.ID == *body.ChapterID && ch.SchoolID == globalSchoolID {
				chapterExists = true
				break
			}
		}
		if !chapterExists {
			api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Chapter does not exist.", 400, nil))
			return
		}
		topic.ChapterID = *body.ChapterID
	}
	if body.Name != nil {
		topic.Name = *body.Name
	}
	if body.Code != nil {
		topic.Code = *body.Code
	}
	if body.Description != nil {
		topic.Description = *body.Description
	}
	if body.IsActive != nil {
		topic.IsActive = *body.IsActive
	}
	topic.UpdatedAt = time.Now()
	h.Save("topics", topic)

	api.WriteResult(w, api.Ok(topic))
}

func (h *Handler) GlobalDeleteTopic(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	if ctx.Role != "super_admin" {
		api.WriteResult(w, api.Fail("FORBIDDEN", "Super admin only.", 403, nil))
		return
	}
	id := chi.URLParam(r, "id")

	h.Store.Lock()
	defer h.Store.Unlock()

	found := false
	for i, t := range h.Store.Topics {
		if t.ID == id {
			h.Store.Topics = append(h.Store.Topics[:i], h.Store.Topics[i+1:]...)
			found = true
			break
		}
	}
	if !found {
		api.WriteResult(w, api.Fail("NOT_FOUND", "Topic not found.", 404, nil))
		return
	}
	h.Save("topics:delete", id)
	api.WriteResult(w, api.Ok(map[string]any{"deleted": true}))
}

func (h *Handler) GlobalBulkArchiveQuestions(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	if ctx.Role != "super_admin" {
		api.WriteResult(w, api.Fail("FORBIDDEN", "Super admin only.", 403, nil))
		return
	}
	var body bulkActionInput
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid JSON body.", 400, nil))
		return
	}

	idSet := make(map[string]bool, len(body.IDs))
	for _, id := range body.IDs {
		idSet[id] = true
	}

	h.Store.Lock()
	defer h.Store.Unlock()

	count := 0
	for _, q := range h.Store.Questions {
		if idSet[q.ID] && q.SchoolID == globalSchoolID {
			q.Status = "archived"
			q.UpdatedAt = time.Now()
			h.Save("questions", q)
			count++
		}
	}
	api.WriteResult(w, api.Ok(map[string]any{"archived": count}))
}

func (h *Handler) GlobalBulkDeleteQuestions(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	if ctx.Role != "super_admin" {
		api.WriteResult(w, api.Fail("FORBIDDEN", "Super admin only.", 403, nil))
		return
	}
	var body bulkActionInput
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid JSON body.", 400, nil))
		return
	}
	idSet := make(map[string]bool, len(body.IDs))
	for _, id := range body.IDs {
		idSet[id] = true
	}

	h.Store.Lock()
	defer h.Store.Unlock()

	kept := make([]*store.Question, 0, len(h.Store.Questions))
	count := 0
	for _, q := range h.Store.Questions {
		if idSet[q.ID] && q.SchoolID == globalSchoolID {
			h.Save("questions:delete", q.ID)
			count++
			continue
		}
		kept = append(kept, q)
	}
	h.Store.Questions = kept
	api.WriteResult(w, api.Ok(map[string]any{"deleted": count}))
}

func (h *Handler) GlobalBulkApproveQuestions(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	if ctx.Role != "super_admin" {
		api.WriteResult(w, api.Fail("FORBIDDEN", "Super admin only.", 403, nil))
		return
	}
	var body bulkActionInput
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid JSON body.", 400, nil))
		return
	}
	idSet := make(map[string]bool, len(body.IDs))
	for _, id := range body.IDs {
		idSet[id] = true
	}

	h.Store.Lock()
	defer h.Store.Unlock()

	count := 0
	now := time.Now()
	for _, q := range h.Store.Questions {
		if idSet[q.ID] && q.SchoolID == globalSchoolID {
			q.ApprovalStatus = "approved"
			q.IsGlobal = true
			q.ApprovedBy = ctx.UserID
			q.ApprovedAt = &now
			q.UpdatedAt = now
			h.Save("questions", q)
			count++
		}
	}
	api.WriteResult(w, api.Ok(map[string]any{"approved": count}))
}

func (h *Handler) GlobalBulkRejectQuestions(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	if ctx.Role != "super_admin" {
		api.WriteResult(w, api.Fail("FORBIDDEN", "Super admin only.", 403, nil))
		return
	}
	var body bulkActionInput
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid JSON body.", 400, nil))
		return
	}
	idSet := make(map[string]bool, len(body.IDs))
	for _, id := range body.IDs {
		idSet[id] = true
	}

	h.Store.Lock()
	defer h.Store.Unlock()

	count := 0
	for _, q := range h.Store.Questions {
		if idSet[q.ID] && q.SchoolID == globalSchoolID {
			q.ApprovalStatus = "rejected"
			q.IsGlobal = false
			q.UpdatedAt = time.Now()
			h.Save("questions", q)
			count++
		}
	}
	api.WriteResult(w, api.Ok(map[string]any{"rejected": count}))
}
