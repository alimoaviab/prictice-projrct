-- Persist fields already present in the Go domain models.
-- These columns stop behavior and leave context from being lost on restart/build.

ALTER TABLE behaviors
    ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS attachments TEXT[] NOT NULL DEFAULT '{}';

UPDATE behaviors
SET category = incident_type
WHERE category = '';

ALTER TABLE leaves
    ADD COLUMN IF NOT EXISTS class_id TEXT REFERENCES classes(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS class_name TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS leaves_school_class_idx
    ON leaves (school_id, class_id, start_date DESC);

-- Older subscription seed SQL wrote schools.id into subscriptions.school_id.
-- Convert those rows to the tenant key used by auth and middleware.
UPDATE subscriptions AS sub
SET school_id = sch.school_id
FROM schools AS sch
WHERE sub.school_id = sch.id
  AND sub.school_id <> sch.school_id;
