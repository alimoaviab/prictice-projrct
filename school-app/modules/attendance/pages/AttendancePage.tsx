"use client";

import { Card, DataState, Skeleton, TableSkeleton } from "../../../components/ui";
import { useCallback, useEffect } from "react";
import { useSafeAsync } from "../../../hooks/useSafeAsync";
import { serviceRequest } from "../../../services/service-client";
import { AttendanceForm } from "../components/AttendanceForm";
import { AttendanceTable } from "../components/AttendanceTable";
import { useAttendance } from "../hooks/useAttendance";

export function AttendancePage() {
    const { state, addAttendance } = useAttendance();
    const { state: classState, run: runClasses } = useSafeAsync<Array<{ _id: string; name: string }>>();
    const { state: studentState, run: runStudents } = useSafeAsync<
        Array<{ _id: string; first_name: string; last_name: string; admission_no: string; class_id: string }>
    >();

    const loadClasses = useCallback(() => {
        return runClasses(async () => {
            const result = await serviceRequest<Array<{ _id: string; name: string }>>("/api/classes");
            if (!result.ok) {
                throw new Error(result.error.message || "Failed to load classes");
            }

            return result.data;
        });
    }, [runClasses]);

    const loadStudents = useCallback(() => {
        return runStudents(async () => {
            const result = await serviceRequest<
                Array<{ _id: string; first_name: string; last_name: string; admission_no: string; class_id: string }>
            >("/api/students");
            if (!result.ok) {
                throw new Error(result.error.message || "Failed to load students");
            }

            return result.data;
        });
    }, [runStudents]);

    useEffect(() => {
        void loadClasses().catch(() => {
            // Error state is already managed by useSafeAsync.
        });
        void loadStudents().catch(() => {
            // Error state is already managed by useSafeAsync.
        });
    }, [loadClasses, loadStudents]);

    const isDependencyLoading =
        classState.status === "idle" ||
        classState.status === "loading" ||
        studentState.status === "idle" ||
        studentState.status === "loading";

    const classOptions = (classState.data ?? []).map((item) => ({ id: item._id, label: item.name }));
    const studentOptions = (studentState.data ?? []).map((item) => ({
        id: item._id,
        class_id: item.class_id,
        label: `${item.admission_no} - ${item.first_name} ${item.last_name}`.trim()
    }));

    return (
        <div className="flex flex-col gap-8">
            <Card className="max-w-4xl">
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Mark Attendance</h2>
                    <p className="text-sm text-gray-500">Record daily attendance for students in their respective classes.</p>
                </div>
                {isDependencyLoading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <div className="grid grid-cols-2 gap-4">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    </div>
                ) : (
                    <AttendanceForm onCreate={addAttendance} classOptions={classOptions} studentOptions={studentOptions} />
                )}
            </Card>

            {classState.status === "error" ? (
                <DataState variant="error" title="Classes unavailable" message={classState.error} />
            ) : null}

            {studentState.status === "error" ? (
                <DataState variant="error" title="Students unavailable" message={studentState.error} />
            ) : null}

            {state.status === "loading" || state.status === "idle" ? (
                <div className="space-y-4">
                   <Skeleton className="h-8 w-48" />
                   <TableSkeleton />
                </div>
            ) : null}

            {state.status === "error" ? (
                <DataState variant="error" title="Failed to load attendance" message={state.error} />
            ) : null}

            {state.status === "empty" ? (
                <DataState variant="empty" title="No attendance records" message="Start marking attendance for your classes." />
            ) : null}

            {state.status === "success" && state.data && state.data.length > 0 ? (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-gray-900">Attendance Log</h3>
                        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                           {state.data.length} Records
                        </span>
                    </div>
                    <AttendanceTable rows={state.data} />
                </div>
            ) : null}
        </div>
    );
}
