package superadmin

import "testing"

func TestMapRowFieldsUsesSelectedCurriculumContext(t *testing.T) {
	headers := map[string]int{
		"question":      0,
		"question_type": 1,
		"marks":         2,
	}
	row := []string{"What is a noun?", "Question Answers", "2"}

	board, class, subject, chapter, topic, qType, _, question, _, _, _, _, _, _, marks, _, _, _, _ := mapRowFields(
		row,
		headers,
		"PTB",
		"ONE",
		"English",
		"Unit 1",
	)

	if board != "PTB" || class != "ONE" || subject != "English" || chapter != "Unit 1" {
		t.Fatalf("expected selected curriculum context, got board=%q class=%q subject=%q chapter=%q", board, class, subject, chapter)
	}
	if topic != "Unit 1" {
		t.Fatalf("expected topic fallback to chapter, got %q", topic)
	}
	if qType != "question_answers" {
		t.Fatalf("expected normalized question type, got %q", qType)
	}
	if question != "What is a noun?" || marks != "2" {
		t.Fatalf("unexpected question or marks: question=%q marks=%q", question, marks)
	}
}

func TestValidQuestionTypesIncludeDynamicCatalog(t *testing.T) {
	valid := []string{
		"MCQ",
		"Tick Correct Spelling",
		"Fill In The Blanks",
		"Match Columns",
		"Question Answers",
		"Letters",
		"Applications",
		"Stories",
		"Essays",
		"Missing Letters",
		"Form Of Verbs",
		"Words Into Sentences",
		"Word Meaning",
		"Singular Plural",
		"Genders",
		"Translate Into Urdu",
		"Grammar",
		"Exercise",
		"Additional Questions",
	}
	for _, value := range valid {
		if !validQuestionType(value) {
			t.Fatalf("expected %q to be accepted", value)
		}
	}
	if validQuestionType("not a real type") {
		t.Fatal("unexpectedly accepted invalid question type")
	}
}
