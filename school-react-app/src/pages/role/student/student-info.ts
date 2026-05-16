export interface StudentInfo {
  id: string;
  name: string;
  first_name?: string;
  last_name?: string;
  roll_no: string;
  admission_no?: string;
  email: string;
  phone: string;
  date_of_birth: string | null;
  class: string;
  class_name?: string;
  section: string;
  academic_year: string;
  status: string;
}

export interface StudentProfileData {
  student: StudentInfo;
  guardian: {
    name: string;
    phone: string;
    email: string;
  };
  enrolled_subjects: Array<{ id: string; name: string; code?: string }>;
}

type RawStudentInfo = Partial<StudentInfo> & {
  student?: Partial<StudentInfo> | null;
  guardian?: {
    name?: string;
    phone?: string;
    email?: string;
  } | null;
  enrolled_subjects?: Array<{ id: string; name: string; code?: string }> | null;
};

const EMPTY_STUDENT: StudentInfo = {
  id: "",
  name: "",
  roll_no: "",
  email: "",
  phone: "",
  date_of_birth: null,
  class: "",
  section: "",
  academic_year: "",
  status: "",
};

function normalizeStudent(student?: Partial<StudentInfo> | null): StudentInfo {
  return {
    ...EMPTY_STUDENT,
    ...(student ?? {}),
    date_of_birth: student?.date_of_birth ?? null,
  };
}

export function normalizeStudentInfo(raw: unknown): StudentProfileData | null {
  if (!raw || typeof raw !== "object") return null;

  const data = raw as RawStudentInfo;
  const student = data.student ? normalizeStudent(data.student) : normalizeStudent(data);

  return {
    student,
    guardian: {
      name: data.guardian?.name ?? "",
      phone: data.guardian?.phone ?? "",
      email: data.guardian?.email ?? "",
    },
    enrolled_subjects: Array.isArray(data.enrolled_subjects) ? data.enrolled_subjects : [],
  };
}