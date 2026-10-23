import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { exportOrderPayment, reconcileSheetPayments } from '../worker/sheets';
import type { Deps, OrdersEnv } from '../worker/orders';

function setup() {
  const db = new DatabaseSync(':memory:');
  for (const name of [
    '0001_orders',
    '0002_host_registrations',
    '0003_sheet_exports',
    '0004_payment_account',
    '0005_promotions',
    '0006_promo_pairs',
    '0007_single_promotions',
  ])
    db.exec(readFileSync(`migrations/${name}.sql`, 'utf8'));
  const prepare = (sql: string): any => {
    let args: any[] = [];
    const stmt = {
      bind: (...values: any[]) => {
        args = values;
        return stmt;
      },
      run: async () => ({
        meta: { changes: Number(db.prepare(sql).run(...args).changes) },
      }),
      first: async () => db.prepare(sql).get(...args) ?? null,
      all: async () => ({ results: db.prepare(sql).all(...args) }),
    };
    return stmt;
  };
  const calls: any[] = [];
  let now = 1_790_000_000_000;
  let reply = 'ok';
  let status = 200;
  const deps: Deps = {
    now: () => now,
    fetch: (async (_url: any, init: any) => {
      calls.push(JSON.parse(init.body));
      return new Response(reply, { status });
    }) as typeof fetch,
  };
  const env: OrdersEnv = {
    ORDERS: { prepare } as any,
    SHEETS_TOKEN: 'test',
    SHEETS_WEBHOOK_URL: 'https://script.google.com/test',
  };
  const order = {
    id: 'order-1',
    ticket_type: 'nuremberg_meetup',
    customer_name: 'Test',
    contact_method: 'telegram',
    contact_value: '@test',
    email: null,
    amount_cents: 2900,
    paid_at: new Date(now).toISOString(),
  };
  const receipt = () => db.prepare('SELECT * FROM sheet_exports').get() as any;
  return {
    db,
    deps,
    env,
    order,
    calls,
    receipt,
    advance: (ms: number) => {
      now += ms;
    },
    fail: (text: string, code = 200) => {
      reply = text;
      status = code;
    },
  };
}

test('acknowledged sends are deduplicated, Nuremberg uses its own tab, unsafe cells are literals', async () => {
  const t = setup();
  await Promise.all([
    exportOrderPayment(t.env, t.deps, t.order),
    exportOrderPayment(t.env, t.deps, t.order),
  ]);
  await exportOrderPayment(t.env, t.deps, t.order);
  assert.equal(t.calls.length, 1);
  assert.equal(t.calls[0].tab, '12.12.26 - Nuernberg');
  assert.equal(t.calls[0].row[7], 29);
  assert.equal(t.calls[0].row[5], "'@test");
  assert.ok(t.receipt().delivered_at);
});

for (const [reply, code] of [
  ['forbidden', 200],
  ['<html>error</html>', 200],
  ['unavailable', 503],
] as const) {
  test(`failed Sheet acknowledgement ${reply} is retried and does not mark delivered`, async () => {
    const t = setup();
    t.fail(reply, code);
    await exportOrderPayment(t.env, t.deps, t.order);
    assert.equal(t.receipt().delivered_at, null);
    assert.equal(t.receipt().attempts, 1);
    await exportOrderPayment(t.env, t.deps, t.order);
    assert.equal(t.calls.length, 1);
    t.advance(60_001);
    t.fail('ok');
    await exportOrderPayment(t.env, t.deps, t.order);
    assert.ok(t.receipt().delivered_at);
    assert.equal(t.receipt().attempts, 2);
  });
}

test('cron backfills only paid orders, recovers missed sends, and leaves payment data unchanged', async () => {
  const t = setup();
  for (const [id, status] of [
    ['paid', 'paid'],
    ['pending', 'pending'],
    ['cancelled', 'cancelled'],
  ])
    t.db
      .prepare(
        `INSERT INTO orders(id,event_id,ticket_type,customer_name,contact_method,contact_value,amount_cents,status,paid_at)
      VALUES (?,'nuremberg-2026-12-12','nuremberg_meetup','Test','telegram','test',2900,?,?)`,
      )
      .run(id, status, t.order.paid_at);
  const before = t.db.prepare('SELECT * FROM orders ORDER BY id').all();
  await reconcileSheetPayments(t.env, t.deps);
  await reconcileSheetPayments(t.env, t.deps);
  assert.equal(t.calls.length, 1);
  assert.equal(t.calls[0].row[1], 'paid');
  assert.deepEqual(
    t.db.prepare('SELECT * FROM orders ORDER BY id').all(),
    before,
  );
});

