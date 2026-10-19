import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHmac } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { handleApi, type Deps, type OrdersEnv } from '../worker/orders';
import {
  HOST_DEPOSIT_CENTS,
  HOST_HOLD_MINUTES,
  HOST_TABLE_COUNT,
  HOST_FORMATS,
  hostPrice,
} from '../src/lib/host';

function makeD1() {
  const db = new DatabaseSync(':memory:');
  db.exec(readFileSync('migrations/0001_orders.sql', 'utf8'));
  db.exec(readFileSync('migrations/0002_host_registrations.sql', 'utf8'));
  const stmt = (sql: string) => {
    let args: unknown[] = [];
    const s: any = {
      bind: (...a: unknown[]) => ((args = a), s),
      _run: () => ({
        meta: {
          changes: Number(db.prepare(sql).run(...(args as any)).changes),
        },
      }),
      run: async () => s._run(),
      first: async () => db.prepare(sql).get(...(args as any)) ?? null,
      all: async () => ({ results: db.prepare(sql).all(...(args as any)) }),
    };
    return s;
  };
  return {
    db,
    prepare: stmt,
    batch: async (list: any[]) => {
      db.exec('BEGIN');
      try {
        const out = list.map((s) => s._run());
        db.exec('COMMIT');
        return out;
      } catch (e) {
        db.exec('ROLLBACK');
        throw e;
      }
    },
  };
}

const HOST = 'https://rost.sergeymartyn.workers.dev';
const WH_SECRET = 'whsec_host_test';
const T0 = 1_790_000_000_000;

function setup(over: Partial<OrdersEnv> = {}) {
  const d1 = makeD1();
  const stripeCalls: { body: URLSearchParams; headers: any }[] = [];
  const deps: Deps = {
    now: () => T0,
    fetch: (async (url: string, init: any) => {
      assert.match(String(url), /api\.stripe\.com/);
      stripeCalls.push({
        body: new URLSearchParams(init.body),
        headers: init.headers,
      });
      const n = stripeCalls.length;
      return new Response(
        JSON.stringify({
          id: `cs_host_${n}`,
          url: `https://checkout.stripe.com/c/pay/cs_host_${n}`,
        }),
        { status: 200 },
      );
    }) as any,
  };
  const env: OrdersEnv = {
    ORDERS: d1 as any,
    ORDERS_ENV: 'test',
    PAYMENTS_ENABLED: 'true',
    stripe_test: 'sk_test_host',
    STRIPE_WEBHOOK_SECRET: WH_SECRET,
    ADMIN_TOKEN: 'host-admin',
    ...over,
  };
  const pending: Promise<unknown>[] = [];
  const ctx = { waitUntil: (p: Promise<unknown>) => void pending.push(p) };
  const api = (req: Request) => handleApi(req, env, ctx, deps);
  return { d1, env, deps, api, stripeCalls };
}

