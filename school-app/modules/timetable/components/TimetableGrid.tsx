"use client";

import { TimetableRecord, DayOfWeek, getDayLabel } from "../types/timetable.types";
import { Card } from "../../../components/ui";

const DAYS: DayOfWeek[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const TIME_SLOTS = [
  "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"
];

interface TimetableGridProps {
  records: TimetableRecord[];
  onEdit?: (record: TimetableRecord) => void;
  onDelete?: (id: string) => void;
}

export function TimetableGrid({ records, onEdit, onDelete }: TimetableGridProps) {
  return (
    <div className="overflow-x-auto bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="min-w-[800px]">
        <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/50">
          <div className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider border-r border-gray-100">Time</div>
          {DAYS.map(day => (
            <div key={day} className="p-4 text-xs font-bold text-gray-900 uppercase tracking-wider text-center border-r last:border-r-0 border-gray-100">
              {day}
            </div>
          ))}
        </div>

        <div className="divide-y divide-gray-100">
          {TIME_SLOTS.map((time, idx) => (
            <div key={time} className="grid grid-cols-7 group">
              <div className="p-4 text-sm font-medium text-gray-500 bg-gray-50/30 border-r border-gray-100 flex items-center justify-center">
                {time}
              </div>
              {DAYS.map(day => {
                const dayNumber = DAYS.indexOf(day) + 1;
                const slots = records.filter(r => r.day_of_week === dayNumber && r.start_time.startsWith(time.substring(0, 2)));
                return (
                  <div key={`${day}-${time}`} className="p-2 border-r last:border-r-0 border-gray-100 min-h-[100px] relative hover:bg-gray-50/50 transition-colors">
                    {slots.map(slot => (
                      <div
                        key={slot._id}
                        className="bg-primary/5 border border-primary/20 rounded-lg p-2 mb-2 group/item relative overflow-hidden"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <p className="text-xs font-bold text-primary truncate pr-4">{slot.subject_name}</p>
                          <div className="flex gap-1 absolute top-1 right-1 opacity-0 group-hover/item:opacity-100 transition-opacity bg-white/90 rounded p-0.5 shadow-sm">
                            {onEdit && (
                              <button onClick={() => onEdit(slot)} className="text-primary hover:text-primary/70">
                                <span className="material-symbols-outlined text-[14px]">edit</span>
                              </button>
                            )}
                            {onDelete && (
                              <button onClick={() => onDelete(slot._id)} className="text-error hover:text-error/70">
                                <span className="material-symbols-outlined text-[14px]">delete</span>
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-[10px] text-gray-600 truncate">{slot.teacher_name}</p>
                        <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">location_on</span>
                          {slot.room || "N/A"}
                        </p>
                        <p className="text-[10px] text-gray-400 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">schedule</span>
                          {slot.start_time} - {slot.end_time}
                        </p>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
