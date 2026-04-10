-- Ensure is_live column exists on sessions table
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS is_live BOOLEAN NOT NULL DEFAULT FALSE;

-- Enforce only one session can be live at a time
CREATE UNIQUE INDEX IF NOT EXISTS sessions_one_live_idx ON sessions (is_live) WHERE is_live = TRUE;
