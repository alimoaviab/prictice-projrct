export type ToastTone = "success" | "error" | "info";

export function showToast(message: string, tone: ToastTone = "info"): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent("edu:toast", { detail: { message, tone } }));
}
