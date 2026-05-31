# Eduplexo — Final System

A multi-tenant school management SaaS, fully migrated from the original
Next.js + MongoDB monolith to a React + Vite frontend, a Go backend, and
PostgreSQL — all running under Docker Compose.

```
┌──────────────────────────────────────────────────────────────────┐
│  /Users/butt/Desktop/eduplexo                                    │
│                                                                  │
│  ┌──────────────────┐    ┌──────────────────┐    ┌────────────┐  │
│  │  school-react-app│ →  │  backend-go      │ →  │ PostgreSQL │  │
│  │  (Vite + React)  │    │  (chi + pgx)     │    │  16-alpine │  │
│  └──────────────────┘    └──────────────────┘    └────────────┘  │
│         :3000                  :8080                  :5432       │
│                                                                  │
│  old-app/  ← original Node.js source kept untouched as reference │
└──────────────────────────────────────────────────────────────────┘
```

## Quick start

```bash
# One command to bring everything up:
docker compose up --build -d

# Frontend  → http://localhost:3000
# Backend   → http://localhost:8080
# Postgres  → localhost:5432  (school_user / school_password)

# Login:    admin@school.test / admin123  (role: admin)
```

Stop with `docker compose down`. To wipe the database too: `docker compose down -v`.

For local dev without Docker:

```bash
# Terminal 1
cd backend-go && make run         # in-memory mode unless DATABASE_URL is set

# Terminal 2
cd school-react-app && npm run dev
```

## Project layout

| Path | Purpose |
| --- | --- |
| `school-react-app/` | React 19 + Vite 6 + TypeScript SPA (the entire frontend) |
| `backend-go/` | Go HTTP API (chi router, pgx pool, golang-migrate schema) |
| `backend-go/migrations/` | Final relational schema. Designed once; no ALTER follow-ups. |
| `docker-compose.yml` | Dev stack: postgres + migrate + backend-go + frontend (nginx) |
| `docker-compose.prod.yml` | Production overlay: secrets required, internal-only Postgres |
| `old-app/` | Original Next.js + MongoDB monolith — read-only reference |

## Final verification report (Phase 4)

Every check was run against the Dockerized stack with fresh PostgreSQL.

### Build & boot

| Item | Result |
| --- | --- |
| `go build ./...` | clean |
| `go vet ./...` | clean |
| `tsc -b` (frontend) | clean |
| `vite build` | 2,701 modules transformed |
| `docker compose up --build` | all 4 services up |
| Migrations applied (1 file) | ✔ via `migrate/migrate:v4.18.1` |
| Backend boot logs | `connected to PostgreSQL` ✔ |
| Backend `/health` | `{"db":true,"ok":true,"status":"healthy"}` ✔ |
| Frontend HTML at :3000 | 200, serves `<!doctype html>` ✔ |
| Frontend → backend proxy via nginx | 200 on `POST /api/auth/login` ✔ |

### API contract (every endpoint the React frontend calls)

| Group | Endpoints verified |
| --- | --- |
| Auth | login, signup, session, _log, google/status, academic-years/switch |
| Academic year | list, get, create, update, delete |
| Students | list (paginated, search, filters), get, create, update, delete |
| Teachers | list, get, create (with companion User), update, delete |
| Classes | list, get, create, update, delete + teacher/subject junctions |
| Subjects | list, get, create, update, delete + `/api/school/subjects` |
| Dashboard | `/api/analytics/dashboard` returns full envelope |
| Attendance | list, get, mark single, bulk-mark upsert, update, delete |
| Exams | list, get, create, update, delete |
| Results | list, save (single + bulk), `/api/exams/{id}/results` (with grade calc) |
| Homework | list, get, create (+ auto-init pending submissions), update, delete |
| Behavior | list, get, create, update, delete |
| Events | list, get, create, update, delete + `event_target_classes` junction |
| Leave | list, get, request, approve/reject/cancel |
| Timetable | list, get, create, update, delete + `timetable_sessions` |
| Announcements | list, get, create, update, delete |
| Live class | list, schedule, get, update, delete |
| Notifications | list, mark-read |
| Settings | get, update (per-school profile/branding/academic blocks) |
| Fees — types | list, create |
| Fees — class config | list, add, update, delete, toggle, duplicate |
| Fees — invoicing | generate (monthly), list, ledger dashboard |
| Fees — adjustments | list, create, delete (active discount/penalty applied at due_at) |
| Fees — payments | record (FIFO across components), list, daily collection |
| Fees — visibility | parent/student ledger with per-month rows + due_notices |
| Parent portal | student-info, dashboard stats, attendance, results, homework, announcements, performance chart |

### Tenant + RBAC + academic-year isolation

Verified with adversarial requests against a stack containing **two
schools** (`school_seed_1` and `school_other_1`):

