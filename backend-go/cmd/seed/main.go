// Command seed populates the running Eduplexo backend with comprehensive
// realistic data for testing — students, teachers, classes, subjects,
// attendance, exams, results, homework, behavior, events, leave, live
// classes, fees, etc.
//
// Usage:
//   go run ./cmd/seed
//
// All data is sent via the running HTTP server's normal API. Make sure the
// backend is running on :8080 before invoking this command.
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"math/rand"
	"net/http"
	"os"
	"strings"
	"time"
)

const (
	BaseURL          = "http://localhost:8080"
	SchoolAdminEmail = "school@gmail.com"
	SchoolAdminPass  = "Test@123"
	DefaultPass      = "Test@123"

	NumClasses    = 22
	NumTeachers   = 22
	NumStudents   = 390
	DaysOfHistory = 30 // 1 month
)

var (
	subjectsList = []string{
		"Mathematics", "English", "Science", "Urdu", "Islamic Studies",
		"Pakistan Studies", "Computer Science", "Physics", "Chemistry",
		"Biology", "Geography", "History", "Art", "Physical Education",
	}

	classGrades = []string{
		"Nursery", "KG-1", "KG-2", "Class-1", "Class-2", "Class-3", "Class-4",
		"Class-5", "Class-6", "Class-7", "Class-8", "Class-9", "Class-10",
	}

	sections = []string{"A", "B", "C"}

	firstNames = []string{
		"Ali", "Ahmed", "Hassan", "Hussain", "Bilal", "Usman", "Omar", "Fahad",
		"Saad", "Awais", "Hamza", "Faizan", "Imran", "Tariq", "Junaid",
		"Sara", "Ayesha", "Fatima", "Maryam", "Hina", "Sana", "Zara", "Iqra",
		"Anum", "Samra", "Aliya", "Nida", "Saima", "Fariha", "Mahnoor",
	}

	lastNames = []string{
		"Khan", "Ahmed", "Ali", "Malik", "Sheikh", "Qureshi", "Hussain",
		"Mahmood", "Iqbal", "Shah", "Raza", "Butt", "Nawaz", "Riaz",
		"Tariq", "Akhtar", "Yousaf", "Arshad", "Farooq", "Anwar",
	}

	leaveTypes = []string{"Sick", "Casual", "Annual", "Emergency"}

	behaviorTypes = []struct {
		Category, Type, Severity string
	}{
		{"Discipline", "Late Arrival", "low"},
		{"Discipline", "Disruptive Behavior", "medium"},
		{"Discipline", "Uniform Violation", "low"},
		{"Achievement", "Excellent Performance", "low"},
		{"Achievement", "Class Participation", "low"},
		{"Discipline", "Homework Not Done", "medium"},
		{"Discipline", "Talking in Class", "low"},
		{"Achievement", "Helped Other Students", "low"},
	}

	eventTypes = []string{"Holiday", "Sports", "Meeting", "Exam", "Cultural", "Workshop"}

	rooms = []string{"101", "102", "103", "201", "202", "203", "301", "302", "401"}
)

// ─── HTTP Helpers ────────────────────────────────────────────────────────

var (
	authToken  string
	httpClient = &http.Client{Timeout: 30 * time.Second}
)

type apiEnvelope struct {
	OK      bool            `json:"ok"`
	Success bool            `json:"success"`
	Data    json.RawMessage `json:"data"`
	Message string          `json:"message"`
}

func apiCall(method, path string, body any) (json.RawMessage, error) {
	var bodyReader io.Reader
	if body != nil {
		b, err := json.Marshal(body)
		if err != nil {
			return nil, err
		}
		bodyReader = bytes.NewReader(b)
	}

	req, err := http.NewRequest(method, BaseURL+path, bodyReader)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	if authToken != "" {
		req.Header.Set("Authorization", "Bearer "+authToken)
	}

	resp, err := httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("HTTP %d: %s", resp.StatusCode, string(respBody))
	}

	var env apiEnvelope
	if err := json.Unmarshal(respBody, &env); err != nil {
		return respBody, nil
	}

	if !env.OK && !env.Success {
		return nil, fmt.Errorf("API error: %s", env.Message)
	}

	return env.Data, nil
}

// ─── Login ───────────────────────────────────────────────────────────────

