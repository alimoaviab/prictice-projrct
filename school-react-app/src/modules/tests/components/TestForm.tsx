import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Input, Select } from "@/components/ui";
import { ServiceResult } from "@/types/core";
import { serviceRequest } from "@/services/service-client";
import { TestFormInput } from "../types/test.types";

export function TestForm({
  classes,
  onCreate,
  showFooter = true
}: {
  classes: any[];
  onCreate: (input: TestFormInput) => Promise<ServiceResult<unknown>>;
  showFooter?: boolean;
}) {
    const [form, setForm] = useState<TestFormInput>({
        academic_year_id: typeof window !== "undefined" ? window.localStorage.getItem("academic_year_id") || "" : "",
        class_id: "",
        subject: "",
        subjects: [],
        teacher_id: "",
        title: "",
        type: "test",
        starts_at: "",
        max_marks: 10,
        status: "scheduled",
        description: ""
    });
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [classSubjectOptions, setClassSubjectOptions] = useState<Array<{ label: string; value: string }>>([]);
    const [loadingSubjects, setLoadingSubjects] = useState(false);

    const selectedClass = classes.find(c => c.id === form.class_id || c._id === form.class_id);

    useEffect(() => {
        let cancelled = false;

        async function loadClassSubjects(classId: string) {
            if (!classId) {
                setClassSubjectOptions([]);
                return;
            }

            setLoadingSubjects(true);
            try {
                const result = await serviceRequest<{ subjects?: any[] }>(`/api/classes/${classId}/subjects`);
                if (!result.ok) {
                    throw new Error(result.error.message || "Failed to load class subjects");
                }

                const subjects = (result.data?.subjects ?? [])
                    .map((subject: any) => ({
                        label: subject.name || String(subject._id),
                        value: subject.name || String(subject._id)
                    }))
                    .filter((option: { label: string; value: string }) => Boolean(option.value));

                if (!cancelled) {
                    setClassSubjectOptions(subjects);
                }
            } catch {
                if (!cancelled) {
                    setClassSubjectOptions([]);
                }
            } finally {
                if (!cancelled) {
                    setLoadingSubjects(false);
                }
            }
        }

        void loadClassSubjects(form.class_id);

        return () => {
            cancelled = true;
        };
    }, [form.class_id]);

    const availableSubjects = classSubjectOptions.length > 0
        ? classSubjectOptions
        : (selectedClass?.subjects || []).map((s: any) => {
            if (typeof s === "string") {
                return { label: s, value: s };
            }

            const value = s.name || s.subject || s.id || s._id;
            return {
                label: s.name || String(value),
                value: String(value)
            };
        }).filter((option: any) => Boolean(option?.value));

    function validate() {
        const newErrors: Record<string, string> = {};
        if (!form.title.trim()) newErrors.title = "Test title is required";
        if (!form.class_id.trim()) newErrors.class_id = "Class is required";
        if ((form.subjects || []).length === 0) newErrors.subject = "At least one subject is required";
        if (!form.starts_at) newErrors.starts_at = "Date is required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    const isValid = form.title.trim() && form.class_id && (form.subjects || []).length > 0 && form.starts_at;

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!validate()) return;
        setSaving(true);
        try {
            const result = await onCreate(form);
            if (result.ok) {
                setForm({
                    academic_year_id: typeof window !== "undefined" ? window.localStorage.getItem("academic_year_id") || "" : "",
                    class_id: "",
                    subject: "",
                    subjects: [],
                    teacher_id: "",
                    title: "",
                    type: "test",
                    starts_at: "",
                    max_marks: 10,
                    status: "scheduled",
                    description: ""
                });
            }
        } finally {
            setSaving(false);
        }
    }

    return (
        <form id="test-form-quick" onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
                {/* Row 1: Class and Subject Selection */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    <div className="lg:col-span-12">
                        <Select
                            label="Target Class"
                            value={form.class_id}
                            onChange={(e) => {
                                const classId = e.target.value;
                                const cls = classes.find(c => c.id === classId || c._id === classId);
                                setForm({ 
                                    ...form, 
                                    class_id: classId, 
                                    subjects: [], // Reset subjects on class change
                                    teacher_id: cls?.class_teacher?.id || "" // Auto-assign class teacher
                                });
                            }}
                            options={[
                                { label: "Select target class", value: "" },
                                ...classes.map(o => ({ label: o.name, value: o.id || o._id }))
                            ]}
                            error={errors.class_id}
                            required
                            className="bg-white border-slate-200 h-9.5 focus:border-slate-900 focus:ring-slate-900/5 transition-all text-sm"
                        />
                    </div>

                    <div className="lg:col-span-12">
                        <label className="block text-[11px] font-bold text-slate-700 normal-case mb-3">
                            Class Subjects (Select all that apply)
                        </label>
                        {loadingSubjects ? (
                            <div className="flex items-center gap-2 text-slate-400 py-2">
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
                                <span className="text-xs">Loading class subjects...</span>
                            </div>
                        ) : availableSubjects.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                {availableSubjects.map((s: any) => (
                                    <label 
                                        key={s.value} 
                                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer group ${
                                            (form.subjects || []).includes(s.value) 
                                                ? "bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-900/10" 
                                                : "bg-white border-slate-100 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                                        }`}
                                    >
                                        <div className="relative flex items-center justify-center">
                                            <input
                                                type="checkbox"
                                                className="sr-only"
                                                checked={(form.subjects || []).includes(s.value)}
                                                onChange={() => {
                                                    const current = form.subjects || [];
                                                    if (current.includes(s.value)) {
                                                        setForm({ ...form, subjects: current.filter(id => id !== s.value) });
                                                    } else {
                                                        setForm({ ...form, subjects: [...current, s.value] });
                                                    }
                                                }}
                                            />
                                            <div className={`h-4 w-4 rounded-md border flex items-center justify-center transition-all ${
                                                (form.subjects || []).includes(s.value) 
                                                    ? "bg-white border-white text-slate-900" 
                                                    : "bg-slate-50 border-slate-200 text-transparent"
                                            }`}>
                                                <span className="material-symbols-outlined text-[12px] font-bold">check</span>
                                            </div>
                                        </div>
                                        <span className="text-[11px] font-bold truncate">{s.label}</span>
                                    </label>
                                ))}
                            </div>
                        ) : (
                            <div className="text-xs text-slate-400 py-2 italic">
                                No subjects found for this class.
                            </div>
                        )}
                        {errors.subject && <p className="mt-2 text-[10px] text-red-500 font-bold">{errors.subject}</p>}
                    </div>
                </div>

                {/* Row 2: Test Title */}
                <div className="pt-1">
                    <Input
                        label="Test Title"
                        placeholder="e.g., Weekly Class Test"
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        error={errors.title}
                        required
                        leftIcon={<span className="material-symbols-outlined text-[16px]">title</span>}
                        className="bg-white border-slate-200 h-9.5 focus:border-slate-900 focus:ring-slate-900/5 transition-all text-sm"
                    />
                </div>

                {/* Row 3: Test Date and Marks */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Input
                        label="Test Date"
                        type="date"
                        value={form.starts_at}
                        onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                        error={errors.starts_at}
                        required
                        leftIcon={<span className="material-symbols-outlined text-[18px]">calendar_today</span>}
                        className="bg-white border-slate-200 h-9.5 focus:border-slate-900 focus:ring-slate-900/5 transition-all"
                    />

                    <Input
                        label="Maximum Marks"
                        type="number"
                        min="1"
                        value={form.max_marks}
                        onChange={(e) => setForm({ ...form, max_marks: parseInt(e.target.value) || 10 })}
                        leftIcon={<span className="material-symbols-outlined text-[16px]">score</span>}
                        className="bg-white border-slate-200 h-9.5 focus:border-slate-900 focus:ring-slate-900/5 transition-all text-sm"
                    />
                </div>


                {/* Row 5: Description */}
                <div className="pt-1">
                    <label className="block text-[11px] font-bold text-slate-700 normal-case mb-2">
                        Test Description & Instructions
                    </label>
                    <textarea
                        placeholder="Add syllabus coverage or student instructions..."
                        value={form.description || ""}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        rows={3}
                        className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-800 outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all placeholder:text-slate-400"
                    />
                </div>
            </div>

            {/* Premium Action Row */}
            {showFooter && (
                <div className="-mx-6 -mb-6 mt-12 flex items-center justify-between border-t border-slate-100 bg-slate-50/40 px-8 py-4">
                    <Link
                        to="/admin/tests"
                        className="flex items-center gap-2 rounded-xl px-4 py-2 text-[10px] font-bold normal-case  text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-900"
                    >
                        Discard Changes
                    </Link>
                    <Button
                        type="submit"
                        disabled={saving || !isValid}
                        className="h-9.5 px-8 text-[10px] font-bold normal-case  shadow-xl shadow-slate-900/10 active:scale-[0.98] transition-all bg-slate-900 hover:bg-slate-800 text-white rounded-lg flex items-center gap-2"
                    >
                        {saving ? (
                            <>
                                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                Scheduling...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                                Commit Test Schedule
                            </>
                        )}
                    </Button>
                </div>
            )}
        </form>
    );
}
