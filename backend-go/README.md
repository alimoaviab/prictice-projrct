# Eduplexo — Go backend (Phase 2)

Replaces the Next.js API routes from `../old-app/school-app/app/api` with a
real Go service. Same API contracts, same JWT shape, same response envelope
— the React frontend at `../school-react-app` connects with zero code
changes (only the `.env` flips MSW off and the proxy on).

## Status

| Domain | Status |
| --- | --- |
| Auth: login, signup, session, log, google/status | ✅ end-to-end |
| Academic Year: list/get/create/update/delete + switch | ✅ end-to-end |
| Students: list/get/create/update/delete (paginated, search, filters) | ✅ end-to-end |
| Teachers: list/get/create/update/delete | ✅ end-to-end |
| Classes: list/get/create/update/delete | ✅ end-to-end |
| Subjects: list/get/create/update/delete | ✅ end-to-end |
| Dashboard analytics (`/api/analytics/dashboard`) | ✅ shape complete |
| Attendance: list/get/create/update/delete + bulk-mark upsert | ✅ Phase 2.1 |
| Exams: list/get/create/update/delete | ✅ Phase 2.1 |
| Results: list/get + upsert-by-(exam,student) save (single + bulk) + grade calc | ✅ Phase 2.1 |
| Homework: list/get/create/update/delete + auto-init pending submissions | ✅ Phase 2.1 |
| Behavior: list/get/create/update/delete | ✅ Phase 2.1 |
| Events: list/get/create/update/delete | ✅ Phase 2.1 |
| Leave: list/get/create + approve/reject/cancel | ✅ Phase 2.1 |
| Timetable: list/get/create/update/delete | ✅ Phase 2.1 |
| Announcements: list/get/create/update/delete | ✅ Phase 2.1 |
| Live class: list/get/schedule/update/delete | ✅ Phase 2.1 |
| Notifications: list + mark-read | ✅ Phase 2.1 |
| Settings: get/update (per-school profile/branding/academic) | ✅ Phase 2.1 |
| Parent portal: student-info, children, dashboard stats, attendance, results, homework, announcements, performance-chart | ✅ Phase 2.1 (rich) |
| Tenant isolation (school_id from JWT) | ✅ enforced everywhere |
| Academic-year isolation (`x-academic-year-id` + JWT claim) | ✅ enforced |
| RBAC matrix (5 roles × 22 features × 5 actions) | ✅ ported verbatim |
| Audit log writer | ✅ for all mutations across every domain |
| Fees | ⏭️ stubbed (canonical empty shape, frontend renders) |
| Google Calendar / Cloudflare / ACME / domain provisioning | ⏭️ stubbed (env-specific, deferred) |

The Go backend is **7,678 LOC** across **34 files**.

## Architecture

```
backend-go/
  cmd/server/main.go            # process entrypoint
  internal/
    api/                        # ServiceResult envelope, ParsePagination, RequestContext
    auth/                       # JWT signer/verifier, password hashing, RBAC matrix
    audit/                      # audit-log writer (mirrors audit.service.ts)
    config/                     # env loader
    middleware/                 # CORS, auth, recover, logging
    server/                     # chi router (mirrors app/api/* tree)
    store/                      # in-memory data store (Phase 3 → PostgreSQL)
    stubs/                      # canonical "feature pending" handlers
    domain/
      auth/                     # /api/auth/{login,signup,session,_log,google/status}
      academicyear/             # /api/academic-years/*
      students/                 # /api/students/*
      teachers/                 # /api/teachers/*
      classes/                  # /api/classes/*
      subjects/                 # /api/subjects/* + /api/school/subjects/*
      dashboard/                # /api/analytics/dashboard
      tenant/                   # ResolveAcademicYearID helper
      parent/                   # /api/parent/* (faithful empty shapes)
```

## Quick start

```bash
# Terminal 1 — Go backend
cd backend-go
make run                       # http://localhost:8080

# Terminal 2 — React frontend (proxies /api → :8080)
cd school-react-app
npm run dev                    # http://localhost:3000
```

The React `.env` is set up for Phase 2:

```env
VITE_API_PROXY_TARGET=http://localhost:8080
VITE_ENABLE_MOCKS=false
```

Sign in with the seeded credentials:

| Email | Password | Role |
| --- | --- | --- |
| `admin@school.test` | `admin123` | admin |

