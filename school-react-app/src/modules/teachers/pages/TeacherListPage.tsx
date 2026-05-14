import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { DataTable, DataTableColumn, RowAction, Badge, DataState, Skeleton, TableSkeleton, StatCardGrid } from "@/components/ui";
import { useTeachers } from "../hooks/useTeachers";
import { useClasses } from "../../classes/hooks/useClasses";
import { useSubjects } from "../../subjects/hooks/useSubjects";
import { TeacherRow, TeacherFormInput } from "../types/teacher.types";
import { showToast } from "@/utils/toast";
import { TeacherEditSidebar } from "../components/TeacherEditSidebar";
import { useQueryParams } from "@/hooks/useQueryParams";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

export function TeacherListPage() {
  const pathname = useLocation().pathname;
  const { state, updateTeacher, deleteTeacher } = useTeachers();
  const { state: classesState } = useClasses();
  const { data: subjectsData } = useSubjects();
  const { currentParams, updateQuery, withQuery } = useQueryParams();
  
  const [editingTeacher, setEditingTeacher] = useState<TeacherRow | null>(null);
  const [deletingTeacher, setDeletingTeacher] = useState<TeacherRow | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState(currentParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "on_leave" | "inactive">((currentParams.get("status") as any) || "all");
  const [viewMode, setViewMode] = useState<"grid" | "list">((currentParams.get("view") as any) || "grid");

  useEffect(() => {
    setSearchQuery(currentParams.get("search") || "");
    setStatusFilter((currentParams.get("status") as any) || "all");
    setViewMode((currentParams.get("view") as any) || "grid");
  }, [currentParams.toString()]);

  const classOptions = useMemo(() => ((classesState.data as any)?.data || []).map((cls: any) => ({
    id: cls._id,
    label: cls.name,
  })), [classesState.data]);

  const subjectOptions = useMemo(() => subjectsData.map((subj) => ({ 
    id: (subj as any)._id || (subj as any).id || subj.name, 
    label: subj.name 
  })), [subjectsData]);

  const filteredRows = useMemo(() => {
    const rows = state.data || [];
    const q = searchQuery.trim().toLowerCase();
    return rows.filter((row) => {
      const queryMatch =
        q.length === 0 ||
        (row.employee_no || "").toLowerCase().includes(q) ||
        `${row.first_name || ""} ${row.last_name || ""}`.toLowerCase().includes(q) ||
        (row.email || "").toLowerCase().includes(q) ||
        (row.qualification || "").toLowerCase().includes(q);
      const statusMatch = statusFilter === "all" ? true : row.status === statusFilter;
      return queryMatch && statusMatch;
    });
  }, [state.data, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    const data = state.data || [];
    return {
      total: data.length,
      active: data.filter(r => r.status === 'active').length,
      onLeave: data.filter(r => r.status === 'on_leave').length,
      capacity: "94%",
    };
  }, [state.data]);

  const columns: DataTableColumn<TeacherRow>[] = useMemo(() => [
    {
      key: "employee_no",
      label: "Employee ID",
      render: (row) => <span className="font-bold text-[10px] text-blue-600 normal-case ">{row.employee_no}</span>,
    },
    {
      key: "name",
      label: "Faculty Member",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold normal-case">
            {(row.first_name || "?").substring(0, 1)}{(row.last_name || "").substring(0, 1)}
          </div>
          <div>
            <p className="font-bold text-slate-900 leading-none mb-1">{row.first_name} {row.last_name}</p>
            <p className="text-[10px] text-slate-400 font-bold normal-case tracking-tighter">{row.email}</p>
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: "qualification",
      label: "Qualification",
      render: (row) => <span className="text-[11px] font-bold text-slate-600">{row.qualification || "—"}</span>,
    },
    {
      key: "subjects",
      label: "Specializations",
      render: (row) => {
        const subjects = row.subjects || [];
        return (
          <div className="flex flex-wrap gap-1">
            {subjects.slice(0, 2).map((s) => (
              <Badge key={s} variant="secondary" className="text-[9px] font-bold normal-case tracking-tighter px-1.5 py-0">
                {s}
              </Badge>
            ))}
            {subjects.length > 2 && (
              <Badge variant="secondary" className="text-[9px] font-bold px-1.5 py-0 text-slate-400">+{subjects.length - 2}</Badge>
            )}
          </div>
        );
      },
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <Badge
          variant={row.status === "active" ? "success" : row.status === "on_leave" ? "warning" : "gray"}
          className="normal-case text-[9px] font-bold normal-case  px-2"
        >
          {(row.status || "unknown").replace("_", " ")}
        </Badge>
      ),
    },
  ], []);

  const rowActions: RowAction<TeacherRow>[] = useMemo(() => [
    {
      icon: "visibility",
      label: "View Hub",
      variant: "primary",
      onClick: (row) => {
        alert(`Teacher Hub: ${row.first_name} ${row.last_name}`);
      },
    },
    {
      icon: "edit",
      label: "Edit Record",
      variant: "ghost",
      onClick: (row) => setEditingTeacher(row),
    },
    {
      icon: "delete",
      label: "Remove",
      variant: "danger",
      onClick: (row) => setDeletingTeacher(row),
    },
  ], []);

  const handleDelete = async () => {
    if (!deletingTeacher) return;
    setIsDeleting(true);
    try {
      const result = await deleteTeacher(deletingTeacher._id);
      if (result.ok) {
        setDeletingTeacher(null);
      } else {
        showToast(result.error.message || "Failed to delete teacher", "error");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  if ((state.status === "loading" || state.status === "idle") && !state.data) {
    return <TableSkeleton />;
  }

  if (state.status === "error") {
    return <DataState variant="error" title="Failed to load faculty" message={state.error} />;
  }

  return (
    <div className="space-y-6 relative min-h-[80vh] pb-10">
      {/* Stats Section */}
      <StatCardGrid
        items={[
          { label: "Total Teachers", value: stats.total, icon: "badge", accent: "blue" },
          { label: "Active", value: stats.active, icon: "check_circle", accent: "emerald" },
          { label: "On Leave", value: stats.onLeave, icon: "event_busy", accent: "amber" },
          { label: "Subjects Covered", value: new Set((state.data || []).flatMap(t => t.subjects || [])).size, icon: "menu_book", accent: "purple" },
        ]}
      />

      {/* Toolbar Section - Unified & Sticky */}
      <div className="premium-card p-2 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white/80 backdrop-blur-md sticky top-[72px] z-20 border-slate-200/60 shadow-sm rounded-xl">
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
              placeholder="Search faculty name, ID or qualification..."
              className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-xs font-medium text-slate-700 outline-none transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-600/5 placeholder:text-slate-400"
            />
          </div>
          <div className="h-6 w-px bg-slate-200" />
          <select
            value={statusFilter}
            onChange={(e) => {
              const value = e.target.value as any;
              setStatusFilter(value);
              updateQuery({ status: value });
            }}
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 outline-none cursor-pointer transition-all hover:border-slate-300 focus:border-blue-400"
          >
            <option value="all">Lifecycle: All</option>
            <option value="active">Active Only</option>
            <option value="on_leave">Currently On Leave</option>
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
          <span className="text-[10px] font-bold text-slate-900 normal-case  px-2 whitespace-nowrap">
            {filteredRows.length} <span className="text-slate-400">FACULTY</span>
          </span>
          <div className="h-6 w-px bg-slate-200" />
          <Link
            to={withQuery("/admin/teachers/create")}
            className="inline-flex h-9 items-center gap-2 px-5 text-[11px] font-bold normal-case  text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
          >
            <span className="material-symbols-outlined text-lg">person_add</span>
            Add Faculty
          </Link>
        </div>
      </div>

      {/* Main Content Area */}
      <div>
        {filteredRows.length === 0 ? (
          <DataState 
            variant="empty" 
            title="No Faculty Found" 
            message={searchQuery ? "Try refining your search parameters." : "Start by adding your first faculty member to the directory."} 
          />
        ) : (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredRows.map((row) => (
                <div key={row._id} className="premium-card group relative flex flex-col p-0 overflow-hidden transition-all duration-500 bg-white border-slate-200/60 hover:shadow-2xl hover:shadow-slate-200/80 hover:-translate-y-1">
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xs font-bold normal-case shadow-lg group-hover:scale-110 transition-transform">
                        {(row.first_name || "?").substring(0, 1)}{(row.last_name || "").substring(0, 1)}
                      </div>
                      <div className="flex items-center gap-1 bg-slate-50/50 rounded-lg p-1 border border-slate-100">
                        <button 
                          onClick={() => setEditingTeacher(row)}
                          className="h-7 w-7 flex items-center justify-center rounded text-slate-400 hover:bg-white hover:text-blue-600 hover:shadow-sm transition-all"
                        >
                          <span className="material-symbols-outlined text-base">edit</span>
                        </button>
                        <button 
                          onClick={() => setDeletingTeacher(row)}
                          className="h-7 w-7 flex items-center justify-center rounded text-slate-400 hover:bg-white hover:text-red-500 hover:shadow-sm transition-all"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="text-base font-bold text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors truncate">{row.first_name} {row.last_name}</h3>
                        <Badge variant={row.status === "active" ? "success" : row.status === "on_leave" ? "warning" : "gray"} className="text-[7px] font-bold normal-case  px-1 py-0">
                          {row.status}
                        </Badge>
                      </div>
                      <p className="text-[9px] font-bold text-blue-600 normal-case ">{row.employee_no}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="bg-slate-50/50 rounded-lg p-2 border border-slate-100/50">
                        <p className="text-[7px] font-bold text-slate-400 normal-case  mb-0.5">Qualification</p>
                        <p className="text-[9px] font-bold text-slate-700 truncate">{row.qualification || "B.Ed"}</p>
                      </div>
                      <div className="bg-slate-50/50 rounded-lg p-2 border border-slate-100/50">
                        <p className="text-[7px] font-bold text-slate-400 normal-case  mb-0.5">Specialization</p>
                        <p className="text-[9px] font-bold text-slate-700 truncate">{(row.subjects || [])[0] || "—"}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                       <div className="flex items-center gap-2 text-slate-400">
                          <span className="material-symbols-outlined text-sm">mail</span>
                          <span className="text-[10px] font-bold normal-case  truncate max-w-[120px]">{row.email}</span>
                       </div>
                    </div>
                  </div>
                  
                  <div className="mt-auto px-4 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between group-hover:bg-white transition-all">
                     <button className="text-[9px] font-bold text-slate-400 normal-case  hover:text-blue-600 flex items-center gap-1 transition-colors">
                        <span className="material-symbols-outlined text-xs">calendar_month</span>
                        Schedule
                     </button>
                     <Link to={`/admin/teachers/${row._id}`} className="group/btn h-7 px-3 rounded-lg bg-blue-600 text-[9px] font-bold text-white normal-case  hover:bg-blue-700 transition-all flex items-center gap-2 shadow-sm active:scale-95">
                        Hub
                        <span className="material-symbols-outlined text-xs transition-transform group-hover/btn:translate-x-1">arrow_forward</span>
                     </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="premium-card overflow-hidden border-slate-200/60 shadow-sm bg-white rounded-2xl">
              <DataTable
                columns={columns}
                rows={filteredRows}
                rowKey={(row) => row._id}
                sortable
                paginated={10}
                rowActions={rowActions}
              />
            </div>
          )
        )}
      </div>

      {/* Pagination Footer - Premium ERP Style */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
        <p className="text-[10px] font-bold text-slate-400 normal-case ">
          Showing <span className="text-blue-600">1</span> to <span className="text-slate-900">{filteredRows.length}</span> of <span className="text-slate-900">{state.data?.length}</span> Faculty Records
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

      <TeacherEditSidebar
        teacher={editingTeacher}
        isOpen={editingTeacher !== null}
        classOptions={classOptions}
        subjectOptions={subjectOptions}
        onClose={() => setEditingTeacher(null)}
        onSave={async (id, data) => {
          setIsSaving(true);
          try {
            await updateTeacher(id, data as Partial<TeacherFormInput>);
          } finally {
            setIsSaving(false);
          }
        }}
        isSaving={isSaving}
      />
      <ConfirmModal
        isOpen={!!deletingTeacher}
        onCancel={() => setDeletingTeacher(null)}
        onConfirm={handleDelete}
        title="Confirm Deletion"
        message={`Are you sure you want to remove ${deletingTeacher?.first_name} ${deletingTeacher?.last_name}? This action is irreversible.`}
        confirmLabel="Remove Faculty"
        confirmVariant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
