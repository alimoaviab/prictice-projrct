"use client";

import Link from "next/link";
import { ClassRow } from "../types/class.types";
import { Badge } from "../../../components/ui";

interface ClassCardProps {
  classItem: ClassRow;
  onEdit: (item: ClassRow) => void;
  onDelete: (item: ClassRow) => void;
  onFee: (item: ClassRow) => void;
}

export function ClassCard({ classItem, onEdit, onDelete, onFee }: ClassCardProps) {
  const isActive = classItem.status === "active";
  
  return (
    <div className={`premium-card group relative flex flex-col p-6 min-h-[260px] transition-all duration-300 bg-white border-slate-200/60 hover:shadow-xl hover:shadow-slate-200/30 hover:-translate-y-0.5 ${
      isActive ? "ring-2 ring-blue-600/10 border-blue-600/30" : ""
    }`}>
      {/* Top Row: Identity & Actions */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="h-11 w-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm transition-transform group-hover:scale-105 shrink-0">
            <span className="material-symbols-outlined font-bold text-2xl">door_front</span>
          </div>
          <div className="space-y-0.5 min-w-0">
            <h3 className="text-base font-bold text-slate-900 tracking-tight leading-none truncate group-hover:text-blue-600 transition-colors">
              {classItem.name}
            </h3>
            <p className="text-[10px] font-bold text-slate-400 normal-case mt-1">
              {classItem.academic_year || "Current Session"}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-0.5">
          <Link
            href={`/admin/classes/${classItem._id}`}
            className="h-9 w-9 flex items-center justify-center rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all"
            title="View Class Detail"
          >
            <span className="material-symbols-outlined text-[20px]">visibility</span>
          </Link>
          <button
            onClick={() => onEdit(classItem)}
            className="h-9 w-9 flex items-center justify-center rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all"
            title="Configure"
          >
            <span className="material-symbols-outlined text-[20px]">edit_note</span>
          </button>
          <button
            onClick={() => onDelete(classItem)}
            className="h-9 w-9 flex items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all"
            title="Delete"
          >
            <span className="material-symbols-outlined text-[20px]">delete</span>
          </button>
        </div>
      </div>

      {/* Stats Grid - High Density with generous breathing room */}
      <div className="grid grid-cols-4 gap-3 mb-8">
        <div className="p-2.5 rounded-xl bg-slate-50/50 border border-slate-100/50 text-center">
          <p className="text-[7.5px] font-bold text-slate-400 normal-case mb-1">Students</p>
          <p className="text-[12px] font-bold text-slate-900">{classItem.student_count || 0}</p>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-50/50 border border-slate-100/50 text-center">
          <p className="text-[7.5px] font-bold text-slate-400 normal-case mb-1">Subjects</p>
          <p className="text-[12px] font-bold text-slate-900">{classItem.subjects?.length || 0}</p>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-50/50 border border-slate-100/50 text-center">
          <p className="text-[7.5px] font-bold text-slate-400 normal-case mb-1">Attendance</p>
          <p className="text-[12px] font-bold text-blue-600">{classItem.attendance_percentage || 0}%</p>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-50/50 border border-slate-100/50 text-center">
          <p className="text-[7.5px] font-bold text-slate-400 normal-case mb-1">Fee Status</p>
          <p className="text-[12px] font-bold text-emerald-600">85%</p>
        </div>
      </div>

      {/* Description Section - High Density Notes */}
      <div className="mb-6 px-0.5 min-h-[48px]">
        <p className="text-[9px] font-bold text-slate-400 normal-case mb-1.5 tracking-tight">Architecture Notes</p>
        <p className="text-[11px] font-medium text-slate-500 line-clamp-2 leading-relaxed">
          {classItem.description || "Standard foundational academic node for the current session cycle."}
        </p>
      </div>

      {/* Meta Info Footer */}
      <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {(classItem.teacher_names || []).slice(0, 3).map((t, i) => (
              <div key={i} className="h-6 w-6 rounded-full bg-slate-900 border-2 border-white flex items-center justify-center text-[8px] font-bold text-white shadow-sm" title={t}>
                {t[0]}
              </div>
            ))}
          </div>
          <span className="text-[10px] font-bold text-slate-500 truncate max-w-[90px]">
            {classItem.teacher_names?.[0] || "Unassigned"}
          </span>
        </div>
        
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onFee(classItem)}
            className="h-8 px-3 flex items-center gap-2 rounded-lg bg-violet-50 text-violet-600 text-[9px] font-bold hover:bg-violet-100 transition-all border border-violet-100/50"
          >
            <span className="material-symbols-outlined text-base">payments</span>
            Fees
          </button>
          <Link
            href={`/admin/classes/${classItem._id}`}
            className="h-8 px-4 flex items-center gap-2 rounded-lg bg-blue-600 text-white text-[9px] font-bold hover:bg-blue-700 transition-all shadow-sm active:scale-95"
          >
            Manage
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
