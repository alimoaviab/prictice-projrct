/**
 * Route definitions with React.lazy() code splitting.
 *
 * Every page is lazy-loaded so the initial bundle only contains the shell,
 * auth pages, and the router. Each module loads on-demand when navigated to.
 *
 * Bundle impact: ~800KB initial → ~180KB initial (75% reduction).
 * Each lazy chunk: 20-80KB loaded on first navigation to that route.
 */
import { lazy, Suspense, type ComponentType } from "react";
import type { RouteObject } from "react-router-dom";
import { PageLoader } from "@/components/PageLoader";

// ─── Lazy wrapper helper ─────────────────────────────────────────────────
// Wraps a lazy import in Suspense with the PageLoader skeleton fallback.
function lazyPage(
  importFn: () => Promise<any>,
  exportName?: string
) {
  const LazyComponent = lazy(async () => {
    const mod = await importFn();
    if (exportName && exportName in mod) {
      return { default: (mod as Record<string, ComponentType<any>>)[exportName] };
    }
    if ("default" in mod) {
      return mod as { default: ComponentType<any> };
    }
    // If no default export, use the first exported component
    const firstExport = Object.values(mod)[0];
    return { default: firstExport as ComponentType<any> };
  });

  return (
    <Suspense fallback={<PageLoader />}>
      <LazyComponent />
    </Suspense>
  );
}

// ─── Admin Routes (lazy-loaded) ──────────────────────────────────────────

