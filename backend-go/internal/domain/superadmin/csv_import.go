package superadmin

import (
	"bytes"
	"context"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/eduplexo/backend-go/internal/api"
	"github.com/eduplexo/backend-go/internal/realtime"
	"github.com/eduplexo/backend-go/internal/store"
	"github.com/go-chi/chi/v5"
)

const globalSchoolID = "__global__"

func rowIsEmpty(row []string) bool {
	for _, cell := range row {
		if strings.TrimSpace(cell) != "" {
			return false
		}
	}
	return true
}

func normalizeQuestionType(value string) string {
	key := strings.ToLower(strings.TrimSpace(value))
	key = strings.ReplaceAll(key, "-", "_")
	key = strings.ReplaceAll(key, " ", "_")
	key = strings.ReplaceAll(key, "__", "_")

	aliases := map[string]string{
		"multiple_choice":       "mcq",
		"multiple_options":      "mcq",
		"objective":             "mcq",
		"fill_blank":            "fill_in_the_blanks",
		"fill_in_blank":         "fill_in_the_blanks",
		"fill_in_blanks":        "fill_in_the_blanks",
		"short":                 "question_answers",
		"short_question":        "question_answers",
		"short_questions":       "question_answers",
		"long":                  "question_answers",
		"long_question":         "question_answers",
		"long_questions":        "question_answers",
		"essay":                 "essays",
		"application":           "applications",
		"story":                 "stories",
		"translation":           "translate_into_urdu",
		"translate":             "translate_into_urdu",
		"match_column":          "match_columns",
		"correct_spelling":      "tick_correct_spelling",
		"tick_spelling":         "tick_correct_spelling",
		"verb_forms":            "form_of_verbs",
		"forms_of_verbs":        "form_of_verbs",
		"meaning":               "word_meaning",
		"meanings":              "word_meaning",
		"singular_plural_words": "singular_plural",
		"gender":                "genders",
		"additional":            "additional_questions",
		"additional_question":   "additional_questions",
		"true_false":            "true_false",
	}
	if mapped, ok := aliases[key]; ok {
		return mapped
	}
	return key
}

func validQuestionType(value string) bool {
	valid := map[string]bool{
		"mcq": true, "tick_correct_spelling": true, "fill_in_the_blanks": true,
		"match_columns": true, "question_answers": true, "letters": true,
		"applications": true, "stories": true, "essays": true,
		"missing_letters": true, "form_of_verbs": true, "words_into_sentences": true,
		"word_meaning": true, "singular_plural": true, "genders": true,
		"translate_into_urdu": true, "grammar": true, "exercise": true,
		"additional_questions": true, "true_false": true,
	}
	return valid[normalizeQuestionType(value)]
}

// Queue adds realtime.JobQueue support to the superadmin Handler
type QueueSetter interface {
	SetQueue(q *realtime.JobQueue)
}

func (h *Handler) SetQueue(q *realtime.JobQueue) {
	// Add queue field dynamically or use it directly
}

