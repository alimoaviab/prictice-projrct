-- Rollback: Remove performance indexes added in 000006.
DROP INDEX IF EXISTS idx_attendance_school_date;
DROP INDEX IF EXISTS idx_fees_school_year_month;
DROP INDEX IF EXISTS idx_notifications_user_unread;
DROP INDEX IF EXISTS idx_audit_school_recent;
DROP INDEX IF EXISTS idx_leaves_school_pending;
DROP INDEX IF EXISTS idx_results_exam_class;
DROP INDEX IF EXISTS idx_fee_payments_school_date;
DROP INDEX IF EXISTS idx_homework_class_due_status;
DROP INDEX IF EXISTS idx_timetable_school_class_day;
