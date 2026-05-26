-- Schedule & Reminder system tables.

CREATE TABLE IF NOT EXISTS schedules (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL REFERENCES schools(school_id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    start_datetime TIMESTAMPTZ NOT NULL,
    end_datetime TIMESTAMPTZ NOT NULL,
    all_day BOOLEAN NOT NULL DEFAULT FALSE,
    event_type TEXT NOT NULL DEFAULT 'event',
    priority TEXT NOT NULL DEFAULT 'medium',
    status TEXT NOT NULL DEFAULT 'pending',
    color TEXT NOT NULL DEFAULT '',
    location TEXT NOT NULL DEFAULT '',
    reminder_type TEXT NOT NULL DEFAULT 'none',
    reminder_sent_at TIMESTAMPTZ,
    recurring_type TEXT NOT NULL DEFAULT 'none',
    recurring_end TIMESTAMPTZ,
    recurring_parent TEXT NOT NULL DEFAULT '',
    assigned_to TEXT[] NOT NULL DEFAULT '{}',
    created_by TEXT NOT NULL,
    attachments TEXT[] NOT NULL DEFAULT '{}',
    notes TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS schedule_reminders (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL REFERENCES schools(school_id) ON DELETE CASCADE,
    schedule_id TEXT NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    trigger_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    notify_type TEXT NOT NULL DEFAULT 'in_app',
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_schedules_school ON schedules(school_id);
CREATE INDEX IF NOT EXISTS idx_schedules_school_date ON schedules(school_id, start_datetime);
CREATE INDEX IF NOT EXISTS idx_schedules_assigned ON schedules USING GIN(assigned_to);
CREATE INDEX IF NOT EXISTS idx_schedules_created_by ON schedules(created_by);
CREATE INDEX IF NOT EXISTS idx_schedules_status ON schedules(school_id, status);
CREATE INDEX IF NOT EXISTS idx_schedules_recurring ON schedules(recurring_parent) WHERE recurring_parent != '';

CREATE INDEX IF NOT EXISTS idx_schedule_reminders_trigger ON schedule_reminders(trigger_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_schedule_reminders_schedule ON schedule_reminders(schedule_id);
CREATE INDEX IF NOT EXISTS idx_schedule_reminders_user ON schedule_reminders(user_id, status);
