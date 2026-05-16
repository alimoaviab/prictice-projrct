import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, DataState, ListToolbar, Skeleton, TableSkeleton } from "@/components/ui";
import { useSafeAsync } from "@/hooks/useSafeAsync";
import { serviceRequest } from "@/services/service-client";
import { StudentForm } from "../components/StudentForm";
import { StudentTable } from "../components/StudentTable";
import { useStudents } from "../hooks/useStudents";

export function StudentsPage() {
  const { students, isLoading, isError, error, addStudent } = useStudents();
  const { state: classState, run } = useSafeAsync<Array<{ _id: string; name: string }>>();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const loadClasses = useCallback(() => {
    return run(async () => {
      const result = await serviceRequest<Array<{ _id: string; name: string }>>("/api/classes");
      if (!result.ok) {
        throw new Error(result.error.message || "Failed to load classes");
      }

      return result.data;
    });
  }, [run]);

  useEffect(() => {
    void loadClasses().catch(() => {
      // Error state is already managed by useSafeAsync.
    });
  }, [loadClasses]);

  const isClassDependencyLoading = classState.status === "idle" || classState.status === "loading";
  const classes = Array.isArray(classState.data) ? classState.data : (classState.data as any)?.data || (classState.data as any)?.items || [];
  const classOptions = classes.map((item: any) => ({ id: item._id, label: item.name }));

  const filteredStudents = useMemo(() => {
    const rows = students ?? [];
    const q = searchQuery.trim().toLowerCase();
    return rows.filter((row: any) => {
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

  return (
    <div className="flex flex-col gap-4">
      <Card className="max-w-4xl">
        <div className="mb-4">
            <h2 className="text-lg font-semibold tracking-tight text-slate-950">Student Admission</h2>
            <p className="text-sm text-slate-600">Enter details to enroll a new student into the system.</p>
        </div>
        {isClassDependencyLoading ? (
            <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </div>
        ) : (
            <StudentForm onCreate={addStudent} classOptions={classOptions} />
        )}
      </Card>

      {isError ? (
        <DataState variant="error" title="Failed to load students" message={String(error)} />
      ) : null}

      {!isLoading && !isError && students && students.length === 0 ? (
        <DataState variant="empty" title="No students found" message="Create the first student record for this school." />
      ) : null}

      {!isLoading && !isError && students && students.length > 0 ? (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold tracking-tight text-slate-950">Students Directory</h3>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold normal-case tracking-[0.08em] text-slate-600">
                   {filteredStudents.length} visible
                </span>
            </div>

            <ListToolbar
              searchValue={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder="Search name, admission no, guardian, class"
              filterValue={statusFilter}
              onFilterChange={(value) => setStatusFilter(value as "all" | "active" | "inactive")}
              filterOptions={[
                { value: "all", label: "All statuses" },
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
              ]}
            />

            <StudentTable students={filteredStudents} />
        </div>
      ) : null}
    </div>
  );
}
