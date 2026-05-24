import { AppIcon } from "shared/ui/AppIcon";
import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Input } from "@/components/ui";
import { AcademicYearFormInput } from "../types/academicYear.types";

const initialForm: AcademicYearFormInput = {
    year: "",
    start_date: "",
    end_date: "",
    is_active: false,
    description: ""
};

export function AcademicYearForm({ 
    onCreate,
    initialData,
    showFooter = true 
}: { 
    onCreate: (input: AcademicYearFormInput) => Promise<unknown>,
    initialData?: Partial<AcademicYearFormInput>,
    showFooter?: boolean
}) {
    const [form, setForm] = useState<AcademicYearFormInput>({
        year: initialData?.year || "",
        start_date: initialData?.start_date ? new Date(initialData.start_date).toISOString().split('T')[0] : "",
        end_date: initialData?.end_date ? new Date(initialData.end_date).toISOString().split('T')[0] : "",
        is_active: initialData?.is_active || false,
        description: initialData?.description || ""
    });
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    function validate() {
        const newErrors: Record<string, string> = {};
        if (!form.year.trim()) newErrors.year = "Session name is required";
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
        if (!initialData) setForm(initialForm);
        setSaving(false);
        setErrors({});
    }

    return (
        <form id="academic-year-form-quick" onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-7">
                {/* Section 1: Identity & Status */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
                    <div className="lg:col-span-8">
                        <Input
                            label="Academic Session Name"
                            placeholder="e.g., Session 2025-26"
                            value={form.year}
                            onChange={(e) => setForm({ ...form, year: e.target.value })}
                            error={errors.year}
                            required
                            leftIcon={<AppIcon name="Award" size={18} />}
                            className="bg-white border-slate-200 h-11 focus:border-blue-600 focus:ring-blue-600/5 transition-all text-[13px] font-medium"
                        />
                    </div>

                    <div className="lg:col-span-4">
                        <div className="flex items-center justify-between px-4 h-12 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-blue-200 transition-all group cursor-pointer shadow-sm" onClick={() => setForm({ ...form, is_active: !form.is_active })}>
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] font-bold text-slate-900 uppercase tracking-tight leading-none">Current Active</span>
                                <span className="text-[9px] font-medium text-slate-500 normal-case">Mark as system default</span>
                            </div>
                            <div className="relative inline-flex items-center">
                                <div 
                                    className={`w-10 h-5.5 rounded-full transition-colors duration-300 ease-in-out ${form.is_active ? 'bg-blue-600 shadow-inner' : 'bg-slate-200'}`}
                                />
                                <div 
                                    className={`absolute left-0.5 top-0.5 h-4.5 w-4.5 rounded-full bg-white shadow-md transition-transform duration-300 ease-in-out ${form.is_active ? 'translate-x-4.5' : 'translate-x-0'}`}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 2: Timeline Configuration */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                        label="Session Start Date"
                        type="date"
                        value={form.start_date}
                        onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                        error={errors.start_date}
                        required
                        leftIcon={<AppIcon name="Calendar" size={18} />}
                        className="bg-white border-slate-200 h-11 focus:border-blue-600 focus:ring-blue-600/5 transition-all text-[13px] font-medium"
                    />

                    <Input
                        label="Session End Date"
                        type="date"
                        value={form.end_date}
                        onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                        error={errors.end_date}
                        required
                        leftIcon={<AppIcon name="CalendarX" size={18} />}
                        className="bg-white border-slate-200 h-11 focus:border-blue-600 focus:ring-blue-600/5 transition-all text-[13px] font-medium"
                    />
                </div>

                {/* Section 3: Contextual Narrative */}
                <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 normal-case px-1">
                        Administrative Notes (Optional)
                    </label>
                    <div className="relative">
                        <AppIcon name="StickyNote" size={18} className="absolute left-3.5 top-3.5 text-slate-400" />
                        <textarea
                            placeholder="Add details regarding academic holidays, term breaks, or specific cycle goals..."
                            value={form.description || ""}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            className="w-full min-h-[100px] rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-3 text-[13px] font-medium text-slate-700 outline-none transition-all focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 placeholder:text-slate-400 resize-none"
                        />
                    </div>
                </div>
            </div>

            {/* Premium Footer with Contextual Actions */}
            {showFooter && (
                <div className="-mx-6 -mb-6 mt-12 flex items-center justify-between border-t border-slate-100 bg-slate-50/40 px-8 py-5">
                    <Link
                        to="/admin/academic-years"
                        className="flex items-center gap-2 rounded-xl px-4 py-2 text-[11px] font-bold text-slate-400 transition-all hover:bg-white hover:text-slate-900 hover:shadow-sm"
                    >
                        Discard Changes
                    </Link>
                    <Button
                        type="submit"
                        disabled={saving || !isValid}
                        className="h-11 px-8 text-[11px] font-bold uppercase tracking-widest shadow-xl shadow-blue-600/20 active:scale-[0.98] transition-all bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center gap-2"
                    >
                        {saving && (
                            <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        )}
                        {initialData ? "Update Session" : "Deploy Session"}
                    </Button>
                </div>
            )}
        </form>
    );
}
