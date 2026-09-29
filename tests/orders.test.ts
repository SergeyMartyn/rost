import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHmac } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { handleApi, type Deps, type OrdersEnv } from '../worker/orders';

// Real SQL (the real migration file) behind a tiny D1-compatible adapter.
function makeD1() {
  const db = new DatabaseSync(':memory:');
  db.exec(readFileSync('migrations/0001_orders.sql', 'utf8'));
  const stmt = (sql: string) => {
    let args: unknown[] = [];
    const s: any = {
      bind: (...a: unknown[]) => ((args = a), s),
      _run: () => ({ meta: { changes: Number(db.prepare(sql).run(...(args as any)).changes) } }),
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
const WH_SECRET = 'whsec_test_123';
const T0 = 1_790_000_000_000;

function setup(over: Partial<OrdersEnv> = {}) {
  const d1 = makeD1();
  const stripeCalls: { body: URLSearchParams; headers: any }[] = [];
  const sheetCalls: any[] = [];
  const deps: Deps = {
    now: () => T0,
    fetch: (async (url: string, init: any) => {
      if (String(url).includes('api.stripe.com')) {
        const body = new URLSearchParams(init.body);
        stripeCalls.push({ body, headers: init.headers });
        const n = stripeCalls.length;
        return new Response(JSON.stringify({ id: `cs_test_${n}`, url: `https://checkout.stripe.com/c/pay/cs_test_${n}` }), { status: 200 });
      }
      sheetCalls.push(JSON.parse(init.body));
      return new Response('ok');
    }) as any,
  };
  const env: OrdersEnv = {
    ORDERS: d1 as any,
    ORDERS_ENV: 'test',
    PAYMENTS_ENABLED: 'true',
    stripe_test: 'sk_test_abc',
    STRIPE_WEBHOOK_SECRET: WH_SECRET,
    ADMIN_TOKEN: 'admin-secret',
    SHEETS_WEBHOOK_URL: 'https://script.google.com/macros/s/x/exec',
    SHEETS_TOKEN: 'sheet-token',
    ...over,
  };
  const pending: Promise<unknown>[] = [];
  const ctx = { waitUntil: (p: Promise<unknown>) => void pending.push(p) };
  const api = (req: Request) => handleApi(req, env, ctx, deps);
  const flush = () => Promise.all(pending.splice(0));
  return { d1, env, deps, api, flush, stripeCalls, sheetCalls };
}

const orderReq = (body: object, host = HOST) =>
  new Request(`${host}/api/orders`, {
    method: 'POST',
    headers: { Origin: host, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
const goodBody = (ticket: string, extra: object = {}) => ({
  ticket, name: 'Анна Тест', channel: 'Telegram', contact: '@anna_test', lang: 'ru', consent: true, ...extra,
});

function signedEvent(type: string, object: object, id = 'evt_1', t = Math.floor(T0 / 1000), secret = WH_SECRET) {
  const body = JSON.stringify({ id, type, data: { object } });
  const sig = createHmac('sha256', secret).update(`${t}.${body}`).digest('hex');
  return new Request(`${HOST}/api/stripe/webhook`, {
    method: 'POST',
    headers: { 'Stripe-Signature': `t=${t},v1=${sig}` },
    body,
  });
}
const row = (t: ReturnType<typeof setup>, id: string): any =>
  t.d1.db.prepare('SELECT * FROM orders WHERE id=?').get(id);
async function createOrder(t: ReturnType<typeof setup>, ticket: string) {
  const res = await t.api(orderReq(goodBody(ticket)));
  assert.equal(res.status, 200);
  const id = t.stripeCalls.at(-1)!.body.get('client_reference_id')!;
  return { id, session: `cs_test_${t.stripeCalls.length}` };
}
const paidSession = (id: string, session: string, amount: number, over: object = {}) => ({
  id: session, client_reference_id: id, payment_status: 'paid', currency: 'eur', amount_total: amount,
  payment_intent: 'pi_1', customer_details: { email: 'buyer@example.com' }, ...over,
});

for (const [ticket, cents] of [['meetup', 2900], ['guest', 9900], ['host', 24900]] as const) {
  test(`ticket ${ticket}: server-side price ${cents / 100} EUR, pending → paid`, async () => {
    const t = setup();
    // The browser tries to send its own amount: it must be ignored.
    const res = await t.api(orderReq(goodBody(ticket, { amount: 1, amount_cents: 1, price: 0.01 })));
    assert.equal(res.status, 200);
    const call = t.stripeCalls[0];
    assert.equal(call.body.get('line_items[0][price_data][unit_amount]'), String(cents));
    assert.equal(call.body.get('line_items[0][price_data][currency]'), 'eur');
    assert.equal(call.body.get('payment_method_types[0]'), 'card');
    assert.ok(call.headers.Authorization.startsWith('Bearer sk_test_'));
    const id = call.body.get('client_reference_id')!;
    let o = row(t, id);
    assert.equal(o.status, 'pending');
    assert.equal(o.amount_cents, cents);
    assert.equal(o.provider_session_id, 'cs_test_1');
    assert.equal(o.email, null);

    const wh = await t.api(signedEvent('checkout.session.completed', paidSession(id, 'cs_test_1', cents)));
    assert.equal(wh.status, 200);
    await t.flush();
    o = row(t, id);
    assert.equal(o.status, 'paid');
    assert.equal(o.email, 'buyer@example.com');
    assert.equal(o.provider_payment_id, 'pi_1');
    assert.ok(o.paid_at);
    assert.equal(t.sheetCalls.length, 1);
    assert.equal(t.sheetCalls[0].row[7], cents / 100);
  });
}

test('cancelled payment: expired session → cancelled, never paid', async () => {
  const t = setup();
  const { id, session } = await createOrder(t, 'meetup');
  await t.api(signedEvent('checkout.session.expired', { id: session, client_reference_id: id }, 'evt_exp'));
  const o = row(t, id);
  assert.equal(o.status, 'cancelled');
  assert.ok(o.cancelled_at);
  assert.equal(t.sheetCalls.length, 0);
});

test('repeated webhook: no duplicate, no second change, no second sheet row', async () => {
  const t = setup();
  const { id, session } = await createOrder(t, 'guest');
  const ev = () => signedEvent('checkout.session.completed', paidSession(id, session, 9900), 'evt_same');
  assert.equal((await t.api(ev())).status, 200);
  await t.flush();
  const first = row(t, id);
  const again = await t.api(ev());
  assert.equal(again.status, 200);
  assert.equal(((await again.json()) as any).duplicate, true);
  await t.flush();
  assert.deepEqual(row(t, id), first);
  assert.equal(t.sheetCalls.length, 1);
  assert.equal(t.d1.db.prepare('SELECT COUNT(*) c FROM orders').get()!.c, 1);
  // A different event for the same, already paid session must not re-apply either.
  await t.api(signedEvent('checkout.session.async_payment_succeeded', paidSession(id, session, 9900), 'evt_other'));
  await t.flush();
  assert.deepEqual(row(t, id), first);
  assert.equal(t.sheetCalls.length, 1);
});

test('amount mismatch: order stays pending, rejection recorded', async () => {
  const t = setup();
  const { id, session } = await createOrder(t, 'host');
  const res = await t.api(signedEvent('checkout.session.completed', paidSession(id, session, 100), 'evt_bad'));
  assert.equal(res.status, 200); // acknowledged so Stripe does not retry forever
  await t.flush();
  assert.equal(row(t, id).status, 'pending');
  assert.equal(row(t, id).paid_at, null);
  const ev: any = t.d1.db.prepare('SELECT outcome FROM webhook_events WHERE event_id=?').get('evt_bad');
  assert.equal(ev.outcome, 'rejected:amount_mismatch');
  assert.equal(t.sheetCalls.length, 0);
});

test('currency / session / unknown order mismatches are rejected', async () => {
  const t = setup();
  const { id, session } = await createOrder(t, 'meetup');
  await t.api(signedEvent('checkout.session.completed', paidSession(id, session, 2900, { currency: 'usd' }), 'e1'));
  await t.api(signedEvent('checkout.session.completed', paidSession(id, 'cs_other', 2900), 'e2'));
  await t.api(signedEvent('checkout.session.completed', paidSession('nope', session, 2900), 'e3'));
  assert.equal(row(t, id).status, 'pending');
  const outs = t.d1.db.prepare('SELECT event_id,outcome FROM webhook_events ORDER BY event_id').all() as any[];
  assert.deepEqual(outs.map((o) => o.outcome), ['rejected:currency_mismatch', 'rejected:session_mismatch', 'rejected:unknown_order']);
});

test('refund is a separate event: paid → refunded (partial refund ignored)', async () => {
  const t = setup();
  const { id, session } = await createOrder(t, 'meetup');
  await t.api(signedEvent('charge.refunded', { payment_intent: 'pi_1', refunded: true }, 'r0'));
  assert.equal(row(t, id).status, 'pending'); // not paid yet: nothing to refund
  await t.api(signedEvent('checkout.session.completed', paidSession(id, session, 2900), 'p1'));
  await t.api(signedEvent('charge.refunded', { payment_intent: 'pi_1', refunded: false, amount_refunded: 500 }, 'r1'));
  assert.equal(row(t, id).status, 'paid');
  await t.api(signedEvent('charge.refunded', { payment_intent: 'pi_1', refunded: true }, 'r2'));
  const o = row(t, id);
  assert.equal(o.status, 'refunded');
  assert.ok(o.refunded_at);
});

test('webhook signature: bad secret and stale timestamp are rejected', async () => {
  const t = setup();
  const { id, session } = await createOrder(t, 'meetup');
  const obj = paidSession(id, session, 2900);
  assert.equal((await t.api(signedEvent('checkout.session.completed', obj, 'x1', undefined, 'whsec_wrong'))).status, 400);
  assert.equal((await t.api(signedEvent('checkout.session.completed', obj, 'x2', Math.floor(T0 / 1000) - 3600))).status, 400);
  assert.equal((await t.api(new Request(`${HOST}/api/stripe/webhook`, { method: 'POST', body: '{}' }))).status, 400);
  assert.equal(row(t, id).status, 'pending');
});

test('input validation: unknown ticket, bad contact, no consent, wrong origin', async () => {
  const t = setup();
  assert.equal((await t.api(orderReq(goodBody('vip')))).status, 400);
  assert.equal((await t.api(orderReq(goodBody('meetup', { contact: 'ab' })))).status, 400);
  assert.equal((await t.api(orderReq(goodBody('meetup', { consent: false })))).status, 400);
  const evil = new Request(`${HOST}/api/orders`, { method: 'POST', headers: { Origin: 'https://evil.example' }, body: JSON.stringify(goodBody('meetup')) });
  assert.equal((await t.api(evil)).status, 403);
  assert.equal(t.d1.db.prepare('SELECT COUNT(*) c FROM orders').get()!.c, 0);
});

test('test payments are unavailable on the public domain and with wrong key mode', async () => {
  const t = setup();
  const pub = 'https://rost.community';
  assert.equal((await t.api(orderReq(goodBody('meetup'), pub))).status, 403);
  assert.equal((await setup({ PAYMENTS_ENABLED: 'false' }).api(orderReq(goodBody('meetup')))).status, 403);
  // a live key in the test environment is refused
  const mix = setup({ stripe_test: 'sk_live_zzz' });
  assert.equal((await mix.api(orderReq(goodBody('meetup')))).status, 503);
});

test('stripe outage marks the order failed', async () => {
  const t = setup();
  t.deps.fetch = (async () => new Response('{}', { status: 500 })) as any;
  assert.equal((await t.api(orderReq(goodBody('meetup')))).status, 502);
  assert.equal((t.d1.db.prepare('SELECT status FROM orders').get() as any).status, 'failed');
});

test('admin CSV: token required, formulas neutralised, no public list', async () => {
  const t = setup();
  await t.api(orderReq(goodBody('meetup', { name: '=HYPERLINK("http://x")' })));
  const get = (h: Record<string, string> = {}) => t.api(new Request(`${HOST}/api/admin/orders.csv`, { headers: h }));
  assert.equal((await get()).status, 401);
  assert.equal((await get({ Authorization: 'Bearer nope' })).status, 401);
  const ok = await get({ Authorization: 'Bearer admin-secret' });
  assert.equal(ok.status, 200);
  const csv = await ok.text();
  assert.match(csv, /"'=HYPERLINK/);
  assert.equal((await setup({ ADMIN_TOKEN: undefined }).api(new Request(`${HOST}/api/admin/orders.csv`))).status, 404);
});

test('/api/config: enabled only with payments flag, matching key mode and allowed host', async () => {
  const cfg = async (t: ReturnType<typeof setup>, host = HOST) =>
    (await t.api(new Request(`${host}/api/config`))).json();
  assert.deepEqual(await cfg(setup()), { paymentsEnabled: true, mode: 'test' });
  assert.equal((await cfg(setup({ PAYMENTS_ENABLED: 'false' }))).paymentsEnabled, false);
  assert.equal((await cfg(setup(), 'https://rost.community')).paymentsEnabled, false);
  const live = setup({ ORDERS_ENV: 'live', STRIPE_SECRET_KEY: 'rk_live_abc' });
  assert.deepEqual(await cfg(live, 'https://rost.community'), { paymentsEnabled: true, mode: 'live' });
  const wrong = setup({ ORDERS_ENV: 'live', STRIPE_SECRET_KEY: 'sk_test_abc' });
  assert.equal((await cfg(wrong, 'https://rost.community')).paymentsEnabled, false);
});
