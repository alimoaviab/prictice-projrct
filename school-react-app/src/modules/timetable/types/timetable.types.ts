/**
 * Timetable wire types.
 *
 * Day-of-week canonicalization across the stack:
 *   - Wire: ISO 1..7 (Mon=1, Sun=7)
 *   - Form / labels: "Monday".."Sunday" (DayOfWeek union)
 *   - JS getDay(): 0..6 (Sun=0, Sat=6) — only used in the live "is now" check
 */

export type DayOfWeek =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";

export const DAY_OPTIONS: Array<{ label: string; value: DayOfWeek; iso: number }> = [
  { label: "Monday", value: "Monday", iso: 1 },
  { label: "Tuesday", value: "Tuesday", iso: 2 },
  { label: "Wednesday", value: "Wednesday", iso: 3 },
  { label: "Thursday", value: "Thursday", iso: 4 },
  { label: "Friday", value: "Friday", iso: 5 },
  { label: "Saturday", value: "Saturday", iso: 6 },
  { label: "Sunday", value: "Sunday", iso: 7 },
];

export const DAY_LABEL_BY_ISO: Record<number, string> = {
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
  7: "Sunday",
};

export const SHORT_DAY_BY_ISO: Record<number, string> = {
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat",
  7: "Sun",
};

export function getDayLabel(iso: number): string {
  return DAY_LABEL_BY_ISO[iso] ?? "Unknown";
}

export function dayNameToISO(name: DayOfWeek): number {
  const found = DAY_OPTIONS.find((d) => d.value === name);
  return found ? found.iso : 1;
}

export function isoToDayName(iso: number): DayOfWeek {
  const found = DAY_OPTIONS.find((d) => d.iso === iso);
  return found ? found.value : "Monday";
}

/** ISO weekday for "today" (Mon=1..Sun=7). */
export function todayISO(): number {
  const js = new Date().getDay(); // 0..6, Sun=0
  return js === 0 ? 7 : js;
}

/** Period status used to color-code each grid cell. */
export type PeriodStatus = "current" | "completed" | "upcoming" | "free" | "conflict";

export interface TimetableRecord {
  _id: string;                 // synthetic: "{timetableId}_{day}_{period}"
  timetable_id?: string;
  class_id: string;
  class_name: string;
  section?: string;
  subject_id: string;
  subject_name: string;
  teacher_id: string;
  teacher_name: string;
  day_of_week: number;         // ISO 1..7
  period_number: number;
  start_time: string;          // "HH:mm"
  end_time: string;            // "HH:mm"
  room?: string;
  is_class_schedule?: boolean;
  academic_year_id?: string;
  created_at: string;
  updated_at: string;
}

export interface TimetableFormInput {
  class_id: string;
  section?: string;
  subject_id: string;
  teacher_id: string;
  day_of_week: number;         // ← ISO 1..7 on the wire
  period_number: number;
  start_time: string;          // "HH:mm"
  end_time: string;            // "HH:mm"
  room?: string;
}

/** Server-detected scheduling conflict, surfaced as `error.details.conflicts`. */
export interface ServerConflict {
  type: "teacher" | "room" | "class";
  day_of_week: number;
  period_number: number;
  start_time: string;
  end_time: string;
  class_id?: string;
  class_name?: string;
  teacher_id?: string;
  room?: string;
  existing_timetable_id?: string;
  message: string;
}

/** /api/timetable/summary response. */
export interface TimetableSummary {
  totalClasses: number;
  classesScheduled: number;
  classesUnscheduled: number;
  totalPeriodsToday: number;
  completedPeriodsToday: number;
  upcomingPeriodsToday: number;
  activePeriodsNow: number;
  totalTeachers: number;
  teachersTeachingNow: number;
  freeTeachersNow: number;
  conflictsCount: number;
  currentPeriod?: TimetableRecord | null;
  nextPeriod?: TimetableRecord | null;
  unscheduledClasses: Array<{ _id: string; name: string; section?: string; grade?: string }>;
  generatedAt: string;
}
