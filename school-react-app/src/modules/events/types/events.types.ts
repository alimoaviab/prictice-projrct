export interface EventRecordRow {
  _id: string;
  title: string;
  description?: string;
  event_type: "academic" | "holiday" | "sports" | "cultural" | "other";
  start_date: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  visibility: "all" | "specific_classes";
  target_class_ids?: string[];
  organizer?: string;
  status: "scheduled" | "cancelled" | "completed";
  created_by?: string;
  created_at?: string;
}

export interface EventFormInput {
  title: string;
  description?: string;
  event_type: EventRecordRow["event_type"];
  start_date: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  visibility: EventRecordRow["visibility"];
  target_class_ids?: string[];
  organizer?: string;
  status: EventRecordRow["status"];
}
