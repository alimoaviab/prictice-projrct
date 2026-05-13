"use client";

import { Card } from "../../../components/ui";
import { SchoolShell } from "../../../layouts/SchoolShell";
import { colors, spacing, typography } from "@edu/shared/design-system/tokens";
import { TimetablePreview } from "../../../modules/timetable/components/TimetablePreview";
import { useAuth } from "../../../hooks/useAuth";
import { useSelectedChild } from "../../../contexts/SelectedChildContext";

const summaries = [
  { title: "Daily Summary", detail: "4 classes, 1 homework due, attendance marked" },
  { title: "Academic Insights", detail: "Child's progress is steady in core subjects" },
  { title: "Upcoming Tasks", detail: "Science project and Mathematics test next week" }
];

export default function ParentDashboardPage() {
  const { user } = useAuth();
  const { selectedChild, loading } = useSelectedChild();
  
  if (loading) {
    return (
      <SchoolShell eyebrow="Guardian Portal" title="Academic Oversight">
        <div className="flex items-center justify-center h-64">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
        </div>
      </SchoolShell>
    );
  }

  if (!selectedChild) {
    return (
      <SchoolShell eyebrow="Guardian Portal" title="Academic Oversight">
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">family_restroom</span>
          <h3 className="text-lg font-bold text-slate-700 mb-2">No Students Linked</h3>
          <p className="text-sm text-slate-500">No students are linked to this parent account yet.</p>
        </div>
      </SchoolShell>
    );
  }
  
  return (
    <SchoolShell eyebrow="Guardian Portal" title="Academic Oversight">
      {/* Welcome Section */}
      <div className="mb-8 p-8 rounded-[2rem] bg-gradient-to-br from-indigo-900 to-slate-900 text-white shadow-2xl shadow-indigo-900/20 relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-[10px] font-bold normal-case tracking-[0.3em] text-indigo-300">Welcome, Guardian</p>
          <h2 className="text-3xl font-bold mt-2 tracking-tight">
            {selectedChild.student_name}'s Dashboard
          </h2>
          <p className="text-slate-300 mt-2 text-sm font-medium max-w-lg leading-relaxed">
            Real-time monitoring of your ward's academic journey, attendance metrics, and institutional broadcasts.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/20">
            <span className="material-symbols-outlined text-[18px]">school</span>
            <span className="text-sm font-bold">
              {selectedChild.class_name} {selectedChild.class_section && `- Section ${selectedChild.class_section}`}
            </span>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute right-[-20px] top-[-20px] h-40 w-40 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute right-10 bottom-[-30px] h-60 w-60 rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          { title: "Daily Pulse", detail: "Active participation in 4 classes today", icon: "bolt", color: "text-amber-600 bg-amber-50" },
          { title: "Performance", detail: "Consistent growth in core sciences", icon: "trending_up", color: "text-emerald-600 bg-emerald-50" },
          { title: "Next Milestones", detail: "Science Fair & Term Finals ahead", icon: "event", color: "text-blue-600 bg-blue-50" }
        ].map((summary) => (
          <div key={summary.title} className="premium-card p-5 group hover:border-blue-300 transition-all">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 shadow-sm ${summary.color}`}>
              <span className="material-symbols-outlined text-[20px]">{summary.icon}</span>
            </div>
            <h3 className="text-[11px] font-bold normal-case  text-slate-400 mb-1">{summary.title}</h3>
            <p className="text-[14px] font-bold text-slate-700 leading-tight">{summary.detail}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
           <div className="premium-card p-6">
              <div className="flex items-center justify-between mb-6">
                 <div>
                    <h3 className="text-lg font-bold tracking-tight text-slate-900">Current Schedule</h3>
                    <p className="text-xs font-medium text-slate-500 mt-1">Daily academic block distribution</p>
                 </div>
                 <span className="material-symbols-outlined text-slate-300">calendar_month</span>
              </div>
              <TimetablePreview classId={selectedChild.class_id} />
           </div>
        </div>

        <div className="space-y-6">
           <div className="premium-card p-6 bg-slate-900 text-white border-0 shadow-xl shadow-slate-900/20">
              <h3 className="text-sm font-bold normal-case tracking-[0.2em] text-indigo-400 mb-6">Quick Connectivity</h3>
              <div className="space-y-4">
                 {[
                    { label: "Request Leave", icon: "door_front" },
                    { label: "Fee Statement", icon: "receipt_long" },
                    { label: "Report Cards", icon: "grade" },
                    { label: "School Bus", icon: "directions_bus" }
                 ].map(action => (
                    <button key={action.label} className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-left">
                       <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-[18px] text-indigo-300">{action.icon}</span>
                          <span className="text-[12px] font-bold tracking-tight normal-case">{action.label}</span>
                       </div>
                       <span className="material-symbols-outlined text-sm text-white/30">chevron_right</span>
                    </button>
                 ))}
              </div>
           </div>
           
           <div className="premium-card p-5">
              <h3 className="text-[10px] font-bold normal-case  text-slate-400 mb-4">Upcoming Deadlines</h3>
              <div className="space-y-4">
                 <div className="flex items-start gap-3">
                    <div className="h-2 w-2 rounded-full bg-red-500 mt-1.5" />
                    <div>
                       <p className="text-[12px] font-bold text-slate-800">Physics Lab Submission</p>
                       <p className="text-[10px] font-bold text-slate-400 normal-case tracking-tighter">Due Tomorrow · 09:00 AM</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </SchoolShell>
  );
}
