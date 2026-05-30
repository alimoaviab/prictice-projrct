-- Up Migration for Boards, Topics, and Import Logs (Version 20)

CREATE TABLE IF NOT EXISTS boards (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    code        TEXT NOT NULL UNIQUE,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS topics (
    id              TEXT PRIMARY KEY,
    chapter_id      TEXT NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    code            TEXT NOT NULL,
    description     TEXT NOT NULL DEFAULT '',
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS import_logs (
    id              TEXT PRIMARY KEY,
    school_id       TEXT REFERENCES schools(school_id) ON DELETE CASCADE,
    uploaded_by     TEXT REFERENCES users(id) ON DELETE SET NULL,
    file_name       TEXT NOT NULL,
    total_rows      INTEGER NOT NULL DEFAULT 0,
    success_rows    INTEGER NOT NULL DEFAULT 0,
    failed_rows     INTEGER NOT NULL DEFAULT 0,
    duplicates      INTEGER NOT NULL DEFAULT 0,
    duration        INTEGER NOT NULL DEFAULT 0,
    status          TEXT NOT NULL DEFAULT 'processing',
    failed_rows_csv TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Alter existing tables to add hierarchy links
ALTER TABLE classes ADD COLUMN IF NOT EXISTS board_id TEXT REFERENCES boards(id) ON DELETE SET NULL;
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS class_id TEXT REFERENCES classes(id) ON DELETE SET NULL;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS board_id TEXT REFERENCES boards(id) ON DELETE SET NULL;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS topic_id TEXT REFERENCES topics(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_classes_board ON classes(board_id) WHERE board_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_subjects_class ON subjects(class_id) WHERE class_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_topics_chapter ON topics(chapter_id);
CREATE INDEX IF NOT EXISTS idx_questions_board ON questions(board_id) WHERE board_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_questions_topic ON questions(topic_id) WHERE topic_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_import_logs_school ON import_logs(school_id) WHERE school_id IS NOT NULL;
