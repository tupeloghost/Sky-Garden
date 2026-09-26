-- Shared play: friend codes, gifts and waterings, community goals.
ALTER TABLE saves ADD COLUMN code TEXT;
UPDATE saves SET code = UPPER(SUBSTR(id, 1, 6));
CREATE INDEX IF NOT EXISTS saves_code ON saves(code);
CREATE TABLE IF NOT EXISTS gifts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  to_id TEXT NOT NULL, from_id TEXT NOT NULL, from_name TEXT,
  kind TEXT NOT NULL,        -- gift or water
  item TEXT,                 -- which item, for gifts
  day TEXT NOT NULL,         -- one of each kind per friend per day
  at INTEGER NOT NULL,
  claimed INTEGER NOT NULL DEFAULT 0,
  UNIQUE (to_id, from_id, kind, day)
);
CREATE TABLE IF NOT EXISTS community (goal TEXT PRIMARY KEY, count INTEGER NOT NULL DEFAULT 0);
