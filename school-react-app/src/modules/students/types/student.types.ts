type StudentCreateInput = any;
type StudentUpdateInput = any;

export interface StudentRow {
  _id: string;
  admission_no: string;
  first_name: string;
  last_name: string;
  class_id: string;
  subjects?: string[];
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
