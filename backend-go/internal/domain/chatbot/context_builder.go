// context_builder.go — Builds school data context for Gemini reasoning.
//
// The builder follows data minimization: it summarizes counts and a few safe
// examples instead of exposing raw lists, IDs, contact details, or fee records
// to the model.
package chatbot

import (
	"fmt"
	"sort"
	"strings"
	"time"

	"github.com/eduplexo/backend-go/internal/api"
	"github.com/eduplexo/backend-go/internal/store"
)

// SchoolContext contains all relevant data for Gemini to reason about.
type SchoolContext struct {
	SchoolName     string
	AcademicYear   string
	TotalStudents  int
	TotalTeachers  int
	TotalClasses   int
	Role           string
	StudentData    string
	AttendanceData string
	FeeData        string
	TeacherData    string
	ClassData      string
	ExamData       string
	ResultData     string
	TimetableData  string
	EventData      string
	DiagnosticData string
}

// BuildContext gathers relevant school data based on the user's question.
// This is passed to Gemini so it can reason about the data naturally.
func BuildContext(s *store.MemStore, ctx *api.RequestContext, categories []string) SchoolContext {
	scope := resolveChatScope(s, ctx)
	sc := SchoolContext{Role: ctx.Role}

	s.RLock()
	defer s.RUnlock()

	for _, sch := range s.Schools {
		if scope.AllowGlobal || sch.SchoolID == ctx.SchoolID {
			sc.SchoolName = sch.Name
			break
		}
	}
	for _, ay := range s.AcademicYears {
		if (scope.AllowGlobal || ay.SchoolID == ctx.SchoolID) && ay.IsActive {
			sc.AcademicYear = ay.Year
			break
		}
	}

	for _, st := range s.Students {
		if (scope.AllowGlobal || st.SchoolID == ctx.SchoolID) && (scope.Role == "admin" || scope.Role == "super_admin" || scope.studentAllowed(st.ID) || scope.classAllowed(st.ClassID)) && st.Status == "active" {
			sc.TotalStudents++
		}
	}
	for _, t := range s.Teachers {
		if (scope.AllowGlobal || t.SchoolID == ctx.SchoolID) && (scope.Role == "admin" || scope.Role == "super_admin" || scope.classAllowedAny(t.ClassIDs)) && t.Status == "active" {
			sc.TotalTeachers++
		}
	}
	for _, c := range s.Classes {
		if (scope.AllowGlobal || c.SchoolID == ctx.SchoolID) && (scope.Role == "admin" || scope.Role == "super_admin" || scope.classAllowed(c.ID)) && c.Status != "archived" {
			sc.TotalClasses++
		}
	}

	for _, cat := range categories {
		switch cat {
		case "student":
			sc.StudentData = buildStudentContext(s, scope)
		case "attendance":
			sc.AttendanceData = buildAttendanceContext(s, scope)
		case "fee":
			sc.FeeData = buildFeeContext(s, scope)
		case "teacher":
			sc.TeacherData = buildTeacherContext(s, scope)
		case "class":
			sc.ClassData = buildClassContext(s, scope)
		case "exam":
			sc.ExamData = buildExamContext(s, scope)
		case "result":
			sc.ResultData = buildResultContext(s, scope)
		case "timetable":
			sc.TimetableData = buildTimetableContext(s, scope)
		case "event":
			sc.EventData = buildEventContext(s, scope)
		case "diagnostic":
			sc.DiagnosticData = buildDiagnosticContext(s, scope)
		}
	}

	return sc
}

// FormatForGemini converts the context into a text block for the AI prompt.
func (sc SchoolContext) FormatForGemini() string {
	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("School: %s | Academic Year: %s | Role: %s\n", sc.SchoolName, sc.AcademicYear, sc.Role))
	sb.WriteString(fmt.Sprintf("Overview: %d students, %d teachers, %d classes\n", sc.TotalStudents, sc.TotalTeachers, sc.TotalClasses))

	if sc.StudentData != "" {
		sb.WriteString("\n--- STUDENT DATA ---\n")
		sb.WriteString(sc.StudentData)
	}
	if sc.AttendanceData != "" {
		sb.WriteString("\n--- ATTENDANCE DATA ---\n")
		sb.WriteString(sc.AttendanceData)
	}
	if sc.FeeData != "" {
		sb.WriteString("\n--- FEE DATA ---\n")
		sb.WriteString(sc.FeeData)
	}
	if sc.TeacherData != "" {
		sb.WriteString("\n--- TEACHER DATA ---\n")
		sb.WriteString(sc.TeacherData)
	}
	if sc.ClassData != "" {
		sb.WriteString("\n--- CLASS DATA ---\n")
		sb.WriteString(sc.ClassData)
	}
	if sc.ExamData != "" {
		sb.WriteString("\n--- EXAM DATA ---\n")
		sb.WriteString(sc.ExamData)
	}
	if sc.ResultData != "" {
		sb.WriteString("\n--- RESULT DATA ---\n")
		sb.WriteString(sc.ResultData)
	}
	if sc.TimetableData != "" {
		sb.WriteString("\n--- TIMETABLE DATA ---\n")
		sb.WriteString(sc.TimetableData)
	}
	if sc.EventData != "" {
		sb.WriteString("\n--- EVENT DATA ---\n")
		sb.WriteString(sc.EventData)
	}
	if sc.DiagnosticData != "" {
		sb.WriteString("\n--- SYSTEM DIAGNOSTIC ---\n")
		sb.WriteString(sc.DiagnosticData)
	}
	return sb.String()
}

