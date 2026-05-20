# EduPlex: Integrated Assessment & Exams Platform Design

## Executive Summary

EduPlex aims to unify a Question Bank, Question Paper Builder, Exam/Test module, and Results/Analytics into one seamless workflow for teachers and administrators. Teachers can create and categorize questions (MCQ, short, long) by class, subject, chapter, difficulty and other tags; star or archive them; and instantly reuse them when building papers. The system supports multi-chapter papers, flexible section-mark distributions, and saveable paper templates with versioning. Exams/tests can be generated from any saved paper, delivered online or offline, auto-grading MCQs and aiding manual grading of subjectives. Results are published to students and parents, with dashboards and item-level analytics to inform teaching. Performance and security are paramount: all actions (adding questions, filtering, archiving, paper creation, grading) happen instantly with no page reloads (leveraging React state, live API, and websockets). Admins can moderate content (approve questions), set per-user or per-subject permissions, and ensure privacy/compliance. The platform's architecture and database schema (questions, options, stars, papers, exams, results, etc.) are designed for scalability and future AI features (alignment, generation, analytics), while maintaining core LMS compatibility. Below is a detailed blueprint of user roles, flows, features, data models, APIs, UI components, competitor analysis, roadmap, testing, and risks.

---

## User Personas and Roles

- **Teacher**: Primary user who creates questions, stars/favorites them, builds papers, conducts exams, grades submissions, and views results/analytics. May have per-subject or per-class access.
- **School Admin / Principal / Exam Controller**: Oversees the system, assigns user roles and access (who can add questions, moderate, create exams). Can review and approve submitted questions (moderation flow), manage classes/subjects/chapters, and view school-wide analytics.
- **Students**: End-users who take exams (online or paper-based). Receive score reports and performance feedback. No access to question bank or paper builder.
- **Parent (optional)**: Views their child's published results and progress.
- **Super-Admin (for multi-branch)**: Manages multiple schools or branches in a district setup, controls data isolation or cross-usage.
- **IT/DevOps**: Not an end-user, but responsible for deployment, scaling, backups, and integrating with existing SIS/other modules.

Each role has specific permissions: e.g., Teachers can add questions but may need Admin approval before questions are globally available (optionally only seen by themselves until approved). Admins can also Archive questions, revert archives, restore drafts, and manage templates. Students have only exam interfaces and result dashboards. All roles authenticate (SSO or school LMS accounts) and use web/Mobile UI with real-time updates.

---

## User Flows

### Question Bank Workflow

**Create Question**: Teacher clicks "Add Question" → opens a side-drawer form (no page reload). Fills Class, Subject, Chapter, Difficulty, Question Type (MCQ/short/long). Uses a rich-text editor (supporting multilingual text, images, equations). If MCQ, fields for options A–D and correct answer appear. Teacher can assign marks to each question (a requirement in many schools). Teacher optionally tags a question as Favorite/Starred for quick reuse (future feature). Click Save.

- **Backend**: POST /api/questions with data. Server assigns status=pending by default. The new question is saved in DB (questions, question_options).
- **Immediate UI**: Without reload, the question appears in the bank list (depending on filters). If admin approval is enabled, it shows as pending (visible only to creator). A success toast appears; the drawer closes. Draft autosave ensures partial entries (on timeout or nav-away) save to drafts table.

**Search & Filters**: Teacher uses instant search (on question text) and filters by Class, Subject, Chapter, Type, Difficulty (UI dropdowns). This triggers API calls (/api/questions?search=...&class_id=...) and updates the list via React state. Filtering is instant (no reload).

**Star/Archive**: Each question card shows Star (★) and Archive (🗄) buttons. Star toggles a question_stars record. Archive sets status=archived in DB and removes from active lists. Archived items move to a separate "Archived Questions" view (only admins see and can restore) – old exams keep using them.

**Question Approval (Moderation)**: When a teacher adds a question, it may enter status=pending. The Super Admin / Exam Controller sees a list of pending questions for each subject. They can Approve (set status=active) or Reject/Archive (move to archived). Approved questions become available to all teachers; rejected only remain visible to creator. This ensures quality control and aligns with practices in large institutions.

