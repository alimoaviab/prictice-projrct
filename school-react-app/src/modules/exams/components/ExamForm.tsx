import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Input, Select } from "@/components/ui";
import { ServiceResult } from "@/types/core";
import { serviceRequest } from "@/services/service-client";
import { ExamFormInput } from "../types/exam.types";

export function ExamForm({
  classes,
  onCreate,
  showFooter = true
}: {
  classes: any[];
  onCreate: (input: ExamFormInput) => Promise<ServiceResult<unknown>>;
  showFooter?: boolean;
}) {
    const [form, setForm] = useState<ExamFormInput>({
        academic_year_id: typeof window !== "undefined" ? window.localStorage.getItem("academic_year_id") || "" : "",
        class_id: "",
        subject: "",
        teacher_id: "",
        title: "",
        starts_at: "",
        max_marks: 100,
        status: "scheduled",
        description: ""
    });
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [classSubjectOptions, setClassSubjectOptions] = useState<Array<{ label: string; value: string }>>([]);
    const [loadingSubjects, setLoadingSubjects] = useState(false);

    const selectedClass = classes.find(c => c.id === form.class_id || c._id === form.class_id);
    const classTeacher = selectedClass?.class_teacher;

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
        if (!form.title.trim()) newErrors.title = "Exam title is required";
        if (!form.class_id.trim()) newErrors.class_id = "Class is required";
        if (!form.subject.trim()) newErrors.subject = "Subject is required";
        if (!form.starts_at) newErrors.starts_at = "Date is required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    const isValid = form.title.trim() && form.class_id && form.subject && form.starts_at;

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
                    teacher_id: "",
                    title: "",
                    starts_at: "",
                    max_marks: 100,
                    status: "scheduled",
                    description: ""
                });
            }
        } finally {
            setSaving(false);
        }
    }

    return (
        <form id="exam-form-quick" onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
                {/* Row 1: Class and Subject Selection */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    <div className="lg:col-span-6">
                        <Select
                            label="Target Class"
                            value={form.class_id}
                            onChange={(e) => {
                                const classId = e.target.value;
                                const cls = classes.find(c => c.id === classId || c._id === classId);
                                setForm({ 
                                    ...form, 
                                    class_id: classId, 
                                    subject: "", // Reset subject on class change
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

                    <div className="lg:col-span-6">
                        <Select
                            label="Class Subject"
                            value={form.subject}
                            onChange={(e) => setForm({ ...form, subject: e.target.value })}
                            options={[
                                { label: loadingSubjects ? "Loading subjects..." : "Select subject", value: "" },
                                ...availableSubjects
                            ]}
                            disabled={!form.class_id || loadingSubjects}
                            error={errors.subject}
                            required
                            className="bg-white border-slate-200 h-9.5 focus:border-slate-900 focus:ring-slate-900/5 transition-all text-sm"
                        />
                    </div>
                </div>

                {/* Row 2: Exam Title */}
                <div className="pt-1">
                    <Input
                        label="Examination Title"
                        placeholder="e.g., Mid-Term Mathematics Assessment"
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        error={errors.title}
                        required
                        leftIcon={<span className="material-symbols-outlined text-[16px]">title</span>}
                        className="bg-white border-slate-200 h-9.5 focus:border-slate-900 focus:ring-slate-900/5 transition-all text-sm"
                    />
                </div>

                {/* Row 3: Exam Date and Marks */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Input
                        label="Examination Date"
                        type="date"
                        value={form.starts_at}
                        onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                        error={errors.starts_at}
                        required
                        leftIcon={<span className="material-symbols-outlined text-[18px]">calendar_today</span>}
                        className="bg-white border-slate-200 h-9.5 focus:border-slate-900 focus:ring-slate-900/5 transition-all"
                    />

                    <Input
                        label="Maximum Possible Marks"
                        type="number"
                        min="1"
                        value={form.max_marks}
                        onChange={(e) => setForm({ ...form, max_marks: parseInt(e.target.value) || 100 })}
                        leftIcon={<span className="material-symbols-outlined text-[16px]">score</span>}
                        className="bg-white border-slate-200 h-9.5 focus:border-slate-900 focus:ring-slate-900/5 transition-all text-sm"
                    />
                </div>


                {/* Row 5: Description */}
                <div className="pt-1">
                    <label className="block text-[11px] font-bold text-slate-700 normal-case mb-2">
                        Exam Description & Instructions
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
                        to="/admin/exams"
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
                                Commit Exam Schedule
                            </>
                        )}
                    </Button>
                </div>
            )}
        </form>
    );
}
