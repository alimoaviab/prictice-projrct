# 🏗️ EDUPLEXO - COMPLETE TECH STACK & ARCHITECTURE

## 📋 CURRENT TECH STACK

### **Frontend (React SPA)**
```
Framework: React 19.0.0
Build Tool: Vite 6.0.7
Language: TypeScript 5.9.3
Routing: React Router DOM 7.1.0
State Management: TanStack React Query 5.100.10
Styling: Tailwind CSS 4.2.4
Animations: 
  - Framer Motion 12.38.0
  - GSAP 3.15.0
  - Lenis 1.3.23 (smooth scroll)
Icons: Lucide React 0.469.0
Markdown: React Markdown 9.1.0
Testing: Vitest 2.1.8 + Testing Library
API Mocking: MSW 2.7.0
```

### **Backend (Go)**
```
Language: Go 1.25.0
Framework: Chi Router v5.2.1
Database Driver: pgx/v5 (PostgreSQL)
Database: PostgreSQL
Cache: Redis (go-redis/v9)
Authentication: JWT (golang-jwt/jwt/v5)
Password Hashing: bcrypt (golang.org/x/crypto)
WebSocket: Gorilla WebSocket 1.5.3
CORS: Chi CORS 1.2.1
Monitoring: Prometheus client 1.23.2
Environment: godotenv 1.5.1
Testing: Testify 1.11.1
```

### **Database**
```
Primary: PostgreSQL (via pgx/v5)
Cache: Redis
In-Memory (Dev): miniredis/v2 (for testing)
```

### **Infrastructure**
```
Containerization: Docker + Docker Compose
Reverse Proxy: (to be determined)
File Storage: (to be determined)
CDN: (to be determined)
```

---

## 🗄️ DATABASE ARCHITECTURE FOR QUESTION BANK

### **Current Database: PostgreSQL**

Based on your existing backend, here's the complete database structure needed for Question Bank & Paper Generation:

### **1. Core Hierarchy Tables**

```sql
-- Boards/Curriculum
CREATE TABLE boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  country VARCHAR(50),
  language VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Classes/Grades
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID REFERENCES boards(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) NOT NULL,
  level VARCHAR(50),
  display_order INT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(board_id, code)
);

-- Subjects
CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID REFERENCES boards(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) NOT NULL,
  subject_type VARCHAR(20),
  language VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(board_id, class_id, code)
);

-- Chapters/Units
CREATE TABLE chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  chapter_number VARCHAR(20),
  name VARCHAR(255) NOT NULL,
  name_urdu VARCHAR(255),
  code VARCHAR(50) NOT NULL,
  description TEXT,
  display_order INT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(subject_id, code)
);

-- Topics/Subtopics
CREATE TABLE topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
  topic_number VARCHAR(20),
  name VARCHAR(255) NOT NULL,
  name_urdu VARCHAR(255),
  code VARCHAR(50) NOT NULL,
  description TEXT,
  display_order INT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(chapter_id, code)
);
```

### **2. Question Management Tables**

```sql
-- Question Types
CREATE TABLE question_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  has_options BOOLEAN DEFAULT false,
  has_multiple_answers BOOLEAN DEFAULT false,
  display_order INT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default question types
INSERT INTO question_types (name, code, has_options, has_multiple_answers, display_order) VALUES
('Multiple Choice Questions', 'mcq', true, false, 1),
('Fill in the Blanks', 'fill_blanks', false, false, 2),
('True/False', 'true_false', true, false, 3),
('Short Answer', 'short_answer', false, false, 4),
('Long Answer', 'long_answer', false, false, 5),
('Match the Following', 'match_columns', true, false, 6),
('Tick Correct Spelling', 'tick_spelling', true, false, 7),
('Tick Correct Grammar', 'tick_grammar', true, false, 8),
('Missing Letters', 'missing_letters', false, false, 9),
('Singular Plural', 'singular_plural', false, false, 10),
('Translate to Urdu', 'translate_urdu', false, false, 11);

-- Questions (Main Table)
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  board_id UUID REFERENCES boards(id) ON DELETE SET NULL,
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  chapter_id UUID REFERENCES chapters(id) ON DELETE SET NULL,
  topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
  question_type_id UUID REFERENCES question_types(id) ON DELETE SET NULL,
  question_text TEXT NOT NULL,
  question_text_urdu TEXT,
  question_image_url TEXT,
  marks INT NOT NULL DEFAULT 1,
  difficulty VARCHAR(20) DEFAULT 'medium',
  time_estimate INT,
  explanation TEXT,
  explanation_urdu TEXT,
  tags JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- Question Options (for MCQs, etc.)
CREATE TABLE question_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  option_text_urdu TEXT,
  option_image_url TEXT,
  is_correct BOOLEAN DEFAULT false,
  display_order INT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Question Answers
CREATE TABLE question_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL,
  answer_text_urdu TEXT,
  answer_image_url TEXT,
  marking_scheme JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### **3. Paper Management Tables**

```sql
-- Papers
CREATE TABLE papers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  board_id UUID REFERENCES boards(id) ON DELETE SET NULL,
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  paper_name VARCHAR(255) NOT NULL,
  paper_type VARCHAR(50),
  syllabus_type VARCHAR(50),
  total_marks INT,
  total_questions INT,
  time_duration INT,
  instructions TEXT,
  instructions_urdu TEXT,
  paper_format JSONB DEFAULT '{}',
  is_template BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- Paper Sections
