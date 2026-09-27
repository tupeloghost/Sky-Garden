-- Founding Gardeners: private invite codes for testers.
CREATE TABLE IF NOT EXISTS tester_codes (
  code TEXT PRIMARY KEY,      -- like SKY-AB12-CD34
  label TEXT,                 -- who you gave it to (only you see this)
  created INTEGER NOT NULL,
  used_by TEXT,               -- hashed player id once redeemed
  used_at INTEGER
);
CREATE INDEX IF NOT EXISTS tester_used ON tester_codes(used_by);
