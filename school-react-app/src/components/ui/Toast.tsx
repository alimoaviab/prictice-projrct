import { AppIcon } from "shared/ui/AppIcon";
import { useEffect, useRef, useState } from "react";

export type ToastTone = "success" | "error" | "info" | "warning";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastProps {
  id: string;
  message: string;
  tone: ToastTone;
  title?: string;
  duration?: number;
  action?: ToastAction;
  onClose: (id: string) => void;
}

const toneStyles: Record<
  ToastTone,
  { icon: string; iconColor: string; progress: string; border: string; accent: string; bg: string }
> = {
  success: {
    icon: "check_circle",
    iconColor: "text-emerald-600",
    progress: "bg-emerald-500",
    border: "border-emerald-200",
    accent: "bg-emerald-50",
    bg: "bg-white",
  },
  error: {
    icon: "error",
    iconColor: "text-red-600",
    progress: "bg-red-500",
    border: "border-red-200",
    accent: "bg-red-50",
    bg: "bg-white",
  },
  info: {
    icon: "info",
    iconColor: "text-blue-600",
    progress: "bg-blue-500",
    border: "border-blue-200",
    accent: "bg-blue-50",
    bg: "bg-white",
  },
  warning: {
    icon: "warning",
    iconColor: "text-amber-600",
    progress: "bg-amber-500",
    border: "border-amber-200",
    accent: "bg-amber-50",
    bg: "bg-white",
  },
};

export function Toast({
  id,
  message,
  tone,
  title,
  duration = 4000,
  action,
  onClose,
}: ToastProps) {
  const [progress, setProgress] = useState(100);
  const [isExiting, setIsExiting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const startTimeRef = useRef<number>(Date.now());
  const elapsedBeforePauseRef = useRef<number>(0);
  const styles = toneStyles[tone] || toneStyles.info;

  useEffect(() => {
    if (duration <= 0) return;

    const interval = setInterval(() => {
      if (isPaused) return;

      const elapsed =
        elapsedBeforePauseRef.current + (Date.now() - startTimeRef.current);
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        handleClose();
      }
    }, 50);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration, isPaused]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => onClose(id), 200);
  };

  const handleMouseEnter = () => {
    if (isPaused) return;
    elapsedBeforePauseRef.current += Date.now() - startTimeRef.current;
    setIsPaused(true);
  };

  const handleMouseLeave = () => {
    if (!isPaused) return;
    startTimeRef.current = Date.now();
    setIsPaused(false);
  };

  const handleAction = () => {
    action?.onClick();
    handleClose();
  };

  return (
    <div
      role={tone === "error" || tone === "warning" ? "alert" : "status"}
      aria-live={tone === "error" ? "assertive" : "polite"}
      aria-atomic="true"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={[
        "relative flex w-full items-start gap-3 overflow-hidden rounded-xl border shadow-[0_8px_30px_rgba(15,23,42,0.08)] backdrop-blur transition-all duration-200",
        "p-3 sm:p-4 max-w-[calc(100vw-2rem)] sm:max-w-md",
        styles.bg,
        styles.border,
        isExiting
          ? "opacity-0 translate-x-2 sm:translate-y-0"
          : "opacity-100 translate-x-0 translate-y-0",
      ].join(" ")}
    >
      <div
        className={["flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg", styles.accent].join(" ")}
        aria-hidden="true"
      >
        <AppIcon name={styles.icon} className={` text-[20px] ${styles.iconColor} `} />
      </div>

      <div className="min-w-0 flex-1 pr-1">
        {title && (
          <p className="text-[13px] font-bold leading-tight text-slate-900">{title}</p>
        )}
        <p
          className={`text-[13px] leading-snug text-slate-700 break-words ${
            title ? "mt-0.5" : ""
          }`}
          style={{ overflowWrap: "anywhere" }}
        >
          {message}
        </p>
        {action && (
          <button
            type="button"
            onClick={handleAction}
            className="mt-2 inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:border-blue-300 hover:text-blue-700 transition-colors"
          >
            {action.label}
          </button>
        )}
      </div>

      <button
        onClick={handleClose}
        className="flex-shrink-0 rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        aria-label="Dismiss notification"
      >
        <AppIcon name="X" size={18} />
      </button>

      {duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-100">
          <div
            className={`h-full ${styles.progress} transition-[width] duration-100 ease-linear`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
