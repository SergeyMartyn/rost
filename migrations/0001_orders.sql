-- Orders for ticket sales. No card data or secrets are stored here.
CREATE TABLE IF NOT EXISTS orders (
  id                  TEXT PRIMARY KEY,                 -- our order id (UUID), sent to Stripe as client_reference_id
  event_id            TEXT NOT NULL,                    -- e.g. regensburg-2026-10-10
  ticket_type         TEXT NOT NULL,                    -- e.g. regensburg | games-participant | games-host
  customer_name       TEXT NOT NULL,
  contact_method      TEXT NOT NULL,                    -- telegram | instagram | whatsapp-phone | whatsapp-username
  contact_value       TEXT NOT NULL,
  email               TEXT,                             -- from Stripe Checkout (customer_details.email)
  amount_cents        INTEGER NOT NULL CHECK (amount_cents > 0),
  currency            TEXT NOT NULL DEFAULT 'EUR' CHECK (currency = 'EUR'),
  status              TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','paid','cancelled','refunded','failed')),
  provider            TEXT NOT NULL DEFAULT 'stripe' CHECK (provider IN ('stripe','paypal')),
  provider_session_id TEXT,                             -- Stripe Checkout Session id (cs_...)
  provider_payment_id TEXT,                             -- Stripe PaymentIntent id (pi_...)
  created_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  paid_at             TEXT,
  refunded_at         TEXT,
  cancelled_at        TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS orders_provider_session_uq ON orders(provider, provider_session_id) WHERE provider_session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS orders_payment_idx ON orders(provider_payment_id);
CREATE INDEX IF NOT EXISTS orders_event_status_idx ON orders(event_id, status);

-- Processed webhook events, for idempotency (repeat delivery must change nothing).
CREATE TABLE IF NOT EXISTS webhook_events (
  event_id    TEXT PRIMARY KEY,                         -- Stripe evt_...
  type        TEXT NOT NULL,
  order_id    TEXT,
  outcome     TEXT NOT NULL,                            -- applied | ignored | rejected:<reason>
  received_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
