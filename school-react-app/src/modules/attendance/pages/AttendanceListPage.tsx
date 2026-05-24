import { AppIcon } from "shared/ui/AppIcon";
import React, { useMemo } from "react";
import { DataTable, DataTableColumn, RowAction, Badge, DataState, Skeleton, TableSkeleton, Select, Card, StatCardGrid } from "@/components/ui";
import { useSafeAsync } from "@/hooks/useSafeAsync";
import { serviceRequest } from "@/services/service-client";
import { useNavigate, useLocation } from "react-router-dom";
import { useAttendance } from "../hooks/useAttendance";
import { AttendanceRecordRow } from "../types/attendance.types";
import { showToast } from "@/utils/toast";
import { useQueryParams } from "@/hooks/useQueryParams";
import { AttendanceBulkForm } from "../components/AttendanceBulkForm";

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

  const { state, updateAttendance, deleteAttendance, refresh } = useAttendance({
    class_id: activeFilters.class_id || undefined,
    date: activeFilters.date || undefined
  });

  const { state: classState, run: runClasses } = useSafeAsync<Array<{ _id: string; name: string; enrolled_students?: number }>>();
  const navigate = useNavigate();
  const pathname = useLocation().pathname;

  const loadClasses = () =>
    runClasses(async () => {
      const res = await serviceRequest<Array<{ _id: string; name: string; enrolled_students?: number }>>("/api/classes");
      if (!res.ok) throw new Error(res.error.message || "Failed to load classes");
      return res.data;
    });

  React.useEffect(() => {
    void loadClasses().catch(() => { });
  }, []);

  const classes = Array.isArray(classState.data) ? classState.data : (classState.data as any)?.data || (classState.data as any)?.items || [];
  const classOptions = classes.map((c: any) => ({ label: c.name, value: c._id }));

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
    const selectedClass = classes.find((c: any) => c._id === activeFilters.class_id);
    
    const totalStudents = activeFilters.class_id 
      ? (selectedClass?.enrolled_students ?? 0) 
      : classes.reduce((sum: number, c: any) => sum + (c.enrolled_students ?? 0), 0);
    
    return {
      total: totalStudents,
      present: data.filter(r => r.status === 'present').length,
      absent: data.filter(r => r.status === 'absent').length,
      unmarked: Math.max(0, totalStudents - data.length),
    };
  }, [state.data, classState.data, activeFilters.class_id]);

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
           <AppIcon name="Calendar" size={14} />
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
              row.status === "present" ? "success" : "error"
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
        const status = window.prompt("Status (present/absent)", row.status)?.trim();
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
    <div className="space-y-6 relative min-h-[80vh] pb-10">
      {/* Stats Section - Premium Compact Design */}
      <div className="px-1">
        <StatCardGrid
          items={[
            { label: "Total Strength", value: stats.total, icon: "groups", accent: "blue" },
            { label: "Present Today", value: stats.present, icon: "check_circle", accent: "emerald" },
            { label: "Absent", value: stats.absent, icon: "cancel", accent: "rose" },
            { label: "Unmarked", value: stats.unmarked, icon: "pending", accent: "amber" },
          ]}
        />
      </div>

      {/* Toolbar Section - Enhanced Alignment & Structure */}
      <div className="premium-card p-3 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/90 backdrop-blur-md border-slate-200/60 shadow-sm rounded-2xl">
        <div className="flex flex-1 flex-wrap items-center gap-3 max-w-5xl">
          <div className="relative min-w-[200px] flex-1">
            <AppIcon name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={activeFilters.search}
              onChange={(e) => {
                const value = e.target.value;
                setActiveFilters(prev => ({ ...prev, search: value }));
                updateQuery({ search: value });
              }}
              placeholder="Search by student name or roll..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-xs font-bold text-slate-700 outline-none transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-600/5 placeholder:text-slate-400"
            />
          </div>
          <div className="h-6 w-px bg-slate-200 hidden md:block" />
          
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={activeFilters.class_id}
              onChange={(e) => {
                const value = e.target.value;
                setActiveFilters(prev => ({ ...prev, class_id: value }));
                updateQuery({ class_id: value });
              }}
              className="h-10 min-w-[140px] rounded-xl border border-slate-200 bg-white px-4 text-[11px] font-black uppercase tracking-tight text-slate-600 outline-none cursor-pointer transition-all hover:border-slate-300 focus:border-blue-400"
            >
              <option value="">Class: All</option>
              {classOptions.map((opt: any) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            
            <div className="relative">
               <input 
                 type="date"
                 value={activeFilters.date}
                 onChange={(e) => {
                   const value = e.target.value;
                   setActiveFilters(prev => ({ ...prev, date: value }));
                   updateQuery({ date: value });
                 }}
                 className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-[11px] font-black uppercase tracking-tight text-slate-600 outline-none transition-all hover:border-slate-300 focus:border-blue-400"
               />
            </div>

            <select 
              value={activeFilters.status}
              onChange={(e) => {
                const value = e.target.value;
                setActiveFilters(prev => ({ ...prev, status: value }));
                updateQuery({ status: value });
              }}
              className="h-10 min-w-[130px] rounded-xl border border-slate-200 bg-white px-4 text-[11px] font-black uppercase tracking-tight text-slate-600 outline-none transition-all hover:border-slate-300 focus:border-blue-400"
            >
              <option value="">Status: All</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
            </select>
          </div>
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
              <AppIcon name="LayoutGrid" size={16} />
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
              <AppIcon name="ViewList" size={16} />
              List
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace Area - Contained & Professional */}
      <div className="bg-slate-50/50 rounded-[2rem] p-4 border border-slate-100 shadow-inner">
        <div className="bg-white rounded-[1.5rem] border border-slate-200/60 shadow-sm overflow-hidden">
          <AttendanceBulkForm 
            initialClassId={activeFilters.class_id}
            initialDate={activeFilters.date}
            viewMode={viewMode as "grid" | "list"}
            onSaved={() => refresh()}
          />
        </div>
      </div>

      {/* Pagination Footer - Improved Alignment & Visibility */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-2 pt-6 pb-12 border-t border-slate-100">
        <div className="flex flex-col gap-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Dataset Insight</p>
          <p className="text-[11px] font-bold text-slate-600">
            Showing <span className="text-blue-600">1</span> to <span className="text-slate-900">{filteredData.length}</span> of <span className="text-slate-900">{stats.total}</span> Attendance Node Entries
          </p>
        </div>
        
        <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
          <button className="h-10 px-4 rounded-xl text-[11px] font-black uppercase tracking-tight text-slate-400 cursor-not-allowed flex items-center gap-2 transition-all">
            <AppIcon name="ChevronLeft" />
            Prev
          </button>
          <div className="h-6 w-px bg-slate-100" />
          <button className="h-10 w-10 rounded-xl bg-blue-600 text-[11px] font-black text-white shadow-lg shadow-blue-600/20 active:scale-95 transition-all">1</button>
          <div className="h-6 w-px bg-slate-100" />
          <button className="h-10 px-4 rounded-xl text-[11px] font-black uppercase tracking-tight text-slate-400 cursor-not-allowed flex items-center gap-2 transition-all">
            Next
            <AppIcon name="ChevronRight" />
          </button>
        </div>
      </div>
    </div>
  );
}
