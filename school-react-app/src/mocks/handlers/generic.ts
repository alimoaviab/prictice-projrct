/**
 * Generic mock handlers for resources whose UI is not yet exercised in detail.
 * They preserve the API contract (path, method, ServiceResult envelope) so the
 * frontend never fails on a missing route — exactly the same behaviour the
 * original backend's [...slug] catch-all provides.
 */

import { http, HttpResponse } from "msw";
import { db } from "../db";

const okList = <T>(data: T[]) => HttpResponse.json({ ok: true, data });

const okOne = <T>(data: T) => HttpResponse.json({ ok: true, data });

const okEmpty = () => HttpResponse.json({ ok: true, data: [] });

export const genericHandlers = [
  // Classes
  http.get("/api/classes", () => okList(db.classes)),
  http.get("/api/classes/:id", ({ params }) => {
    const found = db.classes.find((c) => c._id === params.id);
    return found
      ? okOne(found)
      : HttpResponse.json(
          { ok: false, error: { code: "NOT_FOUND", message: "Class not found" } },
          { status: 404 }
        );
  }),
  http.post("/api/classes", () => HttpResponse.json({ ok: true, data: db.classes[0] })),

  // Subjects
  http.get("/api/subjects", () => okList(db.subjects)),
  http.get("/api/school/subjects", () => okList(db.subjects)),
  http.get("/api/school/subjects/class/:classId", () => okList(db.subjects)),

  // Teachers
  http.get("/api/teachers", () => okList(db.teachers)),
  http.get("/api/teachers/:id", ({ params }) => {
    const found = db.teachers.find((t) => t._id === params.id);
    return found
      ? okOne(found)
      : HttpResponse.json(
          { ok: false, error: { code: "NOT_FOUND", message: "Teacher not found" } },
          { status: 404 }
        );
  }),

  // Exams
  http.get("/api/exams", () => okList(db.exams)),
  http.get("/api/exams/:id", ({ params }) => {
    const found = db.exams.find((e) => e._id === params.id);
    return found
      ? okOne(found)
      : HttpResponse.json(
          { ok: false, error: { code: "NOT_FOUND", message: "Exam not found" } },
          { status: 404 }
        );
  }),
  http.get("/api/exams/:id/results", () => okEmpty()),

  // Attendance
  http.get("/api/attendance", () => okEmpty()),
  http.post("/api/attendance/mark", () =>
    HttpResponse.json({ ok: true, data: { count: 0 } })
  ),

  // Homework
  http.get("/api/homework", () => okEmpty()),
  http.get("/api/homework/:id", () =>
    HttpResponse.json(
      { ok: false, error: { code: "NOT_FOUND", message: "Homework not found" } },
      { status: 404 }
    )
  ),

  // Behavior
  http.get("/api/behavior", () => okEmpty()),

  // Events
  http.get("/api/events", () => okEmpty()),

  // Results
  http.get("/api/results", () => okEmpty()),

  // Timetable
  http.get("/api/timetable", () => okEmpty()),

  // Fees
  http.get("/api/fees/types", () => okEmpty()),
  http.get("/api/fees/ledger", () =>
    okOne({ summary: { total: 0, paid: 0, due: 0 }, rows: [] })
  ),
  http.get("/api/school/fees/dashboard-stats", () =>
    okOne({
      total_collected: 0,
      total_pending: 0,
      collection_rate: 0,
      pending_count: 0,
    })
  ),
  http.get("/api/school/fees/classes-summary", () => okEmpty()),

  // Live classes / exams
  http.get("/api/live/classes", () => okEmpty()),

  // Analytics dashboard
  http.get("/api/analytics/dashboard", () =>
    okOne({
      overview: {
        totalStudents: db.students.length,
        totalTeachers: db.teachers.length,
        totalClasses: db.classes.length,
        attendanceToday: 0,
        attendanceDetailed: { present: 0, absent: 0, total: 0 },
        activeExams: db.exams.filter((e) => e.status !== "completed").length,
        pendingLeave: 0,
        feeCollection: {
          total: 0,
          paid: 0,
          percentage: 0,
          pending_count: 0,
        },
      },
      trends: [],
      alerts: [],
      classAttendance: [],
      activities: [],
    })
  ),

  // Parent portal
  http.get("/api/parent/student-info", () =>
    okOne({
      students: db.students.map((s) => ({
        id: s._id,
        name: `${s.first_name} ${s.last_name}`,
        roll_no: s.admission_no,
        class_id: s.class_id,
        class: "Grade 5",
        section: s.section,
        academic_year: "2025-26",
        status: s.status,
      })),
    })
  ),
  http.get("/api/parent/children", () =>
    okOne({ students: db.students.map((s) => ({ id: s._id })) })
  ),
  http.get("/api/parents/check-email", () =>
    okOne({ exists: false })
  ),

  // Domain
  http.get("/api/domain/status", () =>
    okOne({ status: "not_configured", domain: null })
  ),

  // Settings (not routed to a service in the catch-all; return empty)
  http.get("/api/settings", () => okOne({})),

  // Announcements (not in catch-all; return empty)
  http.get("/api/announcements", () => okEmpty()),
];
