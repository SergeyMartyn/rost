-- Delivery receipts only. Payment records and table reservations are untouched.
CREATE TABLE IF NOT EXISTS sheet_exports (
  export_id TEXT PRIMARY KEY,
  attempts INTEGER NOT NULL DEFAULT 0,
  next_attempt_at INTEGER NOT NULL DEFAULT 0,
  lease_token TEXT,
  delivered_at TEXT,
  last_error TEXT
);
