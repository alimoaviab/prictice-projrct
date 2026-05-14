# Eduplexo Performance — Remaining Tasks (Status: Pending)

The following high-impact structural optimizations are planned for the next implementation phases.

### 🔴 High Priority (Immediate — Phase 2)
- [ ] **Full MemStore → PostgreSQL Migration:** 
    - Transition all remaining domain handlers (Students, Teachers, Classes, etc.) to read directly from PostgreSQL instead of `MemStore`.
    - This is the single most important task for scaling beyond 50 schools.
- [ ] **Dashboard Redis Caching:** 
    - Implement caching for the `/api/dashboard/composite` and other analytics endpoints.
    - Set a 5-minute TTL to ensure the dashboard feels instantaneous.
- [ ] **Rate Limiting Middleware:** 
    - Add a Redis-backed rate limiter to prevent API abuse and stabilize CPU usage under heavy load.

### 🟡 Medium Priority (Near-term — Phase 3)
- [ ] **WebSocket Real-time Updates:**
    - Migrate notification polling and dashboard updates to the WebSocket hub.
    - Eliminates thousands of unnecessary HTTP requests per hour.
- [ ] **Frontend Virtual Scrolling:**
    - Implement `react-virtual` for student lists and fee ledgers.
    - Ensures smooth 60fps scrolling even with 1000+ records.
- [ ] **TanStack Query Refinement:**
    - Globally set `staleTime` and `gcTime` to prevent redundant background refetches.

### 🟢 Long-term (Scale-up — Phase 4)
- [ ] **PgBouncer Integration:** 
    - Add PgBouncer as a separate service for connection pooling at the database level.
- [ ] **Prometheus/Grafana Dashboards:**
    - Create visual dashboards to monitor API latency, memory spikes, and cache hit rates.
- [ ] **Table Partitioning:**
    - Partition `attendance` and `audit_logs` tables by month/year to keep query times constant as the database grows to millions of rows.
- [ ] **CDN Integration:** 
    - Offload all static assets (JS, CSS, images) to a CDN like Cloudflare or Akamai.
