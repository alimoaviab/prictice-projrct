"use client";

import { colors, spacing, typography } from "@edu/shared/design-system/tokens";
import { Card, DataState } from "../../../components/ui";
import { SchoolForm } from "../components/SchoolForm";
import { SchoolTable } from "../components/SchoolTable";
import { useSchools } from "../hooks/useSchools";

export function SchoolsPage() {
  const { state, create, setBlocked } = useSchools();

  return (
    <div style={{ display: "grid", gap: spacing.md }}>
      <Card>
        <h2 style={{ ...typography.h2, marginTop: 0 }}>Schools</h2>
        <SchoolForm onCreate={create} />
      </Card>

      {state.status === "idle" || state.status === "loading" ? (
        <DataState variant="loading" title="Loading schools" />
      ) : null}

      {state.status === "error" ? (
        <DataState variant="error" title="Schools unavailable" message={state.error} />
      ) : null}

      {state.status === "empty" ? (
        <DataState variant="empty" title="No schools found" message="Create the first tenant to begin onboarding." />
      ) : null}

      {state.status === "success" ? (
        <Card style={{ padding: 0, overflow: "hidden", borderColor: colors.cardBorder }}>
          <SchoolTable schools={state.data} onBlock={setBlocked} />
        </Card>
      ) : null}
    </div>
  );
}
