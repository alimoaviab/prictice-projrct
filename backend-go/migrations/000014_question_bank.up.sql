-- Question Bank, Chapters, Question Papers, Star Collections, Paper Drafts.
--
-- These tables back the Enterprise Question Bank & Paper Generator module.

-- ── Chapters ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chapters (
    id              TEXT PRIMARY KEY,
    school_id       TEXT NOT NULL,
    class_id        TEXT NOT NULL,
    class_name      TEXT DEFAULT '',
    subject_id      TEXT DEFAULT '',
    subject_name    TEXT DEFAULT '',
    title           TEXT NOT NULL,
    chapter_number  INTEGER NOT NULL DEFAULT 0,
    is_default      BOOLEAN NOT NULL DEFAULT FALSE,
    status          TEXT NOT NULL DEFAULT 'active',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_chapters_school ON chapters(school_id);
CREATE INDEX IF NOT EXISTS idx_chapters_class_subject ON chapters(class_id, subject_id);

-- ── Questions ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS questions (
    id                TEXT PRIMARY KEY,
    school_id         TEXT NOT NULL,
    created_by        TEXT DEFAULT '',
    created_by_name   TEXT DEFAULT '',
    class_id          TEXT NOT NULL,
    subject_id        TEXT DEFAULT '',
    subject_name      TEXT DEFAULT '',
    chapter_id        TEXT DEFAULT '',
    type              TEXT NOT NULL DEFAULT 'short',
    difficulty        TEXT NOT NULL DEFAULT 'medium',
    question_html     TEXT NOT NULL DEFAULT '',
    options           TEXT DEFAULT '',
    marks             INTEGER NOT NULL DEFAULT 0,
    status            TEXT NOT NULL DEFAULT 'active',
    is_global         BOOLEAN NOT NULL DEFAULT FALSE,
    approval_status   TEXT NOT NULL DEFAULT 'pending',
    approved_by       TEXT DEFAULT '',
    approved_at       TIMESTAMPTZ,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_questions_school ON questions(school_id);
CREATE INDEX IF NOT EXISTS idx_questions_class ON questions(class_id);
CREATE INDEX IF NOT EXISTS idx_questions_subject ON questions(subject_id);
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(type);
CREATE INDEX IF NOT EXISTS idx_questions_status ON questions(status);

-- ── Question Papers ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS question_papers (
    id            TEXT PRIMARY KEY,
    school_id     TEXT NOT NULL,
    title         TEXT NOT NULL,
    class_id      TEXT NOT NULL,
    class_name    TEXT DEFAULT '',
    subject_id    TEXT DEFAULT '',
    subject_name  TEXT DEFAULT '',
    chapter_ids   TEXT[] DEFAULT '{}',
    teacher_id    TEXT DEFAULT '',
    teacher_name  TEXT DEFAULT '',
    date          TEXT DEFAULT '',
    questions     TEXT DEFAULT '',
    status        TEXT NOT NULL DEFAULT 'draft',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_question_papers_school ON question_papers(school_id);
CREATE INDEX IF NOT EXISTS idx_question_papers_class ON question_papers(class_id);

-- ── Star Collections (per user starred questions) ───────────────────────
CREATE TABLE IF NOT EXISTS star_collections (
    id          TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL,
    school_id   TEXT NOT NULL,
    name        TEXT DEFAULT '',
    color       TEXT DEFAULT '',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_star_collections_user ON star_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_star_collections_school ON star_collections(school_id);

-- ── Paper Drafts (per teacher autosave) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS paper_drafts (
    user_id     TEXT PRIMARY KEY,
    school_id   TEXT NOT NULL,
    data        JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_paper_drafts_school ON paper_drafts(school_id);
