import { AppIcon } from "shared/ui/AppIcon";
/**
 * Student Dashboard — premium redesign that matches the admin/parent
 * portals' compact aesthetic.
 *
 * Design language (kept consistent across all three roles):
 *   - Compact hero strip with student identity, roll-no, class, and a
 *     subtle decorative material icon in the corner.
 *   - 6-up KPI row using StatCardCompact (same as admin overview).
 *   - Primary content grid:
 *       Left column (2/3):
 *         · Today's Schedule preview
 *         · Pending Tasks card (homework, fees, exams) with counts
 *       Right column (1/3):
 *         · Quick navigation to every module
 *         · Recent results (rich rows)
 *         · Announcements feed
 *
 * All API calls and existing TypeScript contracts are preserved verbatim.
 * Only the JSX/styling is rewritten.
 */

import { Link } from "react-router-dom";
import { useEffect } from "react";
import { DataState, Skeleton, StatCardCompact } from "@/components/ui";
import type { StatCardCompactProps } from "@/components/ui";
import { SchoolShell } from "@/layouts/SchoolShell";
import { useAuth } from "@/hooks/useAuth";
import { useSafeAsync } from "@/hooks/useSafeAsync";
import { serviceRequest } from "@/services/service-client";
import { TimetablePreview } from "@/modules/timetable/components/TimetablePreview";
import { normalizeStudentInfo, type StudentProfileData } from "../student-info";

// ────────────────────────────────────────────────────────────────────────
// API response shapes — preserved 1:1 from the previous implementation so
// the data fetch contract with the backend stays identical.
// ────────────────────────────────────────────────────────────────────────

type DashboardStatsResponse = {
  dashboard: {
    total_children: number;
    children_overview: Array<{
      student_id: string;
      name: string;
      class: string;
      current_grade: string;
      attendance_percentage: number;
      pending_fees: number;
      pending_assignments: number;
      academic_year: string;
    }>;
    summary: {
      total_pending_fees: number;
      total_assignments_pending: number;
      alerts_count: number;
    };
  };
};

type StudentResultsResponse = {
  student: string;
  class: string;
  current_academic_year: string;
  exam_results: Array<{
    exam_id: string;
    exam_name: string;
    exam_date: string;
    percentage: number;
    overall_grade: string;
    position: number;
    total_students: number;
    subject_details: Array<{ subject: string; percentage: number; grade: string }>;
  }>;
};

type AttendanceResponse = {
  student: string;
  class: string;
  attendance_summary: {
    total_working_days: number;
    present_days: number;
    absent_days: number;
    leave_days: number;
    attendance_percentage: number;
    status: string;
  };
  recent_records: Array<{ date: string; status: string }>;
};

type FeeResponse = {
  student: string;
  class: string;
  academic_year: string;
  fee_summary: {
    total_fee: number;
    collected: number;
    pending: number;
    percentage_paid: number;
    status: string;
  };
  fee_details: Array<{
    fee_type: string;
    amount: number;
    due_date: string;
    status: string;
    payment_date: string | null;
    receipt_no: string | null;
  }>;
  payment_history: Array<{
    receipt_no: string;
    date: string;
    amount: number;
    fee_type: string;
    method: string;
    status: string;
  }>;
};

type HomeworkResponse = {
  student: string;
  homework_list: Array<{
    id: string;
    title: string;
    subject: string;
    posted_by: string;
    posted_date: string;
    due_date: string;
    status: string;
    description: string;
    attachments: string[];
    submission_status: string;
    submission_date: string | null;
  }>;
  summary: { total_assignments: number; pending: number; completed: number; overdue: number };
};

type AnnouncementsResponse = {
  student: string;
  announcements: Array<{
    id: string;
    title: string;
    content: string;
    posted_date: string;
    posted_by: string;
    priority: string;
    category: string;
  }>;
};

async function loadStudentId(userStudentId?: string) {
  if (userStudentId) return userStudentId;
  const result = await serviceRequest<{ students: Array<{ id: string }> }>(
    "/api/parent/student-info"
  );
  if (!result.ok) return "";
  return result.data.students?.[0]?.id ?? "";
}

// ────────────────────────────────────────────────────────────────────────
// Page component
// ────────────────────────────────────────────────────────────────────────

