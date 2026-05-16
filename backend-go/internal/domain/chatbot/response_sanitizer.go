package chatbot

import (
	"fmt"
	"regexp"
	"strconv"
	"strings"
	"unicode/utf8"

	"github.com/eduplexo/backend-go/internal/api"
)

const (
	maxReplyChars       = 1200
	maxReplyLines       = 10
	maxVisibleListItems = 5
	maxVisibleButtons   = 4
	maxButtonLabelChars = 48
)

type securityEvent struct {
	Reasons       []string
	Truncated     bool
	Redacted      bool
	Blocked       bool
	DroppedButtons bool
	DroppedData   bool
}

var (
	emailPattern   = regexp.MustCompile(`(?i)\b[\w.+-]+@[\w-]+(?:\.[\w-]+)+\b`)
	phonePattern   = regexp.MustCompile(`(?i)(?:\+?\d[\d\s().-]{7,}\d)`)
	idPattern      = regexp.MustCompile(`(?i)\b(?:school_id|user_id|student_id|teacher_id|class_id|exam_id|fee_id|parent_user_id)\b\s*[:=]\s*[^\s,;|]+`)
	contactPattern = regexp.MustCompile(`(?i)\b(?:email|phone|mobile|address|guardian|parent)\b`)
	blankPattern   = regexp.MustCompile(`\n{3,}`)
)

func sanitizeChatResponse(ctx *api.RequestContext, resp chatResponse) (chatResponse, securityEvent) {
	event := securityEvent{}
	role := strings.ToLower(strings.TrimSpace(ctx.Role))

	resp.Reply = sanitizeReplyText(resp.Reply, role, &event)
	resp.QuickButtons = sanitizeButtons(resp.QuickButtons, &event)
	if resp.Data != nil {
		resp.Data = nil
		event.DroppedData = true
		event.Reasons = append(event.Reasons, "raw_data_removed")
	}

	resp.Reply = strings.TrimSpace(resp.Reply)
	if resp.Reply == "" {
		resp.Reply = "I can provide a concise summary or open the relevant school module if you want more detail."
		event.Blocked = true
		event.Reasons = append(event.Reasons, "empty_after_sanitization")
	}

	return resp, event
}

func sanitizeReplyText(reply, role string, event *securityEvent) string {
	reply = strings.TrimSpace(reply)
	if reply == "" {
		return reply
	}

	if isHighRiskLeak(reply, role) {
		event.Blocked = true
		event.Reasons = append(event.Reasons, "high_risk_sensitive_leak")
		return restrictedReply(role)
	}

	original := reply
	reply = stripEmojiLikeRunes(reply)
	reply = emailPattern.ReplaceAllString(reply, "[redacted email]")
	reply = phonePattern.ReplaceAllString(reply, "[redacted phone]")
	reply = idPattern.ReplaceAllString(reply, "[redacted id]")
	reply = redactSensitiveLines(reply)
	reply = blankPattern.ReplaceAllString(reply, "\n\n")
	reply = collapseVerboseReply(reply, event)

	if utf8.RuneCountInString(reply) > maxReplyChars {
		reply = trimByRunes(reply, maxReplyChars)
		reply = strings.TrimSpace(reply) + "\n\nAdditional details were omitted for privacy."
		event.Truncated = true
		event.Reasons = append(event.Reasons, "char_limit")
	}

	if reply != original {
		event.Redacted = true
		if !containsReason(event.Reasons, "redacted") {
			event.Reasons = append(event.Reasons, "redacted")
		}
	}

	return strings.TrimSpace(reply)
}

func sanitizeButtons(buttons []ActionButton, event *securityEvent) []ActionButton {
	if len(buttons) == 0 {
		return nil
	}

	clean := make([]ActionButton, 0, min(len(buttons), maxVisibleButtons))
	for _, btn := range buttons {
		btn.Label = strings.TrimSpace(btn.Label)
		btn.Route = strings.TrimSpace(btn.Route)
		btn.ActionType = strings.TrimSpace(btn.ActionType)
		btn.Icon = strings.TrimSpace(btn.Icon)

		if btn.Label == "" || btn.Route == "" {
			event.DroppedButtons = true
			event.Reasons = append(event.Reasons, "invalid_button")
			continue
		}
		if !strings.HasPrefix(btn.Route, "/") || len(btn.Route) > 120 {
			event.DroppedButtons = true
			event.Reasons = append(event.Reasons, "unsafe_button_route")
			continue
		}
		btn.Label = trimLabel(btn.Label, maxButtonLabelChars)
		if btn.ActionType == "" {
			btn.ActionType = "navigate"
		}
		clean = append(clean, btn)
		if len(clean) >= maxVisibleButtons {
			break
		}
	}

	if len(clean) != len(buttons) {
		event.DroppedButtons = true
		event.Reasons = append(event.Reasons, "button_limit")
	}

	return clean
}

