// insight_generator.go — Generates intelligent insights from data WITHOUT Gemini.
//
// Analyzes patterns, detects anomalies, and provides actionable recommendations
// using deterministic logic. This ensures the chatbot sounds intelligent even
// when the AI layer is offline.
package chatbot

import "fmt"

// GenerateStudentInsight provides analysis based on student data.
func GenerateStudentInsight(total, active int, byClass map[string]int) string {
	if total == 0 {
		return ""
	}

	// Check for inactive students
	inactive := total - active
	if inactive > 0 && float64(inactive)/float64(total) > 0.1 {
		return fmt.Sprintf("⚠️ **Note:** %d students inactive hain (%.0f%%). Unka status check karein — kya woh school chhod chuke hain ya records update chahiye?",
			inactive, float64(inactive)/float64(total)*100)
	}

	// Check class balance
	if len(byClass) > 1 {
		maxCount, minCount := 0, total
		maxClass, minClass := "", ""
		for name, count := range byClass {
			if count > maxCount {
				maxCount = count
				maxClass = name
			}
			if count < minCount {
				minCount = count
				minClass = name
			}
		}
		if maxCount > 0 && minCount > 0 && maxCount > minCount*3 {
			return fmt.Sprintf("💡 **Insight:** %s me %d students hain jabke %s me sirf %d. Class sizes balance karna consider karein.",
				maxClass, maxCount, minClass, minCount)
		}
	}

	if total > 100 {
		return "✅ School ki enrollment achi hai. Regular growth maintain karein."
	}

	return ""
}

// GenerateAttendanceInsight provides analysis based on attendance data.
func GenerateAttendanceInsight(percentage float64, absent, total int) string {
	if total == 0 {
		return ""
	}

	if percentage >= 95 {
		return "🌟 **Excellent!** Attendance 95%+ hai — bohot achi performance!"
	}
	if percentage >= 85 {
		return "✅ Attendance stable hai. Keep it up!"
	}
	if percentage >= 70 {
		return fmt.Sprintf("⚠️ **Attention:** Attendance %.0f%% hai jo average se neeche hai. %d students absent hain — parents ko notify karein.",
			percentage, absent)
	}
	return fmt.Sprintf("🔴 **Warning:** Attendance sirf %.0f%% hai! %d students absent hain. Immediate action required — parents ko call karein aur reason find karein.",
		percentage, absent)
}

// GenerateFeeInsight provides analysis based on fee data.
func GenerateFeeInsight(collected, pending float64, overdue int) string {
	if collected == 0 && pending == 0 {
		return ""
	}

	total := collected + pending
	rate := 0.0
	if total > 0 {
		rate = (collected / total) * 100
	}

	if rate >= 90 {
		return "🌟 **Great!** Fee collection 90%+ hai — excellent management!"
	}
	if rate >= 70 {
		if overdue > 5 {
			return fmt.Sprintf("⚠️ %d students ki fees overdue hain. Unhe reminder bhejein ya parents se contact karein.", overdue)
		}
		return "✅ Fee collection on track hai."
	}
	if overdue > 0 {
		return fmt.Sprintf("🔴 **Alert:** Collection rate sirf %.0f%% hai aur %d students overdue hain. Fee recovery drive start karein.",
			rate, overdue)
	}
	return fmt.Sprintf("⚠️ Collection rate %.0f%% hai. Pending fees ke liye reminders bhejein.", rate)
}

// GenerateResultInsight provides analysis based on result data.
func GenerateResultInsight(avgPercentage float64, totalResults int) string {
	if totalResults == 0 {
		return ""
	}

	if avgPercentage >= 80 {
		return "🌟 School ka overall average 80%+ hai — students achi performance de rahe hain!"
	}
	if avgPercentage >= 60 {
		return "✅ Average performance satisfactory hai. Weak students pe focus karein."
	}
	if avgPercentage >= 40 {
		return "⚠️ Average performance below expectations hai. Extra classes ya tutoring consider karein."
	}
	return "🔴 Average performance critical level pe hai. Immediate academic intervention required."
}

// GenerateTimetableInsight provides analysis based on timetable data.
func GenerateTimetableInsight(totalPeriods int, totalClasses int) string {
	if totalPeriods == 0 {
		return "⚠️ Timetable abhi configure nahi hua. Classes ke liye schedule set karein."
	}
	if totalClasses > 0 {
		avg := totalPeriods / totalClasses
		if avg < 5 {
			return fmt.Sprintf("💡 Average %d periods per class hai — consider adding more periods for better coverage.", avg)
		}
	}
	return ""
}
