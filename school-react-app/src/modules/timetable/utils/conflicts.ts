import { TimetableFormInput, TimetableRecord } from "../types/timetable.types";

function timeToMinutes(time: string): number {
  if (!time) return -1;
  const [hours, minutes] = time.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return -1;
  return hours * 60 + minutes;
}

export type ConflictKind = "teacher" | "room" | "class";

export interface ClientConflict {
  type: ConflictKind;
  record: TimetableRecord;
}

/**
 * Detects scheduling conflicts on the client for an inline preview.
 * The server is authoritative — a CONFLICT response from the API will
 * be surfaced regardless. This is purely for the form's "conflict
 * before save" badge.
 */
export function findTimetableConflicts(
  records: TimetableRecord[],
  input: TimetableFormInput | TimetableRecord,
  excludedRecordId?: string
): ClientConflict[] {
  const conflicts: ClientConflict[] = [];
  const inputDay = Number(input.day_of_week);
  const inputStart = timeToMinutes(input.start_time);
  const inputEnd = timeToMinutes(input.end_time);
  if (inputStart < 0 || inputEnd <= inputStart) return conflicts;

  for (const record of records) {
    if (excludedRecordId && record._id === excludedRecordId) continue;
    if ("_id" in input && record._id === (input as TimetableRecord)._id) continue;
    if (Number(record.day_of_week) !== inputDay) continue;

    const recordStart = timeToMinutes(record.start_time);
    const recordEnd = timeToMinutes(record.end_time);
    if (recordStart < 0 || recordEnd <= recordStart) continue;

    const overlap = inputStart < recordEnd && inputEnd > recordStart;
    if (!overlap) continue;

    if (record.teacher_id && record.teacher_id === input.teacher_id) {
      conflicts.push({ type: "teacher", record });
    }
    if (record.room && input.room && record.room === input.room) {
      conflicts.push({ type: "room", record });
    }
    if (record.class_id === input.class_id) {
      conflicts.push({ type: "class", record });
    }
  }
  return conflicts;
}

/**
 * "Cell status" for a record: current / completed / upcoming.
 * Free cells are computed by absence of a record on (day, period).
 */
export function periodStatus(
  rec: TimetableRecord,
  now: Date = new Date()
): "current" | "completed" | "upcoming" {
  const todayISO = now.getDay() === 0 ? 7 : now.getDay();
  if (Number(rec.day_of_week) !== todayISO) return "upcoming";

  const start = timeToMinutes(rec.start_time);
  const end = timeToMinutes(rec.end_time);
  const cur = now.getHours() * 60 + now.getMinutes();

  if (cur >= start && cur < end) return "current";
  if (cur >= end) return "completed";
  return "upcoming";
}
