"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Button, Input, Select } from "../../../components/ui";
import { ClassFormInput } from "../types/class.types";

const initialForm: ClassFormInput = {
    name: "",
    academy_care_id: "",
    teacher_ids: [],
    subjects: [""],
    room_number: "",
    description: ""
};

export function ClassForm({
    onCreate,
    academyCareOptions,
    teacherOptions,
    subjectOptions
}: {
    onCreate: (input: ClassFormInput) => Promise<unknown>;
    academyCareOptions: Array<{ id: string; label: string }>;
    teacherOptions: Array<{ id: string; label: string }>;
    subjectOptions: Array<{ id: string; label: string }>;
    onAddSubject?: (name: string) => Promise<void>;
}) {
    const [form, setForm] = useState<ClassFormInput>({ ...initialForm, subjects: [] });
    const [newSubject, setNewSubject] = useState("");
    const [addingSubject, setAddingSubject] = useState(false);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleAddQuickSubject = async () => {
        if (!newSubject.trim() || !onAddSubject) return;
        setAddingSubject(true);
        try {
            await onAddSubject(newSubject.trim());
            // After successful add, check the checkbox automatically
            setForm(prev => ({
                ...prev,
                subjects: [...prev.subjects, newSubject.trim()]
            }));
            setNewSubject("");
        } catch (error) {
            console.error("Failed to add subject:", error);
        } finally {
            setAddingSubject(false);
        }
    };

    function validate() {
        const newErrors: Record<string, string> = {};
        if (!form.name.trim()) newErrors.name = "Class name is required";
        if (!form.academy_care_id.trim()) newErrors.academy_care_id = "Academy Care is required";
        if (form.subjects.filter((subject) => subject.trim()).length === 0) newErrors.subjects = "At least one subject is required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!validate()) return;
        setSaving(true);
        await onCreate({
            ...form,
            subjects: form.subjects.map((subject) => subject.trim()).filter(Boolean)
        });
        setForm({ ...initialForm, subjects: [] });
        setSaving(false);
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-10">
            {/* Section: Basic Information */}
            <section className="space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <span className="material-symbols-outlined text-[24px]">info</span>
                    </div>
                    <div>
                        <h3 className="text-[15px] font-bold text-slate-900">Basic Information</h3>
                        <p className="text-[11px] font-medium text-slate-400">Core identity and location of the class</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                        label="Class Name"
                        placeholder="e.g., Grade 10 - Alpha"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        error={errors.name}
                        className="font-bold text-slate-800"
                        required
                    />

                    <Input
                        label="Room Number"
                        placeholder="e.g., Room 101, Block B"
                        value={form.room_number || ""}
                        onChange={(e) => setForm({ ...form, room_number: e.target.value })}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Select
                        label="Linked Academy Year"
                        value={form.academy_care_id}
                        onChange={(event) => setForm({ ...form, academy_care_id: event.target.value })}
                        options={[
                            { label: "Select academic year", value: "" },
                            ...academyCareOptions.map(o => ({ label: o.label, value: o.id }))
                        ]}
                        error={errors.academy_care_id}
                        required
                    />

                    <div className="flex flex-col gap-1.5 opacity-0 pointer-events-none hidden">
                        <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Status</label>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Description</label>
                    <textarea
                        placeholder="Add operational notes or class description..."
                        value={form.description || ""}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        rows={3}
                        className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-800 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-600/5 transition-all"
                    />
                </div>
            </section>

            {/* Section: Academic Mapping */}
            <section className="space-y-6 pt-6 border-t border-slate-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Multi-Select Teachers */}
                    <div className="flex flex-col gap-2">
                        <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Assigned Faculty (Optional)</label>
                        <div className="relative group">
                            <select
                                multiple
                                value={form.teacher_ids}
                                onChange={(e) => {
                                    const values = Array.from(e.target.selectedOptions, option => option.value);
                                    setForm({ ...form, teacher_ids: values });
                                }}
                                className="w-full min-h-[100px] rounded-xl border border-slate-200 bg-white p-2 text-sm text-slate-800 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-600/5 transition-all"
                            >
                                {teacherOptions.map(t => (
                                    <option key={t.id} value={t.id} className="p-2 rounded-lg m-1 checked:bg-blue-600 checked:text-white">
                                        {t.label}
                                    </option>
                                ))}
                            </select>
                            <p className="text-[10px] text-slate-400 mt-1 italic">Hold Ctrl/Cmd to select multiple teachers</p>
                        </div>
                    </div>

                    {/* Multi-Select Subjects + Quick Add */}
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Curriculum Subjects *</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={newSubject}
                                    onChange={(e) => setNewSubject(e.target.value)}
                                    placeholder="Quick add..."
                                    className="h-7 w-28 rounded-lg border border-slate-200 bg-white px-2 text-[10px] font-bold text-slate-700 outline-none focus:border-amber-400"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddQuickSubject}
                                    disabled={addingSubject || !newSubject.trim()}
                                    className="h-7 w-7 flex items-center justify-center rounded-lg bg-amber-50 text-amber-600 border border-amber-100 hover:bg-amber-100 disabled:opacity-50"
                                >
                                    <span className="material-symbols-outlined text-sm">add</span>
                                </button>
                            </div>
                        </div>
                        <div className="relative group">
                            <select
                                multiple
                                value={form.subjects}
                                onChange={(e) => {
                                    const values = Array.from(e.target.selectedOptions, option => option.value);
                                    setForm({ ...form, subjects: values });
                                }}
                                className={`w-full min-h-[100px] rounded-xl border ${errors.subjects ? 'border-red-300' : 'border-slate-200'} bg-white p-2 text-sm text-slate-800 outline-none focus:border-amber-300 focus:ring-4 focus:ring-amber-600/5 transition-all`}
                            >
                                {subjectOptions.map(s => (
                                    <option key={s.id} value={s.label} className="p-2 rounded-lg m-1 checked:bg-amber-500 checked:text-white">
                                        {s.label}
                                    </option>
                                ))}
                            </select>
                            {errors.subjects ? (
                                <p className="text-[10px] font-bold text-red-500 mt-1">{errors.subjects}</p>
                            ) : (
                                <p className="text-[10px] text-slate-400 mt-1 italic">At least one subject required</p>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Sticky Actions Bar */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100 sticky bottom-0 bg-[#F8FAFF]/80 backdrop-blur-md py-4 z-10">
                <Link
                    href="/admin/classes"
                    className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                    Cancel
                </Link>
                <Button
                    type="submit"
                    disabled={saving}
                    className="min-w-[180px] h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-600/20 transition-all font-bold"
                >
                    {saving ? (
                        <span className="flex items-center gap-2">
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                            Creating...
                        </span>
                    ) : (
                        <span className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[20px]">check_circle</span>
                            Initialize Class
                        </span>
                    )}
                </Button>
            </div>
        </form>
    );
}
