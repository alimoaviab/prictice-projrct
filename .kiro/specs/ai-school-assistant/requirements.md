# Requirements Document

## Introduction

The AI School Assistant enhances the existing Eduplexo chatbot endpoint (POST /api/chatbot/message) from a simple keyword-matching system into an intelligent, multi-lingual school management assistant powered by Google Gemini. The assistant provides step-by-step guidance through ERP modules, performs smart diagnostics on failed actions, answers data-driven questions across all school domains (students, teachers, classes, fees, exams, results, attendance, events, timetable, subscriptions), and offers actionable navigation buttons. It respects multi-tenancy isolation and role-based access control, ensuring each user only sees data relevant to their school and permission level.

## Glossary

- **Assistant**: The AI-powered chatbot service that processes user messages and returns structured responses
- **Intent_Detector**: The component that classifies user messages into actionable intents using Google Gemini
- **Query_Engine**: The component that executes safe, parameterized database queries based on detected intents
- **Response_Builder**: The component that formats query results into structured responses with analysis and action buttons
- **Guide_System**: The component that provides step-by-step walkthroughs for ERP module operations
- **Diagnostic_Engine**: The component that analyzes database state to determine why an action failed
- **Gemini_Client**: The wrapper around Google Gemini API (gemini-pro model) for natural language understanding
- **Action_Button**: A structured UI element in the response that navigates the user to a page or triggers an entity creation
- **School_Context**: The combination of school_id and academic_year_id that isolates tenant data
- **Rate_Limiter**: The component that enforces per-user message frequency limits via Redis
- **Cache_Layer**: The Redis-based caching component for repeated query results

## Requirements

### Requirement 1: Intent Detection and Classification

**User Story:** As a school user, I want to type questions in natural language (English, Urdu, Roman Urdu, or mixed), so that the assistant understands my intent regardless of language or spelling mistakes.

#### Acceptance Criteria

1. WHEN a user message is received, THE Intent_Detector SHALL classify the message into exactly one intent category from the supported set (guide, diagnostic, academic_year, class, teacher, student, event, exam, result, fee, subscription, support, greeting, unknown)
2. WHEN a user message contains spelling mistakes or informal language, THE Intent_Detector SHALL apply fuzzy matching via Gemini to resolve the intended meaning
3. WHEN a user message is written in Urdu, Roman Urdu, or a mix of English and Urdu, THE Intent_Detector SHALL correctly classify the intent with the same accuracy as English-only messages
4. WHEN the Intent_Detector cannot classify a message with sufficient confidence, THE Assistant SHALL respond with a helpful fallback listing available capabilities
5. THE Intent_Detector SHALL complete classification within 1500 milliseconds for any single message

### Requirement 2: Multi-Tenancy Data Isolation

**User Story:** As a school administrator, I want the assistant to only show data from my school, so that tenant data remains isolated and secure.

#### Acceptance Criteria

1. THE Query_Engine SHALL include the school_id filter from School_Context in every database query
2. THE Query_Engine SHALL include the academic_year_id filter from School_Context in every query that involves academic-year-scoped data
3. IF a query result contains zero records due to School_Context filtering, THEN THE Assistant SHALL inform the user that no data is available for their school rather than returning data from other tenants
4. THE Assistant SHALL extract School_Context from the authenticated JWT token for every request

### Requirement 3: Role-Based Access Control for Responses

**User Story:** As a school administrator, I want the assistant to respect user roles, so that teachers cannot access fee management data and each role sees only permitted information.

#### Acceptance Criteria

1. WHEN a user with the "teacher" role asks about fee data, THE Assistant SHALL respond that fee management details are restricted to administrators
2. WHEN a user with the "admin" role asks about platform-level data, THE Assistant SHALL respond that platform management is restricted to super administrators
3. THE Assistant SHALL validate the user role against the existing RBAC permission matrix before executing any Query_Engine operation
4. WHEN a user requests data for a feature they lack "view" permission on, THE Assistant SHALL return a permission-denied message without revealing the underlying data
5. THE Assistant SHALL support the roles: super_admin, admin, and teacher for chatbot access

### Requirement 4: Guide System for Module Operations

**User Story:** As a new school administrator, I want step-by-step guidance through ERP operations (creating students, classes, exams), so that I can complete tasks without reading documentation.

#### Acceptance Criteria

1. WHEN a user asks how to perform an operation (create student, add class, schedule exam), THE Guide_System SHALL return a numbered step-by-step guide for that operation
2. THE Guide_System SHALL include Action_Buttons that navigate the user to the relevant page for each step
3. WHEN a guide involves prerequisite steps (creating an academic year before creating a class), THE Guide_System SHALL list prerequisites first with their own Action_Buttons
4. THE Guide_System SHALL support guides for all existing modules: Students, Teachers, Classes, Attendance, Exams, Results, Fees, Events, Timetable

### Requirement 5: Smart Diagnostic Engine

**User Story:** As a school administrator, I want the assistant to tell me WHY an action failed (missing academic year, duplicate admission number), so that I can fix the root cause quickly.

#### Acceptance Criteria

