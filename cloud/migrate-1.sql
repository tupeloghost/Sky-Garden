-- Playtest support: when each player started, and feedback notes.
ALTER TABLE saves ADD COLUMN created INTEGER;
CREATE TABLE IF NOT EXISTS feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  at INTEGER NOT NULL,   -- when it was sent (ms since 1970)
  player TEXT,           -- short anonymous id, same player = same id
  mood TEXT,             -- love, okay, confused, bored
  note TEXT,
  place TEXT,            -- chapter and step they were on
  day INTEGER            -- in-game day
);
