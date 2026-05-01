"use client";

import { FormEvent, useState } from "react";
import { Button, Input } from "../../../components/ui";
import { AcademyYearFormInput } from "../types/academyCare.types";

export function AcademyCareForm({ onCreate }: { onCreate: (input: AcademyYearFormInput) => Promise<unknown> }) {
    const [form, setForm] = useState<AcademyYearFormInput>({
        year: "",
        start_date: "",
        end_date: "",
        is_active: false
    });
    const [saving, setSaving] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSaving(true);
        await onCreate(form);
        setForm({ year: "", start_date: "", end_date: "", is_active: false });
        setSaving(false);
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Input
                    label="Year Name"
                    placeholder="e.g. 2024-2025"
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

                <Input
                    label="End Date"
                    type="date"
                    value={form.end_date}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                    required
                />
            </div>

            <div className="flex justify-end pt-4 border-t border-border">
                <Button
                    type="submit"
                    disabled={saving}
                    className="w-full md:w-auto min-w-[150px]"
                >
                    {saving ? "Creating..." : "Add Session"}
                </Button>
            </div>
        </form>
    );
}
