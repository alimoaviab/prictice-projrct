"use client";

import { FormEvent, useState } from "react";
import { spacing } from "@edu/shared/design-system/tokens";
import { Button, Input } from "../../../components/ui";
import { SchoolFormInput } from "../types/school.types";

const initialForm: SchoolFormInput = {
  school_id: "",
  name: "",
  code: "",
  domains: [],
  plan: {
    key: "starter",
    seats: 0
  }
};

export function SchoolForm({ onCreate }: { onCreate: (input: SchoolFormInput) => Promise<unknown> }) {
  const [form, setForm] = useState<SchoolFormInput>(initialForm);
  const [domainText, setDomainText] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    await onCreate({
      ...form,
      domains: domainText
        .split(",")
        .map((domain) => domain.trim())
        .filter(Boolean)
    });
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: spacing.md }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: spacing.md }}>
        <Input
          label="School Id"
          name="school_id"
          value={form.school_id}
          onChange={(event) => setForm({ ...form, school_id: event.target.value })}
        />
        <Input
          label="Code"
          name="code"
          value={form.code}
          onChange={(event) => setForm({ ...form, code: event.target.value })}
        />
        <Input
          label="Name"
          name="name"
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
        />
        <Input
          label="Domains"
          name="domains"
          value={domainText}
          onChange={(event) => setDomainText(event.target.value)}
        />
        <Input
          label="Plan"
          name="plan"
          value={form.plan?.key ?? "starter"}
          onChange={(event) =>
            setForm({
              ...form,
              plan: {
                key: event.target.value,
                seats: form.plan?.seats ?? 0,
                expires_at: form.plan?.expires_at
              }
            })
          }
        />
        <Input
          label="Seats"
          name="seats"
          type="number"
          value={form.plan?.seats ?? 0}
          onChange={(event) =>
            setForm({
              ...form,
              plan: {
                key: form.plan?.key ?? "starter",
                seats: Number(event.target.value),
                expires_at: form.plan?.expires_at
              }
            })
          }
        />
      </div>
      <div>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving" : "Create School"}
        </Button>
      </div>
    </form>
  );
}
