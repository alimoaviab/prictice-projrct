"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { SchoolShell } from "../../../../../layouts/SchoolShell";

export default function LiveExamMonitorPage() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/live-exams/${id}/monitor`);
      const json = await res.json();
      if (json.ok) {
        setData(json.data);
      }
    } catch (error) {
      console.error("Failed to fetch monitor data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, [id]);

  if (loading) return <SchoolShell title="Exam Monitor" eyebrow="Teacher">Loading...</SchoolShell>;
  if (!data) return <SchoolShell title="Exam Monitor" eyebrow="Teacher">Exam not found</SchoolShell>;

  const { exam, submissions } = data;

  return (
    <SchoolShell title={exam.title} eyebrow="Live Monitoring">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
            <button 
                onClick={() => router.back()}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors"
            >
                <span className="material-symbols-outlined">arrow_back</span>
                Back to List
            </button>
            <div className="flex items-center gap-4">
                <span className="flex items-center gap-1 text-sm font-medium text-slate-500">
                    <span className="material-symbols-outlined text-[18px]">groups</span>
                    {submissions.length} Students Active
                </span>
                <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${exam.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                    {exam.status}
                </span>
            </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.5fr_0.5fr]">
            <div className="rounded-[2rem] border border-slate-200/70 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900 mb-6">Active Participants</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-400">
                                <th className="pb-4 px-2">Student</th>
                                <th className="pb-4">Status</th>
                                <th className="pb-4">Progress</th>
                                <th className="pb-4">Violations</th>
                                <th className="pb-4">Time Left</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {submissions.map((sub: any) => (
                                <tr key={sub._id} className="text-sm">
                                    <td className="py-4 px-2">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                                                {sub.student_id?.user_id?.profile?.first_name?.[0] || "S"}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-900">
                                                    {sub.student_id?.user_id?.profile?.first_name} {sub.student_id?.user_id?.profile?.last_name}
                                                </p>
                                                <p className="text-[10px] text-slate-400 uppercase tracking-tight">ID: {sub.student_id?.student_id || "N/A"}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4">
                                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${sub.status === 'submitted' ? 'bg-slate-100 text-slate-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                            {sub.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="py-4">
                                        <div className="w-24 bg-slate-100 rounded-full h-1.5">
                                            <div 
                                                className="bg-indigo-600 h-1.5 rounded-full" 
                                                style={{ width: `${(sub.answers?.length / (exam.questions?.length || 1)) * 100}%` }}
                                            />
                                        </div>
                                        <p className="text-[10px] text-slate-400 mt-1">{sub.answers?.length || 0} / {exam.questions?.length || 0} Ans</p>
                                    </td>
                                    <td className="py-4 text-center">
                                        <span className={`font-bold ${sub.suspicious_activities > 0 ? 'text-red-500' : 'text-slate-300'}`}>
                                            {sub.suspicious_activities}
                                        </span>
                                    </td>
                                    <td className="py-4 font-mono text-xs text-slate-500">
                                        {Math.floor((sub.remaining_time || 0) / 60)}m {Math.floor((sub.remaining_time || 0) % 60)}s
                                    </td>
                                </tr>
                            ))}
                            {submissions.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-slate-400">
                                        No students have started the exam yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="space-y-6">
                <div className="rounded-[2rem] border border-slate-200/70 bg-white p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Exam Info</h3>
                    <div className="space-y-3">
                        <div>
                            <p className="text-[10px] font-bold uppercase text-slate-400">Total Marks</p>
                            <p className="text-lg font-bold text-slate-700">{exam.total_marks}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase text-slate-400">Duration</p>
                            <p className="text-lg font-bold text-slate-700">{exam.duration} Minutes</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase text-slate-400">Subject</p>
                            <p className="text-sm font-semibold text-slate-700">{exam.subject_id?.name || "Subject"}</p>
                        </div>
                    </div>
                </div>

                <div className="rounded-[2rem] border border-slate-200/70 bg-red-50 p-6 shadow-sm">
                    <div className="flex items-center gap-2 text-red-700 mb-3">
                        <span className="material-symbols-outlined text-[20px]">warning</span>
                        <h3 className="font-bold">Security Alerts</h3>
                    </div>
                    <p className="text-xs text-red-900/70 mb-4">
                        Violations occur when students switch tabs or try to use shortcuts.
                    </p>
                    {submissions.filter((s: any) => s.suspicious_activities > 0).length > 0 ? (
                         <div className="space-y-2">
                            {submissions.filter((s: any) => s.suspicious_activities > 0).map((s: any) => (
                                <div key={s._id} className="text-[11px] bg-white/50 p-2 rounded-lg border border-red-100">
                                    <span className="font-bold">{s.student_id?.user_id?.profile?.first_name}</span>: {s.suspicious_activities} violations
                                </div>
                            ))}
                         </div>
                    ) : (
                        <p className="text-xs italic text-slate-400 text-center py-4">No security alerts yet.</p>
                    )}
                </div>
            </div>
        </div>
      </div>
    </SchoolShell>
  );
}
