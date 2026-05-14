import { Link } from "react-router-dom";
import { ClassRow } from "../types/class.types";
import { Badge, LayoutCard } from "@/components/ui";

interface ClassCardProps {
  classItem: ClassRow;
  onEdit: (item: ClassRow) => void;
  onDelete: (item: ClassRow) => void;
  onFee: (item: ClassRow) => void;
}

export function ClassCard({ classItem, onEdit, onDelete, onFee }: ClassCardProps) {
  const isActive = classItem.status === "active";
  
  return (
    <LayoutCard
      isActive={isActive}
      title={classItem.name}
      subtitle={classItem.academic_year || "2024-25"}
      icon={<span className="material-symbols-outlined font-black text-2xl">door_front</span>}
      badge={isActive && <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />}
      actions={
        <>
          <button
            onClick={() => onEdit(classItem)}
            className="h-8 w-8 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95"
            title="Edit Class"
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
          </button>
          <button
            onClick={() => onDelete(classItem)}
            className="h-8 w-8 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-red-500 hover:text-white transition-all"
            title="Delete"
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
          </button>
        </>
      }
    >
      {/* Metrics Dashboard */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="p-2 rounded-xl bg-slate-50/50 border border-slate-100/50 relative overflow-hidden">
           <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5 text-center">Incharge</p>
           <p className="text-[10px] font-black text-slate-800 truncate text-center" title={classItem.class_teacher?.name || "Unassigned"}>
             {classItem.class_teacher?.name?.split(' ')[0] || "None"}
           </p>
        </div>
        <div className="p-2 rounded-xl bg-slate-50/50 border border-slate-100/50 relative overflow-hidden">
           <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5 text-center">Section</p>
           <p className="text-[10px] font-black text-slate-800 text-center truncate px-1" title={classItem.section || "General"}>
             {classItem.section || "General"}
           </p>
        </div>
        <div className="p-2 rounded-xl bg-slate-50/50 border border-slate-100/50 relative overflow-hidden">
           <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5 text-center">Attendance</p>
           <p className="text-[10px] font-black text-blue-600 text-center">{classItem.attendance_percentage || 0}%</p>
        </div>
        <div className="p-2 rounded-xl bg-slate-50/50 border border-slate-100/50 relative overflow-hidden">
           <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5 text-center">Fees</p>
           <p className="text-[10px] font-black text-emerald-600 text-center">{(classItem as any).fee_status || 0}%</p>
        </div>
      </div>

      {/* Interactive Footer */}
      <div className="pt-3 border-t border-slate-100/80 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Link 
            to={`/admin/students?class_id=${classItem._id}`}
            className="flex items-center gap-2 group/students"
          >
            <div className="flex -space-x-1.5">
               {[1,2].map(i => (
                 <div key={i} className="h-5 w-5 rounded-full border border-white bg-slate-100 flex items-center justify-center text-[7px] font-black text-slate-400">
                   {i}
                 </div>
               ))}
            </div>
            <span className="text-[10px] font-black text-slate-900 group-hover/students:text-blue-600 transition-colors">
              {classItem.enrolled_students || classItem.student_count || 0} Std
            </span>
          </Link>
          
          <div className="flex items-center gap-1.5">
            <Link
              to={`/admin/timetable?class_id=${classItem._id}`}
              className="h-7 w-7 flex items-center justify-center rounded-lg bg-slate-50 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 border border-slate-100"
              title="Timetable"
            >
              <span className="material-symbols-outlined text-base">calendar_view_week</span>
            </Link>
            <button
              onClick={() => onFee(classItem)}
              className="h-7 w-7 flex items-center justify-center rounded-lg bg-slate-50 text-slate-500 hover:bg-violet-50 hover:text-violet-600 border border-slate-100"
              title="Fees"
            >
              <span className="material-symbols-outlined text-base">account_balance_wallet</span>
            </button>
          </div>
        </div>

        <Link
          to={`/admin/attendance?class_id=${classItem._id}`}
          className="flex h-8 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 shadow-sm active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-base">fact_check</span>
          Mark Attendance
        </Link>
      </div>
    </LayoutCard>
  );
}
