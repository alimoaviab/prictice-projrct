// Package ai provides the Google Gemini API client for the AI School Assistant.
//
// Responsibilities:
//   - Intent detection from natural language (English, Urdu, Roman Urdu, mixed)
//   - Response generation with school context
//   - Graceful timeout (2500ms) with fallback to keyword matching
//
// The client NEVER sends raw student data or PII to Gemini — only structured
// summaries prepared by the query handlers.
package ai

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"
)

// GeminiClient wraps the Google Gemini API for intent detection and NLU.
type GeminiClient struct {
	apiKey     string
	model      string
	httpClient *http.Client
	timeout    time.Duration
}

// ChatMessage represents a single message in conversation history.
type ChatMessage struct {
	Role    string `json:"role"`    // "user" or "assistant"
	Content string `json:"content"`
}

// IntentResult is the structured output from intent detection.
type IntentResult struct {
	Intent     string            `json:"intent"`     // e.g. "student_search", "fee_summary"
	Category   string            `json:"category"`   // e.g. "student", "fee", "guide"
	Entities   map[string]string `json:"entities"`   // extracted: {"name": "Ali", "class": "5"}
	Confidence float64           `json:"confidence"` // 0.0 - 1.0
	Language   string            `json:"language"`   // "en", "ur", "roman_ur", "mixed"
}

// NewGeminiClient creates a Gemini API client. Returns nil if apiKey is empty.
func NewGeminiClient(apiKey, model string, timeoutMs int) *GeminiClient {
	if apiKey == "" {
		return nil
	}
	if model == "" {
		model = "gemini-2.0-flash"
	}
	timeout := time.Duration(timeoutMs) * time.Millisecond
	if timeout == 0 {
		timeout = 2500 * time.Millisecond
	}
	return &GeminiClient{
		apiKey:  apiKey,
		model:   model,
		timeout: timeout,
		httpClient: &http.Client{
			Timeout: timeout + 500*time.Millisecond, // slightly more than our deadline
		},
	}
}

// Available returns true if the Gemini client is configured.
func (g *GeminiClient) Available() bool {
	return g != nil && g.apiKey != ""
}

// DetectIntent classifies a user message into an intent with entity extraction.
func (g *GeminiClient) DetectIntent(ctx context.Context, message string, history []ChatMessage) (*IntentResult, error) {
	if !g.Available() {
		return nil, fmt.Errorf("gemini not configured")
	}

	systemPrompt := intentDetectionPrompt()

	// Build conversation parts
	parts := []map[string]string{
		{"text": systemPrompt + "\n\nUser message: " + message},
	}

	reqBody := map[string]any{
		"contents": []map[string]any{
			{"parts": parts},
		},
		"generationConfig": map[string]any{
			"temperature":     0.1,
			"maxOutputTokens": 300,
			"responseMimeType": "application/json",
		},
	}

	body, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("marshal request: %w", err)
	}

	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s", g.model, g.apiKey)

	reqCtx, cancel := context.WithTimeout(ctx, g.timeout)
	defer cancel()

	req, err := http.NewRequestWithContext(reqCtx, "POST", url, bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := g.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("gemini request: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read response: %w", err)
	}

	if resp.StatusCode != 200 {
		log.Printf("[gemini] API error %d: %s", resp.StatusCode, string(respBody[:min(len(respBody), 200)]))
		return nil, fmt.Errorf("gemini API error: status %d", resp.StatusCode)
	}

	// Parse Gemini response
	var geminiResp struct {
		Candidates []struct {
			Content struct {
				Parts []struct {
					Text string `json:"text"`
				} `json:"parts"`
			} `json:"content"`
		} `json:"candidates"`
	}
	if err := json.Unmarshal(respBody, &geminiResp); err != nil {
		return nil, fmt.Errorf("parse gemini response: %w", err)
	}

	if len(geminiResp.Candidates) == 0 || len(geminiResp.Candidates[0].Content.Parts) == 0 {
		return nil, fmt.Errorf("empty gemini response")
	}

	text := geminiResp.Candidates[0].Content.Parts[0].Text

	// Parse the JSON intent result
	var result IntentResult
	if err := json.Unmarshal([]byte(text), &result); err != nil {
		// Try to extract JSON from markdown code block
		if start := indexOf(text, "{"); start >= 0 {
			if end := lastIndexOf(text, "}"); end > start {
				if err2 := json.Unmarshal([]byte(text[start:end+1]), &result); err2 != nil {
					return nil, fmt.Errorf("parse intent JSON: %w (raw: %s)", err, text[:min(len(text), 100)])
				}
			}
		}
		if result.Intent == "" {
			return nil, fmt.Errorf("parse intent: %w", err)
		}
	}

	if result.Entities == nil {
		result.Entities = map[string]string{}
	}

	return &result, nil
}

