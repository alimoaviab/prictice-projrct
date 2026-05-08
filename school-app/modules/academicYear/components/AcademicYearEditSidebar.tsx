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
            {/* Overlay - Subtler backdrop for better context retention */}
            <div
                className={`fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[9998] transition-opacity duration-500 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                    }`}
                onClick={handleClose}
            />

            {/* Drawer - Linear/Stripe inspired high-density panel */}
            {/* Drawer - Viewport-based Flex Column Architecture */}
            <aside
                className={`fixed inset-y-0 right-0 z-[9999] flex h-full w-full max-w-sm transform flex-col bg-white shadow-[-20px_0_50px_-12px_rgba(0,0,0,0.15)] transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) overflow-hidden ${isOpen ? "translate-x-0" : "translate-x-full"
                    }`}
            >
                {/* Fixed Header - shrink-0 */}
                <div className="shrink-0 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5">
                    <div>
                        <div className="flex items-center gap-2 mb-0.5">
                            <div className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
                            <h2 className="text-xs font-black tracking-[0.15em] text-slate-900 uppercase">Manage Session</h2>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Configuration Panel — {academicYear.year}</p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-900 border border-slate-100"
                    >
                        <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                </div>

                {/* Scrollable Middle Content - flex-1 overflow-y-auto */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#FBFCFF]">
                    <form id="academic-year-form" onSubmit={handleSubmit} className="p-6 space-y-8">
                        {/* Section: 01. Identification */}
                        <div className="space-y-5">
                            <div className="flex items-center gap-3">
                                <div className="h-6 w-6 rounded-lg bg-blue-50 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-blue-600 text-sm font-black">fingerprint</span>
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">01. Session Identity</span>
                            </div>

                            <div className="grid gap-5 pl-1">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">Session Label</label>
                                    <Input
                                        value={currentForm.year}
                                        onChange={(e) => setForm({ ...form, year: e.target.value })}
                                        required
                                        placeholder="e.g. 2024-2025"
                                        error={errors.year}
                                        className="h-11 bg-white border-slate-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5 transition-all text-sm font-bold rounded-xl"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">Visibility Status</label>
                                    <button
                                        type="button"
                                        onClick={() => setForm({ ...form, is_active: !currentForm.is_active })}
                                        className={`flex w-full items-center justify-between rounded-xl border p-4 transition-all duration-300 ${currentForm.is_active ? 'border-blue-500 bg-white text-blue-700 shadow-sm' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`flex h-5 w-5 items-center justify-center rounded-full border transition-all ${currentForm.is_active ? 'border-blue-600 bg-blue-600' : 'border-slate-300'}`}>
                                                {currentForm.is_active && <span className="material-symbols-outlined text-[10px] font-black text-white">check</span>}
                                            </div>
                                            <div className="text-left">
                                                <p className="text-[11px] font-black uppercase tracking-tight">Active Stream</p>
                                                <p className="text-[9px] font-bold text-slate-400">Set as the primary school session</p>
                                            </div>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Section: 02. Timeline */}
                        <div className="space-y-5 pt-2">
                            <div className="flex items-center gap-3">
                                <div className="h-6 w-6 rounded-lg bg-emerald-50 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-emerald-600 text-sm font-black">schedule</span>
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">02. Operational Timeline</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 pl-1">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">Commences</label>
                                    <Input
                                        type="date"
                                        value={currentForm.start_date}
                                        onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                                        error={errors.start_date}
                                        required
                                        className="h-11 bg-white border-slate-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5 transition-all text-xs font-bold rounded-xl"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">Concludes</label>
                                    <Input
                                        type="date"
                                        value={currentForm.end_date}
                                        onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                                        error={errors.end_date}
                                        required
                                        className="h-11 bg-white border-slate-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5 transition-all text-xs font-bold rounded-xl"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section: 03. Context */}
                        <div className="space-y-5 pt-2">
                            <div className="flex items-center gap-3">
                                <div className="h-6 w-6 rounded-lg bg-purple-50 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-purple-600 text-sm font-black">notes</span>
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">03. Contextual Notes</span>
                            </div>
                            <div className="space-y-1.5 pl-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">Internal Description</label>
                                <textarea
                                    value={currentForm.description || ""}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    placeholder="Operational notes..."
                                    className="w-full h-32 rounded-xl border border-slate-200 bg-white p-4 text-xs font-bold text-slate-700 outline-none transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5 placeholder:text-slate-300 resize-none leading-relaxed"
                                />
                            </div>
                        </div>
                    </form>
                </div>

                {/* Fixed Footer Action Area - shrink-0 sticky */}
                <div className="shrink-0 flex items-center gap-3 border-t border-slate-100 bg-white px-6 py-5 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
                    <button
                        onClick={handleClose}
                        className="h-11 flex-1 rounded-xl border border-slate-200 px-4 text-[10px] font-black uppercase tracking-widest text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-95"
                    >
                        Cancel
                    </button>
                    <button
                        form="academic-year-form"
                        type="submit"
                        disabled={isSaving || !currentForm.year || !currentForm.start_date || !currentForm.end_date}
                        className="h-11 flex-[2] rounded-xl bg-slate-900 text-[10px] font-black uppercase tracking-widest text-white shadow-lg transition-all hover:bg-slate-800 active:scale-95 disabled:opacity-30 flex items-center justify-center gap-2"
                    >
                        {isSaving ? (
                            <>
                                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Saving...</span>
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-base">task_alt</span>
                                <span>Save Changes</span>
                            </>
                        )}
                    </button>
                </div>
            </aside>
        </>
    );
}
