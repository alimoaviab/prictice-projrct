import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useQueryParams } from "@/hooks/useQueryParams";
import { DataTable, DataTableColumn, RowAction, Badge, DataState, ListToolbar, Skeleton, TableSkeleton, StatCardGrid, EntityCard, EntityGrid } from "@/components/ui";
import { useStudents } from "../hooks/useStudents";
import { useClasses } from "../../classes/hooks/useClasses";
import { useSubjects } from "../../subjects/hooks/useSubjects";
import { StudentRow } from "../types/student.types";
import { showToast } from "@/utils/toast";

export function StudentListPage() {
  const navigate = useNavigate();
  const { currentParams, updateQuery, withQuery } = useQueryParams();
  const classFilter = currentParams.get("class_id") || "";

  // Pass the class_id from the URL straight into the hook so the API
  // request is already scoped server-side (matters when the school has
  // thousands of students and we shouldn't fetch all of them).
  const { students, isLoading, isError, error, updateStudent, deleteStudent } = useStudents(
    classFilter ? { class_id: classFilter } : undefined
  );
  const { state: classesState } = useClasses();
  // subjects unused after sidebar removal but kept for ListToolbar parity
  // (not currently consumed; left out intentionally).
  const [searchQuery, setSearchQuery] = useState(currentParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">((currentParams.get("status") as any) || "all");
  const [viewMode, setViewMode] = useState<"grid" | "list">((currentParams.get("view") as any) || "grid");

  useEffect(() => {
    setSearchQuery(currentParams.get("search") || "");
    setStatusFilter((currentParams.get("status") as any) || "all");
    setViewMode((currentParams.get("view") as any) || "grid");
  }, [currentParams.toString()]);

  const classOptions = ((classesState.data as any)?.data || []).map((cls: any) => ({
    id: cls._id,
    label: cls.name,
  }));

  // Resolve a friendly class label for the "filtering by class" pill.
  const activeClass = classOptions.find((c: { id: string; label: string }) => c.id === classFilter);

  function goToEdit(id: string) {
    navigate(`/admin/students/edit/${id}`);
  }

  const filteredRows = useMemo(() => {
    const rows = students || [];
    const q = searchQuery.trim().toLowerCase();
    return rows.filter((row: StudentRow) => {
      const queryMatch =
        q.length === 0 ||
        row.admission_no.toLowerCase().includes(q) ||
        `${row.first_name} ${row.last_name}`.toLowerCase().includes(q) ||
        (row.guardian?.name || "").toLowerCase().includes(q) ||
        (row.class_id || "").toLowerCase().includes(q);
      const statusMatch = statusFilter === "all" ? true : row.status === statusFilter;
      return queryMatch && statusMatch;
    });
  }, [students, searchQuery, statusFilter]);

  const columns: DataTableColumn<StudentRow>[] = [
    {
      key: "admission_no",
      label: "Roll number",
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
      label: "Class / section",
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
        <Badge variant={row.status === "active" ? "success" : "gray"} className="normal-case">
          {row.status}
        </Badge>
      ),
    },
  ];

  const rowActions: RowAction<StudentRow>[] = [
    {
      icon: "visibility",
      label: "View",
      onClick: (row) => {
        alert(`Student: ${row.first_name} ${row.last_name}\nID: ${row.admission_no}\nGuardian: ${row.guardian.name} (${row.guardian.phone})`);
      },
    },
    {
      icon: "edit",
      label: "Edit student",
      variant: "ghost",
      onClick: (row) => goToEdit(row._id),
    },
    {
      icon: "delete",
      label: "Delete student",
      variant: "danger",
      requireConfirm: true,
      confirmTitle: "Delete student",
      confirmMessage: (row: StudentRow) => `Are you sure you want to delete ${row.first_name} ${row.last_name}?`,
      onClick: async (row) => {
        const result = await deleteStudent(row._id);
        if (!result.ok) {
          showToast(result.error.message || "Failed to delete student", "error");
        }
      },
    },
  ];

  if (isLoading) {
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

  if (isError) {
    return <DataState variant="error" title="Failed to load students" message={String(error)} />;
  }

  return (
    <div className="space-y-8 relative min-h-[80vh] pb-10">
      {/* Stats Section */}
      <StatCardGrid
        items={[
          { label: "Total students", value: (students || []).length, icon: "groups", accent: "blue" },
          { label: "Active students", value: (students || []).filter((s: StudentRow) => s.status === 'active').length, icon: "how_to_reg", accent: "emerald" },
          { label: "Inactive", value: (students || []).filter((s: StudentRow) => s.status !== 'active').length, icon: "person_off", accent: "amber" },
          { label: "Classes", value: new Set((students || []).map((s: StudentRow) => s.class_id)).size, icon: "door_front", accent: "purple" },
        ]}
      />

      {/* Active class filter chip — appears whenever ?class_id=... is in the URL.
          Lets the user see at a glance that the list is scoped, and one-click
          back to "all students". */}
      {classFilter && (
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 ring-1 ring-blue-900/5">
          <span className="material-symbols-outlined text-base text-blue-600">filter_alt</span>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Filtering by class
          </span>
          <span className="text-[12px] font-bold text-blue-700">
            {activeClass?.label || classFilter}
          </span>
          <span className="ml-auto text-[11px] font-medium text-slate-500">
            {(students || []).length} student{(students || []).length === 1 ? "" : "s"}
          </span>
          <button
            type="button"
            onClick={() => updateQuery({ class_id: "" })}
            className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg bg-white border border-blue-200 text-[11px] font-bold text-blue-700 hover:bg-blue-100 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">close</span>
            Show all
          </button>
        </div>
      )}

      {/* Toolbar Section - Unified & Sticky */}
      <div className="premium-card p-2 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white/80 backdrop-blur-md border-slate-200/60 shadow-sm rounded-xl">
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
              placeholder="Search name, admission no or class..."
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
            <option value="all">Status: All</option>
            <option value="active">Active only</option>
            <option value="inactive">Archived</option>
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
            {filteredRows.length} <span className="text-slate-400">records</span>
          </span>
          <div className="h-6 w-px bg-slate-200" />
          <Link
            to={withQuery("/admin/students/create")}
            className="inline-flex h-9 items-center gap-2 px-5 text-[11px] font-bold normal-case  text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
          >
            <span className="material-symbols-outlined text-lg">person_add</span>
            Add student
          </Link>
        </div>
      </div>

      {/* Main Content Area */}
      <div>
        {filteredRows.length === 0 ? (
          <DataState 
            variant="empty" 
            title="No students found" 
            message={searchQuery ? "Try refining your search parameters." : "Start by adding your first student."} 
          />
        ) : (
          viewMode === "grid" ? (
            <EntityGrid>
              {filteredRows.map((row: StudentRow) => {
                const accent = row.status === "active" ? "blue" : "slate";
                return (
                  <EntityCard
                    key={row._id}
                    icon="person"
                    accent={accent}
                    title={`${row.first_name} ${row.last_name}`}
                    subtitle={`ID: ${row.admission_no}`}
                    status={{
                      label: row.status === "active" ? "Active" : "Inactive",
                      accent: row.status === "active" ? "blue" : "slate",
                    }}
                    hoverActions={[
                      {
                        label: "View details",
                        icon: "visibility",
                        onClick: () => {
                          alert(`Student: ${row.first_name} ${row.last_name}\nID: ${row.admission_no}\nGuardian: ${row.guardian.name} (${row.guardian.phone})`);
                        },
                        accent: "blue",
                      },
                      {
                        label: "Edit student",
                        icon: "edit",
                        onClick: () => goToEdit(row._id),
                        accent: "blue",
                      },
                      {
                        label: "Delete student",
                        icon: "delete",
                        onClick: async () => {
                          if (window.confirm(`Are you sure you want to delete ${row.first_name}?`)) {
                            await deleteStudent(row._id);
                          }
                        },
                        accent: "rose",
                      },
                    ]}
                    metrics={[
                      { label: "Class", value: row.class_id },
                      { label: "Section", value: row.section || "General" },
                    ]}
                  >
                    <div className="space-y-2 mt-2">
                      <div className="px-0.5">
                        <p className="text-[8px] font-bold text-slate-400 normal-case mb-1">Contact</p>
                        <p className="text-[10px] font-medium text-slate-500 line-clamp-1 leading-relaxed">
                          {row.guardian?.name || "No guardian"} • {row.guardian?.phone || "No phone"}
                        </p>
                      </div>

                      <div className="flex items-center justify-between bg-slate-50/30 rounded-lg p-1.5 border border-slate-100/30">
                        <div className="flex items-center gap-1.5">
                          {row.status === 'active' ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold normal-case text-blue-600 bg-blue-50">
                              <span className="h-1 w-1 rounded-full bg-blue-500 animate-pulse" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold normal-case text-slate-400 bg-slate-100">
                              Inactive
                            </span>
                          )}
                        </div>
                        <label className="relative inline-flex cursor-pointer items-center shrink-0">
                          <input
                            type="checkbox"
                            checked={row.status === 'active'}
                            onChange={async () => {
                              const nextStatus = row.status === 'active' ? 'inactive' : 'active';
                              await updateStudent(row._id, { status: nextStatus });
                            }}
                            className="peer sr-only"
                          />
                          <div className="peer h-[18px] w-[34px] rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-[14px] after:w-[14px] after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-[16px] peer-focus:outline-none" />
                        </label>
                      </div>
                    </div>
                  </EntityCard>
                );
              })}
            </EntityGrid>
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
          Showing <span className="text-blue-600">1</span> to <span className="text-slate-900">{filteredRows.length}</span> of <span className="text-slate-900">{students?.length}</span> records
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
