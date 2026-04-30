"use client";

import { FormEvent, useState } from "react";
import { Button, Input } from "../../../components/ui";
import { spacing, colors } from "@edu/shared/design-system/tokens";
import { AcademicYearFormInput } from "../types/academicYear.types";

const initialForm: AcademicYearFormInput = {
    year: "",
    start_date: "",
    end_date: "",
    is_active: false,
    description: ""
};

export function AcademicYearForm({ onCreate }: { onCreate: (input: AcademicYearFormInput) => Promise<unknown> }) {
    const [form, setForm] = useState<AcademicYearFormInput>(initialForm);
    const [saving, setSaving] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSaving(true);
        await onCreate(form);
        setForm(initialForm);
        setSaving(false);
    }

    return (
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: spacing.md }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: spacing.md }}>
                <Input
                    label="Academic Year"
                    placeholder="e.g., 2024-2025"
                    value={form.year}
                    onChange={(e) => setForm({ ...form, year: e.target.value })}
                    required
                />

                <Input
                    label="Start Date"
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    required
                />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: spacing.md }}>
                <Input
                    label="End Date"
                    type="date"
                    value={form.end_date}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                    required
                />

                <div style={{ display: "flex", alignItems: "flex-end", gap: spacing.sm }}>
                    <label style={{ display: "flex", alignItems: "center", gap: spacing.xs }}>
                        <input
                            type="checkbox"
                            checked={form.is_active}
                            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                            style={{ width: "20px", height: "20px", cursor: "pointer" }}
                        />
                        <span style={{ fontSize: "14px", color: colors.onSurface }}>Set as Active</span>
                    </label>
                </div>
            </div>

            <Input
                label="Description (Optional)"
                placeholder="Add notes about this academic year"
                value={form.description || ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
            />

            <Button
                type="submit"
                disabled={saving}
                style={{
                    background: colors.actionBlue,
                    color: "white",
                    padding: `${spacing.md}px`,
                    marginTop: spacing.md
                }}
            >
                {saving ? "Creating..." : "Create Academic Year"}
            </Button>
        </form>
    );
}
