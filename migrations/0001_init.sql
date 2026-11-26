PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS admins (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS counters (
  id TEXT PRIMARY KEY,
  company_name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  role TEXT NOT NULL CHECK(role IN ('admin','counter')),
  account_id TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

INSERT OR IGNORE INTO settings(key,value) VALUES
 ('price_ringside','1800'),
 ('price_vip','1200'),
 ('price_grandstand','1000'),
 ('stadium_name','Aonang Landmark Boxing Stadium');

CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY,
  counter_id TEXT NOT NULL,
  counter_name TEXT NOT NULL,
  event_date TEXT NOT NULL,
  customer_name TEXT,
  payment_method TEXT NOT NULL CHECK(payment_method IN ('cash','transfer')),
  ticket_count INTEGER NOT NULL,
  total_amount INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY(counter_id) REFERENCES counters(id)
);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(event_date,created_at);
CREATE INDEX IF NOT EXISTS idx_sales_counter ON sales(counter_id,created_at);

CREATE TABLE IF NOT EXISTS tickets (
  id TEXT PRIMARY KEY,
  sale_id TEXT NOT NULL,
  event_date TEXT NOT NULL,
  seat_id TEXT NOT NULL,
  category TEXT NOT NULL,
  unit_price INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(event_date,seat_id),
  FOREIGN KEY(sale_id) REFERENCES sales(id)
);
CREATE INDEX IF NOT EXISTS idx_tickets_sale ON tickets(sale_id);
CREATE INDEX IF NOT EXISTS idx_tickets_event ON tickets(event_date,seat_id);
