"use client";

import { FormEvent, useState, useEffect, useRef } from "react";
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
    const yearInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        yearInputRef.current?.focus();
    }, []);

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
        <form onSubmit={handleSubmit} className="space-y-8 pb-24">
            {/* Basic Information Section */}
            <div className="space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <span className="material-symbols-outlined text-gray-400 text-lg">info</span>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Basic Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                        ref={yearInputRef}
                        label="Academic Year Name"
                        placeholder="e.g., 2024-2025"
                        helperText="Enter a descriptive name for the academic session"
                        value={form.year}
                        onChange={(e) => setForm({ ...form, year: e.target.value })}
                        error={errors.year}
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
            </div>

            {/* Duration Section */}
            <div className="space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <span className="material-symbols-outlined text-gray-400 text-lg">calendar_today</span>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Duration</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                        label="Start Date"
                        type="date"
                        helperText="When does this academic year begin?"
                        value={form.start_date}
                        onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                        error={errors.start_date}
                        required
                    />

                    <Input
                        label="End Date"
                        type="date"
                        helperText="When does this academic year end?"
                        value={form.end_date}
                        onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                        error={errors.end_date}
                        required
                    />
                </div>
            </div>

            {/* Additional Details Section */}
            <div className="space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <span className="material-symbols-outlined text-gray-400 text-lg">notes</span>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Additional Details</h3>
                </div>
                <Input
                    label="Description"
                    placeholder="Add notes about this academic year..."
                    helperText="Optional: Add any relevant details or notes"
                    value={form.description || ""}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
            </div>

            {/* Sticky Submit Button */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-gray-200 py-4 px-6 z-30">
                <div className="max-w-4xl mx-auto flex justify-end">
                    <Button
                        type="submit"
                        disabled={saving || !isValid}
                        className="w-full md:w-auto min-w-[200px]"
                    >
                        {saving ? (
                            <span className="flex items-center gap-2">
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                Creating...
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-lg">add</span>
                                Create Academic Year
                            </span>
                        )}
                    </Button>
                </div>
            </div>
        </form>
    );
}
