export type AnnouncementStatus = "draft" | "published" | "archived";
export type AnnouncementTargetType = "all" | "classes" | "teachers" | "students";
export type AnnouncementPriority = "low" | "normal" | "high" | "urgent";

export interface AnnouncementRecordRow {
  _id: string;
  title: string;
  content: string;
  target_type: AnnouncementTargetType;
  target_ids: string[];
  priority: AnnouncementPriority;
  status: AnnouncementStatus;
  created_at: string;
  published_at?: string;
  expires_at?: string;
  created_by?: {
    _id: string;
    name: string;
  };
}

export interface AnnouncementFormInput {
  title: string;
  content: string;
  target_type: AnnouncementTargetType;
  target_ids?: string[];
  priority: AnnouncementPriority;
  status: AnnouncementStatus;
  expires_at?: string;
}
