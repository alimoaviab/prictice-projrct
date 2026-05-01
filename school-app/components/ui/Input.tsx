"use client";

import { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function Input({ label, error, helperText, id, className = "", ...props }: InputProps) {
  const inputId = id ?? props.name;
  const helperId = helperText ? `${inputId}-helper` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [helperId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
          {label}
          {props.required && <span className="text-error ml-0.5" aria-hidden="true">*</span>}
        </label>
      )}
      <input
        id={inputId}
        {...props}
        aria-describedby={describedBy}
        aria-invalid={!!error}
        className={`w-full px-4 py-2 text-sm bg-surface border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 ${
          error ? "border-error focus:border-error focus:ring-error/20" : "border-border focus:border-primary"
        } ${className}`}
      />
      {helperText && !error && (
        <span id={helperId} className="text-xs text-gray-500 mt-1">{helperText}</span>
      )}
      {error && <span id={errorId} className="text-xs text-error mt-1">{error}</span>}
    </div>
  );
}
