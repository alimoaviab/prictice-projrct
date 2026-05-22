// Command seed-questions populates the global question bank with Pakistani
// curriculum questions for Class 9, 10, 11, 12 (Mathematics, Physics,
// Chemistry, Biology, English, Urdu, Computer Science, Islamiat, Pak Studies).
//
// This data is visible to ALL schools (school_id="__global__", is_global=true).
//
// Usage:
//   go run ./cmd/seed-questions
//
// Requires the backend to be running on :8080 with super-admin credentials.
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"
)

const (
	BaseURL    = "http://localhost:8080"
	AdminEmail = "eduplexo@gmail.com"
	AdminPass  = "Test@123"
)

var token string

func main() {
	log.Println("═══════════════════════════════════════════════════════════")
	log.Println("    GLOBAL QUESTION BANK SEED")
	log.Println("═══════════════════════════════════════════════════════════")

	// Login as super admin
	loginBody, _ := json.Marshal(map[string]string{"email": AdminEmail, "password": AdminPass})
	resp, err := http.Post(BaseURL+"/api/auth/login", "application/json", bytes.NewReader(loginBody))
	if err != nil {
		log.Fatalf("Login failed: %v", err)
	}
	defer resp.Body.Close()
	var loginRes struct {
		Data struct {
			Token string `json:"token"`
		} `json:"data"`
	}
	json.NewDecoder(resp.Body).Decode(&loginRes)
	token = loginRes.Data.Token
	if token == "" {
		log.Fatal("Failed to get token")
	}
	log.Println("✓ Logged in as super admin")

	// Seed chapters and questions for each class/subject
	classes := []struct {
		id    string
		name  string
		grade int
	}{
		{"global_cls_class_9", "Class 9", 9},
		{"global_cls_class_10", "Class 10", 10},
		{"global_cls_class_11", "Class 11", 11},
		{"global_cls_class_12", "Class 12", 12},
	}

	subjects := []struct {
		id   string
		name string
	}{
		{"global_sub_mathematics", "Mathematics"},
		{"global_sub_physics", "Physics"},
		{"global_sub_chemistry", "Chemistry"},
		{"global_sub_biology", "Biology"},
		{"global_sub_english", "English"},
		{"global_sub_urdu", "Urdu"},
		{"global_sub_computer_science", "Computer Science"},
		{"global_sub_islamic_studies", "Islamic Studies"},
		{"global_sub_pakistan_studies", "Pakistan Studies"},
	}

	totalChapters := 0
	totalQuestions := 0

	for _, cls := range classes {
		for _, sub := range subjects {
			chapters := getChaptersForSubject(cls.grade, sub.name)
			if len(chapters) == 0 {
				continue
			}

			log.Printf("→ %s / %s (%d chapters)", cls.name, sub.name, len(chapters))

			for i, chTitle := range chapters {
				// Create chapter
				chID := createChapter(cls.id, cls.name, sub.id, sub.name, chTitle, i+1)
				if chID == "" {
					continue
				}
				totalChapters++

				// Create questions for this chapter
				questions := getQuestionsForChapter(cls.grade, sub.name, chTitle, i+1)
				for _, q := range questions {
					ok := createQuestion(cls.id, cls.name, sub.id, sub.name, chID, q)
					if ok {
						totalQuestions++
					}
				}
			}
		}
	}

	log.Println("═══════════════════════════════════════════════════════════")
	log.Printf("    ✓ SEED COMPLETE: %d chapters, %d questions", totalChapters, totalQuestions)
	log.Println("═══════════════════════════════════════════════════════════")
}

func createChapter(classID, className, subjectID, subjectName, title string, num int) string {
	body, _ := json.Marshal(map[string]any{
		"class_id":       classID,
		"class_name":     className,
		"subject_id":     subjectID,
		"subject_name":   subjectName,
		"title":          title,
		"chapter_number": num,
	})
	data, err := apiCall("POST", "/api/super-admin/global-bank/chapters", body)
	if err != nil {
		return ""
	}
	var res struct {
		Data struct {
			ID string `json:"_id"`
		} `json:"data"`
	}
	json.Unmarshal(data, &res)
	return res.Data.ID
}

