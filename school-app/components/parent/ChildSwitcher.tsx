"use client";

import { useState, useRef, useEffect } from "react";
import { useSelectedChild } from "../../contexts/SelectedChildContext";

export function ChildSwitcher() {
  const { children, selectedChild, selectChild, loading } = useSelectedChild();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Don't show if loading or no children
  if (loading || children.length === 0) {
    return null;
  }

  // Don't show dropdown if only one child
  if (children.length === 1) {
    const child = children[0];
    return (
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-sm font-black text-blue-700">
          {child.student_name.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900">{child.student_name}</p>
          <p className="text-xs text-slate-500">
            {child.class_name} {child.class_section && `- ${child.class_section}`}
          </p>
        </div>
      </div>
    );
  }

  // Show dropdown for multiple children
  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-slate-100 bg-white px-2.5 py-1.5 transition-all hover:border-blue-400 hover:bg-blue-50/50 shadow-sm"
      >
        {selectedChild && (
          <>
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600 text-[10px] font-black text-white shadow-sm shadow-blue-600/20">
              {selectedChild.student_name.slice(0, 2).toUpperCase()}
            </div>
            <div className="text-left leading-tight hidden md:block">
              <p className="text-[11px] font-bold text-slate-900 truncate max-w-[120px]">{selectedChild.student_name}</p>
              <p className="text-[9px] font-black text-blue-600/60 uppercase tracking-tight">
                {selectedChild.class_name}
              </p>
            </div>
            <span className="material-symbols-outlined text-[16px] text-slate-400">
              {isOpen ? "expand_less" : "expand_more"}
            </span>
          </>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-[110] mt-1 w-64 rounded-xl border border-slate-100 bg-white shadow-2xl shadow-slate-200/50">
          <div className="p-1.5">
            <p className="px-3 py-2 text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">
              Switch Account
            </p>
            <div className="space-y-0.5">
              {children.map((child) => (
                <button
                  key={child.student_id}
                  type="button"
                  onClick={() => {
                    selectChild(child.student_id);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-all ${
                    selectedChild?.student_id === child.student_id
                      ? "bg-blue-50 text-blue-700"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-md text-[10px] font-black ${
                      selectedChild?.student_id === child.student_id
                        ? "bg-blue-600 text-white shadow-sm shadow-blue-600/20"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {child.student_name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold truncate">{child.student_name}</p>
                    <p className="text-[9px] font-medium text-slate-400 uppercase tracking-tight">
                      {child.class_name}
                    </p>
                  </div>
                  {selectedChild?.student_id === child.student_id && (
                    <span className="material-symbols-outlined text-[16px] text-blue-600">check_circle</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
