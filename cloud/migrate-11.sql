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