func login() error {
	log.Printf("→ Logging in as %s...", SchoolAdminEmail)
	body := map[string]string{"email": SchoolAdminEmail, "password": SchoolAdminPass}
	data, err := apiCall("POST", "/api/auth/login", body)
	if err != nil {
		return fmt.Errorf("login failed: %w", err)
	}
	var loginData struct {
		Token string `json:"token"`
	}
	if err := json.Unmarshal(data, &loginData); err != nil {
		return err
	}
	authToken = loginData.Token
	log.Printf("✓ Logged in successfully")
	return nil
}

// ─── Academic Year ───────────────────────────────────────────────────────

func ensureAcademicYear() (string, error) {
	log.Println("→ Checking academic year...")
	data, err := apiCall("GET", "/api/academic-years", nil)
	if err != nil {
		return "", err
	}
	var resp struct {
		Items []struct {
			ID       string `json:"_id"`
			Year     string `json:"year"`
			IsActive bool   `json:"is_active"`
		} `json:"items"`
	}
	if err := json.Unmarshal(data, &resp); err != nil {
		// Fallback: parse as array
		var items []struct {
			ID       string `json:"_id"`
			Year     string `json:"year"`
			IsActive bool   `json:"is_active"`
		}
		if err2 := json.Unmarshal(data, &items); err2 == nil {
			resp.Items = items
		}
	}
	for _, y := range resp.Items {
		if y.IsActive {
			log.Printf("✓ Active academic year: %s", y.Year)
			return y.ID, nil
		}
	}

	// Create one
	log.Println("→ Creating academic year 2025-2026...")
	year := time.Now().Year()
	body := map[string]any{
		"year":       fmt.Sprintf("%d-%d", year, year+1),
		"start_date": fmt.Sprintf("%d-04-01", year),
		"end_date":   fmt.Sprintf("%d-03-31", year+1),
		"is_active":  true,
	}
	created, err := apiCall("POST", "/api/academic-years", body)
	if err != nil {
		return "", err
	}
	var ay struct {
		ID string `json:"_id"`
	}
	if err := json.Unmarshal(created, &ay); err != nil {
		return "", err
	}
	log.Printf("✓ Created academic year: %s", ay.ID)
	return ay.ID, nil
}

// ─── Subjects ────────────────────────────────────────────────────────────

type Subject struct {
	ID   string `json:"_id"`
	Name string `json:"name"`
}

func createSubjects() ([]Subject, error) {
	log.Println("→ Creating subjects...")

	// First check existing
	existing := make([]Subject, 0)
	if data, err := apiCall("GET", "/api/subjects", nil); err == nil {
		_ = json.Unmarshal(data, &existing)
	}
	existingNames := map[string]bool{}
	for _, s := range existing {
		existingNames[s.Name] = true
	}

	subjects := append([]Subject{}, existing...)
	for _, name := range subjectsList {
		if existingNames[name] {
			continue
		}
		code := strings.ToUpper(strings.ReplaceAll(name, " ", ""))
		if len(code) > 3 {
			code = code[:3]
		}
		body := map[string]any{
			"name":          name,
			"code":          code,
			"total_marks":   100,
			"passing_marks": 40,
			"status":        "active",
		}
		created, err := apiCall("POST", "/api/subjects", body)
		if err != nil {
			continue
		}
		var s Subject
		if err := json.Unmarshal(created, &s); err == nil {
			subjects = append(subjects, s)
		}
	}
	log.Printf("✓ Total subjects available: %d", len(subjects))
	return subjects, nil
}

// ─── Teachers ────────────────────────────────────────────────────────────

type Teacher struct {
	ID         string   `json:"_id"`
	Email      string   `json:"email"`
	FirstName  string   `json:"first_name"`
	LastName   string   `json:"last_name"`
	EmployeeNo string   `json:"employee_no"`
	Subjects   []string `json:"subjects"`
}

