"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DataTable, DataTableColumn, RowAction, Badge, DataState, ListToolbar, Skeleton, TableSkeleton } from "../../../components/ui";
import { useClasses } from "../hooks/useClasses";
import { useAcademyCare } from "../../academyCare/hooks/useAcademyCare";
import { useTeachers } from "../../teachers/hooks/useTeachers";
import { useSubjects } from "../../subjects/hooks/useSubjects";
import { ClassRow, ClassFormInput } from "../types/class.types";
import { showToast } from "../../../utils/toast";
import { ClassEditSidebar } from "../components/ClassEditSidebar";
import { useSafeAsync } from "../../../hooks/useSafeAsync";
import { ConfirmModal } from "../../../components/ui/ConfirmModal";

export function ClassListPage() {
  const { state, updateClass, deleteClass } = useClasses();
  const { state: academyCareState } = useAcademyCare();
  const { state: teachersState } = useTeachers();
  const [editingClass, setEditingClass] = useState<ClassRow | null>(null);
  const [deletingClass, setDeletingClass] = useState<ClassRow | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const academyCareOptions = (academyCareState.data || []).map((ac) => ({
    id: ac._id,
    label: (ac as any).name || ac.year,
  }));

  const teacherOptions = (teachersState.data || []).map((teacher) => ({
    id: teacher._id,
    label: `${teacher.first_name} ${teacher.last_name}`,
  }));

  const { data: subjectsData, createSubject } = useSubjects();

  const subjectOptions = (subjectsData || [])
    .filter(s => s.status === "active")
    .map((s) => ({
      id: s._id,
      label: s.name,
    }));

  const getSubjectLabel = (subject: unknown) => {
    if (typeof subject === "string") return subject;
    if (subject && typeof subject === "object") return (subject as any).name ?? String(subject);
    return "";
  };

  const getSubjectKey = (subject: unknown, index: number) => {
    if (typeof subject === "string") return subject;
    if (subject && typeof subject === "object") {
      return String((subject as any).id ?? (subject as any)._id ?? (subject as any).name ?? index);
    }
    return String(index);
  };


  const handleDelete = async () => {
    if (!deletingClass) return;
    setIsDeleting(true);
    try {
      const result = await deleteClass(deletingClass._id);
      if (result.ok) {
        showToast(`${deletingClass.name} deleted successfully`, "success");
        setDeletingClass(null);
      } else {
        showToast(result.error.message || "Failed to delete class", "error");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredRows = useMemo(() => {
    const rows = state.data || [];
    const q = searchQuery.trim().toLowerCase();
    return rows.filter((row) => {
      const queryMatch =
        q.length === 0 ||
        row.name.toLowerCase().includes(q) ||
        (row.description || "").toLowerCase().includes(q) ||
        (row.academy_care_year || row.academy_care_id || "").toLowerCase().includes(q) ||
        (row.room_number || "").toLowerCase().includes(q) ||
        (row.teacher_names || row.teacher_ids || []).join(" ").toLowerCase().includes(q) ||
        row.subjects.join(" ").toLowerCase().includes(q);
      const statusMatch = statusFilter === "all" ? true : row.status === statusFilter;
      return queryMatch && statusMatch;
    });
  }, [state.data, searchQuery, statusFilter]);

  const columns: DataTableColumn<ClassRow>[] = [
    {
      key: "name",
      label: "Class Identity",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-black text-xs">
            {row.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-slate-900 leading-none mb-1">{row.name}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Academic Node</p>
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: "academic_year",
      label: "Session",
      render: (row) => <Badge variant="secondary" className="bg-slate-50 text-slate-600 border-slate-100">{row.academy_care_year || row.academy_care_id}</Badge>,
    },
    {
      key: "room",
      label: "Room",
      render: (row) => <span className="text-[11px] font-bold text-slate-600">{row.room_number || "—"}</span>,
    },
    {
      key: "teachers",
      label: "Faculty",
      render: (row) => (
        <div className="flex -space-x-2">
          {(row.teacher_names || row.teacher_ids || []).slice(0, 3).map((t, i) => (
            <div key={i} className="h-6 w-6 rounded-full border-2 border-white bg-blue-100 flex items-center justify-center text-[8px] font-black text-blue-700" title={t}>
              {t.split(' ').map(n => n[0]).join('').substring(0, 2)}
            </div>
          ))}
          {(row.teacher_names || row.teacher_ids || []).length > 3 && (
            <div className="h-6 w-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[8px] font-black text-slate-500">
              +{(row.teacher_names || row.teacher_ids || []).length - 3}
            </div>
          )}
        </div>
      ),
    },
  ];

  const rowActions: RowAction<ClassRow>[] = [
    {
      icon: "settings",
      label: "Configure",
      variant: "ghost",
      onClick: (row) => setEditingClass(row),
    },
    {
      icon: "calendar_month",
      label: "Timetable",
      variant: "ghost",
      onClick: (row) => window.location.href = `/admin/timetable?class_id=${row._id}`,
    },
    {
      icon: "delete",
      label: "Remove",
      variant: "danger",
      onClick: (row) => setDeletingClass(row),
    },
  ];

  if (state.status === "loading" || state.status === "idle") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 rounded-2xl" />)}
        </div>
        <TableSkeleton />
      </div>
    );
  }

  if (state.status === "error") {
    return <DataState variant="error" title="Failed to load classes" message={state.error} />;
  }

  const isDrawerOpen = editingClass !== null;

  return (
    <div className="space-y-8 relative min-h-[87vh] pb-10">

      {/* Stats Section - Compact & Readable */}
      <div className={`grid gap-4 transition-all duration-500 ease-in-out ${isDrawerOpen ? "grid-cols-1 md:grid-cols-2" : "grid-cols-2 md:grid-cols-4"}`}>
        {[
          { label: "Total Classes", value: (state.data || []).length, icon: "groups", color: "text-slate-500", bg: "bg-slate-500/5" },
          { label: "Active Now", value: (state.data || []).filter(c => c.status === "active").length, icon: "sensors", color: "text-blue-600", bg: "bg-blue-600/5" },
          { label: "Total Subjects", value: (state.data || []).reduce((acc, c) => acc + (c.subjects?.length || 0), 0), icon: "account_tree", color: "text-emerald-600", bg: "bg-emerald-600/5" },
          { label: "Assigned Rooms", value: (state.data || []).filter(c => !!c.room_number).length, icon: "meeting_room", color: "text-purple-600", bg: "bg-purple-600/5" },
        ].map((stat) => (
          <div key={stat.label} className="premium-card bg-white p-3.5 border-slate-200/60 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-all cursor-default">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <h3 className="text-xl font-black text-slate-900 tracking-tighter leading-none">{stat.value}</h3>
            </div>
            <div className={`h-8 w-8 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center transition-transform group-hover:scale-110`}>
              <span className="material-symbols-outlined text-lg font-black">{stat.icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="premium-card p-2 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white/80 backdrop-blur-md sticky top-[72px] z-20 border-slate-200/60 shadow-sm rounded-xl">
        <div className="flex flex-1 items-center gap-2 max-w-2xl">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg text-slate-400">search</span>
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by name, year, faculty or subjects..."
              className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-xs font-medium text-slate-700 outline-none transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-600/5 placeholder:text-slate-400"
            />
          </div>
          </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-lg bg-slate-100 p-1 shadow-inner">
            <button
              onClick={() => setViewMode("grid")}
              className={`flex h-7 items-center gap-2 rounded-md px-3 text-[11px] font-bold transition-all ${viewMode === "grid" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
            >
              <span className="material-symbols-outlined text-base">grid_view</span>
              Grid
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex h-7 items-center gap-2 rounded-md px-3 text-[11px] font-bold transition-all ${viewMode === "list" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
            >
              <span className="material-symbols-outlined text-base">view_list</span>
              List
            </button>
          </div>
          <div className="h-6 w-px bg-slate-200" />
          <span className="text-xs font-black text-slate-900 uppercase tracking-widest px-2 whitespace-nowrap">
            {filteredRows.length} <span className="text-slate-400">Total Units</span>
          </span>
          <div className="h-6 w-px bg-slate-200" />
          <Link
            href="/admin/classes/create"
            className="inline-flex h-8 items-center gap-2 px-4 text-[10px] font-black uppercase tracking-widest text-white bg-blue-600 backdrop-blur-md border border-slate-900/10 rounded-lg hover:bg-slate-800 transition-all shadow-sm active:scale-95"
          >
            <span className="material-symbols-outlined text-base">add_box</span>
            Register Class
          </Link>
        </div>
      </div>

      <div className={`flex transition-all duration-500 ease-in-out ${isDrawerOpen ? "gap-6" : "gap-0"}`}>
        <div className={`flex-1 min-w-0 transition-all duration-500 ease-in-out ${isDrawerOpen ? "w-[calc(100%-400px)]" : "w-full"}`}>
          {(state.data || []).length === 0 ? (
            <DataState variant="empty" title="No classes registered" message="Begin building your school architecture by adding your first classroom." />
          ) : filteredRows.length === 0 ? (
            <DataState variant="empty" title="No matching groups" message="Try refining your filter parameters." />
          ) : (
            viewMode === "grid" ? (
              <div className={`grid gap-4 transition-all duration-500 ${isDrawerOpen
                ? "grid-cols-1 lg:grid-cols-2"
                : "grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
                }`}>
                {filteredRows.map((row) =>                   <div
                    key={row._id}
                    className={`premium-card group relative flex flex-col p-0 overflow-hidden transition-all duration-500 bg-white border-slate-200/60 hover:shadow-2xl hover:shadow-slate-200/80 hover:-translate-y-1 ${editingClass?._id === row._id ? "ring-2 ring-blue-600 border-blue-400 translate-x-2" : ""
                      }`}
                  >
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm transition-transform group-hover:scale-110">
                          <span className="material-symbols-outlined font-black">door_front</span>
                        </div>
                        <div className="flex items-center gap-1 bg-slate-50/50 rounded-lg p-1 border border-slate-100">
                          <button
                            onClick={() => setEditingClass(row)}
                            title="Configure"
                            className="h-7 w-7 flex items-center justify-center rounded text-slate-400 hover:bg-white hover:text-blue-600 hover:shadow-sm transition-all"
                          >
                            <span className="material-symbols-outlined text-base">settings</span>
                          </button>
                          <button
                            onClick={() => setDeletingClass(row)}
                            title="Remove"
                            className="h-7 w-7 flex items-center justify-center rounded text-slate-400 hover:bg-white hover:text-red-500 hover:shadow-sm transition-all"
                          >
                            <span className="material-symbols-outlined text-base">delete</span>
                          </button>
                        </div>
                      </div>

                      <div className="mb-6">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-black text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">{row.name}</h3>
                        </div>
                        <p className="text-[11px] font-bold text-slate-500 leading-relaxed line-clamp-2">
                          {row.description || "Foundational academic group module."}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                        <div className="space-y-1">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Faculty Head</p>
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-slate-900 text-[8px] font-black text-white flex items-center justify-center uppercase shadow-sm">
                              {(row.teacher_names?.[0] || 'T').substring(0, 1)}
                            </div>
                            <p className="text-[10px] font-bold text-slate-700 truncate">
                              {row.teacher_names?.[0] || "Unassigned"}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Room Allocation</p>
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-slate-900 text-xs font-black">location_on</span>
                            <p className="text-[10px] font-bold text-slate-700">{row.room_number || "Open Node"}</p>
                          </div>
                        </div>
                      </div>

                      {row.subjects && row.subjects.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-50">
                          <div className="flex flex-wrap gap-1">
                            {(row.subjects || []).slice(0, 3).map((s, i) => (
                              <Badge key={getSubjectKey(s, i)} variant="secondary" className="bg-blue-50/50 text-blue-600 border-blue-100/50 text-[9px] font-bold">
                                {getSubjectLabel(s)}
                              </Badge>
                            ))}
                            {row.subjects.length > 3 && (
                              <Badge variant="secondary" className="bg-slate-50 text-slate-400 text-[9px] font-black">+{row.subjects.length - 3}</Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-auto px-5 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between group-hover:bg-white transition-all">
                      <div className="flex items-center gap-2">
                         <span className="material-symbols-outlined text-slate-400 text-sm">calendar_month</span>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                           {row.academy_care_year || row.academy_care_id}
                         </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/timetable?class_id=${row._id}`}
                          className="h-8 w-8 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-500 hover:border-blue-600 hover:text-blue-600 hover:shadow-sm transition-all"
                          title="Timetable"
                        >
                          <span className="material-symbols-outlined text-lg">calendar_month</span>
                        </Link>
                        <button
                          onClick={() => setEditingClass(row)}
                          className="group/btn h-8 px-4 rounded-lg bg-blue-600 text-[10px] font-black text-white uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center gap-2 shadow-sm active:scale-95"
                        >
                          Manage
                          <span className="material-symbols-outlined text-sm transition-transform group-hover/btn:translate-x-1">arrow_forward</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
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
        {isDrawerOpen && <div className="hidden lg:block w-[384px] flex-shrink-0 transition-all duration-500" />}
      </div>

      {/* Pagination Footer - Premium ERP Style */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Showing <span className="text-blue-600">1</span> to <span className="text-slate-900">{filteredRows.length}</span> of <span className="text-slate-900">{filteredRows.length}</span> Academic Units
        </p>
        <div className="flex items-center gap-2">
          <button className="h-9 px-4 rounded-xl border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-not-allowed flex items-center gap-2">
            <span className="material-symbols-outlined text-base">chevron_left</span>
            Previous
          </button>
          <div className="flex items-center gap-1">
            <button className="h-9 w-9 rounded-xl bg-blue-600 text-[10px] font-black text-white shadow-lg ">1</button>
          </div>
          <button className="h-9 px-4 rounded-xl border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-not-allowed flex items-center gap-2">
            Next
            <span className="material-symbols-outlined text-base">chevron_right</span>
          </button>
        </div>
      </div>

      <ClassEditSidebar
        isOpen={editingClass !== null}
        classItem={editingClass}
        academyCareOptions={academyCareOptions}
        teacherOptions={teacherOptions}
        subjectOptions={subjectOptions}
        onClose={() => setEditingClass(null)}
        onSave={async (id, data) => {
          setIsSaving(true);
          try {
            await updateClass(id, data as ClassFormInput);
            showToast("Class updated successfully");
            setEditingClass(null);
          } catch (err: any) {
            showToast(err.message || "Failed to update class");
          } finally {
            setIsSaving(false);
          }
        }}
        onAddSubject={async (name) => {
          await createSubject({ name, status: "active" });
        }}
        isSaving={isSaving}
      />

      <ConfirmModal
        isOpen={deletingClass !== null}
        title="Archive Academic Unit"
        message={`Are you sure you want to remove "${deletingClass?.name}"? This will disconnect all student associations and subject mappings for this cycle.`}
        confirmLabel="Remove Permanently"
        confirmVariant="danger"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeletingClass(null)}
      />
    </div>
  );
}