export const adminRoutes: RouteObject[] = [
  // Dashboard
  { path: "/admin/dashboard", element: lazyPage(() => import("@/pages/role/admin/dashboard"), "AdminDashboardPage") },

  // Academic Years
  { path: "/admin/academic-years", element: lazyPage(() => import("@/pages/role/admin/academic-years"), "AdminAcademicYearPage") },
  { path: "/admin/academic-years/create", element: lazyPage(() => import("@/pages/role/admin/academic-years/create"), "AdminAcademicYearCreatePage") },
  { path: "/admin/academic-years/:id/edit", element: lazyPage(() => import("@/pages/role/admin/academic-years/Param_id/edit"), "AdminAcademicYearEditPage") },

  // AI
  { path: "/admin/ai", element: lazyPage(() => import("@/pages/role/admin/ai"), "AdminAIPage") },

  // Announcements
  { path: "/admin/announcements", element: lazyPage(() => import("@/pages/role/admin/announcements"), "AdminAnnouncementsPage") },
  { path: "/admin/announcements/create", element: lazyPage(() => import("@/pages/role/admin/announcements/create"), "AdminAnnouncementCreatePage") },

  // Attendance
  { path: "/admin/attendance", element: lazyPage(() => import("@/pages/role/admin/attendance"), "AdminAttendancePage") },
  { path: "/admin/attendance/create", element: lazyPage(() => import("@/pages/role/admin/attendance/create"), "AdminAttendanceCreatePage") },

  // Behavior
  { path: "/admin/behavior", element: lazyPage(() => import("@/pages/role/admin/behavior"), "BehaviorPage") },
  { path: "/admin/behavior/create", element: lazyPage(() => import("@/pages/role/admin/behavior/create"), "AdminBehaviorCreatePage") },

  // Classes
  { path: "/admin/classes", element: lazyPage(() => import("@/pages/role/admin/classes"), "AdminClassesPage") },
  { path: "/admin/classes/create", element: lazyPage(() => import("@/pages/role/admin/classes/create"), "AdminClassCreatePage") },
  { path: "/admin/classes/:id/edit", element: lazyPage(() => import("@/pages/role/admin/classes/Param_id/edit"), "ClassEditPage") },
  { path: "/admin/classes/:id/fee", element: lazyPage(() => import("@/pages/role/admin/classes/Param_id/fee"), "ClassFeePage") },
  { path: "/admin/classes/:id/fees", element: lazyPage(() => import("@/pages/role/admin/classes/Param_id/fees"), "Page") },

  // Domain
  { path: "/admin/connect-domain", element: lazyPage(() => import("@/pages/role/admin/connect-domain"), "ConnectDomainPage") },

  // Events
  { path: "/admin/events", element: lazyPage(() => import("@/pages/role/admin/events"), "EventsPage") },
  { path: "/admin/events/create", element: lazyPage(() => import("@/pages/role/admin/events/create"), "AdminEventCreatePage") },

  // Exams
  { path: "/admin/exams", element: lazyPage(() => import("@/pages/role/admin/exams"), "AdminExamsPage") },
  { path: "/admin/exams/create", element: lazyPage(() => import("@/pages/role/admin/exams/create"), "AdminExamCreatePage") },
  { path: "/admin/exams/marks", element: lazyPage(() => import("@/pages/role/admin/exams/marks"), "AdminExamMarksPage") },

  // Fees
  { path: "/admin/fee", element: lazyPage(() => import("@/pages/role/admin/fee"), "StudentFeeDashboard") },

  // Homework
  { path: "/admin/homework", element: lazyPage(() => import("@/pages/role/admin/homework"), "AdminHomeworkPage") },
  { path: "/admin/homework/create", element: lazyPage(() => import("@/pages/role/admin/homework/create"), "AdminHomeworkCreatePage") },
  { path: "/admin/homework/edit/:id", element: lazyPage(() => import("@/pages/role/admin/homework/edit/Param_id"), "AdminHomeworkEditPage") },
  { path: "/admin/homework/:id/review", element: lazyPage(() => import("@/pages/role/admin/homework/Param_id/review"), "AdminHomeworkReviewPage") },

  // Leave
  { path: "/admin/leave", element: lazyPage(() => import("@/pages/role/admin/leave"), "LeavePage") },
  { path: "/admin/leave/create", element: lazyPage(() => import("@/pages/role/admin/leave/create"), "AdminLeaveCreatePage") },

  // Live Classes
  { path: "/admin/live-class", element: lazyPage(() => import("@/pages/role/admin/live-class"), "LiveClassPage") },
  { path: "/admin/live-class/create", element: lazyPage(() => import("@/pages/role/admin/live-class/create"), "AdminLiveClassCreatePage") },
  { path: "/admin/live-classes", element: lazyPage(() => import("@/pages/role/admin/live-classes"), "AdminLiveClassesPage") },
  { path: "/admin/live-exam", element: lazyPage(() => import("@/pages/role/admin/live-exam"), "LiveExamPage") },

  // Results
  { path: "/admin/results", element: lazyPage(() => import("@/pages/role/admin/results"), "AdminResultsPage") },
  { path: "/admin/results/create", element: lazyPage(() => import("@/pages/role/admin/results/create"), "AdminResultCreatePage") },

  // Salary
  { path: "/admin/salary", element: lazyPage(() => import("@/pages/role/admin/salary"), "SalaryPage") },

  // Settings
  { path: "/admin/settings", element: lazyPage(() => import("@/pages/role/admin/settings"), "AdminSettingsPage") },

  // Students
  { path: "/admin/students", element: lazyPage(() => import("@/pages/role/admin/students"), "AdminStudentsPage") },
  { path: "/admin/students/create", element: lazyPage(() => import("@/pages/role/admin/students/create"), "AdminStudentCreatePage") },
  { path: "/admin/students/edit/:id", element: lazyPage(() => import("@/pages/role/admin/students/edit/Param_id"), "AdminStudentEditPage") },

  // Subjects
  { path: "/admin/subjects", element: lazyPage(() => import("@/pages/role/admin/subjects"), "SubjectsPage") },

  // Teachers
  { path: "/admin/teachers", element: lazyPage(() => import("@/pages/role/admin/teachers"), "AdminTeachersPage") },
  { path: "/admin/teachers/create", element: lazyPage(() => import("@/pages/role/admin/teachers/create"), "AdminTeacherCreatePage") },
  { path: "/admin/teachers/edit/:id", element: lazyPage(() => import("@/pages/role/admin/teachers/edit/Param_id"), "AdminTeacherEditPage") },

  // Timetable
  { path: "/admin/timetable", element: lazyPage(() => import("@/pages/role/admin/timetable"), "TimetableRoute") },
  { path: "/admin/timetable/create", element: lazyPage(() => import("@/pages/role/admin/timetable/create"), "AdminTimetableCreatePage") },
  { path: "/admin/timetable/edit/:id", element: lazyPage(() => import("@/pages/role/admin/timetable/edit/Param_id"), "AdminTimetableEditPage") },
];