func createTeachers(subjects []Subject) ([]Teacher, error) {
	log.Printf("→ Creating %d teachers...", NumTeachers)

	// Fetch existing teachers first
	existing := make([]Teacher, 0)
	if data, err := apiCall("GET", "/api/teachers", nil); err == nil {
		// Try parsing as plain array
		_ = json.Unmarshal(data, &existing)
		// Try parsing as paginated
		if len(existing) == 0 {
			var paged struct {
				Items []Teacher `json:"items"`
				Data  []Teacher `json:"data"`
			}
			if err := json.Unmarshal(data, &paged); err == nil {
				if len(paged.Items) > 0 {
					existing = paged.Items
				} else if len(paged.Data) > 0 {
					existing = paged.Data
				}
			}
		}
	}

	teachers := make([]Teacher, 0, NumTeachers)
	// Map existing emails for quick lookup
	existingMap := make(map[string]Teacher)
	for _, t := range existing {
		existingMap[strings.ToLower(t.Email)] = t
	}

	for i := 1; i <= NumTeachers; i++ {
		email := fmt.Sprintf("teacher%d@gmail.com", i)
		// Reuse existing teacher if exists
		if existing, ok := existingMap[email]; ok {
			teachers = append(teachers, existing)
			continue
		}

		first := firstNames[(i-1)%len(firstNames)]
		last := lastNames[(i-1)%len(lastNames)]
		// Assign 2-3 subjects per teacher
		subjAssignments := []string{}
		for j := 0; j < 2+rand.Intn(2); j++ {
			subjAssignments = append(subjAssignments, subjects[rand.Intn(len(subjects))].Name)
		}

		body := map[string]any{
			"email":         email,
			"password":      DefaultPass,
			"first_name":    first,
			"last_name":     last,
			"phone":         fmt.Sprintf("0300%07d", 1000000+i),
			"qualification": []string{"M.Ed", "B.Ed", "M.A", "M.Sc"}[i%4],
			"subjects":      subjAssignments,
			"status":        "active",
		}
		created, err := apiCall("POST", "/api/teachers", body)
		if err != nil {
			if i <= 3 {
				log.Printf("  ⚠ Failed to create teacher %d: %v", i, err)
			}
			continue
		}
		var t Teacher
		if err := json.Unmarshal(created, &t); err == nil {
			teachers = append(teachers, t)
		}
	}
	log.Printf("✓ Total teachers available: %d", len(teachers))
	return teachers, nil
}

// ─── Classes ─────────────────────────────────────────────────────────────

type Class struct {
	ID      string `json:"_id"`
	Name    string `json:"name"`
	Section string `json:"section"`
}

func createClasses(yearID string, teachers []Teacher, subjects []Subject) ([]Class, error) {
	log.Printf("→ Creating %d classes...", NumClasses)

	// Fetch existing classes first
	existing := make([]Class, 0)
	if data, err := apiCall("GET", "/api/classes", nil); err == nil {
		var paged struct {
			Items []Class `json:"items"`
			Data  []Class `json:"data"`
		}
		if err := json.Unmarshal(data, &paged); err == nil {
			if len(paged.Items) > 0 {
				existing = paged.Items
			} else if len(paged.Data) > 0 {
				existing = paged.Data
			}
		}
		if len(existing) == 0 {
			_ = json.Unmarshal(data, &existing)
		}
	}

	existingMap := make(map[string]Class)
	for _, c := range existing {
		existingMap[c.Name] = c
	}

	classes := make([]Class, 0, NumClasses)
	for i := 0; i < NumClasses; i++ {
		grade := classGrades[i%len(classGrades)]
		section := sections[i%len(sections)]
		name := grade + "-" + section

		if existing, ok := existingMap[name]; ok {
			classes = append(classes, existing)
			continue
		}

		// Assign 2-3 teachers per class
		teacherIDs := []string{}
		for j := 0; j < 3 && len(teachers) > 0; j++ {
			teacherIDs = append(teacherIDs, teachers[rand.Intn(len(teachers))].ID)
		}
		// Assign 4-6 subjects per class
		subjectIDs := []string{}
		used := map[string]bool{}
		for j := 0; j < 5 && len(subjects) > 0; j++ {
			s := subjects[rand.Intn(len(subjects))]
			if !used[s.ID] {
				subjectIDs = append(subjectIDs, s.ID)
				used[s.ID] = true
			}
		}

		body := map[string]any{
			"name":               name,
			"grade":              grade,
			"section":            section,
			"capacity":           40,
			"passing_percentage": 40,
			"academic_year_id":   yearID,
			"class_teacher_id":   teacherIDs[0],
			"teacher_ids":        teacherIDs,
			"subject_ids":        subjectIDs,
			"room_number":        rooms[i%len(rooms)],
		}
		created, err := apiCall("POST", "/api/classes", body)
		if err != nil {
			if i < 3 {
				log.Printf("  ⚠ Failed to create class %s: %v", name, err)
			}
			continue
		}
		var c Class
		if err := json.Unmarshal(created, &c); err == nil {
			classes = append(classes, c)
		}
	}
	log.Printf("✓ Total classes available: %d", len(classes))
	return classes, nil
}

