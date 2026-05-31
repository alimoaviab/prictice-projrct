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

// ExamSubject is one subject inside a multi-subject exam. The exam row
// owns an ordered slice of these. SubjectID prefers the actual subject
// document _id; older callers may pass the name as id (it is treated as
// an opaque key on the wire). MaxMarks is per-subject so each section
// can have its own ceiling.
type ExamSubject struct {
	SubjectID   string `json:"subject_id"`
	SubjectName string `json:"subject_name"`
	MaxMarks    int    `json:"max_marks"`
}

// Exam mirrors old-app/shared/models/exam.model.ts.
type Exam struct {
	ID             string `json:"_id"`
	SchoolID       string `json:"school_id"`
	AcademicYearID string `json:"academic_year_id,omitempty"`
	ClassID        string `json:"class_id"`
	TeacherID      string `json:"teacher_id,omitempty"`
	// Subject and MaxMarks are kept for backward compatibility with
	// pre-multi-subject exams that were persisted before the schema
	// extension. New exams populate Subjects[] and leave Subject as the
	// first subject's name (so any legacy reader still gets *something*
	// useful). Hydrators always prefer Subjects[] when present.
	Subject     string        `json:"subject,omitempty"`
	Subjects    []ExamSubject `json:"subjects,omitempty"`
	Title       string        `json:"title"`
	Type        string        `json:"type"` // exam | test
	StartsAt    time.Time     `json:"starts_at"`
	MaxMarks    int           `json:"max_marks"` // legacy aggregate
	Status      string        `json:"status"`
	Description string        `json:"description,omitempty"`
	CreatedAt   time.Time     `json:"created_at"`
	UpdatedAt   time.Time     `json:"updated_at"`
}

// ResultSubject is one student's mark for one subject inside a
// multi-subject exam result.
type ResultSubject struct {
	SubjectID     string  `json:"subject_id"`
	SubjectName   string  `json:"subject_name"`
	ObtainedMarks float64 `json:"obtained_marks"`
}

