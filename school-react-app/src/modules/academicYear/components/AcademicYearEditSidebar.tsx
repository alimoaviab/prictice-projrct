import { AppIcon } from "shared/ui/AppIcon";
import { useState, FormEvent } from "react";
import { AcademicYearRow, AcademicYearUpdateInput } from "../types/academicYear.types";
import { Button, Input } from "@/components/ui";

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
                className={`fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[9998] transition-opacity duration-400 ease-out ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                    }`}
                onClick={handleClose}
            />

            {/* Drawer - Linear/Stripe inspired high-density panel */}
            {/* Drawer - Viewport-based Flex Column Architecture */}
            <aside
                className={`fixed inset-y-0 right-0 z-[9999] flex h-full w-full max-w-sm transform flex-col bg-white shadow-[-20px_0_50px_-12px_rgba(0,0,0,0.15)] overflow-hidden ${isOpen ? "translate-x-0" : "translate-x-full"
                    }`}
                style={{ transition: "transform 400ms cubic-bezier(0.32, 0.72, 0, 1)" }}
            >
                {/* Fixed Header - shrink-0 */}
                <div className="shrink-0 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
                    <div>
                        <h2 className="text-[13px] font-bold tracking-tight text-slate-900">Edit Session</h2>
                        <p className="text-[10px] font-bold text-slate-400 normal-case  mt-0.5">{academicYear.year}</p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                    >
                        <AppIcon name="X" size={18} />
                    </button>
                </div>

                {/* Scrollable Middle Content - flex-1 overflow-y-auto */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
                    <form id="academic-year-form" onSubmit={handleSubmit} className="p-6 space-y-8">
                        {/* Section: Session Details */}
                        <div className="space-y-5">
                            <h3 className="text-[10px] font-bold normal-case tracking-[0.2em] text-slate-400 border-b border-slate-50 pb-2">Session Details</h3>

                            <div className="space-y-5">
                                <Input
                                    label="Session Name"
                                    value={currentForm.year}
                                    onChange={(e) => setForm({ ...form, year: e.target.value })}
                                    required
                                    placeholder="e.g. 2025-2026"
                                    error={errors.year}
                                    className="h-10 bg-white border-slate-200 focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all text-sm font-bold rounded-lg"
                                />

                                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <p className="text-[10px] font-bold normal-case tracking-tight text-slate-900">Active Session</p>
                                            <p className="text-[9px] font-medium text-slate-500">Only one session can be active at a time.</p>
                                        </div>
                                        <label className="relative inline-flex cursor-pointer items-center">
                                            <input
                                                type="checkbox"
                                                checked={currentForm.is_active}
                                                onChange={() => setForm({ ...form, is_active: !currentForm.is_active })}
                                                className="peer sr-only"
                                            />
                                            <div className="peer h-[18px] w-[34px] rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-[14px] after:w-[14px] after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-[16px] peer-focus:outline-none" />
                                        </label>
                                    </div>
                                    
                                    {currentForm.is_active && !academicYear.is_active && (
                                        <div className="flex items-start gap-2 p-2 rounded-lg bg-blue-50/50 border border-blue-100">
                                            <AppIcon name="Info" size={14} className="text-blue-600" />
                                            <p className="text-[9px] font-bold text-blue-800 leading-snug">
                                                Activating this session will automatically archive the currently active academic year.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Section: Timeline */}
                        <div className="space-y-5">
                            <h3 className="text-[10px] font-bold normal-case tracking-[0.2em] text-slate-400 border-b border-slate-50 pb-2">Timeline</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="Start Date"
                                    type="date"
                                    value={currentForm.start_date}
                                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                                    error={errors.start_date}
                                    required
                                    className="h-10 bg-white border-slate-200 focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all text-xs font-bold rounded-lg"
                                />
                                <Input
                                    label="End Date"
                                    type="date"
                                    value={currentForm.end_date}
                                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                                    error={errors.end_date}
                                    required
                                    className="h-10 bg-white border-slate-200 focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all text-xs font-bold rounded-lg"
                                />
                            </div>
                        </div>

                        {/* Section: Notes */}
                        <div className="space-y-5">
                            <h3 className="text-[10px] font-bold normal-case tracking-[0.2em] text-slate-400 border-b border-slate-50 pb-2">Notes</h3>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold normal-case  text-slate-500 pl-1">Administrative Notes</label>
                                <textarea
                                    value={currentForm.description || ""}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    placeholder="Optional notes about this session cycle..."
                                    className="w-full h-28 rounded-xl border border-slate-200 bg-white p-3.5 text-xs font-bold text-slate-700 outline-none transition-all focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 placeholder:text-slate-300 resize-none leading-relaxed"
                                />
                            </div>
                        </div>
                    </form>
                </div>

                {/* Fixed Footer Action Area - shrink-0 sticky */}
                <div className="shrink-0 flex items-center gap-3 border-t border-slate-100 bg-slate-50/80 px-6 py-2.5">
                    <button
                        onClick={handleClose}
                        className="h-9 flex-1 rounded-lg border border-slate-200 px-4 text-[10px] font-bold normal-case  text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900"
                    >
                        Cancel
                    </button>
                    <button
                        form="academic-year-form"
                        type="submit"
                        disabled={isSaving || !currentForm.year || !currentForm.start_date || !currentForm.end_date}
                        className="h-9 flex-[2] rounded-lg bg-blue-600 text-[10px] font-bold normal-case  text-white transition-all hover:bg-blue-700 active:scale-95 disabled:opacity-30 flex items-center justify-center gap-2"
                    >
                        {isSaving ? (
                            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <span>Save Changes</span>
                        )}
                    </button>
                </div>
            </aside>
        </>
    );
}
