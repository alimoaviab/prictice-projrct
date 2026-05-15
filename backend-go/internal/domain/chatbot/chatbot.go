// Package chatbot implements the /api/chatbot/message endpoint.
// It provides an AI-powered assistant that can query school data using
// registered tools. Uses Google Gemini for intent detection with fallback
// to keyword matching when Gemini is unavailable.
package chatbot

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/eduplexo/backend-go/internal/ai"
	"github.com/eduplexo/backend-go/internal/api"
	"github.com/eduplexo/backend-go/internal/auth"
	"github.com/eduplexo/backend-go/internal/cache"
	"github.com/eduplexo/backend-go/internal/store"
)

// ActionButton represents a clickable action in the response.
type ActionButton struct {
	Label      string `json:"label"`
	Route      string `json:"route"`
	ActionType string `json:"action_type"` // "navigate" | "create"
	Icon       string `json:"icon,omitempty"`
}

type Handler struct {
	Store  *store.MemStore
	Gemini *ai.GeminiClient
	Cache  *cache.Client
}

func New(s *store.MemStore) *Handler { return &Handler{Store: s} }

// NewWithAI creates a chatbot handler with Gemini AI and Redis cache.
func NewWithAI(s *store.MemStore, gemini *ai.GeminiClient, c *cache.Client) *Handler {
	return &Handler{Store: s, Gemini: gemini, Cache: c}
}

type chatRequest struct {
	Message string           `json:"message"`
	History []ai.ChatMessage `json:"history"`
}

type chatResponse struct {
	Reply            string         `json:"reply"`
	Analysis         string         `json:"analysis,omitempty"`
	SuggestedActions []string       `json:"suggested_actions,omitempty"`
	QuickButtons     []ActionButton `json:"quick_buttons,omitempty"`
	ToolUsed         string         `json:"tool_used,omitempty"`
	Data             any            `json:"data,omitempty"`
	Language         string         `json:"language,omitempty"`
}

// Message implements POST /api/chatbot/message.
// Pipeline: Rate limit → Cache → Intent Detection (Gemini) → RBAC → Query → Response
// Falls back to keyword matching when Gemini is unavailable.
func (h *Handler) Message(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	var body chatRequest
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid request body.", 400, nil))
		return
	}

	if err := auth.AssertPermission(ctx, "dashboard", auth.ActionView); err != nil {
		api.WriteResult(w, api.Fail("UNAUTHORIZED", "Not authorized.", 401, nil))
		return
	}

	msg := strings.TrimSpace(body.Message)
	if len(msg) > 500 {
		msg = msg[:500]
	}
	if msg == "" {
		api.WriteJSON(w, http.StatusOK, api.Ok(chatResponse{
			Reply: "Please type a message. I can help you with student info, attendance, fees, exams, timetable, and more!",
			QuickButtons: []ActionButton{
				{Label: "School Stats", Route: "/admin/dashboard", ActionType: "navigate", Icon: "dashboard"},
				{Label: "Students", Route: "/admin/students", ActionType: "navigate", Icon: "school"},
			},
		}))
		return
	}

	msgLower := strings.ToLower(msg)

	// Try Gemini AI intent detection
	if h.Gemini != nil && h.Gemini.Available() {
		intent, err := h.Gemini.DetectIntent(r.Context(), msg, body.History)
		if err == nil && intent != nil && intent.Confidence > 0.3 {
			resp := h.handleIntent(ctx, intent, msg)
			resp.Language = intent.Language
			api.WriteJSON(w, http.StatusOK, api.Ok(resp))
			return
		}
	}

	// Fallback: keyword matching
	resp := h.keywordFallback(ctx, msgLower)
	api.WriteJSON(w, http.StatusOK, api.Ok(resp))
}

