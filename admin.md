Eduplexo Performance + Scalability Audit
This is grounded in the actual repo state — file paths cited are real, line counts checked, indexes/migrations cross-referenced. I split it into "what's already correct" vs "what's broken" so you don't waste effort re-doing work.

Inventory snapshot (what actually exists)
Layer	What's in place today	What's missing
Cache (
redis.go
)	Real Redis client, graceful degrade, pool=20/min=5, SCAN-based pattern delete, GetString/SetJSON/Incr/Expire	No MGet, no Pipeline exposure, no per-key metrics
PG pool (
persistence.go
)	pgxpool max=25/min=5, 30m lifetime, 5m idle, async write queue, 1s flush, FullSnapshot loop	Pool size is fixed at 25 regardless of replica count → with 2 replicas + worker = 75 conns vs Postgres max_connections=100. Tight.
Indexes	54 indexes total: 43 in init + 9 perf (migration 000006) + 2 in payments	Several hot scans listed below have no covering index
Materialized views	mv_school_dashboard, mv_fee_summary exist	Refresh is manual / commented — never called from worker
Compression	Chi gzip level 5, 7 content types, on every response	No Vary: Accept-Encoding review (chi does it). Level 5 is fine for VPS CPU budget
Cache wired (handlers)	dashboard, composite, timetable (list+summary), students (list+invalidation), teachers (invalidation), attendance (PG handler + invalidation), chatbot memory	Not wired: classes list, exams list, results list, fees ledger, leave list, behavior list, events list, homework list, announcements list, parent endpoints (/parent/*), academic-years list, subjects list
Frontend	TanStack Query installed + provider, but only NotificationBadge uses it. All other pages use useSafeAsync + raw fetch. Vite source maps were on (just fixed).	useSafeAsync doesn't dedupe in-flight requests — when 5 widgets mount with the same class_id, you get 5 round trips.
Multi-tenant	Every handler filters by ctx.SchoolID. Row-level security migration 000008 exists.	RLS is defined, but most repos don't SET app.current_school_id per session, so the policy never engages. RLS is dead weight today.
MemStore scanning	174 Lock/RLock acquisitions across handlers; 44 range Students, 39 range Classes, 33 range Teachers.	These run on every request even when PG repos exist (students & teachers fall back to mem scan)
The architecture is fundamentally sound. The leaks are concentrated in three places: (1) unused/un-wired Redis caching for hot list endpoints, (2) linear MemStore scans in the auth middleware and parent endpoints, (3) fan-out fetching on the frontend without query deduplication.

STEP 1 — Module discovery (concise; full table omitted, only the perf-relevant flags)
Module	List page	Detail page	Dashboard widget	DB tables	Cache wired?	Hot-path issue
Dashboard	–	–	composite + per-tile	reads everything	✅ 5min TTL	Cache key drops on every mutation across cache types (DelPattern + per-tile DEL hits Redis 6+ times per write)
Academic Years	yes	yes	–	academic_years	❌	Loaded by SchoolShell on every nav (see "Frontend dup fetch" below)
Classes	yes	yes (fees, edit)	KPI tile	classes, joins students/teachers/attendance/fees	❌	enrichClass does N×M scans per row in MemStore mode
Timetable	grid	edit	grid preview, summary	timetables	✅ list+summary 2min/60s	Teacher scoping bypasses the cache (teacherProfileID != "")
Attendance	yes	–	dashboard tile	attendance	✅ invalidation only on PG path	Attendance LIST has no Redis read-through, only write-side invalidation
Exams	yes	marks (group)	KPI	exams, results	❌	List recomputes results_count per row (for _, r := range Results inside hydrate)
Tests	yes	marks	–	same as exams	❌	shares exam handler
Results	yes	marksheet	–	results	❌	Per-row exam + class lookup, dedupe done client-side
Live Classes	yes	–	–	live_classes	❌	–
Homework	yes	review	KPI tile	homework	❌	Submission count derived from embedded array on every request
Students	yes	edit	KPI tile	students	✅ list+single (PG path)	Mem fallback path is uncached
Behavior	yes	detail	KPI	behaviors	❌	–
Teachers	yes	edit	KPI	teachers	✅ invalidation only	List has no read-through cache
Leave	yes	detail	KPI	leaves	❌	Index exists for pending only
Events	yes	–	–	events	❌	New for_class_id filter scans full Events slice per request
Fee	ledger, components, payments	invoice	fee tile	fees, fee_payments, fee_adjustments	❌	StudentFees walks every Fee row of the school per parent visit
Subscription	–	–	–	–	❌	–
Domain Connect	–	–	–	–	❌	–
Settings	–	–	–	school_settings	❌	Read on most page mounts; very cacheable
STEP 2 — API performance audit (highest-impact endpoints only)
Endpoint	Query/scan cost	DB cost	Cacheable	Redis strategy	Recommended fix
GET /api/students (mem fallback)	O(N students) per call, sorted in Go	Cheap on PG path, expensive on memstore (locks held during sort)	High (admin lists rarely change in a 60s window)	Read-through students:{school}:{year}:{filtersHash} 60s	Already done for PG path; mirror it in the memstore fallback OR drop the fallback when PG is up
GET /api/classes	enrichClass does 4 nested scans (students, teachers, attendance, fees) per row	High — O(C × (S+T+A+F)) on memstore	Yes 5min	classes:{school}:{year} with bulk hydrate	Add Redis read-through; precompute student counts/attendance % once per fetch instead of per-class
GET /api/exams	hydrate counts results per exam (resultsByExam map)	Acceptable; full slice scan twice	Yes 2min	exams:{school}:{year}:{class?}:{type}	Cache hydrated payload (incl. result counts); invalidate on results:save, exams:create/update/delete
GET /api/results	full Results scan + 3 maps built per request	High on growth	Yes 60s	results:{school}:{year}:{exam?}:{class?}:{student?} 60s	Hydrate once, cache hydrated map output
GET /api/exams/:id/results	linear scan on every fetch	Yes 60s (parent reload, marks page)	results:exam:{exam_id} 60s	Cache; invalidate on save	
GET /api/parent/dashboard/stats	scans Attendance + Exams + Results + Homework + Fees + Classes (5 slices)	Very high per-request	Yes 60s	parent:dash:{school}:{student} 60s	Add cache; invalidate on attendance/result/fee/homework writes for that student
GET /api/parent/student-attendance	full Attendance scan + grouping by date	High	Yes 60s	parent:att:{school}:{student} 60s	Cache
GET /api/parent/student-results	full Results + Exams scan	High	Yes 60s	parent:res:{school}:{student} 60s	Cache
GET /api/parent/fees	fees.StudentFees scans every Fee in the school	High	Yes 30s	parent:fees:{school}:{student} 30s	Cache; invalidate on fees:save/payments:create
GET /api/parent/child/homework	Homework scan + Teacher map	Medium	Yes 5min	parent:hw:{school}:{student} 5min	Cache; invalidate on homework/submission writes
GET /api/timetable (teacher scope)	bypasses cache when teacherProfileID != ""	Medium	Yes 2min	tt:teacher:{school}:{teacher_profile} 2min	Add second cache path for teacher view (currently cache only fires for admin)
GET /api/notifications (badge)	idx_notifications_user_unread partial index already exists	Low	Already done client-side via React Query	–	Frontend polls every 30s; consider WS push instead
GET /api/academic-years	called from SchoolShell on every navigation	Low per call but called hundreds of times per session	Yes 5min	ay:{school} 5min in browser memory + ay:{school} 5min Redis	Move to React Query with stale-time 5min so it doesn't re-fire
GET /api/parents/check-email	full Users + Students scan per keystroke (debounced)	Low when debounced	Yes 30s	email:{lower(email)}:{school} 30s	Add small read-through cache to handle backspace/retype
Auth middleware	full Users scan on every request	Critical at scale	–	–	Build in-memory map {userID, email} → User on bootstrapAdmin/PG load and on every Users mutation. Constant-time lookup.
The auth middleware scan is the single biggest perf footgun. With 1k users × 50 req/page-load × 50 students/teachers signed in = 2.5M iterations/sec just to validate sessions. Fix is below.

STEP 3 — Redis strategy (only what's NOT already wired)
Feature	Redis key	TTL	Invalidation	Expected gain
Classes list	classes:{school}:{year}	5min	on classes/students/teachers/fees/attendance write	-90% query cost on enrichClass
Exams list	exams:{school}:{year}:{class}:{type}	2min	on exams/results write	-80% list latency
Results list (admin)	results:{school}:{year}:{filters_hash}	60s	on results write	-70% latency
Per-exam results	results:exam:{exam_id}	60s	on results write	-90% (marks page reopen flow)
Parent dashboard	parent:dash:{school}:{student}	60s	on student-related writes (attendance/results/homework/fees)	-95% on a 5-slice scan
Parent attendance	parent:att:{school}:{student}	60s	on attendance:save	-90%
Parent results	parent:res:{school}:{student}	60s	on results:save	-90%
Parent fees	parent:fees:{school}:{student}	30s	on fees:save / payments:create	-95%
Parent homework	parent:hw:{school}:{student}	5min	on homework:save / submissions:save	-90%
Settings	settings:{school}	30min	on settings update	-100% per call (hit on every page)
Subjects list	subjects:{school}	10min	on subjects write	-90%
Academic years (per tenant)	ay:{school}	5min	on AY create/update	reduce SchoolShell-triggered fetch
Teacher list	teachers:{school}:{filters}	5min	on teachers write	-90%
Leave summary	leave:counts:{school}	60s	on leave:save	-70% on dashboard tile
Behavior summary	behavior:counts:{school}	60s	on behavior:save	-70%
Auth user lookup	NOT a Redis use-case — use in-process map	–	invalidate on user CRUD	constant-time (was O(N) per request)
Rate limiting	rl:{user}:{route}:{minute}	60s	TTL only	already have Incr helper — just add the middleware
Domain lookup (when wired)	domain:{host}	30min	on domain edit	-100% per request
Cache-key tenant isolation is enforced by always prefixing with {school_id}. The two parent:* patterns include {student} which is already school-scoped via StudentParents.

Invalidation strategy: prefer event-bus over DelPattern. DelPattern uses SCAN on the whole keyspace and gets slow once Redis has 50k+ keys. The current dashboard pattern (dash:school_1:*) is fine because it's narrow, but students:school_1:* is dangerous because any hash in the keyspace beginning with students: will be scanned. Recommendation: maintain a small index set per tenant (e.g. index:students:{school} SET of cache keys) and DEL the explicit list. 5 lines of code in the cache wrapper.

STEP 4 — Database audit
Indexes that ARE there
migration 000001_init.up.sql already adds the standard (school_id, *) composites for every table. migration 000006 adds 9 hot-path indexes including attendance(school_id, date DESC), fees(school_id, academic_year_id, month, status), partial index on unread notifications, audit_logs(school_id, created_at DESC), partial pending-leave index, results(exam_id, class_id, academic_year_id), fee_payments(school_id, payment_date DESC), homework(school_id, class_id, due_at DESC, status).

Indexes that should be added (write a migration 000012_perf_phase2.up.sql)
-- Parent linkage hot path: resolveStudent walks StudentParents per request.
CREATE INDEX IF NOT EXISTS idx_student_parents_parent
ON student_parents (school_id, parent_user_id);

-- Auth middleware (until in-process map ships) and email-lookup caching.
CREATE INDEX IF NOT EXISTS idx_users_school_email
ON users (school_id, lower(email));
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_email_lower
ON users (lower(email));

-- Student-by-class active filter (used by every parent endpoint and homework
-- list). status=active is always passed so partial index keeps it tiny.
CREATE INDEX IF NOT EXISTS idx_students_school_class_active
ON students (school_id, class_id) WHERE status = 'active';

-- Exam list filter combos (class + type + status appear together).
CREATE INDEX IF NOT EXISTS idx_exams_school_class_type
ON exams (school_id, class_id, type, starts_at DESC);

-- Subjects per class lookup (used by exam create form, homework form,
-- timetable form, marks page).
CREATE INDEX IF NOT EXISTS idx_class_subjects_class
ON class_subjects (school_id, class_id) WHERE status = 'active';

-- Results-by-student scan (parent /student-results, profile, performance chart).
CREATE INDEX IF NOT EXISTS idx_results_school_student
ON results (school_id, student_id, graded_at DESC);

-- Behavior + Leave history per student.
CREATE INDEX IF NOT EXISTS idx_behaviors_student
ON behaviors (school_id, student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leaves_school_requester
ON leaves (school_id, requester_id, requester_type, created_at DESC);

-- Events targeting class arrays (the new `for_class_id` filter scans rows
-- otherwise). Use a GIN index on the array column.
CREATE INDEX IF NOT EXISTS idx_events_target_class_gin
ON events USING gin (target_class_ids);

-- Fee payments per student (parent fees page derives payment history).
CREATE INDEX IF NOT EXISTS idx_fee_payments_school_student
ON fee_payments (school_id, student_id, payment_date DESC);

-- Audit chain by entity (admin "history" overlays).
CREATE INDEX IF NOT EXISTS idx_audit_entity
ON audit_logs (school_id, entity_type, entity_id, created_at DESC);
Estimated time on a fresh small VPS: under 30s total since no table currently has 100k+ rows.

N+1 / repeated joins (real ones I saw)
fees.StudentFees loops every fee for the school then dereferences classes/students inline. It's O(F) with constant factor 1 because the loop hits a per-school index. Not an N+1 in SQL — but in MemStore mode it's a full slice scan. Cache with TTL=30s.

exams.hydrate builds resultsByExam by iterating ALL results for the school. If there are 50k results in the school and 30 exams, every list call is doing 50k iterations to compute counts. Replace with a single SELECT exam_id, COUNT(*) FROM results WHERE school_id=$1 GROUP BY exam_id and cache for 60s.

results.hydrate rebuilds studentByID, classByID, examByID maps on every request. These maps are scoped per-handler invocation. Cache the hydrated output JSON instead of trying to dedupe the maps.

parent.resolveStudent runs on every parent endpoint and walks StudentParents then Students. With the new index above, plus an in-memory map keyed by (school_id, parent_user_id) → []studentIDs, this becomes O(1).

COUNT(*) patterns
fees.dashboard-stats does several len(slice) after filtering — not an actual COUNT(*), but functionally the same when the slice is large. Materialize via mv_fee_summary (already exists, just isn't refreshed).
dashboard.composite already uses Redis for the result; no extra COUNT cost on the hot path.
SELECT * audit
Looking at internal/repo/*_repo.go, queries explicitly list columns. The MemStore handlers don't run SQL at all, so this isn't a problem.

Materialized views
migration 000007 creates mv_school_dashboard and mv_fee_summary but the refresh comment is dead code. Action: refresh from the existing worker (docker-compose.prod.yml already has a worker container). One scheduled job per 5 minutes:

// In the worker's StartBackground loop, add:
ticker := time.NewTicker(5 * time.Minute)
for range ticker.C {
    if _, err := pg.Exec(ctx, `REFRESH MATERIALIZED VIEW CONCURRENTLY mv_school_dashboard`); err != nil {
        log.Printf("[worker] mv_school_dashboard refresh: %v", err)
    }
    if _, err := pg.Exec(ctx, `REFRESH MATERIALIZED VIEW CONCURRENTLY mv_fee_summary`); err != nil {
        log.Printf("[worker] mv_fee_summary refresh: %v", err)
    }
}
Then change /api/dashboard/composite and /api/school/fees/dashboard-stats to read from the views — these become single-row PG reads that finish in <2ms.

Connection pool
Current: each backend replica × 25 conns, plus worker × ~5. With 2 replicas + worker = up to 55. Postgres max_connections=100. Comfortable headroom but no connection budget for one-off admin tools or migrations during incident. Recommendation: drop MaxConns per replica from 25 to 15 (each replica handles ~1500 RPS comfortably with that pool), keeping headroom for migrations and psql shells.

STEP 5 — Frontend audit
Already fixed (last session)
Vite source maps off in prod, gzip handled by reverse proxy, manual chunking for animation libs, console/debugger stripped, es2020 target.
Still broken
useSafeAsync doesn't dedupe in-flight requests. Multiple components mounting at the same time with the same query do N round trips. The fix is migrating each module's hook to TanStack Query — the provider is already mounted. Order of priority:

useTimetable (used in dashboard preview + timetable page + exam form simultaneously)
useClasses (used in 7+ create forms simultaneously)
useStudents, useExams, useResults, useTeachers
useAcademicYears (called from SchoolShell on every navigation — biggest single saving on a long-session admin)
SchoolShell re-fetches academic years on every mount (fetch("/api/academic-years")) because there's no client cache. With React Query's staleTime: 5min this becomes 1 request per 5 minutes per session instead of one per page navigation. On an admin clicking around 30 pages in 5 min: 30 → 1 = 96% cut for that endpoint.

useEffect chains in parent pages. Each parent page does [selectedChild] effect + own state. When the user switches child via the header dropdown, every page mounted in the past gets cleaned up properly, but the new page does N sequential awaits where it could Promise.all. I already fixed the dashboard and attendance — the timetable / homework / fees pages still serial-fetch.

HomeworkPage and ResultListPage filter on the client. Acceptable up to ~500 rows, painful past 5k. Add server-side filters when paginated.

No bundle visualization. Add npm run build -- --mode analyze step using rollup-plugin-visualizer. Single command, tells you exactly which import is fattening which chunk.

DataTable has no virtualization. Once you add an attendance feed > 200 rows it'll choke a low-end VPS dev preview. @tanstack/react-virtual is the standard partner; integrate only when a table actually needs it (results list, attendance list, fees ledger).

Specific files
SchoolShell.tsx 280
 (academic year fetch) — wrap in React Query.
service-client.ts
 — fine. Don't touch.
useSafeAsync.ts
 — keep as fallback but stop pretending it's a cache.
STEP 6 — Pagination & list optimization
List	Current	Should be
Students	offset paginated when pagination.Enabled (via ?page=); falls through to full list otherwise	Keep offset for admin lists (good UX), add cursor only if a school crosses 10k students. Cache 60s.
Teachers	same	same
Attendance	none — front-end does full-month view	offset paginated by date range; never paginate cells.
Homework	full list	Add ?status=&class_id=&due_after=&limit=50&offset=. Cache 5min.
Results	full list	Cache 60s. Frontend dedupes already; pagination only needed past 1k results in a single class.
Events	full list	Add ?start_date=&end_date= + LIMIT/OFFSET.
Fees ledger	full list	Already paginated by month — fine.
Classes	full list (small N — usually <50/school)	Don't paginate; cache 5min.
Cursor pagination is overkill for an ERP where lists are rarely longer than a few thousand rows. Offset + total count is fine and the existing api.BuildPaginated helper already returns the right shape.

STEP 7 — Dashboard
The composite dashboard is already correctly designed: one endpoint, Redis 5min, WS-driven invalidation. The remaining issue is the invalidation fan-out: every CRUD writes to dash:{school}:{year} AND each per-tile cache. That's 6 RTT to Redis for a single mutation. Two cleaner options:

Tag-based invalidation — store a "dashboard version counter" dash:ver:{school} (atomic INCR). Every read includes the version in the key (dash:{school}:{year}:v{N}). On write, INCR the version. Old keys naturally expire via TTL. One Redis op per write instead of six.

MV-backed read — once mv_school_dashboard is refreshed by the worker, the composite handler can serve directly from PG; the Redis layer is only a hot-path microcache (10s TTL). Sub-2ms p95.

Use both: MV refresh every 5min for the canonical answer + 10s Redis for hot-path microcache.

STEP 8 — Multi-tenant scalability
Tenant isolation status
Every handler checks ctx.SchoolID == row.SchoolID before returning. ✅
RLS migration 000008 exists but is never engaged because pgx doesn't SET app.current_school_id per session. The policies are dormant. Two options:
Drop RLS — handler-level checks are sufficient for current threat model.
Wire it: in pgxpool.Config.AfterConnect, SET app.current_school_id from a context value. ~20 lines of code. Adds defense-in-depth with no perf cost.
Cache keys are universally prefixed with {school_id}. ✅
Tenant DB indices
The init migration's idx_*_school_id set is good but several composite indexes are missing the (school_id, ...) ordering (some have (*, school_id)). Specifically idx_students_class_id only has class_id — not (school_id, class_id). PG can still use it but it walks rows it then has to filter. The migration above (idx_students_school_class_active) replaces it.

Per-tenant memory (Redis)
With maxmemory 512mb and allkeys-lru, a single chatty tenant can evict warm keys for everyone. For multi-tenant fairness on a small Hostinger VPS this is acceptable (you're not running 1000 tenants). At 100+ tenants, partition by routing tenants to different Redis logical DBs (redis://redis:6379/{db_index}) where each tenant gets a small slice.

STEP 9 — Docker + infra
The docker-compose.prod.yml is already well-tuned. Specific notes:

Backend memory: GOMEMLIMIT: 900MiB against limits: 1024M. Good — leaves OS headroom. With 2 replicas + worker that's ~2.5GB RAM committed before PG/Redis. On a Hostinger KVM2 (4GB) this is tight when Postgres gets 1.5GB. Recommendation: shrink replicas to 1 unless you actually need failover. Add it back only after you measure CPU saturation on a single replica.
Postgres max_connections=100 vs 25×replicas+worker. Already noted — lower replica MaxConns to 15.
Postgres work_mem=16MB × 100 conns = 1.6GB worst-case. Fine for the configured 3GB Postgres limit but risky if you raise concurrency. Document this tradeoff.
Redis maxmemory 512mb with allkeys-lru. Fine. Make sure the AOF rewrite frequency isn't writing to disk every request — appendfsync everysec is correct.
Redis --save 900 1 --save 300 10 --save 60 10000 — RDB snapshots in addition to AOF. Adds disk pressure for cache-only workloads. If the data is purely cache (recoverable), drop RDB and keep only AOF: --save "".
Healthchecks: backend uses wget against /health/live — good. Redis healthcheck uses redis-cli ping without auth — won't work since requirepass is set. Fix:
healthcheck:
  test: ["CMD-SHELL", "redis-cli -a ${REDIS_PASSWORD:-} ping | grep PONG"]
Nginx layer: not in this audit's file scope; assuming it does TLS + static caching for /assets/* with Cache-Control: public, max-age=31536000, immutable. If not, that's a 50% bandwidth save instantly.
Single-node deploy on a small VPS: drop the second backend replica until you actually need it. With 1 replica, Postgres pool can drop to 15, and you save ~1GB RAM.
STEP 10 — Final roadmap
Critical (do this week)
Auth middleware in-memory user index. O(N) on every request → O(1). Single hottest improvement on the system. ~30 lines.
Add Redis read-through to parent endpoints (5 endpoints, 60–300s TTL). Parent portal is the most-hit route per session and currently does 5+ full slice scans per page load.
Add Redis read-through to /api/exams, /api/results, /api/classes. Same pattern.
Wire materialized view refresh from the worker. Two REFRESH … CONCURRENTLY calls in a 5min ticker.
Add migration 000012_perf_phase2.up.sql with the index list above. ~10 indexes, <30s build time.
Fix Redis healthcheck to include the password.
High-impact quick wins (next two weeks)
Migrate useAcademicYears and SchoolShell's AY fetch to React Query. 30+ requests per session → 1.
Migrate useTimetable, useClasses, useStudents to React Query. Drops duplicate fetches across simultaneously-mounted components.
Composite dashboard tag-based invalidation. dash:ver:{school} counter — one INCR per write instead of N DELs.
Drop fallback memstore scans for handlers when PG is up. They're dead weight that holds the global RWMutex during sorts.
Tighten event filter — when for_class_id is set, the handler still walks all events. Use the GIN index added in step 5 or pre-filter in PG.
Medium
Drop the second backend replica for current Hostinger sizing. Halves memory + DB connection pressure. Add back when load tells you to.
Deduplicate Redis invalidation paths. students handler currently calls Del + DelPattern + composite invalidation. Consolidate.
Wire RLS or remove the migration. Either commit to it (AfterConnect SET app.current_school_id) or drop the dormant migration.
Long
Cursor pagination for audit_logs only — that table will outgrow offset.
Per-tenant Redis logical DBs at 100+ tenants.
Move WebSocket fanout to Redis pub/sub channels per tenant to avoid leak across tenants on the same hub instance. (hub.go may already do this — verify.)
Estimated impact
Change	Latency	DB load	API call count	Memory
Auth in-memory user index	p99 −30ms on every authed call	−60% on range Users	–	+negligible
Parent endpoint Redis cache	p95 −80% per parent page load	−90% on parent reads	–	+20MB Redis
Exams/Results/Classes cache	p95 −70% on those lists	−80% on those reads	–	+10MB Redis
MV refresh + composite microcache	p95 dashboard <5ms	−95% on dashboard reads	–	–
React Query on AY + global hooks	–	–	-30/session per admin	–
Indexes (migration 000012)	p95 student/exam/parent queries −50%	Same	–	+small disk
Cumulative: typical authenticated request goes from ~80ms p95 to ~15ms p95 on warm cache. DB QPS on a 50-tenant deployment drops by an order of magnitude. Frontend bundle delta stays roughly where it is (already trimmed last session). Hostinger KVM2 (4GB/4vCPU) becomes comfortable for ~5–10 small schools concurrently active; you can grow to ~30 active schools on the same box once the cache is wired.

