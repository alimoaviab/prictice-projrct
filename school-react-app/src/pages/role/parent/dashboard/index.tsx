import { AppIcon } from "shared/ui/AppIcon";
/**
 * Parent dashboard.
 *
 * Adapts the /api/parent/dashboard/stats response into a flat view
 * model with safe defaults so a missing field never crashes the page.
 *
 * The backend now returns:
 *   {
 *     dashboard: { children_overview: [{ ... }] },
 *     attendance, upcomingExams, recentResults, feeDue,
 *   }
 *
 * Earlier the page accessed `data.dashboard.children_overview[0]`
 * directly; if any link in that chain was missing the whole tree
 * crashed. The adapter below is defensive end-to-end.
 *
 * Switch behaviour: the `useEffect` hook depends on `selectedChild`,
 * so changing the active child in the header refetches the dashboard
 * automatically — no manual refresh required.
 */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { SchoolShell } from "@/layouts/SchoolShell";
import { useSelectedChild } from "@/contexts/SelectedChildContext";
import { serviceRequest } from "@/services/service-client";
import { TimetablePreview } from "@/modules/timetable/components/TimetablePreview";

interface DashboardOverview {
  student_id: string;
  name: string;
  class: string;
  current_grade: string;
  attendance_percentage: number;
  pending_fees: number;
  pending_assignments: number;
}

interface DashboardApiResponse {
  dashboard?: { children_overview?: DashboardOverview[] };
  attendance?: { present?: number; total?: number; percentage?: number };
  upcomingExams?: Array<{ _id: string; title: string; subject: string; starts_at: string }>;
  recentResults?: Array<{ _id: string; exam_id: string; obtained_marks: number }>;
  feeDue?: { amount?: number; due_date?: string | null };
}

interface StudentInfo {
  roll_no: string;
  class: string;
  section: string;
}

function safe<T>(v: T | undefined | null, fallback: T): T {
  return v == null ? fallback : v;
}

