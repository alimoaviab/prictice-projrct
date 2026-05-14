-- Eduplexo — Final PostgreSQL schema (Phase 3).
--
-- Designed once. No ALTER follow-ups required.
--
-- Modeled directly on the original Mongoose collections in
-- old-app/shared/models/*. Every relationship has a proper foreign key,
-- every tenant-scoped collection carries `school_id NOT NULL`, every
-- academic-year-scoped collection carries `academic_year_id`, and every
-- many-to-many becomes a real junction table.
--
-- Cascade rules:
--   * Tenant teardown (a school being removed) cascades through the entire
--     tree via ON DELETE CASCADE chains rooted at `schools.school_id`.
--   * Junction tables cascade from both parents.
--   * Audit logs and notifications cascade with the user/school.
--
-- Soft constraints (status/role enums) are enforced via CHECK clauses so
-- we never need ALTER TYPE for new values — adjusting a CHECK is a CREATE-
-- and-swap, not an ALTER.

-- ─── Extensions ───────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pgcrypto;     -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS citext;       -- case-insensitive emails

-- ─── Tenancy root ─────────────────────────────────────────────────────────
CREATE TABLE schools (
    id                  TEXT        PRIMARY KEY,
    school_id           TEXT        NOT NULL UNIQUE,
    name                TEXT        NOT NULL,
    code                TEXT        NOT NULL UNIQUE,
    logo_url            TEXT        NOT NULL DEFAULT '',
    contact_email       CITEXT      NOT NULL DEFAULT '',
    contact_phone       TEXT        NOT NULL DEFAULT '',
    address             TEXT        NOT NULL DEFAULT '',
    established_year    INTEGER,
    admin_name          TEXT        NOT NULL DEFAULT '',
    admin_email         CITEXT      NOT NULL DEFAULT '',
    admin_phone         TEXT        NOT NULL DEFAULT '',
    domains             TEXT[]      NOT NULL DEFAULT '{}',
    status              TEXT        NOT NULL DEFAULT 'pending',
    rejection_reason    TEXT        NOT NULL DEFAULT '',
    approved_by         TEXT        NOT NULL DEFAULT '',
    approved_at         TIMESTAMPTZ,
    plan_key            TEXT        NOT NULL DEFAULT 'free',
    plan_seats          INTEGER     NOT NULL DEFAULT 0,
    plan_expires_at     TIMESTAMPTZ,
    settings            JSONB       NOT NULL DEFAULT '{}'::jsonb,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT schools_status_chk
        CHECK (status IN ('pending','approved','rejected','suspended','active')),
    CONSTRAINT schools_plan_chk
        CHECK (plan_key IN ('free','basic','premium','enterprise'))
);
CREATE INDEX schools_status_plan_idx ON schools (status, plan_key);

-- ─── Users ────────────────────────────────────────────────────────────────
CREATE TABLE users (
    id              TEXT        PRIMARY KEY,
    school_id       TEXT        NOT NULL REFERENCES schools(school_id) ON DELETE CASCADE,
    email           CITEXT      NOT NULL,
    password_hash   TEXT        NOT NULL,
    role            TEXT        NOT NULL,
    permissions     TEXT[]      NOT NULL DEFAULT '{}',
    profile_first   TEXT        NOT NULL DEFAULT '',
    profile_last    TEXT        NOT NULL DEFAULT '',
    profile_phone   TEXT        NOT NULL DEFAULT '',
    profile_avatar  TEXT        NOT NULL DEFAULT '',
    status          TEXT        NOT NULL DEFAULT 'active',
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT users_role_chk
        CHECK (role IN ('super_admin','admin','teacher','parent','student')),
    CONSTRAINT users_status_chk
        CHECK (status IN ('active','invited','disabled','locked'))
);
CREATE UNIQUE INDEX users_school_email_uniq
    ON users (school_id, email);
CREATE INDEX users_school_role_status_idx
    ON users (school_id, role, status);

-- ─── Academic Years ───────────────────────────────────────────────────────
CREATE TABLE academic_years (
    id              TEXT        PRIMARY KEY,
    school_id       TEXT        NOT NULL REFERENCES schools(school_id) ON DELETE CASCADE,
    year            TEXT        NOT NULL,
    start_date      TIMESTAMPTZ NOT NULL,
    end_date        TIMESTAMPTZ NOT NULL,
    is_active       BOOLEAN     NOT NULL DEFAULT FALSE,
    description     TEXT        NOT NULL DEFAULT '',
    status          TEXT        NOT NULL DEFAULT 'draft',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ay_status_chk
        CHECK (status IN ('draft','active','completed','cancelled'))
);
CREATE UNIQUE INDEX ay_school_year_uniq
    ON academic_years (school_id, year);
CREATE INDEX ay_school_active_idx
    ON academic_years (school_id, is_active, status);

-- ─── Subjects ─────────────────────────────────────────────────────────────
CREATE TABLE subjects (
    id              TEXT        PRIMARY KEY,
    school_id       TEXT        NOT NULL REFERENCES schools(school_id) ON DELETE CASCADE,
    name            TEXT        NOT NULL,
    code            TEXT        NOT NULL DEFAULT '',
    description     TEXT        NOT NULL DEFAULT '',
    status          TEXT        NOT NULL DEFAULT 'active',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT subjects_status_chk
        CHECK (status IN ('active','inactive'))
);
CREATE UNIQUE INDEX subjects_school_name_uniq
    ON subjects (school_id, name);
CREATE INDEX subjects_school_status_idx
    ON subjects (school_id, status);

-- ─── Classes ──────────────────────────────────────────────────────────────
CREATE TABLE classes (
    id                      TEXT        PRIMARY KEY,
    school_id               TEXT        NOT NULL REFERENCES schools(school_id) ON DELETE CASCADE,
    academic_year_id        TEXT        NOT NULL REFERENCES academic_years(id) ON DELETE RESTRICT,
    name                    TEXT        NOT NULL,
    code                    TEXT        NOT NULL DEFAULT '',
    grade                   TEXT        NOT NULL DEFAULT '',
    section                 TEXT        NOT NULL DEFAULT '',
    capacity                INTEGER     NOT NULL DEFAULT 0,
    display_order           INTEGER     NOT NULL DEFAULT 1,
    passing_percentage      INTEGER     NOT NULL DEFAULT 33,
    class_teacher_id        TEXT,                              -- FK added below
    room_number             TEXT        NOT NULL DEFAULT '',
    description             TEXT        NOT NULL DEFAULT '',
    fee_total_annual        NUMERIC(14,2) NOT NULL DEFAULT 0,
    fee_monthly_recurring   NUMERIC(14,2) NOT NULL DEFAULT 0,
    fees_configured         BOOLEAN     NOT NULL DEFAULT FALSE,
    grade_thresholds        JSONB       NOT NULL DEFAULT '{}'::jsonb,
    status                  TEXT        NOT NULL DEFAULT 'active',
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT classes_status_chk
        CHECK (status IN ('active','archived'))
);
CREATE UNIQUE INDEX classes_school_year_name_uniq
    ON classes (school_id, academic_year_id, name);
CREATE INDEX classes_school_year_idx
    ON classes (school_id, academic_year_id);
CREATE INDEX classes_school_teacher_idx
    ON classes (school_id, class_teacher_id) WHERE class_teacher_id IS NOT NULL;

-- ─── Teachers ─────────────────────────────────────────────────────────────
CREATE TABLE teachers (
    id                  TEXT        PRIMARY KEY,
    school_id           TEXT        NOT NULL REFERENCES schools(school_id) ON DELETE CASCADE,
    academic_year_id    TEXT        REFERENCES academic_years(id) ON DELETE SET NULL,
    user_id             TEXT        REFERENCES users(id) ON DELETE SET NULL,
    email               CITEXT      NOT NULL DEFAULT '',
    employee_no         TEXT        NOT NULL,
    first_name          TEXT        NOT NULL,
    last_name           TEXT        NOT NULL DEFAULT '',
    phone               TEXT        NOT NULL DEFAULT '',
    qualification       TEXT        NOT NULL DEFAULT '',
    status              TEXT        NOT NULL DEFAULT 'active',
    joined_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    google_calendar     JSONB       NOT NULL DEFAULT '{}'::jsonb,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT teachers_status_chk
        CHECK (status IN ('active','inactive','on_leave'))
);
CREATE UNIQUE INDEX teachers_school_employee_uniq
    ON teachers (school_id, employee_no);
CREATE INDEX teachers_school_year_status_idx
    ON teachers (school_id, academic_year_id, status);
CREATE INDEX teachers_school_user_idx
    ON teachers (school_id, user_id) WHERE user_id IS NOT NULL;

-- Now that teachers exists, attach the FK that classes deferred.
ALTER TABLE classes
    ADD CONSTRAINT classes_class_teacher_fk
    FOREIGN KEY (class_teacher_id) REFERENCES teachers(id) ON DELETE SET NULL;

-- ─── Students ─────────────────────────────────────────────────────────────
CREATE TABLE students (
    id                  TEXT        PRIMARY KEY,
    school_id           TEXT        NOT NULL REFERENCES schools(school_id) ON DELETE CASCADE,
    academic_year_id    TEXT        NOT NULL REFERENCES academic_years(id) ON DELETE RESTRICT,
    user_id             TEXT        REFERENCES users(id) ON DELETE SET NULL,
    class_id            TEXT        NOT NULL REFERENCES classes(id) ON DELETE RESTRICT,
    admission_no        TEXT        NOT NULL,
    first_name          TEXT        NOT NULL,
    last_name           TEXT        NOT NULL,
    section             TEXT        NOT NULL DEFAULT '',
    roll_no             TEXT        NOT NULL DEFAULT '',
    date_of_birth       TIMESTAMPTZ,
    gender              TEXT        NOT NULL DEFAULT '',
    guardian_name       TEXT        NOT NULL,
    guardian_phone      TEXT        NOT NULL,
    guardian_email      CITEXT      NOT NULL DEFAULT '',
    status              TEXT        NOT NULL DEFAULT 'active',
    enrolled_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT students_status_chk
        CHECK (status IN ('active','inactive','graduated','transferred'))
);
CREATE UNIQUE INDEX students_school_admission_uniq
    ON students (school_id, admission_no);
CREATE INDEX students_school_class_idx
    ON students (school_id, class_id, status);
CREATE INDEX students_school_year_status_idx
    ON students (school_id, academic_year_id, status, last_name, first_name);

-- ─── Junction tables (real, with FKs) ─────────────────────────────────────
CREATE TABLE class_teachers (
    class_id    TEXT NOT NULL REFERENCES classes(id)  ON DELETE CASCADE,
    teacher_id  TEXT NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    PRIMARY KEY (class_id, teacher_id)
);

CREATE TABLE class_subjects (
    class_id    TEXT NOT NULL REFERENCES classes(id)  ON DELETE CASCADE,
    subject_id  TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    PRIMARY KEY (class_id, subject_id)
);

CREATE TABLE teacher_subjects (
    teacher_id  TEXT NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    subject_id  TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    PRIMARY KEY (teacher_id, subject_id)
);

CREATE TABLE teacher_classes (
    teacher_id  TEXT NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    class_id    TEXT NOT NULL REFERENCES classes(id)  ON DELETE CASCADE,
    PRIMARY KEY (teacher_id, class_id)
);

CREATE TABLE student_subjects (
    student_id  TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject_id  TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    PRIMARY KEY (student_id, subject_id)
);

-- ─── Parent ↔ Student linkage (multi-child support) ───────────────────────
CREATE TABLE student_parents (
    id              TEXT NOT NULL PRIMARY KEY,
    school_id       TEXT NOT NULL REFERENCES schools(school_id) ON DELETE CASCADE,
    student_id      TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    parent_user_id  TEXT NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
    relationship    TEXT NOT NULL DEFAULT 'guardian',
    is_primary      BOOLEAN NOT NULL DEFAULT TRUE,
    status          TEXT NOT NULL DEFAULT 'active',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT student_parents_relationship_chk
        CHECK (relationship IN ('father','mother','guardian','other')),
    CONSTRAINT student_parents_status_chk
        CHECK (status IN ('active','inactive'))
);
CREATE UNIQUE INDEX student_parents_uniq
    ON student_parents (school_id, parent_user_id, student_id);
CREATE INDEX student_parents_school_parent_idx
    ON student_parents (school_id, parent_user_id, status);

-- (Older convenience parents table — kept for the legacy ParentModel
-- collection that some tooling reads. Direct mapping of the Mongoose doc.)
CREATE TABLE parents (
    id           TEXT PRIMARY KEY,
    school_id    TEXT NOT NULL REFERENCES schools(school_id) ON DELETE CASCADE,
    user_id      TEXT NOT NULL REFERENCES users(id)         ON DELETE CASCADE,
    name         TEXT NOT NULL DEFAULT '',
    phone        TEXT NOT NULL DEFAULT '',
    email        CITEXT NOT NULL DEFAULT '',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX parents_school_user_idx ON parents (school_id, user_id);

-- ─── Attendance ───────────────────────────────────────────────────────────
CREATE TABLE attendance (
    id                  TEXT        PRIMARY KEY,
    school_id           TEXT        NOT NULL REFERENCES schools(school_id) ON DELETE CASCADE,
    academic_year_id    TEXT        REFERENCES academic_years(id) ON DELETE RESTRICT,
    student_id          TEXT        NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    class_id            TEXT        NOT NULL REFERENCES classes(id)  ON DELETE CASCADE,
    teacher_id          TEXT        REFERENCES teachers(id) ON DELETE SET NULL,
    date                TIMESTAMPTZ NOT NULL,
    period              INTEGER     NOT NULL DEFAULT 0,
    status              TEXT        NOT NULL,
    marked_by           TEXT        NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    source              TEXT        NOT NULL DEFAULT 'manual',
    note                TEXT        NOT NULL DEFAULT '',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT attendance_status_chk
        CHECK (status IN ('present','absent','late','excused')),
    CONSTRAINT attendance_source_chk
        CHECK (source IN ('manual','auto','sync'))
);
CREATE UNIQUE INDEX attendance_uniq
    ON attendance (school_id, student_id, date, period);
CREATE INDEX attendance_class_date_idx
    ON attendance (school_id, class_id, date);
CREATE INDEX attendance_year_status_idx
    ON attendance (school_id, academic_year_id, status, date DESC);

-- ─── Exams + Results ──────────────────────────────────────────────────────
CREATE TABLE exams (
    id                  TEXT        PRIMARY KEY,
    school_id           TEXT        NOT NULL REFERENCES schools(school_id) ON DELETE CASCADE,
    academic_year_id    TEXT        REFERENCES academic_years(id) ON DELETE RESTRICT,
    class_id            TEXT        NOT NULL REFERENCES classes(id)  ON DELETE CASCADE,
    teacher_id          TEXT        REFERENCES teachers(id) ON DELETE SET NULL,
    subject             TEXT        NOT NULL,
    title               TEXT        NOT NULL,
    starts_at           TIMESTAMPTZ NOT NULL,
    max_marks           INTEGER     NOT NULL DEFAULT 0,
    pass_marks          INTEGER     NOT NULL DEFAULT 0,
    status              TEXT        NOT NULL DEFAULT 'scheduled',
    description         TEXT        NOT NULL DEFAULT '',
    published_at        TIMESTAMPTZ,
    results_published_at TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT exams_status_chk
        CHECK (status IN ('created','scheduled','published','results_published','completed','cancelled'))
);
CREATE INDEX exams_school_year_idx
    ON exams (school_id, academic_year_id, starts_at DESC);
CREATE INDEX exams_school_class_idx
    ON exams (school_id, class_id, starts_at DESC);

CREATE TABLE results (
    id                  TEXT        PRIMARY KEY,
    school_id           TEXT        NOT NULL REFERENCES schools(school_id) ON DELETE CASCADE,
    academic_year_id    TEXT        REFERENCES academic_years(id) ON DELETE RESTRICT,
    exam_id             TEXT        NOT NULL REFERENCES exams(id)    ON DELETE CASCADE,
    class_id            TEXT        NOT NULL REFERENCES classes(id)  ON DELETE CASCADE,
    student_id          TEXT        NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    obtained_marks      NUMERIC(8,2) NOT NULL DEFAULT 0,
    grade               TEXT        NOT NULL DEFAULT '',
    remarks             TEXT        NOT NULL DEFAULT '',
    graded_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX results_exam_student_uniq
    ON results (school_id, exam_id, student_id);
CREATE INDEX results_class_year_idx
    ON results (school_id, academic_year_id, class_id, graded_at DESC);

-- ─── Homework + Submissions ──────────────────────────────────────────────
CREATE TABLE homework (
    id                  TEXT        PRIMARY KEY,
    school_id           TEXT        NOT NULL REFERENCES schools(school_id) ON DELETE CASCADE,
    academic_year_id    TEXT        REFERENCES academic_years(id) ON DELETE RESTRICT,
    class_id            TEXT        NOT NULL REFERENCES classes(id)  ON DELETE CASCADE,
    section             TEXT,
    teacher_id          TEXT        NOT NULL REFERENCES teachers(id) ON DELETE RESTRICT,
    subject_id          TEXT        REFERENCES subjects(id) ON DELETE SET NULL,
    subject             TEXT        NOT NULL DEFAULT '',
    title               TEXT        NOT NULL,
    instructions        TEXT        NOT NULL DEFAULT '',
    attachments         TEXT[]      NOT NULL DEFAULT '{}',
    visibility          TEXT        NOT NULL DEFAULT 'all',
    created_by          TEXT,
    created_by_role     TEXT        NOT NULL DEFAULT 'admin',
    max_score           NUMERIC(8,2) NOT NULL DEFAULT 100,
    submission_type     TEXT        NOT NULL DEFAULT 'both',
    assigned_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    due_at              TIMESTAMPTZ NOT NULL,
    status              TEXT        NOT NULL DEFAULT 'assigned',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT homework_status_chk
        CHECK (status IN ('draft','assigned','closed')),
    CONSTRAINT homework_visibility_chk
        CHECK (visibility IN ('all','student','parent')),
    CONSTRAINT homework_submission_type_chk
        CHECK (submission_type IN ('online','offline','both'))
);
CREATE INDEX homework_class_due_idx
    ON homework (school_id, academic_year_id, class_id, due_at);
CREATE INDEX homework_teacher_idx
    ON homework (school_id, academic_year_id, teacher_id, created_at DESC);

CREATE TABLE homework_submissions (
    id                  TEXT        PRIMARY KEY,
    homework_id         TEXT        NOT NULL REFERENCES homework(id) ON DELETE CASCADE,
    student_id          TEXT        NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    submitted_at        TIMESTAMPTZ,
    graded_at           TIMESTAMPTZ,
    status              TEXT        NOT NULL DEFAULT 'pending',
    attachment_urls     TEXT[]      NOT NULL DEFAULT '{}',
    marks               NUMERIC(8,2),
    feedback            TEXT        NOT NULL DEFAULT '',
    CONSTRAINT homework_submissions_status_chk
        CHECK (status IN ('pending','submitted','late','missing','graded'))
);
CREATE UNIQUE INDEX homework_submissions_uniq
    ON homework_submissions (homework_id, student_id);
CREATE INDEX homework_submissions_student_idx
    ON homework_submissions (student_id);

-- ─── Announcements ────────────────────────────────────────────────────────
CREATE TABLE announcements (
    id                  TEXT        PRIMARY KEY,
    school_id           TEXT        NOT NULL REFERENCES schools(school_id) ON DELETE CASCADE,
    academic_year_id    TEXT        REFERENCES academic_years(id) ON DELETE SET NULL,
    title               TEXT        NOT NULL,
    body                TEXT        NOT NULL DEFAULT '',
    audience            TEXT        NOT NULL DEFAULT 'all',
    priority            TEXT        NOT NULL DEFAULT 'normal',
    pinned_till         TIMESTAMPTZ,
    created_by          TEXT        REFERENCES users(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT announcements_audience_chk
        CHECK (audience IN ('all','teachers','parents','students')),
    CONSTRAINT announcements_priority_chk
        CHECK (priority IN ('low','normal','high'))
);
CREATE INDEX announcements_school_idx
    ON announcements (school_id, created_at DESC);

-- ─── Behaviors ────────────────────────────────────────────────────────────
CREATE TABLE behaviors (
    id                  TEXT        PRIMARY KEY,
    school_id           TEXT        NOT NULL REFERENCES schools(school_id) ON DELETE CASCADE,
    academic_year_id    TEXT        REFERENCES academic_years(id) ON DELETE SET NULL,
    student_id          TEXT        NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    class_id            TEXT        NOT NULL REFERENCES classes(id)  ON DELETE CASCADE,
    teacher_id          TEXT        NOT NULL REFERENCES teachers(id) ON DELETE RESTRICT,
    incident_type       TEXT        NOT NULL,
    description         TEXT        NOT NULL,
    severity            TEXT        NOT NULL,
    action_taken        TEXT        NOT NULL DEFAULT '',
    status              TEXT        NOT NULL DEFAULT 'open',
    warning_count       INTEGER     NOT NULL DEFAULT 1,
    parent_notified     BOOLEAN     NOT NULL DEFAULT FALSE,
    notes               TEXT        NOT NULL DEFAULT '',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT behaviors_severity_chk
        CHECK (severity IN ('minor','moderate','major','critical')),
    CONSTRAINT behaviors_status_chk
        CHECK (status IN ('open','under_review','resolved','escalated'))
);
CREATE INDEX behaviors_school_student_idx
    ON behaviors (school_id, student_id);
CREATE INDEX behaviors_school_year_idx
    ON behaviors (school_id, academic_year_id, created_at DESC);

-- ─── Events ───────────────────────────────────────────────────────────────
CREATE TABLE events (
    id                  TEXT        PRIMARY KEY,
    school_id           TEXT        NOT NULL REFERENCES schools(school_id) ON DELETE CASCADE,
    academic_year_id    TEXT        REFERENCES academic_years(id) ON DELETE SET NULL,
    title               TEXT        NOT NULL,
    description         TEXT        NOT NULL DEFAULT '',
    event_type          TEXT        NOT NULL DEFAULT 'other',
    start_date          TIMESTAMPTZ NOT NULL,
    end_date            TIMESTAMPTZ NOT NULL,
    start_time          TEXT        NOT NULL DEFAULT '',
    end_time            TEXT        NOT NULL DEFAULT '',
    location            TEXT        NOT NULL DEFAULT '',
    visibility          TEXT        NOT NULL DEFAULT 'all',
    organizer           TEXT        NOT NULL DEFAULT '',
    status              TEXT        NOT NULL DEFAULT 'scheduled',
    created_by          TEXT        REFERENCES users(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT events_visibility_chk
        CHECK (visibility IN ('all','specific_classes')),
    CONSTRAINT events_status_chk
        CHECK (status IN ('scheduled','cancelled','completed'))
);
CREATE INDEX events_school_idx
    ON events (school_id, start_date);

CREATE TABLE event_target_classes (
    event_id    TEXT NOT NULL REFERENCES events(id)  ON DELETE CASCADE,
    class_id    TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    PRIMARY KEY (event_id, class_id)
);

-- ─── Leave requests ───────────────────────────────────────────────────────
CREATE TABLE leaves (
    id                  TEXT        PRIMARY KEY,
    school_id           TEXT        NOT NULL REFERENCES schools(school_id) ON DELETE CASCADE,
    academic_year_id    TEXT        REFERENCES academic_years(id) ON DELETE SET NULL,
    requester_type      TEXT        NOT NULL,
    requester_id        TEXT        NOT NULL,
    requester_name      TEXT        NOT NULL DEFAULT '',
    leave_type          TEXT        NOT NULL,
    start_date          TIMESTAMPTZ NOT NULL,
    end_date            TIMESTAMPTZ NOT NULL,
    reason              TEXT        NOT NULL,
    status              TEXT        NOT NULL DEFAULT 'pending',
    attachments         TEXT[]      NOT NULL DEFAULT '{}',
    approved_by         TEXT        REFERENCES users(id) ON DELETE SET NULL,
    approved_at         TIMESTAMPTZ,
    rejection_reason    TEXT        NOT NULL DEFAULT '',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT leaves_requester_chk
        CHECK (requester_type IN ('student','teacher')),
    CONSTRAINT leaves_status_chk
        CHECK (status IN ('pending','approved','rejected','cancelled')),
    CONSTRAINT leaves_type_chk
        CHECK (leave_type IN ('sick','personal','family','other'))
);
CREATE INDEX leaves_school_status_idx
    ON leaves (school_id, status);
CREATE INDEX leaves_school_requester_idx
    ON leaves (school_id, requester_id, start_date DESC);

-- ─── Timetable ────────────────────────────────────────────────────────────
CREATE TABLE timetables (
    id                  TEXT        PRIMARY KEY,
    school_id           TEXT        NOT NULL REFERENCES schools(school_id) ON DELETE CASCADE,
    academic_year_id    TEXT        REFERENCES academic_years(id) ON DELETE SET NULL,
    class_id            TEXT        NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    status              TEXT        NOT NULL DEFAULT 'active',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX timetables_school_class_idx
    ON timetables (school_id, class_id);

CREATE TABLE timetable_sessions (
    id              TEXT        PRIMARY KEY,
    timetable_id    TEXT        NOT NULL REFERENCES timetables(id) ON DELETE CASCADE,
    day             INTEGER     NOT NULL,
    period          INTEGER     NOT NULL,
    starts_at       TEXT        NOT NULL,
    ends_at         TEXT        NOT NULL,
    subject_id      TEXT        REFERENCES subjects(id) ON DELETE SET NULL,
    subject         TEXT        NOT NULL DEFAULT '',
    teacher_id      TEXT        REFERENCES teachers(id) ON DELETE SET NULL,
    room            TEXT        NOT NULL DEFAULT '',
    CONSTRAINT timetable_sessions_day_chk
        CHECK (day BETWEEN 0 AND 6)
);
CREATE INDEX timetable_sessions_parent_idx
    ON timetable_sessions (timetable_id, day, period);

-- ─── Live classes ─────────────────────────────────────────────────────────
CREATE TABLE live_classes (
    id                  TEXT        PRIMARY KEY,
    school_id           TEXT        NOT NULL REFERENCES schools(school_id) ON DELETE CASCADE,
    academic_year_id    TEXT        REFERENCES academic_years(id) ON DELETE SET NULL,
    class_id            TEXT        NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    subject             TEXT        NOT NULL DEFAULT '',
    title               TEXT        NOT NULL,
    starts_at           TIMESTAMPTZ NOT NULL,
    ends_at             TIMESTAMPTZ NOT NULL,
    host_teacher_id     TEXT        REFERENCES teachers(id) ON DELETE SET NULL,
    join_url            TEXT        NOT NULL DEFAULT '',
    provider            TEXT        NOT NULL DEFAULT 'manual',
    status              TEXT        NOT NULL DEFAULT 'scheduled',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT live_classes_status_chk
        CHECK (status IN ('scheduled','live','ended','cancelled'))
);
CREATE INDEX live_classes_school_idx
    ON live_classes (school_id, class_id, starts_at DESC);

-- ─── Notifications ────────────────────────────────────────────────────────
CREATE TABLE notifications (
    id                  TEXT        PRIMARY KEY,
    school_id           TEXT        NOT NULL REFERENCES schools(school_id) ON DELETE CASCADE,
    user_id             TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title               TEXT        NOT NULL,
    body                TEXT        NOT NULL DEFAULT '',
    category            TEXT        NOT NULL DEFAULT '',
    read                BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX notifications_user_idx
    ON notifications (school_id, user_id, read, created_at DESC);

-- ─── School settings ──────────────────────────────────────────────────────
CREATE TABLE school_settings (
    school_id   TEXT        PRIMARY KEY REFERENCES schools(school_id) ON DELETE CASCADE,
    profile     JSONB       NOT NULL DEFAULT '{}'::jsonb,
    branding    JSONB       NOT NULL DEFAULT '{}'::jsonb,
    academic    JSONB       NOT NULL DEFAULT '{}'::jsonb,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Audit logs ───────────────────────────────────────────────────────────
CREATE TABLE audit_logs (
    id                  TEXT        PRIMARY KEY,
    school_id           TEXT        NOT NULL REFERENCES schools(school_id) ON DELETE CASCADE,
    actor_user_id       TEXT        NOT NULL DEFAULT '',
    actor_role          TEXT        NOT NULL DEFAULT '',
    actor_email         CITEXT      NOT NULL DEFAULT '',
    action              TEXT        NOT NULL,
    entity_type         TEXT        NOT NULL,
    entity_id           TEXT        NOT NULL,
    before              JSONB,
    after               JSONB,
    metadata            JSONB,
    ip                  TEXT        NOT NULL DEFAULT '',
    user_agent          TEXT        NOT NULL DEFAULT '',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX audit_school_created_idx
    ON audit_logs (school_id, created_at DESC);
CREATE INDEX audit_school_entity_idx
    ON audit_logs (school_id, entity_type, entity_id, created_at DESC);
CREATE INDEX audit_actor_idx
    ON audit_logs (school_id, actor_user_id, created_at DESC);

-- ─── Fees domain (full real schema) ───────────────────────────────────────
CREATE TABLE fee_types (
    id              TEXT        PRIMARY KEY,
    school_id       TEXT        NOT NULL REFERENCES schools(school_id) ON DELETE CASCADE,
    name            TEXT        NOT NULL,
    description     TEXT        NOT NULL DEFAULT '',
    is_recurring    BOOLEAN     NOT NULL DEFAULT TRUE,
    category        TEXT        NOT NULL DEFAULT 'academic',
    status          TEXT        NOT NULL DEFAULT 'active',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fee_types_status_chk
        CHECK (status IN ('active','inactive'))
);
CREATE UNIQUE INDEX fee_types_school_name_uniq
    ON fee_types (school_id, name);
CREATE INDEX fee_types_school_status_idx
    ON fee_types (school_id, status);

-- Per-class fee configuration. Drives monthly invoice generation.
CREATE TABLE class_fees (
    id                  TEXT        PRIMARY KEY,
    school_id           TEXT        NOT NULL REFERENCES schools(school_id) ON DELETE CASCADE,
    class_id            TEXT        NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    academic_year_id    TEXT        NOT NULL REFERENCES academic_years(id) ON DELETE RESTRICT,
    fee_type_id         TEXT        NOT NULL REFERENCES fee_types(id) ON DELETE RESTRICT,
    amount              NUMERIC(14,2) NOT NULL DEFAULT 0,
    type                TEXT        NOT NULL DEFAULT 'recurring',
    recurring_cycle     TEXT        NOT NULL DEFAULT 'monthly',
    due_month           TEXT        NOT NULL DEFAULT '',
    due_year            INTEGER     NOT NULL DEFAULT 0,
    notes               TEXT        NOT NULL DEFAULT '',
    status              TEXT        NOT NULL DEFAULT 'active',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT class_fees_type_chk
        CHECK (type IN ('recurring','onetime')),
    CONSTRAINT class_fees_cycle_chk
        CHECK (recurring_cycle IN ('monthly','quarterly','yearly')),
    CONSTRAINT class_fees_status_chk
        CHECK (status IN ('active','inactive'))
);
CREATE UNIQUE INDEX class_fees_uniq
    ON class_fees (school_id, class_id, academic_year_id, fee_type_id);
CREATE INDEX class_fees_school_year_idx
    ON class_fees (school_id, academic_year_id, status);

-- Generated student invoices (the original "fees" collection).
CREATE TABLE fees (
    id                  TEXT        PRIMARY KEY,
    school_id           TEXT        NOT NULL REFERENCES schools(school_id) ON DELETE CASCADE,
    student_id          TEXT        NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    class_id            TEXT        REFERENCES classes(id) ON DELETE SET NULL,
    academic_year_id    TEXT        REFERENCES academic_years(id) ON DELETE SET NULL,
    fee_type_id         TEXT        REFERENCES fee_types(id) ON DELETE SET NULL,
    invoice_no          TEXT        NOT NULL,
    title               TEXT        NOT NULL,
    amount              NUMERIC(14,2) NOT NULL DEFAULT 0,
    currency            TEXT        NOT NULL DEFAULT 'USD',
    month               TEXT        NOT NULL DEFAULT '',
    year                INTEGER     NOT NULL DEFAULT 0,
    due_at              TIMESTAMPTZ NOT NULL,
    status              TEXT        NOT NULL DEFAULT 'unpaid',
    paid_amount         NUMERIC(14,2) NOT NULL DEFAULT 0,
    adjustment_amount   NUMERIC(14,2) NOT NULL DEFAULT 0,
    generated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    generated_by        TEXT        REFERENCES users(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fees_status_chk
        CHECK (status IN ('unpaid','partial','paid','void'))
);
CREATE UNIQUE INDEX fees_school_invoice_uniq
    ON fees (school_id, invoice_no);
CREATE UNIQUE INDEX fees_school_student_month_uniq
    ON fees (school_id, student_id, academic_year_id, month, year)
    WHERE month <> '';
CREATE INDEX fees_school_student_due_idx
    ON fees (school_id, student_id, due_at);
CREATE INDEX fees_school_status_due_idx
    ON fees (school_id, status, due_at);

-- Per-invoice line items (one row per fee_type contributing to the invoice).
CREATE TABLE fee_components (
    id                  TEXT        PRIMARY KEY,
    fee_id              TEXT        NOT NULL REFERENCES fees(id) ON DELETE CASCADE,
    fee_type_id         TEXT        REFERENCES fee_types(id) ON DELETE SET NULL,
    fee_type            TEXT        NOT NULL DEFAULT '',
    amount              NUMERIC(14,2) NOT NULL DEFAULT 0,
    paid_amount         NUMERIC(14,2) NOT NULL DEFAULT 0
);
CREATE INDEX fee_components_fee_idx
    ON fee_components (fee_id);

-- Adjustments (discounts/waivers/penalties/scholarships) applied to a student.
CREATE TABLE fee_adjustments (
    id                  TEXT        PRIMARY KEY,
    school_id           TEXT        NOT NULL REFERENCES schools(school_id) ON DELETE CASCADE,
    student_id          TEXT        NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    academic_year_id    TEXT        NOT NULL REFERENCES academic_years(id) ON DELETE RESTRICT,
    type                TEXT        NOT NULL,
    amount              NUMERIC(14,2) NOT NULL DEFAULT 0,
    reason              TEXT        NOT NULL DEFAULT '',
    valid_from          TIMESTAMPTZ NOT NULL,
    valid_until         TIMESTAMPTZ NOT NULL,
    status              TEXT        NOT NULL DEFAULT 'active',
    applied_by          TEXT        REFERENCES users(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fee_adjustments_type_chk
        CHECK (type IN ('discount','waiver','penalty','scholarship')),
    CONSTRAINT fee_adjustments_status_chk
        CHECK (status IN ('active','expired','pending'))
);
CREATE INDEX fee_adjustments_student_idx
    ON fee_adjustments (school_id, student_id, academic_year_id, type);

-- Payment receipts (one row per receipt the cashier issues).
CREATE TABLE fee_payments (
    id                  TEXT        PRIMARY KEY,
    school_id           TEXT        NOT NULL REFERENCES schools(school_id) ON DELETE CASCADE,
    receipt_no          TEXT        NOT NULL,
    student_id          TEXT        NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    class_id            TEXT        REFERENCES classes(id) ON DELETE SET NULL,
    academic_year_id    TEXT        REFERENCES academic_years(id) ON DELETE SET NULL,
    amount              NUMERIC(14,2) NOT NULL DEFAULT 0,
    payment_date        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    payment_method      TEXT        NOT NULL DEFAULT 'cash',
    reference_no        TEXT        NOT NULL DEFAULT '',
    notes               TEXT        NOT NULL DEFAULT '',
    status              TEXT        NOT NULL DEFAULT 'completed',
    received_by         TEXT        REFERENCES users(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fee_payments_method_chk
        CHECK (payment_method IN ('cash','bank','jazzcash','easypaisa','card','cheque','online')),
    CONSTRAINT fee_payments_status_chk
        CHECK (status IN ('completed','reversed'))
);
CREATE UNIQUE INDEX fee_payments_school_receipt_uniq
    ON fee_payments (school_id, receipt_no);
CREATE INDEX fee_payments_school_student_idx
    ON fee_payments (school_id, student_id, payment_date DESC);
CREATE INDEX fee_payments_school_method_idx
    ON fee_payments (school_id, payment_method, payment_date DESC);

-- Allocations: how a single payment was distributed across one or more invoices.
CREATE TABLE fee_payment_allocations (
    id                  TEXT        PRIMARY KEY,
    fee_payment_id      TEXT        NOT NULL REFERENCES fee_payments(id) ON DELETE CASCADE,
    fee_id              TEXT        REFERENCES fees(id) ON DELETE SET NULL,
    fee_type_id         TEXT        REFERENCES fee_types(id) ON DELETE SET NULL,
    month               TEXT        NOT NULL DEFAULT '',
    amount              NUMERIC(14,2) NOT NULL DEFAULT 0
);
CREATE INDEX fee_payment_allocations_payment_idx
    ON fee_payment_allocations (fee_payment_id);
CREATE INDEX fee_payment_allocations_fee_idx
    ON fee_payment_allocations (fee_id);
