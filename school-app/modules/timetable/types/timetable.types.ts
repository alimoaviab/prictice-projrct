export type DayOfWeek = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday" | "Everyday";

export const DAY_OPTIONS: Array<{ label: string; value: DayOfWeek }> = [
  { label: "Monday", value: "Monday" },
  { label: "Tuesday", value: "Tuesday" },
  { label: "Wednesday", value: "Wednesday" },
  { label: "Thursday", value: "Thursday" },
  { label: "Friday", value: "Friday" },
  { label: "Saturday", value: "Saturday" },
  { label: "Sunday", value: "Sunday" },
  { label: "Everyday", value: "Everyday" },
];

export interface TimetableRecord {
  _id: string;
  class_id: string;
  class_name: string;
  section?: string;
  subject_id: string;
  subject_name: string;
  teacher_id: string;
  teacher_name: string;
  day_of_week: number;
  period_number: number;
  start_time: string; // HH:mm
  end_time: string;   // HH:mm
  room?: string;
  created_at: string;
  updated_at: string;
}

export const DAY_LABEL_BY_NUMBER: Record<number, string> = {
  0: "Everyday",
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
  7: "Sunday"
};

export function getDayLabel(dayOfWeek: number): string {
  return DAY_LABEL_BY_NUMBER[dayOfWeek] ?? "Unknown";
}

export interface TimetableFormInput {
  class_id: string;
  section?: string;
  subject_id: string;
  teacher_id: string;
  day_of_week: DayOfWeek;
  period_number: number;
  start_time: string;
  end_time: string;
  room?: string;

}
