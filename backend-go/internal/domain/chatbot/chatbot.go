// Package chatbot implements the AI School Assistant.
//
// Architecture: Gemini acts as a REASONING ENGINE, not just an intent classifier.
// The pipeline: User Message → Detect relevant categories → Fetch school data →
// Pass data + message + history to Gemini → Gemini reasons and generates natural response.
//
// This produces ChatGPT-like conversational responses with insights, analysis,
// follow-up questions, and multi-tool reasoning in a single response.
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
	"github.com/eduplexo/backend-go/internal/audit"
	"github.com/eduplexo/backend-go/internal/cache"
	"github.com/eduplexo/backend-go/internal/store"
)

// ActionButton represents a clickable action in the response.
type ActionButton struct {
	Label      string `json:"label"`
	Route      string `json:"route"`
	ActionType string `json:"action_type"`
	Icon       string `json:"icon,omitempty"`
}

type Handler struct {
	Store  *store.MemStore
	Gemini *ai.GeminiClient
	Cache  *cache.Client
}

func New(s *store.MemStore) *Handler { return &Handler{Store: s} }

func NewWithAI(s *store.MemStore, gemini *ai.GeminiClient, c *cache.Client) *Handler {
	return &Handler{Store: s, Gemini: gemini, Cache: c}
}

type chatRequest struct {
	Message string           `json:"message"`
	History []ai.ChatMessage `json:"history"`
}

type chatResponse struct {
	Reply        string         `json:"reply"`
	QuickButtons []ActionButton `json:"quick_buttons,omitempty"`
	ToolUsed     string         `json:"tool_used,omitempty"`
	Data         any            `json:"data,omitempty"`
	Language     string         `json:"language,omitempty"`
}

// The conversational system prompt that makes Gemini behave like a mature AI assistant.
const systemPrompt = `You are EduBot, a professional AI-powered school management assistant for a School ERP system.

Your responsibilities:
* answer user questions clearly
* guide users step-by-step
* explain features professionally
* analyze school data
* provide structured responses
* generate quick action buttons
* provide direct page links/navigation

━━━━━━━━━━━━━━━━━━
RESPONSE STYLE RULES
━━━━━━━━━━━━━━━━━━

IMPORTANT:
Responses must ALWAYS be:
* structured
* professional
* easy to read
* visually clean
* step-by-step

DO NOT:
* write messy paragraphs
* dump raw text
* write long unstructured responses
* use emojis (unless specified in formatting)
* sound robotic
* show raw database output directly

ALWAYS:
* use headings
* use numbered steps
* use bullet points
* separate sections clearly
* provide summaries first
* provide actionable guidance

━━━━━━━━━━━━━━━━━━
ACTION BUTTON RULES
━━━━━━━━━━━━━━━━━━

VERY IMPORTANT:
Whenever explaining a feature, ALWAYS provide:
1. Action buttons
2. Navigation links
3. Related quick actions

Each button must include:
* label
* route
* action_type (navigate, create, edit, delete)
* icon (Material Symbol name)

Example format for buttons (at the end of response):
Quick Buttons:
[
  {"label": "Create Class", "route": "/admin/classes/create", "action_type": "create", "icon": "school"},
  {"label": "Open Classes", "route": "/admin/classes", "action_type": "navigate", "icon": "list"}
]

━━━━━━━━━━━━━━━━━━
GUIDE SYSTEM RULES
━━━━━━━━━━━━━━━━━━

When the user asks how to do something (create class, add student, etc.), provide:
1. Navigation path
2. Step-by-step guide
3. Required fields
4. Common problems & Solutions
5. Quick Buttons

━━━━━━━━━━━━━━━━━━
IMPORTANT AI RULES
━━━━━━━━━━━━━━━━━━

1. Always answer in the user's language: English, Urdu, Roman Urdu, or Mixed.
2. Keep responses concise, privacy-first, and professionally formatted.
3. Never expose raw lists, internal IDs, contact details, fee history, or debug output unless explicitly authorized.
4. Summarize first, reveal details only on request, and keep visible items to a very small number.
5. If information is outside the user's role, say so clearly and offer a safe next step.

SCHOOL DATA CONTEXT:
`

