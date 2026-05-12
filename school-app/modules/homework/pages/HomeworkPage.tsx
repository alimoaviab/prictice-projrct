"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, DataState, Skeleton, Badge } from "../../../components/ui";
import { showToast } from "../../../utils/toast";
import { useQueryParams } from "../../../hooks/useQueryParams";

interface HomeworkPageProps {
  role: "ADMIN" | "TEACHER";
}

export function HomeworkPage({ role }: HomeworkPageProps) {
  const router = useRouter();
  const { currentParams, updateQuery, withQuery } = useQueryParams();
  const [loading, setLoading] = useState(true);
  const [homeworks, setHomeworks] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState(currentParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState<"all" | "assigned" | "draft" | "closed">((currentParams.get("status") as any) || "all");

  useEffect(() => {
    setSearchQuery(currentParams.get("search") || "");
    setStatusFilter((currentParams.get("status") as any) || "all");
  }, [currentParams.toString()]);

  const fetchHomeworks = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/homework");
      const result = await res.json();
      if (res.ok && result.success) {
        setHomeworks(result.data || []);
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
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this homework?")) return;
    try {
      const res = await fetch(`/api/homework/${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Homework deleted successfully", "success");
        fetchHomeworks();
      }
    } catch (error) {
      console.error(error);
      showToast("Failed to delete homework", "error");
    }
  };

  const filteredHomeworks = useMemo(() => {
    return homeworks.filter((hw) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        hw.title?.toLowerCase().includes(q) || 
        hw.class_name?.toLowerCase().includes(q) || 
        hw.subject_name?.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || hw.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [homeworks, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    return [
      { label: "Total Assignments", value: homeworks.length, icon: "assignment", color: "text-slate-500", bg: "bg-slate-500/5" },
      { label: "Active/Assigned", value: homeworks.filter(h => h.status === 'assigned').length, icon: "play_circle", color: "text-blue-600", bg: "bg-blue-600/5" },
      { label: "Drafts", value: homeworks.filter(h => h.status === 'draft').length, icon: "edit_document", color: "text-amber-600", bg: "bg-amber-600/5" },
      { label: "Closed", value: homeworks.filter(h => h.status === 'closed').length, icon: "check_circle", color: "text-emerald-600", bg: "bg-emerald-600/5" },
    ];
  }, [homeworks]);

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
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 normal-case tracking-tight">Homework Management</h1>
          <p className="text-slate-500 font-medium mt-1">Assign and manage educational content for your classes.</p>
        </div>
        <Button
          onClick={() => router.push(withQuery(role === "ADMIN" ? "/admin/homework/create" : "/teacher/homework/create"))}
          className="h-10 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-600/10 text-[10px] font-bold normal-case transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-lg mr-2">add</span>
          New Homework
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="premium-card p-4 flex items-center justify-between bg-white border-slate-200/60 shadow-sm">
            <div>
              <span className="text-[10px] font-bold normal-case text-slate-400 block mb-0.5">{stat.label}</span>
              <span className={`text-xl font-bold tracking-tight block ${stat.color}`}>{stat.value}</span>
            </div>
            <div className={`h-10 w-10 rounded-xl ${stat.bg} flex items-center justify-center border border-current/5`}>
              <span className={`material-symbols-outlined text-[20px] ${stat.color}`}>{stat.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Search & Filter Toolbar */}
      <div className="premium-card p-2 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white border-slate-200/60 shadow-sm rounded-xl">
        <div className="flex flex-1 items-center gap-2 max-w-2xl">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg text-slate-400">search</span>
            <input
              value={searchQuery}
              onChange={(e) => {
                const value = e.target.value;
                setSearchQuery(value);
                updateQuery({ search: value });
              }}
              placeholder="Search by title, class or subject..."
              className="h-10 w-full rounded-lg border border-slate-100 bg-slate-50/50 pl-10 pr-3 text-xs font-medium text-slate-700 outline-none transition-all focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-600/5 placeholder:text-slate-400"
            />
          </div>
          <div className="h-6 w-px bg-slate-100" />
          <select
            value={statusFilter}
            onChange={(e) => {
              const value = e.target.value as any;
              setStatusFilter(value);
              updateQuery({ status: value });
            }}
            className="h-10 rounded-lg border border-slate-100 bg-slate-50/50 px-3 text-xs font-bold text-slate-600 outline-none cursor-pointer transition-all hover:border-slate-200 focus:bg-white focus:border-indigo-400"
          >
            <option value="all">All Status</option>
            <option value="assigned">Assigned</option>
            <option value="draft">Draft</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Content Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="h-64 w-full rounded-3xl" />
          ))}
        </div>
      ) : filteredHomeworks.length === 0 ? (
        <DataState
          variant="empty"
          title={searchQuery ? "No matches found" : "No Homework Assigned"}
          message={searchQuery ? "Try refining your search terms or filters." : "You haven't assigned any homework yet. Start by clicking 'New Homework'."}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
          {filteredHomeworks.map((hw) => (
            <div
              key={hw._id}
              className="premium-card group relative flex flex-col p-5 transition-all duration-300 bg-white border-slate-200/60 hover:shadow-2xl hover:shadow-indigo-200/20 hover:-translate-y-1"
            >
              {/* Status Badge & Actions */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className={`h-1.5 w-1.5 rounded-full ${
                            hw.status === 'assigned' ? 'bg-blue-500 animate-pulse' : 
                            hw.status === 'draft' ? 'bg-amber-500' : 'bg-slate-400'
                        }`} />
                        <span className="text-[10px] font-bold text-slate-400 normal-case ">{hw.status?.toUpperCase() || 'ASSIGNED'}</span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 tracking-tight leading-tight group-hover:text-indigo-600 transition-colors line-clamp-1">
                        {hw.title}
                    </h3>
                </div>
                
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => router.push(role === "ADMIN" ? `/admin/homework/${hw._id}/review` : `/teacher/homework/${hw._id}/review`)}
                    className="h-8 w-8 flex items-center justify-center rounded-xl text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-all"
                    title="Review Submissions"
                  >
                    <span className="material-symbols-outlined text-lg">grading</span>
                  </button>
                  <button
                    onClick={() => router.push(role === "ADMIN" ? `/admin/homework/edit/${hw._id}` : `/teacher/homework/edit/${hw._id}`)}
                    className="h-8 w-8 flex items-center justify-center rounded-xl text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                    title="Edit Homework"
                  >
                    <span className="material-symbols-outlined text-lg">edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(hw._id)}
                    className="h-8 w-8 flex items-center justify-center rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all"
                    title="Delete Homework"
                  >
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                </div>
              </div>

              {/* Context Info */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-100 flex flex-col gap-1">
                      <span className="text-[8px] font-bold text-slate-400 normal-case ">Class Section</span>
                      <span className="text-[11px] font-bold text-indigo-600 line-clamp-1">{hw.class_name}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-100 flex flex-col gap-1">
                      <span className="text-[8px] font-bold text-slate-400 normal-case ">Subject</span>
                      <span className="text-[11px] font-bold text-slate-700 line-clamp-1">{hw.subject_name}</span>
                  </div>
              </div>

              {/* Instructions Preview */}
              <div className="mb-5">
                  <p className="text-[11px] font-medium text-slate-500 line-clamp-2 leading-relaxed">
                      {hw.instructions || "No detailed instructions provided for this assignment."}
                  </p>
              </div>

              {/* Footer Row */}
              <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white text-[10px] font-bold shadow-lg shadow-indigo-200">
                    {hw.teacher_name?.substring(0, 2).toUpperCase() || 'T'}
                  </div>
                  <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-slate-400 normal-case  leading-none mb-0.5">Assigned By</span>
                      <span className="text-[10px] font-bold text-slate-700 normal-case  leading-none">{hw.teacher_name || 'Teacher'}</span>
                  </div>
                </div>
                <div className="text-right">
                    <span className="text-[8px] font-bold text-slate-400 normal-case  block mb-0.5">Due Date</span>
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{formatDate(hw.due_at)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
