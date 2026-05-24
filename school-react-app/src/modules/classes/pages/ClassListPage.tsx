import { AppIcon } from "shared/ui/AppIcon";
import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryParams } from "@/hooks/useQueryParams";
import { getSelectedAcademicYearId } from "@/services/academic-year-context";
import { DataTable, DataTableColumn, RowAction, Badge, DataState, TableSkeleton, StatCardGrid } from "@/components/ui";
import { useClasses } from "../hooks/useClasses";
import { useAcademicYears } from "../../academicYear/hooks/useAcademicYears";
import { useTeachers } from "../../teachers/hooks/useTeachers";
import { useSubjects } from "../../subjects/hooks/useSubjects";
import { ClassRow } from "../types/class.types";
import { showToast } from "@/utils/toast";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { ClassCard } from "../components/ClassCard";

export function ClassListPage() {
  const navigate = useNavigate();
  const { currentParams, updateQuery, withQuery } = useQueryParams();
  
  const page = parseInt(currentParams.get("page") || "1");
  const limit = parseInt(currentParams.get("limit") || "12");
  
  const { state, deleteClass } = useClasses({ page, limit });
  const { state: academicYearState } = useAcademicYears();
  const { state: teachersState } = useTeachers();
  const { data: subjectsData } = useSubjects();
  
  const [deletingClass, setDeletingClass] = useState<ClassRow | null>(null);
  const [feeClass, setFeeClass] = useState<ClassRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState(currentParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">((currentParams.get("status") as any) || "all");
  const [viewMode, setViewMode] = useState<"grid" | "list">((currentParams.get("view") as any) || "grid");

  useEffect(() => {
    setSearchQuery(currentParams.get("search") || "");
    setStatusFilter((currentParams.get("status") as any) || "all");
    setViewMode((currentParams.get("view") as any) || "grid");
  }, [currentParams.toString()]);

  const classes = Array.isArray(state.data) ? state.data : (state.data as any)?.data || (state.data as any)?.items || [];
  const meta = (state.data as any)?.meta;

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return classes.filter((row: ClassRow) => {
      const queryMatch =
        q.length === 0 ||
        row.name.toLowerCase().includes(q) ||
        (row.description || "").toLowerCase().includes(q) ||
        (row.academic_year || row.academic_year_id || "").toLowerCase().includes(q);
      const statusMatch = statusFilter === "all" ? true : row.status === statusFilter;
      return queryMatch && statusMatch;
    });
  }, [classes, searchQuery, statusFilter]);

  const handleDelete = async () => {
    if (!deletingClass) return;
    setIsDeleting(true);
    try {
      const result = await deleteClass(deletingClass._id);
      if (result.ok) {
        // Toast already shown by hook
        setDeletingClass(null);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: DataTableColumn<ClassRow>[] = [
    {
      key: "name",
      label: "Name",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs">
            {row.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-slate-900 leading-none mb-1">{row.name}</p>
            <p className="text-[10px] text-slate-400 font-bold normal-case tracking-tighter">Class info</p>
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: "academic_year",
      label: "Session",
      render: (row) => <Badge variant="secondary" className="bg-slate-50 text-slate-600 border-slate-100">{row.academic_year || row.academic_year_id}</Badge>,
    },
    {
      key: "student_count",
      label: "Students",
      render: (row) => <span className="text-[11px] font-bold text-slate-600">{row.student_count || 0}</span>,
    },
    {
      key: "teachers",
      label: "Teachers",
      render: (row) => (
        <div className="flex -space-x-2">
          {(row.teacher_names || []).slice(0, 3).map((t, i) => (
            <div key={i} className="h-6 w-6 rounded-full border-2 border-white bg-slate-900 flex items-center justify-center text-[8px] font-bold text-white shadow-sm" title={t}>
              {t[0]}
            </div>
          ))}
        </div>
      ),
    },
  ];

  const rowActions: RowAction<ClassRow>[] = [
    { icon: "edit_note", label: "Configure", onClick: (row) => navigate(`/admin/classes/${row._id}/edit`) },
    { icon: "schedule", label: "Timetable", onClick: (row) => navigate(`/admin/timetable?class_id=${row._id}`) },
    { icon: "payments", label: "Fee structure", onClick: (row) => navigate(`/admin/classes/${row._id}/fees`) },
    { icon: "delete", label: "Remove", variant: "danger", onClick: (row) => setDeletingClass(row) },
  ];

  const setPage = (p: number) => {
    updateQuery({ page: p.toString() });
  };

  if (state.status === "loading" || state.status === "idle") {
    return <div className="p-8"><TableSkeleton /></div>;
  }

  return (
    <div className="space-y-6 relative min-h-[80vh] pb-10">
      {/* Stats Section */}
      <StatCardGrid
        items={[
          { label: "Total classes", value: meta?.total || classes.length, icon: "door_front", accent: "blue" },
          { label: "Active classes", value: (classes || []).filter((c: ClassRow) => c.status === "active").length, icon: "sensors", accent: "emerald" },
          { label: "Attendance rate", value: `${Math.round((classes || []).reduce((acc: number, c: ClassRow) => acc + (c.attendance_percentage || 0), 0) / (classes.length || 1))}%`, icon: "insights", accent: "purple" },
          { label: "Total students", value: (classes || []).reduce((acc: number, c: ClassRow) => acc + (c.student_count || 0), 0), icon: "groups", accent: "amber" },
        ]}
      />

      {/* Toolbar */}
      <div className="premium-card p-2 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white/80 backdrop-blur-md border-slate-200/60 shadow-sm rounded-xl">
        <div className="flex flex-1 items-center gap-2 max-w-4xl">
          <div className="relative flex-1">
            <AppIcon name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                updateQuery({ search: e.target.value });
              }}
              placeholder="Search by name, year, faculty or subjects..."
              className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-xs font-medium text-slate-700 outline-none transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-600/5 placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-lg bg-slate-100 p-1 shadow-inner">
            <button
              onClick={() => { setViewMode("grid"); updateQuery({ view: "grid" }); }}
              className={`flex h-7 items-center gap-2 rounded-md px-3 text-[11px] font-bold transition-all ${viewMode === "grid" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              <AppIcon name="LayoutGrid" size={16} />
              Grid
            </button>
            <button
              onClick={() => { setViewMode("list"); updateQuery({ view: "list" }); }}
              className={`flex h-7 items-center gap-2 rounded-md px-3 text-[11px] font-bold transition-all ${viewMode === "list" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              <AppIcon name="ViewList" size={16} />
              List
            </button>
          </div>
          <div className="h-6 w-px bg-slate-200" />
          <Link
            to={withQuery("/admin/classes/create")}
            className="inline-flex h-8 items-center gap-2 px-4 text-[10px] font-bold text-white bg-blue-600 border border-slate-900/10 rounded-lg hover:bg-blue-700 transition-all shadow-sm active:scale-95"
          >
            <AppIcon name="PlusSquare" size={16} />
            Add class
          </Link>
        </div>
      </div>

      {/* Academic Year Filter Warning */}
      {classes.length === 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
          <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <AppIcon name="Info" className="font-bold" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-blue-900">Filtering by session</p>
            <p className="text-[10px] text-blue-600 font-medium">
              You are currently viewing classes for the <span className="font-bold">{academicYearState.data?.data?.find(y => y._id === getSelectedAcademicYearId())?.year || "selected"}</span> session. 
              If you don't see your class, it might be registered in a different session. Use the selector in the top-bar to switch.
            </p>
          </div>
        </div>
      )}

      <div className="flex transition-all duration-500 ease-in-out gap-0">
        <div className="flex-1 min-w-0 transition-all duration-500 ease-in-out w-full">
          {filteredRows.length === 0 ? (
            <DataState 
              variant="empty" 
              title={classes.length === 0 ? "No classes in this session" : "No results match search"} 
              message={classes.length === 0 
                ? "Try switching the academic session in the top-bar or register a new class for this session." 
                : "Try refining your search parameters."} 
            />
          ) : (
            <>
              {viewMode === "grid" ? (
                <div className="grid gap-4 transition-all duration-500 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {filteredRows.map((row: ClassRow) => (
                    <ClassCard
                      key={row._id}
                      classItem={row}
                      onEdit={(item) => navigate(`/admin/classes/${item._id}/edit`)}
                      onDelete={setDeletingClass}
                      onFee={(item) => navigate(`/admin/classes/${item._id}/fees`)}
                    />
                  ))}
                </div>
              ) : (
                <div className="premium-card overflow-hidden border-slate-200/60 shadow-sm bg-white rounded-2xl">
                  <DataTable<ClassRow>
                    columns={columns}
                    rows={filteredRows}
                    rowActions={rowActions}
                  />
                </div>
              )}

              {/* Refined Pagination - Professional ERP Alignment */}
              <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6 pb-8">
                <div className="flex flex-col gap-0.5">
                  <p className="text-[10px] font-bold text-slate-400 tracking-wider">Page navigation</p>
                  <p className="text-[11px] font-medium text-slate-600">
                    Page <span className="font-bold text-slate-900">{page}</span> of <span className="font-bold text-slate-900">{meta?.pages || 1}</span> 
                    <span className="mx-2 text-slate-300">|</span> 
                    <span className="font-bold text-slate-900">{meta?.total || classes.length}</span> total units listed
                  </p>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-50/50 p-1.5 rounded-xl border border-slate-200/40 shadow-sm">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-slate-400 border border-slate-200 transition-all hover:text-blue-600 hover:border-blue-200 disabled:opacity-20 disabled:hover:text-slate-400 disabled:hover:border-slate-200 group shadow-sm"
                  >
                    <AppIcon name="ChevronLeft" className="group-active:scale-90 transition-transform" />
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
                    <AppIcon name="ChevronRight" className="group-active:scale-90 transition-transform" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={!!deletingClass}
        onCancel={() => setDeletingClass(null)}
        onConfirm={handleDelete}
        title="Confirm deletion"
        message={`Are you sure you want to remove ${deletingClass?.name}? this action is irreversible.`}
        confirmLabel="Delete class"
        confirmVariant="danger"
        isLoading={isDeleting}
      />

    </div>
  );
}
