"use client";

import { FormEvent, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button, Input, Select } from "../../../components/ui";
import { ClassFormInput, ClassSubject, GradeThreshold, ClassRow } from "../types/class.types";

const defaultGrades: GradeThreshold[] = [
    { grade: "A+", min_score: 90, max_score: 100, description: "Outstanding" },
    { grade: "A", min_score: 80, max_score: 89, description: "Excellent" },
    { grade: "B", min_score: 70, max_score: 79, description: "Very Good" },
    { grade: "C", min_score: 60, max_score: 69, description: "Good" },
    { grade: "D", min_score: 50, max_score: 59, description: "Satisfactory" },
];

const defaultSubjects: ClassSubject[] = [
    { name: "Urdu", total_marks: 100, passing_marks: 33 },
    { name: "English", total_marks: 100, passing_marks: 33 },
    { name: "Math", total_marks: 100, passing_marks: 33 },
    { name: "Chemistry", total_marks: 100, passing_marks: 33 },
    { name: "Physics", total_marks: 100, passing_marks: 33 },
    { name: "Biology", total_marks: 100, passing_marks: 33 },
    { name: "Computer", total_marks: 100, passing_marks: 33 },
];

const initialForm: ClassFormInput = {
    name: "",
    code: "",
    display_order: 1,
    passing_percentage: 33,
    academic_year_id: "",
    teacher_ids: [],
    subjects: [...defaultSubjects],
    grade_thresholds: [...defaultGrades],
    room_number: "",
    description: ""
};

