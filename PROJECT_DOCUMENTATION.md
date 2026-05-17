# Eduplexo — Complete Project Documentation

## 1. Project Overview

**Eduplexo** is a multi-tenant School Management SaaS (Software as a Service) platform. It provides a complete ERP solution for schools — managing students, teachers, attendance, exams, fees, timetables, and more — all accessible through role-based dashboards.

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend (School) | React 19 + Vite 6 + TypeScript + TailwindCSS |
| Frontend (Super Admin) | React + Vite + TypeScript + TailwindCSS |
| Frontend (Landing) | React + Vite + TypeScript + TailwindCSS |
| Backend | Go (Golang) + Chi Router |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| AI | Google Gemini 2.0 Flash |
| Realtime | WebSocket (gorilla/websocket) |
| Deployment | Docker Compose + Nginx + Let's Encrypt |
| Frontend Hosting | Vercel (3 separate apps) |

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              INTERNET                                        │
└─────────────────────────────────────────────────────────────────────────────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│  eduplexo.com   │   │ app.eduplexo.com│   │admin.eduplexo.com│
│  (Landing Page) │   │  (School App)   │   │  (Super Admin)  │
│   Vercel CDN    │   │   Vercel CDN    │   │   Vercel CDN    │
└─────────────────┘   └────────┬────────┘   └────────┬────────┘
                               │                      │
                               ▼                      ▼
                    ┌──────────────────────────────────────┐
                    │        api.eduplexo.com              │
                    │     Nginx (SSL + Rate Limiting)      │
                    └──────────────────┬───────────────────┘
                                       │
                    ┌──────────────────────────────────────┐
                    │         Go Backend (:8080)           │
                    │  • REST API (100+ endpoints)        │
                    │  • WebSocket (real-time)            │
                    │  • JWT Authentication               │
                    │  • RBAC (5 roles × 22 features)    │
                    │  • AI Chatbot (Gemini)              │
                    └──────────┬───────────┬──────────────┘
                               │           │
                    ┌──────────┴──┐  ┌─────┴──────────┐
                    │ PostgreSQL  │  │     Redis       │
                    │  16-alpine  │  │   7-alpine      │
                    │  38 tables  │  │  Cache + PubSub │
                    │  98 indexes │  │  Job Queue      │
                    └─────────────┘  └─────────────────┘
```

---

## 2. User Roles & Permissions

Eduplexo has **5 user roles** with a comprehensive RBAC (Role-Based Access Control) matrix:

### Role Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                     SUPER ADMIN                              │
│  Platform owner — manages all schools, billing, analytics   │
└─────────────────────────────┬───────────────────────────────┘
                              │
┌─────────────────────────────┴───────────────────────────────┐
│                     SCHOOL ADMIN                             │
│  School owner — full control over their school's data       │
└──────────┬──────────────────────────────────┬───────────────┘
           │                                  │
┌──────────┴──────────┐            ┌──────────┴──────────┐
│      TEACHER        │            │       PARENT        │
│  Manages classes,   │            │  Views child's      │
│  attendance, exams  │            │  academic data      │
└─────────────────────┘            └─────────────────────┘
                                              │
                                   ┌──────────┴──────────┐
                                   │      STUDENT        │
                                   │  Views own data,    │
                                   │  submits homework   │
                                   └─────────────────────┘
```

### Permission Matrix

