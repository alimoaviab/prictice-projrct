-- Add term column to exams table to support filtering and grouping by academic terms
ALTER TABLE exams ADD COLUMN IF NOT EXISTS term TEXT NOT NULL DEFAULT '';
CREATE INDEX IF NOT EXISTS exams_term_idx ON exams (term);
