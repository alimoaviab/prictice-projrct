# Tasks

## Task 1: Gemini Client and Configuration

Set up the Google Gemini API client wrapper and extend the application configuration.

- [ ] 1.1 Add Gemini environment variables to `internal/config/config.go`: `GEMINI_API_KEY`, `GEMINI_MODEL` (default "gemini-pro"), `GEMINI_TIMEOUT_MS` (default 2500), `CHATBOT_RATE_LIMIT` (default 30), `CHATBOT_CACHE_TTL_SECONDS` (default 60)
- [ ] 1.2 Create `internal/ai/gemini.go` with `GeminiClient` struct implementing `DetectIntent(message string, history []ChatMessage) (*IntentResult, error)` and `GenerateResponse(req GenerateRequest) (string, error)` methods
- [ ] 1.3 Implement HTTP client with configurable timeout (2500ms default), proper error handling, and retry logic (1 retry on transient errors)
- [ ] 1.4 Define the intent detection system prompt in `internal/domain/chatbot/intents.go` with all supported intent categories and entity extraction rules
- [ ] 1.5 Add `.env.example` entries for `GEMINI_API_KEY` and `GEMINI_MODEL`

## Task 2: Rate Limiter

Implement Redis-based sliding window rate limiting for the chatbot endpoint.

- [ ] 2.1 Create `internal/domain/chatbot/ratelimit.go` with `RateLimiter` struct using Redis ZSET sliding window algorithm
- [ ] 2.2 Implement `Allow(userID string) (allowed bool, remaining int, retryAfter time.Duration)` method enforcing 30 messages/minute
- [ ] 2.3 Implement graceful degradation: if Redis is unavailable, allow all requests (log warning)
- [ ] 2.4 Return proper 429 response with `retry_after_seconds`, `limit`, and `window` details in error payload

## Task 3: Query Cache Layer

Implement Redis-based caching for chatbot query results.

- [ ] 3.1 Create `internal/domain/chatbot/cache.go` with `QueryCache` struct
- [ ] 3.2 Implement cache key generation: `chatbot:{school_id}:{academic_year_id}:{intent}:{entities_hash}` using SHA256 of sorted entity key-value pairs
- [ ] 3.3 Implement `Get(key string) (*QueryResult, bool)` and `Set(key string, result *QueryResult)` with 60-second TTL
- [ ] 3.4 Implement `Invalidate(schoolID string)` to clear all cached entries for a school (called on data mutations)
- [ ] 3.5 Graceful degradation: if Redis unavailable, skip caching without errors

## Task 4: Response Types and Builder

Define the enhanced response structure and build the response formatting logic.

- [ ] 4.1 Create `internal/domain/chatbot/response.go` with `AssistantResponse`, `ActionButton`, `QueryResult`, and `EmptyStateInfo` types
- [ ] 4.2 Implement `BuildResponse(result *QueryResult, geminiAnalysis string, language string) *AssistantResponse` that formats data into the structured response
- [ ] 4.3 Implement `ActionButton` builder helpers: `NavigateButton(label, route string)` and `CreateButton(label, route string)`
- [ ] 4.4 Enforce max 4 quick_buttons per response; truncate with priority ordering

## Task 5: Intent Router and RBAC Integration

Implement the intent-to-handler routing with role-based access control.

- [ ] 5.1 Create `internal/domain/chatbot/router.go` with `IntentRouter` struct and `Route(ctx *api.RequestContext, intent *IntentResult) (*QueryResult, error)` method
- [ ] 5.2 Define `categoryPermissions` map linking each `IntentCategory` to allowed roles (fee/subscription → admin+super_admin only; others → all three roles)
- [ ] 5.3 Implement RBAC check that returns a permission-denied `QueryResult` with helpful message when role lacks access
- [ ] 5.4 Register all query handlers in the router with their corresponding intent categories

## Task 6: Fallback Keyword Matching

Extract existing keyword-matching logic into a standalone fallback module.

- [ ] 6.1 Create `internal/domain/chatbot/fallback.go` extracting the existing `containsAny` switch-case logic from current `chatbot.go`
- [ ] 6.2 Adapt fallback to return `*IntentResult` format (intent, category, entities) so it integrates with the new pipeline
- [ ] 6.3 Ensure fallback produces the same responses as the current implementation when Gemini is unavailable

## Task 7: Query Handlers — Academic Year, Class, Teacher

Implement query handlers for academic year, class, and teacher domains.

- [ ] 7.1 Create `internal/domain/chatbot/handlers/handler.go` with `QueryHandler` interface definition
- [ ] 7.2 Create `internal/domain/chatbot/handlers/academic_year.go` handling intents: `academic_year_status` (active year info), `academic_year_upcoming` (future years list)
- [ ] 7.3 Create `internal/domain/chatbot/handlers/class.go` handling intents: `class_list` (count + breakdown), `class_search` (by name), `class_attendance` (monthly %), `class_fee_collection` (collected/pending per class)
- [ ] 7.4 Create `internal/domain/chatbot/handlers/teacher.go` handling intents: `teacher_search` (by name), `teacher_current_period` (timetable cross-reference with current time), `teacher_list` (summary, max 10)

## Task 8: Query Handlers — Student, Event, Exam