1. WHEN a user reports a failed action, THE Diagnostic_Engine SHALL query the database to identify the root cause
2. THE Diagnostic_Engine SHALL detect common failure causes: missing active academic year, duplicate admission numbers, missing class assignment, missing fee structure, and invalid date ranges
3. WHEN a root cause is identified, THE Diagnostic_Engine SHALL provide a specific fix recommendation with an Action_Button to resolve the issue
4. IF the Diagnostic_Engine cannot determine the root cause, THEN THE Assistant SHALL suggest contacting support and provide the support Action_Button

### Requirement 6: Academic Year AI Queries

**User Story:** As a school administrator, I want to ask about academic year status, so that I can verify active sessions and plan upcoming years.

#### Acceptance Criteria

1. WHEN a user asks about the current academic year, THE Assistant SHALL return the active academic year name, start date, and end date
2. WHEN a user asks about upcoming academic years, THE Assistant SHALL list all academic years with status "upcoming" sorted by start date
3. IF no active academic year exists for the school, THEN THE Assistant SHALL inform the user and provide an Action_Button to create one

### Requirement 7: Class AI Queries

**User Story:** As a school administrator or teacher, I want to ask about class information, so that I can get quick stats on enrollment, attendance, and fee collection per class.

#### Acceptance Criteria

1. WHEN a user asks about total classes, THE Assistant SHALL return the count of classes with a breakdown by status (active, inactive)
2. WHEN a user searches for a specific class by name, THE Assistant SHALL return matching class details including student count and assigned teacher
3. WHEN a user asks about class attendance performance, THE Assistant SHALL calculate and return the attendance percentage for the specified class over the current month
4. WHEN an admin user asks about fee collection per class, THE Assistant SHALL return total collected, total pending, and collection percentage for the specified class

### Requirement 8: Teacher AI Queries

**User Story:** As a school administrator, I want to ask about teacher information, so that I can quickly find teacher details, assigned classes, and current teaching status.

#### Acceptance Criteria

1. WHEN a user asks about a specific teacher by name, THE Assistant SHALL return the teacher profile including assigned subjects and classes
2. WHEN a user asks which teacher is currently teaching, THE Assistant SHALL cross-reference the timetable with the current day and time to identify the active teacher and period
3. WHEN a user asks about all teachers, THE Assistant SHALL return a summary with total count and a list limited to 10 entries with a note about remaining teachers

### Requirement 9: Student AI Queries

**User Story:** As a school administrator or teacher, I want to ask about student information, so that I can search students, view performance, and identify attendance trends.

#### Acceptance Criteria

1. WHEN a user searches for a student by name or admission number, THE Assistant SHALL return matching student profiles with class, status, and guardian information
2. WHEN a user asks about a student's results, THE Assistant SHALL return exam scores with subject-wise breakdown and overall percentage
3. WHEN a user asks about a student's attendance trend, THE Assistant SHALL calculate monthly attendance percentages for the current academic year
4. WHEN a user asks about top or weak performers in a class, THE Assistant SHALL rank students by average exam percentage and return the top 5 or bottom 5

### Requirement 10: Event AI Queries

**User Story:** As a school user, I want to ask about upcoming events, so that I can stay informed about school activities and deadlines.

#### Acceptance Criteria

1. WHEN a user asks about upcoming events, THE Assistant SHALL return events scheduled within the next 30 days sorted by date
2. WHEN a user asks about a specific event by name, THE Assistant SHALL return event details including date, time, location, and description
3. WHEN a user asks about today's events, THE Assistant SHALL return all events scheduled for the current date

### Requirement 11: Exam AI Queries

**User Story:** As a school user, I want to ask about exams, so that I can view schedules, upcoming tests, and performance summaries.

#### Acceptance Criteria

1. WHEN a user asks about upcoming exams, THE Assistant SHALL return exams with start dates in the future, sorted by date, limited to 10 entries
2. WHEN a user asks about exam performance for a specific exam, THE Assistant SHALL return class average, highest score, lowest score, and pass percentage
3. WHEN a user asks about a specific class's exam schedule, THE Assistant SHALL return all exams assigned to that class for the current academic year

### Requirement 12: Result AI Queries

**User Story:** As a school administrator or teacher, I want to ask about results and performance analytics, so that I can identify trends and take action on weak areas.

#### Acceptance Criteria

1. WHEN a user asks about class performance, THE Assistant SHALL return the class average percentage, pass rate, and subject-wise averages
2. WHEN a user asks about top students, THE Assistant SHALL return the top 5 students ranked by overall average across all exams in the current academic year
3. WHEN a user asks about weak students, THE Assistant SHALL return students scoring below 40 percent average with their subject-wise breakdown
4. WHEN a user asks about performance trends, THE Assistant SHALL compare current exam averages with previous exams to show improvement or decline

### Requirement 13: Fee AI Queries

**User Story:** As a school administrator, I want to ask about fee collection status, so that I can track pending payments and identify defaulters.

#### Acceptance Criteria

