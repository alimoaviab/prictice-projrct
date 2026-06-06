DROP INDEX IF EXISTS idx_questions_chapter_name;
DROP INDEX IF EXISTS idx_questions_syllabus_class_subject;

ALTER TABLE questions
  DROP COLUMN IF EXISTS metadata,
  DROP COLUMN IF EXISTS answer,
  DROP COLUMN IF EXISTS chapter_name,
  DROP COLUMN IF EXISTS class_name,
  DROP COLUMN IF EXISTS syllabus;
