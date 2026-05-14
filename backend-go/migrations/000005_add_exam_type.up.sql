-- Add type column to exams table to support Tests
ALTER TABLE exams ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'exam';
CREATE INDEX IF NOT EXISTS exams_type_idx ON exams (type);

-- Also add subject_id to results to support future flexibility, 
-- though it currently links to exams.id which includes the subject.
-- (Optional but good for robustness if we ever move to multi-subject exam records)
ALTER TABLE results ADD COLUMN IF NOT EXISTS subject_id TEXT;
