import { AppIcon } from "shared/ui/AppIcon";
import { FormEvent, useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button, Input, Select } from "@/components/ui";
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
    class_teacher_id: "",
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
        class_teacher_id: initialData.class_teacher_id || "",
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
        if (!form.code?.trim()) newErrors.code = "Grade is required";
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
                    <AppIcon name="Eye" size={14} className="text-blue-600" />
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
                    <AppIcon name="Info" size={14} />
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
                    <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500">Grade (1-12) *</label>
                        <select
                            value={form.code}
                            onChange={(e) => setForm({ ...form, code: e.target.value })}
                            className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm font-bold text-slate-900 focus:border-blue-500 outline-none bg-white"
                        >
                            <option value="">Select Grade</option>
                            <option value="nursery">Nursery</option>
                            <option value="kg-1">KG-1</option>
                            <option value="kg-2">KG-2</option>
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                            <option value="4">4</option>
                            <option value="5">5</option>
                            <option value="6">6</option>
                            <option value="7">7</option>
                            <option value="8">8</option>
                            <option value="9">9</option>
                            <option value="10">10</option>
                            <option value="11">11</option>
                            <option value="12">12</option>
                        </select>
                        {errors.code && <p className="text-[10px] text-red-500 font-medium">{errors.code}</p>}
                    </div>
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
                    <div className="space-y-2">
                        <div className="flex items-center justify-between min-h-[32px] px-0.5">
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Academic year *</label>
                            {onCreateAcademicYear && (
                                <button 
                                    type="button"
                                    onClick={onCreateAcademicYear}
                                    className="h-7 px-3 rounded-lg border border-blue-100 bg-blue-50/50 text-[9px] font-black text-blue-600 uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all flex items-center gap-2 active:scale-95 group"
                                >
                                    <AppIcon name="PlusCircle" size={14} />
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
                                <AppIcon name="AlertTriangle" size={14} />
                                No academic year found.
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center min-h-[32px] px-0.5">
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Academic Incharge (Head Teacher)</label>
                        </div>
                        <Select
                            value={form.class_teacher_id}
                            onChange={(e) => setForm({ ...form, class_teacher_id: e.target.value })}
                            options={[
                                { label: "Select Incharge", value: "" },
                                ...teacherOptions.map((o: { id: string; label: string }) => ({ label: o.label, value: o.id }))
                            ]}
                            className="h-11 rounded-xl"
                        />
                    </div>
                </div>

                {/* Subjects Section */}
                <div className="space-y-6 pt-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                        <div className="space-y-1">
                            <h3 className="text-base font-black text-slate-900 tracking-tight">Class Curriculum</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Assign subjects and marks</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="primary"
                                onClick={addSubject}
                                className="h-9 px-4 bg-blue-600 text-white rounded-lg text-[11px] font-bold gap-2"
                            >
                                <AppIcon name="Plus" size={14} />
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
                    <div className="space-y-2">
                        {form.subjects?.map((subject, index) => (
                            <div key={index} className="flex items-center gap-1.5 p-1.5 bg-slate-50/30 rounded-xl border border-slate-100 group transition-all hover:bg-white hover:border-blue-200">
                                {/* Name */}
                                <div className="flex-[2] min-w-[110px] space-y-1">
                                    <div className={`flex items-center gap-1.5 p-1 rounded-lg transition-all ${errors[`subject_${index}_name`] ? 'bg-red-50 border border-red-200' : ''}`}>
                                        <AppIcon name="BookOpen" size={14} className={` text-[14px] ${errors[`subject_${index} _name`] ? 'text-red-400' : 'text-slate-300'}`} />
                                        <input
                                            placeholder="Subject Name"
                                            value={subject.name}
                                            onChange={(e) => updateSubject(index, "name", e.target.value)}
                                            className="w-full bg-transparent border-none focus:ring-0 text-[10px] font-bold text-slate-900 placeholder:text-slate-300"
                                        />
                                    </div>
                                    {errors[`subject_${index}_name`] && (
                                        <p className="text-[8px] font-bold text-red-500 px-1 uppercase tracking-tighter">Name Required</p>
                                    )}
                                </div>

                                {/* Teacher */}
                                    <Select
                                        value={subject.teacher_id || ""}
                                        onChange={(e) => updateSubject(index, "teacher_id", e.target.value)}
                                        options={[
                                            { label: "Teacher", value: "" },
                                            ...teacherOptions.map((o) => ({ label: o.label, value: o.id }))
                                        ]}
                                        className="h-8 text-[10px] font-bold px-2 py-0 border-slate-200"
                                    />

                                {/* Marks */}
                                <div className="flex items-center gap-1 ml-auto">
                                    <input
                                        type="number"
                                        value={subject.total_marks}
                                        onChange={(e) => updateSubject(index, "total_marks", parseInt(e.target.value) || 0)}
                                        className="w-11 h-8 text-center bg-white border border-slate-200 rounded-lg text-[9px] font-bold text-slate-900"
                                        title="Total Marks"
                                    />
                                    <input
                                        type="number"
                                        value={subject.passing_marks}
                                        onChange={(e) => updateSubject(index, "passing_marks", parseInt(e.target.value) || 0)}
                                        className="w-11 h-8 text-center bg-white border border-slate-200 rounded-lg text-[9px] font-bold text-slate-900"
                                        title="Pass Marks"
                                    />
                                </div>

                                {/* Actions */}
                                <button
                                    type="button"
                                    onClick={() => removeSubject(index)}
                                    className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <AppIcon name="Trash2" size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
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
                                <AppIcon name="Plus" size={14} />
                                Add Grade
                            </Button>
                            <Button 
                                type="button" 
                                variant="ghost" 
                                onClick={resetGrades}
                                className="h-9 px-4 border border-slate-200 rounded-lg text-[11px] font-bold gap-2"
                            >
                                <AppIcon name="RefreshCw" size={14} />
                                Reset
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        {form.grade_thresholds?.map((grade, index) => (
                            <div key={index} className="flex items-center gap-2 p-1.5 bg-slate-50/50 rounded-xl border border-slate-100 group">
                                <div className="w-16 flex items-center justify-center gap-0.5 border border-slate-200/60 rounded-lg bg-white px-1 py-0.5">
                                    <input
                                        value={grade.grade.charAt(0) || ""}
                                        onChange={(e) => {
                                            const cleanLetter = e.target.value.replace(/[^a-zA-Z]/g, "").toUpperCase();
                                            const currentSuffix = (grade.grade.charAt(1) === "+" || grade.grade.charAt(1) === "-") ? grade.grade.charAt(1) : "";
                                            updateGrade(index, "grade", cleanLetter + currentSuffix);
                                        }}
                                        maxLength={1}
                                        placeholder="G"
                                        className="w-5 text-center bg-transparent border-none focus:ring-0 text-sm font-extrabold text-slate-900 p-0 outline-none"
                                    />
                                    <div className="relative flex items-center justify-center w-5 h-5">
                                        <select
                                            value={(grade.grade.charAt(1) === "+" || grade.grade.charAt(1) === "-") ? grade.grade.charAt(1) : ""}
                                            onChange={(e) => {
                                                const letter = grade.grade.charAt(0) || "";
                                                updateGrade(index, "grade", letter + e.target.value);
                                            }}
                                            className="absolute inset-0 bg-transparent border-none text-xs font-extrabold text-slate-500 focus:ring-0 cursor-pointer p-0 w-full h-full outline-none appearance-none text-center z-10"
                                        >
                                            <option value=""> </option>
                                            <option value="+">+</option>
                                            <option value="-">-</option>
                                        </select>
                                        {!(grade.grade.charAt(1) === "+" || grade.grade.charAt(1) === "-") && (
                                            <AppIcon name="ChevronDown" size={16} className="text-slate-400 pointer-events-none select-none z-0" />
                                        )}
                                    </div>
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
                                    <AppIcon name="Trash2" size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Link
                    to="/admin/classes"
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
