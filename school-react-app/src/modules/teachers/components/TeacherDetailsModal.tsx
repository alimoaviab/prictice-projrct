import { AppIcon } from "shared/ui/AppIcon";
import { useEffect, useState } from "react";
import { Badge, Skeleton, DataState } from "@/components/ui";
import { useSafeAsync } from "@/hooks/useSafeAsync";
import { getTeacher } from "../services/teacher.service";
import { TeacherRow } from "../types/teacher.types";

interface TeacherDetailsModalProps {
  isOpen: boolean;
  teacherId: string | null;
  onClose: () => void;
}

export function TeacherDetailsModal({ isOpen, teacherId, onClose }: TeacherDetailsModalProps) {
  const [show, setShow] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const { state, run } = useSafeAsync<any>(() => false);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen && teacherId) {
      setIsAnimating(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setShow(true));
      });
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";

      // Load teacher detail data
      void run(async () => {
        const result = await getTeacher(teacherId);
        if (!result.ok) {
          throw new Error(result.error?.message || "Failed to load details");
        }
        return result.data;
      });
    } else {
      setShow(false);
      const timer = setTimeout(() => setIsAnimating(false), 200);
      document.body.style.overflow = "";
      return () => {
        clearTimeout(timer);
        document.removeEventListener("keydown", handleEscape);
      };
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, teacherId, onClose, run]);

  if (!isOpen && !isAnimating) return null;

  const teacher: TeacherRow | undefined = state.data?.teacher;
  const classes: any[] = state.data?.classes || [];
  const todaySchedule: any[] = state.data?.todaySchedule || [];

  const initials = teacher
    ? `${(teacher.first_name || "?").substring(0, 1)}${(teacher.last_name || "").substring(0, 1)}`
    : "?";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-200 ${
          show ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Modal Container */}
      <div
        className={`relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl transform transition-all duration-200 ${
          show ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-2"
        } overflow-hidden`}
      >
        {/* Header */}
        <div className="bg-slate-900 px-6 py-5 flex items-center justify-between text-white relative">
          <div className="absolute right-0 top-0 w-32 h-full bg-gradient-to-l from-white/5 to-transparent pointer-events-none" />
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-blue-600/20">
              <AppIcon name="Badge" size={20} />
            </div>
            <div>
              <h3 className="text-md font-bold leading-tight">Faculty Member Details</h3>
              <p className="text-[10px] font-bold text-slate-400 normal-case tracking-wider mt-0.5">Academic Profile</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
            aria-label="Close"
          >
            <AppIcon name="X" size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
          {state.status === "loading" || state.status === "idle" ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-32 w-full rounded-xl" />
            </div>
          ) : state.status === "error" ? (
            <DataState
              variant="error"
              title="Failed to load teacher details"
              message={state.error}
            />
          ) : !teacher ? (
            <DataState variant="empty" title="No details available" />
          ) : (
            <>
              {/* Profile Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-xl bg-slate-900 text-white flex items-center justify-center text-md font-bold normal-case shadow-md">
                    {initials}
                  </div>
                  <div>
                    <h4 className="text-md font-bold text-slate-900 leading-tight">
                      {teacher.first_name} {teacher.last_name || ""}
                    </h4>
                    <p className="text-[11px] font-bold text-blue-600 normal-case mt-0.5">
                      ID: {teacher.employee_no}
                    </p>
                    {teacher.qualification && (
                      <p className="text-xs text-slate-500 font-medium mt-1">
                        {teacher.qualification}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <Badge
                    variant={
                      teacher.status === "active"
                        ? "success"
                        : teacher.status === "on_leave"
                          ? "warning"
                          : "gray"
                    }
                    className="text-[9px] font-bold normal-case px-2 py-0.5 rounded-md"
                  >
                    {teacher.status.replace("_", " ")}
                  </Badge>
                  <span className="text-[10px] text-slate-400 font-bold">Faculty Status</span>
                </div>
              </div>

              {/* Contact Information & Subjects */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="premium-card p-4 border border-slate-200/60 bg-white shadow-sm rounded-xl space-y-3">
                  <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Contact Details</h5>
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2.5 text-xs text-slate-600">
                      <AppIcon name="Mail" size={16} className="text-slate-400 shrink-0" />
                      <span className="truncate">{teacher.email}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs text-slate-600">
                      <AppIcon name="Phone" size={16} className="text-slate-400 shrink-0" />
                      <span>{teacher.phone || "—"}</span>
                    </div>
                  </div>
                </div>

                <div className="premium-card p-4 border border-slate-200/60 bg-white shadow-sm rounded-xl space-y-3">
                  <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Subject Specialization</h5>
                  <div className="flex flex-wrap gap-1">
                    {(teacher.subjects || []).length > 0 ? (
                      (teacher.subjects || []).map((s) => (
                        <span
                          key={s}
                          className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100"
                        >
                          {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">No subjects specified</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Assigned Classes */}
              <div className="space-y-2">
                <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1">Assigned Classes</h5>
                {classes.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {classes.map((c) => (
                      <div
                        key={c.id}
                        className="p-3 border border-slate-100 rounded-xl bg-slate-50/20 hover:bg-slate-50 transition-all flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-lg bg-blue-50/80 text-blue-600 flex items-center justify-center font-bold text-xs border border-blue-100">
                            {c.name.substring(0, 2)}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800 leading-snug">
                              {c.name} {c.section || ""}
                            </p>
                            <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                              {c.academicYear || "Current Year"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-black text-slate-900">{c.studentCount || 0}</span>
                          <p className="text-[9px] text-slate-400 font-bold uppercase">Students</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 border border-dashed border-slate-200 rounded-xl text-center">
                    <p className="text-xs text-slate-400 italic">No assigned classes found</p>
                  </div>
                )}
              </div>

              {/* Timetable / Periods Schedule */}
              <div className="space-y-2">
                <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1">Today's Timetable &amp; Periods</h5>
                {todaySchedule.length > 0 ? (
                  <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400">Time / Period</th>
                          <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400">Class</th>
                          <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400">Subject</th>
                          <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 text-right">Room</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 bg-white">
                        {todaySchedule.map((s, idx) => (
                          <tr key={s.id || idx} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-3">
                              <p className="font-bold text-slate-800 leading-snug">{s.start_time} - {s.end_time}</p>
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-medium text-slate-700">{s.class_name}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-blue-600 font-bold text-[10px] border border-blue-100">
                                {s.subject_name}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="font-bold text-slate-500">{s.room || "—"}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-4 border border-dashed border-slate-200 rounded-xl text-center">
                    <p className="text-xs text-slate-400 italic">No classes scheduled for today</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 rounded-xl transition-all"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}
