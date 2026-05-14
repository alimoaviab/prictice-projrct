-- Fix homework table to match Go persistence expectations
ALTER TABLE homework 
    ADD COLUMN IF NOT EXISTS section TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'all',
    ADD COLUMN IF NOT EXISTS created_by TEXT,
    ADD COLUMN IF NOT EXISTS created_by_role TEXT NOT NULL DEFAULT 'admin';

-- Align attachments column name if necessary
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='homework' AND column_name='attachment_urls') THEN
        ALTER TABLE homework RENAME COLUMN attachment_urls TO attachments;
    END IF;
END $$;

-- Ensure constraints exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'homework_visibility_chk') THEN
        ALTER TABLE homework ADD CONSTRAINT homework_visibility_chk CHECK (visibility IN ('all','student','parent'));
    END IF;
END $$;