// ─── Students ────────────────────────────────────────────────────────────

type Student struct {
	ID          string `json:"_id"`
	Email       string `json:"email"`
	FirstName   string `json:"first_name"`
	LastName    string `json:"last_name"`
	AdmissionNo string `json:"admission_no"`
	ClassID     string `json:"class_id"`
}

func createStudents(classes []Class) ([]Student, error) {
	log.Printf("→ Creating %d students...", NumStudents)

	// Fetch existing students first
	existing := make([]Student, 0)
	if data, err := apiCall("GET", "/api/students", nil); err == nil {
		var paged struct {
			Items []Student `json:"items"`
			Data  []Student `json:"data"`
		}
		if err := json.Unmarshal(data, &paged); err == nil {
			if len(paged.Items) > 0 {
				existing = paged.Items
			} else if len(paged.Data) > 0 {
				existing = paged.Data
			}
		}
		if len(existing) == 0 {
			_ = json.Unmarshal(data, &existing)
		}
	}

	existingMap := make(map[string]Student)
	for _, s := range existing {
		// Match by admission_no or by full name
		if s.AdmissionNo != "" {
			existingMap[strings.ToLower(s.AdmissionNo)] = s
		}
		fullName := strings.ToLower(s.FirstName + " " + s.LastName)
		existingMap[fullName] = s
	}

	students := make([]Student, 0, NumStudents)
	for i := 1; i <= NumStudents; i++ {
		email := fmt.Sprintf("student%d@gmail.com", i)
		first := firstNames[(i-1)%len(firstNames)]
		last := lastNames[(i*7)%len(lastNames)]

		// Check if a student with this name+roll already exists
		rollKey := strings.ToLower(fmt.Sprintf("R-%04d", i))
		if existing, ok := existingMap[rollKey]; ok {
			students = append(students, existing)
			continue
		}
		fullName := strings.ToLower(first + " " + last)
		if existing, ok := existingMap[fullName]; ok {
			// Same name might exist - skip but include in list
			students = append(students, existing)
			continue
		}
		cls := classes[i%len(classes)]

		gender := "male"
		if i%2 == 0 {
			gender = "female"
		}

		body := map[string]any{
			"email":      email,
			"password":   DefaultPass,
			"first_name": first,
			"last_name":  last,
			"class_id":   cls.ID,
			"section":    cls.Section,
			"roll_no":    fmt.Sprintf("R-%04d", i),
			"gender":     gender,
			"guardian": map[string]string{
				"name":  "Guardian of " + first + " " + last,
				"phone": fmt.Sprintf("0321%07d", 1000000+i),
				"email": email,
			},
			"status": "active",
		}
		created, err := apiCall("POST", "/api/students", body)
		if err != nil {
			if i <= 3 {
				log.Printf("  ⚠ Failed to create student %d: %v", i, err)
			}
			continue
		}
		var s Student
		if err := json.Unmarshal(created, &s); err == nil {
			students = append(students, s)
		}
		if i%100 == 0 {
			log.Printf("  ... processed %d students so far", i)
		}
	}
	log.Printf("✓ Total students available: %d", len(students))
	return students, nil
}

// ─── Attendance (1 month) ────────────────────────────────────────────────

func createAttendance(students []Student) {
	log.Printf("→ Creating attendance for last %d days...", DaysOfHistory)
	statuses := []string{"present", "present", "present", "present", "absent", "late"}
	count := 0

	now := time.Now()
	for d := 0; d < DaysOfHistory; d++ {
		date := now.AddDate(0, 0, -d)
		// Skip weekends
		if date.Weekday() == time.Saturday || date.Weekday() == time.Sunday {
			continue
		}
		dateStr := date.Format("2006-01-02")

		// Mark attendance for ~30% of students each day (to avoid hammering)
		sampled := 0
		for _, s := range students {
			if rand.Float64() > 0.3 {
				continue
			}
			body := map[string]any{
				"student_id": s.ID,
				"class_id":   s.ClassID,
				"date":       dateStr,
				"status":     statuses[rand.Intn(len(statuses))],
			}
			if _, err := apiCall("POST", "/api/attendance", body); err == nil {
				count++
			}
			sampled++
			if sampled >= 50 {
				break
			}
		}

		if d%5 == 0 {
			log.Printf("  ... attendance for %s done", dateStr)
		}
	}
	log.Printf("✓ Created %d attendance records", count)
}