| Feature | Super Admin | Admin | Teacher | Parent | Student |
|---------|:-----------:|:-----:|:-------:|:------:|:-------:|
| Platform Management | ✅ Full | ❌ | ❌ | ❌ | ❌ |
| School Management | ✅ Full | ❌ | ❌ | ❌ | ❌ |
| Students | ❌ | ✅ Full | 👁 View | 👁 View | 👁 View |
| Teachers | ❌ | ✅ Full | 👁 View | ❌ | ❌ |
| Classes | ❌ | ✅ Full | 👁 View | 👁 View | 👁 View |
| Subjects | ❌ | ✅ Full | 👁 View | 👁 View | 👁 View |
| Attendance | ❌ | ✅ Full | ✏️ Create/Update | 👁 View | 👁 View |
| Exams | ❌ | ✅ Full | ✏️ Create/Update | 👁 View | 👁 View |
| Results | ❌ | ✅ Full | ✏️ Create/Update | 👁 View | 👁 View |
| Homework | ❌ | ✅ Full | ✏️ Create/Update | 👁 View | 👁 View |
| Fees | ❌ | ✅ Full | 👁 View | 👁 View | 👁 View |
| Behavior | ❌ | ✅ Full | ✏️ Create/Update | 👁 View | ❌ |
| Leave | ❌ | ✅ Full | ✏️ Create | 👁 View | ✏️ Create |
| Events | ❌ | ✅ Full | 👁 View | 👁 View | 👁 View |
| Timetable | ❌ | ✅ Full | 👁 View | 👁 View | 👁 View |
| Announcements | ❌ | ✅ Full | 👁 View | 👁 View | 👁 View |
| Live Classes | ❌ | ✅ Full | ✏️ Schedule | 👁 View | 👁 View |
| Settings | ❌ | ✅ Full | 👁 View | 👁 View | 👁 View |
| AI Chatbot | ❌ | ✅ Use | ✅ Use | ❌ | ❌ |
| Subscription | ❌ | ✅ Manage | ❌ | ❌ | ❌ |
| Finance | ✅ Full | ❌ | ❌ | ❌ | ❌ |

---

## 3. All Modules (Features)

### Module 1: Authentication & Authorization

**Real-Life Example:** A teacher opens the app → enters email/password → system verifies credentials → issues JWT token → redirects to teacher dashboard.

```
User (Browser)                    Backend                      Database
     │                               │                            │
     │── POST /api/auth/login ──────▶│                            │
     │   {email, password}           │── Find user by email ─────▶│
     │                               │◀── User record ────────────│
     │                               │── Verify password          │
     │                               │── Generate JWT token        │
     │◀── {token, user} ────────────│                            │
     │                               │                            │
     │── GET /api/students ─────────▶│                            │
     │   Header: Bearer {token}      │── Decode JWT               │
     │                               │── Check role permissions   │
     │                               │── Filter by school_id ────▶│
     │◀── {students[]} ─────────────│◀── Filtered results ───────│
```

**Data Flow:**
- Login → JWT issued with claims: `user_id`, `school_id`, `role`, `active_academic_year_id`
- Every API call → JWT verified → school_id extracted → data filtered by tenant
- Academic year switching → new JWT issued with updated year claim

---

### Module 2: Student Management

**Real-Life Example:** Admin adds a new student "Ahmed Ali" to Class 5-A → system checks subscription limit → creates student record → links to class → parent can now see child's data.

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Admin Form  │────▶│  Backend API │────▶│ Subscription │────▶│  PostgreSQL  │
│              │     │              │     │ Limit Check  │     │              │
│ Name: Ahmed  │     │ POST /api/   │     │              │     │ students     │
│ Class: 5-A   │     │ students     │     │ 150/200 ✓    │     │ table        │
│ Roll: 101    │     │              │     │              │     │              │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

**Key Features:**
- CRUD operations (Create, Read, Update, Delete)
- Subscription-based student limit enforcement
- Parent linking (auto-creates parent account)
- Class assignment with section
- Academic year isolation
- Search, filter, pagination

---

### Module 3: Teacher Management

**Real-Life Example:** Admin creates teacher "Sir Imran" → system creates teacher record + companion user account → teacher can now login with their email → assigned to classes and subjects.

**Data Flow:**
```
Admin creates teacher
       │
       ▼
┌─────────────────────────────────────────┐
│ 1. Create Teacher record                │
│    (name, email, phone, qualification)  │
│                                         │
│ 2. Create companion User account        │
│    (email, password, role="teacher")    │
│                                         │
│ 3. Link to Classes (class_teachers)     │
│                                         │
│ 4. Link to Subjects (teacher_subjects)  │
└─────────────────────────────────────────┘
       │
       ▼
Teacher can now login → sees assigned classes → marks attendance → creates exams
```

---

### Module 4: Class & Subject Management

**Real-Life Example:** Admin creates "Class 10-A" → assigns class teacher "Sir Imran" → adds subjects (Math, English, Science) → sets capacity to 40 students.

**Data Relationships:**
```
                    ┌─────────────┐
                    │    Class    │
                    │  "10-A"    │
                    └──────┬──────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
    ┌─────┴─────┐   ┌─────┴─────┐   ┌─────┴─────┐
    │ Students  │   │ Subjects  │   │ Teachers  │
    │ (35/40)   │   │ Math,Eng  │   │ Sir Imran │
    │           │   │ Sci,Urdu  │   │ Miss Sara │
    └───────────┘   └───────────┘   └───────────┘
```