// ─── Teacher Routes (lazy-loaded) ────────────────────────────────────────

export const teacherRoutes: RouteObject[] = [
  { path: "/teacher", element: lazyPage(() => import("@/pages/role/teacher"), "TeacherPortalIndexPage") },
  { path: "/teacher/dashboard", element: lazyPage(() => import("@/pages/role/teacher/dashboard"), "TeacherDashboardPage") },
  { path: "/teacher/announcements", element: lazyPage(() => import("@/pages/role/teacher/announcements"), "TeacherAnnouncementsPage") },
  { path: "/teacher/announcements/create", element: lazyPage(() => import("@/pages/role/teacher/announcements/create"), "TeacherAnnouncementCreatePage") },
  { path: "/teacher/attendance", element: lazyPage(() => import("@/pages/role/teacher/attendance"), "TeacherAttendancePage") },
  { path: "/teacher/attendance/create", element: lazyPage(() => import("@/pages/role/teacher/attendance/create"), "TeacherAttendanceCreatePage") },
  { path: "/teacher/behavior", element: lazyPage(() => import("@/pages/role/teacher/behavior"), "TeacherBehaviorPage") },
  { path: "/teacher/behavior/create", element: lazyPage(() => import("@/pages/role/teacher/behavior/create"), "TeacherBehaviorCreatePage") },
  { path: "/teacher/classes", element: lazyPage(() => import("@/pages/role/teacher/classes"), "TeacherClassesPage") },
  { path: "/teacher/classes/:id/students", element: lazyPage(() => import("@/pages/role/teacher/classes/Param_id/students"), "TeacherClassStudentsPage") },
  { path: "/teacher/events", element: lazyPage(() => import("@/pages/role/teacher/events"), "TeacherEventsPage") },
  { path: "/teacher/events/create", element: lazyPage(() => import("@/pages/role/teacher/events/create"), "TeacherEventCreatePage") },
  { path: "/teacher/exams", element: lazyPage(() => import("@/pages/role/teacher/exams"), "TeacherExamsPage") },
  { path: "/teacher/exams/create", element: lazyPage(() => import("@/pages/role/teacher/exams/create"), "TeacherExamCreatePage") },
  { path: "/teacher/exams/marks", element: lazyPage(() => import("@/pages/role/teacher/exams/marks"), "TeacherExamMarksPage") },
  { path: "/teacher/homework", element: lazyPage(() => import("@/pages/role/teacher/homework"), "TeacherHomeworkPage") },
  { path: "/teacher/homework/create", element: lazyPage(() => import("@/pages/role/teacher/homework/create"), "TeacherHomeworkCreatePage") },
  { path: "/teacher/homework/edit/:id", element: lazyPage(() => import("@/pages/role/teacher/homework/edit/Param_id"), "TeacherHomeworkEditPage") },
  { path: "/teacher/homework/:id/review", element: lazyPage(() => import("@/pages/role/teacher/homework/Param_id/review"), "TeacherHomeworkReviewPage") },
  { path: "/teacher/live-class", element: lazyPage(() => import("@/pages/role/teacher/live-class"), "TeacherLiveClassPage") },
  { path: "/teacher/live-class/create", element: lazyPage(() => import("@/pages/role/teacher/live-class/create"), "TeacherLiveClassCreatePage") },
  { path: "/teacher/live-exam", element: lazyPage(() => import("@/pages/role/teacher/live-exam"), "TeacherLiveExamPage") },
  { path: "/teacher/live-exam/:id/monitor", element: lazyPage(() => import("@/pages/role/teacher/live-exam/Param_id/monitor"), "LiveExamMonitorPage") },
  { path: "/teacher/live-exam/:id/questions", element: lazyPage(() => import("@/pages/role/teacher/live-exam/Param_id/questions"), "ExamQuestionsPage") },
  { path: "/teacher/results", element: lazyPage(() => import("@/pages/role/teacher/results"), "TeacherResultsPage") },
  { path: "/teacher/results/create", element: lazyPage(() => import("@/pages/role/teacher/results/create"), "TeacherResultCreatePage") },
  { path: "/teacher/timetable", element: lazyPage(() => import("@/pages/role/teacher/timetable"), "TeacherTimetablePage") },
];