Implement query handlers for student, event, and exam domains.

- [ ] 8.1 Create `internal/domain/chatbot/handlers/student.go` handling intents: `student_search` (by name/admission_no), `student_results` (exam scores), `student_attendance` (monthly trend), `student_top` (top 5 by avg), `student_weak` (below 40%)
- [ ] 8.2 Create `internal/domain/chatbot/handlers/event.go` handling intents: `event_upcoming` (next 30 days), `event_today` (current date), `event_search` (by name)
- [ ] 8.3 Create `internal/domain/chatbot/handlers/exam.go` handling intents: `exam_upcoming` (future exams, max 10), `exam_performance` (class avg, high/low, pass %), `exam_schedule` (class-specific exam list)

## Task 9: Query Handlers — Result, Fee, Subscription, Support

Implement query handlers for result, fee, subscription, and support domains.

- [ ] 9.1 Create `internal/domain/chatbot/handlers/result.go` handling intents: `result_class_performance` (class avg, pass rate, subject averages), `result_top` (top 5 students), `result_weak` (below 40%), `result_trends` (compare current vs previous exams)
- [ ] 9.2 Create `internal/domain/chatbot/handlers/fee.go` handling intents: `fee_summary` (collected/pending/overdue), `fee_student_status` (per-student breakdown), `fee_defaulters` (overdue list, max 20)
- [ ] 9.3 Create `internal/domain/chatbot/handlers/subscription.go` handling intents: `subscription_status` (plan info, remaining days), `subscription_usage` (metrics vs limits)
- [ ] 9.4 Create `internal/domain/chatbot/handlers/support.go` handling intents: `support_contact` (email/phone/hours), `support_ticket` (action button to ticket page)

## Task 10: Guide System

Implement the step-by-step guide system with prerequisite detection.

- [ ] 10.1 Create `internal/domain/chatbot/guides.go` with `Guide` and `GuideStep` types including `CheckFunc` for prerequisite verification
- [ ] 10.2 Define guides for all modules: create_student, create_class, create_exam, create_fee_structure, mark_attendance, enter_results, create_event, create_timetable
- [ ] 10.3 Implement prerequisite checking (e.g., verify active academic year exists before "create class" guide)
- [ ] 10.4 Create `internal/domain/chatbot/handlers/guide.go` that matches `guide_*` intents to guide definitions and returns formatted steps with action buttons

## Task 11: Diagnostic Engine

Implement the smart diagnostic system for failure root cause analysis.

- [ ] 11.1 Create `internal/domain/chatbot/diagnostic.go` with `DiagnosticCheck` type and registry of common failure checks
- [ ] 11.2 Implement diagnostic checks: MissingActiveAcademicYear, DuplicateAdmissionNumber, MissingClassAssignment, MissingFeeStructure, InvalidDateRange, MissingTeacherAssignment
- [ ] 11.3 Create `internal/domain/chatbot/handlers/diagnostic.go` that runs all relevant checks based on user-described failure and returns the first matching root cause with fix action button
- [ ] 11.4 Implement fallback: when no diagnostic matches, suggest contacting support with pre-filled context

## Task 12: Enhanced Main Handler

Rewrite the main chatbot handler to orchestrate the full AI pipeline.

- [ ] 12.1 Refactor `internal/domain/chatbot/chatbot.go` to use the new pipeline: rate limit → cache check → intent detection → RBAC → query handler → response builder → cache set
- [ ] 12.2 Implement Gemini fallback: if `GEMINI_API_KEY` is empty or Gemini times out, use fallback keyword matching
- [ ] 12.3 Implement conversation history handling: accept up to 10 history messages, pass to Gemini for context
- [ ] 12.4 Implement input sanitization: trim, max 500 chars, strip control characters
- [ ] 12.5 Implement error logging with context (user_id, school_id, intent, timestamp) without logging message content
- [ ] 12.6 Wire up all dependencies (GeminiClient, RateLimiter, QueryCache, IntentRouter) in the handler constructor

## Task 13: Integration and Wiring

Wire the enhanced chatbot into the application startup and routing.

- [ ] 13.1 Update `cmd/server/main.go` to initialize `GeminiClient` (if API key present), `RateLimiter`, `QueryCache`, and pass them to the chatbot handler
- [ ] 13.2 Ensure the existing `POST /api/chatbot/message` route uses the enhanced handler
- [ ] 13.3 Verify backward compatibility: when `GEMINI_API_KEY` is not set, the system behaves identically to the current implementation
- [ ] 13.4 Add cache invalidation hooks to existing mutation endpoints (create/update student, class, fee, etc.) to call `QueryCache.Invalidate(schoolID)`

## Task 14: Frontend Response Rendering

Update the frontend chat widget to render the enhanced response structure.

- [ ] 14.1 Update the chatbot API response type in the frontend to include `analysis`, `suggested_actions`, `quick_buttons[]`, and `language` fields
- [ ] 14.2 Render `quick_buttons` as clickable buttons that navigate to the specified route or trigger create actions
- [ ] 14.3 Render `suggested_actions` as a collapsible list below the main reply
- [ ] 14.4 Render `analysis` section with distinct styling (e.g., info card) when present
- [ ] 14.5 Handle 429 rate limit responses with a user-friendly cooldown message and countdown timer
