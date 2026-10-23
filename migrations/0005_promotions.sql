-- Add pricing snapshots without changing historical amounts, status or seller.
ALTER TABLE orders ADD COLUMN base_amount_cents INTEGER;
ALTER TABLE orders ADD COLUMN discount_cents INTEGER NOT NULL DEFAULT 0 CHECK(discount_cents >= 0);
ALTER TABLE orders ADD COLUMN discount_percent INTEGER NOT NULL DEFAULT 0 CHECK(discount_percent BETWEEN 0 AND 99);
ALTER TABLE orders ADD COLUMN promo_code TEXT;
ALTER TABLE orders ADD COLUMN promotion_kind TEXT;
ALTER TABLE orders ADD COLUMN issuer_code TEXT;
ALTER TABLE orders ADD COLUMN issuer_name TEXT;
ALTER TABLE orders ADD COLUMN pricing_version INTEGER;

CREATE TABLE promotion_rules (
  id TEXT PRIMARY KEY CHECK(id IN ('family','referral')),
  discount_percent INTEGER NOT NULL CHECK(discount_percent BETWEEN 1 AND 99),
  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
  starts_at INTEGER,
  ends_at INTEGER
);
CREATE TABLE promotion_codes (
  code TEXT PRIMARY KEY,
  rule_id TEXT NOT NULL REFERENCES promotion_rules(id),
  issuer_code TEXT NOT NULL,
  issuer_name TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1))
);
CREATE TABLE promotion_scopes (
  rule_id TEXT NOT NULL REFERENCES promotion_rules(id),
  event_id TEXT NOT NULL,
  ticket_type TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
  PRIMARY KEY(rule_id,event_id,ticket_type)
);
INSERT INTO promotion_rules(id,discount_percent) VALUES ('family',10),('referral',10);
INSERT INTO promotion_codes(code,rule_id,issuer_code,issuer_name) VALUES
 ('FAMILY10T','family','T','Тимур'),('FAMILY10K','family','K','Кристина'),
 ('FAMILY10S','family','S','Сергей'),('FAMILY10M','family','M','Марго'),('FAMILY10X','family','X','Максим'),
 ('FRIEND10T','referral','T','Тимур'),('FRIEND10K','referral','K','Кристина'),
 ('FRIEND10S','referral','S','Сергей'),('FRIEND10M','referral','M','Марго'),('FRIEND10X','referral','X','Максим');
INSERT INTO promotion_scopes(rule_id,event_id,ticket_type,active)
 SELECT id,'munich-games-2026-11-07','guest',1 FROM promotion_rules;
INSERT INTO promotion_scopes(rule_id,event_id,ticket_type,active)
 SELECT id,'munich-games-2026-11-07','guest_early',1 FROM promotion_rules;
-- Prepared for later activation; no VIP, host or archived event scope exists.
INSERT INTO promotion_scopes(rule_id,event_id,ticket_type,active)
 SELECT id,'nuremberg-2026-12-12','nuremberg_meetup',0 FROM promotion_rules;
