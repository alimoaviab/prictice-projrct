import { SchoolCreateInput } from "@edu/shared/validation/school.schema";

export interface SchoolRow {
  school_id: string;
  name: string;
  code: string;
  status: "active" | "suspended" | "blocked";
  domains: string[];
  plan?: {
    key?: string;
    seats?: number;
    expires_at?: string;
  };
  usage?: {
    users?: number;
    students?: number;
    storage_mb?: number;
  };
}

export type SchoolFormInput = SchoolCreateInput;