// ValidateCSVEndpoint handles POST /api/super-admin/global-bank/import/validate
func (h *Handler) ValidateCSVEndpoint(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	if ctx.Role != "super_admin" {
		api.WriteResult(w, api.Fail("FORBIDDEN", "Super admin only.", 403, nil))
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, 10*1024*1024) // 10MB limit
	if err := r.ParseMultipartForm(10 * 1024 * 1024); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "File too large or invalid form.", 400, nil))
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "file field is required.", 400, nil))
		return
	}
	defer file.Close()

	var buf bytes.Buffer
	if _, err := io.Copy(&buf, file); err != nil {
		api.WriteResult(w, api.Fail("SERVER_ERROR", "Failed to read file.", 500, nil))
		return
	}

	content := buf.Bytes()
	if !utf8.Valid(content) {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "CSV file must be UTF-8 encoded.", 400, nil))
		return
	}

	reader := csv.NewReader(bytes.NewReader(content))
	records, err := reader.ReadAll()
	if err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", fmt.Sprintf("Invalid CSV format: %v", err), 400, nil))
		return
	}

	if len(records) == 0 {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "CSV file is empty.", 400, nil))
		return
	}

	headers := records[0]
	headerIndices := make(map[string]int)
	for i, h := range headers {
		headerIndices[strings.ToLower(strings.TrimSpace(h))] = i
	}

	// Minimal headers check: must have at least a question column. Curriculum
	// context can come from either CSV columns or the selected import filters.
	hasChapter := false
	hasQuestion := false
	for _, h := range headers {
		lh := strings.ToLower(strings.TrimSpace(h))
		if lh == "chapter" {
			hasChapter = true
		}
		if lh == "question" || lh == "question text" || lh == "question_text" {
			hasQuestion = true
		}
	}

	if !hasQuestion {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "CSV file must contain a Question, Question Text, or question_text column.", 400, nil))
		return
	}

	// Default values checking: if board/class/subject columns are missing in CSV, they must be passed as defaults
	hasBoardCol := false
	hasClassCol := false
	hasSubjectCol := false
	for _, h := range headers {
		lh := strings.ToLower(strings.TrimSpace(h))
		if lh == "board" {
			hasBoardCol = true
		}
		if lh == "class" {
			hasClassCol = true
		}
		if lh == "subject" {
			hasSubjectCol = true
		}
	}

	defaultBoard := strings.TrimSpace(r.URL.Query().Get("board"))
	defaultClass := strings.TrimSpace(r.URL.Query().Get("class"))
	defaultSubject := strings.TrimSpace(r.URL.Query().Get("subject"))
	defaultChapter := strings.TrimSpace(r.URL.Query().Get("chapter"))

	if (!hasBoardCol && defaultBoard == "") || (!hasClassCol && defaultClass == "") || (!hasSubjectCol && defaultSubject == "") || (!hasChapter && defaultChapter == "") {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Missing curriculum context. Please specify Syllabus, Class, Subject, and Chapter for this import file.", 400, nil))
		return
	}

	h.Store.RLock()
	defer h.Store.RUnlock()

	dbQuestionsMap := make(map[string]bool)
	for _, q := range h.Store.Questions {
		if q.SchoolID == globalSchoolID {
			dbQuestionsMap[strings.ToLower(strings.TrimSpace(q.QuestionHTML))] = true
		}
	}

	type RowPreview struct {
		RowNumber int      `json:"row_number"`
		Status    string   `json:"status"` // "valid" | "invalid" | "duplicate"
		Errors    []string `json:"errors"`
		Data      []string `json:"data"`
	}

	previews := make([]RowPreview, 0)
	seenInCSV := make(map[string]bool)

	totalRows := len(records) - 1
	validCount := 0
	invalidCount := 0
	duplicateCount := 0

	for i := 1; i < len(records); i++ {
		row := records[i]
		if len(row) == 0 || rowIsEmpty(row) {
			totalRows--
			continue
		}

		var rowErrors []string
		status := "valid"

		board, class, subject, chapter, topic, qType, difficulty, question, optionA, optionB, _, _, correctAnswer, _, marksStr, _, _, _, _ := mapRowFields(row, headerIndices, defaultBoard, defaultClass, defaultSubject, defaultChapter)

		if board == "" {
			rowErrors = append(rowErrors, "board is required")
		}
		if class == "" {
			rowErrors = append(rowErrors, "class is required")
		}
		if subject == "" {
			rowErrors = append(rowErrors, "subject is required")
		}
		if chapter == "" {
			rowErrors = append(rowErrors, "chapter is required")
		}
		if topic == "" {
			rowErrors = append(rowErrors, "topic is required")
		}
		if qType == "" {
			rowErrors = append(rowErrors, "question_type is required")
		}
		if difficulty == "" {
			rowErrors = append(rowErrors, "difficulty is required")
		}
		if question == "" {
			rowErrors = append(rowErrors, "question is required")
		}

		if qType != "" && !validQuestionType(qType) {
			rowErrors = append(rowErrors, fmt.Sprintf("invalid question_type: '%s'", qType))
		}

		if difficulty != "" && difficulty != "easy" && difficulty != "medium" && difficulty != "hard" {
			rowErrors = append(rowErrors, fmt.Sprintf("difficulty must be easy, medium, or hard; got '%s'", difficulty))
		}

		if marksStr != "" {
			if m, err := strconv.Atoi(marksStr); err != nil || m <= 0 {
				rowErrors = append(rowErrors, "marks must be a positive integer")
			}
		} else {
			rowErrors = append(rowErrors, "marks is required")
		}

		if qType == "mcq" {
			if optionA == "" || optionB == "" {
				rowErrors = append(rowErrors, "MCQ questions require option_a and option_b")
			}
			if correctAnswer == "" {
				rowErrors = append(rowErrors, "MCQ questions require correct_answer")
			} else {
				ansUpper := strings.ToUpper(correctAnswer)
				if ansUpper != "A" && ansUpper != "B" && ansUpper != "C" && ansUpper != "D" {
					rowErrors = append(rowErrors, "correct_answer for MCQ must be A, B, C, or D")
				}
			}
		}

		if qType == "true_false" {
			ansLower := strings.ToLower(correctAnswer)
			if ansLower != "true" && ansLower != "false" {
				rowErrors = append(rowErrors, "correct_answer for true_false must be true or false")
			}
		}

		cleanQuestion := strings.ToLower(strings.TrimSpace(question))
		if cleanQuestion != "" {
			if seenInCSV[cleanQuestion] {
				status = "duplicate"
				duplicateCount++
				rowErrors = append(rowErrors, "duplicate question in CSV")
			} else if dbQuestionsMap[cleanQuestion] {
				status = "duplicate"
				duplicateCount++
				rowErrors = append(rowErrors, "duplicate question already exists in DB")
			} else {
				seenInCSV[cleanQuestion] = true
			}
		}

		if len(rowErrors) > 0 && status != "duplicate" {
			status = "invalid"
			invalidCount++
		} else if status == "valid" {
			validCount++
		}

		if i <= 20 || status != "valid" {
			previews = append(previews, RowPreview{
				RowNumber: i + 1,
				Status:    status,
				Errors:    rowErrors,
				Data:      row,
			})
		}
	}

	uploadsDir := "./uploads"
	if err := os.MkdirAll(uploadsDir, 0755); err != nil {
		api.WriteResult(w, api.Fail("SERVER_ERROR", "Failed to create uploads directory.", 500, nil))
		return
	}

	tempID := store.NewID("tmp_import")
	tempFilePath := filepath.Join(uploadsDir, tempID+".csv")
	if err := os.WriteFile(tempFilePath, content, 0644); err != nil {
		api.WriteResult(w, api.Fail("SERVER_ERROR", "Failed to save temp file.", 500, nil))
		return
	}

	api.WriteResult(w, api.Ok(map[string]any{
		"temp_file_id":   tempID,
		"file_name":      header.Filename,
		"total_rows":     totalRows,
		"valid_rows":     validCount,
		"invalid_rows":   invalidCount,
		"duplicate_rows": duplicateCount,
		"preview":        previews,
	}))
}