---

### Module 5: Attendance System

**Real-Life Example:** Teacher opens Class 5-A attendance → marks 30 students present, 3 absent, 2 late → system saves bulk attendance → parent gets notification that child is absent.

```
Teacher marks attendance
       │
       ▼
POST /api/attendance/mark
{
  class_id: "cls_5a",
  date: "2025-05-17",
  records: [
    {student_id: "st_1", status: "present"},
    {student_id: "st_2", status: "absent"},
    {student_id: "st_3", status: "late"}
  ]
}
       │
       ▼
┌─────────────────────────────────────┐
│ Backend processes bulk insert        │
│ • Validates all student IDs         │
│ • Upserts (update if exists)        │
│ • Calculates daily percentage       │
│ • Invalidates Redis cache           │
│ • Updates dashboard stats           │
└─────────────────────────────────────┘
       │
       ▼
Parent opens app → sees "Your child was absent today"
```

---

### Module 6: Exam & Results System

**Real-Life Example:** Admin creates "Mid-Term Exam" for Class 10 → adds subjects (Math: 100 marks, English: 100 marks) → Teacher enters marks → System calculates grades → Parent sees report card.

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Create Exam │────▶│ Enter Marks │────▶│ Auto Grade  │────▶│ Report Card │
│             │     │             │     │             │     │             │
│ Mid-Term    │     │ Ahmed: 85   │     │ Ahmed: A    │     │ Parent sees │
│ Math: 100   │     │ Sara: 72    │     │ Sara: B+    │     │ child marks │
│ Eng: 100    │     │ Ali: 45     │     │ Ali: C      │     │ & grades    │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

**Grade Calculation:**
- Configurable per class (grade thresholds)
- Multi-subject support (each subject has its own max marks)
- Aggregate percentage calculation
- Performance charts for parents

---

### Module 7: Fee Management System

**Real-Life Example:** Admin configures "Tuition Fee: PKR 5000/month" for Class 5 → System generates monthly invoices for all 35 students → Parent pays → Receipt generated → Dashboard shows collection stats.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        FEE LIFECYCLE                                     │
│                                                                         │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐           │
│  │ Fee Type │──▶│ Class Fee│──▶│ Generate │──▶│ Invoice  │           │
│  │ "Tuition"│   │ Config   │   │ Monthly  │   │ Per      │           │
│  │ PKR 5000 │   │ Class 5  │   │ Invoices │   │ Student  │           │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘           │
│                                                      │                 │
│                                                      ▼                 │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐           │
│  │ Receipt  │◀──│ Payment  │◀──│ Adjust   │◀──│ Due      │           │
│  │ Generated│   │ Recorded │   │ Discount │   │ Notice   │           │
│  │          │   │ PKR 5000 │   │ -500     │   │ Sent     │           │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘           │
└─────────────────────────────────────────────────────────────────────────┘
```

**Fee Types:** Tuition, Transport, Lab, Library, Sports, Exam, Admission
**Adjustment Types:** Discount, Waiver, Penalty, Scholarship
**Payment Methods:** Cash, Bank Transfer, Online, Cheque

---

### Module 8: Homework System

**Real-Life Example:** Teacher assigns "Math Chapter 5 exercises" to Class 8-A → due in 3 days → Students see homework in their portal → Submit online → Teacher grades.

**Data Flow:**
```
Teacher creates homework
       │
       ▼
System auto-creates submission entries for all students in class
       │
       ▼
Student sees homework → submits → status changes to "submitted"
       │
       ▼
