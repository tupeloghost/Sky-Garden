-- Shared market: how much of each item every player sold at their crate, per day. Prices on each island move with these totals.
CREATE TABLE IF NOT EXISTS market_day (
  day TEXT NOT NULL,
  item TEXT NOT NULL,
  qty INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, item)
);
