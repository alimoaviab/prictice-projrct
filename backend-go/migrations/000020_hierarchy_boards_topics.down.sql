-- Down Migration for Boards, Topics, and Import Logs (Version 20)

ALTER TABLE questions DROP COLUMN IF EXISTS topic_id;
ALTER TABLE questions DROP COLUMN IF EXISTS board_id;
ALTER TABLE subjects DROP COLUMN IF EXISTS class_id;
ALTER TABLE classes DROP COLUMN IF EXISTS board_id;

DROP TABLE IF EXISTS import_logs;
DROP TABLE IF EXISTS topics;
DROP TABLE IF EXISTS boards;