CREATE TABLE paper_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_id UUID REFERENCES papers(id) ON DELETE CASCADE,
  section_name VARCHAR(50) NOT NULL,
  section_title VARCHAR(255),
  instructions TEXT,
  display_order INT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Paper Questions (Junction)
CREATE TABLE paper_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_id UUID REFERENCES papers(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  section_name VARCHAR(50),
  question_number INT,
  marks_override INT,
  display_order INT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(paper_id, question_id)
);

-- Paper Templates
CREATE TABLE paper_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  template_name VARCHAR(255) NOT NULL,
  board_id UUID REFERENCES boards(id) ON DELETE SET NULL,
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  template_config JSONB DEFAULT '{}',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### **4. Import & Audit Tables**

```sql
-- Import Logs
CREATE TABLE import_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  imported_by UUID REFERENCES users(id) ON DELETE SET NULL,
  file_name VARCHAR(255),
  file_url TEXT,
  import_type VARCHAR(50),
  total_rows INT,
  success_count INT DEFAULT 0,
  error_count INT DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending',
  error_log JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Audit Logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### **5. Performance Indexes**

```sql
-- Questions indexes
CREATE INDEX idx_questions_school ON questions(school_id);
CREATE INDEX idx_questions_board ON questions(board_id);
CREATE INDEX idx_questions_class ON questions(class_id);
CREATE INDEX idx_questions_subject ON questions(subject_id);
CREATE INDEX idx_questions_chapter ON questions(chapter_id);
CREATE INDEX idx_questions_topic ON questions(topic_id);
CREATE INDEX idx_questions_type ON questions(question_type_id);
CREATE INDEX idx_questions_difficulty ON questions(difficulty);
CREATE INDEX idx_questions_marks ON questions(marks);
CREATE INDEX idx_questions_active ON questions(is_active);
CREATE INDEX idx_questions_tags ON questions USING GIN(tags);
CREATE INDEX idx_questions_created_at ON questions(created_at);
CREATE INDEX idx_questions_full_text ON questions USING GIN(to_tsvector('english', question_text));

-- Papers indexes
CREATE INDEX idx_papers_school ON papers(school_id);
CREATE INDEX idx_papers_board ON papers(board_id);
CREATE INDEX idx_papers_class ON papers(class_id);
CREATE INDEX idx_papers_subject ON papers(subject_id);
CREATE INDEX idx_papers_created_by ON papers(created_by);
CREATE INDEX idx_papers_created_at ON papers(created_at);

