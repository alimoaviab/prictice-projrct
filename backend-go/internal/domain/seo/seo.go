// Package seo implements the /api/seo/generate endpoint.
//
// Architecture:
//   - Receives block_id + prompt from the landing-app frontend
//   - Proxies to Anthropic Claude API with streaming
//   - Streams SSE chunks back to the client
//   - Caches completed responses in Redis (24h TTL)
//   - Rate limits: 5 requests per IP per hour
//
// Security:
//   - API key stored server-side only (ANTHROPIC_API_KEY env var)
//   - No auth required (public landing page tool) but rate-limited
//   - Input validation on block_id
package seo

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/eduplexo/backend-go/internal/cache"
)

// ─── Configuration ───────────────────────────────────────────────────────

const (
	anthropicAPI    = "https://api.anthropic.com/v1/messages"
	defaultModel    = "claude-sonnet-4-20250514"
	premiumModel    = "claude-sonnet-4-20250514"
	maxTokens       = 4096
	cacheTTL        = 24 * time.Hour
	rateLimitWindow = 1 * time.Hour
	rateLimitMax    = 10
	systemPrompt    = "You are a world-class enterprise SEO strategist with 15+ years specializing in SaaS and EdTech. You deliver complete, actionable, Eduplexo-specific SEO strategy. Never generic advice. Every recommendation must be implementable immediately. Format output with clear markdown headers, tables where appropriate, and code blocks for technical items."
)

// validBlocks prevents arbitrary prompt injection via block_id.
var validBlocks = map[string]bool{
	"onpage": true, "keywords": true, "schema": true,
	"content": true, "technical": true, "eeat": true, "roadmap": true,
}

// premiumBlocks use the more capable (expensive) model.
var premiumBlocks = map[string]bool{
	"content": true, "eeat": true, "roadmap": true,
}

// ─── Rate Limiter (in-memory, per-IP) ────────────────────────────────────

type rateBucket struct {
	count   int
	resetAt time.Time
}

var (
	rateMu    sync.Mutex
	rateStore = make(map[string]*rateBucket)
)

func checkRateLimit(ip string) bool {
	rateMu.Lock()
	defer rateMu.Unlock()

	now := time.Now()
	bucket, exists := rateStore[ip]
	if !exists || now.After(bucket.resetAt) {
		rateStore[ip] = &rateBucket{count: 1, resetAt: now.Add(rateLimitWindow)}
		return true
	}
	if bucket.count >= rateLimitMax {
		return false
	}
	bucket.count++
	return true
}

// ─── Handler ─────────────────────────────────────────────────────────────

type Handler struct {
	APIKey string
	Cache  *cache.Client
}

func New(apiKey string, c *cache.Client) *Handler {
	return &Handler{APIKey: apiKey, Cache: c}
}

type generateRequest struct {
	BlockID string `json:"block_id"`
	Prompt  string `json:"prompt"`
}

// Generate handles POST /api/seo/generate with SSE streaming.
func (h *Handler) Generate(w http.ResponseWriter, r *http.Request) {
	// Rate limit by IP
	ip := r.Header.Get("X-Forwarded-For")
	if ip == "" {
		ip = r.RemoteAddr
	}
	ip = strings.Split(ip, ",")[0]

	if !checkRateLimit(ip) {
		http.Error(w, `{"error":"Rate limit exceeded. Try again in an hour."}`, http.StatusTooManyRequests)
		return
	}

	// Parse request
	var body generateRequest
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, `{"error":"Invalid request body"}`, http.StatusBadRequest)
		return
	}

	if !validBlocks[body.BlockID] {
		http.Error(w, `{"error":"Invalid block_id"}`, http.StatusBadRequest)
		return
	}

	if body.Prompt == "" {
		http.Error(w, `{"error":"Prompt is required"}`, http.StatusBadRequest)
		return
	}

	// Check cache
	cacheKey := fmt.Sprintf("seo:block:%s", body.BlockID)
	if h.Cache != nil && h.Cache.Available() {
		if cached, err := h.Cache.Get(r.Context(), cacheKey); err == nil && cached != nil {
			// Serve cached response as a single SSE chunk
			w.Header().Set("Content-Type", "text/event-stream")
			w.Header().Set("Cache-Control", "no-cache")
			w.Header().Set("Connection", "keep-alive")
			w.Header().Set("X-Cache", "HIT")
			fmt.Fprintf(w, "data: %s\n\n", mustJSON(map[string]string{"text": string(cached)}))
			fmt.Fprintf(w, "data: [DONE]\n\n")
			return
		}
	}

	// Select model based on block complexity
	model := defaultModel
	if premiumBlocks[body.BlockID] {
		model = premiumModel
	}

	// Call Anthropic API with streaming
	reqBody, _ := json.Marshal(map[string]any{
		"model":      model,
		"max_tokens": maxTokens,
		"stream":     true,
		"system":     systemPrompt,
		"messages":   []map[string]string{{"role": "user", "content": body.Prompt}},
	})

	req, err := http.NewRequestWithContext(r.Context(), "POST", anthropicAPI, bytes.NewReader(reqBody))
	if err != nil {
		http.Error(w, `{"error":"Internal error"}`, http.StatusInternalServerError)
		return
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-api-key", h.APIKey)
	req.Header.Set("anthropic-version", "2023-06-01")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		http.Error(w, `{"error":"AI service unavailable"}`, http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		var errResp map[string]any
		_ = json.Unmarshal(bodyBytes, &errResp)
		msg := "AI service error"
		if e, ok := errResp["error"].(map[string]any); ok {
			if m, ok := e["message"].(string); ok {
				msg = m
			}
		}
		http.Error(w, fmt.Sprintf(`{"error":"%s"}`, msg), resp.StatusCode)
		return
	}

	// Stream SSE to client
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("X-Accel-Buffering", "no")
	w.Header().Set("X-Cache", "MISS")

	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, `{"error":"Streaming not supported"}`, http.StatusInternalServerError)
		return
	}

	var fullOutput strings.Builder
	scanner := bufio.NewScanner(resp.Body)
	scanner.Buffer(make([]byte, 64*1024), 64*1024)

	for scanner.Scan() {
		line := scanner.Text()
		if !strings.HasPrefix(line, "data: ") {
			continue
		}
		data := strings.TrimPrefix(line, "data: ")
		if data == "[DONE]" {
			break
		}

		var event map[string]any
		if err := json.Unmarshal([]byte(data), &event); err != nil {
			continue
		}

		eventType, _ := event["type"].(string)
		if eventType == "content_block_delta" {
			delta, _ := event["delta"].(map[string]any)
			text, _ := delta["text"].(string)
			if text != "" {
				fullOutput.WriteString(text)
				chunk := mustJSON(map[string]string{"text": text})
				fmt.Fprintf(w, "data: %s\n\n", chunk)
				flusher.Flush()
			}
		}
	}

	fmt.Fprintf(w, "data: [DONE]\n\n")
	flusher.Flush()

	// Cache the full response
	if h.Cache != nil && h.Cache.Available() && fullOutput.Len() > 100 {
		_ = h.Cache.Set(r.Context(), cacheKey, []byte(fullOutput.String()), cacheTTL)
	}
}

func mustJSON(v any) string {
	b, _ := json.Marshal(v)
	return string(b)
}
