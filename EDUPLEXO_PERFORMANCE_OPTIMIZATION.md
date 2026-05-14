# Eduplexo Performance & MB Optimization Documentation

**Version:** 1.0.0  
**Date:** May 15, 2026  
**Classification:** Internal — Production Engineering  
**Prepared by:** Performance Engineering Team  
**Platform:** Eduplexo Multi-Tenant School ERP SaaS

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current Architecture Analysis](#2-current-architecture-analysis)
3. [Existing Bottlenecks](#3-existing-bottlenecks)
4. [API Optimization Strategy](#4-api-optimization-strategy)
5. [Frontend Optimization Strategy](#5-frontend-optimization-strategy)
6. [Backend Optimization Strategy](#6-backend-optimization-strategy)
7. [PostgreSQL Optimization](#7-postgresql-optimization)
8. [Redis Integration Strategy](#8-redis-integration-strategy)
9. [Multi-Tenant Scaling Strategy](#9-multi-tenant-scaling-strategy)
10. [Docker & VPS Optimization](#10-docker--vps-optimization)
11. [Memory Optimization](#11-memory-optimization)
12. [CPU Optimization](#12-cpu-optimization)
13. [Network Optimization](#13-network-optimization)
14. [Pagination & Lazy Loading Strategy](#14-pagination--lazy-loading-strategy)
15. [Dashboard Optimization](#15-dashboard-optimization)
16. [Realtime Optimization](#16-realtime-optimization)
17. [Query Optimization](#17-query-optimization)
18. [Caching Matrix](#18-caching-matrix)
19. [Per-Module Optimization](#19-per-module-optimization)
20. [Per-Portal Optimization](#20-per-portal-optimization)
21. [Monitoring & Logging](#21-monitoring--logging)
22. [Production Scaling Plan](#22-production-scaling-plan)
23. [Estimated Performance Gains](#23-estimated-performance-gains)
24. [Priority-based Optimization Roadmap](#24-priority-based-optimization-roadmap)

---

## 1. Executive Summary

### Critical Finding

Eduplexo currently operates on a **hybrid in-memory + PostgreSQL architecture** where the entire dataset is loaded into a Go `MemStore` (sync.RWMutex-protected slices) at boot, with background flush to PostgreSQL every 1-2 seconds. This architecture has **severe scaling limitations**:

- **Memory:** Every entity lives in RAM. At 100 schools × 500 students = 50,000 student records permanently in heap.
- **CPU:** Every query performs O(n) linear scans over slices with `school_id` filtering.
- **Concurrency:** Single RWMutex creates lock contention under concurrent requests.
- **Persistence:** 30-second full-snapshot writes the ENTIRE store to PG in one transaction.

### Performance Risk Assessment

| Metric | Current (10 schools) | At 50 schools | At 200 schools |
|--------|---------------------|---------------|----------------|
| RAM Usage | ~200MB | ~1.2GB | ~5GB+ (OOM risk) |
| Dashboard API latency | 15-40ms | 80-200ms | 500ms-2s |
| Full Snapshot TX time | 200ms | 2-5s | 15-30s (PG lock risk) |
| Concurrent users | 50 OK | 200 degraded | 500+ failure |

### Strategic Recommendation

Transition from MemStore → **Direct PostgreSQL queries + Redis cache layer** within 8-12 weeks. The current architecture cannot scale beyond ~50 active schools without fundamental redesign.

---

## 2. Current Architecture Analysis

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CURRENT ARCHITECTURE                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────────────┐    │
│  │ Super Admin  │   │ School App   │   │ School React App         │    │
│  │ (React+Vite) │   │ (Next.js)    │   │ (React 19 + Vite 6)     │    │
│  │ Port: 3001   │   │ Port: 3002   │   │ Port: 3000              │    │
│  └──────┬───────┘   └──────┬───────┘   └──────────┬───────────────┘    │
│         │                   │                       │                    │
│         └───────────────────┼───────────────────────┘                    │
│                             │ HTTP /api/*                                 │
│                             ▼                                            │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    Go Backend (Chi Router)                         │   │
│  │                         Port: 8080                                │   │
│  │  ┌─────────────────────────────────────────────────────────────┐ │   │
│  │  │                    MemStore (sync.RWMutex)                    │ │   │
│  │  │  Schools[] | Users[] | Students[] | Teachers[] | Classes[]   │ │   │
│  │  │  Attendance[] | Exams[] | Results[] | Fees[] | Homework[]    │ │   │
│  │  │  Events[] | Leaves[] | Timetables[] | Notifications[]       │ │   │
│  │  └─────────────────────────────────────────────────────────────┘ │   │
│  │         │ Save()              │ Load() at boot                    │   │
│  │         ▼ (1s flush)         ▼                                    │   │
│  │  ┌─────────────────────────────────────────────────────────────┐ │   │
│  │  │              Persistence Layer (pgxpool)                      │ │   │
│  │  │  - Batched UPSERT queue (1s interval)                        │ │   │
│  │  │  - Full Snapshot every 30s                                   │ │   │
│  │  └─────────────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                             │                                            │
│                             ▼                                            │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │              PostgreSQL 16 (Alpine)                                │   │
│  │              - 27 tables with proper indexes                      │   │
│  │              - UPSERT-based persistence                           │   │
│  │              - Named volume: eduplexo_postgres_data               │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │              Redis (PLANNED - NOT YET INTEGRATED)                  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Tech Stack Details

| Component | Technology | Version | Notes |
|-----------|-----------|---------|-------|
| Backend | Go + Chi | Go 1.22+ | Chi v5 router, distroless container |
| Frontend (School) | React + Vite | React 19, Vite 6 | TanStack Query v5, Tailwind v4 |
| Frontend (Super Admin) | React + Vite | React 18, Vite 5 | TanStack Query v5, Tailwind v3 |
| Database | PostgreSQL | 16-alpine | pgxpool connection pool |
| Migrations | golang-migrate | v4.18.1 | SQL-based migrations |
| Container | Docker Compose | - | Multi-service orchestration |
| Auth | JWT + RBAC | - | Cookie + Bearer token dual-mode |

### Multi-Tenancy Model

```
Isolation Keys:
  ├── school_id        → Primary tenant boundary (every table)
  ├── academic_year_id → Temporal data scoping
  └── user.role        → Portal access control (super_admin, admin, teacher, parent, student)
```

### Data Flow Pattern

```
Request → Chi Middleware (CORS, Auth, Logger)
       → Domain Handler
       → MemStore.RLock() / Lock()
       → Linear scan over slice with school_id filter
       → JSON response
       → (Mutations) → Save() → Queue → 1s flush → PG UPSERT
```



---

## 3. Existing Bottlenecks

### 3.1 Critical Bottlenecks (P0 — Immediate Risk)

| # | Bottleneck | Impact | Affected Area |
|---|-----------|--------|---------------|
| 1 | **MemStore O(n) scans** | Every API call scans entire slice. Dashboard iterates Students[], Teachers[], Classes[], Attendance[], Fees[], Leaves[], AuditLogs[] — 7 full scans per request | All APIs |
| 2 | **Single RWMutex** | All reads block during any write. Full snapshot (30s) holds write lock during plan building | Concurrency |
| 3 | **Full Snapshot in single TX** | At scale, 1000+ UPSERTs in one transaction = PG lock escalation, WAL bloat | Persistence |
| 4 | **No pagination** | All list endpoints return entire dataset. 500 students = 500-item JSON array | All list APIs |
| 5 | **No Redis cache** | Every request recalculates. Dashboard aggregations recomputed on every page load | Dashboard, Analytics |

### 3.2 High Bottlenecks (P1 — Near-term Risk)

| # | Bottleneck | Impact | Affected Area |
|---|-----------|--------|---------------|
| 6 | **N+1 hydration pattern** | Attendance.hydrate() builds studentByID and classByID maps on EVERY request | Attendance, Results |
| 7 | **No response compression** | JSON payloads sent uncompressed. Student list with 500 records ≈ 200KB raw | Network |
| 8 | **No request batching** | Dashboard makes 5-8 separate API calls on mount | Frontend |
| 9 | **No connection pooling config** | pgxpool uses defaults (max 4 conns). Under load, connection starvation | Database |
| 10 | **30s snapshot interval** | Entire MemStore serialized every 30s regardless of changes | CPU, I/O |

### 3.3 Medium Bottlenecks (P2 — Growth Risk)

| # | Bottleneck | Impact | Affected Area |
|---|-----------|--------|---------------|
| 11 | **No rate limiting** | Any client can hammer APIs. No protection against abuse | Security, CPU |
| 12 | **No query result caching** | Identical requests within seconds recalculate fully | All APIs |
| 13 | **Frontend bundle not split** | All modules loaded upfront (no lazy routes) | Frontend load time |
| 14 | **No CDN for static assets** | Vite build served from same VPS | Network, Latency |
| 15 | **Audit log unbounded growth** | AuditLogs[] grows indefinitely in memory | Memory |

### 3.4 Bottleneck Impact Matrix

```
                    ┌─────────────────────────────────────────────┐
                    │         IMPACT vs EFFORT MATRIX              │
                    ├─────────────────────────────────────────────┤
                    │                                              │
  HIGH IMPACT       │  [Redis Cache]     [Direct PG Queries]      │
                    │  [Pagination]      [Connection Pool Tuning]  │
                    │                                              │
                    │  [Gzip/Brotli]     [Route Splitting]         │
  MEDIUM IMPACT     │  [API Batching]    [Materialized Views]      │
                    │  [Rate Limiting]                             │
                    │                                              │
  LOW IMPACT        │  [CDN]             [Log Rotation]            │
                    │  [Health Checks]                             │
                    │                                              │
                    ├──────────────┬──────────────┬───────────────┤
                    │  LOW EFFORT  │ MEDIUM EFFORT│ HIGH EFFORT   │
                    └──────────────┴──────────────┴───────────────┘
```

---

## 4. API Optimization Strategy

### 4.1 Current API Surface Analysis

| Endpoint Group | Methods | Estimated Payload | Frequency | Risk Level |
|---------------|---------|-------------------|-----------|------------|
| `/api/analytics/dashboard` | GET | 2-8KB | Every page load | 🔴 HIGH |
| `/api/students` | GET, POST, PATCH, DELETE | 50-200KB (list) | High | 🔴 HIGH |
| `/api/attendance` | GET, POST (bulk) | 20-100KB | Very High (daily) | 🔴 HIGH |
| `/api/fees/*` | 15+ endpoints | 10-150KB | Medium-High | 🟡 MEDIUM |
| `/api/super-admin/dashboard` | GET | 3-5KB | Low frequency | 🟡 MEDIUM |
| `/api/super-admin/schools` | GET | 5-50KB | Low | 🟢 LOW |
| `/api/results` | GET, POST | 20-80KB | Seasonal spikes | 🟡 MEDIUM |
| `/api/notifications` | GET | 5-20KB | Polling-heavy | 🔴 HIGH |

### 4.2 API Merge Strategy

**Current Problem:** Frontend makes 5-8 API calls on dashboard mount.

```
CURRENT (Admin Dashboard Load):
  GET /api/analytics/dashboard     → overview stats
  GET /api/attendance?date=today   → today's attendance
  GET /api/events?upcoming=true    → upcoming events
  GET /api/leave?status=pending    → pending leaves
  GET /api/notifications           → unread notifications
  GET /api/fees/dashboard-stats    → fee collection
  ─────────────────────────────────
  Total: 6 round-trips, ~400ms cumulative latency
```

**Recommended Merged API:**

```
OPTIMIZED:
  GET /api/dashboard/composite?sections=overview,attendance,events,leave,fees
  ─────────────────────────────────
  Total: 1 round-trip, ~80ms latency
  Savings: 5 TCP connections, 320ms latency reduction
```

### 4.3 API Response Envelope Optimization

**Current envelope:**
```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

**Add:**
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "per_page": 25,
    "total": 487,
    "cached": true,
    "cache_age_ms": 12000
  }
}
```

### 4.4 API Versioning & Deprecation

Introduce `/api/v2/` for optimized endpoints while maintaining `/api/v1/` backward compatibility during migration.

### 4.5 Request Deduplication

Implement server-side request deduplication using request fingerprinting:
- Hash: `SHA256(user_id + endpoint + query_params + body_hash)`
- Window: 100ms
- Benefit: Prevents double-submit on slow networks

---

## 5. Frontend Optimization Strategy

### 5.1 Current Frontend Analysis

| App | Framework | Bundle Strategy | Data Fetching | State Management |
|-----|-----------|----------------|---------------|-----------------|
| school-react-app | React 19 + Vite 6 | Single bundle (no splitting) | TanStack Query v5 | Context + localStorage |
| super-admin-app | React 18 + Vite 5 | Single bundle | TanStack Query v5 | Context |

### 5.2 Route-Level Code Splitting

**Current:** All modules loaded eagerly.

**Recommended:**
```typescript
// routes/index.tsx — Lazy load every module
const Dashboard = lazy(() => import('@/modules/dashboard/DashboardPage'));
const Students = lazy(() => import('@/modules/students/StudentsPage'));
const Attendance = lazy(() => import('@/modules/attendance/AttendancePage'));
const Fees = lazy(() => import('@/modules/fees/FeesPage'));
const Exams = lazy(() => import('@/modules/exams/ExamsPage'));
// ... all 17 modules
```

**Impact:**
- Initial bundle: ~800KB → ~200KB (75% reduction)
- First Contentful Paint: ~2.5s → ~0.8s
- Per-route chunk: 30-80KB each (loaded on demand)

### 5.3 TanStack Query Optimization

**Current patterns to fix:**

```typescript
// BAD: No staleTime — refetches on every focus/mount
useQuery({ queryKey: ['students'], queryFn: fetchStudents });

// GOOD: Proper cache configuration
useQuery({
  queryKey: ['students', { schoolId, yearId, page }],
  queryFn: fetchStudents,
  staleTime: 5 * 60 * 1000,      // 5 min — data doesn't change every second
  gcTime: 30 * 60 * 1000,         // 30 min garbage collection
  placeholderData: keepPreviousData, // No flash during pagination
  refetchOnWindowFocus: false,     // Disable aggressive refetch
});
```

### 5.4 Virtual Scrolling for Large Lists

| List | Expected Rows | Current Render | Recommended |
|------|--------------|----------------|-------------|
| Students | 200-2000 | Full DOM render | Virtual scroll (react-virtual) |
| Attendance | 50-500/day | Full DOM | Paginated (25/page) |
| Fee Ledger | 500-5000 | Full DOM | Virtual scroll + infinite |
| Notifications | 100-1000 | Full DOM | Infinite scroll (20/batch) |
| Audit Logs | 1000+ | Full DOM | Virtual scroll + date filter |

### 5.5 Skeleton Loading Strategy

Every data-dependent component should show skeleton immediately:

```
Mount → Show Skeleton (0ms)
     → TanStack Query fires
     → Cache hit? Show data (0ms additional)
     → Cache miss? Show skeleton until response (~100-300ms)
```

### 5.6 Image & Asset Optimization

- Student photos: Serve via CDN with WebP format, max 200x200px thumbnails
- School logos: SVG preferred, PNG fallback at 2x max
- Lazy load images below fold with `loading="lazy"`
- Use `srcset` for responsive images

### 5.7 Debouncing & Throttling Matrix

| Interaction | Current | Recommended | Delay |
|------------|---------|-------------|-------|
| Search input | Immediate API call | Debounce | 300ms |
| Filter change | Immediate | Debounce | 200ms |
| Scroll pagination | - | Throttle | 100ms |
| Window resize | - | Debounce | 150ms |
| Attendance toggle | Immediate save | Batch + debounce | 500ms |



---

## 6. Backend Optimization Strategy

### 6.1 MemStore → Direct Query Migration Path

**Phase 1 (Immediate):** Keep MemStore but add index maps.

```go
// Current: O(n) scan
for _, s := range h.Store.Students {
    if s.SchoolID == ctx.SchoolID { ... }
}

// Optimized: O(1) lookup via pre-built index
type MemStore struct {
    // ... existing slices ...
    
    // Index maps (rebuilt on mutation)
    studentsBySchool   map[string][]*Student        // school_id → students
    teachersBySchool   map[string][]*Teacher
    classesBySchool    map[string][]*Class
    attendanceByDate   map[string][]*Attendance     // "school_id:date" → records
    feesByStudent      map[string][]*Fee            // "school_id:student_id" → fees
}
```

**Phase 2 (Week 3-4):** Migrate hot paths to direct PG queries.

```go
// Direct query for student list with pagination
func (r *StudentRepo) List(ctx context.Context, schoolID string, opts ListOpts) ([]Student, int, error) {
    query := `SELECT * FROM students 
              WHERE school_id = $1 AND academic_year_id = $2 AND status = $3
              ORDER BY first_name 
              LIMIT $4 OFFSET $5`
    countQuery := `SELECT COUNT(*) FROM students WHERE school_id = $1 AND academic_year_id = $2 AND status = $3`
    // ...
}
```

**Phase 3 (Month 2):** Remove MemStore entirely. All reads from PG + Redis cache.

### 6.2 Connection Pool Tuning

**Current:** pgxpool defaults (likely max 4 connections).

**Recommended configuration:**

```go
poolConfig, _ := pgxpool.ParseConfig(dsn)
poolConfig.MaxConns = 25                    // Match expected concurrent queries
poolConfig.MinConns = 5                     // Keep warm connections
poolConfig.MaxConnLifetime = 30 * time.Minute
poolConfig.MaxConnIdleTime = 5 * time.Minute
poolConfig.HealthCheckPeriod = 30 * time.Second
```

**Sizing formula:** `MaxConns = (CPU cores × 2) + effective_spindle_count`
- For 4-core VPS with SSD: `(4 × 2) + 1 = 9` minimum, 25 comfortable max.

### 6.3 Goroutine Pool for Background Work

```go
// Worker pool for non-blocking operations
type WorkerPool struct {
    jobs chan func()
}

func NewWorkerPool(size int) *WorkerPool {
    wp := &WorkerPool{jobs: make(chan func(), 1000)}
    for i := 0; i < size; i++ {
        go func() {
            for job := range wp.jobs {
                job()
            }
        }()
    }
    return wp
}

// Usage: non-blocking audit log, notification dispatch, fee calculation
pool.Submit(func() {
    audit.Log(ctx, action, entity)
})
```

### 6.4 Response Compression Middleware

```go
import "github.com/go-chi/chi/v5/middleware"

r.Use(middleware.Compress(5, "application/json", "text/html"))
```

**Impact:** 60-80% payload reduction for JSON responses.
- 200KB student list → 40KB compressed
- Network savings: ~160KB per large list request

### 6.5 Graceful Degradation Pattern

```go
// Circuit breaker for PG queries
func (h *Handler) ListWithFallback(w http.ResponseWriter, r *http.Request) {
    // Try Redis cache first
    if cached, err := redis.Get(cacheKey); err == nil {
        respond(w, cached)
        return
    }
    
    // Try PG query
    result, err := h.repo.List(ctx, opts)
    if err != nil {
        // Fallback to stale cache or MemStore
        if stale, _ := redis.Get(cacheKey + ":stale"); stale != nil {
            respond(w, stale) // Serve stale data with warning header
            return
        }
    }
    
    // Cache result
    redis.Set(cacheKey, result, 5*time.Minute)
    respond(w, result)
}
```

### 6.6 Structured Logging with Performance Metrics

```go
// Middleware that logs request duration and query count
func PerformanceLogger(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        start := time.Now()
        ctx := context.WithValue(r.Context(), queryCountKey, new(int32))
        
        next.ServeHTTP(w, r.WithContext(ctx))
        
        duration := time.Since(start)
        queries := atomic.LoadInt32(ctx.Value(queryCountKey).(*int32))
        
        if duration > 200*time.Millisecond {
            log.Warn("slow_request",
                "path", r.URL.Path,
                "duration_ms", duration.Milliseconds(),
                "queries", queries,
            )
        }
    })
}
```

---

## 7. PostgreSQL Optimization

### 7.1 Current Index Analysis

**Existing indexes (from migrations):**

| Table | Index | Columns | Type |
|-------|-------|---------|------|
| schools | schools_status_plan_idx | (status, plan_key) | B-tree |
| users | users_school_email_uniq | (school_id, email) | Unique |
| users | users_school_role_status_idx | (school_id, role, status) | B-tree |
| students | students_school_class_idx | (school_id, class_id) | B-tree |
| students | students_school_year_status_idx | (school_id, academic_year_id, status) | B-tree |
| attendance | attendance_uniq | (school_id, student_id, date, period) | Unique |
| attendance | attendance_class_date_idx | (class_id, date) | B-tree |
| fees | fees_school_student_due_idx | (school_id, student_id, due_date) | B-tree |
| fees | fees_school_status_due_idx | (school_id, status, due_date) | B-tree |

### 7.2 Missing Critical Indexes

```sql
-- Dashboard performance: attendance by school + date range
CREATE INDEX CONCURRENTLY idx_attendance_school_date 
ON attendance (school_id, date DESC) 
WHERE academic_year_id IS NOT NULL;

-- Fee dashboard: monthly aggregation
CREATE INDEX CONCURRENTLY idx_fees_school_year_month 
ON fees (school_id, academic_year_id, month, status);

-- Notification polling: unread by user
CREATE INDEX CONCURRENTLY idx_notifications_user_unread 
ON notifications (user_id, is_read) 
WHERE is_read = false;

-- Audit log: recent activity (partial index for performance)
CREATE INDEX CONCURRENTLY idx_audit_school_recent 
ON audit_logs (school_id, created_at DESC) 
WHERE created_at > NOW() - INTERVAL '30 days';

-- Leave requests: pending by school
CREATE INDEX CONCURRENTLY idx_leaves_school_pending 
ON leaves (school_id, status) 
WHERE status = 'pending';

-- Results: exam lookup with student
CREATE INDEX CONCURRENTLY idx_results_exam_class 
ON results (exam_id, class_id, academic_year_id);

-- Fee payments: daily collection
CREATE INDEX CONCURRENTLY idx_fee_payments_school_date 
ON fee_payments (school_id, payment_date DESC);

-- Homework: class + due date for teacher/student views
CREATE INDEX CONCURRENTLY idx_homework_class_due_status 
ON homework (school_id, class_id, due_date DESC, status);

-- Timetable: class lookup
CREATE INDEX CONCURRENTLY idx_timetable_school_class_day 
ON timetables (school_id, class_id, day_of_week);
```

### 7.3 Composite Index Strategy

**Rule:** Create composite indexes that match your WHERE + ORDER BY patterns exactly.

```sql
-- Pattern: WHERE school_id = X AND academic_year_id = Y AND status = Z ORDER BY created_at DESC
-- Index should be: (school_id, academic_year_id, status, created_at DESC)

-- Students list with pagination
CREATE INDEX idx_students_list 
ON students (school_id, academic_year_id, status, first_name);

-- Attendance marking view (teacher sees class for today)
CREATE INDEX idx_attendance_marking 
ON attendance (school_id, class_id, date, period);
```

### 7.4 Partitioning Strategy

**Candidates for table partitioning:**

| Table | Partition Key | Strategy | Trigger |
|-------|--------------|----------|---------|
| attendance | date (monthly) | Range | >1M rows |
| audit_logs | created_at (monthly) | Range | >500K rows |
| fees | academic_year_id | List | >500K rows |
| fee_payments | payment_date (monthly) | Range | >200K rows |
| notifications | created_at (weekly) | Range | >1M rows |

```sql
-- Example: Partition attendance by month
CREATE TABLE attendance (
    id UUID PRIMARY KEY,
    school_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    date DATE NOT NULL,
    -- ...
) PARTITION BY RANGE (date);

CREATE TABLE attendance_2026_01 PARTITION OF attendance
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
-- Auto-create partitions via pg_partman
```

### 7.5 Materialized Views for Dashboards

```sql
-- Admin dashboard stats (refresh every 5 minutes)
CREATE MATERIALIZED VIEW mv_school_dashboard AS
SELECT 
    s.school_id,
    s.academic_year_id,
    COUNT(*) FILTER (WHERE s.status = 'active') AS active_students,
    COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'active') AS active_teachers,
    COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'active') AS active_classes
FROM students s
LEFT JOIN teachers t ON t.school_id = s.school_id
LEFT JOIN classes c ON c.school_id = s.school_id AND c.academic_year_id = s.academic_year_id
GROUP BY s.school_id, s.academic_year_id;

CREATE UNIQUE INDEX ON mv_school_dashboard (school_id, academic_year_id);

-- Refresh concurrently (no lock)
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_school_dashboard;

-- Fee collection summary
CREATE MATERIALIZED VIEW mv_fee_summary AS
SELECT 
    school_id,
    academic_year_id,
    month,
    SUM(amount + adjustment_amount) AS total_expected,
    SUM(paid_amount) AS total_collected,
    COUNT(*) FILTER (WHERE status = 'paid') AS paid_count,
    COUNT(*) FILTER (WHERE status = 'unpaid') AS unpaid_count,
    COUNT(*) FILTER (WHERE status = 'partial') AS partial_count
FROM fees
GROUP BY school_id, academic_year_id, month;
```

### 7.6 Connection Pooling with PgBouncer

```ini
# pgbouncer.ini
[databases]
school_db = host=postgres port=5432 dbname=school_db

[pgbouncer]
pool_mode = transaction          # Best for short queries
max_client_conn = 200            # Frontend connections
default_pool_size = 25           # Actual PG connections
min_pool_size = 5
reserve_pool_size = 5
reserve_pool_timeout = 3
max_db_connections = 30
server_idle_timeout = 300
```

### 7.7 VACUUM & Maintenance Strategy

```sql
-- Aggressive autovacuum for high-churn tables
ALTER TABLE attendance SET (
    autovacuum_vacuum_scale_factor = 0.05,    -- Vacuum at 5% dead tuples (vs default 20%)
    autovacuum_analyze_scale_factor = 0.02,
    autovacuum_vacuum_cost_delay = 10
);

ALTER TABLE notifications SET (
    autovacuum_vacuum_scale_factor = 0.05,
    autovacuum_analyze_scale_factor = 0.02
);

ALTER TABLE audit_logs SET (
    autovacuum_vacuum_scale_factor = 0.1
);
```

### 7.8 Query Optimization Patterns

**N+1 Prevention:**
```sql
-- BAD: Fetch attendance then loop to get student names
-- SELECT * FROM attendance WHERE school_id = $1 AND date = $2
-- Then for each: SELECT first_name, last_name FROM students WHERE id = $X

-- GOOD: Single JOIN query
SELECT a.*, 
       s.first_name || ' ' || s.last_name AS student_name,
       s.admission_no,
       c.name AS class_name
FROM attendance a
JOIN students s ON s.id = a.student_id
JOIN classes c ON c.id = a.class_id
WHERE a.school_id = $1 AND a.date = $2
ORDER BY c.name, s.first_name;
```

---

## 8. Redis Integration Strategy

### 8.1 Architecture with Redis

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Frontend   │────▶│  Go Backend  │────▶│  PostgreSQL  │
└──────────────┘     └──────┬───────┘     └──────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │    Redis     │
                     │  (Cache +    │
                     │   Pub/Sub +  │
                     │   Queue)     │
                     └──────────────┘
```

### 8.2 Redis Use-Case Matrix

| Use Case | Key Pattern | TTL | Invalidation | Memory Est. |
|----------|-------------|-----|--------------|-------------|
| Dashboard stats | `dash:{school_id}:{year_id}` | 5 min | On attendance/fee mutation | 2KB/school |
| Student list | `students:{school_id}:{year_id}:p{page}` | 10 min | On student CRUD | 50KB/page |
| Active academic year | `ay:active:{school_id}` | 1 hour | On year switch | 200B/school |
| School settings | `settings:{school_id}` | 30 min | On settings update | 1KB/school |
| User session/permissions | `session:{user_id}` | 24 hours | On logout/role change | 500B/user |
| RBAC permissions | `rbac:{role}:{school_id}` | 1 hour | On permission change | 300B/role |
| Notification count | `notif:unread:{user_id}` | 2 min | On new notification | 50B/user |
| Fee summary | `fees:summary:{school_id}:{year_id}` | 15 min | On payment/generation | 1KB/school |
| Attendance today | `att:today:{school_id}:{date}` | 10 min | On attendance mark | 5KB/school |
| Timetable | `tt:{school_id}:{class_id}` | 1 hour | On timetable edit | 2KB/class |
| Rate limiting | `rl:{ip}:{endpoint}` | 1 min (sliding) | Auto-expire | 100B/entry |
| Request dedup | `dedup:{hash}` | 100ms | Auto-expire | 50B/entry |

### 8.3 Where NOT to Use Redis

| Scenario | Reason |
|----------|--------|
| Storing full student records | Too large, PG is source of truth |
| File/image storage | Use object storage (S3/MinIO) |
| Audit logs | Must be durable, write to PG directly |
| Financial transactions | ACID required, PG only |
| Exam results during entry | Consistency critical, direct PG |

### 8.4 Cache Invalidation Strategy

```go
// Pattern: Write-through with targeted invalidation
func (h *Handler) CreateStudent(w http.ResponseWriter, r *http.Request) {
    // ... create student in PG ...
    
    // Invalidate affected caches
    redis.Del(ctx,
        fmt.Sprintf("students:%s:%s:*", schoolID, yearID),  // Student list pages
        fmt.Sprintf("dash:%s:%s", schoolID, yearID),         // Dashboard stats
        fmt.Sprintf("class:students:%s:%s", schoolID, classID), // Class student count
    )
}
```

### 8.5 Redis Pub/Sub for Real-time

```go
// Publish attendance update
redis.Publish(ctx, fmt.Sprintf("school:%s:attendance", schoolID), payload)

// Subscribe in WebSocket handler
sub := redis.Subscribe(ctx, fmt.Sprintf("school:%s:*", schoolID))
for msg := range sub.Channel() {
    ws.WriteJSON(msg)
}
```

### 8.6 Redis Queue for Background Jobs

```go
// Fee generation (heavy computation) → queue
redis.LPush(ctx, "queue:fee-generation", FeeGenJob{
    SchoolID: schoolID,
    YearID:   yearID,
    Month:    "January",
    ClassIDs: classIDs,
})

// Worker picks up
func feeWorker(redis *redis.Client) {
    for {
        job, _ := redis.BRPop(ctx, 0, "queue:fee-generation").Result()
        processFeeGeneration(job)
    }
}
```

### 8.7 Redis Memory Estimation

| Schools | Students | Teachers | Estimated Redis Memory |
|---------|----------|----------|----------------------|
| 10 | 5,000 | 200 | ~50MB |
| 50 | 25,000 | 1,000 | ~200MB |
| 200 | 100,000 | 4,000 | ~600MB |
| 500 | 250,000 | 10,000 | ~1.2GB |

**Recommendation:** Start with 512MB Redis, scale to 2GB at 200+ schools.

### 8.8 Redis Configuration

```conf
# redis.conf for Eduplexo
maxmemory 512mb
maxmemory-policy allkeys-lru      # Evict least-recently-used when full
save 900 1                         # RDB snapshot every 15min if 1+ change
save 300 10
appendonly yes                     # AOF for durability
appendfsync everysec
tcp-keepalive 300
timeout 300
```



---

## 9. Multi-Tenant Scaling Strategy

### 9.1 Current Isolation Model

```
Every query filters by: school_id + academic_year_id
No row-level security (RLS) in PostgreSQL
No schema-per-tenant (shared schema model)
Tenant context extracted from JWT claims
```

### 9.2 Scaling Tiers

| Tier | Schools | Strategy | Infrastructure |
|------|---------|----------|---------------|
| Starter | 1-20 | Single instance, shared DB | 1 VPS (4GB RAM) |
| Growth | 20-100 | Single instance + Redis + Read replica | 1 VPS (8GB) + Redis |
| Scale | 100-500 | Multiple backend instances + PgBouncer | 2 VPS + LB + Redis Cluster |
| Enterprise | 500+ | Kubernetes + Sharded DB | K8s cluster + Citus/sharding |

### 9.3 Row-Level Security (RLS)

```sql
-- Enable RLS for tenant isolation at DB level
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON students
    USING (school_id = current_setting('app.current_school_id'));

-- Set context per request
SET LOCAL app.current_school_id = 'school_xyz';
```

**Tradeoff:** +5% query overhead, but guarantees no cross-tenant data leak even with bugs.

### 9.4 Tenant-Aware Connection Pooling

```go
// Per-tenant connection context
func (m *Middleware) SetTenantContext(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        schoolID := extractSchoolID(r)
        ctx := context.WithValue(r.Context(), tenantKey, schoolID)
        
        // Set PG session variable for RLS
        conn, _ := pool.Acquire(ctx)
        conn.Exec(ctx, "SET LOCAL app.current_school_id = $1", schoolID)
        
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}
```

### 9.5 Noisy Neighbor Prevention

| Protection | Implementation | Impact |
|-----------|---------------|--------|
| Per-tenant rate limiting | Redis: `rl:{school_id}:{endpoint}` max 100 req/min | Prevents one school from starving others |
| Query timeout | `SET statement_timeout = '5s'` per request | Prevents runaway queries |
| Connection quota | Max 5 concurrent PG connections per tenant | Fair resource distribution |
| Payload size limit | 5MB max request body | Prevents memory exhaustion |
| Background job priority | Weighted queue per tenant plan tier | Premium tenants get priority |

---

## 10. Docker & VPS Optimization

### 10.1 Current Docker Compose Analysis

**Issues identified:**
1. No resource limits on containers
2. No health checks on backend (distroless = no shell)
3. No Nginx reverse proxy with caching
4. No log rotation
5. PostgreSQL using default configuration

### 10.2 Optimized Docker Compose (Production)

```yaml
services:
  postgres:
    image: postgres:16-alpine
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '2.0'
        reservations:
          memory: 1G
    environment:
      POSTGRES_SHARED_BUFFERS: 512MB
      POSTGRES_EFFECTIVE_CACHE_SIZE: 1536MB
      POSTGRES_WORK_MEM: 16MB
      POSTGRES_MAINTENANCE_WORK_MEM: 256MB
    command: >
      postgres
      -c shared_buffers=512MB
      -c effective_cache_size=1536MB
      -c work_mem=16MB
      -c maintenance_work_mem=256MB
      -c random_page_cost=1.1
      -c effective_io_concurrency=200
      -c max_connections=100
      -c wal_buffers=16MB
      -c checkpoint_completion_target=0.9
      -c max_wal_size=2GB
      -c min_wal_size=1GB
      -c log_min_duration_statement=200
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U school_user -d school_db"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
    command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru --appendonly yes
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3

  backend-go:
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '2.0'
        reservations:
          memory: 256M
    environment:
      GOMAXPROCS: 4
      GOGC: 100
```

### 10.3 Nginx Reverse Proxy Configuration

```nginx
upstream backend {
    server backend-go:8080;
    keepalive 32;
}

server {
    listen 80;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types application/json text/plain application/javascript text/css;
    gzip_comp_level 6;
    
    # Brotli (if module available)
    brotli on;
    brotli_comp_level 4;
    brotli_types application/json text/plain application/javascript text/css;
    
    # Static assets (frontend) — aggressive caching
    location /assets/ {
        root /usr/share/nginx/html;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # API proxy with connection reuse
    location /api/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # Response caching for GET requests
        proxy_cache api_cache;
        proxy_cache_valid 200 5m;
        proxy_cache_key "$request_uri|$http_authorization";
        proxy_cache_bypass $http_cache_control;
        add_header X-Cache-Status $upstream_cache_status;
    }
    
    # WebSocket support
    location /ws/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### 10.4 VPS Resource Allocation (8GB RAM VPS)

| Service | RAM Allocation | CPU Shares | Notes |
|---------|---------------|------------|-------|
| PostgreSQL | 2.5GB | 40% | shared_buffers=512MB, OS cache for rest |
| Go Backend | 1GB | 30% | MemStore + goroutines |
| Redis | 512MB | 10% | Cache layer |
| Nginx | 128MB | 5% | Reverse proxy + static |
| Frontend (build) | 256MB | 5% | Static files only at runtime |
| OS + overhead | 1.5GB | 10% | Kernel, buffers, swap |
| **Total** | **~6GB used** | **100%** | 2GB headroom |

### 10.5 Go Runtime Tuning

```bash
# Environment variables for Go backend
GOMAXPROCS=4          # Match available CPU cores
GOGC=100              # Default GC target (tune based on memory pressure)
GOMEMLIMIT=900MiB     # Hard memory limit (Go 1.19+)
```

### 10.6 Health Check Strategy

```go
// /health endpoint with dependency checks
r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
    checks := map[string]bool{
        "postgres": pg.Ping(ctx) == nil,
        "redis":    redis.Ping(ctx).Err() == nil,
        "memory":   runtime.MemStats.Alloc < 800*1024*1024, // <800MB
    }
    healthy := checks["postgres"] && checks["redis"]
    status := http.StatusOK
    if !healthy {
        status = http.StatusServiceUnavailable
    }
    api.WriteJSON(w, status, checks)
})
```

---

## 11. Memory Optimization

### 11.1 Current Memory Profile (Estimated)

| Component | Memory Usage | Growth Rate | Risk |
|-----------|-------------|-------------|------|
| MemStore (10 schools) | 150-300MB | +30MB/school | 🔴 LINEAR GROWTH |
| Go runtime overhead | 50MB | Stable | 🟢 |
| pgxpool connections | 20MB | +2MB/conn | 🟡 |
| HTTP handler goroutines | 10-50MB | Per concurrent request | 🟡 |
| JSON serialization buffers | 20-100MB (GC pressure) | Per request | 🔴 |

### 11.2 Memory Reduction Strategies

**Strategy 1: Eliminate MemStore (saves 150-300MB immediately)**
- Move to direct PG queries + Redis cache
- Redis uses 50MB for equivalent cache coverage
- Net savings: 100-250MB

**Strategy 2: Streaming JSON responses**
```go
// Instead of building full slice then marshaling:
// BAD: allStudents := getAllStudents() → json.Marshal(allStudents) → 2x memory

// GOOD: Stream JSON directly
func streamStudents(w http.ResponseWriter, rows pgx.Rows) {
    w.Write([]byte(`{"data":[`))
    enc := json.NewEncoder(w)
    first := true
    for rows.Next() {
        if !first { w.Write([]byte(",")) }
        var s Student
        rows.Scan(&s)
        enc.Encode(s)
        first = false
    }
    w.Write([]byte(`]}`))
}
```

**Strategy 3: Object pooling for frequent allocations**
```go
var responsePool = sync.Pool{
    New: func() any { return new(bytes.Buffer) },
}

func handler(w http.ResponseWriter, r *http.Request) {
    buf := responsePool.Get().(*bytes.Buffer)
    defer func() { buf.Reset(); responsePool.Put(buf) }()
    // Use buf for response building
}
```

### 11.3 Memory Budget per Tenant

| Tenant Size | Students | Expected Memory (MemStore) | Expected Memory (PG+Redis) |
|-------------|----------|---------------------------|---------------------------|
| Small school | 100 | 15MB | 2MB (cache only) |
| Medium school | 500 | 60MB | 5MB (cache only) |
| Large school | 2000 | 200MB | 10MB (cache only) |

---

## 12. CPU Optimization

### 12.1 CPU Hotspots

| Operation | CPU Impact | Frequency | Optimization |
|-----------|-----------|-----------|--------------|
| Dashboard aggregation (7 slice scans) | HIGH | Every page load | Materialized view + Redis |
| Full snapshot serialization | HIGH | Every 30s | Incremental dirty-tracking |
| JSON marshal large lists | MEDIUM | Every list request | Streaming + pagination |
| JWT validation | LOW | Every request | Cache parsed claims |
| Attendance bulk mark (loop + save) | MEDIUM | Daily peak | Batch INSERT |
| Fee generation (all students × months) | HIGH | Monthly | Background worker |

### 12.2 CPU Reduction Strategies

**1. Replace O(n) scans with indexed lookups:**
- Current: 7 full-slice scans per dashboard = O(7n) where n = total entities
- Optimized: Index map lookups = O(1) per collection

**2. Incremental snapshot (dirty tracking):**
```go
type MemStore struct {
    // ... existing ...
    dirty map[string]map[string]bool // table → set of dirty IDs
}

func (s *MemStore) MarkDirty(table, id string) {
    s.dirty[table][id] = true
}

// Only snapshot changed entities
func (p *Persister) IncrementalSnapshot(ctx context.Context, s *MemStore) error {
    for table, ids := range s.dirty {
        for id := range ids {
            doc := s.GetByID(table, id)
            upsertRow(ctx, tx, table, doc)
        }
    }
    s.dirty = make(map[string]map[string]bool) // reset
}
```

**3. Pre-computed aggregations:**
```go
// Maintain running counters instead of recalculating
type SchoolCounters struct {
    ActiveStudents int32
    ActiveTeachers int32
    ActiveClasses  int32
    TodayPresent   int32
    TodayAbsent    int32
    PendingLeaves  int32
}

// Atomic increment/decrement on mutations
atomic.AddInt32(&counters.ActiveStudents, 1)
```

---

## 13. Network Optimization

### 13.1 Payload Size Analysis

| Endpoint | Current Payload | With Pagination | With Compression | Savings |
|----------|----------------|-----------------|-----------------|---------|
| GET /api/students (500) | 200KB | 15KB (25/page) | 3KB (gzip) | 98.5% |
| GET /api/attendance (daily) | 80KB | 20KB | 4KB | 95% |
| GET /api/analytics/dashboard | 8KB | N/A | 1.5KB | 81% |
| GET /api/fees/ledger | 150KB | 20KB | 4KB | 97% |
| GET /api/notifications | 20KB | 5KB | 1KB | 95% |

### 13.2 Compression Strategy

| Content Type | Compression | Level | Min Size |
|-------------|-------------|-------|----------|
| application/json | Brotli (preferred) | 4 | 1KB |
| application/json | Gzip (fallback) | 6 | 1KB |
| text/html | Brotli | 6 | 256B |
| image/* | None (already compressed) | - | - |

### 13.3 HTTP/2 & Keep-Alive

```nginx
# Enable HTTP/2
listen 443 ssl http2;

# Keep-alive for backend connections
upstream backend {
    server backend-go:8080;
    keepalive 32;              # Persistent connections to backend
    keepalive_requests 1000;   # Max requests per connection
    keepalive_timeout 60s;
}
```

### 13.4 ETag & Conditional Requests

```go
// Generate ETag from data hash
func withETag(w http.ResponseWriter, r *http.Request, data []byte) bool {
    hash := sha256.Sum256(data)
    etag := fmt.Sprintf(`"%x"`, hash[:8])
    w.Header().Set("ETag", etag)
    
    if r.Header.Get("If-None-Match") == etag {
        w.WriteHeader(http.StatusNotModified)
        return true // Don't send body
    }
    return false
}
```

**Impact:** For unchanged data (e.g., timetable, settings), saves 100% of response body transfer.

---

## 14. Pagination & Lazy Loading Strategy

### 14.1 Pagination Requirements Matrix

| Endpoint | Total Records (est.) | Page Size | Strategy | Priority |
|----------|---------------------|-----------|----------|----------|
| Students | 200-2000 | 25 | Offset pagination | 🔴 P0 |
| Teachers | 20-100 | 25 | Offset pagination | 🟡 P1 |
| Attendance | 50-500/day | 50 | Date-based cursor | 🔴 P0 |
| Fee Ledger | 500-5000 | 25 | Cursor (by due_date) | 🔴 P0 |
| Notifications | 100-1000 | 20 | Cursor (by created_at) | 🔴 P0 |
| Audit Logs | 1000+ | 50 | Cursor (by created_at) | 🟡 P1 |
| Homework | 50-200 | 20 | Offset | 🟡 P1 |
| Results | 50-500 | 25 | Offset | 🟡 P1 |
| Events | 20-100 | 20 | Offset | 🟢 P2 |
| Schools (Super Admin) | 10-500 | 25 | Offset | 🟡 P1 |

### 14.2 Pagination Implementation

```go
// Cursor-based pagination (preferred for large/growing datasets)
type CursorPage struct {
    Data       []any  `json:"data"`
    NextCursor string `json:"next_cursor,omitempty"`
    HasMore    bool   `json:"has_more"`
    Total      int    `json:"total"`
}

// Offset-based pagination (simpler, OK for <10K records)
type OffsetPage struct {
    Data    []any `json:"data"`
    Page    int   `json:"page"`
    PerPage int   `json:"per_page"`
    Total   int   `json:"total"`
    Pages   int   `json:"pages"`
}
```

### 14.3 Frontend Lazy Loading Strategy

```
Page Load Sequence:
  1. Shell + Navigation (immediate, from cache)
  2. Critical above-fold data (dashboard cards) — priority fetch
  3. Below-fold components — lazy load on scroll/interaction
  4. Background prefetch — next likely pages

Dashboard Load:
  T+0ms:   Shell renders with skeleton cards
  T+50ms:  Overview stats API fires (cached → instant)
  T+100ms: Cards populate from cache
  T+200ms: Charts lazy-load (below fold)
  T+500ms: Activity feed loads (infinite scroll ready)
```

---

## 15. Dashboard Optimization

### 15.1 Admin Dashboard — Current Flow

```
CURRENT: Single API call → 7 full-slice scans in MemStore

GET /api/analytics/dashboard
  ├── Scan Students[]      → count active (O(n))
  ├── Scan Teachers[]      → count active (O(n))
  ├── Scan Classes[]       → count active (O(n))
  ├── Scan Attendance[]    → today's stats (O(n))
  ├── Scan Exams[]         → active count (O(n))
  ├── Scan Leaves[]        → pending count (O(n))
  ├── Scan Fees[]          → collection stats (O(n))
  ├── Scan AuditLogs[]     → recent 10 (O(n) + sort)
  └── Scan Attendance[]    → class tracker (O(n)) [SECOND SCAN]
  
  Total: 9 full scans, O(9n) complexity
  At 50 schools × 500 students: scanning 25,000+ records per dashboard load
```

### 15.2 Optimized Dashboard Strategy

```
OPTIMIZED: Redis cache + pre-computed counters

GET /api/analytics/dashboard
  ├── Redis GET dash:{school_id}:{year_id}
  │   ├── HIT → Return cached (0ms DB load)
  │   └── MISS → 
  │       ├── PG: SELECT from mv_school_dashboard (indexed, <5ms)
  │       ├── PG: Attendance today (indexed query, <3ms)
  │       ├── PG: Pending leaves (partial index, <1ms)
  │       ├── PG: Fee summary (materialized view, <2ms)
  │       ├── PG: Recent audit (indexed + LIMIT 10, <2ms)
  │       └── Redis SET with 5min TTL
  
  Total: 1 Redis GET (cache hit) or 5 indexed PG queries (cache miss)
  Response time: 2ms (cached) or 15ms (uncached)
  vs Current: 40-200ms
```

### 15.3 Dashboard Cards Optimization

| Card | Current Cost | Optimized Cost | Cache TTL | Invalidation Trigger |
|------|-------------|---------------|-----------|---------------------|
| Total Students | O(n) scan | Redis counter | 10 min | Student CRUD |
| Total Teachers | O(n) scan | Redis counter | 10 min | Teacher CRUD |
| Total Classes | O(n) scan | Redis counter | 1 hour | Class CRUD |
| Attendance Today | O(n) scan | Redis + PG index | 5 min | Attendance mark |
| Active Exams | O(n) scan | Redis counter | 15 min | Exam status change |
| Pending Leave | O(n) scan | Redis counter | 5 min | Leave CRUD |
| Fee Collection | O(n) scan | Materialized view | 15 min | Payment recorded |
| Recent Activity | O(n) + sort | PG indexed query | 2 min | Any mutation |

### 15.4 Super Admin Dashboard

```
GET /api/super-admin/dashboard
  Current: Scans ALL schools, ALL students, ALL teachers, ALL fee_payments
  
  Optimized:
  ├── Redis GET sa:dash (TTL: 10 min)
  │   └── MISS → PG aggregation queries:
  │       ├── SELECT status, COUNT(*) FROM schools GROUP BY status
  │       ├── SELECT COUNT(*) FROM students
  │       ├── SELECT COUNT(*) FROM teachers  
  │       ├── SELECT SUM(amount) FROM fee_payments WHERE payment_date >= date_trunc('month', NOW())
  │       └── Cache result in Redis
  
  Estimated improvement: 200ms → 5ms (cached), 200ms → 20ms (uncached)
```

---

## 16. Realtime Optimization

### 16.1 Current Realtime Gaps

| Feature | Current | Needed | Priority |
|---------|---------|--------|----------|
| Notifications | Polling (manual refresh) | WebSocket push | 🔴 P0 |
| Attendance status | Page refresh | SSE/WebSocket | 🟡 P1 |
| Live class status | Static | WebSocket | 🟡 P1 |
| Fee payment confirmation | Page refresh | Push notification | 🟡 P1 |
| Chat/Chatbot | Request-response | WebSocket | 🟢 P2 |

### 16.2 WebSocket Architecture

```
┌──────────┐     ┌──────────────────────────────────────┐
│ Browser  │────▶│  Nginx (WebSocket upgrade)            │
└──────────┘     └──────────────┬───────────────────────┘
                                │
                                ▼
                 ┌──────────────────────────────────────┐
                 │  Go Backend — WebSocket Hub           │
                 │  ┌────────────────────────────────┐  │
                 │  │  Connections map[schoolID][]ws  │  │
                 │  │  Redis Pub/Sub subscriber       │  │
                 │  └────────────────────────────────┘  │
                 └──────────────┬───────────────────────┘
                                │
                                ▼
                 ┌──────────────────────────────────────┐
                 │  Redis Pub/Sub                        │
                 │  Channels:                            │
                 │    school:{id}:notifications          │
                 │    school:{id}:attendance             │
                 │    school:{id}:live-class             │
                 └──────────────────────────────────────┘
```

### 16.3 Polling vs WebSocket Decision

| Scenario | Recommendation | Reason |
|----------|---------------|--------|
| Notifications (all portals) | WebSocket | High frequency, user expects instant |
| Dashboard stats | Polling (60s) | Aggregated data, not time-critical |
| Attendance marking (teacher) | WebSocket | Multi-teacher coordination |
| Live class join/leave | WebSocket | Real-time presence required |
| Fee payment status | SSE (Server-Sent Events) | One-directional, simpler |
| Chatbot | WebSocket | Bidirectional streaming |

### 16.4 Connection Scaling

| Concurrent Users | WebSocket Connections | Memory (per conn) | Total Memory |
|-----------------|----------------------|-------------------|--------------|
| 100 | 100 | 50KB | 5MB |
| 500 | 500 | 50KB | 25MB |
| 2000 | 2000 | 50KB | 100MB |
| 5000 | 5000 | 50KB | 250MB |

**Recommendation:** Use gorilla/websocket with per-message compression. At 2000 concurrent users, budget 100MB for WebSocket connections.



---

## 17. Query Optimization

### 17.1 Most Expensive Queries (Ranked)

| Rank | Query Pattern | Current Cost | Tables Touched | Fix |
|------|--------------|-------------|----------------|-----|
| 1 | Dashboard aggregation | O(9n) scans | 7 collections | Materialized view + Redis |
| 2 | Fee generation (all students × class fees) | O(s × f) | fees, class_fees, students | Background job + batch INSERT |
| 3 | Attendance list with hydration | O(n) + O(s) + O(c) | attendance, students, classes | JOIN query with index |
| 4 | Super admin school list with stats | O(schools × entities) | all tables | Pre-aggregated stats |
| 5 | Results entry (exam × students) | O(students) per exam | results, students | Batch UPSERT |
| 6 | Fee ledger (all fees + adjustments + payments) | O(f + a + p) | 3 tables | Indexed JOIN + pagination |
| 7 | Notification list (all for user) | O(n) scan | notifications | Indexed query + cursor pagination |

### 17.2 Query Optimization Examples

**Attendance List (Teacher View):**
```sql
-- BEFORE (conceptual — currently in-memory scan)
-- Scan all attendance → filter by school + class + date → hydrate student names

-- AFTER (direct PG query)
SELECT 
    a.id, a.status, a.period, a.note,
    s.first_name || ' ' || s.last_name AS student_name,
    s.admission_no,
    c.name AS class_name
FROM attendance a
INNER JOIN students s ON s.id = a.student_id
INNER JOIN classes c ON c.id = a.class_id
WHERE a.school_id = $1 
  AND a.class_id = $2 
  AND a.date = $3
ORDER BY s.first_name, s.last_name;

-- Uses index: attendance_class_date_idx (class_id, date)
-- Expected: <5ms for 50 students
```

**Fee Dashboard Stats:**
```sql
-- Optimized aggregation query
SELECT 
    COUNT(*) AS total_invoices,
    SUM(amount + adjustment_amount) AS total_expected,
    SUM(paid_amount) AS total_collected,
    COUNT(*) FILTER (WHERE paid_amount >= amount + adjustment_amount) AS paid_count,
    COUNT(*) FILTER (WHERE paid_amount = 0 AND status != 'void') AS unpaid_count,
    COUNT(*) FILTER (WHERE paid_amount > 0 AND paid_amount < amount + adjustment_amount) AS partial_count
FROM fees
WHERE school_id = $1 AND academic_year_id = $2;

-- Uses index: fees_school_year_month (school_id, academic_year_id, month, status)
-- Expected: <10ms even with 5000 fee records
```

**Notification Polling (Optimized):**
```sql
-- Only count unread (partial index makes this instant)
SELECT COUNT(*) FROM notifications 
WHERE user_id = $1 AND is_read = false;

-- Uses partial index: idx_notifications_user_unread
-- Expected: <1ms
```

### 17.3 EXPLAIN ANALYZE Workflow

```sql
-- Always run EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) on new queries
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM students 
WHERE school_id = 'school_default' 
  AND academic_year_id = 'ay_2025' 
  AND status = 'active'
ORDER BY first_name
LIMIT 25 OFFSET 0;

-- Look for:
-- ✅ Index Scan (good)
-- ❌ Seq Scan on large tables (bad)
-- ❌ Sort with high memory (needs index with ORDER BY column)
-- ❌ Nested Loop with high row estimates (needs JOIN optimization)
```

---

## 18. Caching Matrix

### 18.1 Complete Caching Strategy

| Data | Cache Layer | TTL | Invalidation | Stale-While-Revalidate | Priority |
|------|------------|-----|--------------|----------------------|----------|
| Dashboard overview | Redis | 5 min | Mutation webhook | Yes (serve stale, refresh bg) | 🔴 P0 |
| Student list (paginated) | Redis | 10 min | Student CRUD | Yes | 🔴 P0 |
| Active academic year | Redis | 1 hour | Year switch | No (must be fresh) | 🔴 P0 |
| School settings | Redis | 30 min | Settings update | Yes | 🟡 P1 |
| RBAC permissions | Redis | 1 hour | Role change | No | 🔴 P0 |
| Timetable | Redis | 2 hours | Timetable edit | Yes | 🟡 P1 |
| Fee types | Redis | 1 hour | Fee type CRUD | Yes | 🟡 P1 |
| Class list | Redis | 30 min | Class CRUD | Yes | 🟡 P1 |
| Teacher list | Redis | 30 min | Teacher CRUD | Yes | 🟡 P1 |
| Notification count | Redis | 2 min | New notification | No | 🔴 P0 |
| Exam list | Redis | 15 min | Exam CRUD | Yes | 🟢 P2 |
| Event list | Redis | 30 min | Event CRUD | Yes | 🟢 P2 |
| Super admin stats | Redis | 10 min | Any school change | Yes | 🟡 P1 |

### 18.2 Cache Key Naming Convention

```
Pattern: {entity}:{scope}:{identifier}:{variant}

Examples:
  dash:school_default:ay_2025              → Dashboard for school in year
  students:school_default:ay_2025:p1:s25   → Students page 1, size 25
  settings:school_default                   → School settings
  rbac:admin:school_default                 → Admin permissions
  notif:count:user_abc123                   → Unread notification count
  att:today:school_default:2026-05-15       → Today's attendance
  sa:dash                                   → Super admin dashboard
  tt:school_default:class_10a               → Timetable for class
```

### 18.3 Cache Warming Strategy

```go
// On server boot, warm critical caches
func warmCaches(ctx context.Context, redis *redis.Client, db *pgxpool.Pool) {
    // 1. All active school settings
    schools := getAllActiveSchools(db)
    for _, s := range schools {
        settings := getSchoolSettings(db, s.ID)
        redis.Set(ctx, fmt.Sprintf("settings:%s", s.ID), settings, 30*time.Minute)
    }
    
    // 2. RBAC permissions (static, rarely changes)
    for _, role := range []string{"admin", "teacher", "parent", "student"} {
        perms := getRolePermissions(role)
        redis.Set(ctx, fmt.Sprintf("rbac:%s", role), perms, 1*time.Hour)
    }
    
    // 3. Active academic years
    years := getActiveYears(db)
    for _, y := range years {
        redis.Set(ctx, fmt.Sprintf("ay:active:%s", y.SchoolID), y.ID, 1*time.Hour)
    }
}
```

### 18.4 Cache Hit Rate Targets

| Cache | Target Hit Rate | Acceptable Miss Rate | Action if Below Target |
|-------|----------------|---------------------|----------------------|
| Dashboard | >90% | <10% | Increase TTL or pre-warm |
| Student list | >80% | <20% | Acceptable (frequent mutations) |
| Settings | >95% | <5% | Increase TTL to 1 hour |
| RBAC | >99% | <1% | Should almost never miss |
| Notifications | >70% | <30% | Short TTL expected |

---

## 19. Per-Module Optimization

### 19.1 DASHBOARD MODULE

| Aspect | Details |
|--------|---------|
| **Current Flow** | Single GET /api/analytics/dashboard → 9 in-memory scans → JSON response |
| **Performance Risk** | 🔴 HIGH — O(9n) per request, no caching, recalculates on every page load |
| **Expected API Calls** | 1 main + 2-3 supplementary (events, notifications) = 3-4 calls per load |
| **Expensive Queries** | Student count, teacher count, attendance aggregation, fee collection sum, audit log sort |
| **Required DB Indexes** | `idx_attendance_school_date`, `idx_fees_school_year_month`, `idx_audit_school_recent` |
| **Redis Cache** | Key: `dash:{school}:{year}`, TTL: 5min, Invalidate on: attendance/fee/leave mutation |
| **Pagination Need** | Activity feed: cursor pagination (last 10 → load more) |
| **Lazy Loading** | Charts below fold, activity feed on scroll |
| **Infinite Scroll** | Activity feed only |
| **Background Jobs** | Pre-compute daily attendance summary at midnight |
| **WebSocket** | Push notification count updates |
| **Batch Processing** | N/A |
| **Frontend Optimization** | Skeleton cards, staleTime: 5min, separate queries for above/below fold |
| **Backend Optimization** | Materialized view for counts, Redis cache, composite API endpoint |
| **Docker Optimization** | N/A |
| **Estimated Gain** | Response: 40-200ms → 2-15ms (90-95% improvement) |

### 19.2 ATTENDANCE MODULE

| Aspect | Details |
|--------|---------|
| **Current Flow** | List: GET /api/attendance → scan all → filter → hydrate. Mark: POST /api/attendance/mark → loop insert |
| **Performance Risk** | 🔴 HIGH — Bulk mark creates N individual Save() calls. Hydration rebuilds maps per request |
| **Expected API Calls** | List: 1, Mark bulk: 1 (but internally N writes), Filter change: 1 per filter |
| **Expensive Queries** | Hydration (building studentByID/classByID maps), date range queries, class-wise aggregation |
| **Required DB Indexes** | `attendance_uniq` ✅, `attendance_class_date_idx` ✅, ADD: `idx_attendance_school_date` |
| **Redis Cache** | Key: `att:today:{school}:{date}`, TTL: 10min, Invalidate: on mark |
| **Pagination Need** | 🔴 YES — date-based cursor for history view |
| **Lazy Loading** | Student photos in attendance grid |
| **Infinite Scroll** | History view (past dates) |
| **Background Jobs** | Auto-mark absent for unmarked students at EOD |
| **WebSocket** | Real-time sync when multiple teachers mark same class |
| **Batch Processing** | 🔴 CRITICAL — Bulk mark should be single INSERT...ON CONFLICT |
| **Frontend Optimization** | Optimistic UI for toggle, debounce 500ms before API call, batch changes |
| **Backend Optimization** | Single batch UPSERT instead of N individual saves, JOIN query for hydration |
| **Docker Optimization** | N/A |
| **Estimated Gain** | Bulk mark: 500ms (50 students) → 20ms. List: 100ms → 5ms |

### 19.3 FEE SYSTEM MODULE

| Aspect | Details |
|--------|---------|
| **Current Flow** | 15+ endpoints. Generation creates fee records for all students. Ledger scans all fees + adjustments + payments |
| **Performance Risk** | 🔴 HIGH — Fee generation is O(students × class_fees). Ledger is O(all_fees) |
| **Expected API Calls** | Dashboard: 3 (stats, summary, daily). Ledger: 1 + pagination. Payment: 1 |
| **Expensive Queries** | Fee generation, ledger aggregation, adjustment calculation per student, daily collection |
| **Required DB Indexes** | ✅ Most exist. ADD: `idx_fees_school_year_month`, `idx_fee_payments_school_date` |
| **Redis Cache** | `fees:summary:{school}:{year}` TTL:15min, `fees:daily:{school}:{date}` TTL:5min |
| **Pagination Need** | 🔴 CRITICAL — Fee ledger can have 5000+ records |
| **Lazy Loading** | Payment history per student |
| **Infinite Scroll** | Payment history, daily collection log |
| **Background Jobs** | 🔴 Fee generation MUST be async (can take 5-30s for large schools) |
| **WebSocket** | Payment confirmation push to parent |
| **Batch Processing** | Fee generation: batch INSERT 100 records at a time |
| **Frontend Optimization** | Virtual scroll for ledger, skeleton for stats cards |
| **Backend Optimization** | Background worker for generation, materialized view for summary |
| **Docker Optimization** | Separate worker container for fee jobs |
| **Estimated Gain** | Generation: 5-30s → background (instant response). Ledger: 200ms → 10ms |

### 19.4 STUDENTS MODULE

| Aspect | Details |
|--------|---------|
| **Current Flow** | GET /api/students → scan all → filter by school+year → return full list |
| **Performance Risk** | 🟡 MEDIUM — No pagination means 500+ student JSON payload |
| **Expected API Calls** | List: 1, Detail: 1, Create/Update: 1 |
| **Expensive Queries** | Full list without pagination, search across all fields |
| **Required DB Indexes** | ✅ `students_school_class_idx`, `students_school_year_status_idx` |
| **Redis Cache** | `students:{school}:{year}:p{page}` TTL:10min |
| **Pagination Need** | 🔴 CRITICAL — Must paginate (25/page) |
| **Lazy Loading** | Student photos, detailed profile on click |
| **Infinite Scroll** | Alternative to pagination for mobile |
| **Background Jobs** | Bulk import (CSV upload) |
| **WebSocket** | N/A |
| **Batch Processing** | CSV import: batch INSERT 50 at a time |
| **Frontend Optimization** | Virtual scroll for large lists, debounced search (300ms) |
| **Backend Optimization** | Paginated PG query, search with trigram index |
| **Docker Optimization** | N/A |
| **Estimated Gain** | List: 150ms + 200KB → 10ms + 15KB (93% payload reduction) |

### 19.5 EXAMS & RESULTS MODULE

| Aspect | Details |
|--------|---------|
| **Current Flow** | Exams: CRUD. Results: bulk save per exam (all students × subjects) |
| **Performance Risk** | 🟡 MEDIUM — Result entry for 50 students × 5 subjects = 250 records at once |
| **Expected API Calls** | Exam list: 1, Results entry: 1 (bulk), Results view: 1 |
| **Expensive Queries** | Bulk result save, result aggregation per student (report card) |
| **Required DB Indexes** | ✅ `results_exam_student_uniq`, ADD: `idx_results_exam_class` |
| **Redis Cache** | `results:{exam_id}` TTL:30min (invalidate on save) |
| **Pagination Need** | Exam list: offset. Results: per-class view (no pagination needed) |
| **Lazy Loading** | Subject-wise breakdown on click |
| **Infinite Scroll** | N/A |
| **Background Jobs** | Report card PDF generation |
| **WebSocket** | N/A |
| **Batch Processing** | 🔴 Result save: single INSERT...ON CONFLICT for all 250 records |
| **Frontend Optimization** | Optimistic save, progress indicator for bulk entry |
| **Backend Optimization** | Batch UPSERT, pre-validate all before commit |
| **Docker Optimization** | N/A |
| **Estimated Gain** | Bulk save: 500ms → 30ms. Report generation: async |

### 19.6 HOMEWORK MODULE

| Aspect | Details |
|--------|---------|
| **Current Flow** | CRUD with class/subject filtering. No file upload optimization |
| **Performance Risk** | 🟢 LOW — Moderate data volume |
| **Expected API Calls** | List: 1, Create: 1, Detail: 1 |
| **Expensive Queries** | List with date range + class filter |
| **Required DB Indexes** | ✅ `homework_class_due_idx` |
| **Redis Cache** | `hw:{school}:{class}:recent` TTL:15min |
| **Pagination Need** | 🟡 YES — 20/page for history |
| **Lazy Loading** | Submission details, file attachments |
| **Infinite Scroll** | History view |
| **Background Jobs** | File processing (thumbnail generation) |
| **WebSocket** | Push notification to parents on new homework |
| **Batch Processing** | N/A |
| **Frontend Optimization** | Skeleton loading, lazy file preview |
| **Backend Optimization** | Indexed query with pagination |
| **Docker Optimization** | Separate volume for file uploads |
| **Estimated Gain** | List: 50ms → 5ms |

### 19.7 TIMETABLE MODULE

| Aspect | Details |
|--------|---------|
| **Current Flow** | CRUD per class. Relatively static data |
| **Performance Risk** | 🟢 LOW — Small dataset, rarely changes |
| **Expected API Calls** | 1 per class view |
| **Expensive Queries** | None significant |
| **Required DB Indexes** | ✅ `timetables_school_class_idx`, ADD: `idx_timetable_school_class_day` |
| **Redis Cache** | `tt:{school}:{class}` TTL:2hours (invalidate on edit) |
| **Pagination Need** | No |
| **Lazy Loading** | N/A |
| **Infinite Scroll** | N/A |
| **Background Jobs** | N/A |
| **WebSocket** | N/A |
| **Batch Processing** | N/A |
| **Frontend Optimization** | Cache-first strategy (staleTime: 30min) |
| **Backend Optimization** | Redis cache, ETag for conditional requests |
| **Docker Optimization** | N/A |
| **Estimated Gain** | 20ms → 1ms (cached) |

### 19.8 LIVE CLASSES MODULE

| Aspect | Details |
|--------|---------|
| **Current Flow** | Schedule, list, join. Integration with video platform |
| **Performance Risk** | 🟡 MEDIUM — Real-time status needed |
| **Expected API Calls** | List: 1, Schedule: 1, Status check: polling |
| **Expensive Queries** | Upcoming classes with teacher/class join |
| **Required DB Indexes** | ✅ `live_classes_school_idx`, ADD: `idx_live_classes_scheduled_at` |
| **Redis Cache** | `live:{school}:upcoming` TTL:5min |
| **Pagination Need** | No (typically <20 scheduled) |
| **Lazy Loading** | Video player component |
| **Infinite Scroll** | Past classes history |
| **Background Jobs** | Auto-start/end class status update |
| **WebSocket** | 🔴 YES — Class start notification, participant count |
| **Batch Processing** | N/A |
| **Frontend Optimization** | Lazy load video SDK, prefetch upcoming class data |
| **Backend Optimization** | Redis for active class status, WebSocket for presence |
| **Docker Optimization** | N/A |
| **Estimated Gain** | Status updates: polling 5s → WebSocket instant |

### 19.9 NOTIFICATIONS MODULE

| Aspect | Details |
|--------|---------|
| **Current Flow** | GET /api/notifications → scan all for user → return list |
| **Performance Risk** | 🔴 HIGH — Polling-heavy, grows unbounded, no pagination |
| **Expected API Calls** | Count check: every 30s (polling). List: on click |
| **Expensive Queries** | Full scan for user's notifications, sort by date |
| **Required DB Indexes** | ✅ `notifications_user_idx`, ADD: `idx_notifications_user_unread` (partial) |
| **Redis Cache** | `notif:count:{user}` TTL:2min, `notif:list:{user}:p1` TTL:5min |
| **Pagination Need** | 🔴 CRITICAL — Cursor pagination (20/batch) |
| **Lazy Loading** | Notification detail/action on click |
| **Infinite Scroll** | 🔴 YES — Load older notifications on scroll |
| **Background Jobs** | Notification dispatch (fan-out to all parents/students) |
| **WebSocket** | 🔴 CRITICAL — Push new notifications instead of polling |
| **Batch Processing** | Broadcast: create N notifications in single INSERT |
| **Frontend Optimization** | Badge counter via WebSocket, list via infinite scroll |
| **Backend Optimization** | Partial index for unread, batch INSERT for broadcast, WebSocket push |
| **Docker Optimization** | N/A |
| **Estimated Gain** | Polling elimination: 30 req/min/user → 0. List: 100ms → 5ms |

### 19.10 LEAVE MODULE

| Aspect | Details |
|--------|---------|
| **Current Flow** | CRUD with status workflow (pending → approved/rejected) |
| **Performance Risk** | 🟢 LOW — Small dataset |
| **Expected API Calls** | List: 1, Create: 1, Approve: 1 |
| **Expensive Queries** | Pending count for dashboard |
| **Required DB Indexes** | ✅ `leaves_school_status_idx`, ADD: `idx_leaves_school_pending` (partial) |
| **Redis Cache** | `leave:pending:count:{school}` TTL:5min |
| **Pagination Need** | 🟡 YES — History view |
| **Lazy Loading** | Leave details on click |
| **Infinite Scroll** | N/A |
| **Background Jobs** | Notification to admin on new leave request |
| **WebSocket** | Push approval status to requester |
| **Batch Processing** | N/A |
| **Frontend Optimization** | Optimistic status update |
| **Backend Optimization** | Partial index for pending, Redis counter |
| **Docker Optimization** | N/A |
| **Estimated Gain** | Pending count: 20ms → 1ms |

### 19.11 EVENTS MODULE

| Aspect | Details |
|--------|---------|
| **Current Flow** | CRUD with date filtering |
| **Performance Risk** | 🟢 LOW |
| **Expected API Calls** | List: 1, Create: 1 |
| **Expensive Queries** | Upcoming events (date filter + sort) |
| **Required DB Indexes** | ✅ `events_school_idx`, ADD: `idx_events_school_date` |
| **Redis Cache** | `events:upcoming:{school}` TTL:30min |
| **Pagination Need** | 🟡 Past events only |
| **Lazy Loading** | Event details |
| **Infinite Scroll** | N/A |
| **Background Jobs** | Event reminder notifications |
| **WebSocket** | N/A |
| **Batch Processing** | N/A |
| **Frontend Optimization** | Calendar view lazy load |
| **Backend Optimization** | Indexed date query |
| **Docker Optimization** | N/A |
| **Estimated Gain** | 30ms → 3ms |

### 19.12 BEHAVIOR MODULE

| Aspect | Details |
|--------|---------|
| **Current Flow** | CRUD per student |
| **Performance Risk** | 🟢 LOW |
| **Expected API Calls** | List: 1, Create: 1 |
| **Expensive Queries** | Student behavior history |
| **Required DB Indexes** | ✅ `behaviors_school_student_idx` |
| **Redis Cache** | Not critical (low frequency) |
| **Pagination Need** | 🟡 YES — Per-student history |
| **Lazy Loading** | Behavior details |
| **Infinite Scroll** | N/A |
| **Background Jobs** | Parent notification on new behavior record |
| **WebSocket** | N/A |
| **Batch Processing** | N/A |
| **Frontend Optimization** | Standard |
| **Backend Optimization** | Indexed query |
| **Docker Optimization** | N/A |
| **Estimated Gain** | Minimal (already fast) |

### 19.13 TEACHERS MODULE

| Aspect | Details |
|--------|---------|
| **Current Flow** | CRUD with school+year filtering |
| **Performance Risk** | 🟢 LOW — Typically <100 teachers |
| **Expected API Calls** | List: 1, Detail: 1 |
| **Expensive Queries** | None significant |
| **Required DB Indexes** | ✅ All needed indexes exist |
| **Redis Cache** | `teachers:{school}:{year}` TTL:30min |
| **Pagination Need** | 🟡 Optional (25/page) |
| **Lazy Loading** | Teacher schedule/classes on detail view |
| **Infinite Scroll** | N/A |
| **Background Jobs** | N/A |
| **WebSocket** | N/A |
| **Batch Processing** | Bulk import |
| **Frontend Optimization** | Standard |
| **Backend Optimization** | Redis cache |
| **Docker Optimization** | N/A |
| **Estimated Gain** | 30ms → 2ms (cached) |

### 19.14 CLASSES MODULE

| Aspect | Details |
|--------|---------|
| **Current Flow** | CRUD with year filtering |
| **Performance Risk** | 🟢 LOW — Typically <50 classes |
| **Expected API Calls** | List: 1 |
| **Expensive Queries** | None |
| **Required DB Indexes** | ✅ All exist |
| **Redis Cache** | `classes:{school}:{year}` TTL:30min |
| **Pagination Need** | No |
| **Lazy Loading** | Class details (students, subjects) |
| **Infinite Scroll** | N/A |
| **Background Jobs** | N/A |
| **WebSocket** | N/A |
| **Batch Processing** | N/A |
| **Frontend Optimization** | Cache-first |
| **Backend Optimization** | Redis cache |
| **Docker Optimization** | N/A |
| **Estimated Gain** | 20ms → 1ms |

### 19.15 ANNOUNCEMENTS MODULE

| Aspect | Details |
|--------|---------|
| **Current Flow** | CRUD with school filtering |
| **Performance Risk** | 🟢 LOW |
| **Expected API Calls** | List: 1 |
| **Expensive Queries** | None |
| **Required DB Indexes** | ✅ `announcements_school_idx` |
| **Redis Cache** | `ann:{school}:recent` TTL:15min |
| **Pagination Need** | 🟡 YES — 20/page |
| **Lazy Loading** | Full content on click |
| **Infinite Scroll** | History |
| **Background Jobs** | Push notification on new announcement |
| **WebSocket** | Push to all portal users |
| **Batch Processing** | Notification fan-out |
| **Frontend Optimization** | Truncated preview in list |
| **Backend Optimization** | Standard |
| **Docker Optimization** | N/A |
| **Estimated Gain** | 20ms → 3ms |



---

## 20. Per-Portal Optimization

### 20.1 SUPER ADMIN PORTAL

#### Architecture Context
- Serves platform-wide analytics across ALL schools
- Low user count (1-5 super admins) but expensive queries
- Cross-tenant aggregation is the primary bottleneck

#### API Analysis

| Endpoint | Current Cost | Payload | Frequency | Optimization |
|----------|-------------|---------|-----------|--------------|
| GET /api/super-admin/dashboard | O(all_schools + all_students + all_teachers + all_payments) | 3-5KB | Every login/refresh | Redis cache 10min TTL |
| GET /api/super-admin/schools | O(all_schools) + per-school stats | 5-50KB | On navigation | Pagination + pre-aggregated stats |
| GET /api/super-admin/schools/{id} | O(1) lookup | 2KB | On click | Redis cache 5min |
| GET /api/super-admin/users | O(all_users) | 10-100KB | Rarely | Pagination mandatory |
| GET /api/super-admin/activity | O(all_audit_logs) + sort | 5-20KB | Dashboard | Cursor pagination + index |
| GET /api/super-admin/plans | O(plans) | 1KB | Rarely | Static cache 1hr |

#### Expensive APIs to Optimize

1. **Dashboard Stats** — Scans ALL entities across ALL schools
   - Fix: Materialized view `mv_platform_stats` refreshed every 10 min
   - Redis: `sa:dash` TTL 10min
   - Background: Cron job refreshes materialized view

2. **School Listing with Stats** — Currently iterates all students/teachers per school
   - Fix: Pre-aggregate per-school counts in `mv_school_summary`
   - Pagination: 25 schools/page
   - Search: PG trigram index on school name

3. **Revenue Calculation** — Sums ALL fee_payments
   - Fix: Running total in Redis, updated on each payment
   - Monthly: Materialized view partitioned by month

#### API Merge Opportunities

```
CURRENT:
  GET /api/super-admin/dashboard    → platform stats
  GET /api/super-admin/activity     → recent activity
  GET /api/super-admin/schools?status=pending → pending approvals

MERGED:
  GET /api/super-admin/composite?include=stats,activity,pending
  → Single response with all three sections
  → Saves 2 round-trips on dashboard load
```

#### Redis Strategy for Super Admin

| Key | Data | TTL | Invalidation |
|-----|------|-----|--------------|
| `sa:dash` | Platform-wide stats | 10 min | School CRUD, payment |
| `sa:schools:p{page}` | Paginated school list | 5 min | School status change |
| `sa:revenue:monthly` | Monthly revenue | 1 hour | Payment recorded |
| `sa:activity:recent` | Last 20 activities | 2 min | Any mutation |

#### Background Jobs

| Job | Trigger | Purpose |
|-----|---------|---------|
| Refresh platform stats | Every 10 min (cron) | Update materialized views |
| Subscription expiry check | Daily at midnight | Flag expiring subscriptions |
| Usage report generation | Weekly | Per-school usage analytics |

---

### 20.2 ADMIN PORTAL

#### Architecture Context
- Primary portal for school management
- Highest feature density (all modules accessible)
- Dashboard is the most expensive page
- Multiple concurrent admin users possible

#### Dashboard Deep Analysis

```
┌─────────────────────────────────────────────────────────────────┐
│                    ADMIN DASHBOARD LAYOUT                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ Students │ │ Teachers │ │ Classes  │ │Attendance│           │
│  │   487    │ │    32    │ │    18    │ │   92%    │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│                                                                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │  Exams   │ │  Leave   │ │   Fees   │ │ Unmarked │           │
│  │    3     │ │    5     │ │  ₹2.4L   │ │   45     │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│                                                                   │
│  ┌─────────────────────────┐ ┌─────────────────────────┐        │
│  │   Attendance Tracker    │ │    Fee Collection        │        │
│  │   (Class-wise status)   │ │    (Monthly chart)       │        │
│  └─────────────────────────┘ └─────────────────────────┘        │
│                                                                   │
│  ┌─────────────────────────────────────────────────────┐        │
│  │              Recent Activities                        │        │
│  │  • Teacher marked attendance for Class 10A           │        │
│  │  • New student enrolled: Rahul Kumar                 │        │
│  │  • Fee payment received: ₹5,000                     │        │
│  └─────────────────────────────────────────────────────┘        │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

#### Per-Section Optimization

| Section | Est. API Calls | Payload | Redis Cache | Query Optimization |
|---------|---------------|---------|-------------|-------------------|
| Student Count Card | Part of dashboard | 50B | `dash:{s}:{y}` 5min | COUNT(*) with index |
| Teacher Count Card | Part of dashboard | 50B | Same cache | COUNT(*) with index |
| Class Count Card | Part of dashboard | 50B | Same cache | COUNT(*) with index |
| Attendance Today | Part of dashboard | 200B | `att:today:{s}:{d}` 5min | Indexed date query |
| Active Exams | Part of dashboard | 50B | Same cache | Partial index (status=active) |
| Pending Leave | Part of dashboard | 50B | `leave:pending:{s}` 5min | Partial index |
| Fee Collection | Part of dashboard | 200B | `fees:summary:{s}:{y}` 15min | Materialized view |
| Unmarked Students | Part of dashboard | 50B | Same as attendance | total - marked |
| Class Attendance Tracker | Part of dashboard | 1-2KB | Same cache | Pre-computed |
| Recent Activities | Separate or merged | 2KB | `audit:recent:{s}` 2min | Indexed + LIMIT |
| Upcoming Events | Separate | 1KB | `events:upcoming:{s}` 30min | Date index |
| Notifications | Separate | 1-5KB | `notif:list:{u}` 5min | User index |

#### Estimated API Call Reduction

```
CURRENT (Admin Dashboard Load):
  1. GET /api/analytics/dashboard         → 8KB, 40-200ms
  2. GET /api/events?upcoming=true        → 2KB, 20ms
  3. GET /api/notifications               → 5KB, 30ms
  4. GET /api/leave?status=pending        → 2KB, 15ms
  ────────────────────────────────────────────────────
  Total: 4 requests, 17KB, 105-265ms cumulative

OPTIMIZED:
  1. GET /api/dashboard/composite         → 12KB (gzip: 2KB), 5-15ms
  2. WebSocket: notification count push   → 0 requests
  ────────────────────────────────────────────────────
  Total: 1 request, 2KB (compressed), 5-15ms
  Improvement: 75% fewer requests, 85% less data, 90% faster
```

#### Indexing Strategy for Admin Portal

```sql
-- All admin queries filter by school_id + academic_year_id
-- Composite indexes should lead with these columns

-- Dashboard counts (covered index — no table lookup needed)
CREATE INDEX idx_students_count 
ON students (school_id, academic_year_id, status) 
INCLUDE (id);

-- Attendance today (most frequent admin query)
CREATE INDEX idx_attendance_today 
ON attendance (school_id, date DESC, academic_year_id) 
INCLUDE (student_id, status, class_id);
```

#### Polling vs WebSocket for Admin

| Feature | Current | Recommended | Reason |
|---------|---------|-------------|--------|
| Notification badge | Manual refresh | WebSocket | Instant awareness |
| Attendance progress | Page refresh | Polling 60s | Not time-critical |
| New leave requests | Manual refresh | WebSocket | Admin needs to act |
| Fee payments | Manual refresh | Polling 5min | Batch awareness OK |

---

### 20.3 TEACHER PORTAL

#### Architecture Context
- Write-heavy portal (attendance marking, homework creation, result entry)
- Peak usage: 8-9 AM (attendance), 3-4 PM (homework)
- Bulk operations are the primary concern

#### Critical Operations

**1. Attendance Marking (Highest Priority)**

```
CURRENT FLOW:
  Teacher opens class → GET /api/students?class_id=X (full list)
  Teacher toggles each student → UI state change
  Teacher submits → POST /api/attendance/mark (bulk payload)
  Backend: Loop through students, create/update attendance records individually
  Each record: MemStore.Lock() → append → Save() → queue

OPTIMIZED FLOW:
  Teacher opens class → GET /api/attendance/sheet?class_id=X&date=today
    (Returns students + existing marks in ONE query)
  Teacher toggles → Local state only (no API calls)
  Teacher submits → POST /api/attendance/mark (bulk payload)
  Backend: Single INSERT...ON CONFLICT DO UPDATE for all records
    INSERT INTO attendance (id, school_id, student_id, class_id, date, status, ...)
    VALUES ($1, $2, $3, ...), ($4, $5, $6, ...), ...
    ON CONFLICT (school_id, student_id, date, period) 
    DO UPDATE SET status = EXCLUDED.status, updated_at = NOW();
```

**Performance comparison:**
| Metric | Current (50 students) | Optimized |
|--------|----------------------|-----------|
| API calls | 2 (list + mark) | 2 (sheet + mark) |
| Backend processing | 50 individual Lock/Save | 1 batch INSERT |
| DB writes | 50 individual UPSERTs (via queue) | 1 batch UPSERT |
| Response time | 300-500ms | 20-50ms |
| Lock contention | 50 Lock() calls | 0 (direct PG) |

**2. Result Entry**

```
CURRENT: POST /api/exams/{id}/results with all student marks
  → Loop through each student-subject pair
  → Individual Save() per result record

OPTIMIZED:
  → Single batch INSERT...ON CONFLICT
  → Validate all before commit (no partial saves)
  → Return success/failure for entire batch
```

**3. Homework Creation with File Upload**

```
OPTIMIZED FLOW:
  1. Upload file to object storage (S3/MinIO) → get URL
  2. Create homework record with file URL
  3. Background job: generate thumbnail, notify students
  
  Separation of concerns:
  - File upload: separate endpoint, streaming upload
  - Metadata: lightweight JSON POST
  - Notifications: async background job
```

#### Redis Strategy for Teacher Portal

| Key | Purpose | TTL | Invalidation |
|-----|---------|-----|--------------|
| `teacher:classes:{teacher_id}` | Teacher's assigned classes | 1 hour | Class assignment change |
| `teacher:timetable:{teacher_id}` | Today's schedule | 2 hours | Timetable edit |
| `att:sheet:{class}:{date}` | Pre-built attendance sheet | 10 min | On mark |
| `hw:recent:{teacher_id}` | Recent homework | 15 min | On create |

#### Optimistic UI Strategy

```typescript
// Attendance marking — optimistic update
const markAttendance = useMutation({
  mutationFn: submitAttendance,
  onMutate: async (newData) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries(['attendance', classId, date]);
    
    // Snapshot previous value
    const previous = queryClient.getQueryData(['attendance', classId, date]);
    
    // Optimistically update
    queryClient.setQueryData(['attendance', classId, date], (old) => ({
      ...old,
      records: old.records.map(r => 
        newData.find(n => n.student_id === r.student_id) || r
      ),
    }));
    
    return { previous };
  },
  onError: (err, newData, context) => {
    // Rollback on error
    queryClient.setQueryData(['attendance', classId, date], context.previous);
    toast.error('Failed to save attendance. Please retry.');
  },
});
```

---

### 20.4 PARENT PORTAL

#### Architecture Context
- Read-heavy portal (parents mostly view data)
- Mobile-first usage pattern (60%+ mobile)
- Notification-driven engagement
- Multiple children per parent possible

#### Data Access Pattern

```
Parent Login → Resolve children (1 API call)
            → Dashboard: child performance summary
            → Attendance: monthly view
            → Fees: outstanding + history
            → Homework: pending assignments
            → Results: exam scores
            → Notifications: school communications
```

#### Optimization Focus: Read-Heavy

| Endpoint | Frequency | Payload | Cache Strategy |
|----------|-----------|---------|---------------|
| GET /api/parent/children | Once per session | 500B | Redis 1hr |
| GET /api/parent/dashboard/stats | Every visit | 2KB | Redis 5min |
| GET /api/parent/student-attendance | Weekly check | 3KB | Redis 10min |
| GET /api/parent/fees | Monthly check | 2-5KB | Redis 15min |
| GET /api/parent/child/homework | Daily check | 2KB | Redis 10min |
| GET /api/parent/student-results | After exams | 3KB | Redis 30min |
| GET /api/parent/performance-chart | Occasionally | 2KB | Redis 30min |

#### Mobile Optimization

```
1. PAYLOAD REDUCTION:
   - Return only essential fields for list views
   - Full details on tap/click (lazy load)
   - Image thumbnails (50x50) in lists, full on detail

2. RESPONSE COMPRESSION:
   - Brotli for all JSON responses (80% reduction)
   - 5KB response → 1KB compressed

3. OFFLINE SUPPORT (PWA):
   - Cache timetable, recent results locally
   - Show cached data immediately, refresh in background
   - Service Worker for notification handling

4. PREFETCH STRATEGY:
   - On login: prefetch children, dashboard, notifications
   - On tab switch: prefetch next likely view
```

#### Redis Strategy for Parent Portal

| Key | TTL | Reason for TTL |
|-----|-----|---------------|
| `parent:children:{user_id}` | 1 hour | Rarely changes |
| `parent:dash:{student_id}` | 5 min | Attendance updates during school hours |
| `parent:att:{student_id}:{month}` | 10 min | Updated during marking hours |
| `parent:fees:{student_id}` | 15 min | Updated on payment |
| `parent:hw:{student_id}` | 10 min | New homework during school hours |
| `parent:results:{student_id}` | 30 min | Only changes after exam grading |

#### Estimated Performance for Parent Portal

| Metric | Current | Optimized | Improvement |
|--------|---------|-----------|-------------|
| Dashboard load | 200-400ms | 20-50ms | 85-90% |
| Attendance view | 100-200ms | 10-30ms | 85% |
| Fee status | 150-300ms | 15-40ms | 85% |
| Total data transfer/session | 50KB | 8KB (compressed) | 84% |
| Mobile LCP | 3-4s | 1-1.5s | 60% |

---

### 20.5 STUDENT PORTAL

#### Architecture Context
- Lightest portal (view-only for most features)
- Highest concurrent user count (all students online during school hours)
- Mobile-heavy usage
- Needs fastest load times

#### Data Access Pattern

```
Student Login → Timetable (today's schedule)
             → Homework (pending assignments)
             → Announcements (recent)
             → Results (when available)
             → Live Classes (if scheduled)
```

#### Optimization: Cache-First Strategy

```typescript
// Student portal — aggressive caching
const queryDefaults = {
  staleTime: 10 * 60 * 1000,     // 10 min stale time
  gcTime: 60 * 60 * 1000,         // 1 hour in cache
  refetchOnWindowFocus: false,
  refetchOnMount: false,           // Trust cache
  retry: 1,
};

// Timetable — almost never changes
useQuery({
  queryKey: ['timetable', classId],
  queryFn: fetchTimetable,
  staleTime: 2 * 60 * 60 * 1000,  // 2 hours
});

// Homework — check more frequently
useQuery({
  queryKey: ['homework', classId],
  queryFn: fetchHomework,
  staleTime: 5 * 60 * 1000,       // 5 min
});
```

#### CDN Strategy for Student Portal

```
Static Assets (JS/CSS/images):
  → CDN with 1-year cache (content-hashed filenames)
  → Brotli pre-compressed
  → Edge locations for low latency

API Responses:
  → Redis cache on backend
  → HTTP Cache-Control headers for safe-to-cache responses
  → ETag for conditional requests
```

#### Student Portal Performance Targets

| Metric | Target | Strategy |
|--------|--------|----------|
| First Contentful Paint | <1s | Code splitting + CDN |
| Largest Contentful Paint | <1.5s | Skeleton + cached data |
| Time to Interactive | <2s | Lazy load non-critical |
| API response (cached) | <5ms | Redis |
| API response (uncached) | <30ms | Indexed PG query |
| Total page weight | <150KB | Tree shaking + compression |



---

## 21. Monitoring & Logging

### 21.1 Observability Stack

```
┌─────────────────────────────────────────────────────────────┐
│                    MONITORING ARCHITECTURE                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │ Go App   │───▶│ Prometheus   │───▶│  Grafana     │      │
│  │ /metrics │    │ (scrape 15s) │    │ (dashboards) │      │
│  └──────────┘    └──────────────┘    └──────────────┘      │
│                                                              │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │ Go App   │───▶│   Loki       │───▶│  Grafana     │      │
│  │ (stdout) │    │ (log agg)    │    │ (log search) │      │
│  └──────────┘    └──────────────┘    └──────────────┘      │
│                                                              │
│  ┌──────────┐    ┌──────────────┐                           │
│  │ Frontend │───▶│   Sentry     │                           │
│  │ (errors) │    │ (error track)│                           │
│  └──────────┘    └──────────────┘                           │
│                                                              │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │ All svcs │───▶│ OTel Collector│───▶│  Jaeger      │      │
│  │ (traces) │    │              │    │ (tracing)    │      │
│  └──────────┘    └──────────────┘    └──────────────┘      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 21.2 Prometheus Metrics to Expose

```go
import "github.com/prometheus/client_golang/prometheus"

var (
    httpRequestDuration = prometheus.NewHistogramVec(
        prometheus.HistogramOpts{
            Name:    "http_request_duration_seconds",
            Buckets: []float64{.005, .01, .025, .05, .1, .25, .5, 1, 2.5},
        },
        []string{"method", "path", "status"},
    )
    
    httpRequestsTotal = prometheus.NewCounterVec(
        prometheus.CounterOpts{Name: "http_requests_total"},
        []string{"method", "path", "status"},
    )
    
    dbQueryDuration = prometheus.NewHistogramVec(
        prometheus.HistogramOpts{
            Name:    "db_query_duration_seconds",
            Buckets: []float64{.001, .005, .01, .025, .05, .1, .25, .5},
        },
        []string{"query_type", "table"},
    )
    
    redisCacheHits = prometheus.NewCounterVec(
        prometheus.CounterOpts{Name: "redis_cache_hits_total"},
        []string{"key_pattern"},
    )
    
    redisCacheMisses = prometheus.NewCounterVec(
        prometheus.CounterOpts{Name: "redis_cache_misses_total"},
        []string{"key_pattern"},
    )
    
    activeWebsockets = prometheus.NewGauge(
        prometheus.GaugeOpts{Name: "active_websocket_connections"},
    )
    
    memstoreSize = prometheus.NewGaugeVec(
        prometheus.GaugeOpts{Name: "memstore_collection_size"},
        []string{"collection"},
    )
)
```

### 21.3 Grafana Dashboard Panels

| Panel | Metric | Alert Threshold |
|-------|--------|----------------|
| Request Rate | http_requests_total | >1000 req/s |
| P95 Latency | http_request_duration_seconds | >500ms |
| Error Rate | http_requests_total{status=~"5.."} | >1% |
| DB Query Time | db_query_duration_seconds | P95 >100ms |
| Redis Hit Rate | hits / (hits + misses) | <70% |
| Memory Usage | process_resident_memory_bytes | >80% limit |
| Goroutine Count | go_goroutines | >10000 |
| PG Connection Pool | pgxpool_acquired_conns | >80% max |
| WebSocket Connections | active_websocket_connections | >5000 |

### 21.4 Slow Query Logging

```sql
-- PostgreSQL: Log queries taking >200ms
ALTER SYSTEM SET log_min_duration_statement = 200;
ALTER SYSTEM SET log_statement = 'none';  -- Don't log all, only slow
ALTER SYSTEM SET log_line_prefix = '%t [%p] %u@%d ';
SELECT pg_reload_conf();
```

### 21.5 Structured Logging Format

```go
// Use slog (Go 1.21+) for structured logging
import "log/slog"

logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
    Level: slog.LevelInfo,
}))

// Request logging
logger.Info("request_completed",
    "method", r.Method,
    "path", r.URL.Path,
    "status", status,
    "duration_ms", duration.Milliseconds(),
    "school_id", ctx.SchoolID,
    "user_id", ctx.UserID,
    "cache_hit", cacheHit,
)
```

### 21.6 Log Rotation (Docker)

```yaml
# docker-compose.yml — add to all services
services:
  backend-go:
    logging:
      driver: "json-file"
      options:
        max-size: "50m"
        max-file: "5"
        compress: "true"
```

---

## 22. Production Scaling Plan

### 22.1 Scaling Phases

```
Phase 1: Single VPS (Current → 50 schools)
├── 8GB RAM VPS
├── PostgreSQL + Redis + Go Backend + Nginx
├── All on single machine
└── Target: <200ms P95 latency

Phase 2: Vertical Scale (50 → 150 schools)
├── 16GB RAM VPS
├── Separate DB volume (SSD)
├── PgBouncer for connection pooling
├── Redis with 1GB memory
└── Target: <150ms P95 latency

Phase 3: Horizontal Scale (150 → 500 schools)
├── 2× Backend instances behind load balancer
├── Dedicated PostgreSQL server (32GB RAM)
├── Redis Sentinel (HA)
├── Read replica for analytics queries
└── Target: <100ms P95 latency

Phase 4: Enterprise (500+ schools)
├── Kubernetes cluster
├── PostgreSQL with Citus (distributed)
├── Redis Cluster (6 nodes)
├── CDN for all static assets
├── Separate analytics database
└── Target: <50ms P95 latency
```

### 22.2 Load Testing Targets

| Scenario | Concurrent Users | Requests/sec | P95 Target | P99 Target |
|----------|-----------------|-------------|------------|------------|
| Normal school day | 500 | 100 | 100ms | 300ms |
| Peak (attendance hour) | 2000 | 500 | 200ms | 500ms |
| Exam results day | 5000 | 1000 | 300ms | 800ms |
| Fee deadline day | 3000 | 600 | 200ms | 500ms |

### 22.3 Horizontal Scaling Architecture

```
                    ┌──────────────┐
                    │   Cloudflare  │
                    │   (CDN + WAF) │
                    └──────┬───────┘
                           │
                    ┌──────┴───────┐
                    │    Nginx     │
                    │ (Load Balancer)│
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
       ┌──────┴──────┐ ┌──┴──────┐ ┌──┴──────┐
       │ Backend #1  │ │Backend #2│ │Backend #3│
       └──────┬──────┘ └──┬──────┘ └──┬──────┘
              │            │            │
              └────────────┼────────────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
       ┌──────┴──────┐ ┌──┴──────┐ ┌──┴──────┐
       │  PgBouncer  │ │  Redis  │ │  Redis  │
       │             │ │ Primary │ │ Replica │
       └──────┬──────┘ └─────────┘ └─────────┘
              │
       ┌──────┴──────┐
       │ PostgreSQL  │
       │  Primary    │──── Read Replica
       └─────────────┘
```

---

## 23. Estimated Performance Gains

### 23.1 Overall System Performance

| Metric | Current | After Phase 1 (Redis) | After Phase 2 (Direct PG) | After Phase 3 (Full) |
|--------|---------|----------------------|--------------------------|---------------------|
| Dashboard API | 40-200ms | 5-15ms | 5-15ms | 2-5ms |
| Student List (500) | 150ms + 200KB | 10ms + 15KB | 10ms + 3KB (gzip) | 5ms + 3KB |
| Attendance Mark (50) | 300-500ms | 50-100ms | 20-50ms | 15-30ms |
| Fee Generation | 5-30s (blocking) | 5-30s (async) | 2-5s (async) | 1-2s (async) |
| Notification Poll | 30ms × 2/min | 0 (WebSocket) | 0 (WebSocket) | 0 (WebSocket) |
| Memory Usage | 200-500MB | 150-300MB | 80-150MB | 80-150MB |
| Concurrent Users | 50-100 | 200-500 | 500-2000 | 2000-10000 |

### 23.2 Per-Portal Performance Gains

| Portal | Current Load Time | Optimized Load Time | Improvement |
|--------|------------------|--------------------|-----------:|
| Super Admin Dashboard | 300-500ms | 20-50ms | **90%** |
| Admin Dashboard | 200-400ms | 15-40ms | **88%** |
| Teacher Attendance | 400-600ms | 30-80ms | **85%** |
| Parent Dashboard | 200-400ms | 20-50ms | **88%** |
| Student Timetable | 100-200ms | 5-15ms | **92%** |

### 23.3 Infrastructure Cost Impact

| Phase | VPS Cost | Performance | Schools Supported |
|-------|----------|-------------|-------------------|
| Current | $20-40/mo (4GB) | Adequate for 10 | 10-20 |
| Phase 1 | $40-60/mo (8GB) | Good for 50 | 20-50 |
| Phase 2 | $80-120/mo (16GB) | Good for 150 | 50-150 |
| Phase 3 | $200-400/mo (multi) | Excellent for 500 | 150-500 |

### 23.4 Network Savings

| Optimization | Data Saved/Request | Requests/Day (100 users) | Daily Savings |
|-------------|-------------------|-------------------------|---------------|
| Gzip/Brotli | 60-80% of payload | 10,000 | 500MB-1GB |
| Pagination | 90% of list payloads | 2,000 | 200-400MB |
| WebSocket (vs polling) | Eliminates 80% of requests | 8,000 eliminated | 100MB |
| API merging | 3-5 requests → 1 | 5,000 eliminated | 50MB |
| **Total daily savings** | | | **~1-2GB** |

---

## 24. Priority-based Optimization Roadmap

### 24.1 Priority Classification

#### 🔴 HIGH PRIORITY (Week 1-2) — Quick Wins + Critical Fixes

| # | Task | Impact | Effort | Dependencies |
|---|------|--------|--------|--------------|
| 1 | Add Gzip/Brotli compression middleware | 60-80% payload reduction | 1 hour | None |
| 2 | Add pagination to all list endpoints | Prevents payload explosion | 2-3 days | Frontend changes |
| 3 | Add Redis container to docker-compose | Foundation for caching | 2 hours | None |
| 4 | Implement dashboard Redis cache | 90% dashboard speedup | 1 day | Redis container |
| 5 | Add missing DB indexes | 50-80% query speedup | 2 hours | None |
| 6 | Configure pgxpool properly | Prevents connection starvation | 1 hour | None |
| 7 | Add rate limiting middleware | Security + stability | 4 hours | Redis |
| 8 | Frontend route splitting (lazy imports) | 75% initial bundle reduction | 1 day | None |

#### 🟡 MEDIUM PRIORITY (Week 3-4) — Structural Improvements

| # | Task | Impact | Effort | Dependencies |
|---|------|--------|--------|--------------|
| 9 | Migrate dashboard to direct PG query | Eliminates MemStore bottleneck | 2-3 days | Indexes |
| 10 | Batch attendance INSERT | 85% marking speedup | 1 day | None |
| 11 | WebSocket for notifications | Eliminates polling | 2-3 days | Redis Pub/Sub |
| 12 | TanStack Query optimization (staleTime, gcTime) | Reduces unnecessary refetches | 1 day | None |
| 13 | API response merging (composite endpoints) | Fewer round-trips | 2 days | None |
| 14 | Nginx reverse proxy with caching | Static asset caching + compression | 4 hours | None |
| 15 | Skeleton loading for all data views | Better perceived performance | 2 days | None |
| 16 | Fee generation as background job | Unblocks UI during generation | 1-2 days | Redis queue |

#### 🟢 LOW PRIORITY (Month 2-3) — Long-term Architecture

| # | Task | Impact | Effort | Dependencies |
|---|------|--------|--------|--------------|
| 17 | Full MemStore → PG migration | Eliminates memory scaling issue | 2-3 weeks | All above |
| 18 | Materialized views for dashboards | Sub-ms dashboard queries | 2-3 days | Direct PG |
| 19 | Virtual scrolling for large lists | Smooth UI for 1000+ items | 3-4 days | Pagination |
| 20 | PgBouncer integration | Connection pooling at scale | 1 day | None |
| 21 | CDN for static assets | Global latency reduction | 1 day | DNS config |
| 22 | Prometheus + Grafana monitoring | Visibility into performance | 2-3 days | None |
| 23 | Read replica for analytics | Offload heavy queries | 1-2 days | PG setup |
| 24 | Table partitioning (attendance, audit) | Query performance at scale | 2-3 days | Data migration |

### 24.2 Quick Wins (Implement Today)

```
1. ✅ Add compression middleware (1 line of code)
   r.Use(middleware.Compress(5, "application/json"))
   Impact: 60-80% bandwidth reduction immediately

2. ✅ Configure pgxpool (5 lines)
   poolConfig.MaxConns = 25
   poolConfig.MinConns = 5
   Impact: Prevents connection starvation under load

3. ✅ Add missing indexes (run SQL)
   Impact: 50-80% faster queries for dashboard, attendance, fees

4. ✅ Set TanStack Query staleTime globally
   staleTime: 5 * 60 * 1000 (5 minutes)
   Impact: 80% fewer unnecessary API calls

5. ✅ Add Redis to docker-compose
   Impact: Foundation for all caching work
```

### 24.3 Detailed Week-by-Week Roadmap

#### Week 1: Foundation & Quick Wins

```
Day 1-2:
  □ Add gzip compression middleware to Chi router
  □ Configure pgxpool (MaxConns=25, MinConns=5)
  □ Run missing index SQL migrations
  □ Add Redis service to docker-compose.yml
  □ Implement basic Redis client in Go backend

Day 3-4:
  □ Implement dashboard Redis cache (5min TTL)
  □ Add pagination to /api/students endpoint
  □ Add pagination to /api/attendance endpoint
  □ Add pagination to /api/notifications endpoint
  □ Frontend: Add staleTime to all TanStack Query hooks

Day 5:
  □ Add rate limiting middleware (Redis-backed)
  □ Add request logging with duration metrics
  □ Test all changes under load (hey/wrk)
  □ Deploy to staging
```

#### Week 2: Frontend Performance

```
Day 1-2:
  □ Implement route-level code splitting (React.lazy)
  □ Add Suspense boundaries with skeleton fallbacks
  □ Implement skeleton components for all dashboard cards
  □ Add debouncing to all search inputs (300ms)

Day 3-4:
  □ Optimize TanStack Query configurations per module
  □ Implement pagination UI components
  □ Add infinite scroll for notifications
  □ Implement optimistic updates for attendance marking

Day 5:
  □ Bundle analysis (vite-bundle-visualizer)
  □ Remove unused dependencies
  □ Test Lighthouse scores
  □ Deploy frontend optimizations
```

#### Week 3: Backend Architecture

```
Day 1-2:
  □ Migrate dashboard handler to direct PG queries
  □ Create materialized view for school stats
  □ Implement batch attendance INSERT (ON CONFLICT)
  □ Add composite dashboard API endpoint

Day 3-4:
  □ Implement WebSocket hub for notifications
  □ Add Redis Pub/Sub for real-time events
  □ Migrate notification polling to WebSocket push
  □ Implement fee generation as background job (Redis queue)

Day 5:
  □ Load testing (500 concurrent users)
  □ Profile memory usage
  □ Fix any regressions
  □ Deploy to production
```

#### Month 2: Scaling Architecture

```
Week 1:
  □ Begin MemStore → direct PG migration (students, teachers, classes)
  □ Implement repository pattern for migrated entities
  □ Add Redis caching layer for migrated queries
  □ Maintain backward compatibility during migration

Week 2:
  □ Migrate attendance, fees, results to direct PG
  □ Implement PgBouncer for connection pooling
  □ Add Nginx reverse proxy with static caching
  □ Set up CDN for frontend assets

Week 3:
  □ Complete MemStore removal (all entities)
  □ Implement table partitioning for attendance, audit_logs
  □ Add read replica for analytics queries
  □ Performance regression testing

Week 4:
  □ Set up Prometheus + Grafana monitoring
  □ Create alerting rules
  □ Document runbooks for common issues
  □ Production deployment with monitoring
```

#### Month 3: Enterprise Readiness

```
Week 1-2:
  □ Implement Row-Level Security (RLS) in PostgreSQL
  □ Add OpenTelemetry distributed tracing
  □ Implement circuit breaker pattern for external services
  □ Add graceful degradation (serve stale on failure)

Week 3-4:
  □ Load test at 2000 concurrent users
  □ Implement horizontal scaling (2 backend instances)
  □ Add health check endpoints with dependency status
  □ Create disaster recovery plan
  □ Document scaling playbook
  □ Final production hardening
```

### 24.4 Enterprise Architecture Recommendations

```
LONG-TERM TARGET ARCHITECTURE (12+ months):

┌─────────────────────────────────────────────────────────────────┐
│                                                                   │
│  ┌─────────┐    ┌──────────────┐    ┌──────────────────────┐   │
│  │Cloudflare│───▶│ Nginx/Envoy  │───▶│  Go Backend (×3)     │   │
│  │  (CDN)   │    │ (LB + TLS)   │    │  - Stateless         │   │
│  └─────────┘    └──────────────┘    │  - Redis for state    │   │
│                                      │  - PG for persistence │   │
│                                      └──────────┬────────────┘   │
│                                                  │                │
│                         ┌────────────────────────┼──────┐        │
│                         │                        │      │        │
│                  ┌──────┴──────┐  ┌──────────┐  │  ┌───┴────┐  │
│                  │  PgBouncer  │  │  Redis    │  │  │ Worker │  │
│                  │  (pooling)  │  │  Cluster  │  │  │ (jobs) │  │
│                  └──────┬──────┘  └──────────┘  │  └────────┘  │
│                         │                        │               │
│                  ┌──────┴──────┐                 │               │
│                  │ PostgreSQL  │                 │               │
│                  │  Primary    │─── Read Replica │               │
│                  │  (Citus)    │                 │               │
│                  └─────────────┘                 │               │
│                                                  │               │
│                  ┌─────────────┐                 │               │
│                  │   MinIO     │ (file storage)  │               │
│                  └─────────────┘                 │               │
│                                                  │               │
│                  ┌─────────────┐                 │               │
│                  │ Prometheus  │───▶ Grafana     │               │
│                  │ + Loki      │                 │               │
│                  └─────────────┘                 │               │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### 24.5 Key Architectural Decisions

| Decision | Recommendation | Reason |
|----------|---------------|--------|
| State management | Stateless backend + Redis | Enables horizontal scaling |
| Database | PostgreSQL + PgBouncer | Proven, ACID, excellent indexing |
| Caching | Redis (not Memcached) | Pub/Sub, data structures, persistence |
| Queue | Redis Lists (→ BullMQ pattern) | Simple, fast, already have Redis |
| File storage | MinIO (S3-compatible) | Separates files from app server |
| Search | PostgreSQL trigram + tsvector | No need for Elasticsearch at this scale |
| Monitoring | Prometheus + Grafana + Loki | Industry standard, free |
| Error tracking | Sentry | Best-in-class for frontend + backend |
| Load balancing | Nginx (→ Envoy at scale) | Simple, proven, HTTP/2 |
| Container orchestration | Docker Compose (→ K8s at 500+ schools) | Right-sized for current scale |

---

## Appendix A: Docker Compose with All Optimizations

```yaml
# docker-compose.optimized.yml
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./school-react-app/dist:/usr/share/nginx/html/school:ro
      - ./super-admin-app/dist:/usr/share/nginx/html/admin:ro
    depends_on:
      - backend-go
    deploy:
      resources:
        limits: { memory: 128M, cpus: '0.5' }

  backend-go:
    build: ./backend-go
    environment:
      PORT: "8080"
      DATABASE_URL: postgres://...
      REDIS_URL: redis://redis:6379
      GOMAXPROCS: "4"
      GOMEMLIMIT: "900MiB"
    deploy:
      resources:
        limits: { memory: 1G, cpus: '2.0' }
      replicas: 2
    healthcheck:
      test: ["CMD", "/app/server", "-health"]  # Requires health flag
      interval: 30s
      timeout: 5s

  postgres:
    image: postgres:16-alpine
    command: >
      postgres
      -c shared_buffers=512MB
      -c effective_cache_size=1536MB
      -c work_mem=16MB
      -c maintenance_work_mem=256MB
      -c max_connections=100
      -c log_min_duration_statement=200
    deploy:
      resources:
        limits: { memory: 2.5G, cpus: '2.0' }

  redis:
    image: redis:7-alpine
    command: >
      redis-server 
      --maxmemory 512mb 
      --maxmemory-policy allkeys-lru 
      --appendonly yes
      --tcp-keepalive 300
    deploy:
      resources:
        limits: { memory: 600M, cpus: '0.5' }
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s

  worker:
    build: ./backend-go
    command: ["/app/server", "-worker"]
    environment:
      REDIS_URL: redis://redis:6379
      DATABASE_URL: postgres://...
    deploy:
      resources:
        limits: { memory: 512M, cpus: '1.0' }
```

---

## Appendix B: Performance Testing Commands

```bash
# Install hey (HTTP load generator)
brew install hey

# Basic load test — dashboard endpoint
hey -n 1000 -c 50 -H "Authorization: Bearer <token>" \
  http://localhost:8080/api/analytics/dashboard

# Sustained load test — 60 seconds
hey -z 60s -c 100 -H "Authorization: Bearer <token>" \
  http://localhost:8080/api/students

# Attendance bulk mark simulation
hey -n 100 -c 10 -m POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -D attendance_payload.json \
  http://localhost:8080/api/attendance/mark

# PostgreSQL slow query check
docker exec school_postgres psql -U school_user -d school_db \
  -c "SELECT query, calls, mean_exec_time, total_exec_time 
      FROM pg_stat_statements 
      ORDER BY mean_exec_time DESC 
      LIMIT 20;"

# Redis memory analysis
docker exec redis redis-cli INFO memory
docker exec redis redis-cli --bigkeys

# Go memory profiling
curl http://localhost:8080/debug/pprof/heap > heap.prof
go tool pprof -http=:6060 heap.prof
```

---

## Appendix C: Key Performance Indicators (KPIs)

| KPI | Current Baseline | Week 2 Target | Month 2 Target | Month 3 Target |
|-----|-----------------|---------------|----------------|----------------|
| P95 API Latency | 200-500ms | <100ms | <50ms | <30ms |
| Dashboard Load | 300-500ms | <50ms | <20ms | <10ms |
| Memory Usage | 300-500MB | 200-300MB | 100-150MB | 100-150MB |
| Concurrent Users | 50-100 | 200-500 | 500-2000 | 2000-5000 |
| Error Rate | Unknown | <1% | <0.1% | <0.01% |
| Cache Hit Rate | 0% (no cache) | >70% | >85% | >90% |
| Frontend LCP | 3-4s | <2s | <1.5s | <1s |
| Bundle Size | ~800KB | <300KB | <200KB | <150KB |
| DB Connections | Default (4) | 25 | 50 (PgBouncer) | 100 |
| Schools Supported | 10-20 | 30-50 | 100-150 | 300-500 |

---

*Document End*

**Next Review:** After Week 2 implementation  
**Owner:** Performance Engineering Team  
**Status:** Active — Implementation Phase 1