Teacher reviews → grades → feedback sent → parent notified
```

---

### Module 9: Timetable Management

**Real-Life Example:** Admin creates weekly timetable for Class 10-A → Monday Period 1: Math (Sir Imran, Room 201) → Period 2: English (Miss Sara, Room 202) → Students and teachers see their schedules.

```
┌─────────────────────────────────────────────────────────────┐
│                    CLASS 10-A TIMETABLE                       │
├──────────┬──────────┬──────────┬──────────┬──────────┬──────┤
│  Period  │  Monday  │ Tuesday  │Wednesday │ Thursday │Friday│
├──────────┼──────────┼──────────┼──────────┼──────────┼──────┤
│ 08:00-   │  Math    │ English  │  Science │  Math    │ Urdu │
│ 08:45    │ Sir Imran│ Miss Sara│ Sir Ali  │ Sir Imran│ Madam│
├──────────┼──────────┼──────────┼──────────┼──────────┼──────┤
│ 08:45-   │ English  │  Math    │  Urdu    │ Science  │ Math │
│ 09:30    │ Miss Sara│ Sir Imran│  Madam   │ Sir Ali  │Sir Im│
└──────────┴──────────┴──────────┴──────────┴──────────┴──────┘
```

---

### Module 10: AI School Assistant (EduBot)

**Real-Life Example:** Admin types "kitne students hain?" → AI fetches school data → responds "Aapke school mein 350 active students hain, 12 classes mein distributed" → shows action buttons.

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  User types  │────▶│  Detect      │────▶│  Fetch Data  │────▶│   Gemini AI  │
│  message     │     │  Categories  │     │  from Store  │     │   Reasoning  │
│              │     │              │     │              │     │              │
│ "attendance  │     │ → attendance │     │ → 280/350    │     │ → Formats    │
│  kya hai?"   │     │ → student    │     │   present    │     │   response   │
│              │     │              │     │ → 70 absent  │     │ → Buttons    │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
                                                                       │
                                                                       ▼
                                                              ┌──────────────┐
                                                              │  Structured  │
                                                              │  Response +  │
                                                              │  Action Btns │
                                                              └──────────────┘
```

**AI Features:**
- Multilingual (English, Urdu, Roman Urdu)
- Context-aware (remembers conversation)
- Role-based data access (teacher only sees their classes)
- Proactive alerts (low attendance, overdue fees)
- Action buttons for navigation
- Privacy-first (never exposes raw data)

---

### Module 11: Subscription & Billing

**Real-Life Example:** New school signs up → gets 14-day free trial (Growth plan, 500 students) → trial expires → admin upgrades to Starter plan (PKR 4000/month, 200 students) → system enforces student limit.

```
┌─────────────────────────────────────────────────────────────────┐
│                    SUBSCRIPTION LIFECYCLE                         │
│                                                                  │
│  Sign Up → Free Trial (14 days) → Choose Plan → Active → Renew │
│                                        │                         │
│                                        ▼                         │
│                              ┌─────────────────┐                 │
│                              │ Student Limit   │                 │
│                              │ Enforcement     │                 │
│                              │                 │                 │
│                              │ Every student   │                 │
│                              │ creation checks:│                 │
│                              │ current < limit │                 │
│                              └─────────────────┘                 │
└─────────────────────────────────────────────────────────────────┘
```

**Plans:**
| Plan | Price | Students | Features |
|------|-------|----------|----------|
| Starter | PKR 4,000/mo | 200 | Basic features |
| Growth | PKR 8,000/mo | 500 | Advanced reporting, SMS, Analytics |
| Custom | PKR 15/student/mo | Configurable | Enterprise features |

---

### Module 12: Finance Management (Super Admin)

**Real-Life Example:** Super Admin assigns "Premium Package" to School ABC (500 students, PKR 8000/month) → tracks revenue → records expenses (server costs, salaries) → views profit dashboard.

```
┌─────────────────────────────────────────────────────────────────┐
│                    FINANCE FLOW                                   │
│                                                                  │
│  School Package ──▶ Revenue Tracking ──▶ Profit Calculation     │
│  (PKR 8000/mo)     (Total: PKR 50,000)   (Revenue - Expenses)  │
│                                                                  │
│  Expenses:                                                       │
│  ├── Mutual: Server costs (PKR 15,000)                          │
│  ├── Ali: Marketing (PKR 5,000)                                 │
│  └── Abdul Rehman: Support (PKR 3,000)                          │
│                                                                  │
│  Net Profit: PKR 50,000 - PKR 23,000 = PKR 27,000              │
└─────────────────────────────────────────────────────────────────┘
```

---

### Module 13: Leave Management

**Real-Life Example:** Student submits sick leave request → Admin sees pending request → Approves/Rejects → Student/Parent notified.

```
Student/Teacher                Admin                    Notification
     │                           │                          │
     │── Submit Leave ──────────▶│                          │
     │   (type, dates, reason)   │                          │
     │                           │── Review ──▶ Approve ───▶│── Notify
     │                           │         or  Reject ─────▶│── Notify
     │◀── Status Updated ───────│                          │
```

