-- Keep the original seller on every existing purchase. Apply only at the
-- coordinated release; changing active Stripe credentials must not reassign it.
ALTER TABLE orders ADD COLUMN payment_account TEXT NOT NULL DEFAULT 'margarita'
  CHECK (payment_account IN ('margarita','timur'));
ALTER TABLE host_registrations ADD COLUMN payment_account TEXT NOT NULL DEFAULT 'margarita'
  CHECK (payment_account IN ('margarita','timur'));