// Message implements POST /api/chatbot/message.
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
	if h.shouldAuditPrompt(ctx, msg) {
		audit.Write(h.Store, ctx, audit.Input{Action: "query", EntityType: "chatbot", EntityID: "message", Metadata: map[string]any{"message_length": len(msg), "role": ctx.Role}})
	}
	if msg == "" {
		api.WriteJSON(w, http.StatusOK, api.Ok(chatResponse{
			Reply: "Hello. I am EduBot, your school assistant. Ask for a summary of students, attendance, classes, exams, fees, or timetable, and I will keep the response concise.",
			QuickButtons: []ActionButton{
				{Label: "School Overview", Route: "/admin/dashboard", ActionType: "navigate", Icon: "dashboard"},
				{Label: "Students", Route: "/admin/students", ActionType: "navigate", Icon: "school"},
				{Label: "Attendance", Route: "/admin/attendance", ActionType: "navigate", Icon: "fact_check"},
			},
		}))
		return
	}

	// ─── AI REASONING MODE (Gemini available) ────────────────────────────
	if h.Gemini != nil && h.Gemini.Available() {
		resp := h.aiReasoning(r, ctx, msg, body.History)
		resp = h.finalizeResponse(ctx, msg, resp)
		api.WriteJSON(w, http.StatusOK, api.Ok(resp))
		return
	}

	// ─── FALLBACK MODE (no Gemini) ───────────────────────────────────────
	resp := h.keywordFallback(ctx, strings.ToLower(msg))
	resp = h.finalizeResponse(ctx, msg, resp)
	api.WriteJSON(w, http.StatusOK, api.Ok(resp))
}

// aiReasoning uses Gemini as a reasoning engine with full school data context.
func (h *Handler) aiReasoning(r *http.Request, ctx *api.RequestContext, msg string, history []ai.ChatMessage) chatResponse {
	// Step 0: Load conversation memory and resolve pronouns
	mem := LoadMemory(r.Context(), h.Cache, ctx.UserID)
	_, resolvedEntities := ResolvePronouns(strings.ToLower(msg), mem)
	_ = resolvedEntities // Used by Gemini via context

	// Step 1: Determine which data categories are relevant
	categories := detectRelevantCategories(msg)

	// Step 2: Build school data context (compressed)
	schoolCtx := BuildContext(h.Store, ctx, categories)
	dataContext := CompressContext(schoolCtx.FormatForGemini())

	// Step 2.5: Add analytics summary to context
	analytics := ComputeAnalytics(h.Store, ctx)
	if len(analytics.Alerts) > 0 {
		dataContext += "\n--- PROACTIVE ALERTS ---\n" + FormatAnalyticsSummary(analytics)
	}

	// Step 2.6: Add memory context
	if mem.LastStudent != "" || mem.LastClass != "" {
		dataContext += fmt.Sprintf("\n--- CONVERSATION CONTEXT ---\nLast discussed: student=%s, class=%s, topic=%s\n",
			mem.LastStudent, mem.LastClass, mem.LastTopic)
	}

	// Step 3: Build full prompt with data
	fullPrompt := systemPrompt + dataContext

	// Step 4: Send to Gemini for reasoning
	reply, err := h.Gemini.GenerateResponse(r.Context(), fullPrompt, history, msg)
	if err != nil {
		// Gemini failed — fall back to keyword matching
		return h.keywordFallback(ctx, strings.ToLower(msg))
	}

	// Step 5: Extract action buttons from response
	buttons := extractButtons(reply)
	cleanReply := cleanButtonMarkers(reply)

	// Step 6: Update memory
	for _, cat := range categories {
		mem.LastTopic = cat
	}
	SaveMemory(r.Context(), h.Cache, ctx.UserID, mem)

	return chatResponse{
		Reply:        cleanReply,
		QuickButtons: buttons,
		ToolUsed:     "ai_reasoning",
		Language:     "auto",
	}
}

