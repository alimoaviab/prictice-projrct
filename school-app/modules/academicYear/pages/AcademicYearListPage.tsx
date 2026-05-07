"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge, Button, Card, DataState, PageHeader, Skeleton, TableSkeleton } from "../../../components/ui";
import { useAcademicYears } from "../hooks/useAcademicYears";
import { AcademicYearRow, AcademicYearUpdateInput } from "../types/academicYear.types";
import { showToast } from "../../../utils/toast";
import { AcademicYearEditSidebar } from "../components/AcademicYearEditSidebar";
import { AcademicYearTable } from "../components/AcademicYearTable";

type ViewMode = "grid" | "list";

export function AcademicYearListPage() {
  const { state, updateAcademicYear, deleteAcademicYear } = useAcademicYears();
  const [editingYear, setEditingYear] = useState<AcademicYearRow | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "completed" | "cancelled">("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const years = state.data ?? [];
  const activeYear = years.find((year) => year.is_active);

  const filteredYears = years.filter((row) => {
    const q = searchQuery.trim().toLowerCase();
    const queryMatch =
      q.length === 0 ||
      row.year.toLowerCase().includes(q) ||
      (row.description || "").toLowerCase().includes(q);
    const statusMatch = statusFilter === "all" ? true : row.status === statusFilter;
    return queryMatch && statusMatch;
  });

  const formatDate = (value?: string) => {
    if (!value) return "—";
    return new Date(value).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const durationInDays = (startDate?: string, endDate?: string) => {
    if (!startDate || !endDate) return null;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = Math.max(end.getTime() - start.getTime(), 0);
    return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)));
  };

  if (state.status === "loading" || state.status === "idle") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <TableSkeleton />
      </div>
    );
  }

  if (state.status === "error") {
    return <DataState variant="error" title="Failed to load academic years" message={state.error} />;
  }

  return (
    <div className="space-y-4">
      {/* Stats Section - High Density Enterprise Style */}
      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
        {[
          { label: "Total Sessions", value: years.length, icon: "calendar_month", color: "text-slate-500" },
          { label: "Active Year", value: activeYear?.year || "None", icon: "verified", color: "text-blue-600" },
          { label: "Completed", value: years.filter(y => y.status === "completed").length, icon: "check_circle", color: "text-emerald-600" },
        ].map((stat) => (
          <div key={stat.label} className="premium-card p-2.5 flex items-center justify-between bg-white/40 border-slate-200/50">
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">{stat.label}</span>
              <span className={`text-lg font-black tracking-tight mt-0.5 block ${stat.color}`}>{stat.value}</span>
            </div>
            <span className={`material-symbols-outlined text-lg opacity-20 ${stat.color}`}>{stat.icon}</span>
          </div>
        ))}
        <Link href="/admin/academic-years/create" className="premium-card p-2.5 flex items-center justify-between bg-blue-600 border-blue-700 group hover:bg-blue-700 transition-all shadow-sm">
          <div>
            <span className="text-[9px] font-black uppercase text-blue-100 tracking-widest block opacity-80">Quick Action</span>
            <span className="text-xs font-black text-white mt-0.5 block">Create Session</span>
          </div>
          <span className="material-symbols-outlined text-lg text-white group-hover:rotate-90 transition-transform">add</span>
        </Link>
      </div>

      {/* Operational Toolbar */}
      <div className="premium-card p-2 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white/50 backdrop-blur-sm sticky top-14 z-10 border-slate-200/60 shadow-sm">
        <div className="flex flex-1 items-center gap-2 max-w-md">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-base text-slate-400">search</span>
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search academic years..."
              className="h-8 w-full rounded-md border border-slate-200 bg-white pl-8 pr-2.5 text-xs text-slate-700 outline-none transition-all focus:border-blue-300 focus:ring-4 focus:ring-blue-600/5"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as any)}
            className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs font-bold text-slate-600 outline-none transition-all focus:border-blue-300"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-md border border-slate-200 bg-white p-0.5 shadow-sm">
            <button
              onClick={() => setViewMode("grid")}
              className={`flex h-7 items-center gap-1.5 rounded px-2.5 text-[11px] font-bold transition-all ${
                viewMode === "grid" ? "bg-blue-600 text-white shadow-sm shadow-blue-600/20" : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              <span className="material-symbols-outlined text-sm">grid_view</span>
              Grid
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex h-7 items-center gap-1.5 rounded px-2.5 text-[11px] font-bold transition-all ${
                viewMode === "list" ? "bg-blue-600 text-white shadow-sm shadow-blue-600/20" : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              <span className="material-symbols-outlined text-sm">view_list</span>
              List
            </button>
          </div>
          <div className="h-4 w-px bg-slate-200 mx-1" />
          <Link
            href="/admin/academic-years/create"
            className="md:hidden flex h-8 items-center gap-1.5 rounded-md bg-blue-600 px-3 text-[11px] font-bold text-white shadow-sm shadow-blue-600/20 transition-all hover:bg-blue-700"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            New
          </Link>
        </div>
      </div>

      {years.length === 0 ? (
        <DataState
          variant="empty"
          title="No academic years found"
          message="Get started by creating the first academic year for your school."
        />
      ) : filteredYears.length === 0 ? (
        <DataState
          variant="empty"
          title="No matching sessions"
          message="Try changing your search or status filter."
        />
      ) : (
        viewMode === "grid" ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filteredYears.map((row) => {
              const days = durationInDays(row.start_date, row.end_date);
              const isActive = row.is_active;
              const statusColor = row.status === "active" ? "text-emerald-600 bg-emerald-50 border-emerald-100/50" : row.status === "completed" ? "text-blue-600 bg-blue-50 border-blue-100/50" : "text-slate-500 bg-slate-50 border-slate-100/50";
              
              return (
                <div
                  key={row._id}
                  className={`premium-card group relative flex flex-col p-0 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-0.5 border-slate-200/60 bg-white ${isActive ? "ring-1 ring-blue-500/30 bg-blue-50/20" : ""}`}
                >
                  {/* Activity Indicator removed as per user request */}
                  
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                           <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${statusColor}`}>
                             {row.status}
                           </span>
                           {isActive && (
                             <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-blue-600">
                               <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
                               Active
                             </span>
                           )}
                        </div>
                        <h3 className="text-lg font-black text-slate-900 tracking-tight leading-tight">{row.year}</h3>
                      </div>
                      
                      <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg p-1 transition-all shadow-sm">
                        <button 
                          onClick={() => setEditingYear(row)}
                          className="h-6 w-6 flex items-center justify-center rounded text-slate-500 hover:bg-white hover:text-blue-600 transition-all hover:shadow-sm"
                        >
                          <span className="material-symbols-outlined text-base">edit</span>
                        </button>
                        <button 
                          onClick={async () => {
                            if (window.confirm(`Delete ${row.year}?`)) {
                              const result = await deleteAcademicYear(row._id);
                              if (result.ok) showToast(`${row.year} deleted`, "success");
                            }
                          }}
                          className="h-6 w-6 flex items-center justify-center rounded text-slate-500 hover:bg-white hover:text-red-500 transition-all hover:shadow-sm"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 space-y-4">
                       {/* Timeline Component - Increased Scale */}
                       <div className="relative py-2">
                          <div className="absolute left-0 right-0 h-[1px] bg-slate-100 top-1/2 -translate-y-1/2" />
                          <div className="flex items-center justify-between relative z-10">
                            <div className="bg-white group-hover:bg-slate-50/50 transition-colors pr-2 text-left">
                               <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter leading-none mb-1">Start</p>
                               <p className="text-[11px] font-bold text-slate-700 tracking-tight leading-none">{formatDate(row.start_date)}</p>
                            </div>
                            {days && (
                               <div className="bg-white group-hover:bg-slate-50/50 transition-colors px-2 py-0.5 rounded border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                                  <p className="text-[10px] font-black text-slate-900 leading-none">{days}d</p>
                               </div>
                            )}
                            <div className="bg-white group-hover:bg-slate-50/50 transition-colors pl-2 text-right">
                               <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter leading-none mb-1">End</p>
                               <p className="text-[11px] font-bold text-slate-700 tracking-tight leading-none">{formatDate(row.end_date)}</p>
                            </div>
                          </div>
                       </div>

                       <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50/50 border border-slate-100/50">
                          <span className="material-symbols-outlined text-slate-400 text-base">description</span>
                          <span className="text-[11px] font-bold text-slate-500 truncate">
                            {row.description || "No specific session notes"}
                          </span>
                       </div>
                    </div>
                  </div>

                  <div className="mt-auto px-4 py-3 bg-slate-50/30 border-t border-slate-100/60 flex items-center justify-between">
                     <div className="flex items-center gap-2 text-slate-400 group-hover:text-emerald-600 transition-colors">
                        <span className="material-symbols-outlined text-base font-black">sync</span>
                        <span className="text-[10px] font-black uppercase tracking-widest">Synchronized</span>
                     </div>
                     <button 
                        onClick={() => setEditingYear(row)}
                        className="h-7 px-3 rounded bg-white border border-slate-200 text-[10px] font-black text-slate-600 uppercase tracking-widest hover:border-blue-200 hover:text-blue-600 transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                     >
                        Configure
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                     </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="premium-card overflow-hidden">
            <AcademicYearTable years={filteredYears} />
          </div>
        )
      )}

      <AcademicYearEditSidebar
        academicYear={editingYear}
        isOpen={editingYear !== null}
        onClose={() => setEditingYear(null)}
        onSave={async (id, data) => {
          setIsSaving(true);
          try {
            await updateAcademicYear(id, data as AcademicYearUpdateInput);
            setEditingYear(null);
            showToast("Academic year updated", "success");
          } finally {
            setIsSaving(false);
          }
        }}
        isSaving={isSaving}
      />
    </div>
  );
}
