import { useEffect, useState } from "react";
import { SchoolShell } from "@/layouts/SchoolShell";
import { DataState, Skeleton } from "@/components/ui";
import { useSelectedChild } from "@/contexts/SelectedChildContext";
import { serviceRequest } from "@/services/service-client";

type AttendanceRecord = {
  date: string;
  status: "present" | "absent";
};

type AttendanceSummary = {
  student_id: string;
  student_name: string;
  class_name: string;
  total_present: number;
  total_absent: number;
  percentage: number;
  recent_records: AttendanceRecord[];
};

export function ParentAttendancePage() {
  const { selectedChild, loading: childLoading } = useSelectedChild();
  const [data, setData] = useState<AttendanceSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedChild) return;

    async function fetchData() {
      setLoading(true);
      try {
        if (!selectedChild) return;
        const res = await serviceRequest<any>(
          `/api/parent/student-attendance?student_id=${selectedChild.student_id}`
        );
        if (res.ok && res.data) {
          const summary = res.data.attendance_summary;
          setData({
            student_id: selectedChild.student_id,
            student_name: res.data.student,
            class_name: res.data.class,
            total_present: summary.present_days,
            total_absent: summary.absent_days,
            percentage: summary.attendance_percentage,
            recent_records: res.data.recent_records.map((r: any) => ({
                date: r.date,
                status: r.status
            }))
          });
        }
      } catch (error) {
        console.error("Failed to fetch attendance:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [selectedChild]);

  if (childLoading || (loading && !data)) {
    return (
      <SchoolShell eyebrow="Guardian Portal" title="Attendance Tracking">
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </SchoolShell>
    );
  }

  if (!selectedChild || !data) {
    return (
      <SchoolShell eyebrow="Guardian Portal" title="Attendance Tracking">
        <DataState
          variant="empty"
          title="No records found"
          message="We couldn't find any attendance logs for the selected student."
        />
      </SchoolShell>
    );
  }

  return (
    <SchoolShell eyebrow="Guardian Portal" title="Attendance Tracking">
      <div className="space-y-6">
        {/* Compact Summary Header */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Academic Pulse</p>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Attendance Overview</h2>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100">
               <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
               <span className="text-[11px] font-black text-blue-600">{data.percentage}% Net Participation</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "Days Present", value: data.total_present, icon: "check_circle", color: "text-blue-600", bg: "bg-blue-50" },
              { label: "Days Absent", value: data.total_absent, icon: "cancel", color: "text-rose-600", bg: "bg-rose-50" },
            ].map(m => (
              <div key={m.label} className="p-4 rounded-xl border border-slate-50 bg-slate-50/30">
                <div className="flex items-center gap-3">
                   <div className={`h-8 w-8 rounded-lg ${m.bg} ${m.color} flex items-center justify-center`}>
                      <span className="material-symbols-outlined text-[18px]">{m.icon}</span>
                   </div>
                   <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{m.label}</p>
                      <p className="text-lg font-black text-slate-900">{m.value}</p>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Logs */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
           <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
              <h3 className="text-[13px] font-black text-slate-900 tracking-tight">Recent Activity Log</h3>
              <span className="material-symbols-outlined text-slate-300">history</span>
           </div>
           <div className="divide-y divide-slate-50">
              {data.recent_records.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">No recent logs recorded.</div>
              ) : (
                data.recent_records.map((record) => (
                  <div key={record.date} className="px-6 py-3 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                     <div className="flex items-center gap-4">
                        <div className="h-8 w-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">
                           {new Date(record.date).getDate()}
                        </div>
                        <div>
                           <p className="text-[11px] font-bold text-slate-800">{new Date(record.date).toLocaleDateString("en-US", { month: 'long', year: 'numeric' })}</p>
                           <p className="text-[9px] font-medium text-slate-400 capitalize">{new Date(record.date).toLocaleDateString("en-US", { weekday: 'long' })}</p>
                        </div>
                     </div>
                     
                     <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                        record.status === 'present' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                        record.status === 'absent' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                        'bg-slate-50 text-slate-600 border border-slate-100'
                     }`}>
                        {record.status}
                     </span>
                  </div>
                ))
              )}
           </div>
        </div>
      </div>
    </SchoolShell>
  );
}
