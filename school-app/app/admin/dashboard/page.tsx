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
        <div className="p-8 text-center bg-red-50 border border-red-100 rounded-2xl">
          <span className="material-symbols-outlined text-red-500 text-4xl mb-4">error</span>
          <h2 className="text-lg font-bold text-red-900">Failed to load dashboard</h2>
          <p className="text-red-600 mt-2">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </SchoolShell>
    );
  }

  return (
    <SchoolShell eyebrow="Overview" title="Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {loading ? (
          Array(5).fill(0).map((_, i) => <div key={i} className="h-32 bg-white rounded-xl border border-gray-100 animate-pulse p-4 space-y-3">
             <div className="flex justify-between">
                <div className="w-10 h-10 bg-gray-100 rounded-lg" />
                <div className="w-12 h-5 bg-gray-100 rounded-full" />
             </div>
             <div className="w-24 h-4 bg-gray-100 rounded" />
             <div className="w-16 h-8 bg-gray-100 rounded" />
          </div>)
        ) : (
          stats.map((section) => (
            <Card key={section.title} className="group hover:border-blue-600/30 transition-all p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <span className="material-symbols-outlined text-xl">{section.icon}</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  section.trendUp ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                }`}>
                  {section.trend}
                </span>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{section.title}</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <h3 className="text-2xl font-bold text-gray-900 tracking-tight">{section.value}</h3>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">{section.detail}</p>
              </div>
            </Card>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-8">
               <div>
                  <h3 className="text-lg font-bold text-gray-900">Attendance Analytics</h3>
                  <p className="text-xs text-gray-500 mt-1">Class participation trends for the last 7 days</p>
               </div>
               <select className="text-xs font-bold border border-gray-200 bg-gray-50 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-600/10">
                  <option>Last 7 days</option>
                  <option>Last 30 days</option>
               </select>
            </div>
            
            <div className="h-72 flex items-end justify-between gap-3 px-2">
              {loading ? (
                Array(7).fill(0).map((_, i) => (
                  <div key={i} className="flex-1 bg-gray-50 rounded-t-lg animate-pulse" style={{ height: `${20 + Math.random() * 60}%` }} />
                ))
              ) : (
                data?.trends.map((day, i) => (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-3 group relative">
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      {day.percentage}% Present
                    </div>
                    <div
                      className={`w-full rounded-t-lg transition-all duration-700 ease-out ${
                        day.percentage > 90 ? "bg-blue-600" : day.percentage > 75 ? "bg-blue-400" : "bg-red-400"
                      }`}
                      style={{ height: `${day.percentage}%` }}
                    >
                      <div className="w-full h-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">
                      {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                  </div>
                ))
              )}
              {!loading && (!data?.trends || data.trends.length === 0) && (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                  <span className="material-symbols-outlined text-4xl mb-2">bar_chart</span>
                  <p className="text-sm">No attendance data for this period</p>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Class-wise Performance</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {loading ? (
                 Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
               ) : data?.classAttendance && data.classAttendance.length > 0 ? (
                 data.classAttendance.map((cls) => (
                   <div key={cls.class_name} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-gray-700">{cls.class_name}</span>
                          <span className="text-[10px] font-bold text-blue-600">{cls.percentage}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-1000 ${cls.percentage > 90 ? 'bg-blue-600' : cls.percentage > 75 ? 'bg-blue-400' : 'bg-red-400'}`} 
                            style={{ width: `${cls.percentage}%` }} 
                          />
                        </div>
                      </div>
                   </div>
                 ))
               ) : (
                 <div className="col-span-2 text-center py-8 text-gray-400 italic text-xs">
                   No class-wise data available for today.
                 </div>
               )}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
               {[
                 { label: "Add Student", icon: "person_add", color: "text-blue-600 bg-blue-50", href: "/admin/students?action=new" },
                 { label: "Attendance", icon: "how_to_reg", color: "text-green-600 bg-green-50", href: "/admin/attendance" },
                 { label: "Schedule Exam", icon: "add_task", color: "text-orange-600 bg-orange-50", href: "/admin/exams?action=new" },
                 { label: "Announce", icon: "campaign", color: "text-purple-600 bg-purple-50", href: "/admin/announcements?action=new" },
                 { label: "Publish Results", icon: "leaderboard", color: "text-cyan-600 bg-cyan-50", href: "/admin/results" },
                 { label: "Reports", icon: "summarize", color: "text-rose-600 bg-rose-50", href: "/admin/reports" },
                 { label: "Timetable", icon: "calendar_view_week", color: "text-indigo-600 bg-indigo-50", href: "/admin/timetable" },
                 { label: "Settings", icon: "settings", color: "text-gray-600 bg-gray-50", href: "/admin/settings" }
               ].map((action) => (
                 <Link 
                    key={action.label} 
                    href={action.href}
                    className="flex flex-col items-center gap-2 p-3 rounded-2xl border border-gray-100 hover:border-blue-600/20 hover:bg-blue-50/30 transition-all group text-center"
                 >
                    <div className={`w-10 h-10 rounded-xl ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <span className="material-symbols-outlined text-xl">{action.icon}</span>
                    </div>
                    <span className="text-[10px] font-bold text-gray-700 uppercase tracking-tight leading-tight">{action.label}</span>
                 </Link>
               ))}
            </div>
          </Card>

          <Card className={`p-6 border-red-100 ${data?.alerts && data.alerts.length > 0 ? 'bg-red-50/30' : 'bg-white'}`}>
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-5">
              <span className="material-symbols-outlined text-red-500 text-lg">notifications_active</span>
              Critical Alerts
              {data?.alerts && data.alerts.length > 0 && (
                <span className="ml-auto w-5 h-5 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full">
                  {data.alerts.length}
                </span>
              )}
            </h3>
            
            <div className="space-y-3">
               {loading ? (
                 Array(2).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)
               ) : data?.alerts && data.alerts.length > 0 ? (
                 data.alerts.map((alert, i) => (
                   <div key={i} className="p-3 bg-white rounded-xl border border-red-100 shadow-sm animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
                      <div className="flex items-start gap-3">
                        <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                          alert.severity === 'error' ? 'bg-red-500' : alert.severity === 'warning' ? 'bg-orange-500' : 'bg-blue-500'
                        }`} />
                        <div className="flex-1">
                          <p className="text-[11px] font-bold text-gray-900 leading-none mb-1">{alert.title}</p>
                          <p className="text-[10px] text-gray-500 leading-tight">{alert.message}</p>
                          <Link href={alert.link} className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 mt-2 hover:underline">
                            {alert.cta}
                            <span className="material-symbols-outlined text-[10px]">arrow_forward</span>
                          </Link>
                        </div>
                      </div>
                   </div>
                 ))
               ) : (
                 <div className="text-center py-4">
                   <p className="text-[10px] text-gray-400 font-medium italic">No system alerts at this time.</p>
                 </div>
               )}
            </div>
          </Card>
        </div>
      </div>
    </SchoolShell>
  );
}
