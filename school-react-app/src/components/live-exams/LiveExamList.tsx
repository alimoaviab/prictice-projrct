import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

interface LiveExamListProps {
  role: "TEACHER" | "STUDENT" | "ADMIN";
}

export const LiveExamList: React.FC<LiveExamListProps> = ({ role }) => {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchExams = async () => {
    try {
      const res = await fetch("/api/live-exams");
      const json = await res.json();
      if (json.ok) {
        setExams(json.data);
      }
    } catch (error) {
      console.error("Failed to fetch live exams", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-emerald-100 text-emerald-700";
      case "scheduled": return "bg-blue-100 text-blue-700";
      case "completed": return "bg-slate-100 text-slate-700";
      case "cancelled": return "bg-red-100 text-red-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading exams...</div>;

  if (exams.length === 0) return (
    <div className="rounded-3xl border border-slate-200 p-8 text-center shadow-sm">
      <p className="font-semibold text-slate-900">No exams scheduled</p>
      <p className="text-sm text-slate-500 mt-1">Live exams will appear here once created.</p>
    </div>
  );

  return (
    <div className="grid gap-4 md:grid-cols-1">
      {exams.map((exam) => (
        <div key={exam._id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">{exam.title}</h3>
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold normal-case  ${getStatusColor(exam.status)}`}>
                  {exam.status}
                </span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[18px]">school</span>
                    {exam.class_id?.name || "All Classes"}
                </span>
                <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[18px]">book</span>
                    {exam.subject_id?.name || "Subject"}
                </span>
                <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[18px]">timer</span>
                    {exam.duration} mins
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                {role === "TEACHER" && (
                    <>
                        <Link
                            to={`/teacher/live-exam/${exam._id}/monitor`}
                            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                            Monitor
                        </Link>
                        <Link
                            to={`/teacher/live-exam/${exam._id}/questions`}
                            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
                            Questions
                        </Link>
                    </>
                )}
                {role === "STUDENT" && exam.status === "active" && (
                    <Link
                        to={`/student/live-exam/${exam._id}`}
                        className="rounded-xl bg-indigo-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
                    >
                        Join Exam
                    </Link>
                )}
                {role === "ADMIN" && (
                    <Link
                        to={`/admin/live-exam/${exam._id}`}
                        className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                        View Details
                    </Link>
                )}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-medium text-slate-400">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">calendar_today</span>
              Starts: {new Date(exam.start_time).toLocaleString()}
            </span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">history</span>
              Ends: {new Date(exam.end_time).toLocaleString()}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};
