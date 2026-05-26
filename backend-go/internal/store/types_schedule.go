package store

import "time"

// Schedule represents a calendar event, task, meeting, or reminder.
type Schedule struct {
	ID              string     `json:"_id"`
	SchoolID        string     `json:"school_id"`
	Title           string     `json:"title"`
	Description     string     `json:"description,omitempty"`
	StartDatetime   time.Time  `json:"start_datetime"`
	EndDatetime     time.Time  `json:"end_datetime"`
	AllDay          bool       `json:"all_day,omitempty"`
	EventType       string     `json:"event_type"`       // meeting, task, event, reminder, class
	Priority        string     `json:"priority"`         // low, medium, high, urgent
	Status          string     `json:"status"`           // pending, in_progress, completed, missed, cancelled
	Color           string     `json:"color,omitempty"`  // hex color for calendar display
	Location        string     `json:"location,omitempty"`
	ReminderType    string     `json:"reminder_type"`    // none, at_time, 30min, 1hour, 1day
	ReminderSentAt  *time.Time `json:"reminder_sent_at,omitempty"`
	RecurringType   string     `json:"recurring_type,omitempty"` // none, daily, weekly, monthly, custom
	RecurringEnd    *time.Time `json:"recurring_end,omitempty"`
	RecurringParent string     `json:"recurring_parent,omitempty"` // ID of parent schedule for recurring instances
	AssignedTo      []string   `json:"assigned_to,omitempty"`     // user IDs
	CreatedBy       string     `json:"created_by"`
	Attachments     []string   `json:"attachments,omitempty"`
	Notes           string     `json:"notes,omitempty"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
}

// ScheduleReminder tracks individual reminder jobs for schedules.
type ScheduleReminder struct {
	ID           string    `json:"_id"`
	SchoolID     string    `json:"school_id"`
	ScheduleID   string    `json:"schedule_id"`
	UserID       string    `json:"user_id"`
	TriggerAt    time.Time `json:"trigger_at"`
	Status       string    `json:"status"` // pending, sent, failed
	NotifyType   string    `json:"notify_type"` // in_app, push, email
	SentAt       *time.Time `json:"sent_at,omitempty"`
	CreatedAt    time.Time  `json:"created_at"`
}