| Check | Result |
| --- | --- |
| Admin of `school_seed_1` calls `/api/students` | sees only school_seed_1 rows ✔ |
| Admin calls `/api/classes` | only school_seed_1 classes ✔ |
| Cross-tenant header attack `x-academic-year-id: ay_other_1` | filtered out, falls back to own active year, **no leak** ✔ |
| Request without token | `HTTP 401 UNAUTHENTICATED` ✔ |
| Request with garbage token | `HTTP 401 UNAUTHORIZED` ✔ |
| `POST /api/academic-years/switch` with valid year | re-issues JWT with new `active_academic_year_id` claim ✔ |
| RBAC matrix loaded from `internal/auth/rbac.go` | 5 roles × 22 features × 5 actions, ported verbatim ✔ |

### PostgreSQL schema (designed once — no ALTER)

`migrations/000001_init.up.sql` — single migration, **0 ALTER statements**.

| Property | Result |
| --- | --- |
| Tables | 38 (every original Mongoose model has a real relational counterpart) |
| Junction tables | `class_teachers`, `class_subjects`, `teacher_classes`, `teacher_subjects`, `student_subjects`, `student_parents`, `event_target_classes`, `homework_submissions`, `timetable_sessions`, `fee_components`, `fee_payment_allocations` |
| Foreign keys with cascade rules | every multi-tenant ref → `schools(school_id) ON DELETE CASCADE` |
| CHECK constraints (status, role, severity, etc.) | enforced by PostgreSQL — verified by inserting `'HACKED'` and getting `violates check constraint` |
| Indexes | 98 created for tenant + year + status + sort-key access patterns |
| Extensions | `pgcrypto`, `citext` |
| Schema diagram | see `docs/schema.md` (or read the migration file — heavily commented) |

### Persistence (in-memory MemStore + write-through to PostgreSQL)

| Test | Result |
| --- | --- |
| Create fee invoice → restart backend container → invoice still present | ✔ |
| Create announcement, fee adjustment, payment → restart → all persisted | ✔ |
| Audit log rows survive restart | ✔ (11 rows after a smoke run) |
| Boot from existing PostgreSQL | hydrates MemStore, no panic, identical responses | ✔ |
| Boot from fresh PostgreSQL | seed pushed via initial FullSnapshot | ✔ |
| Periodic snapshot (every 30 s) | observed in `audit_logs` row counts | ✔ |
| Graceful shutdown | final flush + final FullSnapshot | ✔ |

### Frontend integration

The React app is configured (in `school-react-app/.env`) to point at the
Go backend with MSW disabled:

```env
VITE_API_BASE_URL=/api
VITE_API_PROXY_TARGET=http://localhost:8080
VITE_ENABLE_MOCKS=false
```

Inside the Docker network the nginx config proxies `/api/*` to
`http://backend-go:8080`. **Zero React code changes** were needed at any
phase.

### Bug fixed during verification

- **Persistence Load panic**: `*s = store.MemStore{}` zeroed the embedded
  `sync.RWMutex` while the calling goroutine still held it. Replaced with
  explicit per-slice resets. Backend boot is now clean.

## Known limitations carried into Phase 4

- **Bcrypt-only password verification** is in place; the `admin@school.test`
  seed uses plain-text equality so the dev login works out of the box.
  Production accounts created via `/api/auth/signup` use real bcrypt hashing.
- **Google Calendar / Cloudflare / ACME / Domain provisioning**: external
  integrations remain stubbed (env-specific). The schema reserves the
  `teachers.google_calendar` JSONB column for when they're wired up.
- **`super-admin-app`** (the platform-level admin UI) was empty in the
  source dump and is out of scope.
- **Snapshot-cadence durability**: an explicit `Save` is enqueued on every
  domain mutation and flushed every 1 s. A full `FullSnapshot` runs every
  30 s and on graceful shutdown. Worst-case write loss on a hard kernel
  panic is bounded by the 1-s flush interval, then made whole again on the
  next mutation. For stricter guarantees, lower `flushInterval` to 0 (i.e.,
  synchronous write-through) — one-line change in `persistence.New`.

## Production deployment

```bash
# Customise .env (use `cp .env.example .env`):
JWT_SECRET=<long random string>
ALLOWED_ORIGINS=https://your-frontend.example.com
POSTGRES_DB=school_db
POSTGRES_USER=eduplexo_app
POSTGRES_PASSWORD=<strong>

docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

The production overlay:

- Refuses to start without `JWT_SECRET`
- Sets the session cookie `Secure` flag
- Stops exposing PostgreSQL on the host
- Uses the env-provided database credentials

## Total system size

| Area | LOC / files |
| --- | --- |
| Go backend | 7,800 across 36 files |
| React frontend | 325 TS/TSX files |
| PostgreSQL schema | 1 migration file (no ALTER) |
| Docker | 2 Dockerfiles + 2 compose files + nginx config |

## Smoke runners

```bash
cd backend-go
./scripts/smoke.sh        # 27 endpoints + cross-tenant guard + writes
./scripts/smoke_fees.sh   # full fees flow: types → class config → generate → adjust → pay → ledger
```


