import { TimetableRecord, DayOfWeek } from "../types/timetable.types";
import { PeriodCard } from "./PeriodCard";
import { findTimetableConflicts } from "../utils/conflicts";
import { useMemo, useState, useEffect } from "react";

const DAYS: DayOfWeek[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const TIME_SLOTS = [
  "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"
];

interface TimetableGridProps {
  records: TimetableRecord[];
  onEdit?: (record: TimetableRecord) => void;
  onDelete?: (id: string) => void;
  isCompact?: boolean;
}

export function TimetableGrid({ records, onEdit, onDelete, isCompact }: TimetableGridProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const currentDayIndex = currentTime.getDay(); 
  const currentHour = currentTime.getHours();
  const currentMinutes = currentTime.getMinutes();
  const timeInMinutes = currentHour * 60 + currentMinutes;

  const isCurrentPeriod = (startTime: string, endTime: string, dayIdx: number) => {
    const dayNumber = dayIdx + 1;
    if (currentDayIndex !== dayNumber) return false;
    const start = parseInt(startTime.split(':')[0]) * 60 + parseInt(startTime.split(':')[1]);
    const end = parseInt(endTime.split(':')[0]) * 60 + parseInt(endTime.split(':')[1]);
    return timeInMinutes >= start && timeInMinutes < end;
  };

  const isCurrentTimeRow = (time: string) => {
    const rowHour = parseInt(time.split(':')[0]);
    return currentHour === rowHour;
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/60 shadow-2xl shadow-slate-200/50 overflow-hidden">
      <div className="overflow-x-auto scrollbar-hide">
        <div className="min-w-[1000px]">
          {/* Day Headers - Sticky Top */}
          <div className="sticky top-0 z-50 grid grid-cols-[80px_repeat(7,1fr)] bg-white/90 backdrop-blur-xl border-b border-slate-200 shadow-sm">
          <div className="flex items-center justify-center border-r border-slate-100 bg-slate-50/50">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Time</span>
          </div>
          {DAYS.map((day, idx) => {
            const isToday = currentDayIndex === idx + 1;
            return (
              <div key={day} className={`py-4 flex flex-col items-center justify-center border-r border-slate-100 last:border-0 ${isToday ? 'bg-blue-50/30' : ''}`}>
                <span className={`text-[10px] md:text-[11px] font-black uppercase tracking-widest ${isToday ? 'text-blue-600' : 'text-slate-900'}`}>
                  {day.substring(0, 3)}
                </span>
                {isToday && <div className="mt-1 h-1 w-4 rounded-full bg-blue-600 shadow-lg shadow-blue-600/30" />}
              </div>
            );
          })}
        </div>

        {/* Grid Body */}
        <div className="relative">
          {TIME_SLOTS.map((time, rowIdx) => (
            <div key={time} className={`grid grid-cols-[80px_repeat(7,1fr)] border-b border-slate-50 last:border-0 transition-colors hover:bg-slate-50/30 ${isCompact ? 'min-h-[80px]' : 'min-h-[120px]'}`}>
              
              {/* Time Sidebar - Sticky Left */}
              <div className={`sticky left-0 z-40 flex flex-col items-center justify-center border-r border-slate-100 transition-all ${isCurrentTimeRow(time) ? 'bg-blue-600 text-white shadow-[4px_0_15px_rgba(37,99,235,0.2)]' : 'bg-slate-50/80 backdrop-blur-md'}`}>
                <span className="text-[11px] md:text-xs font-black tabular-nums tracking-tighter">
                  {time}
                </span>
                {isCurrentTimeRow(time) && (
                  <div className="mt-1 h-1 w-1 rounded-full bg-white animate-ping" />
                )}
              </div>

              {/* Day Cells */}
              {DAYS.map((_, dayIdx) => {
                const dayNumber = dayIdx + 1;
                const slots = (records || []).filter(r => {
                  if (!r.start_time) return false;
                  const rDay = Number(r.day_of_week);
                  if (rDay !== dayNumber) return false;
                  return parseInt(r.start_time.split(':')[0]) === parseInt(time.split(':')[0]);
                });

                const isToday = currentDayIndex === dayNumber;

                return (
                  <div key={`${dayNumber}-${time}`} className={`p-2 border-r border-slate-50 last:border-0 relative ${isToday ? 'bg-blue-50/5' : ''}`}>
                    <div className="flex flex-col gap-2 h-full">
                      {slots.map(slot => {
                        const conflicts = findTimetableConflicts(records, slot);
                        const active = isCurrentPeriod(slot.start_time, slot.end_time, dayIdx);
                        return (
                          <div key={slot._id} className={`flex-1 ${active ? 'ring-2 ring-blue-500 ring-offset-1 rounded-xl' : ''}`}>
                            <PeriodCard 
                              slot={slot} 
                              conflicts={conflicts} 
                              onEdit={onEdit} 
                              onDelete={onDelete} 
                              isCompact={isCompact}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
          
          {/* Current Time Indicator Line */}
          {currentDayIndex >= 1 && currentDayIndex <= 7 && currentHour >= 8 && currentHour < 19 && (
            <div 
              className="absolute left-[60px] md:left-[80px] right-0 h-[1.5px] bg-blue-600/50 pointer-events-none z-30 flex items-center"
              style={{ 
                top: `${((timeInMinutes - 8 * 60) / (11 * 60)) * 100}%` 
              }}
            >
              <div className="h-2.5 w-2.5 rounded-full bg-blue-600 -ml-[5px] shadow-[0_0_10px_rgba(37,99,235,0.8)] border-2 border-white" />
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
