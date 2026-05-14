-- Add subjects JSONB column to classes table to store detailed subject information.
ALTER TABLE classes ADD COLUMN subjects JSONB NOT NULL DEFAULT '[]'::jsonb;