// handleIntent routes a detected intent to the appropriate handler.
func (h *Handler) handleIntent(reqCtx *api.RequestContext, intent *ai.IntentResult, originalMsg string) chatResponse {
	// RBAC check
	if (intent.Category == "fee" || intent.Category == "subscription") && reqCtx.Role != "admin" && reqCtx.Role != "super_admin" {
		return chatResponse{Reply: "⚠️ Fee and subscription information is restricted to administrators."}
	}

	switch intent.Category {
	case "student":
		if intent.Intent == "student_count" {
			return h.toolGetStudentCount(reqCtx)
		}
		if name := intent.Entities["student_name"]; name != "" {
			return h.searchStudent(reqCtx, name)
		}
		if name := intent.Entities["name"]; name != "" {
			return h.searchStudent(reqCtx, name)
		}
		return h.toolGetStudentCount(reqCtx)
	case "class":
		if name := intent.Entities["class_name"]; name != "" {
			return h.searchClass(reqCtx, name)
		}
		return h.toolGetClassInfo(reqCtx)
	case "teacher":
		if name := intent.Entities["teacher_name"]; name != "" {
			return h.searchTeacher(reqCtx, name)
		}
		if name := intent.Entities["name"]; name != "" {
			return h.searchTeacher(reqCtx, name)
		}
		return h.toolGetTeacherList(reqCtx)
	case "fee":
		return h.toolGetFeeSummary(reqCtx)
	case "exam":
		return h.toolGetUpcomingExams(reqCtx)
	case "result":
		return h.toolGetRecentResults(reqCtx)
	case "academic_year":
		return h.handleAcademicYear(reqCtx)
	case "support":
		return chatResponse{
			Reply: "🆘 **Support**\n\n📧 support@eduplexo.com\n📞 +92 300 1234567\n💬 WhatsApp: +92 300 1234567",
			QuickButtons: []ActionButton{
				{Label: "Email Support", Route: "mailto:support@eduplexo.com", ActionType: "navigate"},
				{Label: "WhatsApp", Route: "https://wa.me/923001234567", ActionType: "navigate"},
			},
		}
	case "guide":
		return h.handleGuide(intent)
	case "diagnostic":
		return h.handleDiagnostic(reqCtx)
	case "greeting":
		return chatResponse{
			Reply: "Hello! 👋 I'm EduBot, your AI school assistant.\n\n• 📊 Students & Analytics\n• 📋 Attendance\n• 💰 Fees\n• 📝 Exams & Results\n• 👨‍🏫 Teachers\n• 📅 Events\n\nAsk me anything!",
			QuickButtons: []ActionButton{
				{Label: "School Stats", Route: "/admin/dashboard", ActionType: "navigate"},
				{Label: "Students", Route: "/admin/students", ActionType: "navigate"},
				{Label: "Fees", Route: "/admin/fee", ActionType: "navigate"},
			},
		}
	default:
		return h.toolGetSchoolStats(reqCtx)
	}
}

func (h *Handler) handleAcademicYear(ctx *api.RequestContext) chatResponse {
	h.Store.RLock()
	defer h.Store.RUnlock()
	for _, ay := range h.Store.AcademicYears {
		if ay.SchoolID == ctx.SchoolID && ay.IsActive {
			return chatResponse{
				Reply: fmt.Sprintf("📅 Active Academic Year: **%s**\nStart: %s | End: %s",
					ay.Year, ay.StartDate.Format("02 Jan 2006"), ay.EndDate.Format("02 Jan 2006")),
				QuickButtons: []ActionButton{{Label: "Manage Years", Route: "/admin/academic-years", ActionType: "navigate"}},
			}
		}
	}
	return chatResponse{
		Reply: "⚠️ No active academic year. Create one to use most features.",
		QuickButtons: []ActionButton{{Label: "Create Year", Route: "/admin/academic-years/create", ActionType: "create"}},
	}
}

