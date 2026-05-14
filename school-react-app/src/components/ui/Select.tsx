/**
 * Select primitive — unified to the Academic Year design system.
 *
 * Default visual contract:
 *   - Label: text-[11px] font-bold text-slate-500 normal-case px-1
 *   - Select: h-11 rounded-xl border-slate-200 text-[13px] font-medium
 *   - Focus: border-blue-600 ring-4 ring-blue-600/5
 *   - Error: border-rose-500 ring-rose-500/10
 *   - Chevron: custom SVG background-image, right-aligned
 *
 * Consumers can still override via className for special cases.
 */

import type { SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { label: string; value: string | number }[];
}

export function Select({
  label,
  error,
  options,
  id,
  className = "",
  ...props
}: SelectProps) {
  const selectId = id ?? props.name;

  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label
          htmlFor={selectId}
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
      <select
        id={selectId}
        {...props}
        aria-invalid={!!error}
        className={`w-full h-11 px-3.5 pr-9 text-[13px] font-medium text-slate-700 bg-white border rounded-xl outline-none transition-all appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236B7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.75rem_center] bg-no-repeat ${
          error
            ? "border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10"
            : "border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5"
        } ${className}`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <span className="text-[10px] font-bold text-rose-600 mt-0.5 px-1" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
