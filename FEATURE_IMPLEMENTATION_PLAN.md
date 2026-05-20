# EduPlex — Complete Feature Implementation Plan

> **Status**: Planning Document  
> **Priority**: Phase 1 → Phase 2 → Phase 3 → Phase 4  
> **Last Updated**: May 2026

---

## Platform Context

EduPlex ek integrated school assessment platform hai jisme yeh core modules hain:
- Question Bank (MCQ, Short, Long questions by Class/Subject/Chapter)
- Paper Builder (multi-section papers, templates, drag-drop)
- Exam Module (online/offline, auto-grading MCQs, manual grading)
- Results & Basic Analytics

**Tech Stack**: React (frontend), Go (backend), PostgreSQL (DB), Redis (cache), Socket.IO (real-time), AWS S3 (storage)

**Existing DB Tables**: users, questions, question_options, question_stars, question_papers, paper_sections, paper_items, exams, exam_attempts, exam_answers, results, classes, subjects, chapters

---

## PHASE 1: Quick Wins (Implement First)

### Feature 1: Star / Favorite Questions

**Database Changes:**
1. `question_stars` table mein `collection_name` column add karo
2. New table `star_collections`:
   - id (PK)
   - user_id (FK)
   - name (e.g. "Board Prep", "Weekly Quiz")
   - color (hex string for UI)
   - created_at

**API Endpoints:**
- `POST /api/questions/{id}/star` → toggle star on/off
- `GET /api/questions/starred` → user ki starred questions list
- `POST /api/collections` → nayi collection banao
- `GET /api/collections` → user ki collections list
- `PUT /api/collections/{id}` → collection rename
- `DELETE /api/collections/{id}` → collection delete
- `POST /api/collections/{id}/questions` → question collection mein add karo

**Frontend (React):**
- Question card par ★ icon show karo
- Click karne par filled star ho jaye (optimistic UI update, no page reload)
- Star click par small dropdown popup: "Add to Collection" + collections list
- Left sidebar mein "Starred Questions" aur "My Collections" section add karo
- Collection view: filtered question list by collection
- Keyboard shortcut: S key to star focused question

**Behavior Rules:**
- Ek question multiple collections mein ho sakta hai
- Star remove karne par saari collections se bhi remove ho
- Paper builder mein "From Starred" filter add karo
- Toast notification: "Question starred ✓" / "Removed from starred"
- Starred count badge on sidebar icon

**Testing:**
- Unit test: star toggle API
- E2E: teacher stars question → appears in starred list → adds to collection → collection shows correct count

---

### Feature 2: Bulk Import (Excel/CSV)

**Supported Formats:**
1. Excel (.xlsx) — primary format
2. CSV (.csv) — simple format
3. Word (.docx) — future phase

**Excel Template Structure:**
| Column | Field | Required |
|--------|-------|----------|
| A | question_text | Yes |
| B | question_type (MCQ/Short/Long) | Yes |
| C | difficulty (easy/medium/hard) | Yes |
| D | marks (number) | Yes |
| E | chapter_name | Yes |
| F | option_a (MCQ only) | Conditional |
| G | option_b | Conditional |
| H | option_c | Conditional |
| I | option_d | Conditional |
| J | correct_option (A/B/C/D) | Conditional |
| K | tags (comma separated) | No |

**Import Flow:**

Step 1 — Template Download:
- "Download Template" button → Excel file with sample row + column guide
- Template auto-fills Class, Subject, Chapter options from DB as dropdown validation

Step 2 — File Upload:
- Drag-drop or browse file upload
- Max file size: 10MB
- Accept: .xlsx, .csv only

Step 3 — Validation (before import):
- Parse file on server
- Validate each row:
  - ✓ Required fields present
  - ✓ question_type is valid enum
  - ✓ difficulty is valid enum
  - ✓ chapter_name exists in DB
  - ✓ MCQ has 4 options and correct_option
  - ✓ marks is positive number
- Return validation report to frontend
- Show: "247 rows valid, 3 rows have errors"
- Display error rows in table with specific error message per row

Step 4 — Import:
- Teacher fixes errors or proceeds with valid rows only
- "Import 247 Valid Questions" button
- Background job processes import (queue)
- Progress bar: "Importing... 150/247"
- On complete: "247 questions imported successfully"

Step 5 — Review:
- Imported questions appear in bank with "Imported" badge
- If approval workflow enabled: all imported questions → pending status
- Import log saved: file name, date, count, teacher, errors

**Backend Implementation:**
- Use: SheetJS (xlsx npm package) for Excel parsing
- Create `/api/questions/bulk-import` endpoint (multipart form)
- Async processing: use job queue
- Return job_id → frontend polls /api/jobs/{id}/status
- Batch insert: use DB bulk insert (not one-by-one) for performance
- Rollback on partial failure: wrap in transaction

**Database:**
Table `questions_import_logs`:
- id, teacher_id, school_id, file_name, total_rows, success_count, error_count, status, error_details (JSON), created_at