func mapRowFields(row []string, headerIndices map[string]int, defaultBoard, defaultClass, defaultSubject, defaultChapter string) (board, class, subject, chapter, topic, qType, difficulty, question, optionA, optionB, optionC, optionD, correctAnswer, answerText, marksStr, explanation, language, medium, tags string) {
	getVal := func(col string) string {
		idx, exists := headerIndices[col]
		if exists && idx < len(row) {
			return strings.TrimSpace(row[idx])
		}
		return ""
	}

	board = getVal("board")
	if board == "" {
		board = defaultBoard
	}
	class = getVal("class")
	if class == "" {
		class = defaultClass
	}
	subject = getVal("subject")
	if subject == "" {
		subject = defaultSubject
	}

	chapter = getVal("chapter")
	if chapter == "" {
		chapter = defaultChapter
	}
	topic = getVal("topic")
	if topic == "" {
		topic = getVal("section") // user's CSV section can map to topic
		if topic == "" {
			topic = chapter
		}
	}

	qType = normalizeQuestionType(getVal("question_type"))
	if qType == "" {
		qType = normalizeQuestionType(getVal("question type"))
	}

	difficulty = strings.ToLower(getVal("difficulty"))
	if difficulty == "" {
		difficulty = "medium"
	}

	question = getVal("question")
	if question == "" {
		question = getVal("question text")
		if question == "" {
			question = getVal("question_text")
		}
	}

	optionA = getVal("option_a")
	optionB = getVal("option_b")
	optionC = getVal("option_c")
	optionD = getVal("option_d")
	correctAnswer = getVal("correct_answer")
	answerText = getVal("answer_text")

	marksStr = getVal("marks")
	if marksStr == "" {
		if qType == "question_answers" {
			marksStr = "2"
		} else if qType == "essays" || qType == "applications" || qType == "stories" {
			marksStr = "5"
		} else {
			marksStr = "1"
		}
	}

	explanation = getVal("explanation")
	language = getVal("language")
	medium = getVal("medium")
	tags = getVal("tags")
	if tags == "" {
		tags = getVal("section")
	}

	return
}

