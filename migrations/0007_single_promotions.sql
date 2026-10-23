-- General campaign configuration: quantity is a rule, not a code-prefix heuristic.
-- Copy existing configuration including disabled codes/scopes and validity dates.
-- Original promotion_* tables remain intact for rollback to the previous Worker.
-- Orders, payments, reservations and export receipts are never rewritten.
CREATE TABLE discount_campaigns (
  id TEXT PRIMARY KEY,
  discount_percent INTEGER NOT NULL CHECK(discount_percent BETWEEN 1 AND 99),
  quantity INTEGER NOT NULL CHECK(quantity IN (1,2)),
  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
  starts_at INTEGER,
  ends_at INTEGER
);
CREATE TABLE discount_codes (
  code TEXT PRIMARY KEY,
  rule_id TEXT NOT NULL REFERENCES discount_campaigns(id),
  issuer_code TEXT NOT NULL,
  issuer_name TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1))
);
CREATE TABLE discount_scopes (
  rule_id TEXT NOT NULL REFERENCES discount_campaigns(id),
  event_id TEXT NOT NULL,
  ticket_type TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
  PRIMARY KEY(rule_id,event_id,ticket_type)
);
INSERT INTO discount_campaigns(id,discount_percent,quantity,active,starts_at,ends_at)
  SELECT id,discount_percent,2,active,starts_at,ends_at FROM promotion_rules;
INSERT INTO discount_codes SELECT * FROM promotion_codes;
INSERT INTO discount_scopes SELECT * FROM promotion_scopes;
INSERT INTO discount_campaigns(id,discount_percent,quantity) VALUES ('promo',10,1);
INSERT INTO discount_codes(code,rule_id,issuer_code,issuer_name) VALUES
  ('PROMO10T','promo','T','Тимур'),('PROMO10K','promo','K','Кристина'),
  ('PROMO10S','promo','S','Сергей'),('PROMO10M','promo','M','Марго'),
  ('PROMO10X','promo','X','Максим');
INSERT INTO discount_scopes(rule_id,event_id,ticket_type,active) VALUES
  ('promo','munich-games-2026-11-07','guest',1),
  ('promo','munich-games-2026-11-07','guest_early',1),
  ('promo','nuremberg-2026-12-12','nuremberg_meetup',0);