// ─── Data Builders ───────────────────────────────────────────────────────

func buildStudentContext(s *store.MemStore, scope chatScope) string {
	counts := map[string]int{}
	total, active := 0, 0

	for _, st := range s.Students {
		if (!scope.AllowGlobal && st.SchoolID != scope.SchoolID) || (!scope.studentAllowed(st.ID) && !scope.classAllowed(st.ClassID) && scope.Role != "admin" && scope.Role != "super_admin") {
			continue
		}
		total++
		if st.Status == "active" {
			active++
		}
		className := st.ClassID
		for _, c := range s.Classes {
			if c.ID == st.ClassID {
				className = c.Name
				break
			}
		}
		counts[className]++
	}

	classNames := make([]string, 0, len(counts))
	for className := range counts {
		classNames = append(classNames, className)
	}
	sort.Strings(classNames)

	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("Total: %d | Active: %d | Inactive: %d\n", total, active, total-active))
	sb.WriteString("Class-wise breakdown:\n")
	for idx, className := range classNames {
		if idx >= 5 {
			sb.WriteString(fmt.Sprintf("and %d more classes.\n", len(classNames)-idx))
			break
		}
		sb.WriteString(fmt.Sprintf("  %s: %d students\n", className, counts[className]))
	}
	if total == 0 {
		sb.WriteString("No accessible student records were found.\n")
	}
	return strings.TrimSpace(sb.String())
}

func buildAttendanceContext(s *store.MemStore, scope chatScope) string {
	today := time.Now().Format("2006-01-02")
	present, absent, late, total := 0, 0, 0, 0

	for _, a := range s.Attendance {
		if (!scope.AllowGlobal && a.SchoolID != scope.SchoolID) || a.Date.Format("2006-01-02") != today {
			continue
		}
		if scope.Role != "admin" && scope.Role != "super_admin" && !scope.studentAllowed(a.StudentID) && !scope.classAllowed(a.ClassID) {
			continue
		}
		total++
		switch strings.ToLower(a.Status) {
		case "present":
			present++
		case "absent":
			absent++
		case "late":
			late++
		}
	}

	pct := 0.0
	if total > 0 {
		pct = float64(present+late) / float64(total) * 100
	}

	return fmt.Sprintf("Today (%s): Present=%d, Absent=%d, Late=%d, Total Marked=%d, Rate=%.1f%%\n", today, present, absent, late, total, pct)
}

func buildFeeContext(s *store.MemStore, scope chatScope) string {
	if !scope.canSeeFeeSummary() {
		return "Fee information is restricted for your role."
	}

	var collected, pending float64
	paid, unpaid, overdue := 0, 0, 0

	for _, f := range s.Fees {
		if (!scope.AllowGlobal && f.SchoolID != scope.SchoolID) || (!scope.AllowGlobal && !scope.studentAllowed(f.StudentID) && !scope.classAllowed(f.ClassID)) {
			continue
		}
		eff := f.Amount + f.AdjustmentAmount
		collected += f.PaidAmount
		rem := eff - f.PaidAmount
		if rem > 0 {
			pending += rem
			if f.PaidAmount == 0 {
				unpaid++
			}
			if !f.DueAt.IsZero() && f.DueAt.Before(time.Now()) {
				overdue++
			}
		} else {
			paid++
		}
	}

	return fmt.Sprintf("Collected: Rs.%.0f | Pending: Rs.%.0f | Paid: %d | Unpaid: %d | Overdue: %d\n", collected, pending, paid, unpaid, overdue)
}

func buildTeacherContext(s *store.MemStore, scope chatScope) string {
	count := 0
	lines := make([]string, 0, 5)
	for _, t := range s.Teachers {
		if (!scope.AllowGlobal && t.SchoolID != scope.SchoolID) || (scope.Role != "admin" && scope.Role != "super_admin" && !scope.classAllowedAny(t.ClassIDs)) {
			continue
		}
		count++
		if len(lines) < 5 {
			subjects := "N/A"
			if len(t.Subjects) > 0 {
				subjects = strings.Join(t.Subjects, ", ")
			}
			lines = append(lines, fmt.Sprintf("  %s %s | %s | %s", t.FirstName, t.LastName, subjects, t.Status))
		}
	}
	if count == 0 {
		return "No accessible teacher records were found."
	}
	return fmt.Sprintf("Total Teachers: %d\n%s", count, strings.Join(lines, "\n"))
}

