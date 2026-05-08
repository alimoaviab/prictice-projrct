"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DataTable, DataTableColumn, RowAction, Badge, DataState, ListToolbar, Skeleton, TableSkeleton } from "../../../components/ui";
import { useClasses } from "../hooks/useClasses";
import { useAcademyCare } from "../../academyCare/hooks/useAcademyCare";
import { useTeachers } from "../../teachers/hooks/useTeachers";
import { ClassRow, ClassFormInput } from "../types/class.types";
import { showToast } from "../../../utils/toast";
import { ClassEditSidebar } from "../components/ClassEditSidebar";
import { generateTimetable } from "../../timetable/services/timetable.service";
import { useSafeAsync } from "../../../hooks/useSafeAsync";

export function ClassListPage() {
  const { state, updateClass, deleteClass } = useClasses();
  const { state: academyCareState } = useAcademyCare();
  const { state: teachersState } = useTeachers();
  const [editingClass, setEditingClass] = useState<ClassRow | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { state: generateState, run: runGenerate } = useSafeAsync<void>();
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

  const subjectOptions = [
    { id: "math", label: "Mathematics" },
    { id: "english", label: "English" },
    { id: "science", label: "Science" },
    { id: "social_studies", label: "Social Studies" },
    { id: "hindi", label: "Hindi" },
    { id: "sanskrit", label: "Sanskrit" },
    { id: "physical_education", label: "Physical Education" },
  ];

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

  const handleGenerateTimetable = async () => {
    await runGenerate(async () => {
      const result = await generateTimetable({
        startTime: "08:00",
        endTime: "16:00",
        slotDuration: 45,
      });

      if (!result.ok) {
        throw new Error(result.error.message || "Failed to generate timetable");
      }

      showToast(`Successfully generated ${result.data.generated} timetable entries`, "success");
    });
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
      label: "Class Name",
      render: (row) => <span className="font-semibold text-gray-900">{row.name}</span>,
      sortable: true,
      sortFn: (a, b) => a.name.localeCompare(b.name),
    },
    {
      key: "academic_year",
      label: "Academic Year",
      render: (row) => <span className="text-sm text-gray-600">{row.academy_care_year || row.academy_care_id}</span>,
    },
    {
      key: "room",
      label: "Room",
      render: (row) => <span className="text-sm text-gray-600">{row.room_number || "—"}</span>,
    },
    {
      key: "teachers",
      label: "Teachers",
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {(row.teacher_names || row.teacher_ids || []).slice(0, 2).map((t, i) => (
            <Badge key={i} variant="secondary" className="text-[10px]">{t}</Badge>
          ))}
          {(row.teacher_names || row.teacher_ids || []).length > 2 && (
            <Badge variant="secondary" className="text-[10px]">+{(row.teacher_names || row.teacher_ids || []).length - 2}</Badge>
          )}
        </div>
      ),
    },
    {
      key: "subjects",
      label: "Subjects",
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {(row.subjects || []).slice(0, 2).map((s, i) => (
            <Badge key={getSubjectKey(s, i)} variant="secondary" className="text-[10px]">
              {getSubjectLabel(s)}
            </Badge>
          ))}
          {(row.subjects || []).length > 2 && (
            <Badge variant="secondary" className="text-[10px]">+{(row.subjects || []).length - 2}</Badge>
          )}
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

  const rowActions: RowAction<ClassRow>[] = [
    {
      icon: "visibility",
      label: "View Details",
      variant: "primary",
      onClick: (row) => {
        alert(`Class: ${row.name}\nRoom: ${row.room_number || "N/A"}\nDescription: ${row.description || "No description"}`);
      },
    },
    {
      icon: "edit",
      label: "Edit Class",
      variant: "ghost",
      onClick: async (row) => {
        const room_number = window.prompt("Room number", row.room_number || "")?.trim() || "";
        const description = window.prompt("Description", row.description || "")?.trim() || "";
        await updateClass(row._id, { room_number, description });
      },
    },
    {
      icon: "delete",
      label: "Delete Class",
      variant: "danger",
      requireConfirm: true,
      confirmTitle: "Delete Class",
      confirmMessage: (row: ClassRow) => `Are you sure you want to delete ${row.name}?`,
      onClick: async (row) => {
        const result = await deleteClass(row._id);
        if (!result.ok) {
          showToast(result.error.message || "Failed to delete class", "error");
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
    return <DataState variant="error" title="Failed to load classes" message={state.error} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-slate-950">Classes</h2>
          <p className="text-sm text-slate-600">Manage all classrooms and sections</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleGenerateTimetable}
            disabled={generateState.status === "loading" || (state.data || []).length === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 rounded-xl transition-all hover:shadow-lg hover:shadow-green-600/25 active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-lg">
              {generateState.status === "loading" ? "hourglass_empty" : "auto_awesome"}
            </span>
            {generateState.status === "loading" ? "Generating..." : "Generate Timetables"}
          </button>
          <Link
            href="/admin/classes/create"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all hover:shadow-lg hover:shadow-blue-600/25 active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Add Class
          </Link>
        </div>
      </div>

      <ListToolbar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search class, year, teacher, subject"
        filterValue={statusFilter}
        onFilterChange={(value) => setStatusFilter(value as "all" | "active" | "inactive")}
        filterOptions={[
          { value: "all", label: "All statuses" },
          { value: "active", label: "Active" },
          { value: "inactive", label: "Inactive" },
        ]}
        rightSlot={
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-600">
              {filteredRows.length} visible
            </span>
            <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-0.5">
              <button
                onClick={() => setViewMode("grid")}
                className={`inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs font-semibold transition-all ${
                  viewMode === "grid" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">grid_view</span>
                Grid
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs font-semibold transition-all ${
                  viewMode === "list" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">view_list</span>
                List
              </button>
            </div>
          </div>
        }
      />

      {(state.data || []).length === 0 ? (
        <DataState variant="empty" title="No classes found" message="Get started by creating your first class." />
      ) : filteredRows.length === 0 ? (
        <DataState variant="empty" title="No matching classes" message="Try adjusting search or status filters." />
      ) : (
        viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRows.map((row) => (
            <div
              key={row._id}
              className="premium-card p-3.5"
            >
              <div className="mb-3">
                <h3 className="text-base font-semibold tracking-tight text-slate-950">{row.name}</h3>
                <p className="mt-1 text-sm text-slate-600">{row.description || "No description"}</p>
              </div>

              <div className="mb-4 space-y-2.5 text-sm">
                <div>
                  <span className="text-slate-500">Academic Year:</span>
                  <p className="font-medium text-slate-900">{row.academy_care_year || row.academy_care_id || "—"}</p>
                </div>
                <div>
                  <span className="text-slate-500">Room:</span>
                  <p className="font-medium text-slate-900">{row.room_number || "—"}</p>
                </div>
                <div>
                  <span className="text-slate-500">Status:</span>
                  <p className="font-medium capitalize text-slate-900">{row.status}</p>
                </div>
                {row.subjects && row.subjects.length > 0 && (
                  <div>
                    <span className="text-slate-500">Subjects:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(row.subjects || []).slice(0, 2).map((s, i) => (
                        <Badge key={getSubjectKey(s, i)} variant="secondary" className="text-[10px]">
                          {getSubjectLabel(s)}
                        </Badge>
                      ))}
                      {row.subjects.length > 2 && (
                        <Badge variant="secondary" className="text-[10px]">+{row.subjects.length - 2}</Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Link
                  href={`/admin/timetable?class_id=${row._id}`}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-50 px-2.5 py-1.5 text-xs font-semibold text-green-600 transition-colors hover:bg-green-100"
                >
                  <span className="material-symbols-outlined text-base">schedule</span>
                  Timetable
                </Link>
                <button
                  onClick={() => setEditingClass(row)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-100"
                >
                  <span className="material-symbols-outlined text-base">edit</span>
                  Edit
                </button>
                <button
                  onClick={async () => {
                    if (window.confirm(`Delete ${row.name}?`)) {
                      const result = await deleteClass(row._id);
                      if (!result.ok) {
                        showToast(result.error.message || "Failed to delete", "error");
                      }
                    }
                  }}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100"
                >
                  <span className="material-symbols-outlined text-base">delete</span>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
        ) : (
          <DataTable
            columns={columns}
            rows={filteredRows}
            rowKey={(row) => row._id}
            sortable
            paginated={10}
            rowActions={rowActions}
            emptyState={{
              title: "No classes found",
              description: "Adjust filters or add a class.",
              action: { label: "Add Class", href: "/admin/classes/create" },
            }}
          />
        )
      )}

      <ClassEditSidebar
        classItem={editingClass}
        isOpen={editingClass !== null}
        academyCareOptions={academyCareOptions}
        teacherOptions={teacherOptions}
        subjectOptions={subjectOptions}
        onClose={() => setEditingClass(null)}
        onSave={async (id, data) => {
          setIsSaving(true);
          try {
            await updateClass(id, data as ClassFormInput);
          } finally {
            setIsSaving(false);
          }
        }}
        isSaving={isSaving}
      />
    </div>
  );
}