// ─── Exams ───────────────────────────────────────────────────────────────

type Exam struct {
	ID      string `json:"_id"`
	Title   string `json:"title"`
	ClassID string `json:"class_id"`
}

func createExams(classes []Class, subjects []Subject) []Exam {
	log.Println("→ Creating exams (Mid-Term & Final per class)...")
	exams := make([]Exam, 0)

	for _, cls := range classes {
		for examIdx, examType := range []string{"Mid-Term", "Final"} {
			subj := subjects[rand.Intn(len(subjects))]
			daysOffset := -10 + examIdx*15 // Mid-term 10 days ago, Final 5 days from now
			body := map[string]any{
				"class_id":    cls.ID,
				"subject":     subj.Name,
				"title":       examType + " " + subj.Name + " - " + cls.Name,
				"starts_at":   time.Now().AddDate(0, 0, daysOffset).Format("2006-01-02"),
				"max_marks":   100,
				"description": examType + " examination",
			}
			created, err := apiCall("POST", "/api/exams", body)
			if err != nil {
				continue
			}
			var e Exam
			if err := json.Unmarshal(created, &e); err == nil {
				exams = append(exams, e)
			}
		}
	}
	log.Printf("✓ Created %d exams", len(exams))
	return exams
}

// ─── Results ─────────────────────────────────────────────────────────────

func createResults(exams []Exam, students []Student) {
	log.Println("→ Creating results for past exams...")
	count := 0
	failures := 0

	studentsByClass := map[string][]Student{}
	for _, s := range students {
		studentsByClass[s.ClassID] = append(studentsByClass[s.ClassID], s)
	}

	for _, exam := range exams {
		if exam.ID == "" {
			continue
		}
		classStudents := studentsByClass[exam.ClassID]
		if len(classStudents) == 0 {
			continue
		}
		limit := 10
		if len(classStudents) < limit {
			limit = len(classStudents)
		}
		for i := 0; i < limit; i++ {
			s := classStudents[i]
			marks := 40 + rand.Intn(55)
			body := map[string]any{
				"exam_id":        exam.ID,
				"student_id":     s.ID,
				"obtained_marks": marks,
				"remarks":        "",
			}
			if _, err := apiCall("POST", "/api/results", body); err == nil {
				count++
			} else {
				failures++
				if failures <= 2 {
					log.Printf("  ⚠ results error: %v", err)
				}
			}
		}
	}
	log.Printf("✓ Created %d results (%d failures)", count, failures)
}

// ─── Homework ────────────────────────────────────────────────────────────

func createHomework(classes []Class, teachers []Teacher, subjects []Subject) {
	log.Println("→ Creating homework assignments...")
	count := 0

	for _, cls := range classes {
		// 3-5 homework per class
		num := 3 + rand.Intn(3)
		for i := 0; i < num; i++ {
			daysAhead := -7 + rand.Intn(14) // mix of past and future due dates
			subj := subjects[rand.Intn(len(subjects))]
			teacher := teachers[rand.Intn(len(teachers))]

			body := map[string]any{
				"class_id":     cls.ID,
				"teacher_id":   teacher.ID,
				"subject":      subj.Name,
				"subject_id":   subj.ID,
				"title":        fmt.Sprintf("%s Assignment #%d", subj.Name, i+1),
				"instructions": "Complete the chapter exercises and submit by due date.",
				"due_at":       time.Now().AddDate(0, 0, daysAhead).Format("2006-01-02"),
				"status":       "assigned",
			}
			if _, err := apiCall("POST", "/api/homework", body); err == nil {
				count++
			}
		}
	}
	log.Printf("✓ Created %d homework assignments", count)
}

// ─── Behavior ────────────────────────────────────────────────────────────

