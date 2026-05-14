import type { HTMLAttributes } from "react";

type BadgeVariant = "primary" | "secondary" | "success" | "error" | "warning" | "gray";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ variant = "gray", className = "", ...props }: BadgeProps) {
  const variants = {
    primary: "bg-blue-50 text-blue-700 border-blue-200",
    secondary: "bg-slate-100 text-slate-700 border-slate-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    error: "bg-red-50 text-red-700 border-red-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    gray: "bg-slate-100 text-slate-600 border-slate-200",
  };

  return (
    <span
      {...props}
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold normal-case tracking-[0.08em] ${variants[variant]} ${className}`}
    />
  );
}
