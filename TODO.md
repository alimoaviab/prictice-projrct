# 📋 CURRENT STATUS

* [x] Phase 1: Core Types & RBAC ✅
* [x] Phase 2: Models ✅
* [x] Phase 3: Validation Schemas ✅
* [x] Phase 4: Services ✅ COMPLETE
* [x] Phase 5: API Routes ✅ COMPLETE
* [ ] Phase 6: Frontend Integration ❗ (MISSING — CRITICAL)
* [ ] Phase 7: Testing & Production

---

# 🔒 GLOBAL RULES (NON-NEGOTIABLE)

* [ ] Every model includes `school_id`
* [ ] Every query filters `school_id`
* [ ] RBAC enforced in EVERY API
* [ ] Role NEVER comes from frontend
* [ ] Teacher sees ONLY assigned data
* [ ] Admin sees ONLY own school

---

# ⚙️ PHASE 4: SERVICES (COMPLETE BACKEND LOGIC)

### Announcement Service

* [ ] createAnnouncement(data, user)

  * [ ] enforce role = admin
  * [ ] attach school_id
* [ ] getAnnouncements(user)

  * [ ] filter by school_id

---

### Timetable Service

* [ ] createTimetable(data, user)

  * [ ] role = admin
* [ ] getTeacherTimetable(user)

  * [ ] filter teacher_id + school_id

---

### Behavior Service ✅ (already done)

* [x] createBehavior()
* [x] getBehaviors() with joins

---

### Leave Service

* [ ] applyLeave(user, data)
* [ ] approveReject(admin, leave_id, status)

---

### Event Service

* [ ] createEvent(admin)
* [ ] listEvents(user)

---

### Homework Service

* [ ] assignHomework(teacher)
* [ ] getHomework(student/teacher)

---

# 🌐 PHASE 5: API ROUTES (NEXT.JS)

## 🔑 COMMON RULE (ALL APIs)

* [ ] Extract user from middleware
* [ ] Apply RBAC check
* [ ] Apply school_id filter

---

### Announcement APIs

* [ ] GET /api/announcements
* [ ] POST /api/announcements
* [ ] GET /api/announcements/[id]

---

### Timetable APIs

* [ ] GET /api/timetable
* [ ] POST /api/timetable

---

### Behavior APIs

* [ ] GET /api/behavior
* [ ] POST /api/behavior

---

### Leave APIs

* [ ] GET /api/leave
* [ ] POST /api/leave
* [ ] PATCH /api/leave/[id]

---

### Event APIs

* [ ] GET /api/events
* [ ] POST /api/events

---

# 🎨 PHASE 6: FRONTEND (CRITICAL — ADD THIS)

## 🔐 AUTH UI

* [ ] Create `/login` page

  * [ ] email input
  * [ ] password input
  * [ ] submit → API
* [ ] Handle redirect:

  * [ ] admin → /admin/dashboard
  * [ ] teacher → /teacher/dashboard
  * [ ] student → /student/dashboard

---

## 🧭 TEACHER DASHBOARD

### Layout

* [ ] Sidebar:

  * Dashboard
  * Timetable
  * Exams
  * Results
  * Attendance
  * Behavior
  * Announcements
  * Events

---

### Timetable Page

* [ ] Fetch `/api/timetable`
* [ ] Show ONLY teacher timetable

---

### Behavior Page (IMPORTANT)

* [ ] Create "Add Behavior" form:

  * [ ] Select Class
  * [ ] Select Student (dynamic)
  * [ ] Title
  * [ ] Description
  * [ ] Severity

* [ ] On submit:

  * [ ] POST /api/behavior

* [ ] Behavior List:

  * [ ] Show own created behaviors

---

### Attendance Page

* [ ] Select class
* [ ] Fetch students
* [ ] Mark present/absent
* [ ] Submit

---

### Announcement Page

* [ ] GET announcements
* [ ] Display list

---

### Events Page

* [ ] GET events
* [ ] Display calendar/list

---

## 🏫 ADMIN DASHBOARD FIX (IMPORTANT)

⚠️ DO NOT redesign UI — only fix logic

### Behavior Page FIX

* [ ] Remove class-only listing ❌
* [ ] Fetch `/api/behavior`
* [ ] Display table:

  * Student Name
  * Class
  * Teacher
  * Title
  * Severity
  * Date

---

# 🔗 PHASE 7: INTEGRATION (CONNECT FRONTEND + BACKEND)

* [ ] Connect all pages with APIs
* [ ] Handle loading states
* [ ] Handle error states
* [ ] Ensure correct role-based rendering

---

# 🧪 PHASE 8: TESTING & PRODUCTION

### Build Check

* [ ] `npm run build` passes
* [ ] No TypeScript errors

---

### Security Test

* [ ] Teacher cannot access other school data
* [ ] Student cannot modify data
* [ ] Admin restricted to own school

---

### Behavior System Test (CRITICAL)

* [ ] Teacher creates behavior ✅
* [ ] Admin sees correct list ✅
* [ ] No empty class UI ❌ removed
* [ ] Data integrity verified

---

# 🎯 FINAL COMPLETION

* [ ] Auth working
* [ ] Teacher dashboard working
* [ ] Behavior system FIXED
* [ ] No data leakage
* [ ] Full frontend + backend connected
* [ ] Production ready 🚀