type questionData struct {
	Type       string `json:"type"`
	Difficulty string `json:"difficulty"`
	HTML       string `json:"question_html"`
	Marks      int    `json:"marks"`
	Options    []struct {
		Text    string `json:"option_text"`
		Correct bool   `json:"is_correct"`
	} `json:"options,omitempty"`
}

func createQuestion(classID, className, subjectID, subjectName, chapterID string, q questionData) bool {
	payload := map[string]any{
		"class_id":      classID,
		"class_name":    className,
		"subject_id":    subjectID,
		"subject_name":  subjectName,
		"chapter_id":    chapterID,
		"type":          q.Type,
		"difficulty":    q.Difficulty,
		"question_html": q.HTML,
		"marks":         q.Marks,
	}
	if len(q.Options) > 0 {
		payload["options"] = q.Options
	}
	body, _ := json.Marshal(payload)
	_, err := apiCall("POST", "/api/super-admin/global-bank/questions", body)
	return err == nil
}

func apiCall(method, path string, body []byte) ([]byte, error) {
	var reqBody io.Reader
	if body != nil {
		reqBody = bytes.NewReader(body)
	}
	req, _ := http.NewRequest(method, BaseURL+path, reqBody)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	data, _ := io.ReadAll(resp.Body)
	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("HTTP %d: %s", resp.StatusCode, string(data))
	}
	return data, nil
}

// ═══════════════════════════════════════════════════════════════════════════
// CURRICULUM DATA — Pakistani Board (Punjab/Federal)
// ═══════════════════════════════════════════════════════════════════════════

