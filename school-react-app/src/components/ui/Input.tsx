/**
 * Input primitive — unified to the Academic Year design system.
 *
 * Default visual contract:
 *   - Label: text-[11px] font-bold text-slate-500 normal-case px-1
 *   - Input: h-11 rounded-xl border-slate-200 text-[13px] font-medium
 *   - Focus: border-blue-600 ring-4 ring-blue-600/5
 *   - Error: border-rose-500 ring-rose-500/10
 *   - Left icon: absolute left-3.5, text-[18px] text-slate-400
 *
 * Consumers can still override via className for special cases.
 */

import type { InputHTMLAttributes, ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export function Input({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  id,
  className = "",
  ...props
}: InputProps) {
  const inputId = id ?? props.name;
  const helperId = helperText ? `${inputId}-helper` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [helperId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="text-[11px] font-bold text-slate-500 normal-case mb-1 px-1"
        >
          {label}
          {props.required && (
            <span className="text-rose-500 ml-0.5" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-3.5 flex items-center justify-center text-slate-400 pointer-events-none">
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          {...props}
          aria-describedby={describedBy}
          aria-invalid={!!error}
          className={`w-full h-11 ${leftIcon ? "pl-10" : "px-3.5"} ${rightIcon ? "pr-10" : ""} text-[13px] font-medium text-slate-700 bg-white border rounded-xl outline-none transition-all placeholder:text-slate-400 ${
            error
              ? "border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10"
              : "border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5"
          } ${className}`}
        />
        {rightIcon && (
          <div className="absolute right-3.5 flex items-center justify-center">
            {rightIcon}
          </div>
        )}
      </div>
      {helperText && !error && (
        <span id={helperId} className="text-[10px] font-medium text-slate-400 mt-0.5 px-1">
          {helperText}
        </span>
      )}
      {error && (
        <span id={errorId} className="text-[10px] font-bold text-rose-600 mt-0.5 px-1" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
