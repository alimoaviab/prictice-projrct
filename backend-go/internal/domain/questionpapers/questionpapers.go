// Package questionpapers implements /api/question-papers and /api/questions endpoints.
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
	ClassID      string `json:"class_id"`
	SubjectID    string `json:"subject_id"`
	ChapterID    string `json:"chapter_id"`
	Type         string `json:"type"`
	Difficulty   string `json:"difficulty"`
	QuestionHTML string `json:"question_html"`
	Options      string `json:"options"`
	Marks        int    `json:"marks"`
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

	out := make([]map[string]any, 0)
	for _, q := range h.Store.Questions {
		// School filter (super admin sees all)
		if !isSuperAdmin && q.SchoolID != ctx.SchoolID {
			continue
		}
		// Status filter
		if q.Status != status {
			continue
		}
		// Approval status filter (for moderation)
		if approvalStatus != "" && q.ApprovalStatus != approvalStatus {
			continue
		}
		// Other filters
		if classID != "" && q.ClassID != classID {
			continue
		}
		if subjectID != "" && q.SubjectID != subjectID {
			continue
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
		Options:        body.Options,
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
	return map[string]any{
		"_id":              q.ID,
		"school_id":        q.SchoolID,
		"created_by":       q.CreatedBy,
		"created_by_name":  q.CreatedByName,
		"class_id":         q.ClassID,
		"subject_id":       q.SubjectID,
		"subject_name":     q.SubjectName,
		"chapter_id":       q.ChapterID,
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
	status := r.URL.Query().Get("status")
	if status == "" {
		status = "active"
	}

	out := make([]map[string]any, 0)
	for _, ch := range h.Store.Chapters {
		if ch.SchoolID != ctx.SchoolID {
			continue
		}
		if ch.Status != status {
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
	h.Store.RUnlock()

	now := time.Now()
	ch := &store.Chapter{
		ID:            store.NewID("ch"),
		SchoolID:      ctx.SchoolID,
		ClassID:       body.ClassID,
		ClassName:     className,
		SubjectID:     body.SubjectID,
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
	for _, s := range h.Store.Subjects {
		if s.ID == body.SubjectID {
			subjectName = s.Name
			break
		}
	}
	h.Store.RUnlock()

	// Check if already seeded
	h.Store.RLock()
	for _, ch := range h.Store.Chapters {
		if ch.SchoolID == ctx.SchoolID && ch.ClassID == body.ClassID && ch.SubjectID == body.SubjectID && ch.IsDefault {
			h.Store.RUnlock()
			api.WriteResult(w, api.Ok(map[string]any{"message": "Chapters already seeded", "count": 0}))
			return
		}
	}
	h.Store.RUnlock()

	// Get default chapters for this subject/class
	defaults := getDefaultChapters(body.ClassID, className, body.SubjectID, subjectName)
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
			SubjectID:     body.SubjectID,
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

