"use client";

import { useEffect, useState, useCallback } from "react";
import { Toast, ToastTone } from "./Toast";

interface ToastItem {
  id: string;
  message: string;
  tone: ToastTone;
}

export function ToastProvider() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const handleToast = (event: Event) => {
      const customEvent = event as CustomEvent<{ message: string; tone: ToastTone }>;
      const { message, tone } = customEvent.detail;
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { id, message, tone }]);
    };

    window.addEventListener("edu:toast", handleToast);
    return () => window.removeEventListener("edu:toast", handleToast);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast
            id={toast.id}
            message={toast.message}
            tone={toast.tone}
            onClose={removeToast}
          />
        </div>
      ))}
    </div>
  );
}
