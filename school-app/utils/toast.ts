import { formatServiceError } from "@edu/shared/utils/error-messages";

export type ToastTone = "success" | "error" | "info" | "warning";

export type ToastOptions = {
    /** Optional bold heading shown above the message. */
    title?: string;
    /** How long the toast stays on screen (ms). Default depends on tone. */
    duration?: number;
    /** Optional inline action (e.g. Retry / Undo). */
    action?: {
        label: string;
        onClick: () => void;
    };
};

const DEFAULT_DURATIONS: Record<ToastTone, number> = {
    success: 3500,
    info: 4000,
    warning: 5500,
    error: 6500
};

function dispatchToast(message: string, tone: ToastTone, options?: ToastOptions) {
    if (typeof window === "undefined" || !message) return;

    const detail = {
        message,
        tone,
        title: options?.title,
        duration: options?.duration ?? DEFAULT_DURATIONS[tone],
        action: options?.action
    };

    window.dispatchEvent(new CustomEvent("edu:toast", { detail }));
}

/**
 * Backwards-compatible toast trigger.
 *
 *   showToast("Saved!");
 *   showToast("Could not save", "error");
 *
 * Existing call sites continue to work unchanged.
 */
export function showToast(message: string, tone: ToastTone = "info", options?: ToastOptions): void {
    dispatchToast(message, tone, options);
}

/**
 * Convenient namespaced helpers — use these in new code:
 *
 *   toast.success("Student created", { title: "Done" });
 *   toast.error("Couldn't save", { action: { label: "Retry", onClick: retry } });
 *   toast.apiError(result, "Failed to load students.");
 */
export const toast = {
    success(message: string, options?: ToastOptions) {
        dispatchToast(message, "success", options);
    },
    error(message: string, options?: ToastOptions) {
        dispatchToast(message, "error", options);
    },
    warning(message: string, options?: ToastOptions) {
        dispatchToast(message, "warning", options);
    },
    info(message: string, options?: ToastOptions) {
        dispatchToast(message, "info", options);
    },
    /**
     * Show an error toast from a ServiceResult-style payload, applying the
     * shared error message formatter so raw backend strings (Mongo
     * duplicate-key, JWT, validation) become user-friendly.
     */
    apiError(payload: unknown, fallback = "We couldn't complete that action.", options?: ToastOptions) {
        const message = formatServiceError(payload, fallback);
        dispatchToast(message, "error", options);
    }
};
