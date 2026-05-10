"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge, Button, Card, DataState, PageHeader, Skeleton, TableSkeleton } from "../../../components/ui";
import { useAcademicYears } from "../hooks/useAcademicYears";
import { AcademicYearRow, AcademicYearUpdateInput } from "../types/academicYear.types";
import { showToast } from "../../../utils/toast";
import { AcademicYearEditSidebar } from "../components/AcademicYearEditSidebar";
import { AcademicYearTable } from "../components/AcademicYearTable";
import { ConfirmModal } from "../../../components/ui/ConfirmModal";

type ViewMode = "grid" | "list";

export function AcademicYearListPage() {
  const { state, page, setPage, updateAcademicYear, deleteAcademicYear } = useAcademicYears();
  const [editingYear, setEditingYear] = useState<AcademicYearRow | null>(null);
  const [deletingYear, setDeletingYear] = useState<AcademicYearRow | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "completed" | "cancelled">("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  
  const years = state.data?.data ?? [];
  const meta = state.data?.meta;
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

  const handleDelete = async () => {
    if (!deletingYear) return;
    setIsDeleting(true);
    try {
      const result = await deleteAcademicYear(deletingYear._id);
      if (result.ok) {
        showToast(`${deletingYear.year} deleted successfully`, "success");
        setDeletingYear(null);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSetCurrent = async (year: AcademicYearRow) => {
    try {
      const nextActiveState = !year.is_active;
      const result = await updateAcademicYear(year._id, { is_active: nextActiveState });
      if (result.ok) {
        showToast(
          nextActiveState ? `${year.year} set as active` : `${year.year} deactivated`, 
          "success"
        );
      }
    } catch (error: any) {
      showToast(error.message || "Failed to update academic year", "error");
    }
  };

  if (state.status === "loading" || state.status === "idle") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
        <TableSkeleton />
      </div>
    );
  }

  if (state.status === "error") {
    return <DataState variant="error" title="Failed to load academic years" message={state.error} />;
  }

  const isDrawerOpen = editingYear !== null;

  return (
    <>
      <div className="space-y-8 relative min-h-[87vh] pb-20">
        {/* Stats Section - Premium SaaS Style */}
        <div className={`grid gap-4 transition-all duration-500 ease-in-out ${isDrawerOpen ? "grid-cols-1 md:grid-cols-2" : "grid-cols-2 md:grid-cols-4"}`}>
          {[
            { label: "Total Sessions", value: years.length, icon: "calendar_today", color: "text-slate-500", bg: "bg-slate-500/5" },
            { label: "Active Year", value: activeYear?.year || "None", icon: "auto_awesome", color: "text-blue-600", bg: "bg-blue-600/5" },
            { label: "Completed", value: years.filter(y => y.status === "completed").length, icon: "verified", color: "text-emerald-600", bg: "bg-emerald-600/5" },
          ].map((stat) => (
            <div key={stat.label} className="group premium-card p-4 flex items-center justify-between bg-white border-slate-200/60 hover:border-blue-200 transition-all shadow-sm">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">{stat.label}</span>
                <span className={`text-xl font-bold tracking-tight block ${stat.color}`}>{stat.value}</span>
              </div>
              <div className={`h-10 w-10 rounded-xl ${stat.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <span className={`material-symbols-outlined text-xl ${stat.color}`}>{stat.icon}</span>
              </div>
            </div>
          ))}
          <Link 
            href="/admin/academic-years/create" 
            className={`premium-card p-4 flex items-center justify-between bg-white border-slate-200 group hover:bg-blue-600 hover:border-blue-600 transition-all shadow-sm ${isDrawerOpen ? "hidden md:flex" : ""}`}
          >
            <div>
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] block mb-1 group-hover:text-blue-100 transition-colors">Setup Control</span>
              <span className="text-sm font-black text-slate-900 block group-hover:text-white transition-colors tracking-tight">Add New Year</span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-white/20 group-hover:rotate-90 transition-all border border-slate-100 group-hover:border-transparent">
              <span className="material-symbols-outlined text-xl text-slate-400 group-hover:text-white">add</span>
            </div>
          </Link>
        </div>

        {/* Operational Toolbar */}
        <div className="premium-card p-2 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white/80 backdrop-blur-md sticky top-[72px] z-20 border-slate-200/60 shadow-sm rounded-xl">
          <div className="flex flex-1 items-center gap-2 max-w-2xl">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg text-slate-400">search</span>
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Filter by year or notes..."
                className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-xs font-medium text-slate-700 outline-none transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-600/5 placeholder:text-slate-400"
              />
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as any)}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 outline-none cursor-pointer transition-all hover:border-slate-300 focus:border-blue-400"
            >
              <option value="all">Status: All</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-lg bg-slate-100 p-1 shadow-inner">
              <button
                onClick={() => setViewMode("grid")}
                className={`flex h-7 items-center gap-2 rounded-md px-3 text-[11px] font-bold transition-all ${
                  viewMode === "grid" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <span className="material-symbols-outlined text-base">grid_view</span>
                Grid
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`flex h-7 items-center gap-2 rounded-md px-3 text-[11px] font-bold transition-all ${
                  viewMode === "list" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <span className="material-symbols-outlined text-base">view_list</span>
                List
              </button>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <Link
              href="/admin/academic-years/create"
              className="flex h-9 items-center gap-2 rounded-lg bg-blue-600 px-4 text-[11px] font-bold text-white shadow-lg shadow-blue-600/10 transition-all hover:bg-blue-700 active:scale-95"
            >
              <span className="material-symbols-outlined text-base">add</span>
              New Session
            </Link>
          </div>
        </div>

        <div className="flex">
          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
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
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                  {filteredYears.map((row) => {
                    const days = durationInDays(row.start_date, row.end_date);
                    const isActive = row.is_active;
                    const isEditing = editingYear?._id === row._id;
                    
                    const statusConfig = {
                      active: "text-emerald-600 bg-emerald-50 border-emerald-100",
                      completed: "text-blue-600 bg-blue-50 border-blue-100",
                      cancelled: "text-red-600 bg-red-50 border-red-100",
                      draft: "text-slate-500 bg-slate-50 border-slate-100",
                      all: ""
                    }[row.status] || "text-slate-500 bg-slate-50 border-slate-100";
                    
                    return (
                      <div
                        key={row._id}
                        className={`premium-card group relative flex flex-col p-6 transition-all duration-300 bg-white border-slate-200/60 hover:shadow-2xl hover:shadow-slate-200/40 hover:-translate-y-1.5 ${
                          isActive ? "ring-2 ring-blue-600/30" : ""
                        } ${isEditing ? "border-blue-400 bg-blue-50/5" : ""}`}
                      >
                        <div className="flex items-start justify-between gap-6 mb-6">
                          <div className="space-y-1.5">
                            <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none">{row.year}</h3>
                            <div className="flex items-center gap-2">
                               <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${statusConfig}`}>
                                 {row.status}
                               </span>
                               {isActive && (
                                 <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-100">
                                   <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
                                   Live Session
                                 </span>
                               )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={(e) => { e.preventDefault(); handleSetCurrent(row); }}
                              className={`h-9 px-4 flex items-center justify-center gap-2 rounded-xl transition-all border text-[10px] font-black uppercase tracking-widest ${
                                isActive 
                                ? "bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-600/20" 
                                : "bg-white text-slate-400 border-slate-200 hover:border-blue-400 hover:text-blue-600"
                              }`}
                              title={isActive ? "Current Active Year" : "Set as Current"}
                            >
                              <span className="material-symbols-outlined text-[18px]">{isActive ? "check_circle" : "radio_button_unchecked"}</span>
                              {isActive ? "Active" : "Inactive"}
                            </button>
                            <div className="w-px h-4 bg-slate-100 mx-1" />
                            <button 
                              onClick={(e) => { e.preventDefault(); setEditingYear(row); }}
                              className="h-9 w-9 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-50 hover:text-blue-600 transition-all border border-transparent hover:border-slate-100"
                              title="Edit"
                            >
                              <span className="material-symbols-outlined text-[20px]">edit</span>
                            </button>
                            <button 
                              onClick={(e) => { e.preventDefault(); setDeletingYear(row); }}
                              className="h-9 w-9 flex items-center justify-center rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all border border-transparent hover:border-slate-100"
                              title="Delete"
                            >
                              <span className="material-symbols-outlined text-[20px]">delete</span>
                            </button>
                          </div>
                        </div>

                        <div className="space-y-5 mb-6">
                          <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50/50 border border-slate-100/50">
                            <div className="flex-1">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Academic Timeline</p>
                              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                                <span className="bg-white px-2 py-1 rounded-md border border-slate-100">{formatDate(row.start_date)}</span>
                                <span className="text-slate-300 mx-1">→</span>
                                <span className="bg-white px-2 py-1 rounded-md border border-slate-100">{formatDate(row.end_date)}</span>
                              </div>
                            </div>
                            <div className="h-10 w-px bg-slate-200/50" />
                            <div className="text-right min-w-[50px]">
                               <p className="text-base font-black text-slate-900 leading-none">{days || 0}</p>
                               <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Total Days</p>
                            </div>
                          </div>

                          <div className="px-1">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Internal Notes</p>
                             <p className="text-xs font-medium text-slate-600 line-clamp-2 leading-relaxed">
                               {row.description || "Administrative session cycle for " + row.year}
                             </p>
                          </div>
                        </div>

                        <button 
                          onClick={() => setEditingYear(row)}
                          className="w-full h-10 flex items-center justify-center gap-2 rounded-xl bg-blue-600 text-[11px] font-black text-white uppercase tracking-[0.15em] hover:bg-blue-600 transition-all active:scale-[0.98] shadow-lg shadow-slate-900/10 hover:shadow-blue-600/20"
                        >
                          Manage Session
                          <span className="material-symbols-outlined text-[16px]">arrow_right_alt</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="premium-card overflow-hidden border-slate-200/60 shadow-sm bg-white rounded-2xl">
                  <AcademicYearTable 
                    years={filteredYears} 
                    onEdit={setEditingYear}
                    onDelete={setDeletingYear}
                    onSetActive={handleSetCurrent}
                  />
                </div>
              )
            )}

            {/* Pagination - Standard ERP Style */}
            <div className="mt-10 flex items-center justify-between border-t border-slate-100 pt-8">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500">
                  Showing <span className="font-bold text-slate-900">{years.length}</span> of <span className="font-bold text-slate-900">{meta?.total || years.length}</span> sessions
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-lg">chevron_left</span>
                  Previous
                </button>
                
                <div className="flex items-center gap-1.5 px-3">
                   <span className="text-xs font-bold text-slate-900">{page}</span>
                   <span className="text-xs font-medium text-slate-300">/</span>
                   <span className="text-xs font-medium text-slate-500">{meta?.pages || 1}</span>
                </div>

                <button
                  disabled={!meta || page === meta.pages}
                  onClick={() => setPage(page + 1)}
                  className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                  <span className="material-symbols-outlined text-lg">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AcademicYearEditSidebar
        academicYear={editingYear}
        isOpen={editingYear !== null}
        onClose={() => setEditingYear(null)}
        onSave={async (id, data) => {
          setIsSaving(true);
          try {
            await updateAcademicYear(id, data as AcademicYearUpdateInput);
            setEditingYear(null);
            showToast("Academic year updated successfully", "success");
          } finally {
            setIsSaving(false);
          }
        }}
        isSaving={isSaving}
      />

      <ConfirmModal
        isOpen={deletingYear !== null}
        title="Delete Academic Session"
        message={`Are you sure you want to permanently delete the "${deletingYear?.year}" session? This action will remove all associated data and cannot be undone.`}
        confirmLabel="Delete Permanently"
        confirmVariant="danger"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeletingYear(null)}
      />
    </>
  );
}
