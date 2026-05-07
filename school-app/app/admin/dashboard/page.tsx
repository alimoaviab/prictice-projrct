"use client";

import { useEffect, useState } from "react";
import { Card, Skeleton, CardSkeleton } from "../../../components/ui";
import { SchoolShell } from "../../../layouts/SchoolShell";
import Link from "next/link";

interface DashboardData {
  overview: {
    totalStudents: number;
    totalTeachers: number;
    attendanceToday: number;
    activeExams: number;
    pendingLeave: number;
    feeCollection: {
      total: number;
      paid: number;
      percentage: number;
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
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch("/api/analytics/dashboard");
        const payload = await res.json();
        if (payload.ok) {
          setData(payload.data);
        } else {
          setError(payload.error?.message || "Failed to load dashboard data");
        }
      } catch (err) {
        setError("Network error occurred");
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  const stats = [
    { title: "Total Students", value: data?.overview.totalStudents ?? "0", detail: "Active enrollment", icon: "group", trend: "+2%", trendUp: true },
    { title: "Total Teachers", value: data?.overview.totalTeachers ?? "0", detail: "Faculty members", icon: "badge", trend: "Stable", trendUp: true },
    { title: "Attendance Today", value: `${data?.overview.attendanceToday ?? 0}%`, detail: "Present today", icon: "check_circle", trend: "+1.2%", trendUp: true },
    { title: "Fee Collection", value: `${data?.overview.feeCollection.percentage ?? 0}%`, detail: "Of total target", icon: "payments", trend: "+5%", trendUp: true },
    { title: "Upcoming Exams", value: data?.overview.activeExams ?? "0", detail: "Active schedule", icon: "quiz", trend: "Normal", trendUp: true }
  ];

  if (error) {
    return (
      <SchoolShell eyebrow="Overview" title="Dashboard">
        <div className="rounded-2xl border border-red-100 bg-red-50 px-6 py-6 text-center">
          <span className="material-symbols-outlined mb-3 text-3xl text-red-500">error</span>
          <h2 className="text-base font-semibold text-red-900">Failed to load dashboard</h2>
          <p className="mt-1.5 text-sm text-red-600">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </SchoolShell>
    );
  }

  return (
    <SchoolShell eyebrow="System Overview" title="Dashboard">

      {/* Main Stats Grid */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
        {loading ? (
          Array(5).fill(0).map((_, i) => <div key={i} className="h-32 animate-pulse space-y-3 rounded-2xl border border-slate-100 bg-white p-4">
             <div className="flex justify-between">
                <div className="h-10 w-10 rounded-xl bg-slate-100" />
                <div className="h-5 w-14 rounded-full bg-slate-100" />
             </div>
             <div className="h-4 w-28 rounded bg-slate-100" />
             <div className="h-8 w-20 rounded bg-slate-100" />
          </div>)
        ) : (
          stats.map((section, idx) => (
            <div key={section.title} className="premium-card group p-4 transition-all hover:border-blue-600/30 hover:shadow-xl hover:shadow-slate-200/40 relative overflow-hidden">
              <div className="mb-3 flex items-start justify-between relative z-10">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400 transition-all group-hover:bg-blue-600 group-hover:text-white shadow-sm">
                  <span className="material-symbols-outlined text-[20px]">{section.icon}</span>
                </div>
                <div className={`rounded-full px-2 py-0.5 text-[9px] font-black tracking-widest uppercase ${
                  section.trendUp ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-red-50 text-red-600 border border-red-100"
                }`}>
                  {section.trend}
                </div>
              </div>
              <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">{section.title}</p>
                <div className="mt-1.5 flex items-baseline gap-2">
                  <h3 className="text-3xl font-black tracking-tighter text-slate-900 tabular-nums">{section.value}</h3>
                </div>
                <p className="mt-1 text-[11px] font-medium text-slate-500">{section.detail}</p>
              </div>
              {/* Background accent */}
              <div className="absolute -right-2 -bottom-2 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                 <span className="material-symbols-outlined text-[80px] font-black">{section.icon}</span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column - Analytics */}
        <div className="space-y-6 lg:col-span-2">
          <div className="premium-card p-5">
            <div className="mb-6 flex items-center justify-between gap-3">
               <div>
                  <h3 className="text-lg font-black tracking-tight text-slate-900">Attendance Analytics</h3>
                  <p className="mt-1 text-xs font-medium text-slate-500">Global participation trends across all academic tiers</p>
               </div>
               <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100">
                  <button className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-blue-600 bg-white rounded-lg shadow-sm">7 Days</button>
                  <button className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600">30 Days</button>
               </div>
            </div>
            
            <div className="flex h-64 items-end justify-between gap-3 px-2 pt-8">
              {loading ? (
                Array(7).fill(0).map((_, i) => (
                  <div key={i} className="flex-1 animate-pulse rounded-t-xl bg-slate-50" style={{ height: `${20 + Math.random() * 60}%` }} />
                ))
              ) : (
                data?.trends.map((day, i) => (
                  <div key={day.date} className="group relative flex flex-1 flex-col items-center gap-3">
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap rounded-xl bg-slate-900 px-3 py-1.5 text-[10px] font-black text-white opacity-0 transition-all group-hover:opacity-100 group-hover:-top-12 shadow-xl">
                      {day.percentage}% Present
                      <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900" />
                    </div>
                    <div
                      className={`w-full rounded-t-xl transition-all duration-700 ease-out relative group-hover:brightness-110 ${
                        day.percentage > 90 ? "bg-gradient-to-t from-blue-700 to-blue-500 shadow-[0_10px_20px_rgba(37,99,235,0.15)]" : 
                        day.percentage > 75 ? "bg-gradient-to-t from-blue-500 to-blue-400 shadow-[0_10px_20px_rgba(59,130,246,0.15)]" : 
                        "bg-gradient-to-t from-red-500 to-rose-400 shadow-[0_10px_20px_rgba(244,63,94,0.15)]"
                      }`}
                      style={{ height: `${Math.max(day.percentage, 20)}%` }}
                    >
                      <div className="w-full h-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-t-xl" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">
                      {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="premium-card p-5">
                <h3 className="mb-4 text-sm font-black uppercase tracking-widest text-slate-400">Class Performance</h3>
                <div className="space-y-4">
                   {loading ? (
                     Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)
                   ) : data?.classAttendance && data.classAttendance.length > 0 ? (
                     data.classAttendance.slice(0, 4).map((cls) => (
                       <div key={cls.class_name} className="group">
                          <div className="flex items-center justify-between mb-2">
                             <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">{cls.class_name}</span>
                             <span className="text-[10px] font-black text-blue-600 tabular-nums">{cls.percentage}%</span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 border border-slate-50">
                             <div 
                               className={`h-full transition-all duration-1000 shadow-[0_0_8px_rgba(0,0,0,0.05)] ${cls.percentage > 90 ? 'bg-blue-600' : cls.percentage > 75 ? 'bg-blue-400' : 'bg-red-400'}`} 
                               style={{ width: `${cls.percentage}%` }} 
                             />
                          </div>
                       </div>
                     ))
                   ) : (
                     <div className="py-6 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                       No Daily Data
                     </div>
                   )}
                </div>
             </div>

             <div className="premium-card p-5 bg-gradient-to-br from-white to-slate-50/50">
                <div className="flex items-center justify-between mb-4">
                   <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Operational Log</h3>
                   <span className="material-symbols-outlined text-slate-300 text-lg">history</span>
                </div>
                <div className="space-y-3">
                   {[
                      { msg: "Attendance marked for Grade 10", time: "10m ago", icon: "how_to_reg" },
                      { msg: "New exam results published", time: "1h ago", icon: "leaderboard" },
                      { msg: "Academic Year 2026 initialized", time: "3h ago", icon: "calendar_today" }
                   ].map((log, i) => (
                      <div key={i} className="flex items-start gap-3 p-2 rounded-xl border border-transparent hover:border-slate-100 hover:bg-white transition-all">
                         <div className="h-7 w-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                            <span className="material-symbols-outlined text-[16px]">{log.icon}</span>
                         </div>
                         <div>
                            <p className="text-[11px] font-bold text-slate-700 leading-tight">{log.msg}</p>
                            <p className="text-[9px] font-medium text-slate-400 mt-0.5">{log.time}</p>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          </div>
        </div>

        {/* Right Column - Actions & Alerts */}
        <div className="space-y-6">
          <div className="premium-card p-5">
            <h3 className="mb-5 text-sm font-black uppercase tracking-widest text-slate-400">Control Center</h3>
            <div className="grid grid-cols-2 gap-3">
               {[
                 { label: "Add Student", icon: "person_add", color: "text-blue-600 bg-blue-50 border-blue-100", href: "/admin/students?action=new" },
                 { label: "Attendance", icon: "how_to_reg", color: "text-emerald-600 bg-emerald-50 border-emerald-100", href: "/admin/attendance" },
                 { label: "Schedule Exam", icon: "add_task", color: "text-amber-600 bg-amber-50 border-amber-100", href: "/admin/exams?action=new" },
                 { label: "Broadcast", icon: "campaign", color: "text-purple-600 bg-purple-50 border-purple-100", href: "/admin/announcements?action=new" },
                 { label: "Results", icon: "leaderboard", color: "text-cyan-600 bg-cyan-50 border-cyan-100", href: "/admin/results" },
                 { label: "Timetable", icon: "calendar_view_week", color: "text-indigo-600 bg-indigo-50 border-indigo-100", href: "/admin/timetable" }
               ].map((action) => (
                 <Link 
                    key={action.label} 
                    href={action.href}
                    className="group flex flex-col items-center gap-2 rounded-2xl border border-slate-50 bg-slate-50/50 p-3 text-center transition-all hover:border-blue-300 hover:bg-white hover:shadow-lg hover:shadow-slate-200/50"
                 >
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${action.color} transition-all group-hover:scale-110 shadow-sm shadow-transparent group-hover:shadow-current/10`}>
                      <span className="material-symbols-outlined text-[20px]">{action.icon}</span>
                    </div>
                    <span className="text-[10px] font-black uppercase leading-tight tracking-tight text-slate-700">{action.label}</span>
                 </Link>
               ))}
            </div>
            <Link href="/admin/settings" className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-[11px] font-black uppercase tracking-widest text-white transition-all hover:bg-slate-800 hover:scale-[1.02] active:scale-[0.98]">
               <span className="material-symbols-outlined text-sm">settings</span>
               Global Configuration
            </Link>
          </div>

          <div className={`premium-card p-5 border-red-100/50 transition-all ${data?.alerts && data.alerts.length > 0 ? 'bg-red-50/30' : 'bg-white'}`}>
            <div className="mb-5 flex items-center justify-between">
               <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-red-500 text-lg">error</span>
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Critical Alerts</h3>
               </div>
               {data?.alerts && data.alerts.length > 0 && (
                 <div className="h-5 px-1.5 flex items-center justify-center rounded-full bg-red-600 text-[9px] font-black text-white shadow-lg shadow-red-600/20">
                   {data.alerts.length}
                 </div>
               )}
            </div>
            
            <div className="space-y-3">
               {loading ? (
                 Array(2).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)
               ) : data?.alerts && data.alerts.length > 0 ? (
                 data.alerts.map((alert, i) => (
                   <div key={i} className="animate-in slide-in-from-right-4 duration-300 rounded-2xl border border-red-100 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-3">
                        <div className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full ${
                          alert.severity === 'error' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 
                          alert.severity === 'warning' ? 'bg-orange-500' : 'bg-blue-500'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="mb-1 text-[12px] font-black leading-tight text-slate-900 truncate">{alert.title}</p>
                          <p className="text-[11px] leading-relaxed font-medium text-slate-500 line-clamp-2">{alert.message}</p>
                          <Link href={alert.link} className="mt-3 inline-flex items-center gap-1 text-[11px] font-black text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-wider">
                            {alert.cta}
                            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                          </Link>
                        </div>
                      </div>
                   </div>
                 ))
               ) : (
                 <div className="py-6 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                    <span className="material-symbols-outlined text-slate-200 text-3xl mb-2">check_circle</span>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Status Nominal</p>
                 </div>
               )}
            </div>
          </div>
        </div>
      </div>
    </SchoolShell>
  );
}
