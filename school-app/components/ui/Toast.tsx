"use client";

import { useEffect, useState } from "react";

export type ToastTone = "success" | "error" | "info" | "warning";

interface ToastProps {
  id: string;
  message: string;
  tone: ToastTone;
  onClose: (id: string) => void;
  duration?: number;
}

const toneStyles: Record<ToastTone, { icon: string; iconColor: string; progress: string; border: string }> = {
  success: {
    icon: "check_circle",
    iconColor: "text-emerald-500",
    progress: "bg-emerald-500",
    border: "border-emerald-200",
  },
  error: {
    icon: "error",
    iconColor: "text-red-500",
    progress: "bg-red-500",
    border: "border-red-200",
  },
  info: {
    icon: "info",
    iconColor: "text-blue-500",
    progress: "bg-blue-500",
    border: "border-blue-200",
  },
  warning: {
    icon: "warning",
    iconColor: "text-amber-500",
    progress: "bg-amber-500",
    border: "border-amber-200",
  },
};

export function Toast({ id, message, tone, onClose, duration = 4000 }: ToastProps) {
  const [progress, setProgress] = useState(100);
  const [isExiting, setIsExiting] = useState(false);
  const styles = toneStyles[tone];

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        handleClose();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => onClose(id), 300);
  };

  return (
    <div
      className={`relative flex items-center gap-3 w-full max-w-sm p-4 rounded-xl border shadow-lg bg-white overflow-hidden transition-all duration-300 ${styles.border} ${
        isExiting ? "opacity-0 translate-x-4" : "opacity-100 translate-x-0"
      }`}
      role="alert"
    >
      <span className={`material-symbols-outlined ${styles.iconColor} flex-shrink-0`}>{styles.icon}</span>
      <p className="text-sm font-medium text-gray-800 flex-1 pr-2">{message}</p>
      <button
        onClick={handleClose}
        className="p-1 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
        aria-label="Close toast"
      >
        <span className="material-symbols-outlined text-gray-400 text-lg">close</span>
      </button>
      <div
        className={`absolute bottom-0 left-0 h-0.5 ${styles.progress} transition-all duration-100`}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