### Paper/Template Builder Flow

**Start Paper**: Teacher selects "Create New Paper". Chooses Class, Subject. The UI fetches all Chapters for that subject. It shows a checklist of chapters. Teacher selects one or more chapters (multi-select to support half-book/full-book tests). A "Select All Chapters" option enables full-book quickly.

**Define Sections**: Teacher adds Sections: e.g., Section A (MCQs), Section B (Short Qs). For each section, teacher enters Title/Instructions, total marks for section, and question count (or can allow auto-count). They also specify question type filter (MCQ/short/long). The UI may offer a template (from saved paper formats) to pre-populate sections (Future).

**Add Questions**: For each section, teacher can Auto-generate (pull random appropriate questions from selected chapters) or Manually pick. For manual pick, a filtered list of relevant questions (matching section's filters) is shown; teacher drags/drops or clicks to add them to the section (with marks per question displayed). They can reorder questions within the section via drag-and-drop. The system auto-numbers the questions (Q1, Q2…).

**Auto-gen/Picking Logic**: E.g., Section A (5 MCQs worth 1 mark each): the system shuffles and picks any 5 MCQs from the question bank with status=active that match the selected chapters. If teacher wants, they can regenerate different random sets (for Set A/Set B exam variants). The UI shows a loading indicator but no full page reload (partial AJAX).

**Save Paper (Template)**: Teacher can save this structure as a Paper Template: enters a title and marks it "Reusable." This creates a question_papers record with is_template=true. Saved papers appear in a Paper Library (filterable by class/subject) for future reuse. They can also Duplicate a saved paper or Restore Version (if versioning is supported).

**Export**: Teacher may immediately export the paper to PDF/Word via a "Print" button. PDF export uses a template (with header, logo). Answers (keys) can be included or hidden.

### Exam/Test Flow

**Create Exam**: From the list of Saved Papers or templates, teacher clicks "Create Exam". They enter Exam metadata: date, time limit, instructions, passing marks, and choose a delivery mode (Paper / Online / LMS). One click loads the paper structure, questions and total marks into an exams entity.

**Student Test Taking**: Students see an interface (if online) with sections as defined. MCQs and short questions are multiple-choice/empty-answer fields. They answer and submit. The system logs time and prevents multiple attempts beyond settings. IP restrictions or SSO login can lock access.

**Auto-Grading**: Upon submission, MCQs (objective questions) are graded instantly by matching student answer to the key; partial credit if applicable (multiple-select). The system updates a results record. Remaining questions (essays, long answers) appear to the teacher in a Grading Queue in the UI; they assign marks and feedback manually. Once all answers graded, total score and analytics for that exam are finalized.

**Answer Key**: The system can auto-generate an answer key document for proctors or print-outs.

### Results & Analytics

**Publish Results**: Once grading is complete, teacher clicks "Publish Results." Students (and parents) see their scores on a dashboard, optionally with feedback.

**Analytics Dashboard**: School leaders view aggregate reports (item analysis, per-chapter performance). For example, a heatmap of correct/incorrect by chapter, difficulty-index of each question. Teachers see which questions were hardest (discrimination index) and class averages per concept. Performance graphs (score distributions) can identify outliers. This informs future teaching.

Each step uses real-time updates (via WebSocket or long-polling) so multiple users see changes (e.g. new question available to all once approved).

---

## Key Features (MVP, Next, Future)

| Category | Feature | Priority | Notes |
|----------|---------|----------|-------|
| Question Bank | MCQ, Short, Long Q support | MVP | Typed question text (rich editor), tags, marks. Categorize by Class, Subject, Chapter, Difficulty. |
| Question Bank | Chapter-wise / Multi-chapter tagging | MVP | Questions must belong to a chapter. Paper builder filters by chapter. |
| Question Bank | Rich Text Editor (with Urdu support, Math, Images) | MVP | Use advanced editor (Quill/CKEditor). |
| Question Bank | Search & Filters (instant) | MVP | Real-time search; filters by class, subject, chapter, type, difficulty. |
| Question Bank | Star/Favorite questions | Next | Allow teachers to bookmark questions for quick reuse. |
| Question Bank | Archive (soft delete) | MVP | Teachers can archive obsolete questions (won't delete from DB). |
| Question Bank | Admin Approval workflow | Next | New questions (pending) require admin approval to be global (optionally). Pending questions visible only to creator. |
| Question Bank | Version Control / Edit history | Future | Track edits to questions. |
| Paper Builder | Section-based structure (A:MCQ, B:Short, etc.) | MVP | Teachers define sections with titles, marks and number of Qs. |
| Paper Builder | Multi-chapter selection | MVP | Paper can include Qs from several chapters (e.g. half-book paper). |
| Paper Builder | Auto/Preset Templates | MVP | Save format (e.g. JEE/Board template with sections). Branded PDF exports. |
| Paper Builder | Reuse Saved Papers (Templates) | MVP | Saved papers as templates (is_template flag). Duplicate or reuse for new exam. |
| Paper Builder | Auto-generate Papers (random selection) | Next | Select criteria (# MCQs from easy, medium, hard); system picks from bank. |
| Paper Builder | PDF/Word Export (print-ready, with logo/watermark) | MVP | Export completed paper/answer key to DOCX/PDF. |
| Paper Builder | Question Limit per section | MVP | Enforce section Q count automatically. |
| Paper Builder | Combine multiple saved papers (exam blueprint) | Next | Use existing papers to assemble a final exam (template inheritance). |
| Exams/Tests | Create Exam from Paper | MVP | One-click "Use in Test/Exam" on paper template. Load paper structure into exam entity. |
| Exams/Tests | Student Interface (Web/Mobile) | MVP | Responsive test-taking UI; mobile-ready. |
| Exams/Tests | Auto-grade MCQs (and other auto-gradable Qs) | MVP | Instant grading on submission. |
| Exams/Tests | Manual grading for essays/shorts | MVP | Teacher marks open-ended responses in interface; rubrics supported. |
| Exams/Tests | Exam Security (proctoring, lockdown) | Next | Anti-cheat: question/option shuffling, time limits, IP restrictions, optional webcam proctoring. |
| Exams/Tests | Scheduling/Calendar Integration | Next | Schedule exam on calendar, notify students/parents. |
| Exams/Tests | Bulk Test-taking (off-paper) | MVP | Generate OMR/QP, or accept scanned uploads. |
| Results & Analytics | Publish Results to Student Portal | MVP | Students see scores and basic feedback; parents see child's scores. |
| Results & Analytics | Item Analysis Reports | Next | Show difficulty index, discrimination index. |
| Results & Analytics | Class-wise/Syllabus Analytics | Next | Performance by chapter, question type; identify weak topics. |
| Results & Analytics | Custom Reporting (Export) | Next | CSV/PDF reports of results for management. |
| User Experience | Instant, No-Reload Actions | MVP | Use React/Redux or Vue; API updates via fetch/Axios. Provide UX hints ("Saving...Saved"). |
| User Experience | Draft Auto-Save | MVP | Auto-save question/paper drafts (on field change or interval) to drafts; recover on return. |
| User Experience | Mobile/Web Responsive | MVP | Works on tablets/phones for test-taking; admin can use on desktop. |
| User Experience | Localization (multi-language) | Next | Support Urdu and other languages in questions and UI. |
| Administration | Role-based Access Control | MVP | Permissions by user role and subject/chapter. |
| Administration | Multi-Institute Support | Future | Separate workspaces per school/branch. |
| Administration | Integration with LMS/SSO | Future | OAuth/SSO login; feed results to gradebook. |
| Performance & Scalability | Real-time Updates (WebSockets) | MVP | Live update question counts, exam status, etc. |
| Performance & Scalability | Optimized Search/Filter | MVP | Use indexed queries or ElasticSearch for large question banks. |
| Performance & Scalability | Bulk Import/Export | Next | Import questions from Excel or SCORM. |
| Security & Privacy | Encryption (AES-256, TLS) | MVP | Store data securely (GDPR/FERPA ready). |
| Security & Privacy | Audit Logs | Next | Track changes to questions/papers (who did what when). |
| Security & Privacy | Compliance Reports | Future | Data retention, audit logs for accreditation. |

---

## Data Model (Schema)

### Core Tables

**classes** (id, name, grade_level, school_id)

**subjects** (id, class_id, name)

**chapters** (id, subject_id, class_id, title, chapter_number, status)

**users** (id, name, email, role, school_id)

**questions** (id, school_id, created_by, class_id, subject_id, chapter_id, type, difficulty, question_html, marks, created_at, status, visibility, approval_status, approved_by, approved_at)

**question_options** (id, question_id, text, is_correct, option_label)

**question_stars** (user_id, question_id, starred_at)

**question_papers** (id, school_id, created_by, class_id, subject_id, title, status, total_marks, instructions, version, is_template, created_at)

**paper_sections** (id, paper_id, section_title, instructions, total_marks, sort_order)

**paper_items** (paper_id, question_id, section_id, marks, sort_order)

**question_paper_drafts** (id, teacher_id, school_id, draft_json, updated_at)

**exams** (id, school_id, created_by, paper_id, title, date, time_limit, status, total_marks, created_at)

**exam_attempts** (id, exam_id, student_id, start_time, submit_time, status)

**exam_answers** (attempt_id, question_id, answer_text, is_correct, marks_obtained)

**results** (exam_id, student_id, total_score, grade, published_at)

**question_approvals** (id, question_id, approver_id, status, timestamp)

### Relationships

- questions ⇄ question_options: one-to-many
- questions ⇄ classes/subjects/chapters: one each (tags)
- paper_sections belongs to question_papers
- paper_items links question_papers to questions
- exams references a question_papers
- exam_answers references an exam_attempts (per student attempt) and a question
- All tables contain school_id for multi-tenant isolation

---

## API Design

All APIs require authenticated requests (JWT or session). Responses in JSON.

### Questions
- `GET /api/questions` – list (filter params: class, subject, chapter, type, difficulty, search, status)
- `POST /api/questions` – create new question
- `GET /api/questions/{id}` – fetch question details
- `POST /api/questions/{id}/star` – toggle star for current user
- `POST /api/questions/{id}/archive` – archive question
- `PUT /api/questions/{id}` – update question content
- `POST /api/questions/{id}/approve` – admin approves (pending → active)

### Papers (Templates)
- `GET /api/papers` – list saved paper templates
- `POST /api/papers` – create a new paper
- `GET /api/papers/{id}` – get paper details with sections and items
- `PUT /api/papers/{id}` – update
- `POST /api/papers/{id}/duplicate` – copy paper
- `POST /api/papers/{id}/publish` – finalize paper
- `DELETE /api/papers/{id}` – soft-delete/archive

### Sections
- `POST /api/papers/{id}/sections` – add section
- `PUT /api/sections/{id}` – update section
- `DELETE /api/sections/{id}`

### Paper Items
- `POST /api/papers/{paper_id}/items` – add question to section
- `DELETE /api/papers/{paper_id}/items/{question_id}` – remove question

### Exams
- `GET /api/exams` – list exams
- `POST /api/exams` – create exam (from paper)
- `GET /api/exams/{id}` – get exam info
- `PUT /api/exams/{id}` – update exam
- `POST /api/exams/{id}/publish` – make exam active
- `GET /api/exams/{id}/results` – get aggregated results

### Attempts & Answers
- `POST /api/exams/{exam_id}/attempts` – student starts test
- `POST /api/exams/{exam_id}/attempts/{attempt_id}/answers` – submit answers
- `POST /api/exams/{exam_id}/attempts/{attempt_id}/submit` – submit exam; triggers auto-grading
- `GET /api/exams/{exam_id}/attempts/{attempt_id}` – get attempt results

### Results
- `GET /api/exams/{exam_id}/results` – overall results, analytics
- `GET /api/users/{user_id}/results` – for student/parent dashboard

### Analytics
- `GET /api/analytics/exams/{exam_id}` – item analysis
- `GET /api/analytics/chapter-performance` – performance by chapter/class

### Chapters
- `GET /api/chapters` – list (filter by class_id, subject_id)
- `POST /api/chapters` – create chapter
- `POST /api/chapters/{id}/archive` – archive
- `POST /api/chapters/reorder` – reorder

### Drafts
- `POST /api/paper-drafts/save` – save/update draft
- `GET /api/paper-drafts/load` – load existing draft
- `DELETE /api/paper-drafts` – discard draft

---

## UI Components & Wireframes

### Login/Splash
School branding; redirect to admin/teacher panel after auth.

### Sidebar Navigation
Items: Dashboard, Question Bank, Question Papers, Chapters, Create Exam/Paper, Exam Calendar, Results, Archived Questions, Settings.

### Question Bank Page
Grid or list of question cards. Each card shows a preview of question text, type icon (MCQ/Short/Long), difficulty, subject/chapter labels, marks, and star/archive icons. Top filters (dropdowns for Class, Subject, Chapter, Type, Difficulty) and search box. "Add Question" button prominent.

### Add Question Modal
Side-drawer form: dropdowns (Board, Class, Subject, Chapter); rich-text editor; if MCQ then option inputs; difficulty dropdown; marks input; Save/Cancel. Real-time preview or WYSIWYG. On Save, validation, then API call, then close.

### Paper Builder Page
Multi-step form:
1. Select Class → Subject → show chapters (checkbox list)
2. Define Sections: List of sections (A, B, etc). Each section row has Title, instructions, # of Qs, marks
3. Add Questions: For each section, a panel showing available questions (filtered). Teacher clicks to add; can drag to reorder

### Saved Papers Library
Table or cards of saved papers: Title, Class, Subject, Chapters, Created Date, Creator. Actions: Open, Duplicate, Delete, Create Exam.

### Create Exam Page
Choose a saved paper, then enter exam metadata. Preview of selected paper shown on side.

### Exam Taking (Student) UI
Responsive quiz interface. Section headings, questions with answer fields. Timer and progress indicators.

### Grading Interface
List of pending responses for teachers. For each student answer, teacher types marks and optional feedback.

### Results Dashboard
Graphs: class score distribution, pie/radar by chapters. Table of student scores. Filters by exam and class.

---

## Competitor Feature Comparison

| Feature / Product | EduPlex (ours) | eSkooly | CampusOnClick | OpenEduCat | Eklavvya |
|---|---|---|---|---|---|
| Q Bank (class/subject tags) | Yes | Yes | Yes | Yes | Yes |
| Multi-Chapter Papers | Yes | Not explicitly | Yes | Yes | Yes |
| Question Types (MCQ, Short, Long) | Yes | Yes | Yes | Yes | Yes |
| Star/Favorite Q | Planned (Next) | No | No | No | No |
| Archive Q (soft delete) | Yes | No | No | No | Yes |
| Admin Approval | Planned (Next) | No | No | No | Yes |
| Question Drafts | Yes (auto-save) | No | No | Yes | Yes |
| Search & Filter (instant) | Yes (fast UI) | Yes | Yes | Yes | Yes |
| Auto-Paper Generation | Planned (Next) | Yes | Yes | Yes | Yes |
| Custom Sections/Template | Yes | Yes | No | Yes | Yes |
| Multiple Versions (A/B) | Yes (planned) | Implicit | Yes | Yes | Yes |
| Answer Key Auto-gen | Yes (planned) | No | Yes | Yes | Yes |
| Online Exam / Auto-Grade | Yes (built-in) | No | Basic | Yes | Yes |
| Manual Marking (subjective) | Yes | No | No | Yes | Yes |
| Result Analytics | Yes (basic) | No | Partial | Yes | Yes |
| PDF Export/Print | Yes | Yes | No | Yes | Yes |
| Security / Compliance | Yes (SSO, roles) | Basic | Yes | Yes | Yes |
| AI Question Generation | Future | No | No | No | Yes |

---

## Technical Architecture & Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React (TypeScript), Redux/MobX, Quill/CKEditor, React DnD, Chart.js |
| Backend | Node.js (Express) or Go (current EduPlex backend) |
| Database | PostgreSQL (with full-text search) or MySQL |
| Caching/Search | Redis cache; Elasticsearch (for large-scale search) |
| Real-time | Socket.IO (WebSocket) or Pusher |
| Storage | AWS S3 for media/files |
| DevOps | Docker + Kubernetes, CI/CD (GitHub Actions) |
| Authentication | OAuth2/JWT, LDAP/SSO integration |
| Security | TLS/SSL, AES-256 encryption, OWASP best practices |
| Mobile | Responsive UI, optional React Native or Ionic app |
| Monitoring | Prometheus/Grafana, Sentry for errors |
| CI Testing | Jest (frontend), Go test (backend), Cypress (E2E) |

---

## Roadmap & Rollout Plan

### MVP (Months 1–4)
Core Q bank (add/search/filter), simple paper builder (manual question selection, sections), saving papers, exporting to PDF, exam scheduling, basic student test interface, auto MCQ grading, publish results.

### Next (Months 5–8)
Star favorites, admin approval flow, bulk import via Excel, question drafts auto-save, versioning templates, enhanced analytics (charts, item stats), mobile responsiveness, role-based permissions refinement, multi-branch support.

### Future (Months 9+)
AI integration (auto-generate questions from syllabus), advanced anti-cheat (proctoring API), community question sharing, LMS integrations (gradebook sync, LTI), student/parent mobile apps.

---

## Testing & Quality Assurance

- **Unit Tests**: For all backend logic (grading, query filters, calculations) and UI components. Aim ≥80% coverage.
- **Integration Tests**: API endpoints tested with tools like Postman/Newman or Go test. Ensure DB migrations, search functionality, and multi-table operations work.
- **E2E Tests**: Cypress or Selenium to simulate teacher and student workflows.
- **Performance Testing**: Load test for concurrent users (multiple teachers adding Qs simultaneously, many students taking exams).
- **Security Testing**: Penetration tests on login/role access. Verify data isolation.
- **User Acceptance**: Beta with friendly schools to refine UI.
- **Accessibility**: Basic WCAG compliance (alt text, keyboard navigation).

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Data Loss/Editing | Auto-save drafts (to DB/localStorage) frequently. Prompt recovery on return. |
| Performance Bottlenecks | Optimize DB indices, use Redis caching, shard DB per school if needed. |
| Security (Cheating) | Authenticate all exam access, randomize questions/answers, time-limit per question. Encrypt data at rest. |
| Scalability (Usage Spikes) | Cloud auto-scaling; separate read-replica DB for analytics; queue-grade essays asynchronously. |
| Adoption Resistance | UX focus: ensure flows match real habits. Provide training and support. |
| Migration from Legacy | Provide CSV import tools for questions and students. |
| Internet Dependency | Implement periodic local autosave; allow offline data entry and sync. |
| Regulatory Compliance | Follow FERPA/GDPR guidelines. Allow data export/deletion per request. |

---

## Appendix: Flow Diagram

```
Teacher → Create Question → Question Bank (Active/Pending)
                                    ↓
                            Admin Approves
                                    ↓
Teacher → Select Class/Subject/Chapters → Filtered Questions
                                    ↓
Teacher → Define Sections, Add Qs → Paper (Template)
                                    ↓
Teacher → Select Paper, Set Date → Exam
                                    ↓
Students → Take Exam → Auto-grade MCQs + Manual Grade Essays
                                    ↓
                              Results → Publish → Student Dashboard
                                    ↓
                              Analytics Report → Admin/Teacher
```

---

*Sources: This design references feature descriptions from eSkooly, CampusOnClick, GeniusEduSoft, OpenEduCat, Yoctel (Chronon), IPSR QnSmarti, QuestGen, EdutorAI, Eklavvya, ProProfs, and FlexiQuiz.*