func createBehavior(students []Student, teachers []Teacher) {
	log.Println("→ Creating behavior records...")
	count := 0
	failures := 0

	// 50 behavior records randomly
	for i := 0; i < 50; i++ {
		s := students[rand.Intn(len(students))]
		teacher := teachers[rand.Intn(len(teachers))]
		bt := behaviorTypes[rand.Intn(len(behaviorTypes))]

		body := map[string]any{
			"student_id":      s.ID,
			"class_id":        s.ClassID,
			"teacher_id":      teacher.ID,
			"category":        bt.Category,
			"incident_type":   bt.Type,
			"description":     "Incident reported on " + time.Now().Format("Mon Jan 02"),
			"severity":        bt.Severity,
			"status":          "open",
			"warning_count":   1,
			"parent_notified": false,
		}
		if _, err := apiCall("POST", "/api/behavior", body); err == nil {
			count++
		} else {
			failures++
			if failures <= 2 {
				log.Printf("  ⚠ behavior error: %v", err)
			}
		}
	}
	log.Printf("✓ Created %d behavior records (%d failures)", count, failures)
}

// ─── Events ──────────────────────────────────────────────────────────────

func createEvents() {
	log.Println("→ Creating events...")
	count := 0
	failures := 0
	now := time.Now()

	events := []map[string]any{
		{"title": "Annual Sports Day", "type": "Sports", "days": 7, "location": "School Ground"},
		{"title": "Parent-Teacher Meeting", "type": "Meeting", "days": 14, "location": "Auditorium"},
		{"title": "Quiz Competition", "type": "Cultural", "days": 3, "location": "Hall A"},
		{"title": "Eid Holiday", "type": "Holiday", "days": 21, "location": ""},
		{"title": "Mid-Term Exam Week", "type": "Exam", "days": -5, "location": "Classrooms"},
		{"title": "Independence Day", "type": "Holiday", "days": 30, "location": ""},
		{"title": "Science Fair", "type": "Cultural", "days": 12, "location": "Lab"},
		{"title": "Teachers Workshop", "type": "Workshop", "days": 5, "location": "Conference Room"},
	}

	for _, e := range events {
		startDate := now.AddDate(0, 0, e["days"].(int))
		body := map[string]any{
			"title":       e["title"],
			"description": e["title"].(string) + " - school-wide event",
			"event_type":  e["type"],
			"start_date":  startDate.Format("2006-01-02"),
			"end_date":    startDate.Format("2006-01-02"),
			"location":    e["location"],
			"visibility":  "all",
			"status":      "scheduled",
		}
		if _, err := apiCall("POST", "/api/events", body); err == nil {
			count++
		} else {
			failures++
			if failures <= 2 {
				log.Printf("  ⚠ events error: %v", err)
			}
		}
	}
	log.Printf("✓ Created %d events (%d failures)", count, failures)
}

// ─── Leave ───────────────────────────────────────────────────────────────

func createLeave(teachers []Teacher, students []Student) {
	log.Println("→ Creating leave requests...")
	count := 0
	failures := 0
	now := time.Now()

	// Teacher leaves
	for i := 0; i < 8; i++ {
		t := teachers[rand.Intn(len(teachers))]
		startOffset := -7 + rand.Intn(14)
		body := map[string]any{
			"requester_type": "teacher",
			"requester_id":   t.ID,
			"requester_name": t.FirstName + " " + t.LastName,
			"leave_type":     leaveTypes[rand.Intn(len(leaveTypes))],
			"start_date":     now.AddDate(0, 0, startOffset).Format("2006-01-02"),
			"end_date":       now.AddDate(0, 0, startOffset+1).Format("2006-01-02"),
			"reason":         "Personal reasons",
			"status":         []string{"pending", "approved", "rejected"}[rand.Intn(3)],
		}
		if _, err := apiCall("POST", "/api/leave", body); err == nil {
			count++
		} else {
			failures++
			if failures <= 2 {
				log.Printf("  ⚠ leave error: %v", err)
			}
		}
	}

	// Student leaves
	for i := 0; i < 12; i++ {
		s := students[rand.Intn(len(students))]
		startOffset := -7 + rand.Intn(14)
		body := map[string]any{
			"requester_type": "student",
			"requester_id":   s.ID,
			"requester_name": s.FirstName + " " + s.LastName,
			"class_id":       s.ClassID,
			"leave_type":     leaveTypes[rand.Intn(len(leaveTypes))],
			"start_date":     now.AddDate(0, 0, startOffset).Format("2006-01-02"),
			"end_date":       now.AddDate(0, 0, startOffset+1).Format("2006-01-02"),
			"reason":         "Family event",
			"status":         []string{"pending", "approved"}[rand.Intn(2)],
		}
		if _, err := apiCall("POST", "/api/leave", body); err == nil {
			count++
		} else {
			failures++
		}
	}

	log.Printf("✓ Created %d leave records (%d failures)", count, failures)
}

