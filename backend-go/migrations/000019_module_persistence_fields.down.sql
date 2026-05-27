DROP INDEX IF EXISTS leaves_school_class_idx;

ALTER TABLE leaves
    DROP COLUMN IF EXISTS class_name,
    DROP COLUMN IF EXISTS class_id;

ALTER TABLE behaviors
    DROP COLUMN IF EXISTS attachments,
    DROP COLUMN IF EXISTS category;
