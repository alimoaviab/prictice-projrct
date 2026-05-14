/**
 * Toast facade ported from old-app/school-app/utils/toast.ts. Same event-bus
 * pattern (`window.dispatchEvent("edu:toast")`) so module pages can be ported
 * unchanged.
 */

export type ToastTone = "success" | "error" | "info" | "warning";

export type ToastOptions = {
  title?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
};

const DEFAULT_DURATIONS: Record<ToastTone, number> = {
  success: 3500,
  info: 4000,
  warning: 5500,
  error: 6500,
};

function dispatchToast(
  message: string,
  tone: ToastTone,
  options?: ToastOptions
) {
  if (typeof window === "undefined" || !message) return;

  const detail = {
    message,
    tone,
    title: options?.title,
    duration: options?.duration ?? DEFAULT_DURATIONS[tone],
    action: options?.action,
  };

  window.dispatchEvent(new CustomEvent("edu:toast", { detail }));
}

export function showToast(
  message: string,
  tone: ToastTone = "info",
  options?: ToastOptions
): void {
  dispatchToast(message, tone, options);
}

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
  apiError(payload: unknown, fallback = "We couldn't complete that action.", options?: ToastOptions) {
    const message = formatServiceError(payload, fallback);
    dispatchToast(message, "error", options);
  },
};

function formatServiceError(payload: unknown, fallback: string): string {
  if (!payload) return fallback;
  if (typeof payload === "string") return payload;
  if (typeof payload !== "object") return fallback;
  const p = payload as Record<string, unknown>;
  const errorObj = p.error as Record<string, unknown> | undefined;
  return (
    (errorObj?.message as string | undefined) ??
    (p.message as string | undefined) ??
    fallback
  );
}
