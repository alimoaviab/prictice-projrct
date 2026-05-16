# Design Document

## Overview

This design transforms the existing rule-based chatbot (`internal/domain/chatbot/chatbot.go`) into an AI-powered school management assistant using Google Gemini. The architecture follows a pipeline pattern: **Message → Intent Detection (Gemini) → RBAC Check → Query Execution → Response Building** with fallback to the existing keyword-matching logic when Gemini is unavailable.

The design preserves the existing `POST /api/chatbot/message` endpoint contract and extends it with richer response structures, action buttons, and AI-powered understanding.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                          │
│  ChatWidget → sends message + history → renders structured resp  │
└─────────────────────┬───────────────────────────────────────────┘
                      │ POST /api/chatbot/message
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Rate Limiter (Redis)                           │
│              30 msg/min per user_id via sliding window           │
└─────────────────────┬───────────────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Chatbot Handler                                │
│  1. Parse request (message + history)                           │
│  2. Extract School_Context from JWT                             │
│  3. Call Intent Detector                                        │
│  4. RBAC permission check                                       │
│  5. Route to appropriate Query Handler                          │
│  6. Build structured response                                   │
│  7. Cache result in Redis                                       │
└────┬──────────┬──────────┬──────────────────────────────────────┘
     │          │          │
     ▼          ▼          ▼
┌─────────┐ ┌─────────┐ ┌──────────────┐
│ Gemini  │ │  Query  │ │   Response   │
│ Client  │ │ Engine  │ │   Builder    │
│         │ │         │ │              │
│ Intent  │ │ Store/  │ │ Format +     │
│ Detect  │ │ PG      │ │ Buttons      │
│ + NLU   │ │ Queries │ │              │
└─────────┘ └─────────┘ └──────────────┘
```

## Components

### 1. Gemini Client (`internal/ai/gemini.go`)

**Responsibility:** Wraps Google Gemini API for intent detection and natural language response generation.

```go
package ai

type GeminiClient struct {
    apiKey     string
    model      string // "gemini-pro"
    httpClient *http.Client
    timeout    time.Duration // 2500ms
}

type IntentResult struct {
    Intent     string            // e.g. "student_search", "fee_summary", "guide_create_student"
    Category   string            // e.g. "student", "fee", "guide", "diagnostic"
    Entities   map[string]string // extracted entities: {"name": "Ali", "class": "5"}
    Confidence float64
    Language   string            // detected: "en", "ur", "roman_ur", "mixed"
}

type GenerateRequest struct {
    SystemPrompt string
    UserMessage  string
    History      []ChatMessage
    Context      string // structured data summary for response generation
}

func (g *GeminiClient) DetectIntent(message string, history []ChatMessage) (*IntentResult, error)
func (g *GeminiClient) GenerateResponse(req GenerateRequest) (string, error)
```

**Design Decisions:**
- Separate intent detection from response generation (two Gemini calls when needed)
- System prompt defines available intents, entity extraction rules, and response format
- 2500ms timeout with fallback to keyword matching
- Never sends raw DB data to Gemini — only structured summaries

### 2. Intent Router (`internal/domain/chatbot/router.go`)

**Responsibility:** Maps detected intents to query handlers after RBAC validation.

```go
type IntentCategory string

const (
    CategoryGuide        IntentCategory = "guide"
    CategoryDiagnostic   IntentCategory = "diagnostic"
    CategoryAcademicYear IntentCategory = "academic_year"
    CategoryClass        IntentCategory = "class"
    CategoryTeacher      IntentCategory = "teacher"
    CategoryStudent      IntentCategory = "student"
    CategoryEvent        IntentCategory = "event"
    CategoryExam         IntentCategory = "exam"
    CategoryResult       IntentCategory = "result"
    CategoryFee          IntentCategory = "fee"
    CategorySubscription IntentCategory = "subscription"
    CategorySupport      IntentCategory = "support"
    CategoryGreeting     IntentCategory = "greeting"
    CategoryUnknown      IntentCategory = "unknown"
)

