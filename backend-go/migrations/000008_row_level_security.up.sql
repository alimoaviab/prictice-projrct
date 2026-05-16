-- Migration: 000008_row_level_security
-- Purpose: Enable PostgreSQL Row-Level Security for multi-tenant isolation.
--
-- This ensures that even if application code has a bug, one school can NEVER
-- see another school's data at the database level.
--
-- How it works:
--   1. Each request sets: SET LOCAL app.current_school_id = 'school_xyz'
--   2. RLS policies filter rows: WHERE school_id = current_setting('app.current_school_id')
--   3. The setting is LOCAL to the transaction — automatically cleared on commit/rollback
--
-- Performance impact: ~2-5% overhead per query (negligible vs the security benefit).
--
-- IMPORTANT: The migration user (used by golang-migrate) must be the table owner
-- or a superuser. RLS does NOT apply to table owners by default.

-- ═══════════════════════════════════════════════════════════════════════════
-- Enable RLS on all tenant-scoped tables
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;
ALTER TABLE homework ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE behaviors ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetables ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════════════
-- Create tenant isolation policies
-- ═══════════════════════════════════════════════════════════════════════════
-- Policy applies to ALL operations (SELECT, INSERT, UPDATE, DELETE).
-- Uses current_setting with a default of '' so queries without the setting
-- return no rows (fail-closed) rather than erroring.

CREATE POLICY tenant_isolation ON students
    USING (school_id = current_setting('app.current_school_id', true))
    WITH CHECK (school_id = current_setting('app.current_school_id', true));

CREATE POLICY tenant_isolation ON teachers
    USING (school_id = current_setting('app.current_school_id', true))
    WITH CHECK (school_id = current_setting('app.current_school_id', true));

CREATE POLICY tenant_isolation ON classes
    USING (school_id = current_setting('app.current_school_id', true))
    WITH CHECK (school_id = current_setting('app.current_school_id', true));

CREATE POLICY tenant_isolation ON attendance
    USING (school_id = current_setting('app.current_school_id', true))
    WITH CHECK (school_id = current_setting('app.current_school_id', true));

CREATE POLICY tenant_isolation ON fees
    USING (school_id = current_setting('app.current_school_id', true))
    WITH CHECK (school_id = current_setting('app.current_school_id', true));

CREATE POLICY tenant_isolation ON leaves
    USING (school_id = current_setting('app.current_school_id', true))
    WITH CHECK (school_id = current_setting('app.current_school_id', true));

CREATE POLICY tenant_isolation ON notifications
    USING (school_id = current_setting('app.current_school_id', true))
    WITH CHECK (school_id = current_setting('app.current_school_id', true));

CREATE POLICY tenant_isolation ON exams
    USING (school_id = current_setting('app.current_school_id', true))
    WITH CHECK (school_id = current_setting('app.current_school_id', true));

CREATE POLICY tenant_isolation ON results
    USING (school_id = current_setting('app.current_school_id', true))
    WITH CHECK (school_id = current_setting('app.current_school_id', true));

CREATE POLICY tenant_isolation ON homework
    USING (school_id = current_setting('app.current_school_id', true))
    WITH CHECK (school_id = current_setting('app.current_school_id', true));

CREATE POLICY tenant_isolation ON announcements
    USING (school_id = current_setting('app.current_school_id', true))
    WITH CHECK (school_id = current_setting('app.current_school_id', true));

CREATE POLICY tenant_isolation ON behaviors
    USING (school_id = current_setting('app.current_school_id', true))
    WITH CHECK (school_id = current_setting('app.current_school_id', true));

CREATE POLICY tenant_isolation ON events
    USING (school_id = current_setting('app.current_school_id', true))
    WITH CHECK (school_id = current_setting('app.current_school_id', true));

CREATE POLICY tenant_isolation ON timetables
    USING (school_id = current_setting('app.current_school_id', true))
    WITH CHECK (school_id = current_setting('app.current_school_id', true));

CREATE POLICY tenant_isolation ON live_classes
    USING (school_id = current_setting('app.current_school_id', true))
    WITH CHECK (school_id = current_setting('app.current_school_id', true));

CREATE POLICY tenant_isolation ON fee_types
    USING (school_id = current_setting('app.current_school_id', true))
    WITH CHECK (school_id = current_setting('app.current_school_id', true));

CREATE POLICY tenant_isolation ON class_fees
    USING (school_id = current_setting('app.current_school_id', true))
    WITH CHECK (school_id = current_setting('app.current_school_id', true));

CREATE POLICY tenant_isolation ON fee_payments
    USING (school_id = current_setting('app.current_school_id', true))
    WITH CHECK (school_id = current_setting('app.current_school_id', true));

CREATE POLICY tenant_isolation ON fee_adjustments
    USING (school_id = current_setting('app.current_school_id', true))
    WITH CHECK (school_id = current_setting('app.current_school_id', true));

CREATE POLICY tenant_isolation ON audit_logs
    USING (school_id = current_setting('app.current_school_id', true))
    WITH CHECK (school_id = current_setting('app.current_school_id', true));

-- ═══════════════════════════════════════════════════════════════════════════
-- BYPASS policy for the application role (optional)
-- ═══════════════════════════════════════════════════════════════════════════
-- If your app connects as the table owner, RLS is bypassed by default.
-- To enforce RLS even for the owner, uncomment:
-- ALTER TABLE students FORCE ROW LEVEL SECURITY;
-- (repeat for all tables)
--
-- Alternatively, create a separate non-owner role for the app:
-- CREATE ROLE app_user LOGIN PASSWORD 'xxx';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
-- Then connect as app_user in DATABASE_URL.
