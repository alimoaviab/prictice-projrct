/**
 * Certificate module types.
 */

export type CertificateType =
  | "school_leaving"
  | "character"
  | "achievement"
  | "participation"
  | "merit"
  | "sports"
  | "appreciation"
  | "course_completion"
  | "result"
  | "custom";

export const CERTIFICATE_TYPE_LABELS: Record<CertificateType, string> = {
  school_leaving: "School Leaving Certificate",
  character: "Character Certificate",
  achievement: "Achievement Certificate",
  participation: "Participation Certificate",
  merit: "Merit Certificate",
  sports: "Sports Certificate",
  appreciation: "Appreciation Certificate",
  course_completion: "Course Completion Certificate",
  result: "Result / Performance Certificate",
  custom: "Custom Certificate",
};

export type CertificateOrientation = "landscape" | "portrait";

export interface CertificateElement {
  id: string;
  type: "text" | "image" | "shape" | "qr" | "signature" | "border";
  x: number; // percentage from left
  y: number; // percentage from top
  width: number; // percentage
  height: number; // percentage
  content: string; // text content or image URL or variable like {{student_name}}
  style: {
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: "normal" | "bold";
    fontStyle?: "normal" | "italic";
    textDecoration?: "none" | "underline";
    textAlign?: "left" | "center" | "right";
    color?: string;
    backgroundColor?: string;
    borderRadius?: number;
    opacity?: number;
  };
}

export interface CertificateTemplate {
  _id: string;
  school_id: string;
  name: string;
  type: CertificateType;
  orientation: CertificateOrientation;
  background_url?: string;
  watermark_url?: string;
  border_style?: string;
  elements: CertificateElement[];
  body_text: string; // Main certificate body with {{variables}}
  is_default: boolean;
  status: "active" | "archived";
  created_at: string;
  updated_at: string;
}

export interface GeneratedCertificate {
  _id: string;
  school_id: string;
  template_id: string;
  student_id: string;
  student_name: string;
  class_name: string;
  certificate_type: CertificateType;
  certificate_no: string;
  verification_code: string;
  qr_code_url?: string;
  pdf_url?: string;
  issue_date: string;
  expiry_date?: string;
  status: "issued" | "revoked" | "expired";
  metadata?: Record<string, string>; // All resolved variables
  body_text?: string;
  created_at: string;
}

export interface CertificateFormInput {
  name: string;
  type: CertificateType;
  orientation: CertificateOrientation;
  background_url?: string;
  watermark_url?: string;
  border_style?: string;
  elements: CertificateElement[];
  body_text: string;
  is_default?: boolean;
}

export interface GenerateCertificateInput {
  template_id: string;
  student_ids: string[];
  issue_date?: string;
  custom_fields?: Record<string, string>;
}

// Dynamic variables available for certificate templates
export const CERTIFICATE_VARIABLES = [
  { key: "{{student_name}}", label: "Student Full Name" },
  { key: "{{father_name}}", label: "Father Name" },
  { key: "{{class}}", label: "Class" },
  { key: "{{section}}", label: "Section" },
  { key: "{{roll_no}}", label: "Roll Number" },
  { key: "{{issue_date}}", label: "Issue Date" },
  { key: "{{certificate_no}}", label: "Certificate Number" },
  { key: "{{school_name}}", label: "School Name" },
  { key: "{{school_logo}}", label: "School Logo" },
  { key: "{{school_address}}", label: "School Address" },
  { key: "{{school_phone}}", label: "School Phone" },
  { key: "{{session}}", label: "Academic Session" },
  { key: "{{registration_no}}", label: "Registration Number" },
  { key: "{{admission_no}}", label: "Admission Number" },
  { key: "{{principal_name}}", label: "Principal Name" },
  { key: "{{student_photo}}", label: "Student Photo" },
  { key: "{{dob}}", label: "Date of Birth" },
  { key: "{{gender}}", label: "Gender" },
] as const;
