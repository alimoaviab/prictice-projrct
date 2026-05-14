// Package chatbot implements the /api/chatbot/message endpoint.
// It provides an AI-powered assistant that can query school data using
// registered tools. Works with OpenAI-compatible APIs.
package chatbot

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/eduplexo/backend-go/internal/api"
	"github.com/eduplexo/backend-go/internal/auth"
	"github.com/eduplexo/backend-go/internal/store"
)

type Handler struct {
	Store *store.MemStore
}

func New(s *store.MemStore) *Handler { return &Handler{Store: s} }

type chatRequest struct {
	Message string        `json:"message"`
	History []chatMessage `json:"history"`
}

type chatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type chatResponse struct {
	Reply    string `json:"reply"`
	ToolUsed string `json:"tool_used,omitempty"`
	Data     any    `json:"data,omitempty"`
}

// Message implements POST /api/chatbot/message.
// Since we don't have an external AI API key configured, this uses a
// rule-based approach that matches user intent to tools and generates
// helpful responses from real data.
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

	msg := strings.ToLower(strings.TrimSpace(body.Message))
	if msg == "" {
		api.WriteJSON(w, http.StatusOK, api.Ok(chatResponse{
			Reply: "Please type a message. I can help you with student info, attendance, fees, exams, timetable, and more!",
		}))
		return
	}

	// Route to appropriate tool based on message content
	var resp chatResponse

	switch {
	case containsAny(msg, "student", "students", "kitne student", "total student", "how many student"):
		resp = h.toolGetStudentCount(ctx)
	case containsAny(msg, "attendance", "present", "absent", "hazri", "haazri"):
		resp = h.toolGetAttendanceSummary(ctx)
	case containsAny(msg, "fee", "fees", "pending fee", "collection", "overdue", "defaulter"):
		resp = h.toolGetFeeSummary(ctx)
	case containsAny(msg, "teacher", "teachers", "faculty", "staff"):
		resp = h.toolGetTeacherList(ctx)
	case containsAny(msg, "exam", "exams", "upcoming exam", "test"):
		resp = h.toolGetUpcomingExams(ctx)
	case containsAny(msg, "timetable", "schedule", "period", "class schedule"):
		resp = h.toolGetTimetableSummary(ctx)
	case containsAny(msg, "result", "results", "marks", "grade"):
		resp = h.toolGetRecentResults(ctx)
	case containsAny(msg, "stats", "overview", "summary", "school stats", "dashboard"):
		resp = h.toolGetSchoolStats(ctx)
	case containsAny(msg, "class", "classes", "sections"):
		resp = h.toolGetClassInfo(ctx)
	case containsAny(msg, "hello", "hi", "hey", "salam", "assalam"):
		resp = chatResponse{
			Reply: "Hello! 👋 I'm EduBot, your school assistant. I can help you with:\n\n• Student information & counts\n• Attendance summary\n• Fee collection & pending fees\n• Upcoming exams\n• Teacher information\n• Timetable & schedules\n• Results & grades\n\nWhat would you like to know?",
		}
	default:
		resp = chatResponse{
			Reply: "I can help you with information about students, attendance, fees, exams, teachers, timetable, and results. Try asking something like:\n\n• \"How many students are present today?\"\n• \"Show me pending fees\"\n• \"What are upcoming exams?\"\n• \"Show teacher list\"",
		}
	}

	api.WriteJSON(w, http.StatusOK, api.Ok(resp))
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
