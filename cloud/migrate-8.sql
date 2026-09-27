-- Mythical forms (secret), anonymous sightings and blessings, missions written by the creator.
ALTER TABLE tester_codes ADD COLUMN myth TEXT;   -- which legendary form this founder holds; only they and the creator know
CREATE TABLE IF NOT EXISTS sightings (id INTEGER PRIMARY KEY AUTOINCREMENT, at INTEGER NOT NULL, code TEXT NOT NULL, form TEXT NOT NULL, day TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS sightings_at ON sightings(at);
CREATE TABLE IF NOT EXISTS blessings (sighting INTEGER NOT NULL, player TEXT NOT NULL, at INTEGER NOT NULL, PRIMARY KEY (sighting, player));
CREATE TABLE IF NOT EXISTS cmissions (id INTEGER PRIMARY KEY AUTOINCREMENT, created INTEGER NOT NULL, audience TEXT NOT NULL, title TEXT NOT NULL, how TEXT, reward INTEGER NOT NULL DEFAULT 50, active INTEGER NOT NULL DEFAULT 1);
CREATE TABLE IF NOT EXISTS cmission_done (mission INTEGER NOT NULL, code TEXT NOT NULL, at INTEGER NOT NULL, note TEXT, PRIMARY KEY (mission, code));
