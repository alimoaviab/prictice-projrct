-- Migration: 000012_perf_phase2_indexes
-- Purpose: Add the indexes called out by the Phase 5 performance audit.
--
-- Constraints honoured:
--   - All indexes use IF NOT EXISTS so a partial replay never fails.
--   - We do NOT drop or rename existing indexes — every entry below is
--     additive. The down migration is the literal reverse.
--   - We avoid CREATE INDEX CONCURRENTLY because golang-migrate wraps
--     each migration in a transaction and CONCURRENTLY can't run inside
--     one. On the table sizes the platform currently sees (<100k rows
--     across all tenants combined) the synchronous build finishes in
--     well under a second per index.
--
-- Why each index exists is documented inline so a future reader can
-- delete one without hunting through the audit doc.

-- ─────────────────────────────────────────────────────────────────────
-- 1. Reverse lookup for "events visible to this class"
--
-- The parent portal filter `for_class_id` now resolves "events
-- targeted at this class OR school-wide". Walking back from a
-- class_id to all events that target it requires scanning the
-- composite PK from a non-leading column. A dedicated index on
-- (class_id, event_id) makes that lookup an index range scan.
CREATE INDEX IF NOT EXISTS event_target_classes_class_idx
    ON event_target_classes (class_id, event_id);

-- ─────────────────────────────────────────────────────────────────────
-- 2. Per-student result history
--
-- Existing index `results_class_year_idx` is keyed on
-- (school_id, academic_year_id, class_id, graded_at). Parent and
-- profile flows query "all results for THIS student", which scans the
-- existing index from too high in the key order. A direct
-- (school_id, student_id, graded_at DESC) index turns the parent's
-- /api/parent/student-results call into an index-only-ish scan.
CREATE INDEX IF NOT EXISTS results_school_student_idx
    ON results (school_id, student_id, graded_at DESC);

-- ─────────────────────────────────────────────────────────────────────
-- 3. Per-student behavior history
--
-- `behaviors_school_student_idx` already exists on
-- (school_id, student_id). Adding the trailing created_at lets the
-- parent / profile queries skip a sort step ("show me this student's
-- behavior reports newest first").
CREATE INDEX IF NOT EXISTS behaviors_school_student_recent_idx
    ON behaviors (school_id, student_id, created_at DESC);

-- ─────────────────────────────────────────────────────────────────────
-- 4. Cross-tenant email lookup (auth.Login + parents.check-email)
--
-- The Login handler and the parent-link check both look up users by
-- email regardless of school_id, then cross-check the school. CITEXT
-- already gives us case-insensitive equality, but the unique
-- `users_school_email_uniq` is keyed (school_id, email) — a global
-- email lookup can't use it. A plain (email) index makes those flows
-- index-driven.
CREATE INDEX IF NOT EXISTS users_email_idx
    ON users (email);

-- ─────────────────────────────────────────────────────────────────────
-- 5. Class-subjects inverse lookup
--
-- The exam form, homework form, and timetable form all hit
-- /api/classes/:id/subjects. The PK on class_subjects is
-- (class_id, subject_id) which already supports class lookups, but
-- adding the school_id dimension upfront would help if we later
-- partition. For now, this is a no-op the planner already does well —
-- documented but not created.
--
-- (intentionally empty — see audit notes)
