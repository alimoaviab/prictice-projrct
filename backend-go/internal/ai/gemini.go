// Package ai provides the Google Gemini API client for the AI School Assistant.
//
// Architecture: Gemini acts as the REASONING ENGINE, not just an intent classifier.
// It receives the user message + school data context + conversation history,
// then generates a natural, conversational response with insights and follow-ups.
//
// Flow: User Message → Build Context (fetch relevant data) → Gemini Reasoning → Response
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

// GeminiClient wraps the Google Gemini API.
type GeminiClient struct {
	apiKey     string
	model      string
	httpClient *http.Client
	timeout    time.Duration
}

// ChatMessage represents a single message in conversation history.
type ChatMessage struct {
	Role    string `json:"role"` // "user" or "model"
	Content string `json:"content"`
}

// IntentResult is the structured output from intent detection.
type IntentResult struct {
	Intent     string            `json:"intent"`
	Category   string            `json:"category"`
	Entities   map[string]string `json:"entities"`
	Confidence float64           `json:"confidence"`
	Language   string            `json:"language"`
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
		timeout = 8000 * time.Millisecond
	}
	return &GeminiClient{
		apiKey:  apiKey,
		model:   model,
		timeout: timeout,
		httpClient: &http.Client{
			Timeout: timeout + 2000*time.Millisecond,
		},
	}
}

// Available returns true if the Gemini client is configured.
func (g *GeminiClient) Available() bool {
	return g != nil && g.apiKey != ""
}

// GenerateResponse sends the full conversation to Gemini and gets a natural response.
// This is the CORE method — Gemini acts as the reasoning engine.
func (g *GeminiClient) GenerateResponse(ctx context.Context, systemPrompt string, history []ChatMessage, userMessage string) (string, error) {
	if !g.Available() {
		return "", fmt.Errorf("gemini not configured")
	}

	// Build contents array with history + current message
	contents := make([]map[string]any, 0, len(history)+2)

	// System instruction as first user message (Gemini doesn't have system role in v1beta)
	contents = append(contents, map[string]any{
		"role":  "user",
		"parts": []map[string]string{{"text": systemPrompt}},
	})
	contents = append(contents, map[string]any{
		"role":  "model",
		"parts": []map[string]string{{"text": "Understood. I am Plexa, the AI school assistant. I will respond naturally, provide insights, and ask follow-up questions. Ready to help."}},
	})

	// Add conversation history (last 10 messages)
	historyLimit := 10
	startIdx := 0
	if len(history) > historyLimit {
		startIdx = len(history) - historyLimit
	}
	for _, msg := range history[startIdx:] {
		role := "user"
		if msg.Role == "assistant" || msg.Role == "model" {
			role = "model"
		}
		contents = append(contents, map[string]any{
			"role":  role,
			"parts": []map[string]string{{"text": msg.Content}},
		})
	}

	// Current user message
	contents = append(contents, map[string]any{
		"role":  "user",
		"parts": []map[string]string{{"text": userMessage}},
	})

	reqBody := map[string]any{
		"contents": contents,
		"generationConfig": map[string]any{
			"temperature":     0.3,
			"maxOutputTokens": 600,
			"topP":            0.9,
		},
	}

	body, err := json.Marshal(reqBody)
	if err != nil {
		return "", fmt.Errorf("marshal: %w", err)
	}

	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s", g.model, g.apiKey)

	reqCtx, cancel := context.WithTimeout(ctx, g.timeout)
	defer cancel()

	req, err := http.NewRequestWithContext(reqCtx, "POST", url, bytes.NewReader(body))
	if err != nil {
		return "", fmt.Errorf("create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := g.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("gemini request: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("read response: %w", err)
	}

	if resp.StatusCode != 200 {
		log.Printf("[gemini] API error %d: %s", resp.StatusCode, string(respBody[:min(len(respBody), 300)]))
		return "", fmt.Errorf("gemini API error: status %d", resp.StatusCode)
	}

	// Parse response
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
		return "", fmt.Errorf("parse response: %w", err)
	}

	if len(geminiResp.Candidates) == 0 || len(geminiResp.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("empty response")
	}

	return geminiResp.Candidates[0].Content.Parts[0].Text, nil
}

// DetectIntent classifies a user message (used for routing when full reasoning isn't needed).
func (g *GeminiClient) DetectIntent(ctx context.Context, message string, history []ChatMessage) (*IntentResult, error) {
	if !g.Available() {
		return nil, fmt.Errorf("gemini not configured")
	}

	prompt := intentDetectionPrompt() + "\n\nUser message: " + message

	reqBody := map[string]any{
		"contents": []map[string]any{
			{"parts": []map[string]string{{"text": prompt}}},
		},
		"generationConfig": map[string]any{
			"temperature":      0.1,
			"maxOutputTokens":  300,
			"responseMimeType": "application/json",
		},
	}

	body, _ := json.Marshal(reqBody)
	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s", g.model, g.apiKey)

	reqCtx, cancel := context.WithTimeout(ctx, 3*time.Second)
	defer cancel()

	req, _ := http.NewRequestWithContext(reqCtx, "POST", url, bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")

	resp, err := g.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		respBody, _ := io.ReadAll(resp.Body)
		log.Printf("[gemini] intent error %d: %s", resp.StatusCode, string(respBody[:min(len(respBody), 200)]))
		return nil, fmt.Errorf("status %d", resp.StatusCode)
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

	if len(geminiResp.Candidates) == 0 || len(geminiResp.Candidates[0].Content.Parts) == 0 {
		return nil, fmt.Errorf("empty")
	}

	text := geminiResp.Candidates[0].Content.Parts[0].Text
	var result IntentResult
	if err := json.Unmarshal([]byte(text), &result); err != nil {
		// Try extracting JSON from text
		if start := indexOf(text, "{"); start >= 0 {
			if end := lastIndexOf(text, "}"); end > start {
				json.Unmarshal([]byte(text[start:end+1]), &result)
			}
		}
		if result.Intent == "" {
			return nil, fmt.Errorf("parse failed")
		}
	}
	if result.Entities == nil {
		result.Entities = map[string]string{}
	}
	return &result, nil
}

func intentDetectionPrompt() string {
	return `You are an intent classifier for a School ERP assistant. Classify into exactly one intent.

Intents: guide_create_student, guide_create_class, guide_create_exam, guide_mark_attendance, guide_create_teacher, guide_enter_results, diagnostic, academic_year_status, class_list, class_search, class_attendance, teacher_search, teacher_current_period, teacher_list, student_search, student_results, student_attendance, student_count, student_top, student_weak, event_upcoming, exam_upcoming, exam_performance, result_class_performance, result_top, result_weak, fee_summary, fee_student_status, fee_defaulters, subscription_status, support_contact, greeting, school_stats, unknown

User may write in English, Urdu, Roman Urdu, or mixed. Handle spelling mistakes.
Extract entities: student_name, class_name, teacher_name, exam_name, subject_name.

Respond ONLY with JSON: {"intent":"...","category":"...","entities":{},"confidence":0.0-1.0,"language":"en|ur|roman_ur|mixed"}`
}

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