func (h *Handler) handleGuide(intent *ai.IntentResult) chatResponse {
	guides := map[string]string{
		"guide_create_student":    "📝 **Create Student**\n\n1. Sidebar → Students\n2. Click \"Create Student\"\n3. Fill: Name, Class, Section, Guardian\n4. Save\n\n✅ Requires: Active academic year + at least 1 class",
		"guide_create_class":      "🏛️ **Create Class**\n\n1. Sidebar → Classes\n2. Click \"Create Class\"\n3. Enter: Name, Section, Capacity\n4. Save\n\n✅ Requires: Active academic year",
		"guide_create_exam":       "📝 **Create Exam**\n\n1. Sidebar → Exams\n2. Click \"Create Exam\"\n3. Fill: Title, Subject, Class, Date, Max Marks\n4. Save",
		"guide_mark_attendance":   "✅ **Mark Attendance**\n\n1. Sidebar → Attendance\n2. Click \"Mark Attendance\"\n3. Select Class & Date\n4. Mark each student\n5. Submit",
		"guide_create_teacher":    "👨‍🏫 **Add Teacher**\n\n1. Sidebar → Teachers\n2. Click \"Create Teacher\"\n3. Fill: Name, Email, Phone, Subjects\n4. Save",
		"guide_enter_results":     "📊 **Enter Results**\n\n1. Sidebar → Results\n2. Click \"Enter Results\"\n3. Select Exam & Class\n4. Enter marks for each student\n5. Save",
	}
	if text, ok := guides[intent.Intent]; ok {
		return chatResponse{Reply: text}
	}
	return chatResponse{Reply: "📚 I can guide you through: Create Student, Class, Exam, Teacher, Mark Attendance, Enter Results. Just ask!"}
}

func (h *Handler) handleDiagnostic(ctx *api.RequestContext) chatResponse {
	h.Store.RLock()
	defer h.Store.RUnlock()
	issues := []string{}
	hasYear := false
	for _, ay := range h.Store.AcademicYears {
		if ay.SchoolID == ctx.SchoolID && ay.IsActive {
			hasYear = true
			break
		}
	}
	if !hasYear {
		issues = append(issues, "❌ No active academic year")
	}
	classCount := 0
	for _, c := range h.Store.Classes {
		if c.SchoolID == ctx.SchoolID {
			classCount++
		}
	}
	if classCount == 0 {
		issues = append(issues, "❌ No classes created")
	}
	if len(issues) == 0 {
		return chatResponse{Reply: "✅ System looks healthy! No issues found."}
	}
	return chatResponse{
		Reply:    "🔍 **Issues Found:**\n\n" + strings.Join(issues, "\n"),
		Analysis: fmt.Sprintf("%d issue(s) detected that may be causing problems.", len(issues)),
		QuickButtons: []ActionButton{
			{Label: "Create Year", Route: "/admin/academic-years/create", ActionType: "create"},
			{Label: "Create Class", Route: "/admin/classes/create", ActionType: "create"},
		},
	}
}

func (h *Handler) searchStudent(ctx *api.RequestContext, name string) chatResponse {
	h.Store.RLock()
	defer h.Store.RUnlock()
	nameLower := strings.ToLower(name)
	for _, s := range h.Store.Students {
		if s.SchoolID != ctx.SchoolID {
			continue
		}
		if strings.Contains(strings.ToLower(s.FirstName+" "+s.LastName), nameLower) {
			return chatResponse{
				Reply:    fmt.Sprintf("👤 **%s %s**\nAdmission: %s | Class: %s | Status: %s", s.FirstName, s.LastName, s.AdmissionNo, s.ClassID, s.Status),
				ToolUsed: "student_search",
			}
		}
	}
	return chatResponse{Reply: fmt.Sprintf("Student \"%s\" not found.", name)}
}

