# Eduplexo ERP — Full System Documentation

Eduplexo is a comprehensive, production-grade School ERP designed with a focus on modern aesthetics, real-time data isolation, and multi-tenant scalability. This document serves as the definitive guide to the system's architecture, portals, and module-specific logic.

---

## 1. System Architecture & Tech Stack

The system follows a **Separation of Concerns** architecture, ensuring high performance and maintainable code.

### Backend (Go / Fiber / Chi)
- **Engine**: high-performance Go backend with `chi` for routing.
- **Data Layer**: Hybrid persistence. Uses an in-memory `MemStore` for ultra-fast reads and a `Persister` (PostgreSQL) for ACID-compliant storage.
- **Multi-Tenancy**: Strict `school_id` and `academic_year_id` isolation at the database level. Every request is scoped to a specific school and session.
- **Security**: JWT-based authentication with role-based access control (RBAC).

### Frontend (React / Vite / Tailwind)
- **Framework**: React 18 with TypeScript for type safety.
- **State Management**: Event-driven architecture using a centralized `data-bus`. This allows components to refresh automatically when mutations (like adding a student) occur elsewhere.
- **Styling**: Premium, high-density ERP aesthetic using Vanilla CSS and Tailwind for precision layout.
- **Real-Time Visibility**: Integrated with backend session management to ensure users always see data for the active academic year.

---

## 2. User Portals

Eduplexo provides four distinct portals, each tailored to the specific needs of the user.

### 🏛️ Admin Portal
The central command center for school administrators.
- **Control**: Manage academic years, classes, teachers, and students.
- **Finance**: Configure fee structures and generate monthly invoices.
- **Communication**: Send school-wide announcements and manage the events calendar.
- **Configuration**: Set up school profiles, branding, and system preferences.

### 👨‍🏫 Teacher Portal
Focused on classroom management and academic delivery.
- **Classroom**: Mark attendance, manage homework assignments, and review submissions.
- **Exams**: Create exams, enter marks, and generate results.
- **Behavior**: Track student disciplinary records and rewards.
- **Schedule**: View personalized timetable and manage live classes.

### 👨‍👩‍👧‍👦 Parent Portal
Designed for transparency and student progress monitoring.
- **Visibility**: Real-time access to child’s attendance, homework, and behavior.
- **Finance**: View fee ledger, pending invoices, and payment history.
- **Academics**: View exam results and performance charts.
- **Connection**: Direct communication with teachers through announcements.

### 🎓 Student Portal
An interactive environment for students to engage with their studies.
- **Learning**: Access homework, submit assignments, and join live classes.
- **Tracking**: Monitor personal attendance and academic performance.
- **Schedule**: Stay updated with the daily timetable and upcoming school events.

### 👑 Super Admin Portal
The "Platform Owner" view for SaaS management.
- **Tenant Management**: Onboard new schools, manage subscriptions, and monitor school health.
- **Global Settings**: Manage system-wide plans, configurations, and audit logs.

---

## 3. Core Modules & Logic

### 📅 Academic Management
- **Academic Years**: Supports multiple sessions (e.g., 2024-25, 2025-26). All system data (Fees, Classes, Results) is strictly isolated by the active session.
- **Classes & Sections**: Grouping students into classes with specific teachers and subjects.
- **Subjects**: Central repository of subjects mapped to teachers and classes.

### 💰 Fee Management (Real-Flow)
- **Fee Configuration**: Admins define "Recurring" (Monthly) or "One-time" fee components for each class.
- **Invoice Generation**: Instead of static numbers, the system generates actual debt records (Invoices) for students based on the active config.
- **Ledger & Collection**: A high-density dashboard to track collections, pending amounts, and record partial or full payments.

### 📝 Attendance & Homework
- **Attendance**: Teachers or Admins can mark attendance in bulk. The system tracks daily percentages for classes and individual students.
- **Homework**: Supports rich-text descriptions, file attachments, and a review workflow where teachers can grade submissions.

### 📊 Exams & Results
- **Exam Scheduling**: Define exam types (Midterm, Final) and schedule them for classes.
- **Result Processing**: Automated percentage calculation and grade assignment based on passing thresholds defined at the class level.

### 💬 Communication & Events
- **Announcements**: Targeted messaging (to specific roles or entire school).
- **Events**: A centralized calendar for school holidays, parent-teacher meetings, and sports days.

---

## 4. Key Workflows

### The "Academic Session" Constraint
Every operation in Eduplexo is "Session Aware." If a user switches the Academic Year in the top bar, the system immediately filters all Students, Classes, and Fees to match that session. This prevents data contamination between years.

### Fee Generation Logic
1. Admin sets `Monthly Fee = Rs 500` for Class 1.
2. Admin clicks **Generate Invoices** for "May".
3. System creates a `Fee` record for every **Active** student in Class 1 for May.
4. The **Ledger** now shows these records as `Pending`.

---

## 5. Deployment & Infrastructure
The system is fully containerized using **Docker Compose**:
- `school_postgres`: Database storage.
- `school_backend`: Go API service.
- `school_frontend`: React application served via Nginx.
- `school_migrate`: Automated database schema management.

---
*Documentation Version: 1.0.0*
*Last Updated: 2026-05-14*
