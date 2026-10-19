-- Host game applications and the seven physical tables.
-- Card data is never stored here; payment details stay at the provider.
CREATE TABLE IF NOT EXISTS host_registrations (
  id                  TEXT PRIMARY KEY,
  event_id            TEXT NOT NULL,
  customer_name       TEXT NOT NULL,
  email               TEXT NOT NULL,
  contact_method      TEXT NOT NULL,
  contact_value       TEXT NOT NULL,
  game_title          TEXT NOT NULL,
  game_description    TEXT NOT NULL,
  format              TEXT NOT NULL CHECK (format IN ('standard','expanded')),
  media_package       INTEGER NOT NULL DEFAULT 0 CHECK (media_package IN (0,1)),
  deposit_requested   INTEGER NOT NULL DEFAULT 0 CHECK (deposit_requested IN (0,1)),
  total_cents         INTEGER NOT NULL CHECK (total_cents > 0),
  due_now_cents       INTEGER NOT NULL CHECK (due_now_cents > 0),
  remaining_cents     INTEGER NOT NULL CHECK (remaining_cents >= 0),
  amount_paid_cents   INTEGER NOT NULL DEFAULT 0 CHECK (amount_paid_cents >= 0),
  currency            TEXT NOT NULL DEFAULT 'EUR' CHECK (currency = 'EUR'),
  status              TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','paid','expired','cancelled','failed','refunded')),
  table_no            INTEGER,
  hold_expires_at     TEXT NOT NULL,
  provider            TEXT NOT NULL DEFAULT 'stripe' CHECK (provider = 'stripe'),
  provider_session_id TEXT,
  provider_payment_id TEXT,
  created_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  paid_at             TEXT,
  cancelled_at        TEXT,
  refunded_at         TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS host_registrations_provider_session_uq
  ON host_registrations(provider_session_id) WHERE provider_session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS host_registrations_payment_idx
  ON host_registrations(provider_payment_id);
CREATE INDEX IF NOT EXISTS host_registrations_status_idx
  ON host_registrations(status, hold_expires_at);

-- One row per physical table. The primary key plus the atomic UPDATE in the
-- worker is what prevents the last table from being assigned twice.
CREATE TABLE IF NOT EXISTS host_table_slots (
  slot_no         INTEGER PRIMARY KEY,
  registration_id TEXT,
  status          TEXT NOT NULL DEFAULT 'free' CHECK (status IN ('free','pending','paid')),
  expires_at      TEXT,
  updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS host_table_slots_registration_uq
  ON host_table_slots(registration_id) WHERE registration_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS host_table_slots_status_idx
  ON host_table_slots(status, expires_at);

INSERT INTO host_table_slots (slot_no, status)
VALUES (1,'free'),(2,'free'),(3,'free'),(4,'free'),(5,'free'),(6,'free'),(7,'free')
ON CONFLICT(slot_no) DO NOTHING;