export function StudentDashboardPage() {
  const { user } = useAuth();
  const { state, run } = useSafeAsync<{
    profile: StudentProfileData;
    stats: DashboardStatsResponse | null;
    results: StudentResultsResponse | null;
    attendance: AttendanceResponse | null;
    fees: FeeResponse | null;
    homework: HomeworkResponse | null;
    announcements: AnnouncementsResponse | null;
  }>();

  useEffect(() => {
    void run(async () => {
      const studentId = await loadStudentId(user?.studentId);
      if (!studentId) {
        throw new Error("No student profile is linked to this account.");
      }

      const [profile, stats, results, attendance, fees, homework, announcements] =
        await Promise.all([
          serviceRequest<unknown>(`/api/parent/student-info?student_id=${studentId}`),
          serviceRequest<DashboardStatsResponse>("/api/parent/dashboard/stats"),
          serviceRequest<StudentResultsResponse>(
            `/api/parent/student-results?student_id=${studentId}`
          ),
          serviceRequest<AttendanceResponse>(
            `/api/parent/student-attendance?student_id=${studentId}`
          ),
          serviceRequest<FeeResponse>(`/api/parent/fees?student_id=${studentId}`),
          serviceRequest<HomeworkResponse>(
            `/api/parent/child/homework?student_id=${studentId}`
          ),
          serviceRequest<AnnouncementsResponse>(
            `/api/parent/child/announcements?student_id=${studentId}`
          ),
        ]);

      if (!profile.ok) {
        throw new Error(profile.error.message || "Failed to load student profile");
      }

      const normalizedProfile = normalizeStudentInfo(profile.data);
      if (!normalizedProfile) {
        throw new Error("Failed to load student profile");
      }

      return {
        profile: normalizedProfile,
        stats: stats.ok ? stats.data : null,
        results: results.ok ? results.data : null,
        attendance: attendance.ok ? attendance.data : null,
        fees: fees.ok ? fees.data : null,
        homework: homework.ok ? homework.data : null,
        announcements: announcements.ok ? announcements.data : null,
      };
    }).catch(() => {
      // useSafeAsync already captures the error
    });
  }, [run, user?.studentId]);

  if (state.status === "idle" || state.status === "loading") {
    return (
      <SchoolShell eyebrow="Student Portal" title="Student Dashboard">
        <div className="space-y-4">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {Array(6)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="h-[80px] w-full rounded-xl" />
              ))}
          </div>
          <Skeleton className="h-80 w-full rounded-2xl" />
        </div>
      </SchoolShell>
    );
  }

  if (state.status === "error" || !state.data) {
    return (
      <SchoolShell eyebrow="Student Portal" title="Dashboard">
        <DataState
          variant="empty"
          title="No student profile found"
          message={
            state.error ||
            "Your account is not linked to any student record. Please contact your school administrator."
          }
        />
      </SchoolShell>
    );
  }

  const profile = state.data.profile;
  const student = profile.student;
  const studentName =
    student.name ||
    (student.first_name && student.last_name
      ? `${student.first_name} ${student.last_name}`
      : "Student");
  const className = student.class || student.class_name || "";
  const section = student.section || "";
  const academicYear = student.academic_year || "";
  const rollNo = student.roll_no || student.admission_no || "—";
  const status = student.status || "active";

  const latestResult = state.data.results?.exam_results?.[0];
  const attendance = state.data.attendance?.attendance_summary;
  const fees = state.data.fees?.fee_summary;
  const homework = state.data.homework?.summary;
  const upcomingExams = state.data.results?.exam_results?.slice(0, 3) ?? [];

  // Class id for the timetable preview — use the value persisted by the
  // login flow (`localStorage.class_id`) so the preview filters correctly.
  // Falls back to empty string so the preview renders its own empty state.
  const classId = user?.classId || "";

  // ────────────────────────────────────────────────────────────────────
  // Stat row — six compact cards, one per top-level metric.
  // ────────────────────────────────────────────────────────────────────
  const statItems: StatCardCompactProps[] = [
    {
      label: "Attendance",
      value: `${attendance?.attendance_percentage ?? 0}%`,
      icon: "fact_check",
      accent: "emerald",
      hint:
        attendance?.total_working_days != null
          ? `${attendance.present_days}/${attendance.total_working_days} days`
          : undefined,
      to: "/student/attendance",
    },
    {
      label: "Current Grade",
      value: latestResult?.overall_grade ?? "—",
      icon: "leaderboard",
      accent: "blue",
      hint: latestResult ? `${latestResult.percentage}% overall` : undefined,
      to: "/student/results",
    },
    {
      label: "Pending Fees",
      value: `Rs ${(fees?.pending ?? 0).toLocaleString()}`,
      icon: "payments",
      accent: fees && fees.pending > 0 ? "rose" : "emerald",
      hint:
        fees?.percentage_paid != null
          ? `${fees.percentage_paid}% paid`
          : undefined,
      to: "/student/fees",
    },
    {
      label: "Homework",
      value: homework?.pending ?? 0,
      icon: "assignment",
      accent: "amber",
      hint:
        homework && homework.overdue > 0
          ? `${homework.overdue} overdue`
          : "Open assignments",
      to: "/student/homework",
    },
    {
      label: "Subjects",
      value: profile.enrolled_subjects.length,
      icon: "menu_book",
      accent: "purple",
      hint: "Enrolled this term",
      to: "/student/profile",
    },
    {
      label: "Alerts",
      value: state.data.stats?.dashboard?.summary?.alerts_count ?? 0,
      icon: "notifications",
      accent: "slate",
      hint: "Across all areas",
      to: "/student/announcements",
    },
  ];

  // ────────────────────────────────────────────────────────────────────
  return (
    <SchoolShell eyebrow="Student Portal" title="Student Dashboard">
      {/* ── Hero strip ───────────────────────────────────────────────── */}
      <div className="mb-4 p-5 rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 overflow-hidden relative">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-[9px] font-black text-blue-600 uppercase tracking-wider border border-blue-100">
              Active Student
            </span>
            <span className="text-[10px] font-bold text-slate-400 normal-case">
              Roll No: {rollNo}
            </span>
            <span
              className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${
                status === "active"
                  ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                  : "bg-slate-50 text-slate-600 border-slate-100"
              }`}
            >
              {status}
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            {studentName}
          </h2>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
            <div className="flex items-center gap-1.5 text-slate-500">
              <AppIcon name="GraduationCap" size={14} />
              <span className="text-[11px] font-bold">
                {className}
                {section ? ` - ${section}` : ""}
              </span>
            </div>
            {academicYear ? (
              <div className="flex items-center gap-1.5 text-slate-500">
                <AppIcon name="Calendar" size={14} />
                <span className="text-[11px] font-bold">{academicYear}</span>
              </div>
            ) : null}
            {profile.guardian.name ? (
              <div className="flex items-center gap-1.5 text-slate-500">
                <AppIcon name="Users" size={14} />
                <span className="text-[11px] font-bold">
                  Guardian: {profile.guardian.name}
                </span>
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-stretch gap-3 md:border-l md:border-slate-100 md:pl-6">
          <div className="rounded-xl border border-emerald-100/60 bg-emerald-50/30 px-4 py-2.5">
            <p className="text-[9px] font-black text-emerald-700/70 uppercase tracking-[0.1em]">
              Attendance
            </p>
            <p className="text-lg font-black text-emerald-700 leading-tight">
              {attendance?.attendance_percentage ?? 0}%
            </p>
          </div>
          <div className="rounded-xl border border-blue-100/60 bg-blue-50/30 px-4 py-2.5">
            <p className="text-[9px] font-black text-blue-700/70 uppercase tracking-[0.1em]">
              Grade
            </p>
            <p className="text-lg font-black text-blue-700 leading-tight">
              {latestResult?.overall_grade ?? "—"}
            </p>
          </div>
          <div className="rounded-xl border border-amber-100/60 bg-amber-50/30 px-4 py-2.5">
            <p className="text-[9px] font-black text-amber-700/70 uppercase tracking-[0.1em]">
              Pending
            </p>
            <p className="text-lg font-black text-amber-700 leading-tight">
              {homework?.pending ?? 0}
            </p>
          </div>
        </div>

        <AppIcon name="GraduationCap" size={120} className="absolute right-[-10px] bottom-[-20px] text-slate-50 opacity-50 select-none pointer-events-none" />
      </div>

      {/* ── KPI strip ─────────────────────────────────────────────────── */}
      <div className="mb-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {statItems.map((item, i) => (
          <StatCardCompact key={`${item.label}-${i}`} {...item} />
        ))}
      </div>

      {/* ── Main grid: schedule/tasks (2/3) + sidebar (1/3) ──────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left column ─────────────────────────────────────────────── */}
        <div className="space-y-4 lg:col-span-2">
          {/* Today's Schedule */}
          <div className="premium-card p-3.5">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-[10px] font-bold normal-case text-slate-400">
                  Today's Schedule
                </h3>
                <p className="text-[9px] font-medium text-slate-400 normal-case">
                  Current academic block
                </p>
              </div>
              <Link
                to="/student/timetable"
                className="text-[9px] font-bold text-blue-600 normal-case hover:underline"
              >
                Full Timetable
              </Link>
            </div>
            {classId ? (
              <TimetablePreview classId={classId} />
            ) : (
              <div className="py-10 text-center">
                <AppIcon name="Calendar" size={36} className="text-slate-200 mb-2" />
                <p className="text-[11px] font-medium text-slate-500">
                  No timetable available yet.
                </p>
              </div>
            )}
          </div>

          {/* Pending Tasks + Upcoming Exams row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pending Tasks */}
            <div className="premium-card p-3.5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-[10px] font-bold normal-case text-slate-400">
                  Things to Do
                </h3>
                <AppIcon name="CheckCircle2" size={16} className="text-slate-300" />
              </div>
              <div className="space-y-1.5">
                {[
                  {
                    label: "Pending Homework",
                    count: homework?.pending ?? 0,
                    href: "/student/homework",
                  },
                  {
                    label: "Overdue Items",
                    count: homework?.overdue ?? 0,
                    href: "/student/homework",
                  },
                  {
                    label: "Pending Fees",
                    count: fees && fees.pending > 0 ? 1 : 0,
                    href: "/student/fees",
                  },
                ].map((task) => (
                  <Link
                    key={task.label}
                    to={task.href}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors group"
                  >
                    <span className="text-[11px] font-bold text-slate-700 group-hover:text-blue-600 transition-colors">
                      {task.label}
                    </span>
                    <span
                      className={`h-5 min-w-[20px] px-1.5 flex items-center justify-center rounded-md font-bold text-[9px] ${
                        task.count > 0
                          ? "bg-rose-50 text-rose-600"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {task.count}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Upcoming Exams */}
            <div className="premium-card p-3.5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-[10px] font-bold normal-case text-slate-400">
                  Recent Exam Results
                </h3>
                <AppIcon name="HelpCircle" size={16} className="text-slate-300" />
              </div>
              <div className="space-y-2">
                {upcomingExams.length > 0 ? (
                  upcomingExams.map((exam) => {
                    const grade = exam.overall_grade || "—";
                    const isHigh = grade.startsWith("A");
                    const isFail = grade === "F";
                    return (
                      <div
                        key={exam.exam_id}
                        className="flex items-center justify-between p-2 rounded-lg border border-transparent hover:border-slate-100 hover:bg-slate-50/50 transition-all"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-bold text-slate-900 truncate">
                            {exam.exam_name}
                          </p>
                          <p className="text-[9px] font-medium text-slate-400">
                            {exam.exam_date} · {exam.percentage}%
                          </p>
                        </div>
                        <span
                          className={`h-5 min-w-[26px] px-1.5 flex items-center justify-center rounded-md font-bold text-[10px] ${
                            isHigh
                              ? "bg-emerald-50 text-emerald-600"
                              : isFail
                                ? "bg-rose-50 text-rose-600"
                                : "bg-blue-50 text-blue-600"
                          }`}
                        >
                          {grade}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-6 text-center">
                    <AppIcon name="HelpCircle" size={30} className="text-slate-200 mb-1" />
                    <p className="text-[10px] font-medium text-slate-500">
                      No published results yet.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Attendance */}
          <div className="premium-card p-3.5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[10px] font-bold normal-case text-slate-400">
                Recent Attendance
              </h3>
              <Link
                to="/student/attendance"
                className="text-[9px] font-bold text-blue-600 normal-case hover:underline"
              >
                View All
              </Link>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {(state.data.attendance?.recent_records ?? [])
                .slice(0, 14)
                .map((rec) => {
                  const tone =
                    rec.status.toLowerCase() === "present"
                      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                      : rec.status.toLowerCase() === "absent"
                        ? "bg-rose-100 text-rose-700 border-rose-200"
                        : "bg-amber-100 text-amber-700 border-amber-200";
                  const day = new Date(rec.date).toLocaleDateString(undefined, {
                    day: "numeric",
                  });
                  return (
                    <div
                      key={rec.date}
                      title={`${rec.date} — ${rec.status}`}
                      className={`aspect-square rounded-md border flex items-center justify-center text-[10px] font-bold ${tone}`}
                    >
                      {day}
                    </div>
                  );
                })}
              {(state.data.attendance?.recent_records?.length ?? 0) === 0 ? (
                <p className="col-span-7 py-4 text-center text-[10px] font-medium text-slate-400">
                  No attendance records yet.
                </p>
              ) : null}
            </div>
          </div>
        </div>

        {/* Right column ────────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Quick navigation */}
          <div className="premium-card p-3.5">
            <h3 className="mb-3 text-[10px] font-bold normal-case text-slate-400">
              Quick Navigation
            </h3>
            <div className="space-y-1">
              {[
                { label: "Profile", href: "/student/profile", icon: "person" },
                { label: "Live Classes", href: "/student/live-class", icon: "videocam" },
                { label: "Live Exams", href: "/student/live-exam", icon: "live_tv" },
                { label: "Results", href: "/student/results", icon: "leaderboard" },
                { label: "Attendance", href: "/student/attendance", icon: "fact_check" },
                { label: "Fees", href: "/student/fees", icon: "payments" },
                { label: "Homework", href: "/student/homework", icon: "assignment" },
                { label: "Announcements", href: "/student/announcements", icon: "campaign" },
                { label: "Events", href: "/student/events", icon: "event" },
                { label: "Leave", href: "/student/leave", icon: "event_busy" },
              ].map((action) => (
                <Link
                  key={action.label}
                  to={action.href}
                  className="flex items-center justify-between p-2 rounded-lg border border-transparent hover:border-blue-100 hover:bg-blue-50/30 transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <AppIcon name={action.icon} size={16} className="text-blue-500 group-hover:scale-110 transition-transform" />
                    <span className="text-[11px] font-bold text-slate-700 group-hover:text-blue-600 transition-colors">
                      {action.label}
                    </span>
                  </div>
                  <AppIcon name="ChevronRight" size={14} className="text-slate-300 group-hover:text-blue-500" />
                </Link>
              ))}
            </div>
          </div>

          {/* Announcements */}
          <div className="premium-card p-3.5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[10px] font-bold normal-case text-slate-400">
                Announcements
              </h3>
              <AppIcon name="Megaphone" size={16} className="text-slate-300" />
            </div>
            <div className="space-y-2 max-h-[360px] overflow-y-auto custom-scrollbar pr-1">
              {state.data.announcements?.announcements?.length ? (
                state.data.announcements.announcements.slice(0, 6).map((item) => {
                  const priorityTone =
                    item.priority === "high"
                      ? "bg-rose-50 text-rose-600 border-rose-100"
                      : item.priority === "medium"
                        ? "bg-amber-50 text-amber-600 border-amber-100"
                        : "bg-slate-50 text-slate-500 border-slate-100";
                  return (
                    <div
                      key={item.id}
                      className="rounded-lg border border-slate-100 p-2.5 hover:border-blue-100 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-[11px] font-bold text-slate-900 leading-tight">
                          {item.title}
                        </p>
                        <span
                          className={`shrink-0 px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider border ${priorityTone}`}
                        >
                          {item.priority}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-600 leading-relaxed line-clamp-2 mb-1">
                        {item.content}
                      </p>
                      <p className="text-[9px] font-medium text-slate-400">
                        {item.posted_date}
                      </p>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center border-2 border-dashed border-slate-100 rounded-xl">
                  <AppIcon name="Megaphone" size={30} className="text-slate-200 mb-1" />
                  <p className="text-[10px] font-medium text-slate-400">
                    No announcements right now.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Subjects pill cloud */}
          {profile.enrolled_subjects.length > 0 ? (
            <div className="premium-card p-3.5">
              <h3 className="mb-3 text-[10px] font-bold normal-case text-slate-400">
                Enrolled Subjects
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {profile.enrolled_subjects.map((subject) => (
                  <span
                    key={subject.id}
                    className="px-2.5 py-1 rounded-md border border-slate-100 bg-slate-50 text-[10px] font-bold text-slate-700"
                  >
                    {subject.name}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </SchoolShell>
  );
}