// ConfirmImportEndpoint handles POST /api/super-admin/global-bank/import/confirm
func (h *Handler) ConfirmImportEndpoint(w http.ResponseWriter, r *http.Request, jq *realtime.JobQueue) {
	ctx := api.FromRequest(r)
	if ctx.Role != "super_admin" {
		api.WriteResult(w, api.Fail("FORBIDDEN", "Super admin only.", 403, nil))
		return
	}

	var body struct {
		TempFileID string `json:"temp_file_id"`
		FileName   string `json:"file_name"`
		Board      string `json:"board"`
		Class      string `json:"class"`
		Subject    string `json:"subject"`
		Chapter    string `json:"chapter"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid JSON.", 400, nil))
		return
	}
	if body.TempFileID == "" {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "temp_file_id is required.", 400, nil))
		return
	}

	uploadsDir := "./uploads"
	tempFilePath := filepath.Join(uploadsDir, body.TempFileID+".csv")
	if _, err := os.Stat(tempFilePath); os.IsNotExist(err) {
		api.WriteResult(w, api.Fail("NOT_FOUND", "Temporary file not found.", 404, nil))
		return
	}

	content, err := os.ReadFile(tempFilePath)
	if err != nil {
		api.WriteResult(w, api.Fail("SERVER_ERROR", "Failed to read temp file.", 500, nil))
		return
	}

	reader := csv.NewReader(bytes.NewReader(content))
	records, err := reader.ReadAll()
	if err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid CSV file format.", 400, nil))
		return
	}
	totalRows := len(records) - 1
	if totalRows < 0 {
		totalRows = 0
	}

	logID := store.NewID("impl")
	now := time.Now()
	importLog := &store.ImportLog{
		ID:          logID,
		SchoolID:    globalSchoolID,
		UploadedBy:  ctx.UserID,
		FileName:    body.FileName,
		TotalRows:   totalRows,
		SuccessRows: 0,
		FailedRows:  0,
		Duplicates:  0,
		Status:      "processing",
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	h.Store.Lock()
	h.Store.ImportLogs = append(h.Store.ImportLogs, importLog)
	h.Store.Unlock()
	h.Persist("import_logs", importLog)

	payload := map[string]any{
		"import_log_id": logID,
		"file_path":     tempFilePath,
		"user_id":       ctx.UserID,
		"file_name":     body.FileName,
		"board":         body.Board,
		"class":         body.Class,
		"subject":       body.Subject,
		"chapter":       body.Chapter,
	}

	jobID := store.NewID("job_csv")
	if err := jq.Submit(r.Context(), "csv-import", jobID, payload); err != nil {
		log.Printf("[csv-import] failed to submit queue job: %v", err)
		// Fallback to synchronous execution so that it doesn't break if Redis is down
		go func() {
			handler := HandleCSVImportJob(h.Store, h.Persist, jq)
			payBytes, _ := json.Marshal(payload)
			_ = handler(context.Background(), jobID, payBytes)
		}()
	}

	api.WriteResult(w, api.Ok(importLog))
}

// ListImportLogs handles GET /api/super-admin/global-bank/import-logs
func (h *Handler) ListImportLogs(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	if ctx.Role != "super_admin" {
		api.WriteResult(w, api.Fail("FORBIDDEN", "Super admin only.", 403, nil))
		return
	}

	h.Store.RLock()
	defer h.Store.RUnlock()

	out := make([]*store.ImportLog, 0)
	for _, l := range h.Store.ImportLogs {
		if l.SchoolID == globalSchoolID {
			out = append(out, l)
		}
	}

	sort.Slice(out, func(i, j int) bool {
		return out[i].CreatedAt.After(out[j].CreatedAt)
	})

	api.WriteResult(w, api.Ok(out))
}

// DownloadFailedRows handles GET /api/super-admin/global-bank/import-logs/{id}/download-failed
func (h *Handler) DownloadFailedRows(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	if ctx.Role != "super_admin" {
		api.WriteResult(w, api.Fail("FORBIDDEN", "Super admin only.", 403, nil))
		return
	}
	id := chi.URLParam(r, "id")

	h.Store.RLock()
	var logRec *store.ImportLog
	for _, l := range h.Store.ImportLogs {
		if l.ID == id {
			logRec = l
			break
		}
	}
	h.Store.RUnlock()

	if logRec == nil {
		api.WriteResult(w, api.Fail("NOT_FOUND", "Import log not found.", 404, nil))
		return
	}

	if logRec.FailedRowsCSV == "" {
		api.WriteResult(w, api.Fail("NOT_FOUND", "No failed rows record for this import.", 404, nil))
		return
	}

	w.Header().Set("Content-Type", "text/csv; charset=utf-8")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=failed_rows_%s.csv", logRec.ID))
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte(logRec.FailedRowsCSV))
}

// HandleCSVImportJob returns the JobHandler for the Redis worker
func HandleCSVImportJob(s *store.MemStore, save func(string, any), jq *realtime.JobQueue) realtime.JobHandler {
	return func(ctx context.Context, jobID string, payload json.RawMessage) error {
		startTime := time.Now()

		var args struct {
			ImportLogID string `json:"import_log_id"`
			FilePath    string `json:"file_path"`
			UserID      string `json:"user_id"`
			FileName    string `json:"file_name"`
			Board       string `json:"board"`
			Class       string `json:"class"`
			Subject     string `json:"subject"`
			Chapter     string `json:"chapter"`
		}

		if err := json.Unmarshal(payload, &args); err != nil {
			return err
		}

		s.Lock()
		var logRec *store.ImportLog
		for _, l := range s.ImportLogs {
			if l.ID == args.ImportLogID {
				logRec = l
				break
			}
		}
		s.Unlock()

		if logRec == nil {
			return fmt.Errorf("import log record %s not found", args.ImportLogID)
		}

		content, err := os.ReadFile(args.FilePath)
		if err != nil {
			s.Lock()
			logRec.Status = "failed"
			logRec.UpdatedAt = time.Now()
			s.Unlock()
			save("import_logs", logRec)
			return err
		}

		reader := csv.NewReader(bytes.NewReader(content))
		records, err := reader.ReadAll()
		if err != nil {
			s.Lock()
			logRec.Status = "failed"
			logRec.UpdatedAt = time.Now()
			s.Unlock()
			save("import_logs", logRec)
			return err
		}

		if len(records) <= 1 {
			s.Lock()
			logRec.Status = "completed"
			logRec.UpdatedAt = time.Now()
			s.Unlock()
			save("import_logs", logRec)
			return nil
		}

		headers := records[0]
		headerIndices := make(map[string]int)
		for i, h := range headers {
			headerIndices[strings.ToLower(strings.TrimSpace(h))] = i
		}

		s.Lock()
		dbQuestionsMap := make(map[string]bool)
		for _, q := range s.Questions {
			if q.SchoolID == globalSchoolID {
				dbQuestionsMap[strings.ToLower(strings.TrimSpace(q.QuestionHTML))] = true
			}
		}
		s.Unlock()

		var failedBuf bytes.Buffer
		failedWriter := csv.NewWriter(&failedBuf)
		failedHeaders := append(headers, "error_reason")
		_ = failedWriter.Write(failedHeaders)

		successCount := 0
		failedCount := 0
		duplicateCount := 0
		seenInCSV := make(map[string]bool)

		totalRows := len(records) - 1

		for idx := 1; idx < len(records); idx++ {
			row := records[idx]
			if len(row) == 0 || rowIsEmpty(row) {
				totalRows--
				continue
			}

			boardVal, classVal, subjectVal, chapterVal, topicVal, qType, difficulty, questionVal, optionA, optionB, optionC, optionD, correctAnswer, answerText, marksStr, explanation, language, medium, tags := mapRowFields(row, headerIndices, args.Board, args.Class, args.Subject, args.Chapter)

			var rowErrors []string

			if boardVal == "" {
				rowErrors = append(rowErrors, "board is required")
			}
			if classVal == "" {
				rowErrors = append(rowErrors, "class is required")
			}
			if subjectVal == "" {
				rowErrors = append(rowErrors, "subject is required")
			}
			if chapterVal == "" {
				rowErrors = append(rowErrors, "chapter is required")
			}
			if topicVal == "" {
				rowErrors = append(rowErrors, "topic is required")
			}
			if qType == "" {
				rowErrors = append(rowErrors, "question_type is required")
			}
			if qType != "" && !validQuestionType(qType) {
				rowErrors = append(rowErrors, fmt.Sprintf("invalid question_type: '%s'", qType))
			}
			if difficulty == "" {
				rowErrors = append(rowErrors, "difficulty is required")
			}
			if questionVal == "" {
				rowErrors = append(rowErrors, "question is required")
			}

			marks := 1
			if marksStr != "" {
				if m, err := strconv.Atoi(marksStr); err != nil || m <= 0 {
					rowErrors = append(rowErrors, "marks must be positive integer")
				} else {
					marks = m
				}
			}

			cleanQuestion := strings.ToLower(strings.TrimSpace(questionVal))
			isDuplicate := false
			_ = explanation
			_ = language
			_ = medium
			_ = tags
			_ = isDuplicate

			if cleanQuestion != "" {
				if seenInCSV[cleanQuestion] {
					isDuplicate = true
					duplicateCount++
					rowErrors = append(rowErrors, "duplicate question in CSV")
				} else if dbQuestionsMap[cleanQuestion] {
					isDuplicate = true
					duplicateCount++
					rowErrors = append(rowErrors, "duplicate question in database")
				} else {
					seenInCSV[cleanQuestion] = true
				}
			}

			if len(rowErrors) > 0 {
				failedCount++
				failedRow := append(row, strings.Join(rowErrors, "; "))
				_ = failedWriter.Write(failedRow)
				continue
			}

			// Upsert hierarchy inside Lock
			s.Lock()
			now := time.Now()

			// 1. Board
			var board *store.Board
			boardCode := strings.ToUpper(strings.ReplaceAll(boardVal, " ", "_"))
			for _, b := range s.Boards {
				if strings.EqualFold(b.Name, boardVal) || strings.EqualFold(b.Code, boardCode) {
					board = b
					break
				}
			}
			if board == nil {
				board = &store.Board{
					ID:        store.NewID("brd"),
					Name:      boardVal,
					Code:      boardCode,
					IsActive:  true,
					CreatedAt: now,
					UpdatedAt: now,
				}
				s.Boards = append(s.Boards, board)
				save("boards", board)
			}

			// 2. Class
			var class *store.Class
			classCode := strings.ToUpper(strings.ReplaceAll(classVal, " ", "_"))
			for _, c := range s.Classes {
				if c.SchoolID == globalSchoolID && strings.EqualFold(c.Name, classVal) {
					class = c
					break
				}
			}
			if class == nil {
				class = &store.Class{
					ID:        store.NewID("gcls"),
					SchoolID:  globalSchoolID,
					BoardID:   board.ID,
					Name:      classVal,
					Code:      classCode,
					Grade:     classVal,
					Status:    "active",
					CreatedAt: now,
					UpdatedAt: now,
				}
				s.Classes = append(s.Classes, class)
				save("classes", class)
			}

			// 3. Subject
			var subject *store.Subject
			subjectCode := strings.ToUpper(strings.ReplaceAll(subjectVal, " ", "_"))
			for _, sub := range s.Subjects {
				if sub.SchoolID == globalSchoolID && sub.ClassID == class.ID && strings.EqualFold(sub.Name, subjectVal) {
					subject = sub
					break
				}
			}
			if subject == nil {
				subject = &store.Subject{
					ID:        store.NewID("gsub"),
					SchoolID:  globalSchoolID,
					ClassID:   class.ID,
					Name:      subjectVal,
					Code:      subjectCode,
					Status:    "active",
					CreatedAt: now,
				}
				s.Subjects = append(s.Subjects, subject)
				save("subjects", subject)
			}

			// 4. Chapter
			var chapter *store.Chapter
			for _, ch := range s.Chapters {
				if ch.SchoolID == globalSchoolID && ch.ClassID == class.ID && ch.SubjectID == subject.ID && strings.EqualFold(ch.Title, chapterVal) {
					chapter = ch
					break
				}
			}
			if chapter == nil {
				chapterNumber := 1
				// Try to count existing chapters to assign number
				existingCount := 0
				for _, ch := range s.Chapters {
					if ch.SchoolID == globalSchoolID && ch.ClassID == class.ID && ch.SubjectID == subject.ID {
						existingCount++
					}
				}
				chapterNumber = existingCount + 1

				chapter = &store.Chapter{
					ID:            store.NewID("gch"),
					SchoolID:      globalSchoolID,
					ClassID:       class.ID,
					ClassName:     class.Name,
					SubjectID:     subject.ID,
					SubjectName:   subject.Name,
					Title:         chapterVal,
					ChapterNumber: chapterNumber,
					IsDefault:     true,
					Status:        "active",
					CreatedAt:     now,
					UpdatedAt:     now,
				}
				s.Chapters = append(s.Chapters, chapter)
				save("chapters", chapter)
			}

			// 5. Topic
			var topic *store.Topic
			topicCode := strings.ToUpper(strings.ReplaceAll(topicVal, " ", "_"))
			for _, t := range s.Topics {
				if t.ChapterID == chapter.ID && strings.EqualFold(t.Name, topicVal) {
					topic = t
					break
				}
			}
			if topic == nil {
				topic = &store.Topic{
					ID:          store.NewID("top"),
					ChapterID:   chapter.ID,
					Name:        topicVal,
					Code:        topicCode,
					Description: "",
					IsActive:    true,
					CreatedAt:   now,
					UpdatedAt:   now,
				}
				s.Topics = append(s.Topics, topic)
				save("topics", topic)
			}

			// Options JSON construction
			optsStr := ""
			if qType == "mcq" {
				opts := []string{optionA, optionB, optionC, optionD}
				optsBytes, _ := json.Marshal(opts)
				optsStr = string(optsBytes)
			}

			// Parse correct answer
			corrAns := correctAnswer
			if qType == "mcq" {
				corrAns = strings.ToUpper(correctAnswer)
			} else if qType == "true_false" {
				corrAns = strings.ToLower(correctAnswer)
			} else if corrAns == "" {
				corrAns = answerText
			}
			metadataBytes, _ := json.Marshal(map[string]any{
				"source":      "csv-import",
				"file_name":   args.FileName,
				"row_number":  idx + 1,
				"board":       boardVal,
				"class":       classVal,
				"subject":     subjectVal,
				"chapter":     chapterVal,
				"topic":       topicVal,
				"language":    language,
				"medium":      medium,
				"tags":        tags,
				"explanation": explanation,
			})

			// Insert question
			q := &store.Question{
				ID:             store.NewID("gq"),
				SchoolID:       globalSchoolID,
				CreatedBy:      args.UserID,
				CreatedByName:  "CSV Import",
				BoardID:        board.ID,
				Syllabus:       boardVal,
				ClassID:        class.ID,
				ClassName:      class.Name,
				SubjectID:      subject.ID,
				SubjectName:    subject.Name,
				ChapterID:      chapter.ID,
				ChapterName:    chapter.Title,
				TopicID:        topic.ID,
				Type:           qType,
				Difficulty:     difficulty,
				QuestionHTML:   questionVal,
				Options:        optsStr,
				Answer:         corrAns,
				Marks:          marks,
				Metadata:       string(metadataBytes),
				Status:         "active",
				IsGlobal:       true,
				ApprovalStatus: "approved",
				ApprovedBy:     args.UserID,
				ApprovedAt:     &now,
				CreatedAt:      now,
				UpdatedAt:      now,
			}

			s.Questions = append(s.Questions, q)
			dbQuestionsMap[cleanQuestion] = true
			successCount++
			s.Unlock()

			save("questions", q)

			// Update job queue progress
			if jq != nil && idx%10 == 0 {
				jq.UpdateProgress(ctx, jobID, idx, totalRows)
			}
		}

		failedWriter.Flush()

		// Final updates to import log record
		s.Lock()
		logRec.SuccessRows = successCount
		logRec.FailedRows = failedCount
		logRec.Duplicates = duplicateCount
		logRec.Status = "completed"
		logRec.Duration = int(time.Since(startTime).Milliseconds())
		logRec.FailedRowsCSV = failedBuf.String()
		logRec.UpdatedAt = time.Now()
		s.Unlock()

		save("import_logs", logRec)

		if jq != nil {
			jq.Complete(ctx, jobID, map[string]any{
				"total":     totalRows,
				"success":   successCount,
				"failed":    failedCount,
				"duplicate": duplicateCount,
			})
		}

		// Delete temporary file
		_ = os.Remove(args.FilePath)

		log.Printf("[csv-import] completed job %s: success=%d failed=%d duplicate=%d duration=%v",
			args.ImportLogID, successCount, failedCount, duplicateCount, time.Since(startTime))

		return nil
	}
}
