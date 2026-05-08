"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DataTable, DataTableColumn, RowAction, Badge, DataState, ListToolbar, Skeleton, TableSkeleton } from "../../../components/ui";
import { useStudents } from "../hooks/useStudents";
import { useClasses } from "../../classes/hooks/useClasses";
import { useSubjects } from "../../subjects/hooks/useSubjects";
import { StudentRow, StudentPatchInput } from "../types/student.types";
import { showToast } from "../../../utils/toast";
import { StudentEditSidebar } from "../components/StudentEditSidebar";

export function StudentListPage() {
  const { state, updateStudent, deleteStudent } = useStudents();
  const { state: classesState } = useClasses();
  const { data: subjectsData } = useSubjects();
  const [editingStudent, setEditingStudent] = useState<StudentRow | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const subjectOptions = subjectsData.map((subj) => ({ id: (subj as any)._id || (subj as any).id || subj.name, label: subj.name }));
  const classOptions = (classesState.data || []).map((cls) => ({
    id: cls._id,
    label: cls.name,
  }));

  const filteredRows = useMemo(() => {
    const rows = state.data || [];
    const q = searchQuery.trim().toLowerCase();
    return rows.filter((row) => {
      const queryMatch =
        q.length === 0 ||
        row.admission_no.toLowerCase().includes(q) ||
        `${row.first_name} ${row.last_name}`.toLowerCase().includes(q) ||
        (row.guardian?.name || "").toLowerCase().includes(q) ||
        (row.class_id || "").toLowerCase().includes(q);
      const statusMatch = statusFilter === "all" ? true : row.status === statusFilter;
      return queryMatch && statusMatch;
    });
  }, [state.data, searchQuery, statusFilter]);

  const columns: DataTableColumn<StudentRow>[] = [
    {
      key: "admission_no",
      label: "Admission No",
      render: (row) => <span className="font-mono text-xs text-gray-500">{row.admission_no}</span>,
    },
    {
      key: "name",
      label: "Name",
      render: (row) => <span className="font-semibold text-gray-900">{row.first_name} {row.last_name}</span>,
      sortable: true,
      sortFn: (a, b) => `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`),
    },
    {
      key: "class",
      label: "Class / Section",
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="text-gray-700">{row.class_id}</span>
          <Badge variant="secondary">{row.section}</Badge>
        </div>
      ),
    },
    {
      key: "guardian",
      label: "Guardian",
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-700">{row.guardian.name}</span>
          <span className="text-xs text-gray-400">{row.guardian.phone}</span>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <Badge variant={row.status === "active" ? "success" : "gray"} className="capitalize">
          {row.status}
        </Badge>
      ),
    },
  ];

  const rowActions: RowAction<StudentRow>[] = [
    {
      icon: "visibility",
      label: "View Details",
      variant: "primary",
      onClick: (row) => {
        alert(`Student: ${row.first_name} ${row.last_name}\nAdmission: ${row.admission_no}\nGuardian: ${row.guardian.name} (${row.guardian.phone})`);
      },
    },
    {
      icon: "edit",
      label: "Edit Student",
      variant: "ghost",
      onClick: async (row) => {
        const first_name = window.prompt("First name", row.first_name)?.trim();
        if (!first_name) {
          return;
        }
        const last_name = window.prompt("Last name", row.last_name)?.trim();
        if (!last_name) {
          return;
        }
        await updateStudent(row._id, { first_name, last_name });
      },
    },
    {
      icon: "delete",
      label: "Delete Student",
      variant: "danger",
      requireConfirm: true,
      confirmTitle: "Delete Student",
      confirmMessage: (row: StudentRow) => `Are you sure you want to delete ${row.first_name} ${row.last_name}?`,
      onClick: async (row) => {
        const result = await deleteStudent(row._id);
        if (!result.ok) {
          showToast(result.error.message || "Failed to delete student", "error");
        }
      },
    },
  ];

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
    return <DataState variant="error" title="Failed to load students" message={state.error} />;
  }

  return (
    <div className="space-y-8 relative min-h-[80vh] pb-10">
      {/* Stats Section - Premium ERP Style */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Students", value: (state.data || []).length, icon: "groups", color: "text-blue-600", bg: "bg-blue-600/5" },
          { label: "Active Enrollment", value: (state.data || []).filter(s => s.status === 'active').length, icon: "how_to_reg", color: "text-emerald-600", bg: "bg-emerald-600/5" },
          { label: "New Admissions", value: "24", icon: "person_add", color: "text-amber-600", bg: "bg-amber-600/5" },
          { label: "Diversity Index", value: "0.85", icon: "diversity_3", color: "text-purple-600", bg: "bg-purple-600/5" },
        ].map((stat, i) => (
          <div key={i} className="premium-card bg-white p-3.5 border-slate-200/60 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-all cursor-default">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <h3 className="text-xl font-black text-slate-900 tracking-tighter leading-none">{stat.value}</h3>
            </div>
            <div className={`h-8 w-8 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm`}>
               <span className="material-symbols-outlined text-lg font-black">{stat.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar Section - Unified & Sticky */}
      <div className="premium-card p-2 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white/80 backdrop-blur-md sticky top-[72px] z-20 border-slate-200/60 shadow-sm rounded-xl">
        <div className="flex flex-1 items-center gap-2 max-w-2xl">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg text-slate-400">search</span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, admission no or class..."
              className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-xs font-medium text-slate-700 outline-none transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-600/5 placeholder:text-slate-400"
            />
          </div>
          <div className="h-6 w-px bg-slate-200" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 outline-none cursor-pointer transition-all hover:border-slate-300 focus:border-blue-400"
          >
            <option value="all">Lifecycle: All</option>
            <option value="active">Active Only</option>
            <option value="inactive">Archived / Withdrawn</option>
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
          <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest px-2 whitespace-nowrap">
            {filteredRows.length} <span className="text-slate-400">STUDENTS</span>
          </span>
          <div className="h-6 w-px bg-slate-200" />
          <Link
            href="/admin/students/create"
            className="inline-flex h-9 items-center gap-2 px-5 text-[11px] font-black uppercase tracking-widest text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
          >
            <span className="material-symbols-outlined text-lg">person_add</span>
            Add Student
          </Link>
        </div>
      </div>

      {/* Main Content Area */}
      <div>
        {filteredRows.length === 0 ? (
          <DataState 
            variant="empty" 
            title="No Students Found" 
            message={searchQuery ? "Try refining your search parameters." : "Start by admitting your first student to the academy."} 
          />
        ) : (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredRows.map((row) => (
                <div key={row._id} className="premium-card group relative flex flex-col p-0 overflow-hidden transition-all duration-500 bg-white border-slate-200/60 hover:shadow-2xl hover:shadow-slate-200/80 hover:-translate-y-1">
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="h-12 w-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-sm font-black uppercase shadow-lg group-hover:scale-110 transition-transform">
                        {row.first_name.substring(0, 1)}{row.last_name.substring(0, 1)}
                      </div>
                      <div className="flex items-center gap-1 bg-slate-50/50 rounded-lg p-1 border border-slate-100">
                        <button 
                          onClick={() => setEditingStudent(row)}
                          className="h-7 w-7 flex items-center justify-center rounded text-slate-400 hover:bg-white hover:text-blue-600 hover:shadow-sm transition-all"
                        >
                          <span className="material-symbols-outlined text-base">edit</span>
                        </button>
                        <button 
                          onClick={async () => {
                            if (window.confirm(`Delete ${row.first_name}?`)) {
                              await deleteStudent(row._id);
                            }
                          }}
                          className="h-7 w-7 flex items-center justify-center rounded text-slate-400 hover:bg-white hover:text-red-500 hover:shadow-sm transition-all"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>
                    </div>

                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-black text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors truncate">{row.first_name} {row.last_name}</h3>
                        <Badge variant={row.status === "active" ? "success" : "gray"} className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0">
                          {row.status}
                        </Badge>
                      </div>
                      <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{row.admission_no}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className="bg-slate-50/50 rounded-xl p-2.5 border border-slate-100/50">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Academic Unit</p>
                        <p className="text-[10px] font-bold text-slate-700 truncate">{row.class_id} / {row.section}</p>
                      </div>
                      <div className="bg-slate-50/50 rounded-xl p-2.5 border border-slate-100/50">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Guardian</p>
                        <p className="text-[10px] font-bold text-slate-700 truncate">{row.guardian?.name || "—"}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                       <div className="flex items-center gap-2 text-slate-400">
                          <span className="material-symbols-outlined text-sm">call</span>
                          <span className="text-[10px] font-black uppercase tracking-widest">{row.guardian?.phone || "No Contact"}</span>
                       </div>
                    </div>
                  </div>
                  
                  <div className="mt-auto px-5 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between group-hover:bg-white transition-all">
                     <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 flex items-center gap-1 transition-colors">
                        <span className="material-symbols-outlined text-sm">assignment_ind</span>
                        Dossier
                     </button>
                     <button className="group/btn h-8 px-4 rounded-lg bg-blue-600 text-[10px] font-black text-white uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center gap-2 shadow-sm active:scale-95">
                        Profile
                        <span className="material-symbols-outlined text-sm transition-transform group-hover/btn:translate-x-1">arrow_forward</span>
                     </button>
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
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Showing <span className="text-blue-600">1</span> to <span className="text-slate-900">{filteredRows.length}</span> of <span className="text-slate-900">{state.data?.length}</span> Student Records
        </p>
        <div className="flex items-center gap-2">
          <button className="h-9 px-4 rounded-xl border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-not-allowed flex items-center gap-2">
            <span className="material-symbols-outlined text-base">chevron_left</span>
            Previous
          </button>
          <div className="flex items-center gap-1">
            <button className="h-9 w-9 rounded-xl bg-blue-600 text-[10px] font-black text-white shadow-lg shadow-blue-600/20">1</button>
          </div>
          <button className="h-9 px-4 rounded-xl border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-not-allowed flex items-center gap-2">
            Next
            <span className="material-symbols-outlined text-base">chevron_right</span>
          </button>
        </div>
      </div>


      <StudentEditSidebar
        student={editingStudent}
        isOpen={editingStudent !== null}
        classOptions={classOptions}
        subjectOptions={subjectOptions}
        onClose={() => setEditingStudent(null)}
        onSave={async (id, data) => {
          setIsSaving(true);
          try {
            await updateStudent(id, data as StudentPatchInput);
          } finally {
            setIsSaving(false);
          }
        }}
        isSaving={isSaving}
      />
    </div>
  );
}