// Result mirrors old-app/shared/models/result.model.ts.
type Result struct {
	ID             string `json:"_id"`
	SchoolID       string `json:"school_id"`
	AcademicYearID string `json:"academic_year_id,omitempty"`
	ExamID         string `json:"exam_id"`
	ClassID        string `json:"class_id"`
	StudentID      string `json:"student_id"`
	// ObtainedMarks is the aggregate (sum of subject marks) for new
	// rows, or the single mark for legacy single-subject results.
	ObtainedMarks float64         `json:"obtained_marks"`
	Subjects      []ResultSubject `json:"subjects,omitempty"`
	Remarks       string          `json:"remarks,omitempty"`
	GradedAt      time.Time       `json:"graded_at"`
	CreatedAt     time.Time       `json:"created_at"`
	UpdatedAt     time.Time       `json:"updated_at"`
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
	Grade          *float64   `json:"grade,omitempty"`
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
	ID         string     `json:"_id"`
	SchoolID   string     `json:"school_id"`
	Title      string     `json:"title"`
	Body       string     `json:"body,omitempty"`
	Audience   string     `json:"audience,omitempty"` // all | teachers | parents | students
	Priority   string     `json:"priority,omitempty"` // low | normal | high
	PinnedTill *time.Time `json:"pinned_till,omitempty"`
	CreatedBy  string     `json:"created_by,omitempty"`
	CreatedAt  time.Time  `json:"created_at"`
	UpdatedAt  time.Time  `json:"updated_at"`
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
	Day       int    `json:"day"`       // 0..6 (Sunday-first)
	Period    int    `json:"period"`    // 1..N
	StartsAt  string `json:"starts_at"` // "08:00"
	EndsAt    string `json:"ends_at"`   // "08:45"
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
//
// Live classes use public Jitsi Meet rooms. The backend generates a unique
// room URL per session. No external API keys or accounts required.
//
// Audience targeting:
//   - audience_type: "CLASS" (visible to all students in class) or "STUDENT" (visible to specific student only)
//   - target_student_id: optional, required when audience_type is "STUDENT"
type LiveClass struct {
	ID              string    `json:"_id"`
	SchoolID        string    `json:"school_id"`
	AcademicYearID  string    `json:"academic_year_id,omitempty"`
	ClassID         string    `json:"class_id"`
	Subject         string    `json:"subject,omitempty"`
	Title           string    `json:"title"`
	Description     string    `json:"description,omitempty"`
	StartsAt        time.Time `json:"starts_at"`
	EndsAt          time.Time `json:"ends_at"`
	HostTeacherID   string    `json:"host_teacher_id,omitempty"`
	JoinURL         string    `json:"join_url,omitempty"`
	Provider        string    `json:"provider,omitempty"`      // jitsi
	Status          string    `json:"status"`                  // scheduled | live | ended | cancelled
	AudienceType    string    `json:"audience_type,omitempty"` // CLASS | STUDENT
	TargetStudentID string    `json:"target_student_id,omitempty"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

// Notification mirrors old-app/shared/models/notification.model.ts.
type Notification struct {
	ID        string    `json:"_id"`
	SchoolID  string    `json:"school_id"`
	UserID    string    `json:"user_id"`
	Title     string    `json:"title"`
	Body      string    `json:"body,omitempty"`
	Category  string    `json:"category,omitempty"`
	Read      bool      `json:"read"`
	CreatedAt time.Time `json:"created_at"`
}

// FeeType is defined in types_fees.go (Phase 3).

// ─── Certificates ────────────────────────────────────────────────────────

// CertificateTemplate stores a reusable certificate design.
type CertificateTemplate struct {
	ID            string    `json:"_id"`
	SchoolID      string    `json:"school_id"`
	Name          string    `json:"name"`
	Type          string    `json:"type"`          // character, school_leaving, achievement, etc.
	Orientation   string    `json:"orientation"`   // landscape | portrait
	BackgroundURL string    `json:"background_url"`
	WatermarkURL  string    `json:"watermark_url"`
	BorderStyle   string    `json:"border_style"`
	BodyText      string    `json:"body_text"`
	Elements      string    `json:"elements"`      // JSON string of positioned elements
	IsDefault     bool      `json:"is_default"`
	Status        string    `json:"status"`        // active | archived
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

// GeneratedCertificate is a certificate issued to a specific student.
type GeneratedCertificate struct {
	ID               string    `json:"_id"`
	SchoolID         string    `json:"school_id"`
	TemplateID       string    `json:"template_id"`
	StudentID        string    `json:"student_id"`
	StudentName      string    `json:"student_name"`
	ClassName        string    `json:"class_name"`
	CertificateType  string    `json:"certificate_type"`
	CertificateNo    string    `json:"certificate_no"`
	VerificationCode string    `json:"verification_code"`
	QRCodeURL        string    `json:"qr_code_url"`
	PDFURL           string    `json:"pdf_url"`
	IssueDate        time.Time `json:"issue_date"`
	ExpiryDate       *time.Time `json:"expiry_date,omitempty"`
	Status           string    `json:"status"` // issued | revoked | expired
	CreatedAt        time.Time `json:"created_at"`
}

// ─── Question Papers ─────────────────────────────────────────────────────

type QuestionPaper struct {
	ID          string    `json:"_id"`
	SchoolID    string    `json:"school_id"`
	Title       string    `json:"title"`
	ClassID     string    `json:"class_id"`
	ClassName   string    `json:"class_name"`
	SubjectID   string    `json:"subject_id,omitempty"`
	SubjectName string    `json:"subject_name,omitempty"`
	ChapterIDs  []string  `json:"chapter_ids,omitempty"`
	TeacherID   string    `json:"teacher_id,omitempty"`
	TeacherName string    `json:"teacher_name,omitempty"`
	Date        string    `json:"date,omitempty"`
	Questions   string    `json:"questions,omitempty"`
	Status      string    `json:"status"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// ─── Questions (Internal Repository) ────────────────────────────────────

type Question struct {
	ID             string     `json:"_id"`
	SchoolID       string     `json:"school_id"`
	CreatedBy      string     `json:"created_by"`
	CreatedByName  string     `json:"created_by_name,omitempty"`
	BoardID        string     `json:"board_id,omitempty"`
	ClassID        string     `json:"class_id"`
	SubjectID      string     `json:"subject_id,omitempty"`
	SubjectName    string     `json:"subject_name,omitempty"`
	ChapterID      string     `json:"chapter_id,omitempty"`
	TopicID        string     `json:"topic_id,omitempty"`
	Type           string     `json:"type"`
	Difficulty     string     `json:"difficulty"`
	QuestionHTML   string     `json:"question_html"`
	Options        string     `json:"options,omitempty"`
	Marks          int        `json:"marks,omitempty"`
	Status         string     `json:"status"`
	IsGlobal       bool       `json:"is_global"`
	ApprovalStatus string     `json:"approval_status"`
	ApprovedBy     string     `json:"approved_by,omitempty"`
	ApprovedAt     *time.Time `json:"approved_at,omitempty"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
}

// ─── Boards ──────────────────────────────────────────────────────────────

type Board struct {
	ID        string    `json:"_id"`
	Name      string    `json:"name"`
	Code      string    `json:"code"`
	IsActive  bool      `json:"is_active"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// ─── Topics ──────────────────────────────────────────────────────────────

type Topic struct {
	ID          string    `json:"_id"`
	ChapterID   string    `json:"chapter_id"`
	Name        string    `json:"name"`
	Code        string    `json:"code"`
	Description string    `json:"description,omitempty"`
	IsActive    bool      `json:"is_active"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// ── Chapters ────────────────────────────────────────────────────────────

type Chapter struct {
	ID            string    `json:"_id"`
	SchoolID      string    `json:"school_id"`
	BoardID       string    `json:"board_id,omitempty"`
	ClassID       string    `json:"class_id"`
	ClassName     string    `json:"class_name,omitempty"`
	SubjectID     string    `json:"subject_id,omitempty"`
	SubjectName   string    `json:"subject_name,omitempty"`
	Title         string    `json:"title"`
	ChapterNumber int       `json:"chapter_number"`
	IsDefault     bool      `json:"is_default"`
	Status        string    `json:"status"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

// ─── Star Collections ────────────────────────────────────────────────────

type StarCollection struct {
	ID        string    `json:"_id"`
	UserID    string    `json:"user_id"`
	SchoolID  string    `json:"school_id"`
	Name      string    `json:"name"`
	Color     string    `json:"color"`
	CreatedAt time.Time `json:"created_at"`
}

// ─── Import Logs ─────────────────────────────────────────────────────────

type ImportLog struct {
	ID            string    `json:"_id"`
	SchoolID      string    `json:"school_id"`
	UploadedBy    string    `json:"uploaded_by"`
	FileName      string    `json:"file_name"`
	TotalRows     int       `json:"total_rows"`
	SuccessRows   int       `json:"success_rows"`
	FailedRows    int       `json:"failed_rows"`
	Duplicates    int       `json:"duplicates"`
	Duration      int       `json:"duration"` // in milliseconds
	Status        string    `json:"status"`   // processing | completed | failed
	FailedRowsCSV string    `json:"failed_rows_csv,omitempty"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

// ─── Exam Security ───────────────────────────────────────────────────────

type ExamSecuritySettings struct {
	ExamID             string `json:"exam_id"`
	ShuffleQuestions   bool   `json:"shuffle_questions"`
	ShuffleOptions     bool   `json:"shuffle_options"`
	IPRestriction      bool   `json:"ip_restriction"`
	MaxTabSwitches     int    `json:"max_tab_switches"`
	RequireFullscreen  bool   `json:"require_fullscreen"`
	WebcamEnabled      bool   `json:"webcam_enabled"`
	PerQuestionTimeLimit int  `json:"per_question_time_limit"` // seconds, 0 = disabled
}

type ExamSecurityLog struct {
	ID        string    `json:"_id"`
	ExamID    string    `json:"exam_id"`
	StudentID string    `json:"student_id"`
	EventType string    `json:"event_type"` // tab_switch, copy_attempt, fullscreen_exit, ip_change
	EventData string    `json:"event_data"` // JSON
	Timestamp time.Time `json:"timestamp"`
}

// ─── AI Generation Logs ──────────────────────────────────────────────────

type AIGenerationLog struct {
	ID         string    `json:"_id"`
	TeacherID  string    `json:"teacher_id"`
	SchoolID   string    `json:"school_id"`
	Prompt     string    `json:"prompt"`
	Model      string    `json:"model"`
	TokensUsed int       `json:"tokens_used"`
	QuestionsGenerated int `json:"questions_generated"`
	CreatedAt  time.Time `json:"created_at"`
}