-- Audit logs indexes
CREATE INDEX idx_audit_school ON audit_logs(school_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_created_at ON audit_logs(created_at);
```

---

## 🔄 BACKEND API STRUCTURE (Go)

### **Directory Structure**
```
backend-go/
├── cmd/
│   ├── server/
│   │   └── main.go
│   └── seed/
│       └── main.go (seed question types, boards, etc.)
├── internal/
│   ├── domain/
│   │   ├── questions/
│   │   │   ├── questions.go (handlers)
│   │   │   ├── service.go
│   │   │   └── repository.go
│   │   ├── papers/
│   │   │   ├── papers.go
│   │   │   ├── service.go
│   │   │   └── repository.go
│   │   ├── boards/
│   │   ├── classes/
│   │   ├── subjects/
│   │   ├── chapters/
│   │   └── topics/
│   ├── api/
│   │   ├── middleware/
│   │   │   ├── auth.go
│   │   │   ├── rbac.go
│   │   │   └── audit.go
│   │   └── respond.go
│   ├── store/
│   │   └── postgres.go
│   ├── cache/
│   │   └── redis.go
│   └── config/
│       └── config.go
└── migrations/
    ├── 000020_boards.up.sql
    ├── 000021_classes.up.sql
    ├── 000022_subjects.up.sql
    ├── 000023_chapters.up.sql
    ├── 000024_topics.up.sql
    ├── 000025_question_types.up.sql
    ├── 000026_questions.up.sql
    ├── 000027_question_options.up.sql
    ├── 000028_question_answers.up.sql
    ├── 000029_papers.up.sql
    ├── 000030_paper_sections.up.sql
    ├── 000031_paper_questions.up.sql
    └── 000032_import_logs.up.sql
```

### **API Endpoints Structure**

```go
// Questions API
GET    /api/v1/questions                    // List questions with filters
GET    /api/v1/questions/:id                // Get single question
POST   /api/v1/questions                    // Create question
PUT    /api/v1/questions/:id                // Update question
DELETE /api/v1/questions/:id                // Delete question
POST   /api/v1/questions/import             // CSV import
GET    /api/v1/questions/export             // Export questions

// Papers API
GET    /api/v1/papers                       // List papers
GET    /api/v1/papers/:id                   // Get paper
POST   /api/v1/papers                       // Create paper
PUT    /api/v1/papers/:id                   // Update paper
DELETE /api/v1/papers/:id                   // Delete paper
POST   /api/v1/papers/:id/publish           // Publish paper
GET    /api/v1/papers/:id/pdf               // Generate PDF
POST   /api/v1/papers/generate              // Auto-generate paper

// Hierarchy API
GET    /api/v1/boards                       // List boards
GET    /api/v1/classes?board_id=:id         // List classes
GET    /api/v1/subjects?class_id=:id        // List subjects
GET    /api/v1/chapters?subject_id=:id      // List chapters
GET    /api/v1/topics?chapter_id=:id        // List topics

// Question Types API
GET    /api/v1/question-types               // List question types

// Templates API
GET    /api/v1/templates                    // List templates
POST   /api/v1/templates                    // Create template
GET    /api/v1/templates/:id                // Get template
DELETE /api/v1/templates/:id                // Delete template
```

---

## 🎨 FRONTEND STRUCTURE

### **Directory Structure**
```
school-react-app/src/
├── pages/
│   └── role/
│       └── admin/
│           └── question-papers/
│               ├── index.tsx (dashboard)
│               ├── question-bank/
│               │   ├── index.tsx (list)
│               │   ├── create.tsx
│               │   ├── edit/[id].tsx
│               │   └── import.tsx
│               ├── generate/
│               │   ├── syllabus.tsx
│               │   ├── classes.tsx
│               │   ├── subjects.tsx
│               │   ├── chapters.tsx
│               │   └── questions.tsx ✅ (current)
│               ├── papers/
│               │   ├── index.tsx (list)
│               │   ├── create.tsx
│               │   ├── edit/[id].tsx
│               │   └── preview/[id].tsx
│               └── templates/
│                   ├── index.tsx
│                   └── create.tsx
├── modules/
│   ├── questions/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types/
│   └── papers/
│       ├── components/
│       ├── hooks/
│       ├── services/
│       └── types/
├── data/
│   └── syllabus/ ✅ (existing)
└── services/
    ├── api.ts
    ├── questions.service.ts
    └── papers.service.ts
```

---

## 🔐 AUTHENTICATION & AUTHORIZATION

### **Current System**
- JWT-based authentication
- Token stored in HTTP-only cookie
- HMAC-SHA256 signing
- Role-based access control (RBAC)

### **Roles**
```go
const (
    RoleSuperAdmin  = "super_admin"
    RoleSchoolAdmin = "school_admin"
    RoleTeacher     = "teacher"
    RoleStudent     = "student"
)
```

### **Permissions for Question Bank**
```go
// Admin permissions
- questions:create
- questions:read
- questions:update
- questions:delete
- questions:import
- questions:export
- papers:create
- papers:read
- papers:update
- papers:delete
- papers:publish

// Teacher permissions
- questions:read
- questions:create (limited)
- papers:create
- papers:read (own)
- papers:update (own)
```

---

## 📦 DATA FLOW

### **Question Creation Flow**
```
Frontend (React)
    ↓ POST /api/v1/questions
Backend (Go Handler)
    ↓ Validate JWT
    ↓ Check RBAC permissions
    ↓ Validate request body
Service Layer
    ↓ Business logic validation
    ↓ Check duplicates
Repository Layer
    ↓ SQL query
PostgreSQL
    ↓ Insert question
    ↓ Insert options (if MCQ)
    ↓ Insert answer
    ↓ Create audit log
Cache (Redis)
    ↓ Invalidate question list cache
Response
    ↓ Return created question
Frontend
    ↓ Update UI
    ↓ Show success message
```

### **Paper Generation Flow**
```
Frontend
    ↓ User selects chapters
    ↓ Navigate to questions page
    ↓ GET /api/v1/questions?chapter_ids=1,2,3
Backend
    ↓ Check cache (Redis)
    ↓ If miss, query PostgreSQL
    ↓ Filter by chapters
    ↓ Return questions
Frontend
    ↓ Display questions
    ↓ User selects questions
    ↓ POST /api/v1/papers
Backend
    ↓ Create paper record
    ↓ Link questions to paper
    ↓ Calculate total marks
    ↓ Generate PDF (optional)
    ↓ Return paper ID
Frontend
    ↓ Navigate to paper preview
    ↓ Show success
```

---

## 🚀 SCALING ARCHITECTURE

### **Current State**
- Monolithic Go backend
- Single PostgreSQL instance
- Single Redis instance
- Direct HTTP requests

### **Future Scaling Needs**

#### **1. Caching Strategy**
```
Redis Layers:
- L1: Question list cache (5 min TTL)
- L2: Paper cache (10 min TTL)
- L3: Hierarchy cache (1 hour TTL)
- L4: User session cache (24 hour TTL)
```

#### **2. Queue System (Future)**
```
Use: RabbitMQ or Redis Queue
Jobs:
- CSV import processing
- PDF generation
- Bulk question creation
- Email notifications
```

#### **3. File Storage**
```
Current: Local filesystem
Future: S3-compatible storage
- Question images
- Generated PDFs
- Import CSV files
- Export files
```

#### **4. CDN (Future)**
```
CloudFlare or AWS CloudFront
- Static assets
- Generated PDFs
- Question images
```

#### **5. Database Scaling**
```
Phase 1: Single PostgreSQL with read replicas
Phase 2: Partitioning by school_id
Phase 3: Sharding by region
```

---

## 📊 MONITORING & OBSERVABILITY

### **Current**
- Prometheus metrics (already integrated)

### **Needed**
```
Logging: Structured JSON logs
Metrics: Prometheus + Grafana
Tracing: OpenTelemetry (future)
Alerts: AlertManager
Error Tracking: Sentry (future)
```

---

## 🔒 SECURITY CONSIDERATIONS

### **Current**
- JWT authentication ✅
- CORS protection ✅
- bcrypt password hashing ✅

### **Needed**
- Rate limiting (per user/IP)
- SQL injection prevention (use parameterized queries)
- XSS protection (sanitize inputs)
- CSRF tokens
- File upload validation
- API key rotation
- Audit logging ✅ (planned)

---

## 📝 SUMMARY

### **Your Current Stack**
✅ **Frontend**: React 19 + TypeScript + Vite + Tailwind + Framer Motion  
✅ **Backend**: Go 1.25 + Chi Router + PostgreSQL + Redis  
✅ **Auth**: JWT + bcrypt  
✅ **Database**: PostgreSQL (pgx driver)  
✅ **Cache**: Redis  
✅ **Testing**: Vitest + Testify  

### **What Needs to be Built**
🔨 Database migrations (17 new tables)  
🔨 Go API endpoints (Questions, Papers, Hierarchy)  
🔨 Frontend pages (Question Bank, Paper Generation)  
🔨 CSV import system  
🔨 PDF generation  
🔨 RBAC middleware  
🔨 Audit logging  

### **Future Enhancements**
🚀 AI question parsing  
🚀 Queue system for background jobs  
🚀 S3 file storage  
🚀 CDN integration  
🚀 Advanced analytics  
🚀 Multi-language support  

---

**Ready to start implementation? Let me know which part to build first!** 🚀
