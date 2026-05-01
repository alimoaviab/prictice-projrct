"use client";

import { useCallback, useEffect } from "react";
import { Card, DataState, Skeleton, TableSkeleton } from "../../../components/ui";
import { useSafeAsync } from "../../../hooks/useSafeAsync";
import { serviceRequest } from "../../../services/service-client";
import { StudentForm } from "../components/StudentForm";
import { StudentTable } from "../components/StudentTable";
import { useStudents } from "../hooks/useStudents";

export function StudentsPage() {
  const { state, addStudent } = useStudents();
  const { state: classState, run } = useSafeAsync<Array<{ _id: string; name: string }>>();

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
  const classOptions = (classState.data ?? []).map((item) => ({ id: item._id, label: item.name }));

  return (
    <div className="flex flex-col gap-8">
      <Card className="max-w-4xl">
        <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">Student Admission</h2>
            <p className="text-sm text-gray-500">Enter details to enroll a new student into the system.</p>
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

      {classState.status === "error" ? (
        <DataState variant="error" title="Failed to load classes" message={classState.error} />
      ) : null}

      {state.status === "loading" || state.status === "idle" ? (
        <div className="space-y-4">
           <Skeleton className="h-8 w-48" />
           <TableSkeleton />
        </div>
      ) : null}

      {state.status === "error" ? (
        <DataState variant="error" title="Failed to load students" message={state.error} />
      ) : null}

      {state.status === "empty" ? (
        <DataState variant="empty" title="No students found" message="Create the first student record for this school." />
      ) : null}

      {state.status === "success" && state.data && state.data.length > 0 ? (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Students Directory</h3>
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                   {state.data.length} Total
                </span>
            </div>
            <StudentTable students={state.data} />
        </div>
      ) : null}
    </div>
  );
}