**Frontend Components:**
- ImportModal component with 4 steps (stepper UI)
- ValidationTable: shows errors with row numbers
- ProgressBar: animated during import
- ImportHistory: list of past imports with re-download option

**Error Handling:**
- File too large: "Max 10MB allowed"
- Wrong format: "Please use the provided Excel template"
- Chapter not found: "Row 5: Chapter 'Chapter 6' not found. Please create it first."
- Duplicate detection: warn if similar question text already exists (fuzzy match 90%+)

---

## PHASE 2: Workflow & Security

### Feature 3: Admin Approval Workflow

**Database Changes:**
1. `questions.status` already has pending/active/archived
2. New table `question_approvals`:
   - id (PK)
   - question_id (FK)
   - approver_id (FK → users.id)
   - action (ENUM: approved, rejected, revision_requested)
   - comment (TEXT, optional rejection reason)
   - created_at
3. `schools` table mein setting add karo:
   - approval_required (BOOLEAN, default: false)
   - → Agar false hai to questions directly active ho jayein

**API Endpoints:**
- `GET /api/admin/questions/pending` → pending questions list (admin only)
- `POST /api/questions/{id}/approve` → approve (admin only) → status=active
- `POST /api/questions/{id}/reject` → reject with reason → status=rejected
- `POST /api/questions/{id}/request-edit` → teacher se revision maango

**Frontend:**
- Admin panel mein "Pending Questions" tab add karo with badge count
- Question detail panel: Preview + Approve button (green) + Reject button (red)
- Rejection modal: optional comment field (teacher ko feedback milega)
- Teacher's view: unke question par "Pending Review" / "Rejected - See reason" badge
- Notification (bell icon + email): "Your question has been approved/rejected"
- Bulk approve: checkbox select + "Approve Selected" button

**Permission Logic:**
- Only users with role=admin OR role=exam_controller can approve
- Teachers can only see their own pending questions
- Approved questions visible to all teachers of that subject
- Rejected questions only visible to creator with reason

**School-Level Setting (Admin Panel):**
- Toggle: "Require approval for new questions" ON/OFF
- Per-subject override: "Biology questions require approval"

**Testing:**
- Role-based access: teacher cannot access /admin/questions/pending
- Workflow: create → pending → approve → active → appears in bank
- Notification delivery test

---

### Feature 4: Exam Proctoring / Anti-Cheat

**Anti-Cheat Layers:**

**Layer 1 — Question Randomization:**
- Each student ko questions different order mein milein
- MCQ options bhi shuffle hon
- Store: student_question_order table (student_id, exam_id, question_order JSON)

**Layer 2 — Session Security:**
- Exam start par unique session token generate karo
- Har answer submission mein token verify karo
- IP address log karo (ek IP se max N attempts settable by admin)
- Ek student multiple devices par simultaneously nahi le sakta

**Layer 3 — Browser Behavior Detection:**
- Tab switch detection: window blur/focus events track karo
- Copy-paste disable karo in exam area
- Right-click disable karo
- Warning popup: "Tab switch detected! 3rd warning = auto submit"
- Full-screen mode enforcement (Fullscreen API)

**Layer 4 — Time Controls:**
- Overall exam timer (countdown)
- Optional: per-question time limit
- Auto-submit when time expires
- Server-side time validation

**Layer 5 — Optional Webcam Proctoring:**
- Request webcam permission at exam start
- Periodic snapshots (every 2 min) stored in S3
- Face detection: alert if no face detected
- Only for high-stakes exams (admin configurable)

**Database:**

Table `exam_security_logs`:
- id, exam_id, student_id, event_type, event_data, timestamp
- event_type: tab_switch, copy_attempt, fullscreen_exit, ip_change, webcam_alert

Table `exam_security_settings` (per exam):
- exam_id, shuffle_questions, shuffle_options, ip_restriction, max_tab_switches, require_fullscreen, webcam_enabled, per_question_time_limit

**API Endpoints:**
- `POST /api/exams/{id}/security-settings` → admin sets security rules
- `GET /api/exams/{id}/security-log` → admin views student violations
- `POST /api/attempts/{id}/security-event` → client reports events
- `POST /api/attempts/{id}/webcam-snapshot` → upload snapshot

**Frontend:**
- Exam setup page: "Security Settings" section with toggles
- Student exam start: permission requests (fullscreen, camera)
- Violation warnings: modal overlay "Warning: Tab switch detected (1/3)"
- Admin monitoring panel: live view of active attempts with red flags
- Post-exam: security report per student (violations summary)

---

## PHASE 3: Intelligence & Insights

### Feature 5: Advanced Analytics Dashboard

**Analytics Metrics Required:**

1. **Item Analysis (per question):**
   - Difficulty Index = correct_answers / total_attempts
   - Discrimination Index = (top 27% score - bottom 27% score) / total students
   - Distractor Analysis (MCQ mein wrong options kitni baar chuni gain)

2. **Class Performance:**
   - Average, highest, lowest score per exam
   - Score distribution histogram
   - Pass/fail ratio