---

### Module 14: Events & Announcements

**Real-Life Example:** Admin creates "Annual Sports Day" event → targets Class 5-10 → all students/parents in those classes see the event → Admin posts announcement "School closed tomorrow" → everyone sees it.

---

### Module 15: Behavior Tracking

**Real-Life Example:** Teacher reports "Ali was fighting in class" → severity: high → action: parent meeting → parent notified → warning count increases.

---

### Module 16: Live Classes (Jitsi Meet)

**Real-Life Example:** Teacher schedules "Math Revision Class" for tomorrow 10 AM → system generates Jitsi room URL → students join via link → class recorded.

---

### Module 17: Parent Portal

**Real-Life Example:** Parent logs in → sees all children → selects "Ahmed (Class 5-A)" → views attendance (92%), recent exam results (A grade), pending fees (PKR 5000), homework due.

```
┌─────────────────────────────────────────────────────────────────┐
│                    PARENT DASHBOARD                               │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │ Attendance  │  │   Results   │  │    Fees     │            │
│  │   92%       │  │  Grade: A   │  │ Due: 5000   │            │
│  │ Present: 23 │  │  Rank: 3rd  │  │ Paid: 0     │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │  Homework   │  │   Events    │  │ Live Class  │            │
│  │  2 pending  │  │ Sports Day  │  │ Math: 10AM  │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

---

### Module 18: Super Admin Platform

**Real-Life Example:** Platform owner logs in → sees 15 schools registered → approves new school "ABC Academy" → assigns Growth plan → monitors revenue across all schools.

```
Super Admin Dashboard
       │
       ├── Schools Management (approve, suspend, configure)
       ├── Finance Dashboard (revenue, expenses, profit)
       ├── Package Management (assign custom packages)
       ├── User Management (all platform users)
       ├── Payment Verification (approve school payments)
       └── Analytics (platform-wide stats)
