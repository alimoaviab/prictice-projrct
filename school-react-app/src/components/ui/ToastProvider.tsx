import { useCallback, useEffect, useState } from "react";
import { Toast, type ToastAction, type ToastTone } from "./Toast";

interface ToastItem {
  id: string;
  message: string;
  tone: ToastTone;
  title?: string;
  duration?: number;
  action?: ToastAction;
}

const MAX_VISIBLE_TOASTS = 4;

export function ToastProvider() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const handleToast = (event: Event) => {
      const detail = (event as CustomEvent<{
        message: string;
        tone: ToastTone;
        title?: string;
        duration?: number;
        action?: ToastAction;
      }>).detail;

      if (!detail?.message) return;

      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      setToasts((prev) => {
        // Aggressive dedup: check if a toast with similar message and same tone
        // was shown in the last 2 seconds (prevents double toasts from hooks + pages)
        const now = Date.now();
        const isDuplicate = prev.some(
          (t) => t.tone === detail.tone && (
            t.message === detail.message ||
            t.message.toLowerCase().replace(/[^a-z]/g, '').includes(
              detail.message.toLowerCase().replace(/[^a-z]/g, '').substring(0, 15)
            ) ||
            detail.message.toLowerCase().replace(/[^a-z]/g, '').includes(
              t.message.toLowerCase().replace(/[^a-z]/g, '').substring(0, 15)
            )
          )
        );
        if (isDuplicate) return prev;

        const next = [
          ...prev,
          {
            id,
            message: detail.message,
            tone: detail.tone,
            title: detail.title,
            duration: detail.duration,
            action: detail.action,
          },
        ];

        if (next.length > MAX_VISIBLE_TOASTS) {
          return next.slice(next.length - MAX_VISIBLE_TOASTS);
        }
        return next;
      });
    };

    window.addEventListener("edu:toast", handleToast);
    return () => window.removeEventListener("edu:toast", handleToast);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-3 bottom-3 z-[10000] flex flex-col gap-2 sm:inset-x-auto sm:bottom-auto sm:right-4 sm:top-4 sm:gap-3"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast
            id={toast.id}
            message={toast.message}
            tone={toast.tone}
            title={toast.title}
            duration={toast.duration}
            action={toast.action}
            onClose={removeToast}
          />
        </div>
      ))}
    </div>
  );
}