3. **Chapter-wise Performance:**
   - Per chapter average score (heatmap)
   - Weakest chapters identification
   - Progress over time (trend line)

4. **Student Progress (individual):**
   - Exam history graph
   - Strengths & weaknesses by chapter
   - Percentile rank

**API Endpoints:**
- `GET /api/analytics/exam/{exam_id}/item-analysis` → per question stats
- `GET /api/analytics/exam/{exam_id}/class-summary` → class overview
- `GET /api/analytics/chapter-performance` → params: class_id, subject_id
- `GET /api/analytics/student/{student_id}/progress` → student history
- `GET /api/analytics/school-overview` → admin: school-wide stats
- `GET /api/analytics/export/{exam_id}` → PDF/CSV report download

**Frontend Dashboard (React + Chart.js or Recharts):**
- Tab 1 "Class Overview": Score distribution bar chart, summary cards
- Tab 2 "Item Analysis": Table with color-coded difficulty
- Tab 3 "Chapter Heatmap": Grid with performance colors
- Tab 4 "Student Reports": Radar chart, timeline

**Export Options:**
- PDF report (with school logo, exam details, charts)
- Excel: raw data export
- Share link: generate temporary link for parent viewing

**Performance Optimization:**
- Pre-compute analytics after each exam submission (background job)
- Cache results in Redis (invalidate when new answers graded)
- For large schools (1000+ students): async computation with progress bar

---

### Feature 6: AI Question Generation

**API:**
- `POST /api/ai/generate-questions`
- Body: {source_text, class_id, subject_id, chapter_id, type, difficulty, count, language}

**Implementation:**
- Integrate: OpenAI GPT-4o or Anthropic Claude API
- Prompt engineering: subject-aware question generation
- Rate limit: 50 generations/teacher/day
- Table: ai_generation_logs (tokens_used, cost tracking)

**UI:**
- "Generate with AI" button → source input → settings → preview (editable) → save selected
- AI questions flagged with robot icon badge
- Go through same approval workflow if enabled

---

## PHASE 4: Extra High-Value Features

### Feature 7: Urdu / RTL Full Support
- CKEditor: enable RTL mode for question editor
- PDF export: Noto Nastaliq font for Urdu rendering
- i18n: all UI labels in Urdu (toggle in settings)
- Per-field RTL toggle in question form
- **Priority**: High (Pakistani market specific)

### Feature 8: Parent Portal + SMS Alerts
- Parent role: view child results, exam history, progress graph
- On result publish: auto SMS via Twilio/local gateway
- WhatsApp API integration (optional)
- Child progress dashboard with trend lines
- **Priority**: Medium-High

### Feature 9: Exam Schedule Calendar
- FullCalendar.js integration: all exams on calendar view
- Teacher: drag to reschedule
- Student: upcoming exams widget
- Auto reminders: 1 day before (email + SMS)
- iCal export
- **Priority**: Medium

### Feature 10: Offline Exam Mode (PWA)
- Service Worker: cache exam data at start
- IndexedDB: store answers locally during exam
- Auto-sync when internet restored
- Per-exam toggle: "Allow offline taking"
- **Priority**: High (Pakistan context mein critical)

---

## GENERAL IMPLEMENTATION RULES (apply to all features)

1. **No page reloads**: all actions via React state + API (optimistic UI)
2. **Toast notifications** for every action ("Saved ✓", "Error: Please try again")
3. **Auto-save drafts**: any form saves to drafts table on change (debounce 2s)
4. **Role-based access**: always check permissions server-side, not just frontend
5. **Mobile responsive**: all new UI components must work on tablet/phone
6. **Real-time**: Socket.IO broadcast for: question approved, exam results ready
7. **Soft deletes only**: never hard delete questions, papers, or results
8. **Audit log**: every significant action logged (who, what, when, IP)
9. **Error handling**: all API errors return `{success: false, error: "message"}`
10. **Pagination**: all list endpoints support `?page=&limit=` params

---

## TESTING REQUIREMENTS

- Unit tests for: grading logic, validation, permission checks
- Integration tests for: all new API endpoints
- E2E (Cypress): star question flow, bulk import flow, approval workflow
- Load test: 500 concurrent exam submissions
- Security test: role bypass attempts, SQL injection on search

---

## DELIVERABLES PER FEATURE

1. Database migration script
2. Backend API (with validation & error handling)
3. React components (with loading states & error states)
4. API documentation (Swagger/Postman collection)
5. Unit + integration tests

---

## Implementation Order Recommendation

1. **Bulk Import** ← sabse pehle (adoption blocker solve karta hai)
2. **Urdu RTL Support** ← market fit
3. **Star/Favorites** ← quick win, high teacher satisfaction
4. **Admin Approval** ← quality control
5. **Advanced Analytics** ← admin/principal ke liye
6. **Proctoring** ← online exam security
7. **AI Generation** ← wow factor
8. **Parent Portal + SMS** ← stakeholder satisfaction
9. **Offline Mode** ← reliability
10. **Collaborative Build** ← team feature

---

*End of Feature Implementation Plan*
