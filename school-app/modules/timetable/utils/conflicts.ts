import { DayOfWeek, TimetableFormInput, TimetableRecord } from "../types/timetable.types";

const DAY_TO_NUMBER: Record<DayOfWeek, number> = {
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
    Sunday: 7,
    Everyday: 0
};

function toMinutes(time: string): number {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
}

export function findTimetableConflicts(
    records: TimetableRecord[],
    input: TimetableFormInput,
    excludedRecordId?: string
): TimetableRecord[] {
    const inputDay = DAY_TO_NUMBER[input.day_of_week];
    const inputStart = toMinutes(input.start_time);
    const inputEnd = toMinutes(input.end_time);
    const normalizedRoom = input.room?.trim();

    return records.filter((record) => {
        if (excludedRecordId && record._id === excludedRecordId) return false;
        if (record.day_of_week !== inputDay) return false;

        const recordStart = toMinutes(record.start_time);
        const recordEnd = toMinutes(record.end_time);
        const overlaps = inputStart < recordEnd && inputEnd > recordStart;

        if (!overlaps) return false;

        return (
            record.class_id === input.class_id ||
            record.subject_id === input.subject_id ||
            record.teacher_id === input.teacher_id ||
            (normalizedRoom ? record.room?.trim() === normalizedRoom : false)
        );
    });
}