import { motion, AnimatePresence } from "framer-motion";
import { AcademicYearRow } from "../types/academicYear.types";

interface DeleteSessionSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    session: AcademicYearRow | null;
    isLoading: boolean;
}

export function DeleteSessionSidebar({
    isOpen,
    onClose,
    onConfirm,
    session,
    isLoading
}: DeleteSessionSidebarProps) {
    if (!session) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop - Transparent */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-transparent z-[99998]"
                    />

                    {/* Sidebar Panel */}
                    <motion.aside
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed inset-y-0 right-0 w-full max-w-sm bg-white z-[99999] shadow-[-20px_0_60px_-12px_rgba(15,23,42,0.1)] flex flex-col border-l border-blue-50"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-blue-50 bg-white">
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-xl bg-red-50 flex items-center justify-center border border-red-100">
                                    <span className="material-symbols-outlined text-red-600 text-[20px]">delete_forever</span>
                                </div>
                                <div>
                                    <h2 className="text-[12px] font-bold text-slate-900 uppercase tracking-tight">Delete Session</h2>
                                    <p className="text-[10px] font-medium text-red-500 normal-case mt-0.5">Dangerous Action</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-all"
                            >
                                <span className="material-symbols-outlined text-xl">close</span>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
                            <div className="p-4 rounded-2xl bg-red-50 border border-red-100 flex items-start gap-3">
                                <span className="material-symbols-outlined text-red-600 text-sm">warning</span>
                                <p className="text-[11px] font-bold text-red-900 leading-relaxed">
                                    Are you sure you want to permanently delete the <span className="underline">"{session.year}"</span> session?
                                </p>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Impact Analysis</h4>
                                <div className="space-y-3">
                                    {[
                                        "All class associations for this year will be detached.",
                                        "Attendance records for this session will be archived.",
                                        "Exam results and grading schemas will be lost.",
                                        "Fee structures linked to this cycle will be removed."
                                    ].map((impact, i) => (
                                        <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100/50">
                                            <span className="h-4 w-4 rounded-lg bg-white flex items-center justify-center text-[9px] font-bold text-slate-400 border border-slate-100 shrink-0 mt-0.5">{i + 1}</span>
                                            <span className="text-[11px] font-medium text-slate-600 leading-relaxed">{impact}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100/50">
                                <p className="text-[10px] font-bold text-blue-800 leading-relaxed">
                                    Tip: If you only want to close the session, consider setting it to "Inactive" instead of deleting it.
                                </p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 bg-white border-t border-blue-50 space-y-3">
                            <button
                                onClick={onConfirm}
                                disabled={isLoading}
                                className="w-full h-11 rounded-xl bg-red-600 text-white text-[11px] font-bold uppercase tracking-widest shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                {isLoading && (
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                )}
                                Delete Permanently
                            </button>
                            <button
                                onClick={onClose}
                                disabled={isLoading}
                                className="w-full h-11 rounded-xl border border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all"
                            >
                                Keep Session
                            </button>
                        </div>
                    </motion.aside>
                </>
            )}
        </AnimatePresence>
    );
}
