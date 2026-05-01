"use client";

import { ButtonHTMLAttributes } from "react";

interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
}

export function LoadingButton({
  children,
  isLoading = false,
  loadingText,
  variant = "primary",
  size = "md",
  disabled,
  className = "",
  ...props
}: LoadingButtonProps) {
  const baseStyles = "inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/25 focus:ring-blue-500 active:scale-[0.98]",
    secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500 active:scale-[0.98]",
    danger: "bg-red-500 text-white hover:bg-red-600 hover:shadow-lg hover:shadow-red-500/25 focus:ring-red-500 active:scale-[0.98]",
    ghost: "bg-transparent text-gray-600 hover:bg-gray-50 focus:ring-gray-500 active:scale-[0.98]",
  };

  const sizes = {
    sm: "px-3 py-2 text-xs",
    md: "px-4 py-2.5 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      )}
      {isLoading && loadingText ? loadingText : children}
    </button>
  );
}
