"use client";

import { colors, spacing, typography } from "@edu/shared/design-system/tokens";
import { Card, DataState } from "../../../components/ui";
import { SettingsForm } from "../components/SettingsForm";
import { useSettings } from "../hooks/useSettings";

export function SettingsPage() {
    const { state, saveSettings } = useSettings();

    const profileCards = state.status === "success" && state.data ? [
        { label: "School", value: state.data.academy_name || "Not set" },
        { label: "Principal", value: state.data.principal_name || "Not set" },
        { label: "Contact", value: state.data.academy_phone || state.data.academy_email || "Not set" }
    ] : [];

    return (
        <div style={{ display: "grid", gap: spacing.lg }}>
            {state.status === "loading" || state.status === "idle" ? (
                <DataState variant="loading" title="Loading settings" />
            ) : null}

            {state.status === "error" ? (
                <DataState variant="error" title="Failed to load settings" message={state.error} />
            ) : null}

            {state.status === "success" && state.data ? (
                <>
                    <Card>
                        <SettingsForm initialValues={state.data} onSave={saveSettings} />
                    </Card>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: spacing.md }}>
                        {profileCards.map((item) => (
                            <Card key={item.label} style={{ display: "grid", gap: spacing.xs }}>
                                <span style={{ ...typography.labelMd, color: colors.onSurfaceVariant, textTransform: "uppercase" }}>{item.label}</span>
                                <strong style={{ ...typography.h3, color: colors.onSurface, margin: 0 }}>{item.value}</strong>
                            </Card>
                        ))}
                    </div>
                </>
            ) : null}
        </div>
    );
}
