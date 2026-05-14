-- Migration: 000007_materialized_views
-- Purpose: Create materialized views for dashboard and fee aggregations.
--
-- These views pre-compute expensive aggregations so the dashboard handler
-- can read them in <5ms instead of scanning full tables.
--
-- Refresh strategy:
--   - mv_school_dashboard: REFRESH CONCURRENTLY every 5 minutes via cron/background job
--   - mv_fee_summary: REFRESH CONCURRENTLY every 15 minutes or on payment
--
-- CONCURRENTLY refresh requires a UNIQUE INDEX on the view.

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. mv_school_dashboard — counts of active students, teachers, classes
-- ═══════════════════════════════════════════════════════════════════════════

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_school_dashboard AS
SELECT
    s.school_id,
    s.academic_year_id,
    -- Student counts
    COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'active') AS active_students,
    COUNT(DISTINCT s.id) AS total_students,
    -- Teacher counts (teachers may not have academic_year_id set)
    (
        SELECT COUNT(*) FROM teachers t
        WHERE t.school_id = s.school_id
          AND t.status = 'active'
          AND (t.academic_year_id = '' OR t.academic_year_id IS NULL OR t.academic_year_id = s.academic_year_id)
    ) AS active_teachers,
    -- Class counts
    (
        SELECT COUNT(*) FROM classes c
        WHERE c.school_id = s.school_id
          AND c.academic_year_id = s.academic_year_id
          AND c.status != 'archived'
    ) AS active_classes
FROM students s
WHERE s.school_id IS NOT NULL
  AND s.academic_year_id IS NOT NULL
  AND s.academic_year_id != ''
GROUP BY s.school_id, s.academic_year_id;

-- UNIQUE INDEX required for REFRESH CONCURRENTLY
CREATE UNIQUE INDEX IF NOT EXISTS mv_school_dashboard_uniq
ON mv_school_dashboard (school_id, academic_year_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. mv_fee_summary — fee collection aggregation per school/year/month
-- ═══════════════════════════════════════════════════════════════════════════

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_fee_summary AS
SELECT
    f.school_id,
    f.academic_year_id,
    f.month,
    -- Totals
    COUNT(*) AS total_invoices,
    SUM(f.amount + COALESCE(f.adjustment_amount, 0)) AS total_expected,
    SUM(COALESCE(f.paid_amount, 0)) AS total_collected,
    -- Status counts
    COUNT(*) FILTER (
        WHERE COALESCE(f.paid_amount, 0) >= (f.amount + COALESCE(f.adjustment_amount, 0))
          AND (f.amount + COALESCE(f.adjustment_amount, 0)) > 0
    ) AS paid_count,
    COUNT(*) FILTER (
        WHERE COALESCE(f.paid_amount, 0) = 0
          AND f.status != 'void'
    ) AS unpaid_count,
    COUNT(*) FILTER (
        WHERE COALESCE(f.paid_amount, 0) > 0
          AND COALESCE(f.paid_amount, 0) < (f.amount + COALESCE(f.adjustment_amount, 0))
    ) AS partial_count
FROM fees f
WHERE f.school_id IS NOT NULL
  AND f.academic_year_id IS NOT NULL
  AND f.academic_year_id != ''
  AND f.status != 'void'
GROUP BY f.school_id, f.academic_year_id, f.month;

-- UNIQUE INDEX required for REFRESH CONCURRENTLY
CREATE UNIQUE INDEX IF NOT EXISTS mv_fee_summary_uniq
ON mv_fee_summary (school_id, academic_year_id, month);

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. Helper: function to refresh views (call from Go background job)
-- ═══════════════════════════════════════════════════════════════════════════

-- Note: REFRESH CONCURRENTLY does NOT block reads. It requires the UNIQUE INDEX.
-- Call these from a Go background goroutine every 5/15 minutes:
--   REFRESH MATERIALIZED VIEW CONCURRENTLY mv_school_dashboard;
--   REFRESH MATERIALIZED VIEW CONCURRENTLY mv_fee_summary;
