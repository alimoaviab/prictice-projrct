-- Add marks and teacher columns to subjects table
ALTER TABLE subjects
    ADD COLUMN total_marks INTEGER NOT NULL DEFAULT 100,
    ADD COLUMN passing_marks INTEGER NOT NULL DEFAULT 33,
    ADD COLUMN teacher_id TEXT REFERENCES teachers(id) ON DELETE SET NULL;