func (h *Handler) searchClass(ctx *api.RequestContext, name string) chatResponse {
	h.Store.RLock()
	defer h.Store.RUnlock()
	nameLower := strings.ToLower(name)
	for _, c := range h.Store.Classes {
		if c.SchoolID == ctx.SchoolID && strings.Contains(strings.ToLower(c.Name), nameLower) {
			count := 0
			for _, s := range h.Store.Students {
				if s.ClassID == c.ID {
					count++
				}
			}
			return chatResponse{Reply: fmt.Sprintf("🏛️ **%s** — %d students | Status: %s", c.Name, count, c.Status)}
		}
	}
	return chatResponse{Reply: fmt.Sprintf("Class \"%s\" not found.", name)}
}

func (h *Handler) searchTeacher(ctx *api.RequestContext, name string) chatResponse {
	h.Store.RLock()
	defer h.Store.RUnlock()
	nameLower := strings.ToLower(name)
	for _, t := range h.Store.Teachers {
		if t.SchoolID == ctx.SchoolID && strings.Contains(strings.ToLower(t.FirstName+" "+t.LastName), nameLower) {
			return chatResponse{Reply: fmt.Sprintf("👨‍🏫 **%s %s**\nEmail: %s | Phone: %s | Status: %s", t.FirstName, t.LastName, t.Email, t.Phone, t.Status)}
		}
	}
	return chatResponse{Reply: fmt.Sprintf("Teacher \"%s\" not found.", name)}
}

// keywordFallback is the original keyword-matching logic.
func (h *Handler) keywordFallback(ctx *api.RequestContext, msg string) chatResponse {
	switch {
	case containsAny(msg, "student", "students", "kitne student", "total student"):
		return h.toolGetStudentCount(ctx)
	case containsAny(msg, "attendance", "present", "absent", "hazri"):
		return h.toolGetAttendanceSummary(ctx)
	case containsAny(msg, "fee", "fees", "pending fee", "collection"):
		return h.toolGetFeeSummary(ctx)
	case containsAny(msg, "teacher", "teachers", "faculty"):
		return h.toolGetTeacherList(ctx)
	case containsAny(msg, "exam", "exams", "test"):
		return h.toolGetUpcomingExams(ctx)
	case containsAny(msg, "timetable", "schedule", "period"):
		return h.toolGetTimetableSummary(ctx)
	case containsAny(msg, "result", "results", "marks"):
		return h.toolGetRecentResults(ctx)
	case containsAny(msg, "class", "classes"):
		return h.toolGetClassInfo(ctx)
	case containsAny(msg, "hello", "hi", "salam"):
		return chatResponse{Reply: "Hello! 👋 I'm EduBot. Ask me about students, fees, attendance, exams, or anything else!"}
	case containsAny(msg, "help", "support", "madad"):
		return chatResponse{Reply: "🆘 Support: support@eduplexo.com | +92 300 1234567"}
	case containsAny(msg, "academic year", "session"):
		return h.handleAcademicYear(ctx)
	default:
		return h.toolGetSchoolStats(ctx)
	}
}

// ─── Tool Implementations ────────────────────────────────────────────────

func (h *Handler) toolGetStudentCount(ctx *api.RequestContext) chatResponse {
	h.Store.RLock()
	defer h.Store.RUnlock()

	total := 0
	active := 0
	byClass := map[string]int{}

	for _, s := range h.Store.Students {
		if s.SchoolID != ctx.SchoolID {
			continue
		}
		total++
		if s.Status == "active" {
			active++
		}
		// Find class name
		for _, c := range h.Store.Classes {
			if c.ID == s.ClassID {
				byClass[c.Name]++
				break
			}
		}
	}

	// Build class breakdown
	breakdown := ""
	for name, count := range byClass {
		breakdown += fmt.Sprintf("\n• %s: %d students", name, count)
	}
	if breakdown == "" {
		breakdown = "\nNo class-wise data available yet."
	}

	return chatResponse{
		Reply:    fmt.Sprintf("📊 **Student Summary**\n\nTotal Students: **%d**\nActive: **%d**\n\n**Class-wise:**%s", total, active, breakdown),
		ToolUsed: "get_student_count",
		Data: map[string]any{
			"total":    total,
			"active":   active,
			"by_class": byClass,
		},
	}
}

