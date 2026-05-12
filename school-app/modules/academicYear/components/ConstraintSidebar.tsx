"use client";

import { motion, AnimatePresence } from "framer-motion";

interface ConstraintSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    reason?: string;
}

export function ConstraintSidebar({ isOpen, onClose, title, message, reason }: ConstraintSidebarProps) {
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
                        {/* Header - Clean Blue/White */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-blue-50 bg-white">
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100">
                                    <span className="material-symbols-outlined text-blue-600 text-[20px]">security</span>
                                </div>
                                <div>
                                    <h2 className="text-[12px] font-bold text-slate-900 uppercase tracking-tight">System Constraint</h2>
                                    <p className="text-[10px] font-medium text-blue-500 normal-case mt-0.5">Session Integrity Policy</p>
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
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div className="space-y-3">
                                <h3 className="text-lg font-bold text-slate-900 tracking-tight leading-snug">
                                    {title}
                                </h3>
                                <p className="text-xs font-medium text-slate-500 leading-relaxed">
                                    {message}
                                </p>
                            </div>

                            {/* Required Action - Medium Sized Card */}
                            <div className="relative p-5 rounded-2xl bg-blue-600 text-white overflow-hidden shadow-lg shadow-blue-600/20">
                                <div className="absolute top-0 right-0 -translate-y-2 translate-x-2 h-20 w-20 bg-white/10 rounded-full blur-2xl" />
                                <div className="relative z-10 flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-md border border-white/20 shrink-0">
                                        <span className="material-symbols-outlined text-2xl text-white">info</span>
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-white" >Required Action</p>
                                        <p className="text-[11px] font-bold leading-snug text-white">At least one active cycle must be maintained to prevent system errors.</p>
                                    </div>
                                </div>
                            </div>

                            {reason && (
                                <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100/50">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <span className="material-symbols-outlined text-blue-600 text-xs">terminal</span>
                                        <p className="text-[9px] font-bold uppercase tracking-wider text-blue-600/70">System Diagnostics</p>
                                    </div>
                                    <p className="text-xs font-semibold text-blue-900 leading-relaxed italic">"{reason}"</p>
                                </div>
                            )}

                            <div className="space-y-4 pt-2">
                                <h4 className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Operational Guidelines</h4>
                                <ul className="space-y-3">
                                    {[
                                        "Activate a new session before deactivating this one.",
                                        "Ensure all pending grade sheets are closed.",
                                        "Verify class enrollment transitions are mapped."
                                    ].map((step, i) => (
                                        <li key={i} className="flex items-start gap-3">
                                            <span className="h-5 w-5 rounded-lg bg-blue-50 flex items-center justify-center text-[10px] font-bold text-blue-600 shrink-0 mt-0.5">{i + 1}</span>
                                            <span className="text-xs font-medium text-slate-600 leading-relaxed">{step}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 bg-white border-t border-blue-50">
                            <button
                                onClick={onClose}
                                className="w-full h-11 rounded-xl bg-blue-600 text-white text-[11px] font-bold uppercase tracking-widest shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-[0.98]"
                            >
                                Acknowledge & Close
                            </button>
                        </div>
                    </motion.aside>
                </>
            )}
        </AnimatePresence>
    );
}
