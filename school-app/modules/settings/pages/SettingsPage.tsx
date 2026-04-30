"use client";

import { colors, spacing, typography } from "@edu/shared/design-system/tokens";
import { Card, DataState } from "../../../components/ui";
import { SettingsForm } from "../components/SettingsForm";
import { useSettings } from "../hooks/useSettings";

export function SettingsPage() {
    const { state, saveSettings } = useSettings();

    return (
        <div style={{ display: "grid", gap: spacing.lg }}>
            {state.status === "loading" || state.status === "idle" ? (
                <DataState variant="loading" title="Loading settings" />
            ) : null}

            {state.status === "error" ? (
                <DataState variant="error" title="Failed to load settings" message={state.error} />
            ) : null}

            {state.status === "success" && state.data ? (
                <Card>
                    <SettingsForm initialValues={state.data} onSave={saveSettings} />
                </Card>
            ) : null}
        </div>
    );
}