// RBAC mapping: which roles can access which categories
var categoryPermissions = map[IntentCategory]map[string]bool{
    CategoryFee:          {"super_admin": true, "admin": true},
    CategorySubscription: {"super_admin": true, "admin": true},
    CategoryStudent:      {"super_admin": true, "admin": true, "teacher": true},
    CategoryTeacher:      {"super_admin": true, "admin": true, "teacher": true},
    // ... all others accessible by all three roles
}
```

### 3. Query Handlers (`internal/domain/chatbot/handlers/`)

**Responsibility:** Execute data queries against the store/PostgreSQL with tenant isolation.

Each handler follows the same interface:

```go
type QueryHandler interface {
    Handle(ctx *api.RequestContext, intent *IntentResult) (*QueryResult, error)
}

type QueryResult struct {
    Data       any               // structured data
    Summary    string            // human-readable summary for Gemini context
    Actions    []ActionButton    // suggested navigation actions
    EmptyState *EmptyStateInfo   // when no data found
}
```

**Handler files:**
- `handler_academic_year.go` — active year, upcoming years
- `handler_class.go` — class list, search, attendance %, fee collection
- `handler_teacher.go` — teacher search, current period, list
- `handler_student.go` — search, results, attendance trends, top/weak
- `handler_event.go` — upcoming, today, search
- `handler_exam.go` — upcoming, performance, schedule
- `handler_result.go` — class performance, top/weak, trends
- `handler_fee.go` — collection stats, student status, defaulters
- `handler_subscription.go` — plan info, usage, renewal
- `handler_support.go` — contact info, ticket creation
- `handler_guide.go` — step-by-step guides with prerequisites
- `handler_diagnostic.go` — failure root cause analysis

### 4. Response Builder (`internal/domain/chatbot/response.go`)

**Responsibility:** Formats query results into the structured response format.

```go
type AssistantResponse struct {
    Reply          string         `json:"reply"`           // Main answer text (markdown)
    Analysis       string         `json:"analysis,omitempty"` // AI analysis/insight
    SuggestedActions []string     `json:"suggested_actions,omitempty"` // Text recommendations
    QuickButtons   []ActionButton `json:"quick_buttons,omitempty"` // Max 4 buttons
    ToolUsed       string         `json:"tool_used,omitempty"`
    Data           any            `json:"data,omitempty"`
    Language       string         `json:"language,omitempty"` // Response language
}

type ActionButton struct {
    Label      string `json:"label"`
    Route      string `json:"route"`       // e.g. "/students/create"
    ActionType string `json:"action_type"` // "navigate" | "create"
    Icon       string `json:"icon,omitempty"`
}
```

### 5. Rate Limiter (`internal/domain/chatbot/ratelimit.go`)

**Responsibility:** Enforces 30 messages/minute per user using Redis sliding window.

```go
type RateLimiter struct {
    redis  *cache.RedisClient
    limit  int           // 30
    window time.Duration // 1 minute
}

func (rl *RateLimiter) Allow(userID string) (bool, int, time.Duration)
// Returns: allowed, remaining, retryAfter
```

**Design:** Uses Redis ZSET with timestamp scores for sliding window. Falls back to allowing all requests if Redis is unavailable (graceful degradation matching existing cache behavior).

### 6. Cache Layer (`internal/domain/chatbot/cache.go`)

**Responsibility:** Caches query results for repeated identical queries.

```go
type QueryCache struct {
    redis *cache.RedisClient
    ttl   time.Duration // 60 seconds
}

// Cache key: chatbot:{school_id}:{academic_year_id}:{intent}:{entities_hash}
func (qc *QueryCache) Get(key string) (*QueryResult, bool)
func (qc *QueryCache) Set(key string, result *QueryResult)
func (qc *QueryCache) Invalidate(schoolID string) // called on data mutations
```

### 7. Guide System (`internal/domain/chatbot/guides.go`)

**Responsibility:** Static guide definitions with prerequisite detection.

```go
type Guide struct {
    ID            string
    Title         string
    Prerequisites []GuideStep
    Steps         []GuideStep
}