// GenerateAnalysis asks Gemini to provide a natural language analysis of data.
func (g *GeminiClient) GenerateAnalysis(ctx context.Context, dataSummary, userQuestion, language string) (string, error) {
	if !g.Available() {
		return "", nil
	}

	prompt := fmt.Sprintf(`You are a helpful school management assistant. The user asked: "%s"

Here is the data from the school database:
%s

Provide a brief, helpful analysis in 1-2 sentences. If the language is Urdu/Roman Urdu, respond in the same language. Be concise and actionable.`, userQuestion, dataSummary)

	reqBody := map[string]any{
		"contents": []map[string]any{
			{"parts": []map[string]string{{"text": prompt}}},
		},
		"generationConfig": map[string]any{
			"temperature":     0.3,
			"maxOutputTokens": 150,
		},
	}

	body, _ := json.Marshal(reqBody)
	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s", g.model, g.apiKey)

	reqCtx, cancel := context.WithTimeout(ctx, g.timeout)
	defer cancel()

	req, _ := http.NewRequestWithContext(reqCtx, "POST", url, bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")

	resp, err := g.httpClient.Do(req)
	if err != nil {
		return "", nil // Non-fatal
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return "", nil
	}

	respBody, _ := io.ReadAll(resp.Body)
	var geminiResp struct {
		Candidates []struct {
			Content struct {
				Parts []struct {
					Text string `json:"text"`
				} `json:"parts"`
			} `json:"content"`
		} `json:"candidates"`
	}
	json.Unmarshal(respBody, &geminiResp)

	if len(geminiResp.Candidates) > 0 && len(geminiResp.Candidates[0].Content.Parts) > 0 {
		return geminiResp.Candidates[0].Content.Parts[0].Text, nil
	}
	return "", nil
}

// ─── Intent Detection System Prompt ──────────────────────────────────────

func intentDetectionPrompt() string {
	return `You are an intent classifier for a School ERP assistant called EduBot. Classify the user message into exactly one intent.

Available intents:
GUIDE: guide_create_student, guide_create_class, guide_create_exam, guide_create_fee, guide_create_teacher, guide_mark_attendance, guide_enter_results, guide_create_event, guide_create_timetable
DIAGNOSTIC: diagnostic (user reports something failed/broken/not working)
ACADEMIC_YEAR: academic_year_status, academic_year_list
CLASS: class_list, class_search, class_attendance, class_fee_collection
TEACHER: teacher_search, teacher_current_period, teacher_list
STUDENT: student_search, student_results, student_attendance, student_count, student_top, student_weak
EVENT: event_upcoming, event_today, event_search
EXAM: exam_upcoming, exam_performance, exam_schedule
RESULT: result_class_performance, result_top, result_weak, result_trends
FEE: fee_summary, fee_student_status, fee_defaulters
SUBSCRIPTION: subscription_status, subscription_usage
SUPPORT: support_contact, support_ticket
GREETING: greeting
STATS: school_stats (general overview/dashboard)
UNKNOWN: unknown

The user may write in English, Urdu, Roman Urdu, or a mix. Handle spelling mistakes gracefully.
Examples: "kitne student hain" = student_count, "Ali ka result" = student_results, "fee kitni collect hui" = fee_summary, "class 5 ki attendance" = class_attendance, "teacher Ali kahan hai" = teacher_current_period

Extract entities when present: student_name, class_name, teacher_name, exam_name, subject_name.

Respond ONLY with valid JSON (no markdown, no explanation):
{"intent": "...", "category": "...", "entities": {}, "confidence": 0.0-1.0, "language": "en|ur|roman_ur|mixed"}`
}

// ─── Helpers ─────────────────────────────────────────────────────────────

func indexOf(s, substr string) int {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return i
		}
	}
	return -1
}

func lastIndexOf(s, substr string) int {
	for i := len(s) - len(substr); i >= 0; i-- {
		if s[i:i+len(substr)] == substr {
			return i
		}
	}
	return -1
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
