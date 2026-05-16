// response_formatter.go — Intelligent response formatting WITHOUT Gemini.
//
// Generates natural, conversational responses from raw data using templates
// and smart logic. This ensures the chatbot feels intelligent even when
// Gemini is offline (quota exceeded, timeout, no API key).
package chatbot

import (
	"fmt"
	"strings"
)

// FormatStudentResponse generates a conversational student summary.
func FormatStudentResponse(total, active int, byClass map[string]int) string {
	if total == 0 {
		return "Aapke school me abhi koi student enrolled nahi hai. Pehle ek class create karein, phir students add kar sakte hain.\n\n💡 Kya main aapko student create karne ka tareeqa bataaun?"
	}

	// Find largest class
	largestClass := ""
	largestCount := 0
	for name, count := range byClass {
		if count > largestCount {
			largestCount = count
			largestClass = name
		}
	}

	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("📊 Aapke school me **%d students** enrolled hain", total))
	if active < total {
		sb.WriteString(fmt.Sprintf(" (active: %d, inactive: %d).", active, total-active))
	} else {
		sb.WriteString(", sab active hain. ✅")
	}

	if largestClass != "" && len(byClass) > 1 {
		sb.WriteString(fmt.Sprintf("\n\nSabse zyada students **%s** me hain (%d students).", largestClass, largestCount))
	}

	// Class breakdown
	if len(byClass) > 0 && len(byClass) <= 10 {
		sb.WriteString("\n\n**Class-wise:**")
		for name, count := range byClass {
			sb.WriteString(fmt.Sprintf("\n• %s: %d students", name, count))
		}
	}

	// Insight
	insight := GenerateStudentInsight(total, active, byClass)
	if insight != "" {
		sb.WriteString("\n\n" + insight)
	}

	// Follow-up
	sb.WriteString("\n\n" + FollowUp("student"))
	return sb.String()
}

// FormatAttendanceResponse generates a conversational attendance summary.
func FormatAttendanceResponse(date string, present, absent, late, total int, percentage float64) string {
	if total == 0 {
		return fmt.Sprintf("📋 Aaj (%s) ki attendance abhi mark nahi hui hai.\n\nTeachers ko attendance mark karne ki reminder bhejein ya khud mark karein.\n\n💡 Kya main aapko attendance mark karne ka process bataaun?", date)
	}

	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("📋 **Aaj ki Attendance** (%s)\n\n", date))
	sb.WriteString(fmt.Sprintf("✅ Present: **%d**\n", present))
	sb.WriteString(fmt.Sprintf("❌ Absent: **%d**\n", absent))
	if late > 0 {
		sb.WriteString(fmt.Sprintf("⏰ Late: **%d**\n", late))
	}
	sb.WriteString(fmt.Sprintf("📊 Attendance Rate: **%.0f%%**\n", percentage))

	// Insight based on percentage
	insight := GenerateAttendanceInsight(percentage, absent, total)
	if insight != "" {
		sb.WriteString("\n" + insight)
	}

	sb.WriteString("\n\n" + FollowUp("attendance"))
	return sb.String()
}

// FormatFeeResponse generates a conversational fee summary.
func FormatFeeResponse(collected, pending float64, paid, unpaid, overdue int) string {
	if collected == 0 && pending == 0 {
		return "💰 Abhi tak koi fee record nahi hai. Pehle fee structure setup karein, phir fees generate karein.\n\n💡 Kya main fee setup ka process bataaun?"
	}

	var sb strings.Builder
	sb.WriteString("💰 **Fee Collection Summary**\n\n")
	sb.WriteString(fmt.Sprintf("✅ Collected: **Rs. %s**\n", formatAmount(collected)))
	sb.WriteString(fmt.Sprintf("⏳ Pending: **Rs. %s**\n", formatAmount(pending)))
	sb.WriteString(fmt.Sprintf("📊 Paid: %d | Unpaid: %d | Overdue: %d\n", paid, unpaid, overdue))

	// Collection rate
	total := collected + pending
	if total > 0 {
		rate := (collected / total) * 100
		sb.WriteString(fmt.Sprintf("\n📈 Collection Rate: **%.0f%%**", rate))
	}

	// Insight
	insight := GenerateFeeInsight(collected, pending, overdue)
	if insight != "" {
		sb.WriteString("\n\n" + insight)
	}

	sb.WriteString("\n\n" + FollowUp("fee"))
	return sb.String()
}

