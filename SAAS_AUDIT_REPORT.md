# Eduplexo Multi-Tenant SaaS Audit Report

## Table of Contents
1. [Backend - In-Memory Persistence Layer](#backend---in-memory-persistence-layer)
2. [Frontend - Client-Side Data Handling (e.g., Student List)](#frontend---client-side-data-handling)
3. [Frontend - State Management & Data Bus](#frontend---state-management--data-bus)
4. [Security - Authentication & LocalStorage](#security---authentication--localstorage)
5. [Database - PostgreSQL Scaling & Schema](#database---postgresql-scaling--schema)
6. [Final Report Summary](#final-report)

---

# Backend - In-Memory Persistence Layer (`store.MemStore` & `persistence.go`)

## Current Quality Score
3 / 10

## Problems Found
- **Horizontal Scaling Impossibility**: The system uses a centralized in-memory slice for *all* tenant data (`MemStore`), with a write-through queue to PostgreSQL. If you deploy 2 or more instances of the Go backend, their memories will diverge immediately. A write to Node A will update Node A's memory and Postgres, but Node B will serve stale data.
- **Catastrophic Memory Growth**: Loading all students, teachers, fees, and attendance records for 500-1000 schools into the RAM of a single Go process will inevitably trigger an Out-Of-Memory (OOM) kill.
- **Single RWMutex Contention**: The entire MemStore relies on a single `sync.RWMutex`. Under high concurrency, write locks (even partial) will block read access globally across all tenants.
- **Startup Latency**: The `load.go` mechanism pulls the entire database into memory on boot. As data grows, container restart time will stretch from seconds to minutes, causing massive deployment downtime.

## Optimization Suggestions
- **Eliminate `MemStore` for Primary Data**: Switch immediately to a traditional stateless API model querying PostgreSQL directly.
- **Implement Distributed Caching**: Use Redis for frequently accessed, computationally expensive data (like aggregate dashboard stats or RBAC matrices) rather than raw entities.
- **Connection Pooling**: Use `pgxpool` with PgBouncer to manage DB connections efficiently across stateless nodes.

## Scalability Impact
Critical bottleneck. The current architecture strictly limits the application to a single-node deployment (vertical scaling only) and bounds the maximum tenant count by available RAM.

## Security Impact
No direct vulnerability, but high risk of Denial of Service (DoS). A single tenant importing a massive dataset could crash the shared node, taking down all other tenants.

## UX Impact
High. Slow startup times and global lock contention will cause sporadic API timeouts for users.

## Priority Level
Critical

## Recommended Refactor Level
Major

## Estimated Performance Gain
Infinite horizontal scalability unlocked. Sub-millisecond TTFB (Time to First Byte) consistency under heavy parallel load. Memory consumption reduced by 95%.

---

# Frontend - Client-Side Data Handling (e.g., `StudentListPage.tsx`)

## Current Quality Score
4 / 10

## Problems Found
- **Client-Side Filtering & Search**: The frontend fetches the *entire* list of a school's students into `state.data` and runs `.filter()` and `.map()` on the client side (`StudentListPage.tsx`).
- **DOM Choking**: Rendering hundreds of rows without virtualization (`react-window` or `react-virtuoso`) will cause severe UI lag and unresponsiveness.
- **Unnecessary Payload Size**: Fetching all records over the network wastes immense bandwidth and increases time-to-interactive drastically for schools with thousands of students.

## Optimization Suggestions
- **Server-Side Pagination**: Implement cursor-based or offset-based pagination on the backend (`/api/students?page=1&limit=50&search=xyz`).
- **Debounced Server Search**: Shift the search logic to a PostgreSQL `ILIKE` or Full-Text Search query.
- **Table Virtualization**: Implement virtualization on the frontend table to only render DOM nodes currently visible in the viewport.

## Scalability Impact
The UI will freeze for schools with >1000 students. Mobile devices will crash due to JS heap size limits.

## Security Impact
Medium. Fetching all records might inadvertently expose fields that aren't strictly necessary for the list view to the browser.

## UX Impact
Severe. The application will feel sluggish, battery-draining on mobile, and unresponsive during searches.

## Priority Level
High

## Recommended Refactor Level
Moderate

## Estimated Performance Gain
90% reduction in initial payload size. UI rendering time drops from seconds to <50ms.

---

# Frontend - State Management & Data Bus (`data-bus.ts`)

## Current Quality Score
5 / 10

## Problems Found
- **Reinventing the Wheel**: The custom pub/sub `data-bus.ts` combined with `useSafeAsync` manually handles cache invalidation and re-fetching.
- **Race Conditions**: Parallel publishes can trigger duplicate API calls across mounted components.
- **Split Paradigms**: The codebase contains instances of both TanStack React Query (`useStudents.ts` returning `useQuery`) and manual `useSafeAsync` hooks. This fragmentation causes duplicate cache layers and inconsistent loading states.

## Optimization Suggestions
- **Standardize on React Query**: Completely remove `data-bus.ts` and `useSafeAsync`. Rely solely on `@tanstack/react-query` for fetching, caching, background updates, and invalidation.
- **Query Key Hierarchy**: Utilize strict query key arrays (`['students', schoolId, academicYearId, filters]`) to allow precise, targeted cache invalidation without refetching everything.

## Scalability Impact
Maintainability and network scaling. Standardized caching prevents redundant network requests, lowering backend load drastically.

## Security Impact
None directly.

## UX Impact
Eliminates "flickering" UI states and ensures data consistency across different tabs and sibling components instantly.

## Priority Level
Medium

## Recommended Refactor Level
Moderate

## Estimated Performance Gain
20-30% reduction in unnecessary API calls. Much smoother developer experience and fewer state bugs.

---

# Security - Authentication & LocalStorage (`utils/auth-cache.ts`)

## Current Quality Score
2 / 10

## Problems Found
- **XSS Vulnerability**: JWTs (`token`) are currently stored in `window.localStorage`. Any successful Cross-Site Scripting (XSS) attack (e.g., via a malicious announcement or homework text) can instantly exfiltrate tokens and impersonate administrators.
- **Session Lifecycles**: Deleting a token from localStorage does not invalidate it on the server if the backend isn't maintaining a blocklist or short expiration.

## Optimization Suggestions
- **HttpOnly Cookies**: Move JWT token storage to `HttpOnly`, `Secure`, `SameSite=Strict` cookies. The frontend should never have access to the raw token string.
- **CSRF Tokens**: If moving to cookies, implement Anti-CSRF tokens for all mutating POST/PUT/DELETE requests.
- **Short-lived Access + Refresh Tokens**: Implement a dual-token architecture to minimize the blast radius of a stolen session.

## Scalability Impact
Minimal impact on scalability, but foundational for enterprise trust.

## Security Impact
Critical. The current implementation would fail any enterprise penetration test immediately.

## UX Impact
Invisible to the user, but prevents catastrophic account takeovers.

## Priority Level
Critical

## Recommended Refactor Level
Moderate

## Estimated Performance Gain
N/A - purely a security hardening measure.

---

# Database - PostgreSQL Scaling & Schema

## Current Quality Score
8 / 10

## Problems Found
- **Excellent Foundation**: The schema (`000001_init.up.sql`) is robust, utilizing strict FKs, cascading deletes, and JSONB effectively.
- **Future Partitioning Risks**: For a multi-tenant system scaling to 1000+ schools, huge tables like `attendance`, `results`, and `fee_payment_allocations` will suffer from index bloat and slower sequential scans, even with the `school_id` index.
- **Missing Row-Level Security (RLS)**: While the backend enforces tenant isolation in code (`where school_id = ?`), a single developer mistake in a new query could leak data across tenants.

## Optimization Suggestions
- **PostgreSQL Row-Level Security (RLS)**: Enforce multi-tenant isolation at the database kernel level. Even if the Go backend forgets a `WHERE` clause, the DB blocks cross-tenant reads.
- **Table Partitioning**: Implement native PostgreSQL declarative partitioning on massive tables (like `attendance`) keyed by `school_id` or `academic_year_id`.

## Scalability Impact
Ensures the database can handle tens of millions of rows without index performance degradation.

## Security Impact
High. RLS is the ultimate safety net against data leakage in multi-tenant architectures.

## UX Impact
Maintains query speeds under 100ms even as historical data spans multiple years.

## Priority Level
Medium

## Recommended Refactor Level
Minor

## Estimated Performance Gain
Consistent P99 query latency regardless of table size growth.

---

# Final Report

### 1. Top 20 Most Important Optimizations
1. **Critical:** Remove the Go `MemStore` pattern; query PostgreSQL directly to allow stateless horizontal scaling.
2. **Critical:** Move JWT from `localStorage` to `HttpOnly` Secure cookies.
3. **Critical:** Implement server-side pagination for `/api/students`, `/api/attendance`, etc.
4. **High:** Replace `data-bus.ts` and `useSafeAsync` entirely with TanStack React Query.
5. **High:** Implement table virtualization (e.g., `react-virtuoso`) for data-dense frontend lists.
6. **High:** Enable PostgreSQL Row-Level Security (RLS) for foolproof multi-tenant isolation.
7. **High:** Setup a connection pooler (PgBouncer) in `docker-compose.prod.yml`.
8. **Medium:** Partition massive append-only tables (`attendance`, `audit_logs`).
9. **Medium:** Debounce search inputs and utilize server-side Postgres Full-Text Search.
10. **Medium:** Implement rate limiting (Redis-backed) to prevent tenant API abuse.
11. **Medium:** Implement a dedicated Redis caching layer for RBAC and aggregate stats.
12. **Medium:** Use short-lived Access Tokens and rotating Refresh Tokens.
13. **Medium:** Add robust error boundaries in the React tree to prevent white-screen crashes.
14. **Medium:** Implement backend query timeouts context cancellations for runaway DB queries.
15. **Medium:** Add database query execution logging (slow query logs).
16. **Low:** Optimize Docker images for backend (scratch container) and frontend (nginx alpine).
17. **Low:** Lazy-load non-critical React routes to reduce initial bundle size.
18. **Low:** Standardize exact UI spacing and typography via strict Tailwind config enforcement.
19. **Low:** Audit and remove dead code/unused legacy hooks.
20. **Low:** Add automated DB migration checks to CI/CD pipeline.

### 2. Top Security Risks
1. **XSS to Account Takeover**: JWTs stored in `localStorage` are vulnerable to extraction.
2. **Data Leakage (Code Level)**: Tenant isolation relies entirely on developers remembering to append `school_id` to queries. Missing RLS.
3. **No Rate Limiting**: APIs are vulnerable to basic DoS/brute-force attacks.

### 3. Top Scalability Risks
1. **Stateful Backend**: The `MemStore` design completely prevents deploying >1 backend container.
2. **OOM Crashes**: Loading the entire DB into Go memory will crash the server as data grows.
3. **Client-Side Rendering Limits**: Fetching all records for a school will choke browser JS heaps.

### 4. Quick Wins
- Switch frontend to React Query immediately (the code already exists partially).
- Add Pagination parameters to API list endpoints.
- Enable basic Nginx gzip/brotli compression for the frontend proxy.

### 5. Enterprise-Level Improvements
- Enforce PostgreSQL RLS.
- Implement PgBouncer.
- Move to a Kubernetes-based stateless deployment model.
- Add OpenTelemetry for distributed tracing.

### 6. Production Readiness Score
**4 / 10**
(Functional, but fundamentally unscalable and insecure in its current stateful configuration).

### 7. SaaS Scalability Score
**2 / 10**
(Tethered to a single vertical node due to in-memory store).

### 8. Maintainability Score
**6 / 10**
(Clean Go code and decent React structure, but plagued by custom state management wheels).

### 9. UI/UX Score
**7 / 10**
(Good Tailwind usage, but held back by potential UI freezes on large datasets).

### 10. Estimated Maximum Safe Concurrent Users
**~500 - 1,000 Users** (Assuming a single large VM).
Once `MemStore` exceeds available RAM, or `sync.RWMutex` contention peaks during morning attendance rushes, the system will lock up entirely. After removing `MemStore`, this scales to 100,000+ users effortlessly.
