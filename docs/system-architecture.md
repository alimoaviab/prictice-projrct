# Multi-School SaaS Platform Architecture

This repository is structured for a web-only, multi-school SaaS platform with two applications:

- `school-app`: school-facing Admin, Teacher, and Student experience.
- `super-admin-app`: platform-facing control plane for school lifecycle, usage, blocking, and audit inspection.
- `shared`: tenant-aware Mongoose models, services, auth, validation, engines, and design tokens used by both apps.

The non-negotiable laws are encoded in the folder boundaries and service contracts:

- Every tenant-owned document contains `school_id`.
- Every tenant-owned query injects `{ school_id: ctx.school_id }`.
- UI never talks directly to MongoDB.
- Services validate, authorize, execute, audit, and return controlled results.
- Every UI module renders loading, empty, error, and success states.

## 1. Full System Architecture

### Application Boundaries

`school-app` owns school workflows:

- Admin operations: students, teachers, classes, attendance, exams, fees, reports.
- Teacher operations: class start, attendance, homework, tests, insight review.
- Student operations: daily summary, attendance, homework, exams, fees, weak subjects.

`super-admin-app` owns platform workflows:

- Create, suspend, block, and configure schools.
- Monitor usage and health.
- Review cross-tenant audit logs through platform-only services.
- Never enters a school tenant context without an explicit audited platform action.

`shared` owns platform primitives:

- Mongoose models.
- Tenant query helpers.
- Auth and RBAC.
- Zod validators.
- Audit, notification, analytics, rule, and sync engines.
- Design tokens mapped from `design.md`.

### Multi-App Communication Strategy

The apps do not call each other directly from UI. Communication happens through controlled service boundaries:

1. Browser requests a page, action, or API route.
2. App middleware authenticates the session and builds `RequestContext`.
3. Route/server action calls a module service.
4. Module service calls shared service or engine.
5. Shared service calls MongoDB through Mongoose using tenant-scoped filters.
6. Shared service writes `audit_logs` for every mutation.
7. Controlled response returns to UI.

Cross-app coordination is data and event based:

- `notifications` carry user-facing events.
- `audit_logs` carry compliance history.
- `sync_jobs` carry retryable offline-safe work.
- Super Admin views operational state through platform services, not through school UI routes.

### Shared Database Design

One MongoDB cluster can host all schools safely when every access path follows tenant scoping:

- `school_id` is required and immutable in every collection.
- Tenant uniqueness uses compound indexes, such as `{ school_id: 1, admission_no: 1 }`.
- Read models and dashboards use aggregation pipelines with `$match: { school_id }` as stage one.
- Platform-wide reads are only allowed from Super Admin services after `role === "super_admin"` and `school_id === "platform"`.

The `schools` collection also has `school_id`; it is the canonical tenant key. Platform-only records use `school_id: "platform"`.

### Auth Flow Between Apps

School app login:

1. User submits credentials.
2. Auth service verifies user by `{ school_id, email, status: "active" }`.
3. Service issues JWT/session cookie with `sub`, `school_id`, `role`, `permissions`, `session_id`, and `app: "school"`.
4. Middleware rejects missing, expired, blocked, or cross-app sessions.
5. Role guards authorize the requested feature.

Super Admin login:

1. Platform user authenticates with `school_id: "platform"`.
2. JWT includes `role: "super_admin"` and `app: "super_admin"`.
3. Platform services can query multiple schools only after platform guard passes.
4. Any tenant impersonation or tenant-level mutation creates an audit log.

### Tenant-Aware Request Lifecycle

Every request follows the same lifecycle:

1. `authenticate`: decode JWT/session.
2. `hydrate`: load current user with `{ school_id, _id }`.
3. `tenantGuard`: reject if school is blocked/suspended.
4. `rbacGuard`: check feature/action access.
5. `validate`: parse input with Zod.
6. `execute`: call service with `RequestContext`.
7. `query`: always inject `school_id`.
8. `audit`: write mutation event.
9. `respond`: return `ServiceResult<T>`, never raw thrown errors.
10. `render`: UI chooses loading, empty, error, or success state.

