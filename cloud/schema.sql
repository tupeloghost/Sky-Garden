CREATE TABLE IF NOT EXISTS saves (
  id TEXT PRIMARY KEY,      -- SHA-256 of the player's private sync key
  updated INTEGER NOT NULL, -- when the save was made (ms since 1970)
  data TEXT NOT NULL        -- the garden, as JSON
);
-- Thank-you gifts: when a player's feedback leads to a change, they get coins and a note saying what changed.
CREATE TABLE IF NOT EXISTS thanks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  at INTEGER NOT NULL,
  player TEXT NOT NULL,     -- same short id as feedback.player
  feedback INTEGER,         -- the feedback note this answers
  note TEXT,                -- what they said (shortened)
  changed TEXT NOT NULL,    -- what changed in the game
  coins INTEGER NOT NULL DEFAULT 50,
  claimed INTEGER NOT NULL DEFAULT 0
);
-- Shared market: how much of each item every player sold at their crate, per day. Prices on each island move with these totals.
CREATE TABLE IF NOT EXISTS market_day (
  day TEXT NOT NULL,
  item TEXT NOT NULL,
  qty INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, item)
);
