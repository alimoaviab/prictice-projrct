import { SchoolCreateInput } from "@edu/shared/validation/school.schema";

export interface SchoolRow {
  school_id: string;
  name: string;
  code: string;
  status: "pending" | "approved" | "rejected" | "suspended";
  admin_profile?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  plan?: {
    key?: string;
    seats?: number;
    expires_at?: string;
  };
  usage?: {
    users?: number;
    students?: number;
    teachers?: number;
    classes?: number;
    storage_mb?: number;
  };
  created_at: string;
}

export type SchoolFormInput = SchoolCreateInput;