func (h *Handler) finalizeResponse(ctx *api.RequestContext, userMessage string, resp chatResponse) chatResponse {
	sanitized, event := sanitizeChatResponse(ctx, resp)
	if len(event.Reasons) > 0 {
		audit.Write(h.Store, ctx, audit.Input{Action: "response_filter", EntityType: "chatbot", EntityID: "message", Metadata: map[string]any{
			"message_length": len(userMessage),
			"reasons":        event.Reasons,
			"truncated":      event.Truncated,
			"redacted":       event.Redacted,
			"blocked":        event.Blocked,
		}})
	}
	if suspicious := detectSuspiciousPrompt(userMessage); len(suspicious) > 0 {
		audit.Write(h.Store, ctx, audit.Input{Action: "suspicious_prompt", EntityType: "chatbot", EntityID: "message", Metadata: map[string]any{"signals": suspicious}})
	}
	return sanitized
}

func (h *Handler) shouldAuditPrompt(ctx *api.RequestContext, msg string) bool {
	return len(detectSuspiciousPrompt(msg)) > 0 || ctx.Role == "student" || ctx.Role == "teacher" || ctx.Role == "parent"
}

func detectSuspiciousPrompt(msg string) []string {
	lower := strings.ToLower(msg)
	signals := []string{}
	checks := map[string][]string{
		"prompt_injection": {"ignore previous", "ignore all", "system prompt", "developer message", "jailbreak"},
		"bulk_export":      {"export all", "download all", "show all students", "list all fees", "dump"},
		"secret_disclosure": {"reveal", "hidden", "internal id", "raw data", "database"},
	}
	for label, terms := range checks {
		for _, term := range terms {
			if strings.Contains(lower, term) {
				signals = append(signals, label)
				break
			}
		}
	}
	return signals
}

// detectRelevantCategories determines which data to fetch based on the message.
func detectRelevantCategories(msg string) []string {
	msgLower := strings.ToLower(msg)
	categories := []string{}

	if containsAny(msgLower, "student", "students", "bachche", "bachch", "kitne", "names", "naam", "list") {
		categories = append(categories, "student")
	}
	if containsAny(msgLower, "attendance", "hazri", "present", "absent", "haazri") {
		categories = append(categories, "attendance")
	}
	if containsAny(msgLower, "fee", "fees", "paisa", "payment", "collection", "pending", "overdue") {
		categories = append(categories, "fee")
	}
	if containsAny(msgLower, "teacher", "teachers", "ustad", "sir", "madam", "faculty") {
		categories = append(categories, "teacher")
	}
	if containsAny(msgLower, "class", "classes", "section", "jamaat") {
		categories = append(categories, "class")
	}
	if containsAny(msgLower, "exam", "exams", "test", "imtihan") {
		categories = append(categories, "exam")
	}
	if containsAny(msgLower, "result", "results", "marks", "grade", "percentage", "nateeja") {
		categories = append(categories, "result")
	}
	if containsAny(msgLower, "timetable", "schedule", "period", "waqt") {
		categories = append(categories, "timetable")
	}
	if containsAny(msgLower, "event", "events", "program", "taqreeb") {
		categories = append(categories, "event")
	}
	if containsAny(msgLower, "problem", "issue", "error", "nahi", "fail", "kaam nahi", "masla", "diagnos") {
		categories = append(categories, "diagnostic")
	}

	// If nothing specific detected, provide overview
	if len(categories) == 0 {
		categories = []string{"student", "attendance", "class"}
	}

	return categories
}

