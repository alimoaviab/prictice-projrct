import { AppIcon } from "shared/ui/AppIcon";
import { useMemo } from "react";
import { useTimetable } from "../hooks/useTimetable";

export function TimetablePreview({ classId, teacherId }: { classId?: string; teacherId?: string }) {
    const filters = useMemo(() => {
        if (classId) return { class_id: classId };
        if (teacherId) return { teacher_id: teacherId };
        return undefined;
    }, [classId, teacherId]);

    const { state } = useTimetable(filters);

    // Filter for today's entries only
    const today = new Date().getDay(); // 0 is Sunday, 1 is Monday...
    const todayNum = today === 0 ? 7 : today; // Map Sunday to 7 to match our system

    const todayRows = useMemo(() => {
        return (state.data || [])
            .filter(r => r.day_of_week === todayNum)
            .sort((a, b) => a.start_time.localeCompare(b.start_time));
    }, [state.data, todayNum]);

    if (state.status === "loading") {
        return (
            <div className="space-y-2">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-12 w-full animate-pulse bg-slate-50 rounded-lg border border-slate-100" />
                ))}
            </div>
        );
    }

    if (state.status === "error") {
        return <p className="text-[10px] font-bold text-rose-500 bg-rose-50 p-2 rounded-md">{state.error}</p>;
    }

    if (todayRows.length === 0) {
        return (
            <div className="py-8 flex flex-col items-center justify-center text-center opacity-40">
                <AppIcon name="CalendarX" size={30} className="mb-2" />
                <p className="text-[11px] font-bold text-slate-500">No classes scheduled for today</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {todayRows.map((row) => (
                <div key={row._id} className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-50 bg-slate-50/30 hover:bg-white hover:border-blue-100 hover:shadow-sm transition-all group">
                    <div className="h-9 w-9 rounded-lg bg-blue-600 text-white flex flex-col items-center justify-center shadow-sm shadow-blue-600/20">
                        <span className="text-[10px] font-black leading-none">{row.start_time.split(':')[0]}</span>
                        <span className="text-[7px] font-black uppercase opacity-60">AM</span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <h4 className="text-[12px] font-black text-slate-900 truncate tracking-tight">{row.subject_name}</h4>
                            <span className="h-1 w-1 rounded-full bg-slate-300" />
                            <span className="text-[9px] font-bold text-blue-600/60 uppercase">Period {row.period_number || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                            <div className="flex items-center gap-1 text-slate-400">
                                <AppIcon name="User" size={12} />
                                <span className="text-[10px] font-medium truncate max-w-[80px]">{row.teacher_name || 'Unassigned'}</span>
                            </div>
                            <div className="flex items-center gap-1 text-slate-400">
                                <AppIcon name="DoorOpen" size={12} />
                                <span className="text-[10px] font-medium">{row.room || 'No Room'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="text-right shrink-0">
                        <p className="text-[10px] font-black text-slate-900">{row.start_time} - {row.end_time}</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">Duration: 60m</p>
                    </div>
                </div>
            ))}
        </div>
    );
}