"use client";

import { useState, FormEvent } from "react";
import { ClassRow, ClassFormInput, ClassSubject, GradeThreshold } from "../types/class.types";

export function ClassEditSidebar({
    classItem,
    isOpen,
    academyCareOptions,
    teacherOptions,
    subjectOptions,
    onClose,
    onSave,
    onAddSubject,
    isSaving,
}: {
    classItem: ClassRow | null;
    isOpen: boolean;
    academyCareOptions: Array<{ id: string; label: string }>;
    teacherOptions: Array<{ id: string; label: string }>;
    subjectOptions: Array<{ id: string; label: string }>;
    onClose: () => void;
    onSave: (id: string, data: Partial<ClassFormInput>) => Promise<void>;
    onAddSubject?: (name: string) => Promise<void>;
    isSaving: boolean;
}) {
    const defaultOnAddSubject = async (name: string) => {};
    const handleAddSubject = onAddSubject || defaultOnAddSubject;
    const [form, setForm] = useState<Partial<ClassFormInput>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [newSubject, setNewSubject] = useState("");
    const [addingSubject, setAddingSubject] = useState(false);

    if (!classItem) return null;

    const currentForm = {
        name: form.name ?? classItem.name ?? "",
        code: form.code ?? classItem.code ?? "",
        display_order: form.display_order ?? classItem.display_order ?? 1,
        passing_percentage: form.passing_percentage ?? classItem.passing_percentage ?? 33,
        academy_care_id: form.academy_care_id ?? classItem.academy_care_id ?? "",
        teacher_ids: form.teacher_ids ?? classItem.teacher_ids ?? [],

        subjects: (form.subjects ?? (Array.isArray(classItem.subjects) && typeof classItem.subjects[0] === "string" 
            ? (classItem.subjects as string[]).map(s => ({ name: s, total_marks: 100, passing_marks: 33 }))
            : (classItem.subjects as ClassSubject[]) ?? [])) as ClassSubject[],
        grade_thresholds: (form.grade_thresholds ?? classItem.grade_thresholds ?? []) as GradeThreshold[],

        room_number: form.room_number ?? classItem.room_number ?? "",
        description: form.description ?? classItem.description ?? "",
    };

    function validate() {
        const newErrors: Record<string, string> = {};
        if (!currentForm.name.trim()) newErrors.name = "Class name is required";
        if (!currentForm.academy_care_id.trim())
            newErrors.academy_care_id = "Academy care is required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (!validate() || !classItem) return;
        await onSave(classItem._id, {
            name: currentForm.name,
            code: currentForm.code,
            display_order: currentForm.display_order,
            passing_percentage: currentForm.passing_percentage,
            academy_care_id: currentForm.academy_care_id,
            teacher_ids: currentForm.teacher_ids,
            subjects: currentForm.subjects as any[],
            room_number: currentForm.room_number,
            description: currentForm.description,
        });
        handleClose();
    }

    function handleClose() {
        setForm({});
        setErrors({});
        onClose();
    }

    if (!isOpen) return null;

    return (
        <>
            {/* Overlay - Subtler backdrop for better context retention */}
            <div
                className={`fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[9998] transition-opacity duration-500 ${
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
                onClick={handleClose}
            />

            {/* Drawer - Linear/Stripe inspired high-density panel */}
            <aside
                className={`fixed inset-y-0 right-0 z-[9999] flex w-full max-w-sm transform flex-col bg-white shadow-[-20px_0_50px_-12px_rgba(0,0,0,0.15)] transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${
                    isOpen ? "translate-x-0" : "translate-x-full"
                }`}
            >
                {/* Sticky Header */}
                <div className="shrink-0 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5">
                    <div>
                        <div className="flex items-center gap-2 mb-0.5">
                           <div className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                           <h2 className="text-xs font-black tracking-[0.15em] text-slate-900 uppercase">Class Configuration</h2>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Academic Node — {classItem.name}</p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-90 border border-slate-100"
                    >
                        <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                </div>

                {/* Content - Scrollable body with better rhythm */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#FBFCFF]">
                    <form onSubmit={handleSubmit} className="p-6 space-y-8">
                        {/* Section: Basic Profile */}
                        <div className="space-y-5">
                            <div className="flex items-center gap-3">
                                <div className="h-6 w-6 rounded-lg bg-blue-50 flex items-center justify-center">
                                  <span className="material-symbols-outlined text-blue-600 text-sm font-black">badge</span>
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">01. Identity Profile</span>
                            </div>
                            
                            <div className="grid gap-5 pl-1">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">Name <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        value={currentForm.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        placeholder="e.g. Class 10-A"
                                        className={`h-11 w-full px-4 text-sm font-bold border rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all ${errors.name ? "border-red-500 bg-red-50/30" : "border-slate-200 bg-white focus:border-blue-400"}`}
                                    />
                                    {errors.name && <p className="text-[9px] font-black text-red-500 uppercase tracking-widest pl-1">{errors.name}</p>}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">Room Allocation</label>
                                        <input
                                            type="text"
                                            value={currentForm.room_number}
                                            onChange={(e) => setForm({ ...form, room_number: e.target.value })}
                                            placeholder="Room #"
                                            className="h-11 w-full px-4 text-sm font-bold border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 bg-white transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">Session Cycle <span className="text-red-500">*</span></label>
                                        <select
                                            value={currentForm.academy_care_id}
                                            onChange={(e) => setForm({ ...form, academy_care_id: e.target.value })}
                                            className={`h-11 w-full px-3 text-[11px] font-black uppercase tracking-tight border rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all ${errors.academy_care_id ? "border-red-500 bg-red-50/30" : "border-slate-200 bg-white focus:border-blue-400 text-slate-700"}`}
                                        >
                                            <option value="">Select Cycle</option>
                                            {academyCareOptions.map((opt) => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">Strategic Description</label>
                                    <textarea
                                        value={currentForm.description}
                                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                                        rows={3}
                                        placeholder="Specify the group purpose and operational focus..."
                                        className="w-full px-4 py-3 text-xs font-bold border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 bg-white transition-all resize-none leading-relaxed"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section: Faculty Assignment */}
                        <div className="space-y-4 pt-4">
                            <div className="flex items-center gap-3">
                                <div className="h-6 w-6 rounded-lg bg-emerald-50 flex items-center justify-center">
                                  <span className="material-symbols-outlined text-emerald-600 text-sm font-black">school</span>
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">02. Faculty Assignment (Optional)</span>
                            </div>
                            <div className="pl-1">
                                <select
                                    multiple
                                    value={currentForm.teacher_ids}
                                    onChange={(e) => {
                                        const values = Array.from(e.target.selectedOptions, option => option.value);
                                        setForm({ ...form, teacher_ids: values });
                                    }}
                                    className="w-full min-h-[120px] rounded-xl border border-slate-200 bg-white p-2 text-[11px] font-bold text-slate-800 outline-none focus:border-blue-300 transition-all shadow-sm"
                                >
                                    {teacherOptions.map(t => (
                                        <option key={t.id} value={t.id} className="p-2 rounded-lg m-0.5 checked:bg-blue-600 checked:text-white">
                                            {t.label}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-[9px] text-slate-400 mt-2 italic px-1">Hold Ctrl/Cmd to select multiple faculty members</p>
                            </div>
                        </div>

                        {/* Section: Academic Spectrum */}
                        <div className="space-y-4 pt-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-6 w-6 rounded-lg bg-purple-50 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-purple-600 text-sm font-black">schema</span>
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">03. Academic Spectrum *</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <input
                                        type="text"
                                        value={newSubject}
                                        onChange={(e) => setNewSubject(e.target.value)}
                                        placeholder="Add..."
                                        className="h-6 w-16 rounded border border-slate-200 bg-white px-1.5 text-[9px] font-bold text-slate-700 outline-none focus:border-amber-400"
                                    />
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            if (!newSubject.trim()) return;
                                            try {
                                                setAddingSubject(true);

                                                await onAddSubject(newSubject.trim());
                                                setForm(f => ({ ...f, subjects: [...(f.subjects || []), { name: newSubject.trim(), total_marks: 100, passing_marks: 33 }] }));

                                                setNewSubject("");
                                            } finally {
                                                setAddingSubject(false);
                                            }
                                        }}
                                        disabled={addingSubject || !newSubject.trim()}
                                        className="h-6 w-6 flex items-center justify-center rounded bg-amber-50 text-amber-600 border border-amber-100 hover:bg-amber-100 disabled:opacity-50"
                                    >
                                        <span className="material-symbols-outlined text-[14px]">add</span>
                                    </button>
                                </div>
                            </div>
                            <div className="pl-1">
                                <select
                                    multiple
                                    value={currentForm.subjects.map(s => s.name)}
                                    onChange={(e) => {
                                        const selectedNames = Array.from(e.target.selectedOptions, option => option.value);
                                        const updatedSubjects = selectedNames.map(name => {
                                            const existing = currentForm.subjects.find(s => s.name === name);
                                            return existing || { name, total_marks: 100, passing_marks: 33 };
                                        });
                                        setForm({ ...form, subjects: updatedSubjects });
                                    }}
                                    className={`w-full min-h-[120px] rounded-xl border ${errors.subjects ? 'border-red-300 bg-red-50/10' : 'border-slate-200'} bg-white p-2 text-[11px] font-bold text-slate-800 outline-none focus:border-purple-300 transition-all shadow-sm`}
                                >
                                    {subjectOptions.map(s => (
                                        <option key={s.id} value={s.label} className="p-2 rounded-lg m-0.5 checked:bg-purple-600 checked:text-white">
                                            {s.label}
                                        </option>
                                    ))}
                                </select>
                                {errors.subjects ? (
                                    <p className="text-[9px] font-black text-red-500 uppercase tracking-widest mt-2 px-1">{errors.subjects}</p>
                                ) : (
                                    <p className="text-[9px] text-slate-400 mt-2 italic px-1">Update curriculum mappings for this session</p>
                                )}
                            </div>
                        </div>
                    </form>
                </div>

                {/* Sticky Footer - Always visible premium actions */}
                <div className="shrink-0 flex items-center gap-3 border-t border-slate-100 bg-white px-6 py-5 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
                    <button
                        onClick={handleClose}
                        className="h-11 flex-1 rounded-xl border border-slate-200 px-4 text-[10px] font-black uppercase tracking-widest text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-95"
                    >
                        Discard
                    </button>
                    <button
                        onClick={() => void handleSubmit({ preventDefault: () => {} } as any)}
                        disabled={isSaving || !currentForm.name || !currentForm.academy_care_id}
                        className="h-11 flex-[2] rounded-xl bg-slate-900 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-slate-900/10 transition-all hover:bg-slate-800 active:scale-95 disabled:opacity-30 flex items-center justify-center gap-2"
                    >
                        {isSaving ? (
                            <>
                                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Syncing...</span>
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-base">task_alt</span>
                                <span>Commit Changes</span>
                            </>
                        )}
                    </button>
                </div>
            </aside>
        </>
    );
}
