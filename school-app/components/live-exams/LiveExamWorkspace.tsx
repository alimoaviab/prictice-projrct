"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

interface LiveExamWorkspaceProps {
  role: "TEACHER" | "STUDENT" | "ADMIN";
}

export const LiveExamWorkspace: React.FC<LiveExamWorkspaceProps> = ({
  role,
}) => {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

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

  // Filter exams based on search query and status filter
  const filteredExams = exams.filter((exam) => {
    const matchesSearch = exam.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || exam.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading)
    return (
      <div className="p-12 text-center text-sm font-semibold text-slate-500">
        Loading workspace...
      </div>
    );

  if (exams.length === 0)
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm mb-4">
          <span className="material-symbols-outlined text-3xl text-slate-400">
            event_busy
          </span>
        </div>
        <h3 className="text-lg font-bold text-slate-900">No exams scheduled</h3>
        <p className="mt-2 max-w-sm text-sm text-slate-500">
          Your examination workspace is currently empty. Get started by
          scheduling a new exam session.
        </p>
      </div>
    );

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "active":
        return {
          label: "Live Now",
          bg: "bg-emerald-50",
          border: "border-emerald-200",
          text: "text-emerald-700",
          badge: "bg-emerald-100 text-emerald-700",
          pulse: true,
        };
      case "scheduled":
        return {
          label: "Scheduled",
          bg: "bg-white",
          border: "border-slate-200",
          text: "text-slate-700",
          badge: "bg-indigo-50 text-indigo-700",
          pulse: false,
        };
      case "completed":
        return {
          label: "Completed",
          bg: "bg-slate-50",
          border: "border-slate-200",
          text: "text-slate-600",
          badge: "bg-slate-200 text-slate-700",
          pulse: false,
        };
      case "cancelled":
        return {
          label: "Cancelled",
          bg: "bg-red-50",
          border: "border-red-200",
          text: "text-red-700",
          badge: "bg-red-100 text-red-700",
          pulse: false,
        };
      default:
        return {
          label: status || "Unknown",
          bg: "bg-white",
          border: "border-slate-200",
          text: "text-slate-600",
          badge: "bg-slate-100 text-slate-600",
          pulse: false,
        };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <h2 className="text-lg font-bold text-slate-900">Exam Sessions</h2>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">
              search
            </span>
            <input
              type="text"
              placeholder="Search exams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-64 rounded-lg border border-slate-200 py-1.5 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-100 outline-none transition"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 py-1.5 pl-3 pr-8 text-sm font-medium text-slate-600 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100 transition appearance-none bg-white"
            style={{
              backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 0.5rem center",
              backgroundSize: "1em",
            }}
          >
            <option value="all">All Status</option>
            <option value="active">Live Now</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <button
            onClick={fetchExams}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 focus:ring-2 focus:ring-slate-200"
          >
            <span className="material-symbols-outlined text-[16px]">
              refresh
            </span>
            Refresh
          </button>
        </div>
      </div>

      {filteredExams.length === 0 ? (
        <div className="py-12 text-center text-sm font-medium text-slate-500 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
          No exams match your current filters.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredExams.map((exam) => {
            const statusConfig = getStatusConfig(exam.status);

            return (
              <div
                key={exam._id}
                className={`flex flex-col overflow-hidden rounded-2xl border ${statusConfig.bg} ${statusConfig.border} shadow-sm transition-all hover:shadow-md`}
              >
                <div className="p-5 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {statusConfig.pulse && (
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                          </span>
                        )}
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusConfig.badge}`}
                        >
                          {statusConfig.label}
                        </span>
                      </div>
                      <h3
                        className="text-base font-bold text-slate-900 line-clamp-2"
                        title={exam.title}
                      >
                        {exam.title}
                      </h3>
                    </div>

                    <div className="flex flex-col items-end shrink-0">
                      <p className="text-lg font-black text-slate-700">
                        {exam.duration}
                        <span className="text-xs font-semibold text-slate-400 ml-1">
                          min
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-xs font-medium text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-slate-400">
                        school
                      </span>
                      <span className="truncate">
                        {exam.class_id?.name || "All Classes"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-slate-400">
                        book
                      </span>
                      <span className="truncate">
                        {exam.subject_id?.name || "Subject"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-slate-400">
                        calendar_today
                      </span>
                      <span className="truncate">
                        {new Date(exam.start_time).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-slate-400">
                        schedule
                      </span>
                      <span className="truncate">
                        {new Date(exam.start_time).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50/50 p-4 border-t border-slate-200/60 mt-auto flex flex-wrap items-center gap-2 justify-end">
                  {role === "TEACHER" && (
                    <>
                      <Link
                        href={`/teacher/live-exam/${exam._id}/questions`}
                        className="flex-1 text-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Questions
                      </Link>
                      <Link
                        href={`/teacher/live-exam/${exam._id}/monitor`}
                        className="flex-1 flex justify-center items-center gap-1 text-center rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white transition hover:bg-slate-800 shadow-sm"
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          monitoring
                        </span>
                        Monitor
                      </Link>
                    </>
                  )}
                  {role === "STUDENT" && exam.status === "active" && (
                    <Link
                      href={`/student/live-exam/${exam._id}`}
                      className="w-full text-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700 shadow-sm"
                    >
                      Join Exam Now
                    </Link>
                  )}
                  {role === "ADMIN" && (
                    <Link
                      href={`/admin/live-exam/${exam._id}`}
                      className="w-full text-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      View Details
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
