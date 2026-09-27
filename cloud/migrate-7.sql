-- Trust levels, activity history, proposals (world-shaping suggestions), council polls.
ALTER TABLE tester_codes ADD COLUMN level INTEGER NOT NULL DEFAULT 1;   -- 1 founder, 2 keeper, 3 elder keeper
ALTER TABLE tester_codes ADD COLUMN paused TEXT NOT NULL DEFAULT '[]'; -- privileges on hold, like ["propose","vote"]
ALTER TABLE tester_codes ADD COLUMN revoked INTEGER NOT NULL DEFAULT 0;
CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, at INTEGER NOT NULL, player TEXT, code TEXT, kind TEXT NOT NULL, detail TEXT);
CREATE INDEX IF NOT EXISTS events_code ON events(code, at);
CREATE TABLE IF NOT EXISTS proposals (id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT, kind TEXT NOT NULL, payload TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', created INTEGER NOT NULL, decided INTEGER);
ALTER TABLE polls ADD COLUMN audience TEXT NOT NULL DEFAULT 'all';   -- all, keepers, elders
