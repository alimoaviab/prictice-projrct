import { TimetableRecord } from "../types/timetable.types";
import { Badge } from "@/components/ui";
import { useState } from "react";

interface PeriodCardProps {
  slot: TimetableRecord;
  conflicts: { type: 'teacher' | 'room' | 'class'; record: TimetableRecord }[];
  onEdit?: (record: TimetableRecord) => void;
  onDelete?: (id: string) => void;
  isCompact?: boolean;
}

const SUBJECT_COLORS: Record<string, { bg: string; text: string; border: string; dot: string; gradient: string }> = {
  Default: { 
    bg: "bg-blue-50/40", 
    text: "text-blue-700", 
    border: "border-blue-100/60", 
    dot: "bg-blue-600",
    gradient: "from-blue-600/5 to-transparent"
  },
  Primary: { 
    bg: "bg-blue-600 text-white", 
    text: "text-white", 
    border: "border-blue-700", 
    dot: "bg-white",
    gradient: "from-white/10 to-transparent"
  },
  Secondary: { 
    bg: "bg-slate-50", 
    text: "text-slate-700", 
    border: "border-slate-200", 
    dot: "bg-blue-600",
    gradient: "from-blue-600/5 to-transparent"
  }
};

export function PeriodCard({ slot, conflicts, onEdit, onDelete, isCompact }: PeriodCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const style = SUBJECT_COLORS.Default;
  const hasConflict = conflicts.length > 0;

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        group relative overflow-hidden rounded-xl border transition-all duration-300
        ${hasConflict ? 'border-red-200 bg-red-50/50' : `${style.bg} ${style.border}`}
        ${isHovered ? 'shadow-xl shadow-slate-200/50 scale-[1.02] -translate-y-0.5' : 'shadow-sm'}
        ${isCompact ? 'p-2' : 'p-3'}
        cursor-pointer min-h-full flex flex-col justify-between
      `}
    >
      {/* Subject Line Indicator */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${hasConflict ? 'bg-red-500' : style.dot} opacity-60`} />

      <div className="relative z-10 flex flex-col h-full gap-1">
        <div className="flex justify-between items-start gap-2">
          <h4 className={`text-[11px] font-black leading-tight normal-case tracking-tight truncate ${hasConflict ? 'text-red-700' : style.text}`}>
            {slot.subject_name}
          </h4>
          
          <div className={`flex gap-1 transition-all duration-300 ${isHovered && !slot.is_class_schedule ? 'opacity-100' : 'opacity-0'}`}>
            {!slot.is_class_schedule && onEdit && (
              <button 
                onClick={(e) => { e.stopPropagation(); onEdit(slot); }} 
                className="h-6 w-6 flex items-center justify-center rounded-lg bg-white/90 text-slate-500 hover:text-blue-600 shadow-sm border border-slate-100 transition-colors"
              >
                <span className="material-symbols-outlined text-[14px] font-black">edit</span>
              </button>
            )}
            {!slot.is_class_schedule && onDelete && (
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(slot._id); }} 
                className="h-6 w-6 flex items-center justify-center rounded-lg bg-white/90 text-slate-500 hover:text-red-600 shadow-sm border border-slate-100 transition-colors"
              >
                <span className="material-symbols-outlined text-[14px] font-black">delete</span>
              </button>
            )}
          </div>
        </div>

        <div className="mt-auto space-y-1">
          <div className="flex flex-col">
            {slot.class_name && (
              <span className="text-[8px] font-black text-blue-600/60 uppercase tracking-tighter leading-none mb-0.5">
                {slot.class_name} {slot.section ? `(${slot.section})` : ''}
              </span>
            )}
            <p className="text-[9px] font-bold text-slate-600 truncate uppercase tracking-tighter leading-none">
              {slot.teacher_name}
            </p>
          </div>
          
          <div className="flex items-center justify-between gap-2 border-t border-slate-100/50 pt-1">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest truncate">{slot.room || "No Room"}</span>
            <span className="text-[8px] font-black tabular-nums text-slate-400 opacity-60 shrink-0">{slot.start_time}-{slot.end_time}</span>
          </div>
        </div>

        {hasConflict && (
          <div className="mt-1 pt-1 border-t border-red-100 flex items-center gap-1 text-red-600">
            <span className="material-symbols-outlined text-[10px] font-black">warning</span>
            <span className="text-[8px] font-black uppercase tracking-tighter">Conflict</span>
          </div>
        )}
      </div>
    </div>
  );
}
