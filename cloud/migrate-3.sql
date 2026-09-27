-- Trading post and creator shops.
CREATE TABLE IF NOT EXISTS brands (
  id TEXT PRIMARY KEY,        -- SHA-256 of the player's sync key
  code TEXT NOT NULL,         -- friend code, so shoppers can visit
  shop TEXT NOT NULL,         -- shop name
  logo TEXT NOT NULL,         -- logo as JSON (shape, colors, symbol, letters)
  updated INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS brands_code ON brands(code);
CREATE TABLE IF NOT EXISTS listings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  seller_id TEXT NOT NULL, code TEXT NOT NULL,
  item TEXT NOT NULL, qty INTEGER NOT NULL,
  product TEXT,               -- a one-of-a-kind designed product, as JSON
  price INTEGER,              -- coins wanted, or
  want_item TEXT, want_qty INTEGER, -- items wanted in trade
  status TEXT NOT NULL DEFAULT 'open', -- open, sold, closed
  buyer_id TEXT, buyer_name TEXT,
  created INTEGER NOT NULL, paid INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS listings_open ON listings(status, created);
CREATE INDEX IF NOT EXISTS listings_seller ON listings(seller_id, status);