test('cron recovers an expired delivery lease after an interrupted process', async () => {
  const t = setup();
  t.db
    .prepare(
      `INSERT INTO sheet_exports(export_id,attempts,next_attempt_at,lease_token)
    VALUES ('order:order-1',1,?,'abandoned')`,
    )
    .run(t.deps.now() + 120_000);
  await exportOrderPayment(t.env, t.deps, t.order);
  assert.equal(t.calls.length, 0);
  t.advance(120_001);
  await exportOrderPayment(t.env, t.deps, t.order);
  assert.equal(t.calls.length, 1);
  assert.ok(t.receipt().delivered_at);
});

test('cron recovers the exact promo snapshot in Q:V without duplicating a delivery', async () => {
  const t = setup();
  t.db
    .prepare(
      `INSERT INTO orders(id,event_id,ticket_type,customer_name,contact_method,contact_value,amount_cents,status,paid_at,
    base_amount_cents,discount_cents,discount_percent,promo_code,promotion_kind,issuer_name)
    VALUES ('discount','munich-games-2026-11-07','guest','Test','telegram','test',7200,'paid',?,8000,800,10,'FAMILY10K','family','Кристина')`,
    )
    .run(t.order.paid_at);
  await reconcileSheetPayments(t.env, t.deps);
  await reconcileSheetPayments(t.env, t.deps);
  assert.equal(t.calls.length, 1);
  assert.equal(t.calls[0].tab, '07.11.2026 - TI_München');
  assert.deepEqual(t.calls[0].row.slice(9, 16), ['', '', '', '', '', '', '']);
  assert.deepEqual(t.calls[0].row.slice(16), [
    80,
    10,
    8,
    'FAMILY10K',
    'Семейная',
    'Кристина',
    1,
    '',
  ]);
});

test('cron exports both participants and pair quantity from one paid order only once', async () => {
  const t = setup();
  t.db
    .prepare(
      `INSERT INTO orders(id,event_id,ticket_type,customer_name,contact_method,contact_value,amount_cents,status,paid_at,
    base_amount_cents,discount_cents,discount_percent,promo_code,promotion_kind,issuer_name,quantity,second_participant_name)
    VALUES ('pair','munich-games-2026-11-07','guest','First Person','telegram','test',14400,'paid',?,16000,1600,10,'FAMILY10K','family','Кристина',2,'Second Person')`,
    )
    .run(t.order.paid_at);
  await reconcileSheetPayments(t.env, t.deps);
  await reconcileSheetPayments(t.env, t.deps);
  assert.equal(t.calls.length, 1);
  assert.equal(t.calls[0].row[3], 'First Person');
  assert.equal(t.calls[0].row[7], 144);
  assert.deepEqual(t.calls[0].row.slice(16), [
    160,
    10,
    16,
    'FAMILY10K',
    'Семейная',
    'Кристина',
    2,
    'Second Person',
  ]);
});

test('cron restores the single promo snapshot once with quantity one and no second participant', async () => {
  const t = setup();
  t.db
    .prepare(
      `INSERT INTO orders(id,event_id,ticket_type,customer_name,contact_method,contact_value,amount_cents,status,paid_at,
    base_amount_cents,discount_cents,discount_percent,promo_code,promotion_kind,issuer_name,quantity)
    VALUES ('single','munich-games-2026-11-07','guest','Анна','telegram','test',7200,'paid',?,8000,800,10,'PROMO10S','promo','Сергей',1)`,
    )
    .run(t.order.paid_at);
  await reconcileSheetPayments(t.env, t.deps);
  await reconcileSheetPayments(t.env, t.deps);
  assert.equal(t.calls.length, 1);
  assert.equal(t.calls[0].row[7], 72);
  assert.deepEqual(t.calls[0].row.slice(16), [
    80,
    10,
    8,
    'PROMO10S',
    'Одиночная скидка',
    'Сергей',
    1,
    '',
  ]);
});