## 2. Folder Structure

### Root

```txt
.
├── design.md
├── docs/
│   └── system-architecture.md
├── shared/
│   ├── auth/
│   ├── db/
│   ├── design-system/
│   ├── engines/
│   ├── models/
│   ├── services/
│   ├── types/
│   ├── utils/
│   └── validation/
├── school-app/
│   ├── app/
│   ├── modules/
│   ├── components/
│   ├── layouts/
│   ├── services/
│   ├── models/
│   ├── db/
│   ├── hooks/
│   ├── store/
│   ├── utils/
│   ├── types/
│   └── config/
├── super-admin-app/
│   ├── app/
│   ├── modules/
│   ├── components/
│   ├── layouts/
│   ├── services/
│   ├── models/
│   ├── db/
│   ├── hooks/
│   ├── store/
│   ├── utils/
│   ├── types/
│   └── config/
├── docker-compose.yml
├── package.json
├── turbo.json
└── tsconfig.base.json
```

### School App Module Contract

```txt
school-app/modules/students/
├── components/
│   ├── StudentForm.tsx
│   └── StudentTable.tsx
├── pages/
│   └── StudentsPage.tsx
├── services/
│   └── student.service.ts
├── hooks/
│   └── useStudents.ts
├── validators/
│   └── student.validator.ts
├── types/
│   └── student.types.ts
└── constants/
    └── student.constants.ts
```

Each module owns its UI, page composition, service adapter, hooks, validators, types, and constants. Shared cross-module behavior lives in `shared`.

### Super Admin Module Contract

```txt
super-admin-app/modules/schools/
├── components/
├── pages/
├── services/
├── hooks/
├── validators/
├── types/
└── constants/
```

Super Admin modules are platform-scoped. They must not import school app modules.

## 3. MongoDB Schemas + Indexing

All schemas are implemented in `shared/models`.

### `schools`

Purpose: tenant registry and lifecycle.

Key fields:

- `school_id`: canonical tenant id, unique.
- `name`, `code`, `domains`.
- `status`: `active`, `suspended`, `blocked`.
- `plan`, `usage`, `settings`.
- `created_by`, `updated_by`.

Indexes:

- `{ school_id: 1 } unique`
- `{ code: 1 } unique`
- `{ status: 1, "plan.key": 1 }`

Query patterns:

- School app bootstrap: `{ school_id, status: "active" }`
- Super Admin school list: `{ status }`, platform guard required.

### `users`

Purpose: all auth identities for school users and platform users.

Key fields:

- `school_id`
- `email`
- `password_hash`
- `role`: `super_admin`, `admin`, `teacher`, `student`
- `permissions`
- `profile`
- `status`
- `last_login_at`

Indexes:

- `{ school_id: 1, email: 1 } unique`
- `{ school_id: 1, role: 1, status: 1 }`

Query patterns:

- Login: `{ school_id, email, status: "active" }`
- User lookup: `{ school_id, _id }`

### `students`

Purpose: student academic identity.

Key fields:

- `school_id`
- `user_id`
- `admission_no`
- `first_name`, `last_name`
- `class_id`, `section`
- `guardian`
- `status`
- `enrolled_at`

Indexes:

- `{ school_id: 1, admission_no: 1 } unique`
- `{ school_id: 1, class_id: 1, section: 1, status: 1 }`
- `{ school_id: 1, user_id: 1 } sparse`

Query patterns:

- Student list: `{ school_id, status, class_id }`
- Student detail: `{ school_id, _id }`

### `teachers`

Purpose: teacher employment and subject assignment.

Indexes:

- `{ school_id: 1, employee_no: 1 } unique`
- `{ school_id: 1, user_id: 1 } sparse`
- `{ school_id: 1, subjects: 1, status: 1 }`

