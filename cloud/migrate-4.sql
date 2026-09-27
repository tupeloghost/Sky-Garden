-- Safety for the trading post: reports, and hiding shops that get reported a lot.
ALTER TABLE brands ADD COLUMN hidden INTEGER NOT NULL DEFAULT 0;
CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reporter TEXT NOT NULL,     -- who reported (hashed id)
  code TEXT NOT NULL,         -- the shop's friend code
  listing INTEGER,            -- the listing, if it was about one item
  reason TEXT NOT NULL,       -- rude, personal, other
  at INTEGER NOT NULL,
  reviewed INTEGER NOT NULL DEFAULT 0,
  UNIQUE (reporter, code)
);