// ─── Live Classes ────────────────────────────────────────────────────────

func createLiveClasses(classes []Class, teachers []Teacher, subjects []Subject) {
	log.Println("→ Creating live class schedules...")
	count := 0
	failures := 0
	now := time.Now()

	for i := 0; i < 15; i++ {
		cls := classes[i%len(classes)]
		teacher := teachers[i%len(teachers)]
		subj := subjects[i%len(subjects)]
		startTime := now.AddDate(0, 0, rand.Intn(7)).Add(time.Duration(9+rand.Intn(4)) * time.Hour)
		body := map[string]any{
			"class_id":        cls.ID,
			"subject":         subj.Name,
			"title":           subj.Name + " - Live Session",
			"starts_at":       startTime.Format("2006-01-02T15:04:05"),
			"ends_at":         startTime.Add(1 * time.Hour).Format("2006-01-02T15:04:05"),
			"host_teacher_id": teacher.ID,
			"provider":        "google_meet",
		}
		if _, err := apiCall("POST", "/api/live/classes/schedule", body); err == nil {
			count++
		} else {
			failures++
			if failures <= 2 {
				log.Printf("  ⚠ live class error: %v", err)
			}
		}
	}
	log.Printf("✓ Created %d live classes (%d failures)", count, failures)
}

// ─── Timetable ───────────────────────────────────────────────────────────

func createTimetables(classes []Class, teachers []Teacher, subjects []Subject) {
	log.Println("→ Creating timetable entries...")
	count := 0

	periodTimes := []struct{ Start, End string }{
		{"08:00", "08:45"},
		{"08:45", "09:30"},
		{"09:30", "10:15"},
		{"10:30", "11:15"}, // After break
		{"11:15", "12:00"},
		{"12:00", "12:45"},
	}

	for _, cls := range classes {
		// Create timetable for Mon-Fri (1-5)
		for day := 1; day <= 5; day++ {
			for period := 1; period <= 4; period++ {
				if len(teachers) == 0 || len(subjects) == 0 {
					continue
				}
				t := teachers[rand.Intn(len(teachers))]
				s := subjects[rand.Intn(len(subjects))]
				body := map[string]any{
					"class_id":      cls.ID,
					"day_of_week":   day,
					"period_number": period,
					"subject_id":    s.ID,
					"subject":       s.Name,
					"teacher_id":    t.ID,
					"start_time":    periodTimes[period-1].Start,
					"end_time":      periodTimes[period-1].End,
					"room":          rooms[rand.Intn(len(rooms))],
				}
				if _, err := apiCall("POST", "/api/timetable", body); err == nil {
					count++
				}
			}
		}
	}
	log.Printf("✓ Created %d timetable entries", count)
}

// ─── Fees ────────────────────────────────────────────────────────────────

func createFees(classes []Class) {
	log.Println("→ Setting up fee structure...")
	count := 0

	// Create fee types
	feeTypes := []string{"Tuition Fee", "Transport Fee", "Lab Fee", "Exam Fee"}
	for _, ft := range feeTypes {
		body := map[string]any{
			"name":        ft,
			"description": ft + " - monthly",
			"is_active":   true,
		}
		apiCall("POST", "/api/fees/types", body)
	}

	// Add class fees
	for _, cls := range classes {
		amount := 2000 + rand.Intn(3000)
		body := map[string]any{
			"name":   "Monthly Tuition",
			"amount": amount,
			"type":   "tuition",
		}
		if _, err := apiCall("POST", fmt.Sprintf("/api/classes/%s/fees/components", cls.ID), body); err == nil {
			count++
		}
	}

	// Generate fees for current month
	now := time.Now()
	body := map[string]any{
		"month": strings.ToLower(now.Month().String()),
		"year":  now.Year(),
	}
	apiCall("POST", "/api/fees/generate", body)

	log.Printf("✓ Created fee structure for %d classes", count)
}