func collapseVerboseReply(reply string, event *securityEvent) string {
	lines := strings.Split(reply, "\n")

	output := make([]string, 0, maxReplyLines+1)
	listItems := 0
	dropped := 0

	for _, line := range lines {
		trimmed := strings.TrimSpace(line)
		if trimmed == "" {
			if len(output) == 0 || output[len(output)-1] == "" {
				continue
			}
			output = append(output, "")
			continue
		}

		if isListLine(trimmed) {
			listItems++
			if listItems > maxVisibleListItems {
				dropped++
				continue
			}
		}

		if len(output) >= maxReplyLines {
			dropped++
			continue
		}

		output = append(output, trimmed)
	}

	if dropped > 0 {
		event.Truncated = true
		event.Reasons = append(event.Reasons, "line_limit")
		output = append(output, fmt.Sprintf("and %d more.", dropped))
	}

	return strings.TrimSpace(strings.Join(output, "\n"))
}

func redactSensitiveLines(reply string) string {
	lines := strings.Split(reply, "\n")
	filtered := make([]string, 0, len(lines))

	for _, line := range lines {
		trimmed := strings.TrimSpace(line)
		if trimmed == "" {
			filtered = append(filtered, line)
			continue
		}
		if contactPattern.MatchString(trimmed) && (emailPattern.MatchString(trimmed) || phonePattern.MatchString(trimmed) || strings.Contains(strings.ToLower(trimmed), "address")) {
			continue
		}
		filtered = append(filtered, line)
	}

	return strings.Join(filtered, "\n")
}

func isHighRiskLeak(reply, role string) bool {
	if role == "admin" || role == "super_admin" {
		return false
	}

	lower := strings.ToLower(reply)
	if strings.Contains(lower, "raw database") || strings.Contains(lower, "mongodb") || strings.Contains(lower, "postgres") {
		return true
	}
	if strings.Contains(lower, "school_id") || strings.Contains(lower, "student_id") || strings.Contains(lower, "teacher_id") || strings.Contains(lower, "parent_user_id") {
		return true
	}
	if strings.Contains(lower, "guardian") || strings.Contains(lower, "parent") || strings.Contains(lower, "fee") || strings.Contains(lower, "invoice") || strings.Contains(lower, "receipt") {
		return true
	}
	if strings.Count(reply, "\n") > 20 && strings.Count(reply, ":") > 12 {
		return true
	}
	return false
}

func restrictedReply(role string) string {
	switch role {
	case "teacher":
		return "That information is restricted for your role. I can provide a school-level summary or open the relevant module if you want to continue."
	case "student", "parent":
		return "That information is restricted for your role. I can show your permitted summary or help you navigate to the right page."
	default:
		return "That information is restricted. I can provide a concise summary or direct you to the relevant module."
	}
}

func stripEmojiLikeRunes(s string) string {
	var b strings.Builder
	b.Grow(len(s))
	for _, r := range s {
		if isEmojiLikeRune(r) {
			continue
		}
		b.WriteRune(r)
	}
	return b.String()
}

func isEmojiLikeRune(r rune) bool {
	switch {
	case r >= 0x1F300 && r <= 0x1FAFF:
		return true
	case r >= 0x1F1E6 && r <= 0x1F1FF:
		return true
	case r >= 0x2600 && r <= 0x27BF:
		return true
	case r == 0xFE0F || r == 0x200D:
		return true
	default:
		return false
	}
}

func isListLine(line string) bool {
	if line == "" {
		return false
	}
	if strings.HasPrefix(line, "-") || strings.HasPrefix(line, "*") || strings.HasPrefix(line, "•") || strings.HasPrefix(line, "→") {
		return true
	}
	if idx := strings.Index(line, "."); idx > 0 {
		if _, err := strconv.Atoi(strings.TrimSpace(line[:idx])); err == nil {
			return true
		}
	}
	return false
}

func trimByRunes(s string, max int) string {
	if utf8.RuneCountInString(s) <= max {
		return s
	}
	var b strings.Builder
	b.Grow(max)
	count := 0
	for _, r := range s {
		if count >= max {
			break
		}
		b.WriteRune(r)
		count++
	}
	return strings.TrimSpace(b.String())
}

func trimLabel(label string, max int) string {
	if utf8.RuneCountInString(label) <= max {
		return label
	}
	return trimByRunes(label, max)
}

func containsReason(reasons []string, want string) bool {
	for _, r := range reasons {
		if r == want {
			return true
		}
	}
	return false
}
