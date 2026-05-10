"use client";

import { TimetableRecord, DayOfWeek } from "../types/timetable.types";
import { PeriodCard } from "./PeriodCard";
import { findTimetableConflicts } from "../utils/conflicts";
import { useMemo, useState, useEffect } from "react";

const DAYS: DayOfWeek[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
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

  const currentDayIndex = currentTime.getDay(); // 0 is Sunday, 1 is Monday
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
    <div className="relative bg-white rounded-3xl border border-slate-200/60 overflow-hidden shadow-2xl shadow-slate-200/50">
      <div className="overflow-x-auto">
        <div className="min-w-[1200px]">
          {/* Header */}
          <div className="sticky top-0 z-40 grid grid-cols-[100px_repeat(6,1fr)] bg-slate-50/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
            <div className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center justify-center border-r border-slate-200/60 bg-slate-100/50">
              Time
            </div>
            {DAYS.map((day, idx) => {
                const isToday = currentDayIndex === idx + 1;
                return (
                    <div key={day} className={`p-4 text-center border-r border-slate-200/60 last:border-r-0 ${isToday ? 'bg-blue-50/50' : ''}`}>
                        <div className="flex flex-col items-center gap-1">
                            <span className={`text-[11px] font-black uppercase tracking-widest ${isToday ? 'text-blue-600' : 'text-slate-900'}`}>{day}</span>
                            {isToday && <div className="h-1 w-8 rounded-full bg-blue-600 animate-pulse" />}
                        </div>
                    </div>
                );
            })}
          </div>

          {/* Time Rows */}
          <div className="divide-y divide-slate-100">
            {TIME_SLOTS.map((time, rowIdx) => (
              <div key={time} className={`grid grid-cols-[100px_repeat(6,1fr)] ${isCompact ? 'min-h-[100px]' : 'min-h-[140px]'} group/row ${rowIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/20'}`}>
                {/* Time Indicator - Sticky Column */}
                <div className={`sticky left-0 z-30 border-r border-slate-200/60 flex flex-col items-center justify-center gap-1 transition-colors ${isCurrentTimeRow(time) ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50/80 backdrop-blur-sm'}`}>
                  <span className={`text-[13px] font-black tracking-tight tabular-nums ${isCurrentTimeRow(time) ? 'text-white' : 'text-slate-900'}`}>{time}</span>
                  <div className={`h-1.5 w-1.5 rounded-full ${isCurrentTimeRow(time) ? 'bg-white/40 animate-ping' : 'bg-slate-300'}`} />
                </div>

                {/* Day Columns */}
                {DAYS.map((day, dayIdx) => {
                  const dayNumber = dayIdx + 1;
                  const slots = records.filter(r => 
                    r.day_of_week === dayNumber && 
                    r.start_time.startsWith(time.substring(0, 2))
                  );

                  const isToday = currentDayIndex === dayNumber;

                  return (
                    <div key={`${day}-${time}`} className={`p-3 border-r border-slate-200/60 last:border-r-0 relative transition-all duration-300 hover:bg-blue-50/30 ${isToday ? 'bg-blue-50/10' : ''}`}>
                      {slots.length === 0 && (
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity">
                              <div className="h-full w-full border-2 border-dashed border-slate-200/60 rounded-2xl m-2" />
                          </div>
                      )}
                      
                      <div className="space-y-3 relative z-10">
                        {slots.map(slot => {
                          const conflicts = findTimetableConflicts(records, slot);
                          const active = isCurrentPeriod(slot.start_time, slot.end_time, dayIdx);
                          
                          return (
                            <div key={slot._id} className={active ? 'ring-2 ring-blue-500 ring-offset-2 rounded-xl shadow-xl shadow-blue-500/20' : ''}>
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
          </div>
        </div>
      </div>

      {/* Decorative Current Time Line */}
      {currentDayIndex > 0 && currentDayIndex < 7 && (
          <div 
            className="absolute left-[100px] right-0 h-0.5 bg-blue-500/40 pointer-events-none z-20 flex items-center"
            style={{ 
                top: `${( (timeInMinutes - 8*60) / ( (18-8)*60 ) ) * 100}%`,
                display: (currentHour >= 8 && currentHour < 18) ? 'flex' : 'none'
            }}
          >
              <div className="h-3 w-3 rounded-full bg-blue-600 -ml-1.5 shadow-lg shadow-blue-600/50" />
          </div>
      )}
    </div>
  );
}