1. WHEN an admin user asks about fee collection stats, THE Assistant SHALL return total collected amount, total pending amount, collection percentage, and overdue count
2. WHEN an admin user asks about a specific student's fee status, THE Assistant SHALL return paid amount, pending amount, due date, and payment history
3. WHEN an admin user asks about fee defaulters, THE Assistant SHALL return students with overdue fees sorted by pending amount descending, limited to 20 entries
4. WHEN a teacher user asks about fee data, THE Assistant SHALL deny access with a message indicating fee data is restricted to administrators

### Requirement 14: Subscription AI Queries

**User Story:** As a school administrator, I want to ask about my subscription plan, so that I can check remaining days and usage limits.

#### Acceptance Criteria

1. WHEN an admin user asks about the current subscription, THE Assistant SHALL return plan name, start date, expiry date, and remaining days
2. WHEN an admin user asks about usage, THE Assistant SHALL return current usage metrics against plan limits (student count, teacher count, storage)
3. IF the subscription has fewer than 15 days remaining, THEN THE Assistant SHALL include a renewal reminder with an Action_Button to the subscription page

### Requirement 15: Support AI Queries

**User Story:** As a school user, I want to ask for support contact information or create a support ticket, so that I can get help with issues the assistant cannot resolve.

#### Acceptance Criteria

1. WHEN a user asks for support contact information, THE Assistant SHALL return the support email, phone number, and available hours
2. WHEN a user asks to create a support ticket, THE Assistant SHALL provide an Action_Button that navigates to the ticket creation page
3. WHEN the Assistant cannot resolve a query after two attempts, THE Assistant SHALL suggest contacting support with pre-filled context

### Requirement 16: Response Format and Action Buttons

**User Story:** As a school user, I want structured responses with clear sections and clickable action buttons, so that I can quickly understand the answer and take next steps.

#### Acceptance Criteria

1. THE Response_Builder SHALL format every response with the sections: answer, analysis (when applicable), suggested_actions (list of text recommendations), and quick_buttons (list of Action_Buttons)
2. WHEN an Action_Button navigates to a page, THE Response_Builder SHALL include the button label and the target route path
3. WHEN an Action_Button triggers entity creation, THE Response_Builder SHALL include the button label, target route path, and action type "create"
4. THE Response_Builder SHALL limit quick_buttons to a maximum of 4 per response

### Requirement 17: Performance and Rate Limiting

**User Story:** As a platform operator, I want the assistant to respond quickly and prevent abuse, so that the system remains performant for all users.

#### Acceptance Criteria

1. THE Assistant SHALL return a complete response within 3000 milliseconds measured from request receipt to response dispatch
2. THE Rate_Limiter SHALL enforce a maximum of 30 messages per minute per authenticated user
3. WHEN a user exceeds the rate limit, THE Rate_Limiter SHALL return a 429 status code with a message indicating the remaining cooldown time in seconds
4. THE Cache_Layer SHALL cache repeated identical queries for 60 seconds using Redis to reduce database load
5. THE Cache_Layer SHALL invalidate cached entries when the underlying data changes within the same School_Context

### Requirement 18: Security and Error Handling

**User Story:** As a platform operator, I want the assistant to never expose internal errors, raw SQL, or system details, so that the system remains secure.

#### Acceptance Criteria

1. IF a database query fails, THEN THE Assistant SHALL return a generic error message ("I'm having trouble fetching that information. Please try again.") without exposing the internal error
2. THE Assistant SHALL never include raw SQL statements, stack traces, or internal system paths in any response
3. THE Assistant SHALL validate and sanitize all user input before passing it to the Gemini_Client or Query_Engine
4. IF the Gemini API is unavailable, THEN THE Assistant SHALL fall back to the existing keyword-matching logic and inform the user that advanced features are temporarily limited
5. THE Assistant SHALL log all errors with request context (user_id, school_id, intent, timestamp) to the server log for debugging

### Requirement 19: Gemini API Integration

**User Story:** As a developer, I want a clean integration with Google Gemini API, so that the assistant can understand natural language and generate contextual responses.

#### Acceptance Criteria

1. THE Gemini_Client SHALL send user messages to the gemini-pro model with a system prompt that defines the assistant's role, available data domains, and response format
2. THE Gemini_Client SHALL include conversation history (up to the last 10 messages) for context continuity
3. WHEN the Gemini API returns an error or times out after 2500 milliseconds, THE Gemini_Client SHALL trigger the fallback to keyword-matching logic
4. THE Gemini_Client SHALL never send raw database results to the Gemini API; only structured summaries prepared by the Query_Engine
5. THE Gemini_Client SHALL use the API key stored in server environment configuration, never hardcoded

### Requirement 20: Conversation Context and History

**User Story:** As a school user, I want the assistant to remember my recent messages in a conversation, so that I can ask follow-up questions without repeating context.

#### Acceptance Criteria

1. THE Assistant SHALL accept a conversation history array (up to 10 previous messages) in the request payload
2. WHEN a user asks a follow-up question (e.g., "what about class 5?" after asking about attendance), THE Assistant SHALL use conversation history to resolve the context
3. THE Assistant SHALL not persist conversation history on the server; the client SHALL manage and send history with each request
