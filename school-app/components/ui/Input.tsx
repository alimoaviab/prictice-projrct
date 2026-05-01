"use client";

import { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, id, className = "", ...props }: InputProps) {
  const inputId = id ?? props.name;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        id={inputId}
        {...props}
        className={`w-full px-4 py-2 text-sm bg-surface border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 ${
          error ? "border-error focus:border-error focus:ring-error/20" : "border-border focus:border-primary"
        } ${className}`}
      />
      {error && <span className="text-xs text-error mt-1">{error}</span>}
    </div>
  );
}