// FormatTeacherResponse generates a conversational teacher list.
func FormatTeacherResponse(teachers []map[string]string) string {
	count := len(teachers)
	if count == 0 {
		return "👨‍🏫 Abhi koi teacher registered nahi hai. Teachers add karein taake classes assign ho sakein.\n\n💡 Kya main teacher add karne ka tareeqa bataaun?"
	}

	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("👨‍🏫 Aapke school me **%d teachers** hain.\n\n", count))

	limit := 10
	if count < limit {
		limit = count
	}
	for i := 0; i < limit; i++ {
		t := teachers[i]
		sb.WriteString(fmt.Sprintf("• **%s** — %s\n", t["name"], t["subjects"]))
	}
	if count > 10 {
		sb.WriteString(fmt.Sprintf("\n... aur %d teachers hain.\n", count-10))
	}

	sb.WriteString("\n" + FollowUp("teacher"))
	return sb.String()
}

// FormatExamResponse generates a conversational exam summary.
func FormatExamResponse(exams []map[string]string) string {
	if len(exams) == 0 {
		return "📝 Koi upcoming exam scheduled nahi hai. Exams create karein taake students aur parents ko pata chale.\n\n💡 Kya aap naya exam schedule karna chahenge?"
	}

	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("📝 **%d Upcoming Exams** scheduled hain:\n\n", len(exams)))

	limit := 5
	if len(exams) < limit {
		limit = len(exams)
	}
	for i := 0; i < limit; i++ {
		e := exams[i]
		sb.WriteString(fmt.Sprintf("• **%s** — %s\n  📅 %s | 🏛️ %s\n", e["title"], e["subject"], e["date"], e["class"]))
	}

	sb.WriteString("\n" + FollowUp("exam"))
	return sb.String()
}

// FormatClassResponse generates a conversational class summary.
func FormatClassResponse(classes []map[string]any) string {
	if len(classes) == 0 {
		return "🏛️ Abhi koi class create nahi hui. Academic year activate karein aur classes banayein.\n\n💡 Kya main class create karne ka process bataaun?"
	}

	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("🏛️ Aapke school me **%d classes** hain:\n\n", len(classes)))

	totalStudents := 0
	for _, c := range classes {
		count := 0
		if v, ok := c["student_count"].(int); ok {
			count = v
		}
		totalStudents += count
		sb.WriteString(fmt.Sprintf("• **%s** — %d students\n", c["name"], count))
	}

	if len(classes) > 1 {
		avg := totalStudents / len(classes)
		sb.WriteString(fmt.Sprintf("\n📊 Average: %d students per class", avg))
	}

	sb.WriteString("\n\n" + FollowUp("class"))
	return sb.String()
}

// FormatSchoolStatsResponse generates a conversational overview.
func FormatSchoolStatsResponse(students, teachers, classes, presentToday int) string {
	var sb strings.Builder
	sb.WriteString("🏫 **School Overview**\n\n")
	sb.WriteString(fmt.Sprintf("👨‍🎓 Students: **%d**\n", students))
	sb.WriteString(fmt.Sprintf("👨‍🏫 Teachers: **%d**\n", teachers))
	sb.WriteString(fmt.Sprintf("🏛️ Classes: **%d**\n", classes))
	sb.WriteString(fmt.Sprintf("✅ Present Today: **%d**\n", presentToday))

	// Ratio insight
	if teachers > 0 && students > 0 {
		ratio := students / teachers
		sb.WriteString(fmt.Sprintf("\n📊 Student-Teacher Ratio: **%d:1**", ratio))
		if ratio > 30 {
			sb.WriteString(" ⚠️ (thoda high hai, consider more teachers)")
		} else {
			sb.WriteString(" ✅ (healthy ratio)")
		}
	}

	sb.WriteString("\n\n" + FollowUp("stats"))
	return sb.String()
}

// ─── Helpers ─────────────────────────────────────────────────────────────

func formatAmount(amount float64) string {
	if amount == 0 {
		return "0"
	}
	if amount >= 100000 {
		return fmt.Sprintf("%.1f lakh", amount/100000)
	}
	return fmt.Sprintf("%.0f", amount)
}
