"use client";

import { TimetableRecord } from "../types/timetable.types";
import { useState } from "react";

interface PeriodCardProps {
  slot: TimetableRecord;
  conflicts: { type: 'teacher' | 'room' | 'class'; record: TimetableRecord }[];
  onEdit?: (record: TimetableRecord) => void;
  onDelete?: (id: string) => void;
  isCompact?: boolean;
}

const SUBJECT_COLORS: Record<string, { bg: string; text: string; border: string; dot: string; gradient: string }> = {
  Mathematics: { 
    bg: "bg-blue-50/50", 
    text: "text-blue-700", 
    border: "border-blue-100", 
    dot: "bg-blue-500",
    gradient: "from-blue-500/10 to-transparent"
  },
  English: { 
    bg: "bg-purple-50/50", 
    text: "text-purple-700", 
    border: "border-purple-100", 
    dot: "bg-purple-500",
    gradient: "from-purple-500/10 to-transparent"
  },
  Science: { 
    bg: "bg-emerald-50/50", 
    text: "text-emerald-700", 
    border: "border-emerald-100", 
    dot: "bg-emerald-500",
    gradient: "from-emerald-500/10 to-transparent"
  },
  History: { 
    bg: "bg-amber-50/50", 
    text: "text-amber-700", 
    border: "border-amber-100", 
    dot: "bg-amber-500",
    gradient: "from-amber-500/10 to-transparent"
  },
  Geography: { 
    bg: "bg-indigo-50/50", 
    text: "text-indigo-700", 
    border: "border-indigo-100", 
    dot: "bg-indigo-500",
    gradient: "from-indigo-500/10 to-transparent"
  },
  Physics: { 
    bg: "bg-cyan-50/50", 
    text: "text-cyan-700", 
    border: "border-cyan-100", 
    dot: "bg-cyan-500",
    gradient: "from-cyan-500/10 to-transparent"
  },
  Chemistry: { 
    bg: "bg-rose-50/50", 
    text: "text-rose-700", 
    border: "border-rose-100", 
    dot: "bg-rose-500",
    gradient: "from-rose-500/10 to-transparent"
  },
  Default: { 
    bg: "bg-slate-50/50", 
    text: "text-slate-700", 
    border: "border-slate-100", 
    dot: "bg-slate-500",
    gradient: "from-slate-500/10 to-transparent"
  }
};

export function PeriodCard({ slot, conflicts, onEdit, onDelete, isCompact }: PeriodCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const style = SUBJECT_COLORS[slot.subject_name] || SUBJECT_COLORS.Default;
  const hasConflict = conflicts.length > 0;

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        group relative overflow-hidden rounded-xl border transition-all duration-200
        ${hasConflict ? 'border-red-200 bg-red-50/30' : `${style.bg} ${style.border}`}
        ${isHovered ? 'shadow-lg shadow-slate-200/50 scale-[1.02] -translate-y-0.5' : 'shadow-sm'}
        ${isCompact ? 'p-2' : 'p-3'}
        cursor-pointer
      `}
    >
      {/* Background Gradient Decor */}
      <div className={`absolute inset-0 bg-gradient-to-br ${style.gradient} opacity-50`} />

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-1.5">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`h-2 w-2 rounded-full ${hasConflict ? 'bg-red-500 animate-pulse' : style.dot} shrink-0`} />
            <p className={`text-[12px] font-black leading-none uppercase tracking-tight truncate ${hasConflict ? 'text-red-700' : style.text}`}>
              {slot.subject_name}
            </p>
          </div>
          
          <div className={`flex gap-1 transition-all duration-200 ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'}`}>
            {onEdit && (
              <button 
                onClick={(e) => { e.stopPropagation(); onEdit(slot); }} 
                className="h-7 w-7 flex items-center justify-center rounded-lg bg-white/90 text-slate-500 hover:text-blue-600 shadow-sm border border-slate-100 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">edit</span>
              </button>
            )}
            {onDelete && (
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(slot._id); }} 
                className="h-7 w-7 flex items-center justify-center rounded-lg bg-white/90 text-slate-500 hover:text-red-600 shadow-sm border border-slate-100 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
              </button>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-slate-700">
            <span className="material-symbols-outlined text-[16px] text-slate-400">person</span>
            <span className="text-[11px] font-bold truncate leading-none">{slot.teacher_name}</span>
          </div>
          
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-slate-500">
              <span className="material-symbols-outlined text-[16px] text-slate-400">room</span>
              <span className="text-[10px] font-bold uppercase tracking-wider leading-none">{slot.room || "Room TBA"}</span>
            </div>
            
            <div className="flex items-center gap-1.5 text-slate-400 bg-white/50 px-1.5 py-0.5 rounded-md border border-slate-100/50">
              <span className="material-symbols-outlined text-[14px]">schedule</span>
              <span className="text-[10px] font-black tabular-nums tracking-tight leading-none">
                {slot.start_time}-{slot.end_time}
              </span>
            </div>
          </div>
        </div>

        {hasConflict && (
          <div className="mt-2 pt-2 border-t border-red-100 flex items-center gap-2 text-red-600">
            <span className="material-symbols-outlined text-[14px]">warning</span>
            <span className="text-[9px] font-black uppercase tracking-widest">
              {conflicts[0].type} conflict detected
            </span>
          </div>
        )}
      </div>

      {/* Side Decorative line */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${hasConflict ? 'bg-red-500' : style.dot} opacity-40`} />
    </div>
  );
}
