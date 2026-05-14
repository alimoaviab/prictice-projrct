/**
 * In-memory mock database used by MSW handlers. Provides realistic seed data
 * for every tenant-scoped collection so the UI can be exercised end-to-end
 * without the Node backend.
 *
 * IMPORTANT: This is a temporary stand-in. Once the Go backend is wired up,
 * MSW is disabled (VITE_ENABLE_MOCKS=false) and `serviceRequest` hits the
 * real API. The mock collections are intentionally shaped exactly like the
 * Mongoose documents the original Node API returns, so handlers can mimic
 * its responses verbatim.
 */

const SCHOOL_ID = "school_seed_1";
const ACADEMIC_YEAR_ID = "ay_2025_26";

export interface MockAcademicYear {
  _id: string;
  school_id: string;
  year: string;
  is_active: boolean;
  starts_on: string;
  ends_on: string;
}

export interface MockClass {
  _id: string;
  school_id: string;
  academic_year_id: string;
  name: string;
  section: string;
  grade?: string;
  capacity: number;
  homeroom_teacher_id?: string;
}

export interface MockStudent {
  _id: string;
  school_id: string;
  academic_year_id: string;
  admission_no: string;
  first_name: string;
  last_name: string;
  class_id: string;
  section: string;
  subjects?: string[];
  guardian: { name: string; phone: string; email?: string };
  status: "active" | "inactive" | "graduated" | "transferred";
}

export interface MockTeacher {
  _id: string;
  school_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  status: "active" | "inactive";
  subject_ids?: string[];
}

export interface MockSubject {
  _id: string;
  school_id: string;
  name: string;
  code: string;
}

export interface MockExam {
  _id: string;
  school_id: string;
  academic_year_id: string;
  title: string;
  exam_type: string;
  starts_on: string;
  ends_on: string;
  status: "draft" | "scheduled" | "ongoing" | "completed";
}

const academicYears: MockAcademicYear[] = [
  {
    _id: ACADEMIC_YEAR_ID,
    school_id: SCHOOL_ID,
    year: "2025-26",
    is_active: true,
    starts_on: "2025-04-01",
    ends_on: "2026-03-31",
  },
  {
    _id: "ay_2024_25",
    school_id: SCHOOL_ID,
    year: "2024-25",
    is_active: false,
    starts_on: "2024-04-01",
    ends_on: "2025-03-31",
  },
];

const classes: MockClass[] = [
  {
    _id: "cls_1",
    school_id: SCHOOL_ID,
    academic_year_id: ACADEMIC_YEAR_ID,
    name: "Grade 5",
    section: "A",
    grade: "5",
    capacity: 35,
  },
  {
    _id: "cls_2",
    school_id: SCHOOL_ID,
    academic_year_id: ACADEMIC_YEAR_ID,
    name: "Grade 6",
    section: "B",
    grade: "6",
    capacity: 35,
  },
];

const subjects: MockSubject[] = [
  { _id: "sub_math", school_id: SCHOOL_ID, name: "Mathematics", code: "MATH" },
  { _id: "sub_eng", school_id: SCHOOL_ID, name: "English", code: "ENG" },
  { _id: "sub_sci", school_id: SCHOOL_ID, name: "Science", code: "SCI" },
];

const teachers: MockTeacher[] = [
  {
    _id: "tch_1",
    school_id: SCHOOL_ID,
    first_name: "Ada",
    last_name: "Lovelace",
    email: "ada@school.test",
    status: "active",
    subject_ids: ["sub_math"],
  },
  {
    _id: "tch_2",
    school_id: SCHOOL_ID,
    first_name: "Alan",
    last_name: "Turing",
    email: "alan@school.test",
    status: "active",
    subject_ids: ["sub_sci"],
  },
];

const students: MockStudent[] = [
  {
    _id: "stu_1",
    school_id: SCHOOL_ID,
    academic_year_id: ACADEMIC_YEAR_ID,
    admission_no: "ADM-1001",
    first_name: "Aria",
    last_name: "Khan",
    class_id: "cls_1",
    section: "A",
    guardian: { name: "Sara Khan", phone: "+92-300-1234567" },
    status: "active",
  },
  {
    _id: "stu_2",
    school_id: SCHOOL_ID,
    academic_year_id: ACADEMIC_YEAR_ID,
    admission_no: "ADM-1002",
    first_name: "Bilal",
    last_name: "Ahmed",
    class_id: "cls_1",
    section: "A",
    guardian: { name: "Omar Ahmed", phone: "+92-301-2345678" },
    status: "active",
  },
];

const exams: MockExam[] = [
  {
    _id: "exam_1",
    school_id: SCHOOL_ID,
    academic_year_id: ACADEMIC_YEAR_ID,
    title: "Midterm — Term 1",
    exam_type: "midterm",
    starts_on: "2025-09-15",
    ends_on: "2025-09-22",
    status: "scheduled",
  },
];

export const db = {
  schoolId: SCHOOL_ID,
  academicYears,
  classes,
  students,
  teachers,
  subjects,
  exams,
};
