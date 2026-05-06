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
    const [errors, setErrors] = useState<Record<string, string>>({});

    function validate() {
        const newErrors: Record<string, string> = {};
        if (!form.year.trim()) newErrors.year = "Academic year name is required";
        if (!form.start_date) newErrors.start_date = "Start date is required";
        if (!form.end_date) newErrors.end_date = "End date is required";
        if (form.start_date && form.end_date && new Date(form.start_date) >= new Date(form.end_date)) {
            newErrors.end_date = "End date must be after start date";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    const isValid = form.year.trim() && form.start_date && form.end_date;

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!validate()) return;
        setSaving(true);
        await onCreate(form);
        setForm(initialForm);
        setSaving(false);
        setErrors({});
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Input
                    label="Session Name"
                    placeholder="e.g., 2024-2025"
                    value={form.year}
                    onChange={(e) => setForm({ ...form, year: e.target.value })}
                    error={errors.year}
                    required
                    className="bg-white border-blue-100 focus:bg-white px-3 py-2"
                />

                <div className="flex flex-col gap-1.5">
                    <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-[0.1em]">Default Setting</span>
                    <label className={`flex items-center gap-2.5 h-[38px] px-3 border rounded-lg cursor-pointer transition-all duration-200 ${form.is_active ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'bg-blue-50/30 border-blue-100 text-slate-700 hover:border-blue-300'}`}>
                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${form.is_active ? 'border-white bg-white/20' : 'border-slate-300 bg-white'}`}>
                            {form.is_active && <span className="material-symbols-outlined text-white text-xs font-black">check</span>}
                        </div>
                        <input
                            type="checkbox"
                            checked={form.is_active}
                            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                            className="hidden"
                        />
                        <span className="text-xs font-semibold uppercase tracking-[0.08em]">Active Session</span>
                    </label>
                </div>

                <Input
                    label="Start Date"
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    error={errors.start_date}
                    required
                    className="bg-white border-blue-100 focus:bg-white px-3 py-2"
                />

                <Input
                    label="End Date"
                    type="date"
                    value={form.end_date}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                    error={errors.end_date}
                    required
                    className="bg-white border-blue-100 focus:bg-white px-3 py-2"
                />
            </div>

            <Input
                label="Description"
                placeholder="Short description..."
                value={form.description || ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="bg-white border-blue-100 focus:bg-white px-3 py-2"
            />

            <div className="sticky bottom-0 z-10 bg-white/95 backdrop-blur-sm border-t border-blue-100 pt-3 flex items-center justify-end">
                <Button
                    type="submit"
                    disabled={saving || !isValid}
                    className="w-full sm:w-auto px-6 py-2.5 h-auto text-[11px] font-semibold uppercase tracking-[0.12em] rounded-lg shadow-sm transition-all active:scale-[0.98]"
                >
                    {saving ? "Saving..." : "Create Session"}
                </Button>
            </div>
        </form>
    );
}
