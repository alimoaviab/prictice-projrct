"use client";

import { FormEvent, useState, useEffect } from "react";
import Link from "next/link";
import { Button, Input, Select } from "../../../components/ui";
import { ClassFormInput, ClassSubject, GradeThreshold } from "../types/class.types";

const defaultGrades: GradeThreshold[] = [
    { grade: "A+", min_score: 90, max_score: 100, description: "Outstanding" },
    { grade: "A", min_score: 80, max_score: 89, description: "Excellent" },
    { grade: "B", min_score: 70, max_score: 79, description: "Very Good" },
    { grade: "C", min_score: 60, max_score: 69, description: "Good" },
    { grade: "D", min_score: 50, max_score: 59, description: "Satisfactory" },
];

const initialForm: ClassFormInput = {
    name: "",
    code: "",
    display_order: 1,
    passing_percentage: 33,
    academy_care_id: "",
    teacher_ids: [],
    subjects: [],
    grade_thresholds: [...defaultGrades],
    room_number: "",
    description: ""
};

export function ClassForm({
    onCreate,
    academyCareOptions,
    teacherOptions,
    subjectOptions,
    onAddSubject
}: {
    onCreate: (input: ClassFormInput) => Promise<unknown>;
    academyCareOptions: Array<{ id: string; label: string }>;
    teacherOptions: Array<{ id: string; label: string }>;
    subjectOptions: Array<{ id: string; label: string }>;
    onAddSubject?: (name: string) => Promise<void>;
}) {
    const [form, setForm] = useState<ClassFormInput>(initialForm);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Summary data
    const subjectCount = form.subjects.length;
    const gradeCount = form.grade_thresholds.length;

    function validate() {
        const newErrors: Record<string, string> = {};
        if (!form.name.trim()) newErrors.name = "Class name is required";
        if (!form.code.trim()) newErrors.code = "Class code is required";
        if (!form.academy_care_id.trim()) newErrors.academy_care_id = "Academy Care is required";
        if (form.subjects.length === 0) newErrors.subjects = "At least one subject is required";
        
        // Validate subjects
        form.subjects.forEach((s, i) => {
            if (!s.name.trim()) newErrors[`subject_${i}_name`] = "Required";
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!validate()) return;
        setSaving(true);
        const result = await onCreate(form);
        if (result && (result as any).ok !== false) {
             setForm(initialForm);
        }
        setSaving(false);
    }

    const addSubject = () => {
        setForm(prev => ({
            ...prev,
            subjects: [...prev.subjects, { name: "", total_marks: 100, passing_marks: prev.passing_percentage }]
        }));
    };

    const removeSubject = (index: number) => {
        setForm(prev => ({
            ...prev,
            subjects: prev.subjects.filter((_, i) => i !== index)
        }));
    };

    const updateSubject = (index: number, field: keyof ClassSubject, value: any) => {
        setForm(prev => {
            const newSubjects = [...prev.subjects];
            newSubjects[index] = { ...newSubjects[index], [field]: value };
            return { ...prev, subjects: newSubjects };
        });
    };

    const applyPassPercentage = () => {
        setForm(prev => ({
            ...prev,
            subjects: prev.subjects.map(s => ({ ...s, passing_marks: Math.round((s.total_marks * prev.passing_percentage) / 100) }))
        }));
    };

    const addGrade = () => {
        setForm(prev => ({
            ...prev,
            grade_thresholds: [...prev.grade_thresholds, { grade: "", min_score: 0, max_score: 0, description: "" }]
        }));
    };

    const removeGrade = (index: number) => {
        setForm(prev => ({
            ...prev,
            grade_thresholds: prev.grade_thresholds.filter((_, i) => i !== index)
        }));
    };

    const updateGrade = (index: number, field: keyof GradeThreshold, value: any) => {
        setForm(prev => {
            const newGrades = [...prev.grade_thresholds];
            newGrades[index] = { ...newGrades[index], [field]: value };
            return { ...prev, grade_thresholds: newGrades };
        });
    };

    const resetGrades = () => {
        setForm(prev => ({ ...prev, grade_thresholds: [...defaultGrades] }));
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* Summary Bar */}
            <div className="flex items-center gap-6 p-4 bg-slate-50/50 rounded-2xl border border-slate-100 text-[11px] font-black uppercase tracking-widest text-slate-500">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-blue-600">visibility</span>
                    <span>{subjectCount} subjects</span>
                </div>
                <div className="w-px h-4 bg-slate-200" />
                <div className="flex items-center gap-2">
                    <span>Pass: {form.passing_percentage}%</span>
                </div>
                <div className="w-px h-4 bg-slate-200" />
                <div className="flex items-center gap-2">
                    <span>{gradeCount} grades</span>
                </div>
            </div>

            {/* Validation Banner */}
            {subjectCount === 0 && (
                <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100 text-amber-700 text-xs font-bold">
                    <span className="material-symbols-outlined text-sm">info</span>
                    Add at least 1 subject to continue
                </div>
            )}

            <div className="premium-card p-5 bg-white border border-slate-200 shadow-sm rounded-xl space-y-6">
                {/* Basic Info Section */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Input
                        label="Class Name *"
                        placeholder="Class 10"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        error={errors.name}
                        className="font-bold"
                    />
                    <Input
                        label="Class Code *"
                        placeholder="C10"
                        value={form.code}
                        onChange={(e) => setForm({ ...form, code: e.target.value })}
                        error={errors.code}
                        className="font-bold"
                    />
                    <Input
                        label="Display Order"
                        type="number"
                        value={form.display_order}
                        onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })}
                        className="font-bold"
                    />
                    <Input
                        label="Passing %"
                        type="number"
                        value={form.passing_percentage}
                        onChange={(e) => setForm({ ...form, passing_percentage: parseInt(e.target.value) || 0 })}
                        className="font-bold"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Select
                        label="Academic Year *"
                        value={form.academy_care_id}
                        onChange={(e) => setForm({ ...form, academy_care_id: e.target.value })}
                        options={[
                            { label: "Select Year", value: "" },
                            ...academyCareOptions.map(o => ({ label: o.label, value: o.id }))
                        ]}
                        error={errors.academy_care_id}
                    />
                     <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Assigned Teachers</label>
                        <select
                            multiple
                            value={form.teacher_ids}
                            onChange={(e) => {
                                const values = Array.from(e.target.selectedOptions, option => option.value);
                                setForm({ ...form, teacher_ids: values });
                            }}
                            className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-600/5 transition-all"
                        >
                            {teacherOptions.map(t => (
                                <option key={t.id} value={t.id}>{t.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Subjects Section */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Subjects</h3>
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="primary"
                                onClick={addSubject}
                                className="h-9 px-4 bg-blue-600 text-white rounded-lg text-[11px] font-bold gap-2"
                            >
                                <span className="material-symbols-outlined text-sm">add</span>
                                Add Subject
                            </Button>
                            <Button type="button" variant="ghost" className="h-9 px-4 border border-slate-200 rounded-lg text-[11px] font-bold">Template</Button>
                            <Button 
                                type="button" 
                                variant="ghost" 
                                onClick={applyPassPercentage}
                                className="h-9 px-4 border border-slate-200 rounded-lg text-[11px] font-bold"
                            >
                                Apply Pass %
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {form.subjects.map((subject, index) => (
                            <div key={index} className="flex items-center gap-4 p-3 bg-slate-50/50 rounded-2xl border border-slate-100 group">
                                <div className="flex-1">
                                    <input
                                        placeholder="Subject Name"
                                        value={subject.name}
                                        onChange={(e) => updateSubject(index, "name", e.target.value)}
                                        className="w-full bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-700 placeholder:text-slate-300"
                                    />
                                    {errors[`subject_${index}_name`] && (
                                        <p className="text-[10px] text-red-500 font-bold px-3">Required</p>
                                    )}
                                </div>
                                <div className="w-20">
                                    <input
                                        type="number"
                                        value={subject.total_marks}
                                        onChange={(e) => updateSubject(index, "total_marks", parseInt(e.target.value) || 0)}
                                        className="w-full text-center bg-transparent border-none focus:ring-0 text-sm font-black text-slate-900"
                                    />
                                </div>
                                <div className="w-20">
                                    <input
                                        type="number"
                                        value={subject.passing_marks}
                                        onChange={(e) => updateSubject(index, "passing_marks", parseInt(e.target.value) || 0)}
                                        className="w-full text-center bg-transparent border-none focus:ring-0 text-sm font-black text-slate-900"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeSubject(index)}
                                    className="p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Grade Thresholds Section */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Grade Thresholds</h3>
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="primary"
                                onClick={addGrade}
                                className="h-9 px-4 bg-blue-600 text-white rounded-lg text-[11px] font-bold gap-2"
                            >
                                <span className="material-symbols-outlined text-sm">add</span>
                                Add Grade
                            </Button>
                            <Button 
                                type="button" 
                                variant="ghost" 
                                onClick={resetGrades}
                                className="h-9 px-4 border border-slate-200 rounded-lg text-[11px] font-bold gap-2"
                            >
                                <span className="material-symbols-outlined text-sm">refresh</span>
                                Reset
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {form.grade_thresholds.map((grade, index) => (
                            <div key={index} className="flex items-center gap-4 p-3 bg-slate-50/50 rounded-2xl border border-slate-100 group">
                                <div className="w-16">
                                    <input
                                        value={grade.grade}
                                        onChange={(e) => updateGrade(index, "grade", e.target.value)}
                                        className="w-full text-center bg-transparent border-none focus:ring-0 text-sm font-black text-slate-900"
                                    />
                                </div>
                                <div className="w-20">
                                    <input
                                        type="number"
                                        value={grade.min_score}
                                        onChange={(e) => updateGrade(index, "min_score", parseInt(e.target.value) || 0)}
                                        className="w-full text-center bg-transparent border-none focus:ring-0 text-sm font-black text-blue-600"
                                    />
                                </div>
                                <div className="w-20">
                                    <input
                                        type="number"
                                        value={grade.max_score}
                                        onChange={(e) => updateGrade(index, "max_score", parseInt(e.target.value) || 0)}
                                        className="w-full text-center bg-transparent border-none focus:ring-0 text-sm font-black text-blue-600"
                                    />
                                </div>
                                <div className="flex-1">
                                    <input
                                        placeholder="Description"
                                        value={grade.description}
                                        onChange={(e) => updateGrade(index, "description", e.target.value)}
                                        className="w-full bg-transparent border-none focus:ring-0 text-sm text-slate-500 placeholder:text-slate-300"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeGrade(index)}
                                    className="p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Link
                    href="/admin/classes"
                    className="px-4 py-2 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all"
                >
                    Cancel
                </Link>
                <Button
                    type="submit"
                    disabled={saving}
                    className="min-w-[140px] h-9 bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-md transition-all text-[10px] font-black uppercase tracking-widest"
                >
                    {saving ? "Saving..." : "Create Unit"}
                </Button>
            </div>
        </form>
    );
}
