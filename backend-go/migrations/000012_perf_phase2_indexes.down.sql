-- Down migration: drop the indexes added in 000012.
-- Order matches the up migration so the file reads top-to-bottom.

DROP INDEX IF EXISTS event_target_classes_class_idx;
DROP INDEX IF EXISTS results_school_student_idx;
DROP INDEX IF EXISTS behaviors_school_student_recent_idx;
DROP INDEX IF EXISTS users_email_idx;
