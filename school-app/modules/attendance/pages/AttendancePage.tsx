"use client";

import { colors, spacing, typography } from "@edu/shared/design-system/tokens";
import { useCallback, useEffect } from "react";
import { Card, DataState } from "../../../components/ui";
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
        <div style={{ display: "grid", gap: spacing.lg }}>
            {isDependencyLoading ? <DataState variant="loading" title="Loading attendance setup data" /> : null}

            {classState.status === "error" ? (
                <DataState variant="error" title="Classes unavailable" message={classState.error} />
            ) : null}

            {studentState.status === "error" ? (
                <DataState variant="error" title="Students unavailable" message={studentState.error} />
            ) : null}

            {!isDependencyLoading ? (
                <Card>
                    <AttendanceForm onCreate={addAttendance} classOptions={classOptions} studentOptions={studentOptions} />
                </Card>
            ) : null}

            {state.status === "loading" || state.status === "idle" ? (
                <DataState variant="loading" title="Loading attendance records" />
            ) : null}

            {state.status === "error" ? (
                <DataState variant="error" title="Failed to load attendance" message={state.error} />
            ) : null}

            {state.status === "empty" ? (
                <DataState variant="empty" title="No attendance records" message="Start marking attendance for your classes." />
            ) : null}

            {state.status === "success" && state.data && state.data.length > 0 ? (
                <Card style={{ padding: 0, overflow: "hidden", borderColor: colors.cardBorder }}>
                    <div style={{ padding: spacing.md, borderBottom: `1px solid ${colors.cardBorder}`, background: colors.surfaceContainerLowest }}>
                        <h2 style={{ ...typography.h3, margin: 0, color: colors.onSurface }}>Attendance Records</h2>
                    </div>
                    <div style={{ padding: spacing.md }}>
                        <AttendanceTable rows={state.data} />
                    </div>
                </Card>
            ) : null}
        </div>
    );
}
