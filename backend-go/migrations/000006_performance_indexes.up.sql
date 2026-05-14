-- Migration: 000006_performance_indexes
-- Purpose: Add missing indexes identified in performance audit.
--
-- These indexes target the most expensive query patterns:
--   1. Dashboard aggregation (attendance by school+date)
--   2. Fee ledger and dashboard (fees by school+year+month)
--   3. Notification polling (unread by user — partial index)
--   4. Recent activity feed (audit logs — partial index, last 30 days)
--   5. Leave dashboard card (pending leaves — partial index)
--   6. Result entry/view (results by exam+class)
--   7. Fee payment daily collection (payments by school+date)
--   8. Homework list (by class+due date)
--   9. Timetable lookup (by school+class+day)
--
-- All indexes use standard CREATE INDEX because CREATE INDEX CONCURRENTLY
-- cannot run inside a transaction block, and golang-migrate wraps
-- migrations in transactions by default.
--
-- Estimated creation time: <30s per index on tables with <100K rows.

-- 1. Dashboard: attendance aggregation by school and date
-- Supports: GET /api/analytics/dashboard (attendance today section)
-- Query pattern: WHERE school_id = $1 AND date >= $2 AND date <= $3
CREATE INDEX IF NOT EXISTS idx_attendance_school_date
ON attendance (school_id, date DESC);

-- 2. Fee dashboard & ledger: monthly fee status aggregation
-- Supports: GET /api/fees/ledger, GET /api/school/fees/dashboard-stats
-- Query pattern: WHERE school_id = $1 AND academic_year_id = $2 AND month = $3
CREATE INDEX IF NOT EXISTS idx_fees_school_year_month
ON fees (school_id, academic_year_id, month, status);

-- 3. Notification polling: unread count per user (partial index)
-- Supports: GET /api/notifications (badge count)
-- Query pattern: WHERE user_id = $1 AND read = false
-- Partial index only stores unread rows — much smaller than full index
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
ON notifications (user_id, read) WHERE read = false;

-- 4. Recent activity feed: per school
-- Supports: GET /api/analytics/dashboard (activities section)
-- Query pattern: WHERE school_id = $1 ORDER BY created_at DESC LIMIT 10
CREATE INDEX IF NOT EXISTS idx_audit_school_recent
ON audit_logs (school_id, created_at DESC);

-- 5. Leave dashboard card: pending leaves per school (partial index)
-- Supports: Dashboard pending leave count
-- Query pattern: WHERE school_id = $1 AND status = 'pending'
CREATE INDEX IF NOT EXISTS idx_leaves_school_pending
ON leaves (school_id, status) WHERE status = 'pending';

-- 6. Results: exam results by class for result entry/view
-- Supports: GET /api/exams/{id}/results, POST /api/exams/{id}/results
-- Query pattern: WHERE exam_id = $1 AND class_id = $2 AND academic_year_id = $3
CREATE INDEX IF NOT EXISTS idx_results_exam_class
ON results (exam_id, class_id, academic_year_id);

-- 7. Fee payments: daily collection report
-- Supports: GET /api/fees/daily-collection
-- Query pattern: WHERE school_id = $1 AND payment_date = $2
CREATE INDEX IF NOT EXISTS idx_fee_payments_school_date
ON fee_payments (school_id, payment_date DESC);

-- 8. Homework: class listing with due date ordering
-- Supports: GET /api/homework?class_id=X (teacher & student views)
-- Query pattern: WHERE school_id = $1 AND class_id = $2 ORDER BY due_at DESC
CREATE INDEX IF NOT EXISTS idx_homework_class_due_status
ON homework (school_id, class_id, due_at DESC, status);
