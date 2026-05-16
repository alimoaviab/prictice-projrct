package chatbot

import (
	"strings"
	"testing"

	"github.com/eduplexo/backend-go/internal/api"
)

func TestSanitizeChatResponseRedactsAndTruncates(t *testing.T) {
	ctx := &api.RequestContext{Role: "student"}
	resp := chatResponse{
		Reply: strings.Join([]string{
			"1. Class A",
			"2. Class B",
			"3. Class C",
			"4. Class D",
			"5. Class E",
			"6. Class F",
			"Contact: principal@example.com",
			"Phone: +92 300 1234567",
		}, "\n"),
		QuickButtons: []ActionButton{
			{Label: "Open Dashboard", Route: "/admin/dashboard", ActionType: "navigate"},
			{Label: "Bad Route", Route: "https://example.com", ActionType: "navigate"},
		},
		Data: map[string]any{"raw": true},
	}

	sanitized, event := sanitizeChatResponse(ctx, resp)

	if !event.Redacted {
		t.Fatalf("expected redaction event")
	}
	if sanitized.Data != nil {
		t.Fatalf("expected data payload to be removed")
	}
	if strings.Contains(sanitized.Reply, "example.com") || strings.Contains(sanitized.Reply, "1234567") || strings.Contains(sanitized.Reply, "student_id") {
		t.Fatalf("expected sensitive data to be redacted: %q", sanitized.Reply)
	}
	if strings.Contains(sanitized.Reply, "Class F") {
		t.Fatalf("expected list truncation to remove extra items: %q", sanitized.Reply)
	}
	if len(sanitized.QuickButtons) != 1 {
		t.Fatalf("expected only one safe button, got %d", len(sanitized.QuickButtons))
	}
	if sanitized.QuickButtons[0].Route != "/admin/dashboard" {
		t.Fatalf("unexpected button route: %s", sanitized.QuickButtons[0].Route)
	}
}