type GuideStep struct {
    Number      int
    Description string
    Route       string       // navigation target
    ActionType  string       // "navigate" | "create"
    CheckFunc   func(ctx *api.RequestContext, store *store.MemStore) bool // prerequisite met?
}
```

Guides are defined as static data structures. The `CheckFunc` queries the store to verify if prerequisites are met (e.g., "has active academic year?" before "create class").

### 8. Diagnostic Engine (`internal/domain/chatbot/diagnostic.go`)

**Responsibility:** Analyzes database state to identify why common actions fail.

```go
type DiagnosticCheck struct {
    Name        string
    Description string
    CheckFunc   func(ctx *api.RequestContext, store *store.MemStore) *DiagnosticResult
}

type DiagnosticResult struct {
    Issue       string       // "No active academic year found"
    Cause       string       // "You need an active academic year before creating classes"
    Fix         ActionButton // Button to resolve
}

// Registered checks:
// - MissingActiveAcademicYear
// - DuplicateAdmissionNumber
// - MissingClassAssignment
// - MissingFeeStructure
// - InvalidDateRange
// - MissingTeacherAssignment
```

## Data Flow

### Request Processing Pipeline

```
1. HTTP Request arrives at POST /api/chatbot/message
2. Auth middleware extracts JWT → RequestContext (school_id, user_id, role)
3. Rate limiter checks Redis ZSET for user_id (30/min sliding window)
4. Request body parsed: { message, history[] }
5. Cache check: hash(school_id + academic_year_id + message) → hit? return cached
6. Gemini Intent Detection:
   a. Send message + last 10 history items to Gemini with system prompt
   b. Gemini returns: intent, category, entities, confidence, language
   c. On timeout/error → fallback to keyword matching (existing logic)
7. RBAC Check: verify role has access to detected category
8. Query Handler execution:
   a. Handler queries MemStore/PostgreSQL with school_id + academic_year_id filters
   b. Returns structured QueryResult with data + summary + actions
9. Response Generation:
   a. If Gemini available: send summary to Gemini for natural language response
   b. If Gemini unavailable: use template-based response
10. Response Builder formats final AssistantResponse
11. Cache result in Redis (60s TTL)
12. Return JSON response
```

### Fallback Strategy

```
Primary: Gemini API → Intent Detection → AI Response Generation
         ↓ (timeout/error)
Fallback: Keyword Matching (existing containsAny logic) → Template Response
```

## Configuration

New environment variables added to `internal/config/config.go`:

```go
// AI/Gemini configuration
GeminiAPIKey       string // GEMINI_API_KEY
GeminiModel        string // GEMINI_MODEL (default: "gemini-pro")
GeminiTimeout      time.Duration // GEMINI_TIMEOUT_MS (default: 2500)

// Chatbot configuration
ChatbotRateLimit   int // CHATBOT_RATE_LIMIT (default: 30)
ChatbotCacheTTL    int // CHATBOT_CACHE_TTL_SECONDS (default: 60)
```

## API Contract

### Request (unchanged endpoint, enhanced body)

```
POST /api/chatbot/message
Authorization: Bearer <jwt>
X-Academic-Year-Id: <academic_year_id>

{
  "message": "kitne students hain class 5 mein?",
  "history": [
    {"role": "user", "content": "hello"},
    {"role": "assistant", "content": "Hello! How can I help?"}
  ]
}
```

### Response (enhanced structure, backward compatible)

```json
{
  "success": true,
  "data": {
    "reply": "📊 **Class 5 Students**\n\nTotal: **32 students**\nActive: 30 | Inactive: 2",
    "analysis": "Class 5 has good enrollment. 2 students are marked inactive.",
    "suggested_actions": [
      "View inactive students to check if they need follow-up",
      "Compare with other classes for balance"
    ],
    "quick_buttons": [
      {"label": "View Class 5", "route": "/classes/cls_abc123", "action_type": "navigate"},
      {"label": "Add Student", "route": "/students/create?class=cls_abc123", "action_type": "create"},
      {"label": "Attendance", "route": "/attendance?class=cls_abc123", "action_type": "navigate"}
    ],
    "tool_used": "student_count_by_class",
    "data": {"total": 32, "active": 30, "inactive": 2, "class_id": "cls_abc123"},
    "language": "mixed"
  }
}
```

### Rate Limit Response (429)

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many messages. Please wait 15 seconds before trying again.",
    "details": {"retry_after_seconds": 15, "limit": 30, "window": "1 minute"}
  }
}
```