### `classes`

Purpose: class/section scheduling and ownership.

Indexes:

- `{ school_id: 1, grade: 1, section: 1, academic_year: 1 } unique`
- `{ school_id: 1, teacher_ids: 1 }`

### `attendance`

Purpose: daily attendance state.

Indexes:

- `{ school_id: 1, student_id: 1, date: 1 } unique`
- `{ school_id: 1, class_id: 1, date: 1 }`
- `{ school_id: 1, status: 1, date: -1 }`

Query patterns:

- Class attendance: `{ school_id, class_id, date }`
- Student trend: `{ school_id, student_id, date: { $gte, $lte } }`

### `homework`

Purpose: assignments and submissions.

Indexes:

- `{ school_id: 1, class_id: 1, due_at: 1 }`
- `{ school_id: 1, teacher_id: 1, created_at: -1 }`
- `{ school_id: 1, "submissions.student_id": 1 }`

### `exams`

Purpose: exams, marks, and performance trends.

Indexes:

- `{ school_id: 1, class_id: 1, starts_at: 1 }`
- `{ school_id: 1, subject: 1, starts_at: -1 }`
- `{ school_id: 1, "marks.student_id": 1 }`

### `fees`

Purpose: invoices, payments, fee due reminders.

Indexes:

- `{ school_id: 1, student_id: 1, due_at: 1 }`
- `{ school_id: 1, status: 1, due_at: 1 }`
- `{ school_id: 1, invoice_no: 1 } unique`

### `notifications`

Purpose: trigger-based user notifications.

Indexes:

- `{ school_id: 1, recipient_user_id: 1, read_at: 1, created_at: -1 }`
- `{ school_id: 1, trigger: 1, created_at: -1 }`

### `audit_logs`

Purpose: immutable compliance history.

Tracks:

- who did it: `actor_user_id`, `actor_role`, `actor_email`
- what happened: `action`, `entity_type`, `entity_id`
- when: `created_at`
- where: `school_id`, `ip`, `user_agent`
- how it changed: `before`, `after`, `metadata`

Indexes:

- `{ school_id: 1, created_at: -1 }`
- `{ school_id: 1, entity_type: 1, entity_id: 1, created_at: -1 }`
- `{ school_id: 1, actor_user_id: 1, created_at: -1 }`
- `{ action: 1, created_at: -1 }` for platform audit search.

Audit logs are append-only at the service layer.

## 4. Students Module Example

Flow:

```txt
StudentsPage
  -> useStudents
    -> service-client fetches API/server action
      -> school-app/modules/students/services/student.service
        -> shared/services/student.service
          -> Zod validation
          -> RBAC check
          -> StudentModel query with { school_id: ctx.school_id }
          -> AuditLogModel create
          -> ServiceResult response
```

Required layers:

- `constants`: class options, statuses, table columns.
- `types`: module-specific DTOs.
- `validators`: Zod schemas.
- `services`: only place that calls shared DB services.
- `hooks`: async state and retry orchestration.
- `components`: design-system-only UI.
- `pages`: composition only.

## 5. Auth + RBAC Middleware

JWT payload:

```ts
{
  sub: string;
  school_id: string;
  role: "super_admin" | "admin" | "teacher" | "student";
  permissions: string[];
  session_id: string;
  app: "school" | "super_admin";
}
```

Role matrix:

| Feature | Admin | Teacher | Student |
|---|---:|---:|---:|
| Students | Full | No | No |
| Teachers | Full | View own | No |
| Classes | Full | View assigned | View own |
| Homework | Full | Full | View |
| Attendance | Full | Full | View |
| Exams | Full | Full | View |
| Fees | Full | No | View own |
| Reports | Full | View assigned | View own |

Middleware rules:

