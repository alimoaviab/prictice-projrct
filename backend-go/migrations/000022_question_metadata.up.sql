ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS syllabus TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS class_name TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS chapter_name TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS answer TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_questions_syllabus_class_subject
  ON questions (syllabus, class_name, subject_name);

CREATE INDEX IF NOT EXISTS idx_questions_chapter_name
  ON questions (chapter_name);
