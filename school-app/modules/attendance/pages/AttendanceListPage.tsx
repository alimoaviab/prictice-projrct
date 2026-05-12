"use client";

import React, { useMemo } from "react";
import { DataTable, DataTableColumn, RowAction, Badge, DataState, Skeleton, TableSkeleton, Select, Card } from "../../../components/ui";
import { useSafeAsync } from "../../../hooks/useSafeAsync";
import { serviceRequest } from "../../../services/service-client";
import { useRouter, usePathname } from "next/navigation";
import { useAttendance } from "../hooks/useAttendance";
import { AttendanceRecordRow } from "../types/attendance.types";
import { showToast } from "../../../utils/toast";
import { useQueryParams } from "../../../hooks/useQueryParams";

export function AttendanceListPage({ filters: initialFilters }: { filters?: { class_id?: string; student_id?: string; date?: string } }) {
  const { currentParams, updateQuery, withQuery } = useQueryParams();
  const [activeFilters, setActiveFilters] = React.useState({
    class_id: currentParams.get("class_id") || initialFilters?.class_id || "",
    date: currentParams.get("date") || initialFilters?.date || new Date().toISOString().split('T')[0],
    status: currentParams.get("status") || "",
    search: currentParams.get("search") || "",
  });
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("list");

  React.useEffect(() => {
    setActiveFilters({
      class_id: currentParams.get("class_id") || initialFilters?.class_id || "",
      date: currentParams.get("date") || initialFilters?.date || new Date().toISOString().split('T')[0],
      status: currentParams.get("status") || "",
      search: currentParams.get("search") || "",
    });
    const nextView = currentParams.get("view");
    if (nextView === "grid" || nextView === "list") {
      setViewMode(nextView);
    }
  }, [currentParams.toString(), initialFilters?.class_id, initialFilters?.date]);

  const { state, updateAttendance, deleteAttendance } = useAttendance({
    class_id: activeFilters.class_id || undefined,
    date: activeFilters.date || undefined
  });

  const { state: classState, run: runClasses } = useSafeAsync<Array<{ _id: string; name: string }>>();
  const router = useRouter();
  const pathname = usePathname();

  const loadClasses = () =>
    runClasses(async () => {
      const res = await serviceRequest<Array<{ _id: string; name: string }>>("/api/classes");
      if (!res.ok) throw new Error(res.error.message || "Failed to load classes");
      return res.data;
    });

  React.useEffect(() => {
    void loadClasses().catch(() => { });
  }, []);

  const classOptions = (classState.data ?? []).map((c) => ({ label: c.name, value: c._id }));

  const filteredData = useMemo(() => {
    let data = state.data || [];
    if (activeFilters.status) {
      data = data.filter(row => row.status === activeFilters.status);
    }
    const q = activeFilters.search.trim().toLowerCase();
    if (q) {
      data = data.filter((row) =>
        row.student_name.toLowerCase().includes(q) ||
        row.admission_no.toLowerCase().includes(q) ||
        row.class_name.toLowerCase().includes(q) ||
        (row.note || "").toLowerCase().includes(q)
      );
    }
    return data;
  }, [state.data, activeFilters.status, activeFilters.search]);

  const stats = useMemo(() => {
    const data = state.data || [];
    return {
      total: data.length,
      present: data.filter(r => r.status === 'present').length,
      absent: data.filter(r => r.status === 'absent').length,
      late: data.filter(r => r.status === 'late').length,
    };
  }, [state.data]);

  const columns: DataTableColumn<AttendanceRecordRow>[] = [
    {
      key: "student",
      label: "Student Info",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
            {row.student_name.substring(0, 2).toUpperCase()}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-gray-900 truncate">{row.student_name}</span>
            <span className="text-[10px] font-bold text-gray-400 normal-case ">{row.admission_no}</span>
          </div>
        </div>
      ),
    },
    {
      key: "class",
      label: "Class",
      render: (row) => <span className="text-xs font-bold text-gray-600 normal-case tracking-tight">{row.class_name}</span>,
    },
    {
      key: "date",
      label: "Marked Date",
      render: (row) => (
        <div className="flex items-center gap-2 text-gray-500">
           <span className="material-symbols-outlined text-sm">calendar_today</span>
           <span className="text-xs font-medium">{new Date(row.date).toLocaleDateString()}</span>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <Badge
          variant={
            row.status === "present" ? "success" :
              row.status === "absent" ? "error" :
                row.status === "late" ? "warning" : "gray"
          }
          className="normal-case text-[10px] font-bold  px-2 py-0.5"
        >
          {row.status}
        </Badge>
      ),
    },
  ];

  const rowActions: RowAction<AttendanceRecordRow>[] = [
    {
      icon: "edit",
      label: "Edit",
      onClick: async (row) => {
        const status = window.prompt("Status (present/absent/late/excused)", row.status)?.trim();
        if (!status) return;
        await updateAttendance(row._id, { status: status as any });
      },
    },
    {
      icon: "delete",
      label: "Delete",
      variant: "danger",
      requireConfirm: true,
      onClick: (row) => deleteAttendance(row._id),
    },
  ];

  return (
    <div className="space-y-8 relative min-h-[80vh] pb-10">
      {/* Stats Section - Premium ERP Style */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Strength", value: stats.total, icon: "groups", color: "text-slate-600", bg: "bg-slate-600/5" },
          { label: "Present Today", value: stats.present, icon: "check_circle", color: "text-emerald-600", bg: "bg-emerald-600/5" },
          { label: "Absent Records", value: stats.absent, icon: "cancel", color: "text-red-600", bg: "bg-red-600/5" },
          { label: "Late Arrivals", value: stats.late, icon: "schedule", color: "text-amber-600", bg: "bg-amber-600/5" },
        ].map((stat, i) => (
          <div key={i} className="premium-card bg-white p-3.5 border-slate-200/60 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-all cursor-default">
            <div>
              <p className="text-[10px] font-bold text-slate-400 normal-case  mb-1">{stat.label}</p>
              <h3 className="text-xl font-bold text-slate-900 tracking-tighter leading-none">{stat.value}</h3>
            </div>
            <div className={`h-8 w-8 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm`}>
               <span className="material-symbols-outlined text-lg font-bold">{stat.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar Section - Unified & Sticky */}
      <div className="premium-card p-2 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white/80 backdrop-blur-md sticky top-[72px] z-20 border-slate-200/60 shadow-sm rounded-xl">
        <div className="flex flex-1 items-center gap-2 max-w-4xl">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg text-slate-400">search</span>
            <input
              value={activeFilters.search}
              onChange={(e) => {
                const value = e.target.value;
                setActiveFilters(prev => ({ ...prev, search: value }));
                updateQuery({ search: value });
              }}
              placeholder="Search student, admission no..."
              className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-xs font-medium text-slate-700 outline-none transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-600/5 placeholder:text-slate-400"
            />
          </div>
          <div className="h-6 w-px bg-slate-200" />
          <select
            value={activeFilters.class_id}
            onChange={(e) => {
              const value = e.target.value;
              setActiveFilters(prev => ({ ...prev, class_id: value }));
              updateQuery({ class_id: value });
            }}
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 outline-none cursor-pointer transition-all hover:border-slate-300 focus:border-blue-400"
          >
            <option value="">Class: All</option>
            {classOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
          <input 
            type="date"
            value={activeFilters.date}
            onChange={(e) => {
              const value = e.target.value;
              setActiveFilters(prev => ({ ...prev, date: value }));
              updateQuery({ date: value });
            }}
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 outline-none transition-all hover:border-slate-300 focus:border-blue-400"
          />
          <select 
            value={activeFilters.status}
            onChange={(e) => {
              const value = e.target.value;
              setActiveFilters(prev => ({ ...prev, status: value }));
              updateQuery({ status: value });
            }}
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 outline-none transition-all hover:border-slate-300 focus:border-blue-400"
          >
            <option value="">Status: All</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="late">Late</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-lg bg-slate-100 p-1 shadow-inner">
            <button
              onClick={() => {
                setViewMode("grid");
                updateQuery({ view: "grid" });
              }}
              className={`flex h-7 items-center gap-2 rounded-md px-3 text-[11px] font-bold transition-all ${
                viewMode === "grid" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <span className="material-symbols-outlined text-base">grid_view</span>
              Grid
            </button>
            <button
              onClick={() => {
                setViewMode("list");
                updateQuery({ view: "list" });
              }}
              className={`flex h-7 items-center gap-2 rounded-md px-3 text-[11px] font-bold transition-all ${
                viewMode === "list" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <span className="material-symbols-outlined text-base">view_list</span>
              List
            </button>
          </div>
          <div className="h-6 w-px bg-slate-200" />
          <button 
             onClick={() => {
                const basePath = pathname.includes("/teacher") ? "/teacher/attendance" : "/admin/attendance";
               router.push(withQuery(`${basePath}/create`, { class_id: activeFilters.class_id }));
             }}
             disabled={!activeFilters.class_id}
             className="inline-flex h-9 items-center gap-2 px-5 text-[11px] font-bold normal-case  text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95 disabled:opacity-50 disabled:shadow-none whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-lg font-bold">fact_check</span>
            Mark Attendance
          </button>
        </div>
      </div>

      {/* Main Workspace Area */}
      <div>
        {state.status === "loading" ? (
          <TableSkeleton />
        ) : filteredData.length === 0 ? (
          <DataState 
            variant="empty" 
            title="No Attendance Records" 
            message={activeFilters.search ? "Adjust your filters to see more results." : "Start tracking attendance for your active classes today."} 
          />
        ) : (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredData.map((row) => (
                <div key={row._id} className="premium-card group relative flex flex-col p-0 overflow-hidden transition-all duration-500 bg-white border-slate-200/60 hover:shadow-2xl hover:shadow-slate-200/80 hover:-translate-y-1">
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xs font-bold normal-case shadow-sm group-hover:scale-110 transition-transform">
                        {row.student_name.substring(0, 1)}
                      </div>
                      <Badge
                        variant={
                          row.status === "present" ? "success" :
                          row.status === "absent" ? "error" :
                          row.status === "late" ? "warning" : "gray"
                        }
                        className="normal-case text-[9px] font-bold  px-2 py-0.5"
                      >
                        {row.status}
                      </Badge>
                    </div>

                    <div className="mb-6">
                      <h3 className="text-lg font-bold text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors truncate">{row.student_name}</h3>
                      <p className="text-[10px] font-bold text-slate-400 normal-case  mt-1">{row.admission_no} • {row.class_name}</p>
                    </div>

                    <div className="flex items-center gap-3 pt-4 border-t border-slate-50">
                      <div className="flex items-center gap-1.5 text-slate-400">
                         <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                         <span className="text-[10px] font-bold normal-case ">{new Date(row.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-auto px-5 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between group-hover:bg-white transition-all">
                     <button className="text-[10px] font-bold text-slate-400 normal-case  hover:text-blue-600 flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">history</span>
                        Log
                     </button>
                     <button className="text-[10px] font-bold text-blue-600 hover:underline normal-case  flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">edit</span>
                        Adjust
                     </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="premium-card overflow-hidden border-slate-200/60 shadow-sm bg-white rounded-2xl">
              <DataTable
                columns={columns}
                rows={filteredData}
                rowKey={(row) => row._id}
                sortable
                paginated={10}
                rowActions={pathname.includes("/parent") ? rowActions.filter(a => a.label === "View Details") : rowActions}
              />
            </div>
          )
        )}
      </div>

      {/* Pagination Footer - Premium ERP Style */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
        <p className="text-[10px] font-bold text-slate-400 normal-case ">
          Showing <span className="text-blue-600">1</span> to <span className="text-slate-900">{filteredData.length}</span> of <span className="text-slate-900">{stats.total}</span> Attendance Records
        </p>
        <div className="flex items-center gap-2">
          <button className="h-9 px-4 rounded-xl border border-slate-200 text-[10px] font-bold normal-case  text-slate-400 cursor-not-allowed flex items-center gap-2">
            <span className="material-symbols-outlined text-base">chevron_left</span>
            Previous
          </button>
          <div className="flex items-center gap-1">
            <button className="h-9 w-9 rounded-xl bg-blue-600 text-[10px] font-bold text-white shadow-lg shadow-blue-600/20">1</button>
          </div>
          <button className="h-9 px-4 rounded-xl border border-slate-200 text-[10px] font-bold normal-case  text-slate-400 cursor-not-allowed flex items-center gap-2">
            Next
            <span className="material-symbols-outlined text-base">chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  );
}
