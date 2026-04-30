"use client";

import { colors, spacing, typography } from "@edu/shared/design-system/tokens";
import { Card, DataState } from "../../../components/ui";
import { AcademicYearForm } from "../components/AcademicYearForm";
import { AcademicYearTable } from "../components/AcademicYearTable";
import { useAcademicYears } from "../hooks/useAcademicYears";

export function AcademicYearPage() {
    const { state, addAcademicYear } = useAcademicYears();

    return (
        <div style={{ display: "grid", gap: spacing.md }}>
            <Card>
                <h2 style={{ ...typography.h2, marginTop: 0, color: colors.onSurface }}>Create Academic Year</h2>
                <AcademicYearForm onCreate={addAcademicYear} />
            </Card>

            {state.status === "loading" || state.status === "idle" ? (
                <DataState variant="loading" title="Loading academic years" />
            ) : null}

            {state.status === "error" ? (
                <DataState variant="error" title="Academic years unavailable" message={state.error} />
            ) : null}

            {state.status === "empty" ? (
                <DataState variant="empty" title="No academic years found" message="Create the first academic year for this school." />
            ) : null}

            {state.status === "success" && state.data && state.data.length > 0 ? (
                <Card style={{ padding: 0, overflow: "auto", borderColor: colors.cardBorder }}>
                    <div style={{ padding: spacing.md, borderBottom: `1px solid ${colors.cardBorder}` }}>
                        <h3 style={{ ...typography.h3, margin: 0, color: colors.onSurface }}>Academic Years</h3>
                    </div>
                    <AcademicYearTable years={state.data} />
                </Card>
            ) : null}
        </div>
    );
}
