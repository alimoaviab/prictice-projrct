"use client";

import { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "error";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
}

export function Button({ variant = "primary", size = "md", className = "", ...props }: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";

  const variants = {
    primary: "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-sm shadow-blue-600/15 hover:shadow-md hover:shadow-blue-600/20 hover:-translate-y-0.5 focus:ring-blue-600",
    secondary: "bg-slate-900 text-white shadow-sm shadow-slate-900/10 hover:bg-slate-800 hover:-translate-y-0.5 focus:ring-slate-900",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:ring-slate-400",
    error: "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-sm shadow-red-600/15 hover:shadow-md hover:shadow-red-600/20 hover:-translate-y-0.5 focus:ring-red-600",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-[11px]",
    md: "px-3 py-1.5 text-xs",
    lg: "px-4 py-2 text-sm",
  };

  return (
    <button
      {...props}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
    />
  );
}