func getChaptersForSubject(grade int, subject string) []string {
	key := fmt.Sprintf("%d_%s", grade, subject)
	data := map[string][]string{
		// ─── Class 9 ─────────────────────────────────────────────────
		"9_Mathematics": {"Sets", "Real Numbers", "Logarithms", "Algebraic Expressions", "Factorization", "Algebraic Manipulation", "Linear Equations", "Linear Graphs", "Introduction to Coordinate Geometry", "Congruent Triangles", "Parallelograms and Triangles", "Line Bisectors and Angle Bisectors", "Sides and Angles of a Triangle", "Ratio and Proportion", "Pythagoras Theorem", "Theorems Related to Area"},
		"9_Physics":     {"Physical Quantities and Measurement", "Kinematics", "Dynamics", "Turning Effect of Forces", "Gravitation", "Work and Energy", "Properties of Matter", "Thermal Properties of Matter", "Transfer of Heat"},
		"9_Chemistry":   {"Fundamentals of Chemistry", "Structure of Atoms", "Periodic Table and Periodicity", "Structure of Molecules", "Physical States of Matter", "Solutions", "Electrochemistry", "Chemical Reactivity"},
		"9_Biology":     {"Introduction to Biology", "Solving a Biological Problem", "Biodiversity", "Cells and Tissues", "Cell Cycle", "Enzymes", "Bioenergetics", "Nutrition", "Transport"},
		"9_English":     {"The Saviour of Mankind", "Patriotism", "Media and Its Impact", "Hazrat Asma (RA)", "Daffodils", "The Quaid's Vision", "Sultan Ahmad Mosque", "Stopping by Woods on a Snowy Evening", "All is Not Lost"},
		"9_Urdu":        {"حمد", "نعت", "غزل", "نظم", "کہانی", "مضمون", "خطوط", "درخواست", "محاورے اور ضرب الامثال"},
		"9_Computer Science": {"Introduction to Computer", "Computer Components", "Input/Output Devices", "Computer Software", "Operating Systems", "Word Processing", "Spreadsheets", "Internet and Email"},
		"9_Islamic Studies": {"ایمانیات", "عبادات", "حقوق العباد", "اخلاق و آداب", "سیرت طیبہ", "معاشرتی زندگی"},
		"9_Pakistan Studies": {"Land and Environment", "History and Culture", "Government and Politics", "Economy of Pakistan", "Population and Society"},

		// ─── Class 10 ────────────────────────────────────────────────
		"10_Mathematics": {"Quadratic Equations", "Theory of Quadratic Equations", "Variations", "Partial Fractions", "Sets and Functions", "Basic Statistics", "Introduction to Trigonometry", "Projection of a Side of a Triangle", "Chords of a Circle", "Tangent to a Circle", "Chords and Arcs", "Angle in a Segment", "Practical Geometry"},
		"10_Physics":     {"Simple Harmonic Motion and Waves", "Sound", "Geometrical Optics", "Electrostatics", "Current Electricity", "Electromagnetism", "Basic Electronics", "Information and Communication Technology", "Atomic and Nuclear Physics"},
		"10_Chemistry":   {"Chemical Equilibrium", "Acids Bases and Salts", "Organic Chemistry", "Hydrocarbons", "Biochemistry", "The Atmosphere", "Water", "Chemical Industries"},
		"10_Biology":     {"Gaseous Exchange", "Homeostasis", "Coordination and Control", "Support and Movement", "Reproduction", "Genetics", "Man and His Environment", "Biotechnology", "Pharmacology"},
		"10_English":     {"The Dying Sun", "Using the Scientific Method", "Why Boys Fail in College", "A World Without Books", "The Rain", "Television vs Newspaper", "Little by Little One Walks Far", "Ozymandias", "The Hollow Men"},
		"10_Urdu":        {"حمد", "نعت", "غزل", "نظم", "افسانہ", "مضمون", "خلاصہ نویسی", "ترجمہ", "گرامر"},
		"10_Computer Science": {"Programming Concepts", "Problem Solving", "C Language Basics", "Control Structures", "Loops", "Arrays", "Functions", "File Handling"},
		"10_Islamic Studies": {"قرآن مجید", "حدیث", "فقہ", "سیرت النبی", "اسلامی تاریخ", "اسلام اور سائنس"},
		"10_Pakistan Studies": {"Making of Pakistan", "Constitutional Development", "Foreign Policy", "Economic Development", "Social Development"},

		// ─── Class 11 ────────────────────────────────────────────────
		"11_Mathematics": {"Number Systems", "Sets Functions and Groups", "Matrices and Determinants", "Quadratic Equations", "Partial Fractions", "Sequences and Series", "Permutation Combination and Probability", "Mathematical Induction and Binomial Theorem", "Fundamentals of Trigonometry", "Trigonometric Identities", "Trigonometric Functions and Graphs", "Application of Trigonometry", "Inverse Trigonometric Functions", "Solutions of Trigonometric Equations"},
		"11_Physics":     {"Measurements", "Vectors and Equilibrium", "Motion and Force", "Work and Energy", "Circular Motion", "Fluid Dynamics", "Oscillations", "Waves", "Physical Optics", "Optical Instruments", "Heat and Thermodynamics"},
		"11_Chemistry":   {"Basic Concepts", "Experimental Techniques", "Gases", "Liquids and Solids", "Atomic Structure", "Chemical Bonding", "Thermochemistry", "Chemical Equilibrium", "Solutions", "Electrochemistry", "Reaction Kinetics"},
		"11_Biology":     {"Introduction to Biology", "Biological Molecules", "Enzymes", "The Cell", "Variety of Life", "Kingdom Prokaryotae", "Kingdom Protista", "Kingdom Fungi", "Kingdom Plantae", "Kingdom Animalia", "Bioenergetics", "Nutrition", "Gaseous Exchange", "Transport"},
		"11_English":     {"Prose Selections", "Poetry Analysis", "Grammar and Composition", "Essay Writing", "Comprehension", "Letter Writing", "Story Writing", "Dialogue Writing"},
		"11_Computer Science": {"Basics of ICT", "Computer Architecture", "Data Communication", "Operating Systems", "Database Concepts", "Programming in C", "Web Development Basics", "Cyber Security"},

		// ─── Class 12 ────────────────────────────────────────────────
		"12_Mathematics": {"Functions and Limits", "Differentiation", "Higher Order Derivatives", "Application of Derivatives", "Integration", "Application of Integration", "Differential Equations", "Vectors", "Analytical Geometry (Lines)", "Analytical Geometry (Circles)", "Analytical Geometry (Conics)", "Linear Programming"},
		"12_Physics":     {"Electrostatics", "Current Electricity", "Electromagnetism", "Electromagnetic Induction", "Alternating Current", "Physics of Solids", "Electronics", "Dawn of Modern Physics", "Atomic Spectra", "Nuclear Physics"},
		"12_Chemistry":   {"Periodic Classification", "s-Block Elements", "p-Block Elements", "d-Block and f-Block Elements", "Chemical Kinetics", "Chemical Equilibrium", "Acids Bases and Salts", "Chemistry of Hydrocarbons", "Alcohols Phenols and Ethers", "Aldehydes and Ketones", "Carboxylic Acids", "Macromolecules", "Environmental Chemistry"},
		"12_Biology":     {"Homeostasis", "Support and Movement", "Coordination and Control", "Reproduction", "Growth and Development", "Chromosomes and DNA", "Gene Expression", "Inheritance", "Evolution", "Ecosystem", "Some Major Ecosystems", "Man and His Environment", "Biotechnology"},
		"12_English":     {"Prose Analysis", "Poetry Appreciation", "Advanced Grammar", "Essay Writing", "Précis Writing", "Comprehension Passages", "Report Writing", "Formal Letters"},
		"12_Computer Science": {"Data Structures", "Algorithms", "Object Oriented Programming", "Database Management", "Networking", "Web Technologies", "Software Engineering", "Artificial Intelligence Basics"},
	}
	return data[key]
}