const hostReq = (body: object, host = HOST) =>
  new Request(`${host}/api/host-registrations`, {
    method: 'POST',
    headers: { Origin: host, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

const goodBody = (extra: object = {}) => ({
  name: 'Мария Тест',
  email: 'maria@example.com',
  channel: 'Telegram',
  contact: '@maria_test',
  gameTitle: 'Путь к себе',
  gameDescription: 'Игра о выборе следующего шага и внутренней опоре.',
  format: 'standard',
  media: false,
  deposit: false,
  terms: true,
  privacy: true,
  lang: 'ru',
  ...extra,
});

const statusReq = (id: string) =>
  new Request(`${HOST}/api/host-registrations/${id}`);

function signedEvent(
  type: string,
  object: object,
  id: string,
  t = Math.floor(T0 / 1000),
) {
  const body = JSON.stringify({ id, type, data: { object } });
  const sig = createHmac('sha256', WH_SECRET).update(`${t}.${body}`).digest('hex');
  return new Request(`${HOST}/api/stripe/webhook`, {
    method: 'POST',
    headers: { 'Stripe-Signature': `t=${t},v1=${sig}` },
    body,
  });
}

async function create(t: ReturnType<typeof setup>, extra: object = {}) {
  const res = await t.api(hostReq(goodBody(extra)));
  const data = (await res.json()) as any;
  assert.equal(res.status, 200, JSON.stringify(data));
  const id = t.stripeCalls.at(-1)!.body.get('client_reference_id')!;
  return { id, data, session: `cs_host_${t.stripeCalls.length}` };
}

function paidSession(
  id: string,
  session: string,
  amount: number,
  over: object = {},
) {
  return {
    id: session,
    client_reference_id: id,
    payment_status: 'paid',
    currency: 'eur',
    amount_total: amount,
    payment_intent: 'pi_host_1',
    metadata: { kind: 'host-registration', host_registration_id: id },
    ...over,
  };
}

const row = (t: ReturnType<typeof setup>, id: string): any =>
  t.d1.db.prepare('SELECT * FROM host_registrations WHERE id=?').get(id);

test('pricing: four totals, deposit changes only the amount due now', () => {
  assert.deepEqual(hostPrice('standard', false, false), {
    totalCents: 24900,
    dueNowCents: 24900,
    remainingCents: 0,
  });
  assert.deepEqual(hostPrice('standard', true, false), {
    totalCents: 32800,
    dueNowCents: 32800,
    remainingCents: 0,
  });
  assert.deepEqual(hostPrice('expanded', false, false), {
    totalCents: 34900,
    dueNowCents: 34900,
    remainingCents: 0,
  });
  assert.deepEqual(hostPrice('expanded', true, true), {
    totalCents: 42800,
    dueNowCents: 5000,
    remainingCents: 37800,
  });
  assert.equal(HOST_FORMATS.standard.amountCents, 24900);
  assert.equal(HOST_FORMATS.expanded.amountCents, 34900);
  assert.equal(HOST_DEPOSIT_CENTS, 5000);
  assert.equal(HOST_TABLE_COUNT, 7);
  assert.equal(HOST_HOLD_MINUTES, 30);
});

test('application is saved unpaid, reserves a table and is confirmed only by a webhook', async () => {
  const t = setup();
  const { id, data, session } = await create(t);
  assert.equal(data.tableNo, 1);
  assert.equal(data.totalCents, 24900);
  assert.equal(data.dueNowCents, 24900);
  assert.equal(data.remainingCents, 0);

  const call = t.stripeCalls[0];
  assert.equal(
    call.body.get('line_items[0][price_data][unit_amount]'),
    '24900',
  );
  assert.equal(call.body.get('line_items[0][price_data][currency]'), 'eur');
  assert.equal(call.body.get('metadata[kind]'), 'host-registration');
  assert.equal(call.body.get('metadata[host_registration_id]'), id);
  assert.equal(call.body.get('payment_intent_data[metadata][host_registration_id]'), id);
  assert.match(call.body.get('success_url')!, /payment=success/);
  assert.match(call.body.get('cancel_url')!, /payment=cancelled/);
  assert.ok(Number(call.body.get('expires_at')) >= Math.floor(T0 / 1000) + 1800);

  let saved = row(t, id);
  assert.equal(saved.status, 'pending');
  assert.equal(saved.table_no, 1);
  assert.equal(saved.total_cents, 24900);
  assert.equal(saved.amount_paid_cents, 0);
  assert.equal(saved.email, 'maria@example.com');
  assert.ok(saved.game_title);
  assert.equal(saved.media_package, 0);
  assert.equal(saved.deposit_requested, 0);
  const slot = t.d1.db
    .prepare('SELECT * FROM host_table_slots WHERE slot_no=1')
    .get() as any;
  assert.equal(slot.registration_id, id);
  assert.equal(slot.status, 'pending');
  assert.equal(slot.expires_at, new Date(T0 + 30 * 60_000).toISOString());

  const pending = await t.api(statusReq(id));
  assert.equal(pending.status, 200);
  assert.equal(((await pending.json()) as any).status, 'pending');
  assert.equal(((await (await t.api(statusReq(id))).json()) as any).placeConfirmed, false);

  const wh = await t.api(
    signedEvent(
      'checkout.session.completed',
      paidSession(id, session, 24900),
      'evt_host_paid',
    ),
  );
  assert.equal(wh.status, 200);
  saved = row(t, id);
  assert.equal(saved.status, 'paid');
  assert.equal(saved.amount_paid_cents, 24900);
  assert.equal(saved.provider_payment_id, 'pi_host_1');
  assert.ok(saved.paid_at);
  assert.equal(saved.table_no, 1);
  const paidSlot = t.d1.db
    .prepare('SELECT * FROM host_table_slots WHERE slot_no=1')
    .get() as any;
  assert.equal(paidSlot.status, 'paid');
  assert.equal(paidSlot.expires_at, null);

  const confirmed = (await (await t.api(statusReq(id))).json()) as any;
  assert.equal(confirmed.status, 'paid');
  assert.equal(confirmed.tableNo, 1);
  assert.equal(confirmed.placeConfirmed, true);

  const duplicate = await t.api(
    signedEvent(
      'checkout.session.completed',
      paidSession(id, session, 24900),
      'evt_host_paid',
    ),
  );
  assert.equal(((await duplicate.json()) as any).duplicate, true);
  assert.equal(t.d1.db.prepare('SELECT COUNT(*) c FROM host_registrations').get()!.c, 1);
});

test('expanded format with media and deposit stores 428 / 50 / 378', async () => {
  const t = setup();
  const { id, session } = await create(t, {
    format: 'expanded',
    media: true,
    deposit: true,
  });
  assert.equal(
    t.stripeCalls[0].body.get('line_items[0][price_data][unit_amount]'),
    '5000',
  );
  const saved = row(t, id);
  assert.equal(saved.total_cents, 42800);
  assert.equal(saved.due_now_cents, 5000);
  assert.equal(saved.remaining_cents, 37800);
  assert.equal(saved.media_package, 1);
  assert.equal(saved.deposit_requested, 1);
  await t.api(
    signedEvent(
      'checkout.session.completed',
      paidSession(id, session, 5000),
      'evt_deposit',
    ),
  );
  const paid = row(t, id);
  assert.equal(paid.status, 'paid');
  assert.equal(paid.amount_paid_cents, 5000);
  assert.equal(paid.remaining_cents, 37800);
});

test('the eighth simultaneous application is rejected and tables are unique', async () => {
  assert.equal(HOST_TABLE_COUNT, 7);
  const t = setup();
  const results = await Promise.all(
    Array.from({ length: 8 }, (_, index) =>
      t.api(hostReq(goodBody({ name: `Ведущий ${index + 1}` }))),
    ),
  );
  const statuses = results.map((response) => response.status).sort();
  assert.deepEqual(statuses, [200, 200, 200, 200, 200, 200, 200, 409]);
  assert.equal(t.stripeCalls.length, 7);
  assert.equal(
    t.d1.db.prepare('SELECT COUNT(*) c FROM host_registrations').get()!.c,
    7,
  );
  const tables = t.d1.db
    .prepare('SELECT table_no FROM host_registrations ORDER BY table_no')
    .all() as any[];
  assert.deepEqual(
    tables.map((r) => r.table_no),
    [1, 2, 3, 4, 5, 6, 7],
  );
  const soldOut = results.find((r) => r.status === 409)!;
  assert.equal(((await soldOut.json()) as any).error, 'sold_out');
});

test('an unpaid hold expires after 30 minutes, frees the table and keeps the application', async () => {
  const t = setup();
  const first = await create(t);
  t.deps.now = () => T0 + 30 * 60_000 + 1;
  const after = (await (await t.api(statusReq(first.id))).json()) as any;
  assert.equal(after.status, 'expired');
  assert.equal(after.placeConfirmed, false);
  const saved = row(t, first.id);
  assert.equal(saved.status, 'expired');
  assert.equal(saved.game_title, 'Путь к себе');
  const slot = t.d1.db
    .prepare('SELECT * FROM host_table_slots WHERE slot_no=1')
    .get() as any;
  assert.equal(slot.registration_id, null);
  assert.equal(slot.status, 'free');

  const second = await create(t);
  assert.equal(second.data.tableNo, 1);
  const availability = (await (
    await t.api(new Request(`${HOST}/api/host-registrations/availability`))
  ).json()) as any;
  assert.equal(availability.freeTables, 6);
  assert.equal(availability.totalTables, 7);
  assert.equal(availability.registrationOpen, true);
});

test('amount, currency and session mismatches leave the application pending', async () => {
  const t = setup();
  const { id, session } = await create(t);
  await t.api(
    signedEvent(
      'checkout.session.completed',
      paidSession(id, session, 100),
      'evt_bad_amount',
    ),
  );
  await t.api(
    signedEvent(
      'checkout.session.completed',
      paidSession(id, session, 24900, { currency: 'usd' }),
      'evt_bad_currency',
    ),
  );
  await t.api(
    signedEvent(
      'checkout.session.completed',
      paidSession(id, 'cs_other', 24900),
      'evt_bad_session',
    ),
  );
  assert.equal(row(t, id).status, 'pending');
  assert.equal(row(t, id).amount_paid_cents, 0);
  const outcomes = t.d1.db
    .prepare('SELECT outcome FROM webhook_events WHERE order_id=? ORDER BY event_id')
    .all(id) as any[];
  assert.deepEqual(
    outcomes.map((o) => o.outcome),
    [
      'rejected:amount_mismatch',
      'rejected:currency_mismatch',
      'rejected:session_mismatch',
    ],
  );
  await t.api(
    signedEvent(
      'checkout.session.completed',
      paidSession(id, session, 24900),
      'evt_good',
    ),
  );
  assert.equal(row(t, id).status, 'paid');
});

test('an expired checkout releases the table; a late payment can still take a free one', async () => {
  const t = setup();
  const first = await create(t);
  await t.api(
    signedEvent(
      'checkout.session.expired',
      {
        id: first.session,
        metadata: {
          kind: 'host-registration',
          host_registration_id: first.id,
        },
      },
      'evt_expired',
    ),
  );
  assert.equal(row(t, first.id).status, 'expired');
  const slot = t.d1.db
    .prepare('SELECT * FROM host_table_slots WHERE slot_no=1')
    .get() as any;
  assert.equal(slot.registration_id, null);

  t.deps.now = () => T0 + 40 * 60_000;
  await t.api(
    signedEvent(
      'checkout.session.async_payment_succeeded',
      paidSession(first.id, first.session, 24900),
      'evt_late',
      Math.floor((T0 + 40 * 60_000) / 1000),
    ),
  );
  const late = row(t, first.id);
  assert.equal(late.status, 'paid');
  assert.equal(late.table_no, 1);
  assert.equal(late.amount_paid_cents, 24900);
});

test('a late payment without a free table is recorded but no table is double-booked', async () => {
  const t = setup();
  const first = await create(t);
  t.deps.now = () => T0 + 30 * 60_000 + 1;
  await t.api(statusReq(first.id));
  for (let i = 0; i < 7; i++) await create(t, { name: `Гость ${i}` });
  const rows = t.d1.db
    .prepare(
      "SELECT * FROM host_registrations WHERE status='pending' AND id<>?",
    )
    .all(first.id) as any[];
  for (let i = 0; i < rows.length; i++) {
    await t.api(
      signedEvent(
        'checkout.session.completed',
        paidSession(
          rows[i].id,
          rows[i].provider_session_id,
          rows[i].due_now_cents,
        ),
        `evt_full_${i}`,
        Math.floor((T0 + 30 * 60_000 + 2) / 1000),
      ),
    );
  }
  assert.equal(
    t.d1.db.prepare("SELECT COUNT(*) c FROM host_table_slots WHERE status='paid'").get()!.c,
    7,
  );
  await t.api(
    signedEvent(
      'checkout.session.async_payment_succeeded',
      paidSession(first.id, first.session, 24900),
      'evt_late_no_table',
      Math.floor((T0 + 30 * 60_000 + 3) / 1000),
    ),
  );
  const late = row(t, first.id);
  assert.equal(late.status, 'paid');
  assert.equal(late.table_no, null);
  const outcome = t.d1.db
    .prepare('SELECT outcome FROM webhook_events WHERE event_id=?')
    .get('evt_late_no_table') as any;
  assert.equal(outcome.outcome, 'applied:paid_without_table');
  assert.equal(
    t.d1.db.prepare("SELECT COUNT(*) c FROM host_table_slots WHERE status='paid'").get()!.c,
    7,
  );
});

test('invalid host input is rejected and no application is stored', async () => {
  const t = setup();
  for (const body of [
    goodBody({ format: 'vip' }),
    goodBody({ email: 'not-an-email' }),
    goodBody({ contact: 'кириллица' }),
    goodBody({ gameTitle: 'x' }),
    goodBody({ gameDescription: 'short' }),
    goodBody({ terms: false }),
    goodBody({ privacy: false }),
  ]) {
    assert.equal((await t.api(hostReq(body))).status, 400);
  }
  assert.equal(
    (await t.api(hostReq(goodBody(), 'https://evil.example'))).status,
    403,
  );
  assert.equal(
    t.d1.db.prepare('SELECT COUNT(*) c FROM host_registrations').get()!.c,
    0,
  );
  assert.equal(t.stripeCalls.length, 0);
});

test('host registration is unavailable without a matching Stripe test key', async () => {
  const t = setup({ stripe_test: undefined });
  assert.equal((await t.api(hostReq(goodBody()))).status, 503);
  assert.equal(
    t.d1.db.prepare('SELECT COUNT(*) c FROM host_registrations').get()!.c,
    0,
  );
});

test('the manual switch closes new applications and disables availability', async () => {
  const t = setup({ HOST_REGISTRATION_OPEN: 'false' });
  const res = await t.api(hostReq(goodBody()));
  assert.equal(res.status, 409);
  assert.equal(((await res.json()) as any).error, 'registration_closed');
  assert.equal(
    t.d1.db.prepare('SELECT COUNT(*) c FROM host_registrations').get()!.c,
    0,
  );
  assert.equal(t.stripeCalls.length, 0);
  const availability = (await (
    await t.api(new Request(`${HOST}/api/host-registrations/availability`))
  ).json()) as any;
  assert.equal(availability.registrationOpen, false);
  assert.equal(availability.freeTables, 7);
});

test('status endpoint does not reveal unknown registrations', async () => {
  const t = setup();
  const res = await t.api(statusReq('00000000-0000-0000-0000-000000000000'));
  assert.equal(res.status, 404);
});

test('admin CSV lists applications with the amount paid and the remainder', async () => {
  const t = setup();
  const { id } = await create(t, {
    format: 'expanded',
    media: true,
    deposit: true,
  });
  const get = (headers: Record<string, string> = {}) =>
    t.api(
      new Request(`${HOST}/api/admin/host-registrations.csv`, { headers }),
    );
  assert.equal((await get()).status, 401);
  const response = await get({ Authorization: 'Bearer host-admin' });
  assert.equal(response.status, 200);
  const csv = await response.text();
  assert.match(csv, /remaining_cents/);
  assert.match(csv, new RegExp(id));
  assert.match(csv, /42800/);
  assert.match(csv, /5000/);
  assert.match(csv, /37800/);
});