// ─── Announcements ───────────────────────────────────────────────────────

func createAnnouncements() {
	log.Println("→ Creating announcements...")
	count := 0

	announcements := []struct {
		Title, Body, Audience, Priority string
	}{
		{"Welcome Back!", "School reopens with full safety protocols.", "all", "high"},
		{"Mid-Term Exam Schedule", "Exam schedule has been published. Check timetable.", "students", "high"},
		{"PTM Notice", "Parent-Teacher meeting next Saturday at 10 AM.", "parents", "normal"},
		{"Holiday Notice", "School closed on national holiday next Monday.", "all", "normal"},
		{"Sports Registration Open", "Register for annual sports events.", "students", "low"},
		{"New Library Books", "Latest editions added to the library.", "students", "low"},
	}

	for _, a := range announcements {
		body := map[string]any{
			"title":    a.Title,
			"body":     a.Body,
			"audience": a.Audience,
			"priority": a.Priority,
		}
		if _, err := apiCall("POST", "/api/announcements", body); err == nil {
			count++
		}
	}
	log.Printf("✓ Created %d announcements", count)
}

// ─── Main ────────────────────────────────────────────────────────────────

func main() {
	rand.Seed(time.Now().UnixNano())
	log.SetFlags(log.Ltime)

	log.Println("═══════════════════════════════════════════════════════════")
	log.Println("    EDUPLEXO SEED SCRIPT")
	log.Println("═══════════════════════════════════════════════════════════")
	log.Printf("Target: %s", BaseURL)
	log.Printf("Data: %d classes, %d teachers, %d students, %d days history",
		NumClasses, NumTeachers, NumStudents, DaysOfHistory)
	log.Println("═══════════════════════════════════════════════════════════")

	// Login
	if err := login(); err != nil {
		log.Fatalf("✗ %v", err)
	}

	// Academic Year
	yearID, err := ensureAcademicYear()
	if err != nil {
		log.Fatalf("✗ Academic year error: %v", err)
	}

	// Subjects
	subjects, err := createSubjects()
	if err != nil {
		log.Printf("⚠ Subject creation: %v", err)
	}
	if len(subjects) == 0 {
		log.Fatal("✗ No subjects available — cannot continue")
	}

	// Teachers
	teachers, err := createTeachers(subjects)
	if err != nil {
		log.Fatalf("✗ Teacher creation: %v", err)
	}
	if len(teachers) == 0 {
		log.Fatal("✗ No teachers created — cannot continue")
	}

	// Classes
	classes, err := createClasses(yearID, teachers, subjects)
	if err != nil {
		log.Fatalf("✗ Class creation: %v", err)
	}
	if len(classes) == 0 {
		log.Fatal("✗ No classes created — cannot continue")
	}

	// Students
	students, err := createStudents(classes)
	if err != nil {
		log.Fatalf("✗ Student creation: %v", err)
	}
	if len(students) == 0 {
		log.Fatal("✗ No students created — cannot continue")
	}

	// All other data
	createAttendance(students)
	exams := createExams(classes, subjects)
	if len(exams) > 0 {
		createResults(exams, students)
	}
	createHomework(classes, teachers, subjects)
	createBehavior(students, teachers)
	createEvents()
	createLeave(teachers, students)
	createLiveClasses(classes, teachers, subjects)
	createTimetables(classes, teachers, subjects)
	createFees(classes)
	createAnnouncements()

	log.Println("═══════════════════════════════════════════════════════════")
	log.Println("    ✓ SEED COMPLETE!")
	log.Println("═══════════════════════════════════════════════════════════")
	log.Println("")
	log.Println("LOGIN CREDENTIALS:")
	log.Println("  School Admin: school@gmail.com / Test@123")
	log.Println("  Super Admin:  eduplexo@gmail.com / Test@123  (or super@gmail.com)")
	log.Println("  Teachers:     teacher1@gmail.com ... teacher22@gmail.com / Test@123")
	log.Println("  Students:     student1@gmail.com ... student390@gmail.com / Test@123")
	log.Println("")
	os.Exit(0)
}
