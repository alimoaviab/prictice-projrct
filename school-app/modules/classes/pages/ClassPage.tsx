"use client";

import { colors, spacing, typography } from "@edu/shared/design-system/tokens";
import { Card, DataState } from "../../../components/ui";
import { useAcademicYears } from "../../academicYear/hooks/useAcademicYears";
import { useTeachers } from "../../teachers/hooks/useTeachers";
import { ClassForm } from "../components/ClassForm";
import { ClassTable } from "../components/ClassTable";
import { useClasses } from "../hooks/useClasses";

export function ClassPage() {
    const { state, addClass } = useClasses();
    const { state: academicYearState } = useAcademicYears();
    const { state: teacherState } = useTeachers();

    return (
        <div style={{ display: "grid", gap: spacing.lg }}>
            <Card>
                <ClassForm
                    onCreate={addClass}
                    academyCareOptions={(academicYearState.data ?? []).map((item) => ({
                        id: item._id,
                        label: item.year
                    }))}
                    teacherOptions={(teacherState.data ?? []).map((item) => ({
                        id: item._id,
                        label: `${item.first_name} ${item.last_name}`.trim()
                    }))}
                />
            </Card>

            {state.status === "loading" || state.status === "idle" ? (
                <DataState variant="loading" title="Loading classes" />
            ) : null}

            {state.status === "error" ? (
                <DataState variant="error" title="Failed to load classes" message={state.error} />
            ) : null}

            {state.status === "empty" ? (
                <DataState variant="empty" title="No classes created" message="Create your first class to begin." />
            ) : null}

            {state.status === "success" && state.data && state.data.length > 0 ? (
                <Card style={{ padding: 0, overflow: "hidden", borderColor: colors.cardBorder }}>
                    <div style={{ padding: spacing.md, borderBottom: `1px solid ${colors.cardBorder}`, background: colors.surfaceContainerLowest }}>
                        <h2 style={{ ...typography.h3, margin: 0, color: colors.onSurface }}>Classes</h2>
                    </div>
                    <div style={{ padding: spacing.md }}>
                        <ClassTable rows={state.data} />
                    </div>
                </Card>
            ) : null}
        </div>
    );
}
