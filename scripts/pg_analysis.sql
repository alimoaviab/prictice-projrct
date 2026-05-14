-- ═══════════════════════════════════════════════════════════════════════════
-- Eduplexo PostgreSQL Performance Analysis Queries
-- ═══════════════════════════════════════════════════════════════════════════
-- Run after load testing to identify bottlenecks.
-- Requires: pg_stat_statements extension enabled.

-- ─── Query 1: Slow queries (>100ms average) ──────────────────────────────
SELECT
    round(mean_exec_time::numeric, 2) AS avg_ms,
    round(total_exec_time::numeric, 2) AS total_ms,
    calls,
    round((100 * total_exec_time / sum(total_exec_time) OVER())::numeric, 2) AS pct_total,
    left(query, 120) AS query_preview
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC
LIMIT 20;

-- ─── Query 2: Sequential scans on large tables ──────────────────────────
SELECT
    schemaname || '.' || relname AS table_name,
    seq_scan,
    seq_tup_read,
    idx_scan,
    CASE WHEN (seq_scan + idx_scan) > 0
         THEN round(100.0 * idx_scan / (seq_scan + idx_scan), 1)
         ELSE 0 END AS idx_usage_pct,
    n_live_tup AS row_count
FROM pg_stat_user_tables
WHERE seq_scan > 0 AND n_live_tup > 1000
ORDER BY seq_tup_read DESC
LIMIT 15;

-- ─── Query 3: Unused indexes (wasted storage) ───────────────────────────
SELECT
    schemaname || '.' || indexrelname AS index_name,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size,
    idx_scan AS times_used,
    relname AS table_name
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND indexrelname NOT LIKE '%_pkey'
  AND indexrelname NOT LIKE '%_uniq'
ORDER BY pg_relation_size(indexrelid) DESC
LIMIT 15;

-- ─── Query 4: Index hit rate (target: >99%) ─────────────────────────────
SELECT
    'index hit rate' AS metric,
    round(
        sum(idx_blks_hit)::numeric / nullif(sum(idx_blks_hit + idx_blks_read), 0) * 100, 2
    ) AS hit_rate_pct
FROM pg_statio_user_indexes
UNION ALL
SELECT
    'table hit rate',
    round(
        sum(heap_blks_hit)::numeric / nullif(sum(heap_blks_hit + heap_blks_read), 0) * 100, 2
    )
FROM pg_statio_user_tables;

-- ─── Query 5: Table bloat (dead tuples %) ───────────────────────────────
SELECT
    schemaname || '.' || relname AS table_name,
    n_live_tup,
    n_dead_tup,
    CASE WHEN n_live_tup > 0
         THEN round(100.0 * n_dead_tup / n_live_tup, 1)
         ELSE 0 END AS dead_pct,
    last_vacuum,
    last_autovacuum
FROM pg_stat_user_tables
WHERE n_dead_tup > 100
ORDER BY n_dead_tup DESC
LIMIT 15;

-- ─── Query 6: Connection count vs max ────────────────────────────────────
SELECT
    count(*) AS active_connections,
    (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') AS max_connections,
    round(100.0 * count(*) / (SELECT setting::int FROM pg_settings WHERE name = 'max_connections'), 1) AS usage_pct
FROM pg_stat_activity
WHERE state IS NOT NULL;

-- ─── Query 7: Queries with most total time (optimization targets) ────────
SELECT
    round(total_exec_time::numeric, 0) AS total_ms,
    calls,
    round(mean_exec_time::numeric, 2) AS avg_ms,
    round((100 * total_exec_time / sum(total_exec_time) OVER())::numeric, 2) AS pct,
    left(query, 100) AS query_preview
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 15;

-- ─── Query 8: Shared buffers cache hit ratio ─────────────────────────────
SELECT
    sum(blks_hit) AS cache_hits,
    sum(blks_read) AS disk_reads,
    round(
        sum(blks_hit)::numeric / nullif(sum(blks_hit + blks_read), 0) * 100, 2
    ) AS cache_hit_ratio_pct
FROM pg_stat_database
WHERE datname = current_database();
