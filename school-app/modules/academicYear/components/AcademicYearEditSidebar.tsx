"use client";

import { useState, FormEvent } from "react";
import { AcademicYearRow, AcademicYearUpdateInput } from "../types/academicYear.types";
import { Button, Input } from "../../../components/ui";

export function AcademicYearEditSidebar({
    academicYear,
    isOpen,
    onClose,
    onSave,
    isSaving,
}: {
    academicYear: AcademicYearRow | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (id: string, data: AcademicYearUpdateInput) => Promise<void>;
    isSaving: boolean;
}) {
    const [form, setForm] = useState<Partial<AcademicYearUpdateInput>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});

    if (!academicYear) return null;

    const currentForm = {
        year: form.year ?? academicYear.year ?? "",
        start_date: form.start_date ?? academicYear.start_date?.split("T")[0] ?? "",
        end_date: form.end_date ?? academicYear.end_date?.split("T")[0] ?? "",
        is_active: form.is_active ?? academicYear.is_active ?? false,
        description: form.description ?? academicYear.description ?? "",
    };

    function validate() {
        const newErrors: Record<string, string> = {};
        if (!currentForm.year.trim()) newErrors.year = "Year is required";
        if (!currentForm.start_date) newErrors.start_date = "Start date is required";
        if (!currentForm.end_date) newErrors.end_date = "End date is required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    async function handleSubmit(e?: FormEvent) {
        e?.preventDefault();
        if (!validate() || !academicYear) return;
        await onSave(academicYear._id, {
            year: currentForm.year,
            start_date: currentForm.start_date,
            end_date: currentForm.end_date,
            is_active: currentForm.is_active,
            description: currentForm.description,
        });
        handleClose();
    }

    function handleClose() {
        setForm({});
        setErrors({});
        onClose();
    }

    return (
        <>
            {/* Overlay - Deeper backdrop to eliminate "white screen" feel */}
            <div
                className={`fixed inset-0 bg-slate-900/80 z-[9998] transition-opacity duration-300 ${
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
                onClick={handleClose}
            />

            {/* Drawer - Linear/Stripe inspired high-density panel */}
            <aside
                className={`fixed top-0 right-0 z-[9999] flex h-screen w-full max-w-sm transform flex-col bg-white shadow-[0_0_50px_-12px_rgba(0,0,0,0.25)] transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${
                    isOpen ? "translate-x-0" : "translate-x-full"
                }`}
            >
                {/* Sticky Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/80 px-4 py-3 backdrop-blur-md">
                    <div>
                        <h2 className="text-sm font-black tracking-tight text-slate-900 uppercase">Edit Session</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{academicYear.year}</p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-90"
                    >
                        <span className="material-symbols-outlined text-base">close</span>
                    </button>
                </div>

                {/* Content - Scrollable area with better rhythm */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <form onSubmit={handleSubmit} className="p-4 space-y-6">
                        {/* Section: Basic Configuration */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-600">01. Identity</span>
                                <div className="h-px flex-1 bg-slate-100" />
                            </div>
                            
                            <div className="space-y-4">
                                <Input
                                    label="Label"
                                    value={currentForm.year}
                                    onChange={(e) => setForm({ ...form, year: e.target.value })}
                                    required
                                    placeholder="e.g. 2024-2025"
                                    error={errors.year}
                                    className="bg-slate-50/50 border-slate-200/60 focus:bg-white transition-all text-sm font-bold"
                                />

                                <div className="space-y-1.5">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Visibility Status</span>
                                    <button 
                                        type="button"
                                        onClick={() => setForm({ ...form, is_active: !currentForm.is_active })}
                                        className={`flex w-full items-center justify-between rounded-lg border p-2.5 transition-all duration-300 ${currentForm.is_active ? 'border-blue-500 bg-blue-50/50 text-blue-700 shadow-[0_2px_10px_-4px_rgba(59,130,246,0.3)]' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'}`}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <div className={`flex h-4 w-4 items-center justify-center rounded-full border transition-all ${currentForm.is_active ? 'border-blue-600 bg-blue-600' : 'border-slate-300'}`}>
                                                {currentForm.is_active && <span className="material-symbols-outlined text-[10px] font-black text-white">check</span>}
                                            </div>
                                            <span className="text-xs font-black uppercase tracking-tight">Active Primary Session</span>
                                        </div>
                                        {currentForm.is_active && <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Section: Schedule */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-600">02. Timeline</span>
                                <div className="h-px flex-1 bg-slate-100" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <Input
                                    label="Commences"
                                    type="date"
                                    value={currentForm.start_date}
                                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                                    error={errors.start_date}
                                    required
                                    className="bg-slate-50/50 border-slate-200/60 focus:bg-white transition-all text-xs font-bold"
                                />
                                <Input
                                    label="Concludes"
                                    type="date"
                                    value={currentForm.end_date}
                                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                                    error={errors.end_date}
                                    required
                                    className="bg-slate-50/50 border-slate-200/60 focus:bg-white transition-all text-xs font-bold"
                                />
                            </div>
                        </div>

                        {/* Section: metadata */}
                        <div className="space-y-4 pb-4">
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-600">03. Context</span>
                                <div className="h-px flex-1 bg-slate-100" />
                            </div>
                            <div className="space-y-1.5">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Description</span>
                                <textarea
                                    value={currentForm.description || ""}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    placeholder="Add session specific notes..."
                                    className="w-full h-24 rounded-lg border border-slate-200 bg-slate-50/50 p-2.5 text-xs font-bold text-slate-700 outline-none transition-all focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/5 placeholder:text-slate-300 resize-none"
                                />
                            </div>
                        </div>
                    </form>
                </div>

                {/* Sticky Footer - Always visible actions */}
                <div className="sticky bottom-0 z-10 flex items-center gap-2 border-t border-slate-100 bg-white/95 px-4 py-3.5 backdrop-blur-md">
                    <button
                        onClick={handleClose}
                        className="h-9 flex-1 rounded-lg border border-slate-200 px-4 text-[10px] font-black uppercase tracking-widest text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-95"
                    >
                        Discard
                    </button>
                    <Button
                        onClick={() => void handleSubmit()}
                        disabled={isSaving || !currentForm.year || !currentForm.start_date || !currentForm.end_date}
                        className="h-9 flex-[1.5] rounded-lg bg-blue-600 py-0 text-[10px] font-black uppercase tracking-widest shadow-[0_4px_12px_-4px_rgba(59,130,246,0.5)] transition-all hover:bg-blue-700 active:scale-95 disabled:opacity-50"
                    >
                        {isSaving ? (
                            <div className="flex items-center gap-2">
                                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Syncing...</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-base">cloud_done</span>
                                <span>Update Session</span>
                            </div>
                        )}
                    </Button>
                </div>
            </aside>
        </>
    );
}
