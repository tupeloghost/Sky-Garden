CREATE TABLE IF NOT EXISTS saves (
  id TEXT PRIMARY KEY,      -- SHA-256 of the player's private sync key
  updated INTEGER NOT NULL, -- when the save was made (ms since 1970)
  data TEXT NOT NULL        -- the garden, as JSON
);
