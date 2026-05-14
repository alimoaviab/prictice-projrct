// Additional document types for the domains added in Phase 2.1. They live
// in a separate file to keep types.go focused on the original Phase 2 set.
//
// JSON tags match the lean-doc shapes the React frontend already consumes.
package store

import "time"

// Attendance mirrors old-app/shared/models/attendance.model.ts.
type Attendance struct {
	ID             string    `json:"_id"`
	SchoolID       string    `json:"school_id"`
	AcademicYearID string    `json:"academic_year_id,omitempty"`
	StudentID      string    `json:"student_id"`
	ClassID        string    `json:"class_id"`
	Date           time.Time `json:"date"`
	Period         int       `json:"period,omitempty"`
	Status         string    `json:"status"` // present | absent | late | excused
	MarkedBy       string    `json:"marked_by"`
	Source         string    `json:"source,omitempty"`
	Note           string    `json:"note,omitempty"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

// Exam mirrors old-app/shared/models/exam.model.ts.
type Exam struct {
	ID             string    `json:"_id"`
	SchoolID       string    `json:"school_id"`
	AcademicYearID string    `json:"academic_year_id,omitempty"`
	ClassID        string    `json:"class_id"`
	TeacherID      string    `json:"teacher_id,omitempty"`
	Subject        string    `json:"subject"`
	Title          string    `json:"title"`
	StartsAt       time.Time `json:"starts_at"`
	MaxMarks       int       `json:"max_marks"`
	Status         string    `json:"status"`
	Description    string    `json:"description,omitempty"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

// Result mirrors old-app/shared/models/result.model.ts.
type Result struct {
	ID             string    `json:"_id"`
	SchoolID       string    `json:"school_id"`
	AcademicYearID string    `json:"academic_year_id,omitempty"`
	ExamID         string    `json:"exam_id"`
	ClassID        string    `json:"class_id"`
	StudentID      string    `json:"student_id"`
	ObtainedMarks  float64   `json:"obtained_marks"`
	Remarks        string    `json:"remarks,omitempty"`
	GradedAt       time.Time `json:"graded_at"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

// HomeworkSubmission mirrors the embedded `submissions[]` array on the
// homework document.
type HomeworkSubmission struct {
	StudentID      string     `json:"student_id"`
	Status         string     `json:"status"` // pending | submitted | graded
	AttachmentURLs []string   `json:"attachment_urls"`
	Feedback       string     `json:"feedback,omitempty"`
	SubmittedAt    *time.Time `json:"submitted_at,omitempty"`
	GradedAt       *time.Time `json:"graded_at,omitempty"`
	Marks          *float64   `json:"marks,omitempty"`
}

// Homework mirrors old-app/shared/models/homework.model.ts.
type Homework struct {
	ID             string               `json:"_id"`
	SchoolID       string               `json:"school_id"`
	AcademicYearID string               `json:"academic_year_id,omitempty"`
	ClassID        string               `json:"class_id"`
	Section        string               `json:"section,omitempty"` // Renamed from SectionID to match Student/Class
	TeacherID      string               `json:"teacher_id"`
	SubjectID      string               `json:"subject_id,omitempty"`
	Subject        string               `json:"subject,omitempty"`
	Title          string               `json:"title"`
	Instructions   string               `json:"instructions,omitempty"`
	DueAt          time.Time            `json:"due_at"`
	Status         string               `json:"status"` // draft | assigned | closed
	Submissions    []HomeworkSubmission `json:"submissions,omitempty"`
	Attachments    []string             `json:"attachments,omitempty"`     // Added
	Visibility     string               `json:"visibility,omitempty"`      // Added: all | student | parent
	CreatedBy      string               `json:"created_by,omitempty"`      // Added: UserID
	CreatedByRole  string               `json:"created_by_role,omitempty"` // Added: admin | teacher
	CreatedAt      time.Time            `json:"created_at"`
	UpdatedAt      time.Time            `json:"updated_at"`
}

// Announcement mirrors old-app/shared/models/announcement.model.ts.
type Announcement struct {
	ID         string    `json:"_id"`
	SchoolID   string    `json:"school_id"`
	Title      string    `json:"title"`
	Body       string    `json:"body,omitempty"`
	Audience   string    `json:"audience,omitempty"` // all | teachers | parents | students
	Priority   string    `json:"priority,omitempty"` // low | normal | high
	PinnedTill *time.Time `json:"pinned_till,omitempty"`
	CreatedBy  string    `json:"created_by,omitempty"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

// Behavior mirrors old-app/shared/models/behavior.model.ts.
type Behavior struct {
	ID             string    `json:"_id"`
	SchoolID       string    `json:"school_id"`
	StudentID      string    `json:"student_id"`
	ClassID        string    `json:"class_id"`
	TeacherID      string    `json:"teacher_id"`
	Category       string    `json:"category"` // New field
	IncidentType   string    `json:"incident_type"`
	Description    string    `json:"description"`
	Severity       string    `json:"severity"`
	ActionTaken    string    `json:"action_taken,omitempty"`
	Status         string    `json:"status"`
	WarningCount   int       `json:"warning_count"`
	ParentNotified bool      `json:"parent_notified"`
	Notes          string    `json:"notes,omitempty"`
	Attachments    []string  `json:"attachments,omitempty"` // New field
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

// Event mirrors old-app/shared/models/event.model.ts.
type Event struct {
	ID             string    `json:"_id"`
	SchoolID       string    `json:"school_id"`
	Title          string    `json:"title"`
	Description    string    `json:"description,omitempty"`
	EventType      string    `json:"event_type,omitempty"`
	StartDate      time.Time `json:"start_date"`
	EndDate        time.Time `json:"end_date"`
	StartTime      string    `json:"start_time,omitempty"`
	EndTime        string    `json:"end_time,omitempty"`
	Location       string    `json:"location,omitempty"`
	Visibility     string    `json:"visibility"`
	TargetClassIDs []string  `json:"target_class_ids,omitempty"`
	Organizer      string    `json:"organizer,omitempty"`
	Status         string    `json:"status,omitempty"`
	CreatedBy      string    `json:"created_by,omitempty"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

// Leave mirrors old-app/shared/models/leave.model.ts.
type Leave struct {
	ID              string     `json:"_id"`
	SchoolID        string     `json:"school_id"`
	RequesterType   string     `json:"requester_type"` // student | teacher
	RequesterID     string     `json:"requester_id"`
	RequesterName   string     `json:"requester_name,omitempty"`
	LeaveType       string     `json:"leave_type"`
	StartDate       time.Time  `json:"start_date"`
	EndDate         time.Time  `json:"end_date"`
	Reason          string     `json:"reason"`
	Status          string     `json:"status"` // pending | approved | rejected | cancelled
	ClassID         string     `json:"class_id,omitempty"`
	ClassName       string     `json:"class_name,omitempty"`
	Attachments     []string   `json:"attachments,omitempty"`
	ApprovedBy      string     `json:"approved_by,omitempty"`
	ApprovedAt      *time.Time `json:"approved_at,omitempty"`
	RejectionReason string     `json:"rejection_reason,omitempty"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
}

// TimetableSession mirrors a single embedded period entry on a timetable.
type TimetableSession struct {
	Day       int    `json:"day"`        // 0..6 (Sunday-first)
	Period    int    `json:"period"`     // 1..N
	StartsAt  string `json:"starts_at"`  // "08:00"
	EndsAt    string `json:"ends_at"`    // "08:45"
	SubjectID string `json:"subject_id,omitempty"`
	Subject   string `json:"subject,omitempty"`
	TeacherID string `json:"teacher_id,omitempty"`
	Room      string `json:"room,omitempty"`
}

// Timetable mirrors old-app/shared/models/timetable.model.ts.
type Timetable struct {
	ID             string             `json:"_id"`
	SchoolID       string             `json:"school_id"`
	AcademicYearID string             `json:"academic_year_id,omitempty"`
	ClassID        string             `json:"class_id"`
	Sessions       []TimetableSession `json:"sessions"`
	Status         string             `json:"status"`
	CreatedAt      time.Time          `json:"created_at"`
	UpdatedAt      time.Time          `json:"updated_at"`
}

// Settings mirrors old-app/shared/models/school.model.ts settings subdoc.
// Stored per-school in MemStore.SchoolSettings.
type SchoolSettings struct {
	SchoolID  string         `json:"school_id"`
	Profile   map[string]any `json:"profile,omitempty"`
	Branding  map[string]any `json:"branding,omitempty"`
	Academic  map[string]any `json:"academic,omitempty"`
	UpdatedAt time.Time      `json:"updated_at"`
}

// LiveClass mirrors old-app/shared/models/live/live-class.model.ts.
type LiveClass struct {
	ID             string    `json:"_id"`
	SchoolID       string    `json:"school_id"`
	AcademicYearID string    `json:"academic_year_id,omitempty"`
	ClassID        string    `json:"class_id"`
	Subject        string    `json:"subject,omitempty"`
	Title          string    `json:"title"`
	StartsAt       time.Time `json:"starts_at"`
	EndsAt         time.Time `json:"ends_at"`
	HostTeacherID  string    `json:"host_teacher_id,omitempty"`
	JoinURL        string    `json:"join_url,omitempty"`
	Provider       string    `json:"provider,omitempty"` // google_meet | jitsi | zoom
	Status         string    `json:"status"`             // scheduled | live | ended
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

// Notification mirrors old-app/shared/models/notification.model.ts.
type Notification struct {
	ID         string    `json:"_id"`
	SchoolID   string    `json:"school_id"`
	UserID     string    `json:"user_id"`
	Title      string    `json:"title"`
	Body       string    `json:"body,omitempty"`
	Category   string    `json:"category,omitempty"`
	Read       bool      `json:"read"`
	CreatedAt  time.Time `json:"created_at"`
}

// FeeType is defined in types_fees.go (Phase 3).