func getQuestionsForChapter(grade int, subject, chapter string, chNum int) []questionData {
	// Generate a mix of MCQ, Short, and Long questions for each chapter
	questions := []questionData{}

	// 3 MCQs per chapter
	mcqTemplates := getMCQsForChapter(grade, subject, chapter)
	for _, m := range mcqTemplates {
		questions = append(questions, m)
	}

	// 2 Short questions per chapter
	shortTemplates := getShortQuestionsForChapter(grade, subject, chapter)
	for _, s := range shortTemplates {
		questions = append(questions, s)
	}

	// 1 Long question per chapter
	longTemplates := getLongQuestionsForChapter(grade, subject, chapter)
	for _, l := range longTemplates {
		questions = append(questions, l)
	}

	return questions
}

func getMCQsForChapter(grade int, subject, chapter string) []questionData {
	// Subject-specific MCQs
	key := fmt.Sprintf("%d_%s_%s", grade, subject, chapter)
	_ = key

	// Generate contextual MCQs based on subject and chapter
	switch subject {
	case "Mathematics":
		return mathMCQs(grade, chapter)
	case "Physics":
		return physicsMCQs(grade, chapter)
	case "Chemistry":
		return chemistryMCQs(grade, chapter)
	case "Biology":
		return biologyMCQs(grade, chapter)
	default:
		return generalMCQs(grade, subject, chapter)
	}
}

func getShortQuestionsForChapter(grade int, subject, chapter string) []questionData {
	switch subject {
	case "Mathematics":
		return mathShort(grade, chapter)
	case "Physics":
		return physicsShort(grade, chapter)
	case "Chemistry":
		return chemistryShort(grade, chapter)
	case "Biology":
		return biologyShort(grade, chapter)
	default:
		return generalShort(grade, subject, chapter)
	}
}

func getLongQuestionsForChapter(grade int, subject, chapter string) []questionData {
	switch subject {
	case "Mathematics":
		return mathLong(grade, chapter)
	case "Physics":
		return physicsLong(grade, chapter)
	case "Chemistry":
		return chemistryLong(grade, chapter)
	case "Biology":
		return biologyLong(grade, chapter)
	default:
		return generalLong(grade, subject, chapter)
	}
}
