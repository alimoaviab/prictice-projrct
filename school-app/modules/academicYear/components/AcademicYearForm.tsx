"use client";

import { FormEvent, useState } from "react";
import { Button, Input } from "../../../components/ui";
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
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                    label="Academic Year Name"
                    placeholder="e.g., 2024-2025"
                    value={form.year}
                    onChange={(e) => setForm({ ...form, year: e.target.value })}
                    required
                />

                <div className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-gray-700">Status</span>
                    <label className="flex items-center gap-3 h-10 px-4 border border-border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                        <input
                            type="checkbox"
                            checked={form.is_active}
                            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                        />
                        <span className="text-sm text-gray-600">Set as Active Year</span>
                    </label>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

            <Input
                label="Description (Optional)"
                placeholder="Add notes about this academic year..."
                value={form.description || ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
            />

            <div className="flex justify-end pt-2">
                <Button
                    type="submit"
                    disabled={saving}
                    className="w-full md:w-auto min-w-[200px]"
                >
                    {saving ? (
                        <span className="flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            Creating...
                        </span>
                    ) : "Create Academic Year"}
                </Button>
            </div>
        </form>
    );
}
