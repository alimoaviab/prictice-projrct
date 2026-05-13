"use client";

import { useState } from "react";

type School = {
  school_id: string;
  name: string;
  code: string;
  status: string;
  admin_profile?: {
    name?: string;
    email?: string;
  };
};

type ModalType = "approve" | "reject" | "suspend" | "activate" | "delete";

type Props = {
  type: ModalType;
  school: School;
  onClose: () => void;
  onConfirm: (
    schoolId: string,
    status: string,
    reason?: string,
    notes?: string
  ) => Promise<void>;
};

const rejectionReasons = [
  "Incomplete Information",
  "Duplicate Registration",
  "Invalid Documents",
  "Suspicious Activity",
  "Other",
];

const suspensionReasons = [
  "Policy Violation",
  "Payment Overdue",
  "Suspicious Activity",
  "User Request",
  "Other",
];

export function ActionModal({ type, school, onClose, onConfirm }: Props) {
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);

  const config = {
    approve: {
      title: "Approve School Registration",
      description: "This will grant full access to the school and send an approval notification.",
      icon: "verified",
      iconColor: "text-emerald-600",
      iconBg: "bg-emerald-50 border-emerald-200",
      confirmLabel: "Confirm Approve",
      confirmColor: "bg-emerald-600 hover:bg-emerald-700",
      statusValue: "approved",
      showReason: false,
      showNotes: false,
      showTypeConfirm: false,
    },
    reject: {
      title: "Reject School Registration",
      description: "The school will be denied access. Please provide a reason.",
      icon: "block",
      iconColor: "text-red-600",
      iconBg: "bg-red-50 border-red-200",
      confirmLabel: "Confirm Reject",
      confirmColor: "bg-red-600 hover:bg-red-700",
      statusValue: "rejected",
      showReason: true,
      reasons: rejectionReasons,
      showNotes: true,
      showTypeConfirm: false,
    },
    suspend: {
      title: "Suspend School Account",
      description: "⚠️ This will immediately block all access to the school's ERP.",
      icon: "pause_circle",
      iconColor: "text-amber-600",
      iconBg: "bg-amber-50 border-amber-200",
      confirmLabel: "Confirm Suspend",
      confirmColor: "bg-amber-600 hover:bg-amber-700",
      statusValue: "suspended",
      showReason: true,
      reasons: suspensionReasons,
      showNotes: true,
      showTypeConfirm: false,
    },
    activate: {
      title: "Reactivate School Account",
      description: "This will restore full access to the school.",
      icon: "restart_alt",
      iconColor: "text-emerald-600",
      iconBg: "bg-emerald-50 border-emerald-200",
      confirmLabel: "Confirm Activate",
      confirmColor: "bg-emerald-600 hover:bg-emerald-700",
      statusValue: "approved",
      showReason: false,
      showNotes: false,
      showTypeConfirm: false,
    },
    delete: {
      title: "Delete School (Permanent)",
      description: "⚠️ This action cannot be undone. Type the school name to confirm.",
      icon: "delete_forever",
      iconColor: "text-red-600",
      iconBg: "bg-red-50 border-red-200",
      confirmLabel: "Delete Forever",
      confirmColor: "bg-red-600 hover:bg-red-700",
      statusValue: "deleted",
      showReason: false,
      showNotes: false,
      showTypeConfirm: true,
    },
  }[type];

  const canConfirm = () => {
    if (config.showReason && !reason) return false;
    if (config.showTypeConfirm && confirmText !== school.name) return false;
    return true;
  };

  const handleConfirm = async () => {
    if (!canConfirm()) return;
    setLoading(true);
    try {
      await onConfirm(school.school_id, config.statusValue, reason, notes);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[480px] overflow-hidden animate-fade-in-up">
        {/* Header */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-start gap-4">
            <div
              className={`h-12 w-12 rounded-xl border flex items-center justify-center flex-shrink-0 ${config.iconBg}`}
            >
              <span
                className={`material-symbols-outlined text-[24px] ${config.iconColor}`}
              >
                {config.icon}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-slate-900">{config.title}</h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {config.description}
              </p>
            </div>
            <button
              onClick={onClose}
              className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* School Info */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">
                  {school.name.substring(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">
                  {school.name}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {school.admin_profile?.email ||
                    school.admin_profile?.name ||
                    school.code}
                </p>
              </div>
            </div>
          </div>

          {/* Reason Selection */}
          {config.showReason && (
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Reason <span className="text-red-500">*</span>
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:border-blue-500 outline-none transition-all"
              >
                <option value="">Select a reason...</option>
                {config.reasons?.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Notes */}
          {config.showNotes && (
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Additional Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Add any additional details..."
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:border-blue-500 outline-none transition-all resize-none"
              />
            </div>
          )}

          {/* Type Confirm */}
          {config.showTypeConfirm && (
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Type <span className="font-mono">{school.name}</span> to confirm
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={school.name}
                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:border-red-500 outline-none transition-all"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="h-9 px-4 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-slate-50 transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm() || loading}
            className={`h-9 px-4 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${config.confirmColor}`}
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Processing...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[14px]">
                  {config.icon}
                </span>
                {config.confirmLabel}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