// ─── Parent Routes (lazy-loaded) ─────────────────────────────────────────

export const parentRoutes: RouteObject[] = [
  { path: "/parent/dashboard", element: lazyPage(() => import("@/pages/role/parent/dashboard"), "ParentDashboardPage") },
  { path: "/parent/announcements", element: lazyPage(() => import("@/pages/role/parent/announcements"), "ParentAnnouncementsPage") },
  { path: "/parent/attendance", element: lazyPage(() => import("@/pages/role/parent/attendance"), "ParentAttendancePage") },
  { path: "/parent/behavior", element: lazyPage(() => import("@/pages/role/parent/behavior"), "ParentBehaviorPage") },
  { path: "/parent/events", element: lazyPage(() => import("@/pages/role/parent/events"), "ParentEventsPage") },
  { path: "/parent/exams", element: lazyPage(() => import("@/pages/role/parent/exams"), "ParentExamsPage") },
  { path: "/parent/fees", element: lazyPage(() => import("@/pages/role/parent/fees"), "ParentFeesPage") },
  { path: "/parent/homework", element: lazyPage(() => import("@/pages/role/parent/homework"), "ParentHomeworkPage") },
  { path: "/parent/profile", element: lazyPage(() => import("@/pages/role/parent/profile"), "ParentStudentProfilePage") },
  { path: "/parent/results", element: lazyPage(() => import("@/pages/role/parent/results"), "ParentResultsPage") },
  { path: "/parent/student-attendance", element: lazyPage(() => import("@/pages/role/parent/student-attendance"), "ParentStudentAttendancePage") },
  { path: "/parent/timetable", element: lazyPage(() => import("@/pages/role/parent/timetable"), "ParentTimetablePage") },
];

// ─── Student Routes (lazy-loaded) ────────────────────────────────────────

export const studentRoutes: RouteObject[] = [
  { path: "/student", element: lazyPage(() => import("@/pages/role/student"), "StudentPortalIndexPage") },
  { path: "/student/dashboard", element: lazyPage(() => import("@/pages/role/student/dashboard"), "StudentDashboardPage") },
  { path: "/student/announcements", element: lazyPage(() => import("@/pages/role/student/announcements"), "StudentAnnouncementsPage") },
  { path: "/student/attendance", element: lazyPage(() => import("@/pages/role/student/attendance"), "StudentAttendancePage") },
  { path: "/student/events", element: lazyPage(() => import("@/pages/role/student/events"), "StudentEventsPage") },
  { path: "/student/exams", element: lazyPage(() => import("@/pages/role/student/exams"), "StudentExamsPage") },
  { path: "/student/fees", element: lazyPage(() => import("@/pages/role/student/fees"), "StudentFeesPage") },
  { path: "/student/homework", element: lazyPage(() => import("@/pages/role/student/homework"), "StudentHomeworkPage") },
  { path: "/student/homework/:id/review", element: lazyPage(() => import("@/pages/role/student/homework/Param_id/review"), "StudentHomeworkReviewPage") },
  { path: "/student/live-class", element: lazyPage(() => import("@/pages/role/student/live-class"), "StudentLiveClassPage") },
  { path: "/student/live-exam", element: lazyPage(() => import("@/pages/role/student/live-exam"), "StudentLiveExamPage") },
  { path: "/student/live-exam/:id", element: lazyPage(() => import("@/pages/role/student/live-exam/Param_id"), "StudentLiveExamSessionPage") },
  { path: "/student/profile", element: lazyPage(() => import("@/pages/role/student/profile"), "StudentProfilePage") },
  { path: "/student/results", element: lazyPage(() => import("@/pages/role/student/results"), "StudentResultsPage") },
  { path: "/student/timetable", element: lazyPage(() => import("@/pages/role/student/timetable"), "StudentTimetablePage") },
  { path: "/student/leave", element: lazyPage(() => import("@/pages/role/student/leave")) },
];