- Missing session: controlled `401`.
- Wrong app claim: controlled `403`.
- Blocked school: controlled `423`.
- Missing permission: controlled `403`.
- UI renders fallback instead of crashing.

## 6. Dashboard Structures

### Admin Dashboard

Layers:

- Overview: total students, attendance percentage, outstanding fees, active classes.
- Operations: students, teachers, classes.
- Finance: fees, expenses, unpaid invoices, collection trend.
- Academic: exams, timetable, homework load.
- Monitoring: attendance exceptions, reports, audit summary.

### Teacher Dashboard

Quick Action Engine:

- Start class.
- Auto attendance.
- Assign homework.
- Schedule test.

Rule-based Insight Panel:

- "3 students absent repeatedly."
- "Low marks detected in Mathematics."
- "Homework submission drop detected."

### Student Dashboard

Personalized:

- Daily summary.
- Attendance status.
- Weak subjects.
- Upcoming homework, exams, and fee due dates.

## 7. System Engines

### Notification Engine

Triggers:

- Homework assigned.
- Test scheduled.
- Fee due.
- Attendance warning.
- Low marks detected.

Behavior:

- Receives domain event.
- Resolves recipients inside the same `school_id`.
- Writes `notifications`.
- Queues retryable delivery in `sync_jobs` if external delivery fails.

### Analytics Engine

Metrics:

- Attendance percentage.
- Absence streaks.
- Subject performance trends.
- Fee collection and unpaid balance.

Rule:

- First aggregation stage must be `{ $match: { school_id } }`.

### Rule Engine

Examples:

- If attendance `< 70%`, notify guardian/admin.
- If fee unpaid past due date, notify student/guardian/admin.
- If subject marks fall below threshold twice, notify teacher/admin.

Rules are deterministic and auditable. They do not mutate source records directly; they emit notifications and audit records.

### Sync Engine

Offline-ready queue:

- `sync_jobs` store retryable operations with `school_id`, `idempotency_key`, payload, status, attempt count, and next retry time.
- Failed jobs use exponential backoff.
- Idempotency prevents duplicate homework, attendance, and notification side effects.

## 8. Docker Setup

`docker-compose.yml` defines:

- `school-app`
- `super-admin-app`
- `mongo`

Production requirements:

- Mongo volume mounted at `mongo_data`.
- Apps connected over a private bridge network.
- Secrets passed by environment variables.
- App ports exposed separately.
- Health check for Mongo.

## 9. Error + Validation Strategy

Service rules:

- Wrap service execution with `serviceTry`.
- Validate input before DB mutation.
- Never throw raw database errors to UI.
- Return `ServiceResult<T>` with a controlled code and message.
- Write audit logs for successful mutations and security-sensitive denials.

UI rules:

- Render loading state before data arrives.
- Render empty state when result is valid but empty.
- Render controlled error state on failed service result.
- Show toast notifications for create/update/delete success and recoverable errors.
- Keep forms populated after validation failure.

Validation rules:

- Use Zod schemas in `shared/validation`.
- Module validators re-export or compose shared schemas.
- DB schema is the final persistence guard.

## 10. Why This Structure Works

The structure works because tenant isolation is not left to developer memory. It appears in the request context, query helper, service wrapper, model indexes, audit logs, and UI fallback contract.

Scaling works by separating concerns:

- Apps own experience and composition.
- Modules own domain workflow.
- Shared services own DB and cross-cutting rules.
- Engines own automated side effects.
- MongoDB indexes match actual tenant-scoped query patterns.

Most teams fail in predictable places:

- They remember `school_id` on create but forget it on reads, updates, or aggregations.
- They put permission checks in UI only.
- They let dashboards query many collections without first-stage tenant filters.
- They skip audit logs until compliance becomes urgent.
- They mix module responsibilities and create circular dependencies.
- They treat error states as edge cases instead of core product states.
- They let design drift by hard-coding spacing and colors instead of using tokens.

This scaffold prevents those failures by making the secure path the default path.
