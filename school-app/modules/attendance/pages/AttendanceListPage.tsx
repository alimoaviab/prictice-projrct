"use client";

import React, { useMemo } from "react";
import { DataTable, DataTableColumn, RowAction, Badge, DataState, Skeleton, TableSkeleton, Select, Card } from "../../../components/ui";
import { useSafeAsync } from "../../../hooks/useSafeAsync";
import { serviceRequest } from "../../../services/service-client";
import { useRouter, usePathname } from "next/navigation";
import { useAttendance } from "../hooks/useAttendance";
import { AttendanceRecordRow } from "../types/attendance.types";
import { showToast } from "../../../utils/toast";

export function AttendanceListPage({ filters: initialFilters }: { filters?: { class_id?: string; student_id?: string; date?: string } }) {
  const [activeFilters, setActiveFilters] = React.useState({
    class_id: initialFilters?.class_id || "",
    date: initialFilters?.date || new Date().toISOString().split('T')[0],
    status: ""
  });

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
    return data;
  }, [state.data, activeFilters.status]);

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
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{row.admission_no}</span>
          </div>
        </div>
      ),
    },
    {
      key: "class",
      label: "Class",
      render: (row) => <span className="text-xs font-bold text-gray-600 uppercase tracking-tight">{row.class_name}</span>,
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
          className="uppercase text-[10px] font-black tracking-widest px-2 py-0.5"
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
    <div className="space-y-8 animate-fade-in-up">
      {/* Header & Stats */}
      <div className="flex flex-col lg:flex-row justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Attendance Explorer</h2>
          <p className="text-sm text-gray-500 font-medium">Analyze and manage student attendance records.</p>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total", value: stats.total, color: "text-gray-900" },
            { label: "Present", value: stats.present, color: "text-green-600" },
            { label: "Absent", value: stats.absent, color: "text-red-600" },
            { label: "Late", value: stats.late, color: "text-orange-600" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white border border-gray-100 rounded-2xl p-3 shadow-sm min-w-[100px]">
              <span className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">{stat.label}</span>
              <span className={`text-lg font-black ${stat.color}`}>{stat.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-gray-100 rounded-[2rem] p-4 shadow-sm flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[200px]">
          <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Classroom</span>
          <select 
            value={activeFilters.class_id}
            onChange={(e) => setActiveFilters(prev => ({ ...prev, class_id: e.target.value }))}
            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-600/10 transition-all"
          >
            <option value="">All Classes</option>
            {classOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>

        <div className="w-full sm:w-48">
          <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Date</span>
          <input 
            type="date"
            value={activeFilters.date}
            onChange={(e) => setActiveFilters(prev => ({ ...prev, date: e.target.value }))}
            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-600/10 transition-all"
          />
        </div>

        <div className="w-full sm:w-40">
          <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Status</span>
          <select 
            value={activeFilters.status}
            onChange={(e) => setActiveFilters(prev => ({ ...prev, status: e.target.value }))}
            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-600/10 transition-all"
          >
            <option value="">All Status</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="late">Late</option>
            <option value="excused">Excused</option>
          </select>
        </div>

        <button 
           onClick={() => {
              const basePath = pathname.includes("/teacher") ? "/teacher/attendance" : "/admin/attendance";
              router.push(`${basePath}/create?class_id=${activeFilters.class_id}`);
           }}
           disabled={!activeFilters.class_id}
           className="h-[46px] px-6 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-50 disabled:shadow-none whitespace-nowrap"
        >
          Mark Attendance
        </button>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-gray-100 rounded-[2.5rem] shadow-sm overflow-hidden">
        {state.status === "loading" ? (
          <div className="p-8"><TableSkeleton /></div>
        ) : (
          <DataTable
            columns={columns}
            rows={filteredData}
            rowKey={(row) => row._id}
            searchable
            searchKeys={["student_name", "admission_no", "note"]}
            sortable
            paginated={10}
            rowActions={pathname.includes("/parent") ? rowActions.filter(a => a.label === "View Details") : rowActions}
            emptyState={{
              title: "No attendance found",
              description: "Adjust your filters or mark attendance for this session.",
              action: { label: "Record New Attendance", href: pathname.includes("/teacher") ? "/teacher/attendance/create" : "/admin/attendance/create" },
            }}
          />
        )}
      </div>
    </div>
  );
}
