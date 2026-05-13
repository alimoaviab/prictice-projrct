"use client";

import { useEffect, useState, useCallback } from "react";
import { Toast, ToastTone, ToastAction } from "./Toast";

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
                // De-duplicate the same message that's already showing — if the user
                // clicks "Save" twice and both fail, we don't want two stacked toasts.
                const isDuplicate = prev.some(
                    (t) => t.message === detail.message && t.tone === detail.tone
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
                        action: detail.action
                    }
                ];

                // Cap the number of stacked toasts so they never overflow on mobile.
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
            // Position: top-right on desktop, full-width bottom-stack on mobile
            // for thumb-reachable dismissal. z-index sits above everything.
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