export function ClassForm({
    onCreate,
    academicYearOptions,
    teacherOptions,
    subjectOptions,
    onAddSubject,
    onCreateAcademicYear,
    onCreateTeacher,
    autoSelectAcademicYear,
    autoSelectTeacher,
    onSelectionHandled,
    initialData
}: {
    onCreate: (input: ClassFormInput) => Promise<unknown>;
    academicYearOptions: Array<{ id: string; label: string }>;
    teacherOptions: Array<{ id: string; label: string }>;
    subjectOptions: Array<{ id: string; label: string }>;
    onAddSubject?: (name: string) => Promise<void>;
    onCreateAcademicYear?: () => void;
    onCreateTeacher?: () => void;
    autoSelectAcademicYear?: string | undefined;
    autoSelectTeacher?: string | undefined;
    onSelectionHandled?: () => void;
    initialData?: ClassRow;
}) {
    const [form, setForm] = useState<ClassFormInput>(initialData ? {
        name: initialData.name,
        code: initialData.code || "",
        display_order: initialData.display_order || 1,
        passing_percentage: initialData.passing_percentage || 33,
        academic_year_id: initialData.academic_year_id || "",
        teacher_ids: initialData.teacher_ids || [],
        subjects: initialData.subjects || [...defaultSubjects],
        grade_thresholds: initialData.grade_thresholds || [...defaultGrades],
        room_number: initialData.room_number || "",
        description: initialData.description || "",
        capacity: initialData.capacity || 40,
        status: initialData.status as any || "active"
    } : initialForm);

    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [teacherSearch, setTeacherSearch] = useState("");

    // Auto-select logic for contextual creation
    useEffect(() => {
        if (autoSelectAcademicYear) {
            setForm(prev => ({ ...prev, academic_year_id: autoSelectAcademicYear }));
            onSelectionHandled?.();
        }
    }, [autoSelectAcademicYear, onSelectionHandled]);

    useEffect(() => {
        if (autoSelectTeacher) {
            setForm(prev => ({ 
                ...prev, 
                teacher_ids: [...new Set([...prev.teacher_ids, autoSelectTeacher])] 
            }));
            onSelectionHandled?.();
        }
    }, [autoSelectTeacher, onSelectionHandled]);

    // Summary data
    const subjectCount = form.subjects?.length || 0;
    const gradeCount = form.grade_thresholds?.length || 0;

    function validate() {
        const newErrors: Record<string, string> = {};
        if (!form.name.trim()) newErrors.name = "Class name is required";
        if (!form.code?.trim()) newErrors.code = "Class code is required";
        if (!form.academic_year_id?.trim()) newErrors.academic_year_id = "Academic Year is required";
        if ((form.subjects?.length || 0) === 0) newErrors.subjects = "At least one subject is required";
        
        // Validate subjects
        form.subjects?.forEach((s, i) => {
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
             if (!initialData) setForm(initialForm);
        }
        setSaving(false);
    }

    const addSubject = () => {
        setForm(prev => ({
            ...prev,
            subjects: [...(prev.subjects || []), { name: "", total_marks: 100, passing_marks: prev.passing_percentage || 33 }]
        }));
    };

    const removeSubject = (index: number) => {
        setForm(prev => ({
            ...prev,
            subjects: (prev.subjects || []).filter((_, i) => i !== index)
        }));
    };

    const updateSubject = (index: number, field: keyof ClassSubject, value: any) => {
        setForm(prev => {
            const newSubjects = [...(prev.subjects || [])];
            newSubjects[index] = { ...newSubjects[index], [field]: value };
            return { ...prev, subjects: newSubjects };
        });
    };

    const subjectInputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const applyPassPercentage = () => {
        setForm(prev => ({
            ...prev,
            subjects: (prev.subjects || []).map(s => ({ ...s, passing_marks: Math.round((s.total_marks * (prev.passing_percentage || 33)) / 100) }))
        }));
    };

    const addGrade = () => {
        setForm(prev => ({
            ...prev,
            grade_thresholds: [...(prev.grade_thresholds || []), { grade: "", min_score: 0, max_score: 0, description: "" }]
        }));
    };

    const removeGrade = (index: number) => {
        setForm(prev => ({
            ...prev,
            grade_thresholds: (prev.grade_thresholds || []).filter((_, i) => i !== index)
        }));
    };

    const updateGrade = (index: number, field: keyof GradeThreshold, value: any) => {
        setForm(prev => {
            const newGrades = [...(prev.grade_thresholds || [])];
            newGrades[index] = { ...newGrades[index], [field]: value };
            return { ...prev, grade_thresholds: newGrades };
        });
    };

    const resetGrades = () => {
        setForm(prev => ({ ...prev, grade_thresholds: [...defaultGrades] }));
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Summary Bar */}
            <div className="flex items-center gap-4 p-1.5 bg-slate-50/50 rounded-xl border border-slate-100 text-[11px] font-bold normal-case  text-slate-500">
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
                <div className="flex items-center gap-3 p-2.5 bg-amber-50 rounded-xl border border-amber-100 text-amber-700 text-xs font-bold">
                    <span className="material-symbols-outlined text-sm">info</span>
                    Add at least 1 subject to continue
                </div>
            )}

            <div className="premium-card p-3 bg-white border border-slate-200 shadow-sm rounded-xl space-y-3">
                {/* Basic Info Section */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Input
                        label="Class name *"
                        placeholder="Class 10"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        error={errors.name}
                        className="font-bold"
                    />
                    <Input
                        label="Class code *"
                        placeholder="C10"
                        value={form.code}
                        onChange={(e) => setForm({ ...form, code: e.target.value })}
                        error={errors.code}
                        className="font-bold"
                    />
                    <Input
                        label="Display order"
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
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between px-0.5">
                            <label className="text-[11px] font-bold text-slate-500 normal-case ">Academic year *</label>
                            {onCreateAcademicYear && (
                                <button 
                                    type="button"
                                    onClick={onCreateAcademicYear}
                                    className="h-8 px-3 rounded-full border border-blue-100 bg-blue-50/30 text-[10px] font-bold text-blue-600 normal-case  hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all flex items-center gap-1.5 shadow-sm active:scale-95 group"
                                >
                                    <span className="material-symbols-outlined text-[16px] group-hover:rotate-90 transition-transform">add_circle</span>
                                    New Session
                                </button>
                            )}
                        </div>
                        <Select
                            value={form.academic_year_id}
                            onChange={(e) => setForm({ ...form, academic_year_id: e.target.value })}
                            options={[
                                { label: "Select Academic Cycle", value: "" },
                                ...academicYearOptions.map((o: { id: string; label: string }) => ({ label: o.label, value: o.id }))
                            ]}
                            error={errors.academic_year_id}
                            className="h-11 rounded-xl"
                        />
                        {academicYearOptions.length === 0 && (
                            <p className="text-[10px] font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100 flex items-center gap-2">
                                <span className="material-symbols-outlined text-[14px]">warning</span>
                                No academic year found. Please create one to proceed.
                            </p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between px-0.5">
                            <label className="text-[11px] font-bold text-slate-500 normal-case ">Assigned faculty</label>
                            {onCreateTeacher && (
                                <button 
                                    type="button"
                                    onClick={onCreateTeacher}
                                    className="h-8 px-3 rounded-full border border-blue-100 bg-blue-50/30 text-[10px] font-bold text-blue-600 normal-case  hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all flex items-center gap-1.5 shadow-sm active:scale-95 group"
                                >
                                    <span className="material-symbols-outlined text-[16px] group-hover:rotate-90 transition-transform">person_add</span>
                                    Add Teacher
                                </button>
                            )}
                        </div>
                        
                        <div className="relative group">
                            <div className="flex flex-wrap gap-1.5 p-2 min-h-[44px] rounded-xl border border-slate-200 bg-white focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-600/5 transition-all">
                                {form.teacher_ids?.map(id => {
                                    const teacher = teacherOptions.find((t: { id: string; label: string }) => t.id === id);
                                    return (
                                        <span key={id} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100 border border-slate-200 text-[11px] font-bold text-slate-700">
                                            {teacher?.label || "Unknown"}
                                            <button 
                                                type="button"
                                                onClick={() => setForm(prev => ({ ...prev, teacher_ids: prev.teacher_ids?.filter(t => t !== id) || [] }))}
                                                className="text-slate-400 hover:text-red-500 transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-sm">close</span>
                                            </button>
                                        </span>
                                    );
                                })}
                                <input 
                                    placeholder={form.teacher_ids?.length === 0 ? "Search and select teachers..." : "Add more..."}
                                    className="flex-1 min-w-[120px] bg-transparent text-[11px] font-medium text-slate-700 outline-none placeholder:text-slate-400"
                                    value={teacherSearch}
                                    onChange={(e) => setTeacherSearch(e.target.value)}
                                />
                            </div>

                            {/* Dropdown Results */}
                            {teacherSearch && (
                                <div className="absolute top-full left-0 right-0 mt-2 z-50 max-h-48 overflow-y-auto bg-white rounded-xl border border-slate-200 shadow-xl p-1.5 space-y-1">
                                    {teacherOptions
                                        .filter((t: { id: string; label: string }) => t.label.toLowerCase().includes(teacherSearch.toLowerCase()) && !form.teacher_ids?.includes(t.id))
                                        .map((t: { id: string; label: string }) => (
                                            <button
                                                key={t.id}
                                                type="button"
                                                onClick={() => {
                                                    setForm(prev => ({ ...prev, teacher_ids: [...(prev.teacher_ids || []), t.id] }));
                                                    setTeacherSearch("");
                                                }}
                                                className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 text-[11px] font-bold text-slate-700 transition-colors flex items-center gap-3"
                                            >
                                                <div className="h-6 w-6 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                                    <span className="material-symbols-outlined text-[14px]">badge</span>
                                                </div>
                                                {t.label}
                                            </button>
                                        ))}
                                    {teacherOptions.filter((t: { id: string; label: string }) => t.label.toLowerCase().includes(teacherSearch.toLowerCase()) && !form.teacher_ids?.includes(t.id)).length === 0 && (
                                        <div className="px-3 py-4 text-center">
                                            <p className="text-[10px] font-bold text-slate-400 normal-case ">No faculty found</p>
                                            <button 
                                                type="button"
                                                onClick={onCreateTeacher}
                                                className="mt-2 text-[10px] font-bold text-blue-600 normal-case hover:underline"
                                            >
                                                Create "{teacherSearch}" teacher
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        {teacherOptions.length === 0 && !teacherSearch && (
                            <p className="text-[10px] font-bold text-slate-400 flex items-center gap-2 pl-1">
                                <span className="material-symbols-outlined text-[14px]">info</span>
                                No teachers available in database.
                            </p>
                        )}
                    </div>
                </div>

                {/* Subjects Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-900 normal-case ">Subjects</h3>
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

                    <div className="space-y-1.5">
                        {form.subjects?.map((subject, index) => (
                            <div key={index} className="flex items-center gap-2 p-1.5 bg-slate-50/50 rounded-xl border border-slate-100 group transition-all hover:bg-white hover:border-blue-200">
                                <div className="flex-1 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[16px] text-slate-300 group-hover:text-blue-500 transition-colors">book</span>
                                    <input
                                        ref={el => { subjectInputRefs.current[index] = el; }}
                                        placeholder="Subject Name"
                                        value={subject.name}
                                        onChange={(e) => updateSubject(index, "name", e.target.value)}
                                        className="w-full bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-700 placeholder:text-slate-300"
                                    />
                                    {errors[`subject_${index}_name`] && (
                                        <p className="text-[10px] text-red-500 font-bold px-3">Required</p>
                                    )}
                                </div>
                                <div className="w-14">
                                    <input
                                        type="number"
                                        value={subject.total_marks}
                                        onChange={(e) => updateSubject(index, "total_marks", parseInt(e.target.value) || 0)}
                                        className="w-full text-center bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-900"
                                    />
                                </div>
                                <div className="w-14">
                                    <input
                                        type="number"
                                        value={subject.passing_marks}
                                        onChange={(e) => updateSubject(index, "passing_marks", parseInt(e.target.value) || 0)}
                                        className="w-full text-center bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-900"
                                    />
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => subjectInputRefs.current[index]?.focus()}
                                        className="p-1.5 text-slate-300 hover:text-blue-600 transition-colors opacity-0 group-hover:opacity-100"
                                        title="Edit subject"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">edit_note</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => removeSubject(index)}
                                        className="p-1.5 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                        title="Delete subject"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Grade Thresholds Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-900 normal-case ">Grade thresholds</h3>
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

                    <div className="space-y-1.5">
                        {form.grade_thresholds?.map((grade, index) => (
                            <div key={index} className="flex items-center gap-2 p-1.5 bg-slate-50/50 rounded-xl border border-slate-100 group">
                                <div className="w-10">
                                    <input
                                        value={grade.grade}
                                        onChange={(e) => updateGrade(index, "grade", e.target.value)}
                                        className="w-full text-center bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-900"
                                    />
                                </div>
                                <div className="w-14">
                                    <input
                                        type="number"
                                        value={grade.min_score}
                                        onChange={(e) => updateGrade(index, "min_score", parseInt(e.target.value) || 0)}
                                        className="w-full text-center bg-transparent border-none focus:ring-0 text-sm font-bold text-blue-600"
                                    />
                                </div>
                                <div className="w-14">
                                    <input
                                        type="number"
                                        value={grade.max_score}
                                        onChange={(e) => updateGrade(index, "max_score", parseInt(e.target.value) || 0)}
                                        className="w-full text-center bg-transparent border-none focus:ring-0 text-sm font-bold text-blue-600"
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
                    className="px-4 py-2 text-[11px] font-bold normal-case  text-slate-400 hover:text-slate-600 transition-all"
                >
                    Cancel
                </Link>
                <Button
                    type="submit"
                    disabled={saving}
                    className="min-w-[140px] h-9 bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-md transition-all text-[10px] font-bold normal-case "
                >
                    {saving ? "Saving..." : "Save class"}
                </Button>
            </div>
        </form>
    );
}
