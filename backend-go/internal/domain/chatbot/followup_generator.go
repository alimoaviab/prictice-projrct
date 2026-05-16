// followup_generator.go — Generates contextual follow-up questions.
//
// Every response should end with a relevant follow-up question to maintain
// conversational flow. Questions are context-aware and rotate to avoid repetition.
package chatbot

import "math/rand"

// followUpQuestions maps categories to relevant follow-up questions.
var followUpQuestions = map[string][]string{
	"student": {
		"Kya aap class-wise student details dekhna chahenge?",
		"Kya main kisi specific student ki info dikhaun?",
		"Kya aap attendance ya fee status bhi dekhna chahenge?",
		"Kya aap top performing students dekhna chahenge?",
	},
	"attendance": {
		"Kya aap class-wise attendance breakdown dekhna chahenge?",
		"Kya main weak attendance classes identify karun?",
		"Kya aap kisi specific class ki attendance dekhna chahenge?",
		"Kya aap absent students ki list chahiye?",
	},
	"fee": {
		"Kya aap overdue students ki list dekhna chahenge?",
		"Kya main class-wise fee collection dikhaun?",
		"Kya aap kisi specific student ka fee status dekhna chahenge?",
		"Kya aap monthly collection trend dekhna chahenge?",
	},
	"teacher": {
		"Kya aap kisi teacher ki detail dekhna chahenge?",
		"Kya main teacher-wise class assignment dikhaun?",
		"Kya aap teachers ka timetable dekhna chahenge?",
	},
	"class": {
		"Kya aap kisi specific class ki detail chahiye?",
		"Kya main class-wise attendance ya fee status dikhaun?",
		"Kya aap students ki list dekhna chahenge?",
	},
	"exam": {
		"Kya aap exam results bhi dekhna chahenge?",
		"Kya main class-wise exam schedule dikhaun?",
		"Kya aap previous exam performance compare karna chahenge?",
	},
	"result": {
		"Kya aap top students dekhna chahenge?",
		"Kya main weak students identify karun?",
		"Kya aap subject-wise analysis chahenge?",
	},
	"stats": {
		"Kya aap kisi specific area ki detail chahiye?",
		"Kya main attendance ya fee status dikhaun?",
		"Kya aap students ya teachers ki list dekhna chahenge?",
	},
	"timetable": {
		"Kya aap kisi specific class ka timetable dekhna chahenge?",
		"Kya main teacher schedule dikhaun?",
	},
	"event": {
		"Kya aap event details dekhna chahenge?",
		"Kya main upcoming events ki list dikhaun?",
	},
	"guide": {
		"Kya aap aur kisi module ke baare me jaanna chahenge?",
		"Kya main step-by-step guide dikhaun?",
	},
	"diagnostic": {
		"Kya main aur checks run karun?",
		"Kya aap kisi specific issue ke baare me batayenge?",
	},
}

// FollowUp returns a contextual follow-up question for the given category.
func FollowUp(category string) string {
	questions, ok := followUpQuestions[category]
	if !ok || len(questions) == 0 {
		// Generic fallback
		generic := []string{
			"Kya main aur kisi cheez me madad kar sakta hoon?",
			"Kya aap aur details dekhna chahenge?",
			"Aur kuch poochna hai?",
		}
		return "💬 " + generic[rand.Intn(len(generic))]
	}
	return "💬 " + questions[rand.Intn(len(questions))]
}

// FollowUpForMultiple generates a follow-up when multiple topics were discussed.
func FollowUpForMultiple(categories []string) string {
	if len(categories) == 0 {
		return FollowUp("stats")
	}
	// Pick a category that wasn't discussed
	allCats := []string{"student", "attendance", "fee", "teacher", "exam", "result"}
	for _, cat := range allCats {
		found := false
		for _, discussed := range categories {
			if cat == discussed {
				found = true
				break
			}
		}
		if !found {
			return FollowUp(cat)
		}
	}
	return FollowUp(categories[0])
}