## Smoke check (with the server running)

```bash
make smoke                     # quick health + login probe
./scripts/smoke.sh             # full Phase 2.1 round-trip suite
```

Equivalent to:

```bash
curl http://localhost:8080/health
curl -X POST http://localhost:8080/api/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"admin@school.test","password":"admin123","role":"admin"}'
```

## What was preserved (audited against the Node original)

### JWT contract — `internal/auth/jwt.go`

Same claim names as `old-app/shared/auth/jwt.ts`:

```jsonc
{
  "sub":                     "user_admin_seed",
  "school_id":               "school_seed_1",
  "role":                    "admin",
  "permissions":             ["*"],
  "active_academic_year_id": "ay_2025_26",
  "session_id":              "sess_…",
  "app":                     "school",
  "actor_email":             "admin@school.test",
  "iat":                     1778706209,
  "exp":                     1778735009            // 8h after iat
}
```

The frontend's `useAuth` (`school-react-app/src/hooks/useAuth.ts`) reads
exactly these fields. Tokens issued by the Node backend continue to
validate as long as `JWT_SECRET` matches.

### Response envelope — `internal/api/result.go`

Same `ServiceResult<T>` JSON shape as
`old-app/shared/utils/result.ts`:

```jsonc
// Success
{ "ok": true, "success": true, "data": { … } }

// Error
{
  "ok": false,
  "success": false,
  "message": "…",
  "errorCode": "VALIDATION_ERROR",
  "error": { "code": "VALIDATION_ERROR", "message": "…", "status": 400 }
}
```

The frontend's `serviceRequest` keys off `ok` and `error` exactly as before.

### Tenant + academic-year isolation — `internal/store/tenant.go` and `internal/domain/tenant/tenant.go`

`AssertTenantContext`, `CheckSchoolMatch`, and `CheckAcademicYearMatch`
return `TENANT_REQUIRED` (400), `TENANT_MISMATCH` (403), and
`ACADEMIC_YEAR_MISMATCH` (403) — same codes the Node `tenantFilter` /
`academicYearFilter` produce. `ResolveAcademicYearID` mirrors
`_academic-year-filter.ts`'s resolution order: explicit ID → JWT claim →
school's currently-active year.

### RBAC — `internal/auth/rbac.go`

Ported verbatim from `old-app/shared/auth/rbac.ts`. Same role × feature ×
action map; `manage` is a superset; explicit JWT permissions
(`feature:action`) override the role default; `*` grants everything.

### Audit log — `internal/audit/audit.go`

Every create/update/delete in the domain handlers writes an audit row, the
same way `writeAuditLog` is called in the original services. The dashboard's
`activities` array is populated from these rows.

### Cookies + login flow — `internal/domain/auth/auth.go`

Same `session` cookie (`HttpOnly`, `SameSite=Lax`, `Path=/`, `MaxAge=8h`),
same status code progression (401 invalid creds → 403 school suspended →
200 ok → 201 signup), same field names in the response body
(`role`, `token`, `user_id`, `email`, `school_id`, `active_academic_year_id`).

## Phase 2 → Phase 3

The `internal/store` package is intentionally a stand-in. Phase 3 will:

1. Replace `MemStore` slices with PostgreSQL queries (one repository per
   domain). Service layer signatures don't change.
2. Add a real migrations folder (`migrations/000001_init.up.sql`).
3. Wire bcrypt-only password hashing (the in-memory store still allows
   plain-text for the `admin@school.test` dev seed).
4. Move secrets to a real KMS / env handler.

## Smoke test results (recorded during build)

```
GET  /health                                      200
POST /api/auth/login (seed admin)                 200
GET  /api/academic-years                          200
GET  /api/classes                                 200
GET  /api/teachers                                200
GET  /api/subjects                                200
GET  /api/analytics/dashboard                     200
GET  /api/attendance | exams | results | …        200 (empty list)
GET  /api/parent/student-info                     200
POST /api/students (create)                       200 → admission STU-00003
POST /api/academic-years/switch                   200 (re-issued JWT)
GET  /api/students (no auth)                      401 UNAUTHENTICATED
POST /api/auth/login (wrong password)             401 Invalid email or password
End-to-end via Vite proxy (frontend :3000)        ✅ ok
```
