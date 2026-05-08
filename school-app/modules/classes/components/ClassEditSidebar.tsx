"use client";

import { useState, FormEvent } from "react";
import { ClassRow, ClassFormInput } from "../types/class.types";

export function ClassEditSidebar({
    classItem,
    isOpen,
    academyCareOptions,
    teacherOptions,
    subjectOptions,
    onClose,
    onSave,
    isSaving,
}: {
    classItem: ClassRow | null;
    isOpen: boolean;
    academyCareOptions: Array<{ id: string; label: string }>;
    teacherOptions: Array<{ id: string; label: string }>;
    subjectOptions: Array<{ id: string; label: string }>;
    onClose: () => void;
    onSave: (id: string, data: Partial<ClassFormInput>) => Promise<void>;
    isSaving: boolean;
}) {
    const [form, setForm] = useState<Partial<ClassFormInput>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});

    if (!classItem) return null;

    const currentForm = {
        name: form.name ?? classItem.name ?? "",
        academy_care_id: form.academy_care_id ?? classItem.academy_care_id ?? "",
        teacher_ids: form.teacher_ids ?? classItem.teacher_ids ?? [],
        subjects: form.subjects ?? classItem.subjects ?? [],
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
            academy_care_id: currentForm.academy_care_id,
            teacher_ids: currentForm.teacher_ids,
            subjects: currentForm.subjects,
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
                        <div className="space-y-5 pt-4">
                            <div className="flex items-center gap-3">
                                <div className="h-6 w-6 rounded-lg bg-emerald-50 flex items-center justify-center">
                                  <span className="material-symbols-outlined text-emerald-600 text-sm font-black">school</span>
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">02. Faculty Assignment</span>
                            </div>
                            <div className="grid grid-cols-1 gap-2 pl-1 max-h-[180px] overflow-y-auto custom-scrollbar pr-1">
                                {teacherOptions.map((teacher) => {
                                    const isChecked = currentForm.teacher_ids.includes(teacher.id);
                                    return (
                                        <label
                                            key={teacher.id}
                                            className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${isChecked ? "bg-white border-blue-500 shadow-[0_4px_12px_-4px_rgba(59,130,246,0.15)]" : "bg-white border-slate-100 hover:border-slate-200"}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`flex h-4 w-4 items-center justify-center rounded border transition-all ${isChecked ? "bg-blue-600 border-blue-600" : "bg-slate-50 border-slate-200"}`}>
                                                    {isChecked && <span className="material-symbols-outlined text-[10px] font-black text-white">check</span>}
                                                </div>
                                                <span className={`text-[11px] font-bold ${isChecked ? "text-slate-900" : "text-slate-500"}`}>{teacher.label}</span>
                                            </div>
                                            {isChecked && <div className="h-1.5 w-1.5 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />}
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                className="hidden"
                                                onChange={(e) => {
                                                    const newIds = e.target.checked
                                                        ? [...currentForm.teacher_ids, teacher.id]
                                                        : currentForm.teacher_ids.filter((id) => id !== teacher.id);
                                                    setForm({ ...form, teacher_ids: newIds });
                                                }}
                                            />
                                        </label>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Section: Academic Mapping */}
                        <div className="space-y-5 pt-4">
                            <div className="flex items-center gap-3">
                                <div className="h-6 w-6 rounded-lg bg-purple-50 flex items-center justify-center">
                                  <span className="material-symbols-outlined text-purple-600 text-sm font-black">schema</span>
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">03. Academic Spectrum</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 pl-1 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                                {subjectOptions.map((subject) => {
                                    const isChecked = currentForm.subjects.includes(subject.label);
                                    return (
                                        <label
                                            key={subject.id}
                                            className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer ${isChecked ? "bg-white border-blue-500 shadow-sm" : "bg-white border-slate-100 hover:border-slate-200"}`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                className="hidden"
                                                onChange={(e) => {
                                                    const newSubjects = e.target.checked
                                                        ? [...currentForm.subjects, subject.label]
                                                        : currentForm.subjects.filter((name) => name !== subject.label);
                                                    setForm({ ...form, subjects: newSubjects });
                                                }}
                                            />
                                            <div className={`h-3 w-3 rounded-sm border transition-all ${isChecked ? "bg-blue-600 border-blue-600" : "bg-slate-50 border-slate-200"}`}>
                                                {isChecked && <span className="material-symbols-outlined text-[8px] font-black text-white flex items-center justify-center">check</span>}
                                            </div>
                                            <span className={`text-[10px] font-bold truncate ${isChecked ? "text-slate-900" : "text-slate-500"}`}>{subject.label}</span>
                                        </label>
                                    );
                                })}
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
