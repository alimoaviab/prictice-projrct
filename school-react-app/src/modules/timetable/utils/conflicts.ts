import { TimetableFormInput, TimetableRecord, DayOfWeek } from "../types/timetable.types";

const DAY_TO_NUMBER: Record<string, number> = {
    "Monday": 1,
    "Tuesday": 2,
    "Wednesday": 3,
    "Thursday": 4,
    "Friday": 5,
    "Saturday": 6,
    "Sunday": 7
};

function timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
}

export function findTimetableConflicts(
    records: TimetableRecord[],
    input: TimetableFormInput | TimetableRecord,
    excludedRecordId?: string
): { type: 'teacher' | 'room' | 'class'; record: TimetableRecord }[] {
    const conflicts: { type: 'teacher' | 'room' | 'class'; record: TimetableRecord }[] = [];
    
    const inputDay = typeof input.day_of_week === 'string' 
        ? DAY_TO_NUMBER[input.day_of_week as DayOfWeek] 
        : input.day_of_week;
        
    const inputStart = timeToMinutes(input.start_time);
    const inputEnd = timeToMinutes(input.end_time);

    for (const record of records) {
        if (excludedRecordId && record._id === excludedRecordId) continue;
        if ('_id' in input && record._id === input._id) continue;

        // Check if on the same day
        if (record.day_of_week !== inputDay) continue;

        // Check for time overlap
        const recordStart = timeToMinutes(record.start_time);
        const recordEnd = timeToMinutes(record.end_time);

        const hasOverlap = (inputStart < recordEnd && inputEnd > recordStart);

        if (hasOverlap) {
            // Teacher Conflict
            if (record.teacher_id === input.teacher_id) {
                conflicts.push({ type: 'teacher', record });
            }
            // Room Conflict
            if (record.room && input.room && record.room === input.room) {
                conflicts.push({ type: 'room', record });
            }
            // Class Conflict (same class, different subject at same time)
            if (record.class_id === input.class_id) {
                conflicts.push({ type: 'class', record });
            }
        }
    }

    return conflicts;
}