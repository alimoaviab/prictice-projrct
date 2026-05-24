import { AppIcon } from "shared/ui/AppIcon";
/**
 * Parent leave portal — apply for leave on behalf of the active child
 * and watch admin approval status in real time.
 *
 * Why a dedicated page (separate from StudentLeavePage):
 *   - Parent backend list is scoped to all linked children, not one
 *     student record. We render the child's name + class on every
 *     row so a multi-child guardian can tell whose leave is whose.
 *   - The submission modal binds the form to the currently selected
 *     child via SelectedChildContext. The backend re-validates the
 *     binding so a tampered request is still safe.
 *   - The admin reviewer page shows ANY school leave; this page is
 *     the "guardian's view" — submitted, pending, decided. We use
 *     timeline-style cards instead of a dense table because parents
 *     typically have few records and benefit from at-a-glance status.
 */

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLeave } from "../hooks/useLeave";
import { LeaveFormInput, LeaveRecordRow } from "../types/leave.types";
import { useSelectedChild } from "@/contexts/SelectedChildContext";
import { Button, DataState, Input, Select, StatCardGrid } from "@/components/ui";
import { showToast } from "@/utils/toast";

const TYPE_OPTIONS: { value: LeaveFormInput["leave_type"]; label: string; icon: string }[] =
  [
    { value: "sick", label: "Sick", icon: "medical_services" },
    { value: "personal", label: "Personal", icon: "person" },
    { value: "family", label: "Family", icon: "family_restroom" },
    { value: "vacation", label: "Vacation", icon: "beach_access" },
    { value: "other", label: "Other", icon: "more_horiz" },
  ];

const TYPE_ACCENT: Record<string, string> = {
    sick: "bg-rose-50 text-rose-600 border-rose-100",
    personal: "bg-blue-50 text-blue-600 border-blue-100",
    family: "bg-violet-50 text-violet-600 border-violet-100",
    vacation: "bg-amber-50 text-amber-600 border-amber-100",
    other: "bg-slate-50 text-slate-600 border-slate-100",
};

const STATUS_STYLE: Record<
    string,
    { label: string; pill: string; ring: string; icon: string }
> = {
    pending: {
        label: "Pending review",
        pill: "bg-amber-50 text-amber-700 border-amber-200",
        ring: "ring-amber-200/60",
        icon: "hourglass_empty",
    },
    approved: {
        label: "Approved",
        pill: "bg-emerald-50 text-emerald-700 border-emerald-200",
        ring: "ring-emerald-200/60",
        icon: "verified",
    },
    rejected: {
        label: "Rejected",
        pill: "bg-rose-50 text-rose-700 border-rose-200",
        ring: "ring-rose-200/60",
        icon: "cancel",
    },
    cancelled: {
        label: "Cancelled",
        pill: "bg-slate-50 text-slate-600 border-slate-200",
        ring: "ring-slate-200/60",
        icon: "block",
    },
};

function fmtDate(s: string) {
    if (!s) return "—";
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return s;
    return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

function daySpan(start: string, end: string): number {
    const a = new Date(start);
    const b = new Date(end);
    if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 1;
    return Math.max(1, Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)) + 1);
}

