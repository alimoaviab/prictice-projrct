/**
 * Custom Premium Select Primitive — unified to the Eduplexo design system.
 *
 * Default visual contract:
 *   - Trigger: Glassmorphic background, premium border, rotating chevron.
 *   - List: Floating card with backdrop-blur, smooth transitions, custom option highlight.
 *   - Accessibility: Role properties, click-outside listener, full backward compatibility.
 */

import { useState, useRef, useEffect, type SelectHTMLAttributes } from "react";

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "onChange"> {
  label?: string;
  error?: string;
  options: { label: string; value: string | number }[];
  onChange?: (e: { target: { name?: string; value: any } }) => void;
  placeholder?: string;
}

export function Select({
  label,
  error,
  options,
  id,
  className = "",
  value,
  onChange,
  placeholder,
  ...props
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectId = id ?? props.name;
  const containerRef = useRef<HTMLDivElement>(null);

  // Find the active option label
  const selectedOption = options.find((o) => o.value === value) || options[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelect = (val: any) => {
    if (onChange) {
      onChange({
        target: {
          name: props.name,
          value: val,
        },
      });
    }
    setIsOpen(false);
  };

  return (
    <div className="flex flex-col gap-1 w-full relative" ref={containerRef}>
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
      
      <div className="relative">
        <button
          id={selectId}
          type="button"
          onClick={() => !props.disabled && setIsOpen(!isOpen)}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-invalid={!!error}
          disabled={props.disabled}
          className={`w-full h-11 px-4 pr-10 text-[13px] font-bold text-slate-700 bg-slate-50/50 hover:bg-slate-100/50 border rounded-xl outline-none transition-all flex items-center justify-between cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 text-left ${
            isOpen
              ? "border-blue-600 ring-4 ring-blue-600/5 bg-white shadow-sm"
              : error
              ? "border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10"
              : "border-slate-200 hover:border-slate-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5"
          } ${className}`}
        >
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder || "Select..."}
          </span>
          <span className={`material-symbols-outlined text-[18px] text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180 text-blue-600" : ""}`}>
            keyboard_arrow_down
          </span>
        </button>

        {isOpen && (
          <div className="absolute z-50 mt-1.5 w-full bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.08)] overflow-hidden py-1 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150">
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <div
                  key={option.value}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(option.value)}
                  className={`flex items-center justify-between px-4 py-2.5 text-[13px] font-bold cursor-pointer transition-all ${
                    isSelected
                      ? "text-blue-600 bg-blue-50/50 font-extrabold"
                      : "text-slate-600 hover:text-blue-600 hover:bg-slate-50/80"
                  }`}
                >
                  <span className="truncate">{option.label}</span>
                  {isSelected && (
                    <span className="material-symbols-outlined text-[16px] text-blue-600">
                      check
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {error && (
        <span className="text-[10px] font-bold text-rose-600 mt-0.5 px-1" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