## File Structure

```
internal/
├── ai/
│   └── gemini.go              # Gemini API client wrapper
├── domain/
│   └── chatbot/
│       ├── chatbot.go         # Enhanced main handler (replaces existing)
│       ├── router.go          # Intent → handler routing + RBAC
│       ├── response.go        # Response builder + types
│       ├── ratelimit.go       # Redis sliding window rate limiter
│       ├── cache.go           # Query result caching
│       ├── guides.go          # Step-by-step guide definitions
│       ├── diagnostic.go      # Failure root cause analysis
│       ├── fallback.go        # Keyword matching fallback (extracted from current)
│       ├── intents.go         # Intent category constants + system prompt
│       └── handlers/
│           ├── handler.go         # QueryHandler interface
│           ├── academic_year.go
│           ├── class.go
│           ├── teacher.go
│           ├── student.go
│           ├── event.go
│           ├── exam.go
│           ├── result.go
│           ├── fee.go
│           ├── subscription.go
│           ├── support.go
│           ├── guide.go
│           └── diagnostic.go
```

## Gemini System Prompt Design

The system prompt sent to Gemini for intent detection:

```
You are an intent classifier for a School ERP assistant. Classify the user message into exactly one intent.

Available intents:
- guide_* (guide_create_student, guide_create_class, guide_create_exam, ...)
- diagnostic (user reports something failed/broken)
- academic_year_status, academic_year_upcoming
- class_list, class_search, class_attendance, class_fee_collection
- teacher_search, teacher_current_period, teacher_list
- student_search, student_results, student_attendance, student_top, student_weak
- event_upcoming, event_today, event_search
- exam_upcoming, exam_performance, exam_schedule
- result_class_performance, result_top, result_weak, result_trends
- fee_summary, fee_student_status, fee_defaulters
- subscription_status, subscription_usage
- support_contact, support_ticket
- greeting
- unknown

The user may write in English, Urdu, Roman Urdu, or a mix. Handle spelling mistakes.

Extract entities: student_name, class_name, teacher_name, exam_name, date_range.

Respond in JSON: {"intent": "...", "category": "...", "entities": {...}, "confidence": 0.0-1.0, "language": "en|ur|roman_ur|mixed"}
```

## Performance Considerations

1. **Gemini timeout**: 2500ms hard timeout; total response budget is 3000ms (500ms for DB + response building)
2. **Redis cache**: 60s TTL prevents repeated Gemini calls for same query
3. **Parallel queries**: When a handler needs multiple data points (e.g., class + attendance + fees), queries run concurrently
4. **Store RLock**: Read locks are held for minimum duration; data is copied out before processing
5. **Response streaming**: Not implemented in v1; full response returned at once

## Security Considerations

1. **Input sanitization**: User messages are trimmed, length-limited (max 500 chars), and stripped of control characters before Gemini
2. **No SQL injection**: All queries use parameterized store lookups (MemStore) or prepared statements (PostgreSQL)
3. **No data leakage**: Gemini never receives raw student names, IDs, or PII — only aggregated summaries
4. **Error masking**: All internal errors are caught and replaced with generic user-facing messages
5. **Audit logging**: All chatbot interactions are logged with user_id, school_id, intent, and timestamp (not message content for privacy)

## Migration Strategy

1. The existing `chatbot.go` keyword-matching logic is extracted into `fallback.go`
2. The new handler wraps the fallback: if Gemini is configured (API key present), use AI pipeline; otherwise, use fallback
3. Zero breaking changes to the API contract — new fields are additive
4. Feature flag: if `GEMINI_API_KEY` is empty, the system operates exactly as before
