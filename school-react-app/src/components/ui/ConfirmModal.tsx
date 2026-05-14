import { useEffect, useState } from "react";

export type ConfirmVariant = "danger" | "primary" | "warning";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  note?: string;
  itemName?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: ConfirmVariant;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const variantTokens: Record<
  ConfirmVariant,
  { iconBg: string; iconColor: string; iconName: string; button: string }
> = {
  danger: {
    iconBg: "bg-red-50",
    iconColor: "text-red-600",
    iconName: "delete_forever",
    button:
      "bg-red-600 hover:bg-red-700 hover:shadow-lg hover:shadow-red-600/20 focus-visible:ring-2 focus-visible:ring-red-300",
  },
  primary: {
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    iconName: "help",
    button:
      "bg-blue-600 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/20 focus-visible:ring-2 focus-visible:ring-blue-300",
  },
  warning: {
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
    iconName: "warning",
    button:
      "bg-amber-600 hover:bg-amber-700 hover:shadow-lg hover:shadow-amber-600/20 focus-visible:ring-2 focus-visible:ring-amber-300",
  },
};

export function ConfirmModal({
  isOpen,
  title,
  message,
  note,
  itemName,
  confirmLabel,
  cancelLabel = "Cancel",
  confirmVariant = "danger",
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [show, setShow] = useState(false);
  const tokens = variantTokens[confirmVariant];
  const finalConfirmLabel =
    confirmLabel ?? (confirmVariant === "danger" ? "Delete" : "Continue");

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) onCancel();
    };
    if (isOpen) {
      setIsAnimating(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setShow(true));
      });
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    } else {
      setShow(false);
      const timer = setTimeout(() => setIsAnimating(false), 200);
      document.body.style.overflow = "";
      return () => {
        clearTimeout(timer);
        document.removeEventListener("keydown", handleEscape);
      };
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen && !isAnimating) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-description"
    >
      <div
        className={`absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-200 ${
          show ? "opacity-100" : "opacity-0"
        }`}
        onClick={() => !isLoading && onCancel()}
      />
      <div
        className={`relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 transform transition-all duration-200 ${
          show ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-2"
        }`}
      >
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${tokens.iconBg}`}
          >
            <span className={`material-symbols-outlined text-2xl ${tokens.iconColor}`}>
              {tokens.iconName}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 id="confirm-modal-title" className="text-lg font-bold text-slate-900 leading-tight">
              {title}
            </h3>
            <p
              id="confirm-modal-description"
              className="text-sm text-slate-600 mt-1.5 leading-relaxed break-words"
            >
              {message}
            </p>
            {itemName && (
              <div className="mt-3 inline-flex max-w-full items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
                <span className="material-symbols-outlined text-[15px] text-slate-400">label</span>
                <span className="text-[13px] font-semibold text-slate-700 truncate">{itemName}</span>
              </div>
            )}
            {note && (
              <p className="mt-3 text-xs text-slate-400 leading-relaxed">{note}</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-slate-100">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2.5 text-sm font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed ${tokens.button}`}
          >
            {isLoading && (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            )}
            {isLoading ? "Working…" : finalConfirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