export default function ParentLeavePage() {
    const { state, addLeave, deleteLeave } = useLeave();
    const { selectedChild, children, loading: childLoading } = useSelectedChild();

    const [open, setOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState<
        "all" | "pending" | "approved" | "rejected" | "cancelled"
    >("all");

    // Stats reflect the full unfiltered set so guardians see the true
    // picture even while filtering down for a specific status.
    const stats = useMemo(() => {
        const rows = state.data || [];
        return {
            total: rows.length,
            pending: rows.filter((r) => r.status === "pending").length,
            approved: rows.filter((r) => r.status === "approved").length,
            rejected: rows.filter((r) => r.status === "rejected").length,
        };
    }, [state.data]);

    const filtered = useMemo(() => {
        const rows = state.data || [];
        if (statusFilter === "all") return rows;
        return rows.filter((r) => r.status === statusFilter);
    }, [state.data, statusFilter]);

    async function handleSubmit(input: LeaveFormInput) {
        const res = await addLeave(input);
        if ((res as any).ok) {
            setOpen(false);
        }
    }

    const noChildren = !childLoading && children.length === 0;

    return (
        <div className="space-y-6 pb-12">
            {/* Hero card */}
            <div className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-700 p-6 md:p-8 shadow-lg shadow-blue-600/20">
                <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
                <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-blue-100">
                            Guardian portal
                        </p>
                        <h2 className="text-xl md:text-2xl font-bold text-white mt-1">
                            Leave applications
                        </h2>
                        <p className="text-sm text-blue-100/90 mt-1.5 max-w-xl">
                            Apply for leave on your child's behalf. The school admin will
                            review and notify you once a decision is made.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {selectedChild && (
                            <div className="hidden md:flex items-center gap-2 rounded-2xl bg-white/15 backdrop-blur px-3 py-2 border border-white/20">
                                <div className="h-8 w-8 rounded-lg bg-white/30 flex items-center justify-center text-white text-[11px] font-bold">
                                    {selectedChild.student_name.substring(0, 1)}
                                </div>
                                <div className="text-left">
                                    <p className="text-[11px] font-bold text-white leading-tight">
                                        {selectedChild.student_name}
                                    </p>
                                    <p className="text-[10px] text-blue-100">
                                        {selectedChild.class_name}
                                        {selectedChild.class_section
                                            ? ` · ${selectedChild.class_section}`
                                            : ""}
                                    </p>
                                </div>
                            </div>
                        )}
                        <button
                            type="button"
                            disabled={noChildren || !selectedChild}
                            onClick={() => setOpen(true)}
                            className="h-10 px-4 rounded-xl bg-white text-blue-700 text-[12px] font-bold shadow-md hover:bg-blue-50 active:scale-[0.98] transition-all inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <AppIcon name="CalendarDays" size={18} />
                            Apply for leave
                        </button>
                    </div>
                </div>
            </div>

            {noChildren && (
                <DataState
                    variant="empty"
                    title="No linked child found"
                    message="Your account isn't linked to a student yet. Reach out to the school admin to link your guardian profile."
                />
            )}

            {!noChildren && (
                <>
                    <StatCardGrid
                        items={[
                            {
                                label: "Total applications",
                                value: stats.total,
                                icon: "event_note",
                                accent: "blue",
                            },
                            {
                                label: "Pending review",
                                value: stats.pending,
                                icon: "hourglass_empty",
                                accent: "amber",
                            },
                            {
                                label: "Approved",
                                value: stats.approved,
                                icon: "verified",
                                accent: "emerald",
                            },
                            {
                                label: "Rejected",
                                value: stats.rejected,
                                icon: "cancel",
                                accent: "rose",
                            },
                        ]}
                    />

                    {/* Filter chips */}
                    <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar -mx-1 px-1">
                        {(
                            [
                                { id: "all", label: "All" },
                                { id: "pending", label: "Pending" },
                                { id: "approved", label: "Approved" },
                                { id: "rejected", label: "Rejected" },
                                { id: "cancelled", label: "Cancelled" },
                            ] as const
                        ).map((chip) => {
                            const isActive = statusFilter === chip.id;
                            return (
                                <button
                                    key={chip.id}
                                    onClick={() => setStatusFilter(chip.id as any)}
                                    type="button"
                                    className={`h-8 px-3 rounded-full text-[11px] font-bold whitespace-nowrap border transition-all ${
                                        isActive
                                            ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                                            : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-900"
                                    }`}
                                >
                                    {chip.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Timeline of applications */}
                    {state.status === "loading" && !state.data ? (
                        <LeaveListSkeleton />
                    ) : filtered.length === 0 ? (
                        <DataState
                            variant="empty"
                            title={
                                statusFilter === "all"
                                    ? "No leave applications yet"
                                    : `No ${statusFilter} requests`
                            }
                            message={
                                statusFilter === "all"
                                    ? "Apply for leave above and the school admin will review it here."
                                    : "Try a different filter to see other applications."
                            }
                        />
                    ) : (
                        <div className="space-y-3">
                            {filtered.map((row) => (
                                <LeaveTimelineCard
                                    key={row._id}
                                    row={row}
                                    onCancel={() => deleteLeave(row._id)}
                                />
                            ))}
                        </div>
                    )}
                </>
            )}

            <AnimatePresence>
                {open && selectedChild && (
                    <ApplyLeaveModal
                        childName={selectedChild.student_name}
                        childClass={[selectedChild.class_name, selectedChild.class_section]
                            .filter(Boolean)
                            .join(" · ")}
                        childId={selectedChild.student_id}
                        onClose={() => setOpen(false)}
                        onSubmit={handleSubmit}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// ────────────────────────────────────────────────────────────────────────
// Timeline card — one leave application

function LeaveTimelineCard({
    row,
    onCancel,
}: {
    row: LeaveRecordRow;
    onCancel: () => void;
}) {
    const status = STATUS_STYLE[row.status] || STATUS_STYLE.pending;
    const accent = TYPE_ACCENT[row.leave_type] || TYPE_ACCENT.other;
    const days = daySpan(row.start_date, row.end_date);
    const typeLabel =
        TYPE_OPTIONS.find((t) => t.value === row.leave_type)?.label ||
        row.leave_type.replace("_", " ");
    const typeIcon =
        TYPE_OPTIONS.find((t) => t.value === row.leave_type)?.icon || "more_horiz";

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={`group relative rounded-2xl border border-slate-200/70 bg-white shadow-[0_4px_18px_rgb(0,0,0,0.03)] hover:shadow-md hover:border-slate-300 transition-all overflow-hidden`}
        >
            {/* status accent stripe */}
            <span
                className={`absolute inset-y-0 left-0 w-1 ${
                    row.status === "approved"
                        ? "bg-emerald-500"
                        : row.status === "rejected"
                        ? "bg-rose-500"
                        : row.status === "cancelled"
                        ? "bg-slate-300"
                        : "bg-amber-500"
                }`}
            />

            <div className="p-4 md:p-5 pl-6 md:pl-7">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <span
                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-bold capitalize ${accent}`}
                            >
                                <AppIcon name={typeIcon} size={13} />
                                {typeLabel}
                            </span>
                            <span
                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-[10px] font-bold ${status.pill}`}
                            >
                                <AppIcon name={status.icon} size={13} />
                                {status.label}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">
                                · {days} day{days > 1 ? "s" : ""}
                            </span>
                        </div>

                        <div className="mt-3">
                            <p className="text-[15px] font-bold text-slate-900 leading-tight">
                                {row.requester_name}
                            </p>
                            <p className="text-[11px] font-bold text-slate-400 mt-0.5">
                                {row.class_name || "Student"}
                            </p>
                        </div>

                        {row.reason && (
                            <p className="text-[12px] text-slate-600 italic mt-3 line-clamp-2">
                                "{row.reason}"
                            </p>
                        )}

                        {row.status === "rejected" && row.rejection_reason && (
                            <div className="mt-3 rounded-xl border border-rose-100 bg-rose-50/50 px-3 py-2">
                                <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">
                                    Admin note
                                </p>
                                <p className="text-[12px] text-rose-700 mt-0.5">
                                    {row.rejection_reason}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
                        <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2">
                            <AppIcon name="Calendar" size={18} className="text-slate-400" />
                            <div className="text-right">
                                <p className="text-[11px] font-bold text-slate-700 leading-tight">
                                    {fmtDate(row.start_date)}
                                </p>
                                <p className="text-[10px] text-slate-400">
                                    to {fmtDate(row.end_date)}
                                </p>
                            </div>
                        </div>

                        {row.status === "pending" && (
                            <button
                                type="button"
                                onClick={onCancel}
                                className="text-[10px] font-bold text-rose-500 hover:text-rose-600 inline-flex items-center gap-1"
                            >
                                <AppIcon name="XCircle" size={15} />
                                Withdraw
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function LeaveListSkeleton() {
    return (
        <div className="space-y-3">
            {[1, 2, 3].map((i) => (
                <div
                    key={i}
                    className="h-32 rounded-2xl border border-slate-100 bg-white animate-pulse"
                />
            ))}
        </div>
    );
}

// ────────────────────────────────────────────────────────────────────────
// Apply modal

function ApplyLeaveModal({
    childName,
    childClass,
    childId,
    onClose,
    onSubmit,
}: {
    childName: string;
    childClass: string;
    childId: string;
    onClose: () => void;
    onSubmit: (input: LeaveFormInput) => Promise<void>;
}) {
    const [form, setForm] = useState<LeaveFormInput>({
        requester_type: "student",
        requester_id: childId,
        leave_type: "sick",
        start_date: "",
        end_date: "",
        reason: "",
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [busy, setBusy] = useState(false);

    function set<K extends keyof LeaveFormInput>(key: K, value: LeaveFormInput[K]) {
        setForm((prev) => ({ ...prev, [key]: value }));
        setErrors((prev) => {
            if (!prev[key as string]) return prev;
            const { [key as string]: _omit, ...rest } = prev;
            return rest;
        });
    }

    function validate() {
        const next: Record<string, string> = {};
        if (!form.start_date) next.start_date = "Start date is required";
        if (!form.end_date) next.end_date = "End date is required";
        if (form.start_date && form.end_date && form.end_date < form.start_date) {
            next.end_date = "End date must be on or after the start date";
        }
        if (!form.reason.trim()) next.reason = "Please describe the reason";
        if (form.reason.trim().length < 10) {
            next.reason = next.reason || "Add a few more words so the admin understands.";
        }
        setErrors(next);
        return Object.keys(next).length === 0;
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!validate()) {
            showToast("Please fill in the required fields.", "error");
            return;
        }
        setBusy(true);
        try {
            await onSubmit({ ...form, requester_id: childId });
        } finally {
            setBusy(false);
        }
    }

    const days =
        form.start_date && form.end_date
            ? daySpan(form.start_date, form.end_date)
            : 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 12 }}
                transition={{ duration: 0.18 }}
                className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100"
            >
                <div className="px-6 pt-5 pb-4 border-b border-slate-100 bg-gradient-to-br from-blue-50/60 to-white">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                                New application
                            </p>
                            <h3 className="text-[16px] font-bold text-slate-900 mt-0.5">
                                Apply for leave
                            </h3>
                            <p className="text-[11px] text-slate-500 mt-1">
                                Submitting on behalf of{" "}
                                <span className="font-bold text-slate-700">{childName}</span>
                                {childClass ? ` (${childClass})` : ""}.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
                            aria-label="Close"
                        >
                            <AppIcon name="X" />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Type pills */}
                    <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-2">
                            Leave category
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {TYPE_OPTIONS.map((opt) => {
                                const active = form.leave_type === opt.value;
                                return (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => set("leave_type", opt.value)}
                                        className={`h-9 px-3 rounded-xl border text-[11px] font-bold inline-flex items-center gap-1.5 transition-all ${
                                            active
                                                ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-600/20"
                                                : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                                        }`}
                                    >
                                        <AppIcon name={opt.icon} size={15} />
                                        {opt.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Input
                            label="From"
                            type="date"
                            value={form.start_date}
                            onChange={(e) => set("start_date", e.target.value)}
                            error={errors.start_date}
                            required
                        />
                        <Input
                            label="To"
                            type="date"
                            value={form.end_date}
                            onChange={(e) => set("end_date", e.target.value)}
                            error={errors.end_date}
                            required
                        />
                    </div>

                    {days > 0 && (
                        <div className="flex items-center gap-2 rounded-xl bg-slate-50/80 border border-slate-100 px-3 py-2">
                            <AppIcon name="Clock" size={18} className="text-slate-400" />
                            <p className="text-[11px] font-bold text-slate-600">
                                {days} day{days > 1 ? "s" : ""} of leave requested
                            </p>
                        </div>
                    )}

                    <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                            Reason <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                            value={form.reason}
                            onChange={(e) => set("reason", e.target.value)}
                            rows={4}
                            placeholder="Briefly describe why your child needs leave (this is shared with the school admin)…"
                            className={`w-full rounded-xl border bg-white p-3 text-sm text-slate-800 outline-none focus:ring-2 transition-all placeholder:text-slate-400 ${
                                errors.reason
                                    ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/10"
                                    : "border-slate-200 focus:border-blue-600 focus:ring-blue-600/10"
                            }`}
                        />
                        {errors.reason && (
                            <p className="mt-1 text-[10px] font-bold text-rose-600">
                                {errors.reason}
                            </p>
                        )}
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="h-10 px-4 rounded-xl border border-slate-200 text-[11px] font-bold text-slate-500 hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                        <Button
                            type="submit"
                            disabled={busy}
                            className="h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[11px] font-bold shadow-md shadow-blue-600/20 inline-flex items-center gap-2"
                        >
                            {busy ? (
                                <>
                                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                                    Submitting…
                                </>
                            ) : (
                                <>
                                    <AppIcon name="Send" size={17} />
                                    Send for review
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
