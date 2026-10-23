import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { quotePrice } from '../worker/promotions';
import { TICKETS } from '../worker/tickets';

test('additive promo migration preserves old purchases and rounds a half cent consistently', async () => {
  const db = new DatabaseSync(':memory:');
  for (const file of [
    '0001_orders',
    '0002_host_registrations',
    '0003_sheet_exports',
    '0004_payment_account',
  ])
    db.exec(readFileSync(`migrations/${file}.sql`, 'utf8'));
  db.exec(`INSERT INTO orders(id,event_id,ticket_type,customer_name,contact_method,contact_value,amount_cents,status)
    VALUES ('old-paid','munich-games-2026-11-07','guest','Test','telegram','test',7000,'paid')`);
  const before = db
    .prepare('SELECT id,amount_cents,status,payment_account FROM orders')
    .get();
  db.exec(readFileSync('migrations/0005_promotions.sql', 'utf8'));
  db.exec(readFileSync('migrations/0006_promo_pairs.sql', 'utf8'));
  db.exec("UPDATE promotion_codes SET active=0 WHERE code='FRIEND10M'");
  db.exec(
    "UPDATE promotion_rules SET starts_at=100,ends_at=9000000000000 WHERE id='referral'",
  );
  const previousRules = db
    .prepare('SELECT * FROM promotion_rules ORDER BY id')
    .all();
  const previousCodes = db
    .prepare('SELECT * FROM promotion_codes ORDER BY code')
    .all();
  const previousScopes = db
    .prepare(
      'SELECT * FROM promotion_scopes ORDER BY rule_id,event_id,ticket_type',
    )
    .all();
  const previousOrders = db.prepare('SELECT * FROM orders').all();
  db.exec('PRAGMA foreign_keys=ON');
  db.exec(readFileSync('migrations/0007_single_promotions.sql', 'utf8'));
  assert.deepEqual(db.prepare('SELECT * FROM orders').all(), previousOrders);
  assert.deepEqual(
    db.prepare('SELECT * FROM promotion_rules ORDER BY id').all(),
    previousRules,
  );
  assert.deepEqual(
    db
      .prepare(
        "SELECT id,discount_percent,active,starts_at,ends_at FROM discount_campaigns WHERE id!='promo' ORDER BY id",
      )
      .all(),
    previousRules,
  );
  assert.deepEqual(
    db
      .prepare(
        "SELECT * FROM discount_codes WHERE rule_id!='promo' ORDER BY code",
      )
      .all(),
    previousCodes,
  );
  assert.deepEqual(
    db
      .prepare(
        "SELECT * FROM discount_scopes WHERE rule_id!='promo' ORDER BY rule_id,event_id,ticket_type",
      )
      .all(),
    previousScopes,
  );
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
  assert.equal(
    (db.prepare('SELECT count(*) n FROM discount_codes').get() as any).n,
    15,
  );
  assert.deepEqual(
    db
      .prepare('SELECT id,amount_cents,status,payment_account FROM orders')
      .get(),
    before,
  );
  const old: any = db.prepare('SELECT * FROM orders').get();
  assert.equal(old.base_amount_cents, null);
  assert.equal(old.discount_cents, 0);
  assert.equal(old.promo_code, null);
  assert.equal(
    (db.prepare('SELECT count(*) n FROM promotion_codes').get() as any).n,
    10,
  );
  const adapter: any = {
    prepare(sql: string) {
      let args: any[] = [];
      const statement = {
        bind(...values: any[]) {
          args = values;
          return statement;
        },
        async first() {
          return db.prepare(sql).get(...args) ?? null;
        },
      };
      return statement;
    },
  };
  const original = TICKETS.guest.amountCents;
  try {
    TICKETS.guest.amountCents = 8055;
    const q = await quotePrice(adapter, 'guest', 'FAMILY10T', Date.now());
    assert.equal(q.discountCents, 1612);
    assert.equal(q.amountCents, 14498);
  } finally {
    TICKETS.guest.amountCents = original;
    db.close();
  }
});
