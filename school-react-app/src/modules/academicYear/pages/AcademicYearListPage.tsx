import { Link } from "react-router-dom";
import { useState } from "react";
import { Badge, Button, Card, DataState, LayoutCard, PageHeader, Skeleton, TableSkeleton } from "@/components/ui";
import { useAcademicYears } from "../hooks/useAcademicYears";
import { AcademicYearRow, AcademicYearUpdateInput } from "../types/academicYear.types";
import { showToast } from "@/utils/toast";
import { AcademicYearEditSidebar } from "../components/AcademicYearEditSidebar";
import { AcademicYearTable } from "../components/AcademicYearTable";
import { DeleteSessionSidebar } from "../components/DeleteSessionSidebar";
import { setSelectedAcademicYearId } from "@/services/academic-year-context";
import { ConstraintSidebar } from "../components/ConstraintSidebar";

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
  const [constraintError, setConstraintError] = useState<{ title: string; message: string; reason?: string } | null>(null);
  
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
        // Toast already shown by hook
        setDeletingYear(null);
      } else if ((result.error as any)?.code === "CONSTRAINT_ERROR") {
        setConstraintError({
          title: "Deletion Restricted",
          message: "You cannot delete this academic year because it is currently the only active session in the system.",
          reason: (result.error as any).message
        });
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
        // Toast already shown by hook
      } else if ((result as any).error?.code === "CONSTRAINT_ERROR") {
        setConstraintError({
            title: "Deactivation Restricted",
            message: "System policy requires at least one academic year to remain active at all times to maintain data integrity.",
            reason: (result as any).error.message
        });
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
        {/* Stats Section */}
        <div className={`grid gap-3 ${isDrawerOpen ? "grid-cols-1 md:grid-cols-2" : "grid-cols-2 md:grid-cols-4"}`}>
          {[
            { label: "Total Sessions", value: years.length, icon: "calendar_today", color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Active Session", value: activeYear?.year || "None", icon: "auto_awesome", color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Completed", value: years.filter(y => y.status === "completed").length, icon: "verified", color: "text-purple-600", bg: "bg-purple-50" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-slate-200 ring-1 ring-slate-900/5 px-3.5 py-3 shadow-[0_4px_18px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.05)] transition-all group">
              <div className="flex items-center gap-3">
                <div className={`h-9 w-9 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center transition-transform group-hover:scale-105 shrink-0`}>
                  <span className="material-symbols-outlined text-lg">{stat.icon}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 normal-case truncate">{stat.label}</p>
                  <p className="mt-0.5 text-lg font-bold text-slate-900 tracking-tight leading-none truncate">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
          <Link
            to="/admin/academic-years/create"
            className={`bg-white rounded-xl border border-slate-200 ring-1 ring-slate-900/5 px-3.5 py-3 shadow-[0_4px_18px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.05)] hover:border-blue-300 transition-all group flex items-center gap-3 ${isDrawerOpen ? "hidden md:flex" : ""}`}
          >
            <div className="h-9 w-9 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:rotate-90 transition-all shrink-0">
              <span className="material-symbols-outlined text-lg">add</span>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 normal-case truncate">Quick Action</p>
              <p className="mt-0.5 text-sm font-bold text-slate-900 tracking-tight leading-none group-hover:text-blue-600 transition-colors truncate">Add New Session</p>
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
                placeholder="Filter by session name or notes..."
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
              to="/admin/academic-years/create"
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredYears.map((row) => {
                      const days = durationInDays(row.start_date, row.end_date);
                      const isActive = row.is_active;
                      const isEditing = editingYear?._id === row._id;
                      const status = row.status || "draft";
                      
                      return (
                        <LayoutCard
                          key={row._id}
                          isActive={isActive}
                          isEditing={isEditing}
                          title={row.year}
                          subtitle={isActive ? "Primary Session" : "Archived Session"}
                          icon={<span className="material-symbols-outlined text-2xl">calendar_month</span>}
                          badge={isActive && <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-ping" />}
                          actions={
                            <Link 
                              to={`/admin/academic-years/${row._id}/edit`}
                              className="h-8 w-8 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-blue-600 hover:text-white hover:shadow-lg transition-all"
                            >
                              <span className="material-symbols-outlined text-[18px]">edit_square</span>
                            </Link>
                          }
                        >
                          {/* Timeline Visualization */}
                          <div className="relative my-4">
                             <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[1px] bg-slate-100" />
                             <div className="relative flex items-center justify-between gap-2">
                                <div className="z-10 bg-white border border-slate-100 rounded-xl p-2 shadow-sm">
                                   <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5 text-center">Start</p>
                                   <p className="text-[9px] font-black text-slate-800">{formatDate(row.start_date)}</p>
                                </div>
                                <div className={`z-10 h-6 px-2.5 rounded-full flex items-center justify-center text-[8px] font-black tracking-widest uppercase border ${
                                  isActive ? "bg-blue-600 text-white border-blue-500 shadow-md" : "bg-slate-100 text-slate-400 border-slate-200"
                                }`}>
                                  {days}d
                                </div>
                                <div className="z-10 bg-white border border-slate-100 rounded-xl p-2 shadow-sm">
                                   <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5 text-center">End</p>
                                   <p className="text-[9px] font-black text-slate-800">{formatDate(row.end_date)}</p>
                                </div>
                             </div>
                          </div>

                          <div className="space-y-3">
                            <p className="text-[10px] font-medium text-slate-500 line-clamp-2 leading-relaxed h-8">
                              {row.description || "No specific instructions or notes provided."}
                            </p>

                            <div className="flex items-center justify-between pt-3 border-t border-slate-100/60">
                              <Badge 
                                variant={status === "active" ? "success" : status === "completed" ? "gray" : "warning"}
                                className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg"
                              >
                                {status}
                              </Badge>
                              
                              <div className="flex items-center gap-2">
                                <span className={`text-[8px] font-black uppercase tracking-widest ${isActive ? "text-blue-600" : "text-slate-400"}`}>
                                  {isActive ? "Active" : "Mark Active"}
                                </span>
                                <label className="relative inline-flex cursor-pointer items-center">
                                  <input
                                    type="checkbox"
                                    checked={isActive}
                                    onChange={() => handleSetCurrent(row)}
                                    className="peer sr-only"
                                  />
                                  <div className="peer h-[18px] w-[32px] rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-[14px] after:w-[14px] after:rounded-full after:bg-white after:shadow-sm after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-[14px] peer-focus:outline-none" />
                                </label>
                              </div>
                            </div>
                          </div>
                        </LayoutCard>
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
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Page Navigation</p>
                <p className="text-[11px] font-medium text-slate-600">
                  Page <span className="font-bold text-slate-900">{page}</span> of <span className="font-bold text-slate-900">{meta?.pages || 1}</span> 
                  <span className="mx-2 text-slate-300">|</span> 
                  <span className="font-bold text-slate-900">{meta?.total || years.length}</span> total sessions listed
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



      <AcademicYearEditSidebar 
        academicYear={editingYear}
        isOpen={editingYear !== null}
        onClose={() => setEditingYear(null)}
        isSaving={isSaving}
        onSave={async (id, data) => {
            setIsSaving(true);
            try {
                const result = await updateAcademicYear(id, data);
                if (result.ok) {
                    // Toast already shown by hook
                    setEditingYear(null);
                } else if ((result as any).error?.code === "CONSTRAINT_ERROR") {
                    setConstraintError({
                        title: "Update Restricted",
                        message: "This session cannot be deactivated because it is currently the only active academic year in the system.",
                        reason: (result as any).error.message
                    });
                }
            } finally {
                setIsSaving(false);
            }
        }}
      />
      <DeleteSessionSidebar 
        isOpen={deletingYear !== null}
        session={deletingYear}
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onClose={() => setDeletingYear(null)}
      />
      <ConstraintSidebar 
        isOpen={constraintError !== null}
        onClose={() => setConstraintError(null)}
        title={constraintError?.title || ""}
        message={constraintError?.message || ""}
        reason={constraintError?.reason}
      />
    </>
  );
}
