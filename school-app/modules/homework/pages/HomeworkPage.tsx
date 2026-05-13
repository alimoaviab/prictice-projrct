"use client";

import React, { useEffect, useState, useMemo } from "react";
import { serviceRequest } from "../../../services/service-client";
import { useRouter } from "next/navigation";
import { Button, DataState, Skeleton, Badge } from "../../../components/ui";
import { showToast } from "../../../utils/toast";
import { useQueryParams } from "../../../hooks/useQueryParams";

interface HomeworkPageProps {
  role: "ADMIN" | "TEACHER" | "STUDENT" | "PARENT";
  studentId?: string;
}

export function HomeworkPage({ role, studentId }: HomeworkPageProps) {
  const router = useRouter();
  const { currentParams, updateQuery, withQuery } = useQueryParams();
  const [loading, setLoading] = useState(true);
  const [homeworks, setHomeworks] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState(currentParams.get("search") || "");

  const fetchHomeworks = async () => {
    setLoading(true);
    try {
      // Use parent-specific API if in parent role for better data isolation
      const url = role === "PARENT" && studentId 
        ? `/api/parent/child/homework?student_id=${studentId}` 
        : studentId ? `/api/homework?student_id=${studentId}` : "/api/homework";
      
      const res = await serviceRequest<any>(url);
      
      if (res.ok && res.data) {
        // Parent API might return a different structure (summary + list)
        const data = res.data.homework_list || res.data || [];
        setHomeworks(data);
      } else {
        showToast(res.message || "Failed to load homeworks", "error");
      }
    } catch (error) {
      console.error(error);
      showToast("Failed to load homeworks", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomeworks();
  }, [studentId]);

  const filteredHomeworks = useMemo(() => {
    return homeworks.filter((hw) => {
      const q = searchQuery.toLowerCase();
      return (
        hw.title?.toLowerCase().includes(q) || 
        hw.subject?.toLowerCase().includes(q) ||
        hw.subject_name?.toLowerCase().includes(q)
      );
    });
  }, [homeworks, searchQuery]);

  const formatDate = (value?: string) => {
    if (!value) return "No Date";
    try {
        return new Date(value).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          });
    } catch {
        return value;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Search & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">search</span>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search assignments..."
            className="h-9 w-full rounded-lg border border-slate-100 bg-white pl-10 pr-3 text-[11px] font-bold text-slate-700 outline-none transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-600/5 placeholder:text-slate-400"
          />
        </div>
        
        {role !== "STUDENT" && role !== "PARENT" && (
          <Button
            onClick={() => router.push(withQuery(role === "ADMIN" ? "/admin/homework/create" : "/teacher/homework/create"))}
            className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md shadow-blue-600/10 text-[10px] font-black uppercase tracking-wider transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[16px] mr-2">add</span>
            New Assignment
          </Button>
        )}
      </div>

      {/* Content Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredHomeworks.length === 0 ? (
        <DataState
          variant="empty"
          title={searchQuery ? "No matches found" : "No Homework Assigned"}
          message={searchQuery ? "Try refining your search terms." : "All caught up! No homework assigned at the moment."}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredHomeworks.map((hw) => (
            <div
              key={hw.id || hw._id}
              className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm hover:border-blue-200 transition-all group relative"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`h-1.5 w-1.5 rounded-full ${
                      hw.status === 'assigned' || hw.status === 'pending' ? 'bg-blue-600 animate-pulse' : 
                      hw.status === 'overdue' ? 'bg-rose-500' : 'bg-emerald-500'
                    }`} />
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight">
                      {hw.status?.toUpperCase() || 'ASSIGNED'}
                    </span>
                  </div>
                  <h3 className="text-[13px] font-black text-slate-900 truncate tracking-tight group-hover:text-blue-600 transition-colors">
                    {hw.title}
                  </h3>
                </div>
                
                <button
                  onClick={() => {
                      const baseUrl = 
                          role === "ADMIN" ? "/admin/homework" : 
                          role === "TEACHER" ? "/teacher/homework" : 
                          role === "PARENT" ? "/parent/homework" :
                          "/student/homework";
                      router.push(`${baseUrl}/${hw.id || hw._id}/review`);
                  }}
                  className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-300 hover:bg-blue-50 hover:text-blue-600 transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">visibility</span>
                </button>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">Subject</p>
                  <p className="text-[11px] font-bold text-blue-600 truncate bg-blue-50/50 px-2 py-0.5 rounded-md inline-block">
                    {hw.subject_name || hw.subject}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">Due Date</p>
                  <p className="text-[11px] font-bold text-slate-700">{formatDate(hw.due_date || hw.due_at)}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-md bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500">
                    {(hw.teacher_name || hw.posted_by || 'T').substring(0, 1).toUpperCase()}
                  </div>
                  <p className="text-[10px] font-bold text-slate-500 truncate max-w-[100px]">
                    {hw.teacher_name || hw.posted_by || 'Instructor'}
                  </p>
                </div>
                
                {hw.submission_status === 'submitted' && (
                   <span className="flex items-center gap-1 text-[9px] font-black text-emerald-600 uppercase tracking-tighter bg-emerald-50 px-2 py-0.5 rounded-full">
                     <span className="material-symbols-outlined text-[12px]">check_circle</span>
                     Submitted
                   </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
