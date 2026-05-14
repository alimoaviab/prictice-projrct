/**
 * Button primitive — unified to the Academic Year design system.
 *
 * Default visual contract:
 *   - Primary: bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-600/20
 *   - Secondary: bg-slate-900 text-white rounded-xl
 *   - Ghost: transparent, hover:bg-slate-100
 *   - Error: bg-rose-600 text-white rounded-xl
 *   - Sizes: sm (h-8), md (h-10), lg (h-11)
 *   - Active: scale-[0.98]
 *   - Disabled: opacity-50 cursor-not-allowed
 *
 * Consumers can still override via className for special cases.
 */

import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "error";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center gap-2 font-bold transition-all duration-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";

  const variants: Record<ButtonVariant, string> = {
    primary:
      "bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 hover:-translate-y-0.5 focus:ring-blue-600",
    secondary:
      "bg-slate-900 text-white shadow-sm shadow-slate-900/10 hover:bg-slate-800 hover:-translate-y-0.5 focus:ring-slate-900",
    ghost:
      "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:ring-slate-400",
    error:
      "bg-rose-600 text-white shadow-lg shadow-rose-600/20 hover:bg-rose-700 hover:-translate-y-0.5 focus:ring-rose-600",
  };

  const sizes: Record<NonNullable<ButtonProps["size"]>, string> = {
    sm: "h-8 px-3 text-[11px]",
    md: "h-10 px-4 text-[12px]",
    lg: "h-11 px-6 text-[13px]",
  };

  return (
    <button
      {...props}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
    />
  );
}