```

---

## 4. Complete Data Flow Diagram

### How a Request Travels Through the System

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         COMPLETE REQUEST LIFECYCLE                            │
│                                                                             │
│  1. User clicks "Mark Attendance" button in React app                       │
│                                                                             │
│  2. React sends HTTP request:                                               │
│     POST https://api.eduplexo.com/api/attendance/mark                       │
│     Headers: { Authorization: "Bearer eyJhbG..." }                          │
│     Body: { class_id: "cls_5a", records: [...] }                           │
│                                                                             │
│  3. Nginx receives request:                                                 │
│     • Checks rate limit (60 req/min per IP)                                │
│     • Terminates SSL                                                        │
│     • Forwards to Go backend                                               │
│                                                                             │
│  4. Go Backend processes:                                                   │
│     a) Middleware chain:                                                    │
│        RequestID → CORS → Compress → Metrics → Recover → Logger           │
│     b) Auth Middleware:                                                     │
│        • Extracts JWT from Authorization header                            │
│        • Verifies signature with JWT_SECRET                                │
│        • Extracts: user_id, school_id, role, academic_year_id             │
│        • Attaches to request context                                       │
│     c) Handler:                                                            │
│        • RBAC check: CanAccess("teacher", "attendance", "create") ✓       │
│        • Validates input (class exists, students exist)                    │
│        • Bulk upsert to PostgreSQL                                         │
│        • Invalidates Redis cache                                           │
│        • Returns success response                                          │
│                                                                             │
│  5. Response travels back:                                                  │
│     Backend → Nginx → Internet → React app → UI updates                   │
│                                                                             │
│  6. Side effects:                                                           │
│     • Dashboard cache invalidated                                          │
│     • Audit log written                                                    │
│     • Parent notification queued (if absent)                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Multi-Tenant Data Isolation

```
┌─────────────────────────────────────────────────────────────────┐
│                    HOW MULTI-TENANCY WORKS                        │
│                                                                  │
│  School A (school_id: "sch_abc")                                │
│  ├── Students: 200 (only school A's students)                   │
│  ├── Teachers: 15                                               │
│  ├── Classes: 10                                                │
│  └── Fees: PKR 1,000,000 collected                             │
│                                                                  │
│  School B (school_id: "sch_xyz")                                │
│  ├── Students: 500 (only school B's students)                   │
│  ├── Teachers: 30                                               │
│  ├── Classes: 20                                                │
│  └── Fees: PKR 2,500,000 collected                             │
│                                                                  │
│  ═══════════════════════════════════════════════                 │
│  ISOLATION MECHANISM:                                            │
│                                                                  │
│  1. JWT contains school_id claim                                │
│  2. Every DB query: WHERE school_id = $jwt_school_id            │
│  3. Admin of School A CANNOT see School B's data                │
│  4. PostgreSQL Row-Level Security as additional guard           │
│  5. Cross-tenant requests return empty results (not errors)     │
└─────────────────────────────────────────────────────────────────┘
```

### Academic Year Isolation

```
┌─────────────────────────────────────────────────────────────────┐
│                    ACADEMIC YEAR SWITCHING                        │
│                                                                  │
│  School has multiple academic years:                            │
│  ├── 2024-25 (completed) — 180 students, archived data         │
│  └── 2025-26 (active) — 200 students, current data             │
│                                                                  │
│  When admin switches year:                                       │
│  1. POST /api/academic-years/switch {year_id: "ay_2024_25"}    │
│  2. Backend issues NEW JWT with updated academic_year_id        │
│  3. All subsequent queries filter by that year                  │
│  4. Dashboard shows 2024-25 data                                │
│  5. Switch back → new JWT → current year data                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Database Schema (Key Tables)

### Entity Relationship Diagram

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   schools    │◀────│    users     │     │academic_years│
│              │     │              │     │              │
│ id           │     │ id           │     │ id           │
│ name         │     │ school_id ───┼────▶│ school_id    │
│ code         │     │ email        │     │ year         │
│ status       │     │ role         │     │ is_active    │
└──────┬───────┘     │ password_hash│     └──────────────┘
       │             └──────────────┘
       │
       ├─────────────────────────────────────────────────────┐
       │                                                     │
┌──────┴───────┐     ┌──────────────┐     ┌──────────────┐  │
│   students   │     │   teachers   │     │   classes    │  │
│              │     │              │     │              │◀─┘
│ id           │     │ id           │     │ id           │
│ school_id    │     │ school_id    │     │ school_id    │
│ class_id ────┼────▶│ user_id      │     │ academic_year│
│ first_name   │     │ first_name   │     │ name         │
│ admission_no │     │ email        │     │ capacity     │
│ guardian     │     │ subjects[]   │     │ class_teacher│
└──────────────┘     └──────────────┘     └──────────────┘
       │                                         │
       │              ┌──────────────┐           │
       └─────────────▶│  attendance  │◀──────────┘
                      │              │
                      │ student_id   │
                      │ class_id     │
                      │ date         │
                      │ status       │
                      └──────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    exams     │────▶│   results    │◀────│   students   │
│              │     │              │     │              │
│ id           │     │ exam_id      │     │              │
│ class_id     │     │ student_id   │     │              │
│ subjects[]   │     │ marks        │     │              │
│ max_marks    │     │ grade        │     │              │
└──────────────┘     └──────────────┘     └──────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  fee_types   │────▶│  class_fees  │────▶│    fees      │
│              │     │              │     │ (invoices)   │
│ name         │     │ class_id     │     │              │
│ is_recurring │     │ amount       │     │ student_id   │
│ category     │     │ cycle        │     │ amount       │
└──────────────┘     └──────────────┘     │ paid_amount  │
                                          │ status       │
                                          └──────┬───────┘
                                                 │
                                          ┌──────┴───────┐
                                          │ fee_payments │
                                          │              │
                                          │ receipt_no   │
                                          │ amount       │
                                          │ method       │
                                          └──────────────┘
```

### Total Tables: 38

| Category | Tables |
|----------|--------|
| Core | schools, users, academic_years |
| People | students, teachers, parents, student_parents |
| Academic | classes, subjects, class_teachers, class_subjects |
| Tracking | attendance, exams, results, homework, homework_submissions |
| Finance | fee_types, class_fees, fees, fee_payments, fee_adjustments, fee_components, fee_payment_allocations |
| Communication | announcements, events, notifications, event_target_classes |
| Operations | timetable, timetable_sessions, behavior, leave, live_classes |
| Platform | subscriptions, subscription_history, school_packages, expenses, revenue_records, invoices, transactions |
| System | audit_logs, school_settings |

---

## 6. API Endpoints (100+ endpoints)

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | Login with email/password |
| POST | /api/auth/signup | Register new school |
| GET | /api/auth/session | Validate current session |
| POST | /api/academic-years/switch | Switch active academic year |

### Students
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/students | List (paginated, filtered) |
| POST | /api/students | Create new student |
| GET | /api/students/:id | Get single student |
| PATCH | /api/students/:id | Update student |
| DELETE | /api/students/:id | Delete student |

### Attendance
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/attendance/mark | Bulk mark attendance |
| GET | /api/attendance/sheet | Get attendance sheet |
| GET | /api/attendance | List attendance records |

### Fees
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/fees/generate | Generate monthly invoices |
| GET | /api/fees | List fee invoices |
| POST | /api/fees/:id/pay | Record payment |
| GET | /api/fees/ledger | Ledger dashboard |
| GET | /api/fees/daily-collection | Daily collection report |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/dashboard/composite | All dashboard data in one call |
| GET | /api/analytics/dashboard | Analytics with PG materialized views |

### AI Chatbot
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/chatbot/message | Send message to AI assistant |

### Super Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/super-admin/schools | List all schools |
| POST | /api/super-admin/packages | Create school package |
| GET | /api/super-admin/finance/dashboard | Finance analytics |
| POST | /api/super-admin/expenses | Record expense |

---

## 7. Real-Life User Stories

### Story 1: School Onboarding
```
1. School owner visits eduplexo.com (landing page)
2. Clicks "Start Free Trial"
3. Fills signup form (school name, admin email, password)
4. System creates: School + Admin User + Academic Year
5. Redirected to app.eduplexo.com/admin/dashboard
6. 14-day trial starts (Growth plan, 500 students)
7. Admin starts adding classes, teachers, students
```

### Story 2: Daily School Operations
```
Morning:
  • Teacher logs in → marks attendance for Class 5-A
  • System shows: 28 present, 2 absent, 1 late

Mid-day:
  • Admin creates "Science Quiz" exam for Class 8
  • Teacher enters marks after quiz
  • System auto-calculates grades

Evening:
  • Parent opens app → sees child's attendance (present today ✓)
  • Sees homework due tomorrow
  • Checks fee status (PKR 5000 pending)
```

### Story 3: Fee Collection Day
```
1. Admin generates monthly fees for all classes
2. System creates 350 invoices (one per student)
3. Parents receive due notices
4. Parent pays at school office
5. Admin records payment → receipt generated
6. Dashboard updates: "Today's collection: PKR 175,000"
7. End of month: Admin sees 85% collection rate
```

### Story 4: Exam Season
```
1. Admin creates "Final Exam 2025" with 6 subjects
2. Exam dates set: May 20-30
3. After exams, teachers enter marks per subject
4. System calculates: total marks, percentage, grade, rank
5. Parents see report card in their portal
6. Admin generates class-wise result analysis
```

---

## 8. Technology Deep Dive

### Backend Architecture (Go)

```
backend-go/
├── cmd/server/main.go          ← Entry point (boot sequence)
├── internal/
│   ├── ai/                     ← Gemini AI client
│   ├── api/                    ← Request context, pagination, errors
│   ├── auth/                   ← JWT, password hashing, RBAC
│   ├── cache/                  ← Redis client wrapper
│   ├── config/                 ← Environment variable loading
│   ├── domain/                 ← Business logic (27 modules)
│   │   ├── academicyear/
│   │   ├── attendance/
│   │   ├── chatbot/
│   │   ├── classes/
│   │   ├── dashboard/
│   │   ├── events/
│   │   ├── exams/
│   │   ├── fees/
│   │   ├── finance/
│   │   ├── homework/
│   │   ├── leave/
│   │   ├── liveclass/
│   │   ├── notifications/
│   │   ├── parent/
│   │   ├── results/
│   │   ├── settings/
│   │   ├── students/
│   │   ├── subjects/
│   │   ├── subscription/
│   │   ├── superadmin/
│   │   ├── teachers/
│   │   └── timetable/
│   ├── middleware/             ← CORS, auth, logging, compression
│   ├── metrics/                ← Prometheus metrics
│   ├── persistence/            ← PostgreSQL read/write layer
│   ├── realtime/               ← WebSocket hub + job queue
│   ├── server/                 ← Router setup
│   └── store/                  ← In-memory data store + types
└── migrations/                 ← PostgreSQL schema (12 migrations)
```

### Frontend Architecture (React)

```
school-react-app/
├── src/
│   ├── pages/
│   │   ├── auth/               ← Login, Signup
│   │   └── role/
│   │       ├── admin/          ← Admin pages (20+ pages)
│   │       ├── teacher/        ← Teacher pages (15+ pages)
│   │       ├── parent/         ← Parent pages (10+ pages)
│   │       └── student/        ← Student pages (10+ pages)
│   ├── components/             ← Shared UI components
│   ├── hooks/                  ← Custom React hooks
│   ├── lib/                    ← API client, utilities
│   ├── routes/                 ← Route definitions + code splitting
│   └── App.tsx                 ← Root component
```

### Performance Optimizations

| Optimization | Impact |
|-------------|--------|
| Redis caching (dashboard, attendance) | 15ms response vs 200ms |
| Composite dashboard endpoint | 1 API call vs 6 |
| PostgreSQL materialized views | Pre-computed analytics |
| Code splitting (lazy loading) | 180KB initial bundle (was 800KB) |
| Gzip compression | 60% smaller responses |
| Connection pooling (pgx) | Reuse DB connections |
| In-memory indexes (userByID, schoolByID) | O(1) auth lookups |

---

## 9. Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRODUCTION DEPLOYMENT                          │
│                                                                  │
│  Vercel (Free Tier)                                             │
│  ├── eduplexo.com (Landing)                                     │
│  ├── app.eduplexo.com (School App)                             │
│  └── admin.eduplexo.com (Super Admin)                          │
│                                                                  │
│  Hostinger KVM 2 VPS (Ubuntu 24.04, 4GB RAM)                   │
│  ├── Docker Compose                                             │
│  │   ├── Nginx (SSL, rate limiting, reverse proxy)             │
│  │   ├── Go Backend (API server)                               │
│  │   ├── PostgreSQL 16 (persistent data)                       │
│  │   ├── Redis 7 (cache + pub/sub)                             │
│  │   └── Migrate (schema migrations)                           │
│  ├── Let's Encrypt (auto SSL renewal)                          │
│  ├── Fail2Ban (brute force protection)                         │
│  ├── UFW Firewall (ports 22, 80, 443 only)                    │
│  └── Daily backups (14-day retention)                          │
│                                                                  │
│  Monthly Cost: ~PKR 3,500 ($12 VPS + $1 domain)               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 10. Security Features

| Feature | Implementation |
|---------|---------------|
| Authentication | JWT (HMAC-SHA256) with expiry |
| Authorization | RBAC matrix (5 roles × 22 features × 5 actions) |
| Multi-tenancy | school_id isolation on every query |
| Password | Bcrypt hashing (cost 10) |
| CORS | Whitelist-only (Vercel domains) |
| Rate Limiting | 60 req/min API, 10 req/min auth |
| SSL/TLS | Let's Encrypt auto-renewal |
| Input Validation | All endpoints validate input |
| SQL Injection | Parameterized queries (pgx) |
| XSS | React auto-escapes, CSP headers |
| Audit Trail | Every mutation logged with actor |
| AI Safety | Prompt injection detection, response sanitization |
| Network | Internal-only DB network, no public ports |
| Container | Non-root user, distroless image, no shell |

---

## 11. Project Statistics

| Metric | Value |
|--------|-------|
| Total Lines of Code | ~15,000+ |
| Go Backend Files | 50+ files |
| React Frontend Files | 325+ TSX files |
| API Endpoints | 100+ |
| Database Tables | 38 |
| Database Indexes | 98 |
| User Roles | 5 |
| Feature Modules | 27 |
| Docker Services | 6 (nginx, backend, postgres, redis, migrate, certbot) |
| Frontend Apps | 3 (school, super-admin, landing) |

---

## 12. Future Roadmap

| Phase | Features |
|-------|----------|
| Phase 5 | Mobile app (React Native), SMS notifications |
| Phase 6 | Payment gateway integration (JazzCash, EasyPaisa) |
| Phase 7 | Advanced analytics, AI report generation |
| Phase 8 | Multi-language support, white-labeling |
| Phase 9 | Offline mode, PWA support |

---

*Document generated: May 17, 2025*
*Version: 1.0*
*Platform: Eduplexo School Management SaaS*
