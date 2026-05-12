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
import { setSelectedAcademicYearId } from "../../../services/academic-year-context";

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
        if (nextActiveState) {
            setSelectedAcademicYearId(year._id);
            window.location.reload();
        }
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
      <div className="space-y-6 relative pb-6">
        {/* Stats Section - Compact ERP Style */}
        <div className={`grid gap-3 transition-all duration-500 ease-in-out ${isDrawerOpen ? "grid-cols-1 md:grid-cols-2" : "grid-cols-2 md:grid-cols-4"}`}>
          {[
            { label: "Total Sessions", value: years.length, icon: "calendar_today", color: "text-slate-500", bg: "bg-slate-500/5" },
            { label: "Active Year", value: activeYear?.year || "None", icon: "auto_awesome", color: "text-blue-600", bg: "bg-blue-600/5" },
            { label: "Completed", value: years.filter(y => y.status === "completed").length, icon: "verified", color: "text-emerald-600", bg: "bg-emerald-600/5" },
          ].map((stat) => (
            <div key={stat.label} className="group premium-card p-3 flex items-center justify-between bg-white border-slate-200/60 hover:border-blue-200 transition-all shadow-sm">
              <div>
                <span className="text-[9px] font-bold normal-case  text-slate-400 block mb-0.5">{stat.label}</span>
                <span className={`text-lg font-bold tracking-tight block ${stat.color}`}>{stat.value}</span>
              </div>
              <div className={`h-8 w-8 rounded-lg ${stat.bg} flex items-center justify-center group-hover:scale-105 transition-transform border border-current/5`}>
                <span className={`material-symbols-outlined text-[18px] ${stat.color}`}>{stat.icon}</span>
              </div>
            </div>
          ))}
          <Link 
            href="/admin/academic-years/create" 
            className={`premium-card p-3 flex items-center justify-between bg-white border-slate-200 group hover:bg-blue-600 hover:border-blue-600 transition-all shadow-sm ${isDrawerOpen ? "hidden md:flex" : ""}`}
          >
            <div>
              <span className="text-[8px] font-bold normal-case text-slate-400 tracking-[0.2em] block mb-0.5 group-hover:text-blue-100 transition-colors">Setup Control</span>
              <span className="text-[13px] font-bold text-slate-900 block group-hover:text-white transition-colors tracking-tight">Add New Year</span>
            </div>
            <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-white/10 group-hover:rotate-90 transition-all border border-slate-100 group-hover:border-transparent">
              <span className="material-symbols-outlined text-[18px] text-slate-400 group-hover:text-white">add</span>
            </div>
          </Link>
        </div>

        {/* Operational Toolbar */}
        <div className="premium-card p-2 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white/80 backdrop-blur-md border-slate-200/60 shadow-sm rounded-xl">
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
                      
                      return (
                        <div
                          key={row._id}
                          className={`premium-card group relative flex flex-col p-4 transition-all duration-300 bg-white border-slate-200/60 hover:shadow-xl hover:shadow-slate-200/30 hover:-translate-y-0.5 ${
                            isActive ? "ring-2 ring-blue-600/20 border-blue-600/40" : ""
                          } ${isEditing ? "border-blue-400 bg-blue-50/5" : ""}`}
                        >
                          {/* Top Row: Name & Actions */}
                          <div className="flex items-start justify-between gap-4 mb-3.5">
                            <div className="space-y-0.5 flex-1 min-w-0">
                              <h3 className="text-base font-bold text-slate-900 tracking-tight leading-none truncate">{row.year}</h3>
                              <p className="text-[9px] font-bold text-slate-400 normal-case  mt-1">Academic Session</p>
                            </div>
                            
                            <div className="flex items-center gap-0.5">
                              <Link 
                                href={`/admin/academic-years/${row._id}/edit`}
                                className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all"
                                title="Edit Session"
                              >
                                <span className="material-symbols-outlined text-[18px]">edit_note</span>
                              </Link>
                              <button 
                                onClick={(e) => { e.preventDefault(); setDeletingYear(row); }}
                                className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all"
                                title="Delete"
                              >
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                              </button>
                            </div>
                          </div>

                          {/* Middle Row: Timeline */}
                          <div className="mb-3.5 p-3 rounded-xl bg-slate-50/50 border border-slate-100/50 flex items-center justify-between">
                            <div className="flex-1">
                              <p className="text-[8px] font-bold text-slate-400 normal-case  mb-1.5">Session Dates</p>
                              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-700">
                                <span className="bg-white px-1.5 py-0.5 rounded-md border border-slate-100">{formatDate(row.start_date)}</span>
                                <span className="text-slate-300">→</span>
                                <span className="bg-white px-1.5 py-0.5 rounded-md border border-slate-100">{formatDate(row.end_date)}</span>
                              </div>
                            </div>
                            <div className="text-right pl-3 border-l border-slate-200/50 ml-3">
                               <p className="text-xs font-bold text-slate-900 leading-none">{days || 0}</p>
                               <p className="text-[7px] font-bold text-slate-400 normal-case  mt-0.5">Days</p>
                            </div>
                          </div>

                          {/* Bottom Row: Notes & Status Toggle */}
                          <div className="mt-auto pt-2 flex flex-col gap-3">
                            <div className="px-0.5">
                               <p className="text-[8px] font-bold text-slate-400 normal-case  mb-1">Notes</p>
                               <p className="text-[10px] font-medium text-slate-500 line-clamp-1 leading-relaxed">
                                 {row.description || "No additional notes provided."}
                               </p>
                            </div>

                            <div className="flex items-center justify-between bg-slate-50/30 rounded-lg p-1.5 border border-slate-100/30">
                              <div className="flex items-center gap-1.5">
                                {isActive ? (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold normal-case  text-blue-600 bg-blue-50">
                                    <span className="h-1 w-1 rounded-full bg-blue-500 animate-pulse" />
                                    Active
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold normal-case  text-slate-400 bg-slate-100">
                                    Inactive
                                  </span>
                                )}
                              </div>
                              <label className="relative inline-flex cursor-pointer items-center shrink-0">
                                <input
                                  type="checkbox"
                                  checked={isActive}
                                  onChange={() => handleSetCurrent(row)}
                                  className="peer sr-only"
                                />
                                <div className="peer h-[18px] w-[34px] rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-[14px] after:w-[14px] after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-[16px] peer-focus:outline-none" />
                              </label>
                            </div>
                          </div>
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
            {/* Refined Pagination - Professional ERP Alignment */}
            <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6 pb-8">
              <div className="flex flex-col gap-0.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Session Index</p>
                <p className="text-[11px] font-medium text-slate-600">
                  Displaying page <span className="font-bold text-slate-900">{page}</span> of <span className="font-bold text-slate-900">{meta?.pages || 1}</span> 
                  <span className="mx-2 text-slate-300">|</span> 
                  <span className="font-bold text-slate-900">{meta?.total || years.length}</span> total entries
                </p>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-50/50 p-1.5 rounded-xl border border-slate-200/40 shadow-sm">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-slate-400 border border-slate-200 transition-all hover:text-blue-600 hover:border-blue-200 disabled:opacity-20 disabled:hover:text-slate-400 disabled:hover:border-slate-200 group shadow-sm"
                >
                  <span className="material-symbols-outlined text-[20px] group-active:scale-90 transition-transform">chevron_left</span>
                </button>
                
                <div className="flex items-center gap-1 px-1">
                  {Array.from({ length: meta?.pages || 1 }).map((_, i) => {
                    const p = i + 1;
                    const isActive = page === p;
                    return (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`h-9 w-9 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center ${
                          isActive 
                          ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" 
                          : "text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-sm border border-transparent hover:border-slate-200"
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>

                <button
                  disabled={!meta || page === meta.pages}
                  onClick={() => setPage(page + 1)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-slate-400 border border-slate-200 transition-all hover:text-blue-600 hover:border-blue-200 disabled:opacity-20 disabled:hover:text-slate-400 disabled:hover:border-slate-200 group shadow-sm"
                >
                  <span className="material-symbols-outlined text-[20px] group-active:scale-90 transition-transform">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>



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
