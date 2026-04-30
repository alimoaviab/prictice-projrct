import { StudentCreateInput, StudentUpdateInput } from "@edu/shared/validation/student.schema";

export interface StudentRow {
  _id: string;
  admission_no: string;
  first_name: string;
  last_name: string;
  class_id: string;
  section: string;
  guardian: {
    name: string;
    phone: string;
    email?: string;
  };
  status: "active" | "inactive" | "graduated" | "transferred";
}

export type StudentFormInput = StudentCreateInput;
export type StudentPatchInput = StudentUpdateInput;