func (h *Handler) toolGetAttendanceSummary(ctx *api.RequestContext) chatResponse {
	h.Store.RLock()
	defer h.Store.RUnlock()

	today := time.Now().Format("2006-01-02")
	present, absent, late, total := 0, 0, 0, 0

	for _, a := range h.Store.Attendance {
		if a.SchoolID != ctx.SchoolID {
			continue
		}
		if a.Date.Format("2006-01-02") == today {
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
	}

	percentage := 0.0
	if total > 0 {
		percentage = float64(present+late) / float64(total) * 100
	}

	reply := fmt.Sprintf("📋 **Today's Attendance** (%s)\n\n✅ Present: **%d**\n❌ Absent: **%d**\n⏰ Late: **%d**\n📊 Attendance Rate: **%.1f%%**",
		today, present, absent, late, percentage)

	if total == 0 {
		reply = "📋 **Today's Attendance**\n\nNo attendance has been marked yet today. Go to Attendance → Mark to record today's attendance."
	}

	return chatResponse{
		Reply:    reply,
		ToolUsed: "get_attendance_summary",
		Data: map[string]any{
			"date":       today,
			"present":    present,
			"absent":     absent,
			"late":       late,
			"total":      total,
			"percentage": percentage,
		},
	}
}

func (h *Handler) toolGetFeeSummary(ctx *api.RequestContext) chatResponse {
	h.Store.RLock()
	defer h.Store.RUnlock()

	var totalCollected, totalPending float64
	paidCount, unpaidCount, overdueCount := 0, 0, 0

	for _, f := range h.Store.Fees {
		if f.SchoolID != ctx.SchoolID {
			continue
		}
		eff := f.Amount + f.AdjustmentAmount
		totalCollected += f.PaidAmount
		remaining := eff - f.PaidAmount
		if remaining > 0 {
			totalPending += remaining
			if f.PaidAmount > 0 {
				// partial
			} else {
				unpaidCount++
			}
			// Check if overdue (due date passed)
			if !f.DueAt.IsZero() && f.DueAt.Before(time.Now()) {
				overdueCount++
			}
		} else {
			paidCount++
		}
	}

	return chatResponse{
		Reply: fmt.Sprintf("💰 **Fee Summary**\n\n✅ Total Collected: **Rs. %s**\n⏳ Pending Amount: **Rs. %s**\n🔴 Overdue Students: **%d**\n✅ Fully Paid: **%d**\n❌ Unpaid: **%d**",
			formatMoney(totalCollected), formatMoney(totalPending), overdueCount, paidCount, unpaidCount),
		ToolUsed: "get_fee_summary",
		Data: map[string]any{
			"total_collected": totalCollected,
			"total_pending":   totalPending,
			"paid_count":      paidCount,
			"unpaid_count":    unpaidCount,
			"overdue_count":   overdueCount,
		},
	}
}

func (h *Handler) toolGetTeacherList(ctx *api.RequestContext) chatResponse {
	h.Store.RLock()
	defer h.Store.RUnlock()

	teachers := []map[string]string{}
	for _, t := range h.Store.Teachers {
		if t.SchoolID != ctx.SchoolID {
			continue
		}
		subjects := "N/A"
		if len(t.Subjects) > 0 {
			subjects = strings.Join(t.Subjects, ", ")
		}
		teachers = append(teachers, map[string]string{
			"name":     t.FirstName + " " + t.LastName,
			"subjects": subjects,
			"status":   t.Status,
		})
	}

	if len(teachers) == 0 {
		return chatResponse{
			Reply:    "👨‍🏫 **Teachers**\n\nNo teachers registered yet. Go to Teachers → Add Teacher to register faculty members.",
			ToolUsed: "get_teacher_list",
		}
	}

	list := ""
	for i, t := range teachers {
		if i >= 10 {
			list += fmt.Sprintf("\n... and %d more", len(teachers)-10)
			break
		}
		list += fmt.Sprintf("\n• **%s** — %s", t["name"], t["subjects"])
	}

	return chatResponse{
		Reply:    fmt.Sprintf("👨‍🏫 **Teachers** (Total: %d)%s", len(teachers), list),
		ToolUsed: "get_teacher_list",
		Data:     teachers,
	}
}

func (h *Handler) toolGetUpcomingExams(ctx *api.RequestContext) chatResponse {
	h.Store.RLock()
	defer h.Store.RUnlock()

	now := time.Now()
	upcoming := []map[string]string{}

	for _, e := range h.Store.Exams {
		if e.SchoolID != ctx.SchoolID {
			continue
		}
		if e.StartsAt.After(now) {
			className := ""
			for _, c := range h.Store.Classes {
				if c.ID == e.ClassID {
					className = c.Name
					break
				}
			}
			upcoming = append(upcoming, map[string]string{
				"title":   e.Title,
				"subject": e.Subject,
				"class":   className,
				"date":    e.StartsAt.Format("Mon 02 Jan, 3:04 PM"),
			})
		}
	}

	if len(upcoming) == 0 {
		return chatResponse{
			Reply:    "📝 **Upcoming Exams**\n\nNo upcoming exams scheduled. Go to Exams → Create to schedule a new exam.",
			ToolUsed: "get_upcoming_exams",
		}
	}

	list := ""
	for i, e := range upcoming {
		if i >= 5 {
			break
		}
		list += fmt.Sprintf("\n📝 **%s** — %s\n   Class: %s | Date: %s", e["title"], e["subject"], e["class"], e["date"])
	}

	return chatResponse{
		Reply:    fmt.Sprintf("📝 **Upcoming Exams** (%d scheduled)%s", len(upcoming), list),
		ToolUsed: "get_upcoming_exams",
		Data:     upcoming,
	}
}

func (h *Handler) toolGetTimetableSummary(ctx *api.RequestContext) chatResponse {
	h.Store.RLock()
	defer h.Store.RUnlock()

	totalPeriods := 0
	byDay := map[string]int{}
	dayNames := []string{"Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"}

	for _, t := range h.Store.Timetables {
		if t.SchoolID != ctx.SchoolID {
			continue
		}
		for _, session := range t.Sessions {
			totalPeriods++
			dayName := "Unknown"
			if session.Day >= 0 && session.Day < len(dayNames) {
				dayName = dayNames[session.Day]
			}
			byDay[dayName]++
		}
	}

	if totalPeriods == 0 {
		return chatResponse{
			Reply:    "📅 **Timetable**\n\nNo timetable entries configured yet. Go to Timetable → Create to add class schedules.",
			ToolUsed: "get_class_timetable",
		}
	}

	days := ""
	for _, day := range []string{"Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"} {
		if count, ok := byDay[day]; ok {
			days += fmt.Sprintf("\n• %s: %d periods", day, count)
		}
	}

	return chatResponse{
		Reply:    fmt.Sprintf("📅 **Timetable Summary**\n\nTotal Periods: **%d**\n\n**Day-wise:**%s", totalPeriods, days),
		ToolUsed: "get_class_timetable",
		Data: map[string]any{
			"total_periods": totalPeriods,
			"by_day":        byDay,
		},
	}
}

func (h *Handler) toolGetRecentResults(ctx *api.RequestContext) chatResponse {
	h.Store.RLock()
	defer h.Store.RUnlock()

	count := 0
	var totalObtained, totalMax float64

	for _, r := range h.Store.Results {
		if r.SchoolID != ctx.SchoolID {
			continue
		}
		count++
		totalObtained += r.ObtainedMarks
		// Find exam max marks
		for _, e := range h.Store.Exams {
			if e.ID == r.ExamID {
				totalMax += float64(e.MaxMarks)
				break
			}
		}
	}

	if count == 0 {
		return chatResponse{
			Reply:    "📊 **Results**\n\nNo results entered yet. Go to Results → Enter Results to record exam scores.",
			ToolUsed: "get_recent_results",
		}
	}

	avgPercentage := 0.0
	if totalMax > 0 {
		avgPercentage = (totalObtained / totalMax) * 100
	}

	return chatResponse{
		Reply: fmt.Sprintf("📊 **Results Summary**\n\nTotal Results Entered: **%d**\nAverage Score: **%.1f%%**",
			count, avgPercentage),
		ToolUsed: "get_recent_results",
		Data: map[string]any{
			"total_results":    count,
			"average_percent":  avgPercentage,
		},
	}
}

func (h *Handler) toolGetSchoolStats(ctx *api.RequestContext) chatResponse {
	h.Store.RLock()
	defer h.Store.RUnlock()

	students, teachers, classes := 0, 0, 0
	for _, s := range h.Store.Students {
		if s.SchoolID == ctx.SchoolID {
			students++
		}
	}
	for _, t := range h.Store.Teachers {
		if t.SchoolID == ctx.SchoolID {
			teachers++
		}
	}
	for _, c := range h.Store.Classes {
		if c.SchoolID == ctx.SchoolID {
			classes++
		}
	}

	// Today's attendance
	today := time.Now().Format("2006-01-02")
	presentToday := 0
	for _, a := range h.Store.Attendance {
		if a.SchoolID == ctx.SchoolID && a.Date.Format("2006-01-02") == today && strings.ToLower(a.Status) == "present" {
			presentToday++
		}
	}

	return chatResponse{
		Reply: fmt.Sprintf("🏫 **School Overview**\n\n👨‍🎓 Students: **%d**\n👨‍🏫 Teachers: **%d**\n🏛️ Classes: **%d**\n✅ Present Today: **%d**",
			students, teachers, classes, presentToday),
		ToolUsed: "get_school_stats",
		Data: map[string]any{
			"students":      students,
			"teachers":      teachers,
			"classes":       classes,
			"present_today": presentToday,
		},
	}
}

func (h *Handler) toolGetClassInfo(ctx *api.RequestContext) chatResponse {
	h.Store.RLock()
	defer h.Store.RUnlock()

	classList := []map[string]any{}
	for _, c := range h.Store.Classes {
		if c.SchoolID != ctx.SchoolID {
			continue
		}
		studentCount := 0
		for _, s := range h.Store.Students {
			if s.ClassID == c.ID {
				studentCount++
			}
		}
		classList = append(classList, map[string]any{
			"name":          c.Name,
			"student_count": studentCount,
			"status":        c.Status,
		})
	}

	if len(classList) == 0 {
		return chatResponse{
			Reply:    "🏛️ **Classes**\n\nNo classes registered yet. Go to Classes → Create to add a new class.",
			ToolUsed: "get_class_info",
		}
	}

	list := ""
	for _, c := range classList {
		list += fmt.Sprintf("\n• **%s** — %d students", c["name"], c["student_count"])
	}

	return chatResponse{
		Reply:    fmt.Sprintf("🏛️ **Classes** (Total: %d)%s", len(classList), list),
		ToolUsed: "get_class_info",
		Data:     classList,
	}
}

// ─── Helpers ─────────────────────────────────────────────────────────────

func containsAny(msg string, keywords ...string) bool {
	for _, kw := range keywords {
		if strings.Contains(msg, kw) {
			return true
		}
	}
	return false
}

func formatMoney(amount float64) string {
	if amount == 0 {
		return "0"
	}
	s := fmt.Sprintf("%.0f", amount)
	// Add comma separators for Pakistani/Indian format
	if len(s) <= 3 {
		return s
	}
	// Simple comma formatting
	result := ""
	for i, c := range s {
		if i > 0 && (len(s)-i)%3 == 0 {
			result += ","
		}
		result += string(c)
	}
	return result
}