// extractButtons parses both new JSON format and old [Button:...] markers.
func extractButtons(text string) []ActionButton {
	buttons := []ActionButton{}

	// 1. Try to find "Quick Buttons:" followed by JSON array
	if idx := strings.Index(text, "Quick Buttons:"); idx != -1 {
		jsonPart := text[idx+len("Quick Buttons:"):]
		start := strings.Index(jsonPart, "[")
		end := strings.LastIndex(jsonPart, "]")
		if start != -1 && end != -1 && end > start {
			arrayStr := jsonPart[start : end+1]
			if err := json.Unmarshal([]byte(arrayStr), &buttons); err == nil && len(buttons) > 0 {
				if len(buttons) > 4 {
					buttons = buttons[:4]
				}
				return buttons
			}
		}
	}

	// 2. Fallback to legacy line-by-line markers [Button: Label | /route]
	lines := strings.Split(text, "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if strings.HasPrefix(line, "[Button:") && strings.Contains(line, "|") {
			inner := strings.TrimPrefix(line, "[Button:")
			inner = strings.TrimSuffix(inner, "]")
			parts := strings.SplitN(inner, "|", 2)
			if len(parts) == 2 {
				label := strings.TrimSpace(parts[0])
				route := strings.TrimSpace(parts[1])
				if label != "" && route != "" {
					actionType := "navigate"
					if strings.Contains(route, "create") {
						actionType = "create"
					}
					buttons = append(buttons, ActionButton{Label: label, Route: route, ActionType: actionType, Icon: "arrow_forward"})
				}
			}
		}
	}

	if len(buttons) > 4 {
		buttons = buttons[:4]
	}
	return buttons
}

// cleanButtonMarkers removes [Button:...] lines and "Quick Buttons:" blocks from the text.
func cleanButtonMarkers(text string) string {
	// 1. Remove "Quick Buttons:" and everything after it (usually at end of message)
	if idx := strings.Index(text, "Quick Buttons:"); idx != -1 {
		text = text[:idx]
	}

	// 2. Remove any remaining legacy [Button:...] lines
	lines := strings.Split(text, "\n")
	clean := make([]string, 0, len(lines))
	for _, line := range lines {
		if !strings.HasPrefix(strings.TrimSpace(line), "[Button:") {
			clean = append(clean, line)
		}
	}
	return strings.TrimSpace(strings.Join(clean, "\n"))
}

// ─── KEYWORD FALLBACK (when Gemini is unavailable) ───────────────────────

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
	case containsAny(msg, "hello", "hi", "salam", "assalam"):
		return chatResponse{Reply: "Hello. I am EduBot. You can ask for students, attendance, exams, timetable, or a school summary."}
	case containsAny(msg, "help", "support", "madad"):
		return chatResponse{Reply: "Support is available through the help desk in your ERP account."}
	default:
		return h.toolGetSchoolStats(ctx)
	}
}

// ─── Tool Implementations (used by keyword fallback) ─────────────────────

func (h *Handler) toolGetStudentCount(ctx *api.RequestContext) chatResponse {
	h.Store.RLock()
	defer h.Store.RUnlock()
	scope := resolveChatScope(h.Store, ctx)
	total, active := 0, 0
	byClass := map[string]int{}
	for _, s := range h.Store.Students {
		if (!scope.AllowGlobal && s.SchoolID != scope.SchoolID) || (scope.Role != "admin" && scope.Role != "super_admin" && !scope.studentAllowed(s.ID) && !scope.classAllowed(s.ClassID)) {
			continue
		}
		total++
		if s.Status == "active" {
			active++
		}
		for _, c := range h.Store.Classes {
			if c.ID == s.ClassID {
				byClass[c.Name]++
				break
			}
		}
	}
	return chatResponse{
		Reply:    FormatStudentResponse(total, active, byClass),
		ToolUsed: "student_count",
		Data:     map[string]any{"total": total, "active": active, "by_class": byClass},
	}
}