func buildClassContext(s *store.MemStore, scope chatScope) string {
	lines := make([]string, 0, 5)
	count := 0
	for _, c := range s.Classes {
		if (!scope.AllowGlobal && c.SchoolID != scope.SchoolID) || (!scope.classAllowed(c.ID) && scope.Role != "admin" && scope.Role != "super_admin") {
			continue
		}
		studentCount := 0
		for _, st := range s.Students {
			if st.ClassID == c.ID && (scope.AllowGlobal || st.SchoolID == scope.SchoolID) && st.Status == "active" {
				studentCount++
			}
		}
		count++
		if len(lines) < 5 {
			lines = append(lines, fmt.Sprintf("  %s: %d students | Capacity: %d | Status: %s", c.Name, studentCount, c.Capacity, c.Status))
		}
	}
	if count == 0 {
		return "No classes available in your permitted scope."
	}
	return fmt.Sprintf("Total Classes: %d\n%s", count, strings.Join(lines, "\n"))
}

func buildExamContext(s *store.MemStore, scope chatScope) string {
	now := time.Now()
	count := 0
	lines := make([]string, 0, 5)
	for _, e := range s.Exams {
		if (!scope.AllowGlobal && e.SchoolID != scope.SchoolID) || !e.StartsAt.After(now) || (scope.Role != "admin" && scope.Role != "super_admin" && !scope.classAllowed(e.ClassID)) {
			continue
		}
		count++
		if len(lines) < 5 {
			className := e.ClassID
			for _, c := range s.Classes {
				if c.ID == e.ClassID {
					className = c.Name
					break
				}
			}
			lines = append(lines, fmt.Sprintf("  %s — %s | Class: %s | Date: %s | Max: %d", e.Title, e.Subject, className, e.StartsAt.Format("02 Jan 2006"), e.MaxMarks))
		}
	}
	if count == 0 {
		return "No upcoming exams are available in your permitted scope."
	}
	return fmt.Sprintf("Upcoming Exams: %d\n%s", count, strings.Join(lines, "\n"))
}

func buildResultContext(s *store.MemStore, scope chatScope) string {
	count := 0
	var totalObt, totalMax float64
	for _, r := range s.Results {
		if (!scope.AllowGlobal && r.SchoolID != scope.SchoolID) || (scope.Role != "admin" && scope.Role != "super_admin" && !scope.studentAllowed(r.StudentID) && !scope.classAllowed(r.ClassID)) {
			continue
		}
		count++
		totalObt += r.ObtainedMarks
		for _, e := range s.Exams {
			if e.ID == r.ExamID {
				totalMax += float64(e.MaxMarks)
				break
			}
		}
	}
	avg := 0.0
	if totalMax > 0 {
		avg = (totalObt / totalMax) * 100
	}
	return fmt.Sprintf("Total Results: %d | School Average: %.1f%%\n", count, avg)
}

func buildTimetableContext(s *store.MemStore, scope chatScope) string {
	totalPeriods := 0
	for _, t := range s.Timetables {
		if (!scope.AllowGlobal && t.SchoolID != scope.SchoolID) || (scope.Role != "admin" && scope.Role != "super_admin" && !scope.classAllowed(t.ClassID)) {
			continue
		}
		totalPeriods += len(t.Sessions)
	}
	return fmt.Sprintf("Total Timetable Periods: %d\n", totalPeriods)
}

func buildEventContext(s *store.MemStore, scope chatScope) string {
	now := time.Now()
	count := 0
	lines := make([]string, 0, 5)
	for _, e := range s.Events {
		if (!scope.AllowGlobal && e.SchoolID != scope.SchoolID) || !e.StartDate.After(now) || (scope.Role != "admin" && scope.Role != "super_admin" && !scope.classAllowedAny(e.TargetClassIDs)) {
			continue
		}
		count++
		if len(lines) < 5 {
			lines = append(lines, fmt.Sprintf("  %s — %s | %s", e.Title, e.EventType, e.StartDate.Format("02 Jan 2006")))
		}
	}
	if count == 0 {
		return "No upcoming events are available in your permitted scope."
	}
	return fmt.Sprintf("Upcoming Events: %d\n%s", count, strings.Join(lines, "\n"))
}

func buildDiagnosticContext(s *store.MemStore, scope chatScope) string {
	var sb strings.Builder
	hasYear := false
	for _, ay := range s.AcademicYears {
		if (scope.AllowGlobal || ay.SchoolID == scope.SchoolID) && ay.IsActive {
			hasYear = true
			break
		}
	}
	if !hasYear {
		sb.WriteString("No active academic year found\n")
	}
	classCount := 0
	for _, c := range s.Classes {
		if scope.AllowGlobal || c.SchoolID == scope.SchoolID {
			classCount++
		}
	}
	if classCount == 0 {
		sb.WriteString("No classes created\n")
	}
	if sb.Len() == 0 {
		sb.WriteString("All systems healthy\n")
	}
	return sb.String()
}
