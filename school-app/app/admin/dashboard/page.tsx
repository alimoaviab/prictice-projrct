"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "../../../components/ui";
import { SchoolShell } from "../../../layouts/SchoolShell";
import Link from "next/link";
import { getAcademicYearQuery, getSelectedAcademicYearId } from "../../../services/academic-year-context";
import { DashboardDrawer } from "../../../components/dashboard/DashboardDrawer";
import { useClasses } from "../../../modules/classes/hooks/useClasses";
import { useTeachers } from "../../../modules/teachers/hooks/useTeachers";
import { useExams } from "../../../modules/exams/hooks/useExams";
import { serviceRequest } from "../../../services/service-client";

interface DashboardData {
  overview: {
    totalStudents: number;
    totalTeachers: number;
    totalClasses: number;
    attendanceToday: number;
    attendanceDetailed: {
      present: number;
      absent: number;
      total: number;
    };
    activeExams: number;
    pendingLeave: number;
    feeCollection: {
      total: number;
      paid: number;
      percentage: number;
      pending_count: number;
    };
  };
  trends: Array<{ date: string; percentage: number }>;
  alerts: Array<{
    severity: "error" | "warning" | "info";
    title: string;
    message: string;
    cta: string;
    link: string;
  }>;
  classAttendance: Array<{
    class_name: string;
    percentage: number;
  }>;
  activities: Array<{
    action: string;
    entity_type: string;
    actor_email: string;
    created_at: string;
    _id: string;
  }>;
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drawerConfig, setDrawerConfig] = useState<{ isOpen: boolean; type: string; title: string } | null>(null);

  // Real-time data hooks for filters
  const { state: classesState } = useClasses();
  const { state: teachersState } = useTeachers();
  const { state: examsState } = useExams();

  const selectedYearId = getSelectedAcademicYearId();

  useEffect(() => {
    async function fetchDashboard() {
      try {
        setLoading(true);
        setError(null);
        const query = getAcademicYearQuery();
        const result = await serviceRequest<DashboardData>(`/api/analytics/dashboard${query}`);
        if (result.ok && result.data) {
          setData(result.data);
        } else {
          const message =
            (result as any)?.message ||
            (result as any)?.error?.message ||
            "Failed to load dashboard data";
          setError(message);
        }
      } catch (err: any) {
        console.error("[AdminDashboard] fetch error:", err);
        setError(err?.message || "Network error occurred");
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, [selectedYearId]);

  const stats = [
    { title: "Students", value: data?.overview?.totalStudents ?? "0", icon: "school", color: "text-blue-600 bg-blue-50" },
    { title: "Teachers", value: data?.overview?.totalTeachers ?? "0", icon: "badge", color: "text-emerald-600 bg-emerald-50" },
    { title: "Attendance", value: `${data?.overview?.attendanceToday ?? 0}%`, icon: "fact_check", color: "text-amber-600 bg-amber-50" },
    { title: "Fees", value: `${data?.overview?.feeCollection?.percentage ?? 0}%`, icon: "payments", color: "text-purple-600 bg-purple-50" },
    { title: "Exams", value: data?.overview?.activeExams ?? "0", icon: "quiz", color: "text-rose-600 bg-rose-50" }
  ];

  if (error) {
    return (
      <SchoolShell eyebrow="Overview" title="Dashboard">
        <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-center">
          <span className="material-symbols-outlined mb-2 text-2xl text-red-500">error</span>
          <h2 className="text-sm font-bold text-red-900">Failed to load dashboard</h2>
          <p className="text-[11px] text-red-600">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-3 rounded-lg bg-red-600 px-4 py-1.5 text-[11px] font-bold text-white transition-colors hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </SchoolShell>
    );
  }

  const attendanceCompletionPercent = data
    ? Math.round(((data.classAttendance?.length || 0) / (data.overview?.totalClasses || 1)) * 100)
    : 0;

  return (
    <SchoolShell eyebrow="School Overview" title="Admin Dashboard">
      
      {/* 1. KPI Cards Row - Refined Density */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {loading ? (
          Array(5).fill(0).map((_, i) => <div key={i} className="h-[80px] animate-pulse rounded-xl bg-slate-50 border border-slate-100" />)
        ) : (
          stats.map((stat) => (
            <div key={stat.title} className="premium-card relative flex items-center gap-2.5 p-2.5 transition-all hover:border-blue-200/60 hover:shadow-sm">
               <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg ${stat.color} border border-current/5 shadow-sm`}>
                  <span className="material-symbols-outlined text-[16px]">{stat.icon}</span>
               </div>
               <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-bold normal-case  text-slate-400">{stat.title}</p>
                  <h3 className="text-lg font-bold text-slate-900 tabular-nums leading-tight">{stat.value}</h3>
               </div>
               <button 
                 onClick={() => setDrawerConfig({ isOpen: true, type: stat.title, title: stat.title })}
                 className="text-slate-300 hover:text-blue-600 transition-colors p-1"
               >
                 <span className="material-symbols-outlined text-[16px]">visibility</span>
               </button>
            </div>
          ))
        )}
      </div>

      {/* Attendance Completion Strip (Optional Small Widget) */}
      <div className="mb-4 flex items-center justify-between px-4 py-2 bg-blue-50/30 rounded-xl border border-blue-100/50">
        <div className="flex items-center gap-3">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white">
            <span className="material-symbols-outlined text-[14px]">checklist</span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-700">Attendance Tracker</p>
              <p className="text-[8px] font-medium text-slate-500 normal-case tracking-tighter">
              {data?.classAttendance?.length ?? 0} of {data?.overview?.totalClasses ?? 0} classes registered today
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-1 max-w-md mx-6">
           <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${attendanceCompletionPercent}%` }} />
           </div>
           <span className="text-[10px] font-bold text-blue-600">{attendanceCompletionPercent}%</span>
        </div>
        <Link href="/admin/attendance" className="text-[9px] font-bold text-blue-600 normal-case hover:underline">
          View Detail
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left Column - Operational Insights */}
        <div className="space-y-4 lg:col-span-2">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Today Overview Widget */}
              <div className="premium-card p-3.5">
                 <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-[10px] font-bold normal-case  text-slate-400">Today's Attendance</h3>
                    <span className="material-symbols-outlined text-slate-300 text-base">today</span>
                 </div>
                 <div className="grid grid-cols-2 gap-2.5">
                    <div className="rounded-xl border border-emerald-50 bg-emerald-50/30 p-2.5 text-center">
                       <p className="text-[9px] font-bold text-emerald-600 normal-case">Present</p>
                       <h4 className="text-lg font-bold text-emerald-700">{data?.overview?.attendanceDetailed?.present ?? 0}</h4>
                    </div>
                    <div className="rounded-xl border border-rose-50 bg-rose-50/30 p-2.5 text-center">
                       <p className="text-[9px] font-bold text-rose-600 normal-case">Absent</p>
                       <h4 className="text-lg font-bold text-rose-700">{data?.overview?.attendanceDetailed?.absent ?? 0}</h4>
                    </div>
                    <div className="rounded-xl border border-amber-50 bg-amber-50/30 p-2.5 text-center">
                       <p className="text-[9px] font-bold text-amber-600 normal-case">Late</p>
                       <h4 className="text-lg font-bold text-amber-700">0</h4>
                    </div>
                    <div className="rounded-xl border border-slate-50 bg-slate-50/50 p-2.5 text-center">
                       <p className="text-[9px] font-bold text-slate-500 normal-case">Pending</p>
                       <h4 className="text-lg font-bold text-slate-600">0</h4>
                    </div>
                 </div>
                 { (data?.overview?.attendanceDetailed?.total ?? 0) === 0 && (
                   <Link href="/admin/attendance" className="mt-3 block w-full text-center py-2 bg-blue-600 text-white rounded-lg text-[10px] font-bold normal-case  hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20 active:scale-[0.98]">
                     Mark Attendance
                   </Link>
                 )}
              </div>

              {/* Pending Tasks Widget */}
              <div className="premium-card p-3.5">
                 <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-[10px] font-bold normal-case  text-slate-400">Things to Do</h3>
                    <span className="material-symbols-outlined text-slate-300 text-base">task_alt</span>
                 </div>
                 <div className="space-y-1.5">
                    {[
                      { label: "Pending Fees", count: data?.overview?.feeCollection?.pending_count ?? 0, href: "/admin/fee" },
                        { label: "Leave Requests", count: data?.overview?.pendingLeave ?? 0, href: "/admin/leave" },
                        { label: "Unmarked Attendance", count: (data?.overview?.totalClasses || 0) - (data?.classAttendance?.length || 0), href: "/admin/attendance" }
                    ].map((task) => (
                      <Link key={task.label} href={task.href} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors group">
                         <span className="text-[11px] font-bold text-slate-700 group-hover:text-blue-600 transition-colors">{task.label}</span>
                         <span className={`h-5 min-w-[20px] px-1.5 flex items-center justify-center rounded-md font-bold text-[9px] ${task.count > 0 ? "bg-rose-50 text-rose-600" : "bg-slate-100 text-slate-400"}`}>
                           {task.count}
                         </span>
                      </Link>
                    ))}
                 </div>
              </div>
           </div>

           {/* Quick Insights Chips */}
              <div className="flex flex-wrap gap-2">
              {(data?.alerts || []).map((alert, i) => (
                <Link key={i} href={alert.link} className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[9px] font-bold normal-case  transition-all hover:scale-[1.02] ${
                  alert.severity === 'error' ? 'bg-rose-50 border-rose-100 text-rose-600' : 
                  alert.severity === 'warning' ? 'bg-amber-50 border-amber-100 text-amber-600' : 'bg-blue-50 border-blue-100 text-blue-600'
                }`}>
                   <span className="material-symbols-outlined text-[14px]">{alert.severity === 'error' ? 'error' : alert.severity === 'warning' ? 'warning' : 'info'}</span>
                   {alert.title}
                </Link>
              ))}
              {!loading && (data?.alerts?.length ?? 0) === 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-[9px] font-bold normal-case ">
                   <span className="material-symbols-outlined text-[14px]">check_circle</span>
                   Systems Nominal
                </div>
              )}
           </div>

           {/* Upcoming Timeline (REAL Data Only) */}
           <div className="premium-card p-3.5">
              <div className="mb-4 flex items-center justify-between">
                 <h3 className="text-[10px] font-bold normal-case  text-slate-400">Upcoming Events & Exams</h3>
                 <span className="material-symbols-outlined text-slate-300 text-base">event</span>
              </div>
              <div className="relative ml-2 pl-4 border-l-2 border-slate-100">
                  {(data?.alerts || []).filter(a => a.severity === "info" && a.title.includes("Exam")).length ? (
                    <div className="space-y-4">
                      {(data?.alerts || []).filter(a => a.severity === "info" && a.title.includes("Exam")).map((alert, i) => (
                         <div key={i} className="relative">
                            <div className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-blue-600 border-2 border-white shadow-sm" />
                            <div>
                               <p className="text-[11px] font-bold text-slate-900">{alert.title}</p>
                               <p className="text-[9px] font-medium text-slate-500">{alert.message}</p>
                            </div>
                         </div>
                       ))}
                    </div>
                 ) : (
                    <div className="py-4 text-center">
                       <span className="material-symbols-outlined text-slate-200 text-3xl mb-1">calendar_today</span>
                       <p className="text-[11px] font-medium text-slate-500 mb-3">No upcoming events scheduled.</p>
                       <Link href="/admin/exams?action=new" className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg border border-slate-200 text-[10px] font-bold normal-case  text-slate-600 hover:border-blue-300 hover:text-blue-600 transition-all">
                          <span className="material-symbols-outlined text-sm">add</span>
                          Create Event
                       </Link>
                    </div>
                 )}
              </div>
           </div>
        </div>

        {/* Right Column - Activity Feed */}
        <div className="space-y-4">
           <div className="premium-card p-3.5 h-full flex flex-col">
              <div className="mb-4 flex items-center justify-between">
                 <h3 className="text-[10px] font-bold normal-case  text-slate-400">Recent Updates</h3>
                 <span className="material-symbols-outlined text-slate-300 text-base">rss_feed</span>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar max-h-[520px] pr-1">
                 {loading ? (
                   Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)
                 ) : data?.activities && data.activities.length > 0 ? (
                   data.activities.map((act) => (
                     <div key={act._id} className="flex items-start gap-3 p-2 rounded-xl border border-transparent hover:border-slate-50 hover:bg-slate-50/50 transition-all group">
                        <div className="h-7 w-7 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 shrink-0 group-hover:bg-white group-hover:text-blue-600 group-hover:shadow-sm transition-all">
                           <span className="material-symbols-outlined text-[15px]">
                             {act.entity_type === 'student' ? 'school' : 
                              act.entity_type === 'fee' ? 'payments' : 
                              act.entity_type === 'attendance' ? 'fact_check' : 'edit'}
                           </span>
                        </div>
                        <div className="min-w-0 flex-1">
                           <p className="text-[11px] font-bold text-slate-700 leading-tight">
                             <span className="normal-case">{act.action}</span> {act.entity_type}
                           </p>
                           <p className="text-[9px] font-medium text-slate-400 mt-0.5 truncate">{act.actor_email}</p>
                           <p className="text-[8px] font-bold text-slate-300 normal-case mt-1">
                             {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                           </p>
                        </div>
                     </div>
                   ))
                 ) : (
                   <div className="py-16 text-center border-2 border-dashed border-slate-50 rounded-2xl">
                      <span className="material-symbols-outlined text-slate-100 text-4xl mb-2">history</span>
                      <p className="text-[11px] font-bold text-slate-300 normal-case ">No recent activity available.</p>
                   </div>
                 )}
              </div>
           </div>
        </div>
      </div>

      {/* Dashboard Drawer Implementation */}
      <DashboardDrawer 
        isOpen={!!drawerConfig?.isOpen} 
        onClose={() => setDrawerConfig(null)}
        title={drawerConfig?.title || ""}
      >
          <div className="space-y-4">
            {/* Filter Configuration Area - Live System Data */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[9px] font-bold normal-case  text-slate-400">View Configuration</p>
                <div className="flex items-center gap-2">
                  {(classesState.status === "loading" || teachersState.status === "loading") && (
                    <div className="flex gap-1">
                      <span className="w-1 h-1 rounded-full bg-blue-600 animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1 h-1 rounded-full bg-blue-600 animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1 h-1 rounded-full bg-blue-600 animate-bounce" />
                    </div>
                  )}
                  <span className="material-symbols-outlined text-slate-300 text-sm">tune</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 pl-0.5">
                  {drawerConfig?.type === "Students" || drawerConfig?.type === "Attendance" ? "Select Class" : 
                   drawerConfig?.type === "Teachers" ? "Select Instructor" : 
                   drawerConfig?.type === "Fees" ? "Select Category" : "Select Examination"}
                </label>
                <div className="relative">
                  <select className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-bold text-slate-700 outline-none appearance-none cursor-pointer focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 transition-all">
                    <option value="all">All {drawerConfig?.type}</option>
                    
                    {/* Live Classes Data */}
                    {(drawerConfig?.type === "Students" || drawerConfig?.type === "Attendance") && 
                      (classesState.data as any)?.data?.map((cls: any) => (
                        <option key={cls._id} value={cls._id}>{cls.name}</option>
                      ))
                    }

                    {/* Live Teachers Data */}
                    {drawerConfig?.type === "Teachers" && 
                      teachersState.data?.map(t => (
                        <option key={t._id} value={t._id}>{t.first_name} {t.last_name}</option>
                      ))
                    }

                    {/* Live Exams Data */}
                    {drawerConfig?.type === "Exams" && 
                      examsState.data?.map(ex => (
                        <option key={ex._id} value={ex._id}>{ex.title}</option>
                      ))
                    }

                    {/* Static Categories for Fees */}
                    {drawerConfig?.type === "Fees" && (
                      <>
                        <option value="tuition">Tuition Fees</option>
                        <option value="transport">Transport Fees</option>
                        <option value="activities">Extra-Curricular</option>
                      </>
                    )}
                  </select>
                  <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-base">expand_more</span>
                </div>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                <p className="text-[9px] font-bold normal-case  text-slate-400">Current Value</p>
                <h4 className="mt-1 text-2xl font-bold text-slate-900">
                  {drawerConfig?.type === "Students" ? (data?.overview?.totalStudents ?? 0) : 
                   drawerConfig?.type === "Teachers" ? (data?.overview?.totalTeachers ?? 0) : 
                   drawerConfig?.type === "Attendance" ? `${data?.overview?.attendanceToday ?? 0}%` : 
                   drawerConfig?.type === "Fees" ? `${data?.overview?.feeCollection?.percentage ?? 0}%` : 
                   (data?.overview?.activeExams ?? 0)}
                </h4>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-blue-50/20 p-4">
                <p className="text-[9px] font-bold normal-case  text-blue-400">Filter Status</p>
                <h4 className="mt-1 text-xs font-bold text-blue-600 truncate">
                  {classesState.status === "loading" || teachersState.status === "loading" || examsState.status === "loading" 
                    ? "Synchronizing..." 
                    : "Live Data Feed"}
                </h4>
              </div>
            </div>
          </div>
      </DashboardDrawer>
    </SchoolShell>
  );
}