func (h *Handler) toolGetAttendanceSummary(ctx *api.RequestContext) chatResponse {
	h.Store.RLock()
	defer h.Store.RUnlock()
	scope := resolveChatScope(h.Store, ctx)
	today := time.Now().Format("2006-01-02")
	present, absent, late, total := 0, 0, 0, 0
	for _, a := range h.Store.Attendance {
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
	return chatResponse{
		Reply:    FormatAttendanceResponse(today, present, absent, late, total, pct),
		ToolUsed: "attendance",
	}
}

func (h *Handler) toolGetFeeSummary(ctx *api.RequestContext) chatResponse {
	h.Store.RLock()
	defer h.Store.RUnlock()
	scope := resolveChatScope(h.Store, ctx)
	if !scope.canSeeFeeSummary() {
		return chatResponse{Reply: "Fee details are restricted for your role. I can provide a school overview or open the fee module for an authorized account.", ToolUsed: "fee_summary"}
	}
	var collected, pending float64
	paid, unpaid, overdue := 0, 0, 0
	for _, f := range h.Store.Fees {
		if (!scope.AllowGlobal && f.SchoolID != scope.SchoolID) || (!scope.AllowGlobal && !scope.studentAllowed(f.StudentID) && !scope.classAllowed(f.ClassID)) {
			continue
		}
		eff := f.Amount + f.AdjustmentAmount
		collected += f.PaidAmount
		if rem := eff - f.PaidAmount; rem > 0 {
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
	return chatResponse{
		Reply:    FormatFeeResponse(collected, pending, paid, unpaid, overdue),
		ToolUsed: "fee_summary",
	}
}

func (h *Handler) toolGetTeacherList(ctx *api.RequestContext) chatResponse {
	h.Store.RLock()
	defer h.Store.RUnlock()
	scope := resolveChatScope(h.Store, ctx)
	teachers := []map[string]string{}
	for _, t := range h.Store.Teachers {
		if (!scope.AllowGlobal && t.SchoolID != scope.SchoolID) || (scope.Role != "admin" && scope.Role != "super_admin" && !scope.classAllowedAny(t.ClassIDs)) {
			continue
		}
		subjects := "N/A"
		if len(t.Subjects) > 0 {
			subjects = strings.Join(t.Subjects, ", ")
		}
		teachers = append(teachers, map[string]string{"name": t.FirstName + " " + t.LastName, "subjects": subjects})
		if len(teachers) >= 5 {
			break
		}
	}
	return chatResponse{
		Reply:    FormatTeacherResponse(teachers),
		ToolUsed: "teacher_list",
	}
}

func (h *Handler) toolGetUpcomingExams(ctx *api.RequestContext) chatResponse {
	h.Store.RLock()
	defer h.Store.RUnlock()
	scope := resolveChatScope(h.Store, ctx)
	now := time.Now()
	exams := []map[string]string{}
	for _, e := range h.Store.Exams {
		if (!scope.AllowGlobal && e.SchoolID != scope.SchoolID) || !e.StartsAt.After(now) || (scope.Role != "admin" && scope.Role != "super_admin" && !scope.classAllowed(e.ClassID)) {
			continue
		}
		className := e.ClassID
		for _, c := range h.Store.Classes {
			if c.ID == e.ClassID {
				className = c.Name
				break
			}
		}
		exams = append(exams, map[string]string{"title": e.Title, "subject": e.Subject, "date": e.StartsAt.Format("02 Jan 2006"), "class": className})
	}
	return chatResponse{
		Reply:    FormatExamResponse(exams),
		ToolUsed: "exams",
	}
}

func (h *Handler) toolGetTimetableSummary(ctx *api.RequestContext) chatResponse {
	h.Store.RLock()
	defer h.Store.RUnlock()
	scope := resolveChatScope(h.Store, ctx)
	total := 0
	for _, t := range h.Store.Timetables {
		if (scope.AllowGlobal || t.SchoolID == scope.SchoolID) && (scope.Role == "admin" || scope.Role == "super_admin" || scope.classAllowed(t.ClassID)) {
			total += len(t.Sessions)
		}
	}
	reply := fmt.Sprintf("Timetable: %d periods configured across allowed classes.", total)
	if total == 0 {
		reply = "Timetable is not configured yet. You can set up a schedule from the timetable module."
	}
	reply += "\n\n" + FollowUp("timetable")
	return chatResponse{Reply: reply, ToolUsed: "timetable"}
}

func (h *Handler) toolGetRecentResults(ctx *api.RequestContext) chatResponse {
	h.Store.RLock()
	defer h.Store.RUnlock()
	scope := resolveChatScope(h.Store, ctx)
	count := 0
	var totalObt, totalMax float64
	for _, r := range h.Store.Results {
		if (!scope.AllowGlobal && r.SchoolID != scope.SchoolID) || (scope.Role != "admin" && scope.Role != "super_admin" && !scope.studentAllowed(r.StudentID) && !scope.classAllowed(r.ClassID)) {
			continue
		}
		count++
		totalObt += r.ObtainedMarks
		for _, e := range h.Store.Exams {
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
	if count == 0 {
		return chatResponse{Reply: "No results are available in your permitted scope yet. You can enter results after exams are completed.", ToolUsed: "results"}
	}
	reply := fmt.Sprintf("Results Summary\n\nTotal entries: %d\nSchool Average: %.0f%%\n\n%s", count, avg, GenerateResultInsight(avg, count))
	reply += "\n\n" + FollowUp("result")
	return chatResponse{Reply: reply, ToolUsed: "results"}
}

func (h *Handler) toolGetClassInfo(ctx *api.RequestContext) chatResponse {
	h.Store.RLock()
	defer h.Store.RUnlock()
	scope := resolveChatScope(h.Store, ctx)
	classes := []map[string]any{}
	for _, c := range h.Store.Classes {
		if (!scope.AllowGlobal && c.SchoolID != scope.SchoolID) || (!scope.classAllowed(c.ID) && scope.Role != "admin" && scope.Role != "super_admin") {
			continue
		}
		count := 0
		for _, s := range h.Store.Students {
			if s.ClassID == c.ID && (scope.AllowGlobal || s.SchoolID == scope.SchoolID) {
				count++
			}
		}
		classes = append(classes, map[string]any{"name": c.Name, "student_count": count, "status": c.Status})
		if len(classes) >= 5 {
			break
		}
	}
	return chatResponse{
		Reply:    FormatClassResponse(classes),
		ToolUsed: "class_info",
	}
}

func (h *Handler) toolGetSchoolStats(ctx *api.RequestContext) chatResponse {
	h.Store.RLock()
	defer h.Store.RUnlock()
	scope := resolveChatScope(h.Store, ctx)
	students, teachers, classes, presentToday := 0, 0, 0, 0
	today := time.Now().Format("2006-01-02")
	for _, s := range h.Store.Students {
		if (scope.AllowGlobal || s.SchoolID == scope.SchoolID) && (scope.Role == "admin" || scope.Role == "super_admin" || scope.studentAllowed(s.ID) || scope.classAllowed(s.ClassID)) {
			students++
		}
	}
	for _, t := range h.Store.Teachers {
		if (scope.AllowGlobal || t.SchoolID == scope.SchoolID) && (scope.Role == "admin" || scope.Role == "super_admin" || scope.classAllowedAny(t.ClassIDs)) {
			teachers++
		}
	}
	for _, c := range h.Store.Classes {
		if (scope.AllowGlobal || c.SchoolID == scope.SchoolID) && (scope.Role == "admin" || scope.Role == "super_admin" || scope.classAllowed(c.ID)) {
			classes++
		}
	}
	for _, a := range h.Store.Attendance {
		if (scope.AllowGlobal || a.SchoolID == scope.SchoolID) && a.Date.Format("2006-01-02") == today && strings.ToLower(a.Status) == "present" && (scope.Role == "admin" || scope.Role == "super_admin" || scope.studentAllowed(a.StudentID) || scope.classAllowed(a.ClassID)) {
			presentToday++
		}
	}
	return chatResponse{
		Reply:    FormatSchoolStatsResponse(students, teachers, classes, presentToday),
		ToolUsed: "school_stats",
	}
}

func containsAny(msg string, keywords ...string) bool {
	for _, kw := range keywords {
		if strings.Contains(msg, kw) {
			return true
		}
	}
	return false
}