export function ParentDashboardPage() {
  const { selectedChild, loading: contextLoading } = useSelectedChild();
  const [stats, setStats] = useState<DashboardOverview | null>(null);
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedChild) return;
    let cancelled = false;
    async function fetchData() {
      setLoading(true);
      try {
        if (!selectedChild) return;
        const [statsRes, infoRes] = await Promise.all([
          serviceRequest<DashboardApiResponse>(
            `/api/parent/dashboard/stats?student_id=${encodeURIComponent(
              selectedChild.student_id
            )}`
          ),
          serviceRequest<{ student?: StudentInfo }>(
            `/api/parent/student-info?student_id=${encodeURIComponent(
              selectedChild.student_id
            )}`
          ),
        ]);
        if (cancelled) return;

        const overview =
          statsRes.ok && statsRes.data?.dashboard?.children_overview?.[0]
            ? statsRes.data.dashboard.children_overview[0]
            : null;
        // Synthesize an overview from the legacy fields if the new
        // shape isn't present yet — keeps the page working during a
        // partial backend rollout.
        const fallback: DashboardOverview | null = statsRes.ok
          ? {
              student_id: selectedChild.student_id,
              name: selectedChild.student_name,
              class: selectedChild.class_name,
              current_grade: "—",
              attendance_percentage: safe(statsRes.data?.attendance?.percentage, 0),
              pending_fees: safe(statsRes.data?.feeDue?.amount, 0),
              pending_assignments: 0,
            }
          : null;
        setStats(overview ?? fallback);

        if (infoRes.ok && infoRes.data?.student) {
          setStudentInfo(infoRes.data.student);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void fetchData();
    return () => {
      cancelled = true;
    };
  }, [selectedChild]);

  if (contextLoading || (loading && !stats)) {
    return (
      <SchoolShell eyebrow="Guardian Portal" title="Academic Oversight">
        <div className="flex items-center justify-center h-64">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-100 border-t-blue-600" />
        </div>
      </SchoolShell>
    );
  }

  if (!selectedChild) {
    return (
      <SchoolShell eyebrow="Guardian Portal" title="Academic Oversight">
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <AppIcon name="Users" size={36} className="text-slate-200 mb-3" />
          <h3 className="text-sm font-bold text-slate-700">No student selected</h3>
          <p className="text-[11px] text-slate-400 mt-1">
            Pick a child from the header to load their dashboard.
          </p>
        </div>
      </SchoolShell>
    );
  }

  // Stats are guaranteed to exist past this point — either real or
  // the synthesized fallback above. Never throw on missing fields.
  const data: DashboardOverview = stats ?? {
    student_id: selectedChild.student_id,
    name: selectedChild.student_name,
    class: selectedChild.class_name,
    current_grade: "—",
    attendance_percentage: 0,
    pending_fees: 0,
    pending_assignments: 0,
  };

  return (
    <SchoolShell eyebrow="Guardian Portal" title="Academic Oversight">
      {/* Compact Hero Strip */}
      <div className="mb-6 p-6 rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden relative">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-[9px] font-black text-blue-600 uppercase tracking-wider border border-blue-100">
              Active Student
            </span>
            <span className="text-[10px] font-bold text-slate-400">
              Roll No: {studentInfo?.roll_no || selectedChild.admission_no || "—"}
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            {selectedChild.student_name}
          </h2>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1.5 text-slate-500">
              <AppIcon name="GraduationCap" size={14} />
              <span className="text-[11px] font-bold">
                {studentInfo?.class || selectedChild.class_name}
                {studentInfo?.section
                  ? ` - ${studentInfo.section}`
                  : selectedChild.class_section
                    ? ` - ${selectedChild.class_section}`
                    : ""}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-8 md:border-l md:border-slate-100 md:pl-8">
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] mb-1">
              Attendance
            </p>
            <p className="text-lg font-black text-slate-900">
              {data.attendance_percentage}%
            </p>
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] mb-1">
              Pending Fees
            </p>
            <p className="text-lg font-black text-blue-600">
              Rs. {Number(data.pending_fees || 0).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] mb-1">
              Current GPA
            </p>
            <p className="text-lg font-black text-slate-900">{data.current_grade}</p>
          </div>
        </div>

        <AppIcon name="Award" size={120} className="absolute right-[-10px] bottom-[-20px] text-slate-50 opacity-50 select-none" />
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "Attendance Status",
            value: `${data.attendance_percentage}%`,
            sub: "Monthly average",
            icon: "event_available",
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "Pending Tasks",
            value: data.pending_assignments,
            sub: "Homework & projects",
            icon: "assignment",
            color: "text-amber-600",
            bg: "bg-amber-50",
          },
          {
            label: "Fee Status",
            value: `Rs. ${Number(data.pending_fees || 0).toLocaleString()}`,
            sub: "Total outstanding",
            icon: "payments",
            color: "text-rose-600",
            bg: "bg-rose-50",
          },
          {
            label: "Performance",
            value: data.current_grade,
            sub: "Last exam grade",
            icon: "trending_up",
            color: "text-emerald-600",
            bg: "bg-emerald-50",
          },
        ].map((m) => (
          <div
            key={m.label}
            className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:border-blue-200 transition-all"
          >
            <div
              className={`h-8 w-8 rounded-lg ${m.bg} ${m.color} flex items-center justify-center mb-3`}
            >
              <AppIcon name={m.icon} size={18} />
            </div>
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mb-0.5">
              {m.label}
            </h3>
            <p className="text-lg font-black text-slate-900">{m.value}</p>
            <p className="text-[9px] font-medium text-slate-500 mt-1">{m.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timetable Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-[13px] font-black text-slate-900 tracking-tight">
                  Today's Schedule
                </h3>
                <p className="text-[10px] font-medium text-slate-500">
                  Current active academic block
                </p>
              </div>
              <Link
                to="/parent/timetable"
                className="text-[10px] font-black text-blue-600 hover:underline uppercase tracking-widest"
              >
                View Full
              </Link>
            </div>
            <div className="p-5">
              <TimetablePreview classId={selectedChild.class_id} />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.1em] mb-4">
              Quick Connectivity
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {[
                { label: "View Timetable", href: "/parent/timetable", icon: "calendar_today" },
                { label: "View Homework", href: "/parent/homework", icon: "edit_note" },
                { label: "View Results", href: "/parent/results", icon: "leaderboard" },
                { label: "View Fees", href: "/parent/fees", icon: "payments" },
                { label: "View Attendance", href: "/parent/attendance", icon: "fact_check" },
              ].map((action) => (
                <Link
                  key={action.label}
                  to={action.href}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-50 hover:border-blue-200 hover:bg-blue-50/30 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <AppIcon name={action.icon} size={18} className="text-blue-500 group-hover:scale-110 transition-transform" />
                    <span className="text-[11px] font-bold text-slate-700">{action.label}</span>
                  </div>
                  <AppIcon name="ChevronRight" size={14} className="text-slate-300 group-hover:text-blue-500" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SchoolShell>
  );
}
