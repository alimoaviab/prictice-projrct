-- Rollback schedule tables

DROP INDEX IF EXISTS idx_schedule_reminders_user;
DROP INDEX IF EXISTS idx_schedule_reminders_schedule;
DROP INDEX IF EXISTS idx_schedule_reminders_trigger;
DROP INDEX IF EXISTS idx_schedules_recurring;
DROP INDEX IF EXISTS idx_schedules_status;
DROP INDEX IF EXISTS idx_schedules_created_by;
DROP INDEX IF EXISTS idx_schedules_assigned;
DROP INDEX IF EXISTS idx_schedules_school_date;
DROP INDEX IF EXISTS idx_schedules_school;

DROP TABLE IF EXISTS schedule_reminders CASCADE;
DROP TABLE IF EXISTS schedules CASCADE;
