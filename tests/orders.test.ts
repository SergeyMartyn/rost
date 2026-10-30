import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHmac } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { handleApi, type Deps, type OrdersEnv } from '../worker/orders';
import { EARLY_BIRD_END_MS } from '../src/lib/early-bird';

// Real SQL (the real migration file) behind a tiny D1-compatible adapter.
function makeD1() {
  const db = new DatabaseSync(':memory:');
  db.exec(readFileSync('migrations/0001_orders.sql', 'utf8'));
  db.exec(readFileSync('migrations/0002_host_registrations.sql', 'utf8'));
  db.exec(readFileSync('migrations/0003_sheet_exports.sql', 'utf8'));
  db.exec(readFileSync('migrations/0004_payment_account.sql', 'utf8'));
  db.exec(readFileSync('migrations/0005_promotions.sql', 'utf8'));
  db.exec(readFileSync('migrations/0006_promo_pairs.sql', 'utf8'));
  db.exec(readFileSync('migrations/0007_single_promotions.sql', 'utf8'));

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
        return new Response(
          JSON.stringify({
            id: `cs_test_${n}`,
            url: `https://checkout.stripe.com/c/pay/cs_test_${n}`,
          }),
          { status: 200 },
        );
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
  ticket,
  name: 'Анна Тест',
  channel: 'Telegram',
  contact: '@anna_test',
  lang: 'ru',
  consent: true,
  ...extra,
});

const quoteRequest = (ticket: string, promoCode = '') =>
  new Request(`${HOST}/api/orders/quote`, {
    method: 'POST',
    headers: { Origin: HOST, 'Content-Type': 'application/json' },
    body: JSON.stringify({ ticket, promoCode }),
  });
test('all fifteen codes preview the configured discount and quantity with the correct issuer and create no orders', async () => {
  const t = setup();
  for (const [suffix, name] of Object.entries({
    T: 'Тимур',
    K: 'Кристина',
    S: 'Сергей',
    M: 'Марго',
    X: 'Максим',
  })) {
    for (const prefix of ['FAMILY10', 'FRIEND10', 'PROMO10']) {
      const response = await t.api(
        quoteRequest(
          'guest',
          ` ${prefix.toLowerCase()}${suffix.toLowerCase()} `,
        ),
      );
      assert.equal(response.status, 200);
      const q: any = await response.json();
      const quantity = prefix === 'PROMO10' ? 1 : 2;
      assert.equal(q.quantity, quantity);
      assert.equal(q.baseAmountCents, 8000 * quantity);
      assert.equal(q.discountCents, 800 * quantity);
      assert.equal(q.amountCents, 7200 * quantity);
      assert.equal(q.promoCode, prefix + suffix);
      assert.equal(q.issuerCode, suffix);
      assert.equal(q.issuerName, name);
      assert.equal(
        q.promotionKind,
        prefix === 'FAMILY10'
          ? 'family'
          : prefix === 'FRIEND10'
            ? 'referral'
            : 'promo',
      );
    }
  }
  assert.equal(
    (t.d1.db.prepare('SELECT count(*) n FROM orders').get() as any).n,
    0,
  );
  assert.equal(t.stripeCalls.length, 0);
});
test('promo rejects VIP, hosts, archive, unknown suffix, stacked and inactive codes', async () => {
  const t = setup();
  for (const ticket of ['guest_peak', 'host', 'nuremberg_meetup'])
    assert.equal((await t.api(quoteRequest(ticket, 'FAMILY10T'))).status, 400);
  assert.equal((await t.api(quoteRequest('meetup', 'FAMILY10T'))).status, 410);
  for (const code of ['FAMILY10', 'FAMILY10Q', 'FAMILY10T FRIEND10K'])
    assert.equal((await t.api(quoteRequest('guest', code))).status, 400);
  t.d1.db.exec("UPDATE discount_codes SET active=0 WHERE code='FAMILY10T'");
  assert.equal((await t.api(quoteRequest('guest', 'FAMILY10T'))).status, 400);
  t.d1.db.exec(
    "UPDATE discount_campaigns SET starts_at=1790000000001 WHERE id='referral'",
  );
  assert.equal((await t.api(quoteRequest('guest', 'FRIEND10T'))).status, 400);
  t.d1.db.exec(
    "UPDATE discount_campaigns SET starts_at=NULL,ends_at=1790000000000 WHERE id='referral'",
  );
  assert.equal((await t.api(quoteRequest('guest', 'FRIEND10T'))).status, 400);
});
test('Nuremberg can be activated independently and uses eurocent rounding', async () => {
  const t = setup();
  t.d1.db.exec(
    "UPDATE discount_scopes SET active=1 WHERE event_id='nuremberg-2026-12-12'",
  );
  const q: any = await (
    await t.api(quoteRequest('nuremberg_meetup', 'FAMILY10M'))
  ).json();
  assert.equal(q.amountCents, 5220);
  assert.equal(q.discountCents, 580);
  assert.equal(
    (await t.api(quoteRequest('guest_peak', 'FAMILY10M'))).status,
    400,
  );
});
test('stale or missing price confirmation cannot create a discounted checkout', async () => {
  const t = setup();
  assert.equal(
    (
      await t.api(
        orderReq(goodBody('guest', { promoCode: 'FAMILY10T', amount: 1 })),
      )
    ).status,
    409,
  );
  const q: any = await (await t.api(quoteRequest('guest', 'FAMILY10T'))).json();
  t.d1.db.exec(
    "UPDATE discount_campaigns SET discount_percent=5 WHERE id='family'",
  );
  const response = await t.api(
    orderReq(
      goodBody('guest', { promoCode: 'FAMILY10T', quoteKey: q.quoteKey }),
    ),
  );
  assert.equal(response.status, 409);
  assert.equal(((await response.json()) as any).quote.amountCents, 15200);
  assert.equal(t.stripeCalls.length, 0);
  t.d1.db.exec("UPDATE discount_campaigns SET active=0 WHERE id='family'");
  assert.equal(
    (
      await t.api(
        orderReq(
          goodBody('guest', { promoCode: 'FAMILY10T', quoteKey: q.quoteKey }),
        ),
      )
    ).status,
    400,
  );
  assert.equal(
    (t.d1.db.prepare('SELECT count(*) n FROM orders').get() as any).n,
    0,
  );
});
test('Stripe charges the discounted snapshot, rejects full-price confirmation and exports attribution once', async () => {
  const t = setup();
  const q: any = await (await t.api(quoteRequest('guest', 'family10s'))).json();
  const response = await t.api(
    orderReq(
      goodBody('guest', {
        promoCode: q.promoCode,
        quoteKey: q.quoteKey,
        secondParticipantName: 'Second Person',
        amount: 1,
      }),
    ),
  );
  assert.equal(response.status, 200);
  const order: any = t.d1.db.prepare('SELECT * FROM orders').get();
  assert.equal(order.amount_cents, 14400);
  assert.equal(order.base_amount_cents, 16000);
  assert.equal(order.issuer_name, 'Сергей');
  assert.equal(order.quantity, 2);
  assert.equal(order.second_participant_name, 'Second Person');
  assert.equal(t.stripeCalls[0].body.get('line_items[0][quantity]'), '2');
  assert.equal(
    t.stripeCalls[0].body.get('line_items[0][price_data][unit_amount]'),
    '7200',
  );
  // Disabling the promotion after creation does not change the contracted price.
  t.d1.db.exec('UPDATE discount_campaigns SET active=0');
  await t.api(
    signedEvent(
      'checkout.session.completed',
      paidSession(order.id, order.provider_session_id, 8000),
      'evt_wrong_full_price',
    ),
  );
  assert.equal(row(t, order.id).status, 'pending');
  const event = () =>
    signedEvent(
      'checkout.session.completed',
      paidSession(order.id, order.provider_session_id, 14400),
      'evt_discount_paid',
    );
  await t.api(event());
  await t.flush();
  await t.api(event());
  await t.flush();
  assert.equal(row(t, order.id).status, 'paid');
  assert.equal(t.sheetCalls.length, 1);
  assert.equal(t.sheetCalls[0].row[7], 144);
  assert.deepEqual(t.sheetCalls[0].row.slice(17), [
    160,
    10,
    16,
    'FAMILY10S',
    'Семейная',
    'Сергей',
    2,
    'Second Person',
  ]);
});

test('promo pair requires a second name and never accepts a client-selected single quantity', async () => {
  const t = setup();
  const q: any = await (await t.api(quoteRequest('guest', 'FAMILY10T'))).json();
  for (const secondParticipantName of [
    undefined,
    '',
    ' ',
    'A',
    'A'.repeat(81),
    123,
  ]) {
    const r = await t.api(
      orderReq(
        goodBody('guest', {
          promoCode: 'FAMILY10T',
          quoteKey: q.quoteKey,
          secondParticipantName,
        }),
      ),
    );
    assert.equal(r.status, 400);
    assert.equal(
      ((await r.json()) as any).error,
      'second_participant_required',
    );
  }
  for (const quantity of [1, 3, '2', 0])
    assert.equal(
      (
        await t.api(
          orderReq(
            goodBody('guest', {
              promoCode: 'FAMILY10T',
              quoteKey: q.quoteKey,
              quantity,
              secondParticipantName: 'Second Person',
            }),
          ),
        )
      ).status,
      400,
    );
  assert.equal(t.stripeCalls.length, 0);
  assert.equal(
    (t.d1.db.prepare('SELECT count(*) n FROM orders').get() as any).n,
    0,
  );
  // Without a code, stale second-name data never creates an extra ticket.
  assert.equal(
    (
      await t.api(
        orderReq(goodBody('guest', { secondParticipantName: 'Stale Name' })),
      )
    ).status,
    200,
  );
  const order: any = t.d1.db.prepare('SELECT * FROM orders').get();
  assert.equal(order.quantity, 1);
  assert.equal(order.second_participant_name, null);
  assert.equal(order.amount_cents, 8000);
});

function signedEvent(
  type: string,
  object: object,
  id = 'evt_1',
  t = Math.floor(T0 / 1000),
  secret = WH_SECRET,
) {
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

test('Stripe transition isolates sellers and preserves old checkouts, webhooks and refunds', async () => {
  const t = setup({
    ORDERS_ENV: 'live',
    STRIPE_SECRET_KEY: 'rk_live_original',
    STRIPE_TIMUR_SECRET_KEY: 'rk_live_timur',
    STRIPE_TIMUR_WEBHOOK_SECRET: 'whsec_timur',
  });
  const old = await createOrder(t, 'guest');
  t.env.STRIPE_ACCOUNT_OWNER = 'timur';
  const current = await createOrder(t, 'guest');
  assert.equal(
    t.stripeCalls[0].headers.Authorization,
    'Bearer rk_live_original',
  );
  assert.equal(t.stripeCalls[1].headers.Authorization, 'Bearer rk_live_timur');
  assert.equal(row(t, old.id).payment_account, 'margarita');
  assert.equal(row(t, current.id).payment_account, 'timur');
  // Existing endpoint continues using the original signing secret even after
  // the selector for new checkouts changes.
  await t.api(
    signedEvent(
      'checkout.session.completed',
      paidSession(old.id, old.session, 8000),
      'evt_shared',
    ),
  );
  assert.equal(row(t, old.id).status, 'paid');
  const wrong = await t.api(
    signedEvent(
      'checkout.session.completed',
      paidSession(current.id, current.session, 8000),
      'evt_wrong_account',
    ),
  );
  assert.equal(wrong.status, 200);
  assert.equal(row(t, current.id).status, 'pending');
  const request = signedEvent(
    'checkout.session.completed',
    paidSession(current.id, current.session, 8000),
    'evt_shared',
    undefined,
    'whsec_timur',
  );
  const reply = await t.api(
    new Request(`${HOST}/api/stripe/timur/webhook`, {
      method: 'POST',
      headers: request.headers,
      body: await request.text(),
    }),
  );
  assert.equal(reply.status, 200);
  assert.equal(row(t, current.id).status, 'paid');
  await t.flush();
  assert.equal(t.sheetCalls.length, 2);
  await t.api(
    signedEvent(
      'charge.refunded',
      { refunded: true, payment_intent: 'pi_1' },
      'evt_old_refund',
    ),
  );
  assert.equal(row(t, old.id).status, 'refunded');
  assert.equal(row(t, current.id).status, 'paid');
});

test('selected Timur Stripe account never falls back to original credentials', async () => {
  const t = setup({
    ORDERS_ENV: 'live',
    STRIPE_ACCOUNT_OWNER: 'timur',
    STRIPE_SECRET_KEY: 'rk_live_original',
  });
  assert.equal((await t.api(orderReq(goodBody('guest')))).status, 503);
  assert.equal(t.stripeCalls.length, 0);
  assert.equal(t.d1.db.prepare('SELECT COUNT(*) n FROM orders').get()!.n, 0);
});
async function createOrder(t: ReturnType<typeof setup>, ticket: string) {
  const res = await t.api(orderReq(goodBody(ticket)));
  assert.equal(res.status, 200);
  const id = t.stripeCalls.at(-1)!.body.get('client_reference_id')!;
  return { id, session: `cs_test_${t.stripeCalls.length}` };
}
const paidSession = (
  id: string,
  session: string,
  amount: number,
  over: object = {},
) => ({
  id: session,
  client_reference_id: id,
  payment_status: 'paid',
  currency: 'eur',
  amount_total: amount,
  payment_intent: 'pi_1',
  customer_details: { email: 'buyer@example.com' },
  ...over,
});

for (const [ticket, cents] of [
  ['nuremberg_meetup', 2900],
  ['guest', 8000],
  ['guest_peak', 18000],
  ['host', 24900],
] as const) {
  test(`ticket ${ticket}: server-side price ${cents / 100} EUR, pending → paid`, async () => {
    const t = setup();
    // The browser tries to send its own amount: it must be ignored.
    const res = await t.api(
      orderReq(goodBody(ticket, { amount: 1, amount_cents: 1, price: 0.01 })),
    );
    assert.equal(res.status, 200);
    const call = t.stripeCalls[0];
    assert.equal(
      call.body.get('line_items[0][price_data][unit_amount]'),
      String(cents),
    );
    assert.equal(call.body.get('line_items[0][price_data][currency]'), 'eur');
    assert.equal(call.body.get('payment_method_types[0]'), 'card');
    assert.ok(call.headers.Authorization.startsWith('Bearer sk_test_'));
    const id = call.body.get('client_reference_id')!;
    let o = row(t, id);
    assert.equal(o.status, 'pending');
    assert.equal(o.amount_cents, cents);
    assert.equal(o.provider_session_id, 'cs_test_1');
    assert.equal(o.email, null);

    const wh = await t.api(
      signedEvent(
        'checkout.session.completed',
        paidSession(id, 'cs_test_1', cents),
      ),
    );
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

test('archived Regensburg ticket cannot create a new order', async () => {
  const t = setup();
  const res = await t.api(orderReq(goodBody('meetup')));
  assert.equal(res.status, 410);
  assert.equal(t.stripeCalls.length, 0);
});

test('early participant price is enforced at the Berlin deadline', async () => {
  const t = setup();
  t.deps.now = () => EARLY_BIRD_END_MS - 1;
  const early = await t.api(
    orderReq(goodBody('guest_early', { amount_cents: 1 })),
  );
  assert.equal(early.status, 200);
  assert.equal(
    t.stripeCalls[0].body.get('line_items[0][price_data][unit_amount]'),
    '8000',
  );
  const id = t.stripeCalls[0].body.get('client_reference_id')!;
  assert.equal(row(t, id).ticket_type, 'guest_early');
  assert.equal(row(t, id).amount_cents, 8000);

  t.deps.now = () => EARLY_BIRD_END_MS;
  const expired = await t.api(orderReq(goodBody('guest_early')));
  assert.equal(expired.status, 409);
  assert.deepEqual(await expired.json(), {
    error: 'offer_ended',
    serverTime: EARLY_BIRD_END_MS,
  });
  assert.equal(t.stripeCalls.length, 1);
  assert.equal(t.d1.db.prepare('SELECT COUNT(*) c FROM orders').get()!.c, 1);

  const regular = await t.api(orderReq(goodBody('guest')));
  assert.equal(regular.status, 200);
  assert.equal(
    t.stripeCalls[1].body.get('line_items[0][price_data][unit_amount]'),
    '8000',
  );
});

test('cancelled payment: expired session → cancelled, never paid', async () => {
  const t = setup();
  const { id, session } = await createOrder(t, 'nuremberg_meetup');
  await t.api(
    signedEvent(
      'checkout.session.expired',
      { id: session, client_reference_id: id },
      'evt_exp',
    ),
  );
  const o = row(t, id);
  assert.equal(o.status, 'cancelled');
  assert.ok(o.cancelled_at);
  assert.equal(t.sheetCalls.length, 0);
});

test('repeated webhook: no duplicate, no second change, no second sheet row', async () => {
  const t = setup();
  const { id, session } = await createOrder(t, 'guest');
  const ev = () =>
    signedEvent(
      'checkout.session.completed',
      paidSession(id, session, 8000),
      'evt_same',
    );
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
  await t.api(
    signedEvent(
      'checkout.session.async_payment_succeeded',
      paidSession(id, session, 8000),
      'evt_other',
    ),
  );
  await t.flush();
  assert.deepEqual(row(t, id), first);
  assert.equal(t.sheetCalls.length, 1);
});

test('amount mismatch: order stays pending, rejection recorded', async () => {
  const t = setup();
  const { id, session } = await createOrder(t, 'host');
  const res = await t.api(
    signedEvent(
      'checkout.session.completed',
      paidSession(id, session, 100),
      'evt_bad',
    ),
  );
  assert.equal(res.status, 200); // acknowledged so Stripe does not retry forever
  await t.flush();
  assert.equal(row(t, id).status, 'pending');
  assert.equal(row(t, id).paid_at, null);
  const ev: any = t.d1.db
    .prepare('SELECT outcome FROM webhook_events WHERE event_id=?')
    .get('evt_bad');
  assert.equal(ev.outcome, 'rejected:amount_mismatch');
  assert.equal(t.sheetCalls.length, 0);
});

test('currency / session / unknown order mismatches are rejected', async () => {
  const t = setup();
  const { id, session } = await createOrder(t, 'nuremberg_meetup');
  await t.api(
    signedEvent(
      'checkout.session.completed',
      paidSession(id, session, 2900, { currency: 'usd' }),
      'e1',
    ),
  );
  await t.api(
    signedEvent(
      'checkout.session.completed',
      paidSession(id, 'cs_other', 2900),
      'e2',
    ),
  );
  await t.api(
    signedEvent(
      'checkout.session.completed',
      paidSession('nope', session, 2900),
      'e3',
    ),
  );
  assert.equal(row(t, id).status, 'pending');
  const outs = t.d1.db
    .prepare('SELECT event_id,outcome FROM webhook_events ORDER BY event_id')
    .all() as any[];
  assert.deepEqual(
    outs.map((o) => o.outcome),
    [
      'rejected:currency_mismatch',
      'rejected:session_mismatch',
      'rejected:unknown_order',
    ],
  );
});

test('refund is a separate event: paid → refunded (partial refund ignored)', async () => {
  const t = setup();
  const { id, session } = await createOrder(t, 'nuremberg_meetup');
  await t.api(
    signedEvent(
      'charge.refunded',
      { payment_intent: 'pi_1', refunded: true },
      'r0',
    ),
  );
  assert.equal(row(t, id).status, 'pending'); // not paid yet: nothing to refund
  await t.api(
    signedEvent(
      'checkout.session.completed',
      paidSession(id, session, 2900),
      'p1',
    ),
  );
  await t.api(
    signedEvent(
      'charge.refunded',
      { payment_intent: 'pi_1', refunded: false, amount_refunded: 500 },
      'r1',
    ),
  );
  assert.equal(row(t, id).status, 'paid');
  await t.api(
    signedEvent(
      'charge.refunded',
      { payment_intent: 'pi_1', refunded: true },
      'r2',
    ),
  );
  const o = row(t, id);
  assert.equal(o.status, 'refunded');
  assert.ok(o.refunded_at);
});

test('webhook signature: bad secret and stale timestamp are rejected', async () => {
  const t = setup();
  const { id, session } = await createOrder(t, 'nuremberg_meetup');
  const obj = paidSession(id, session, 2900);
  assert.equal(
    (
      await t.api(
        signedEvent(
          'checkout.session.completed',
          obj,
          'x1',
          undefined,
          'whsec_wrong',
        ),
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await t.api(
        signedEvent(
          'checkout.session.completed',
          obj,
          'x2',
          Math.floor(T0 / 1000) - 3600,
        ),
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await t.api(
        new Request(`${HOST}/api/stripe/webhook`, {
          method: 'POST',
          body: '{}',
        }),
      )
    ).status,
    400,
  );
  assert.equal(row(t, id).status, 'pending');
});

test('input validation: unknown ticket, bad contact, no consent, wrong origin', async () => {
  const t = setup();
  assert.equal((await t.api(orderReq(goodBody('vip')))).status, 400);
  assert.equal(
    (await t.api(orderReq(goodBody('nuremberg_meetup', { contact: 'ab' }))))
      .status,
    400,
  );
  assert.equal(
    (await t.api(orderReq(goodBody('nuremberg_meetup', { consent: false }))))
      .status,
    400,
  );
  const evil = new Request(`${HOST}/api/orders`, {
    method: 'POST',
    headers: { Origin: 'https://evil.example' },
    body: JSON.stringify(goodBody('nuremberg_meetup')),
  });
  assert.equal((await t.api(evil)).status, 403);
  assert.equal(t.d1.db.prepare('SELECT COUNT(*) c FROM orders').get()!.c, 0);
});

test('test payments are unavailable on the public domain and with wrong key mode', async () => {
  const t = setup();
  const pub = 'https://rost.community';
  assert.equal(
    (await t.api(orderReq(goodBody('nuremberg_meetup'), pub))).status,
    403,
  );
  assert.equal(
    (
      await setup({ PAYMENTS_ENABLED: 'false' }).api(
        orderReq(goodBody('nuremberg_meetup')),
      )
    ).status,
    403,
  );
  // a live key in the test environment is refused
  const mix = setup({ stripe_test: 'sk_live_zzz' });
  assert.equal(
    (await mix.api(orderReq(goodBody('nuremberg_meetup')))).status,
    503,
  );
});

test('stripe outage marks the order failed', async () => {
  const t = setup();
  t.deps.fetch = (async () => new Response('{}', { status: 500 })) as any;
  assert.equal(
    (await t.api(orderReq(goodBody('nuremberg_meetup')))).status,
    502,
  );
  assert.equal(
    (t.d1.db.prepare('SELECT status FROM orders').get() as any).status,
    'failed',
  );
});

test('admin CSV: token required, formulas neutralised, no public list', async () => {
  const t = setup();
  await t.api(
    orderReq(goodBody('nuremberg_meetup', { name: '=HYPERLINK("http://x")' })),
  );
  const get = (h: Record<string, string> = {}) =>
    t.api(new Request(`${HOST}/api/admin/orders.csv`, { headers: h }));
  assert.equal((await get()).status, 401);
  assert.equal((await get({ Authorization: 'Bearer nope' })).status, 401);
  const ok = await get({ Authorization: 'Bearer admin-secret' });
  assert.equal(ok.status, 200);
  const csv = await ok.text();
  assert.match(csv, /"'=HYPERLINK/);
  assert.equal(
    (
      await setup({ ADMIN_TOKEN: undefined }).api(
        new Request(`${HOST}/api/admin/orders.csv`),
      )
    ).status,
    404,
  );
});

test('/api/config: enabled only with payments flag, matching key mode and allowed host', async () => {
  const cfg = async (t: ReturnType<typeof setup>, host = HOST) =>
    (await t.api(new Request(`${host}/api/config`))).json() as Promise<{
      paymentsEnabled: boolean;
      mode: string;
      stripe: boolean;
      paypal: boolean;
      serverTime: number;
    }>;
  assert.deepEqual(await cfg(setup()), {
    paymentsEnabled: true,
    mode: 'test',
    stripe: true,
    paypal: false,
    serverTime: T0,
  });
  assert.equal(
    (await cfg(setup({ PAYMENTS_ENABLED: 'false' }))).paymentsEnabled,
    false,
  );
  assert.equal(
    (await cfg(setup(), 'https://rost.community')).paymentsEnabled,
    false,
  );
  const live = setup({ ORDERS_ENV: 'live', STRIPE_SECRET_KEY: 'rk_live_abc' });
  assert.deepEqual(await cfg(live, 'https://rost.community'), {
    paymentsEnabled: true,
    mode: 'live',
    stripe: true,
    paypal: false,
    serverTime: T0,
  });
  const wrong = setup({ ORDERS_ENV: 'live', STRIPE_SECRET_KEY: 'sk_test_abc' });
  assert.equal(
    (await cfg(wrong, 'https://rost.community')).paymentsEnabled,
    false,
  );
});

test('single promo cannot buy a pair, ignores stale second name and exports a confirmed Stripe payment once', async () => {
  const t = setup();
  const q: any = await (await t.api(quoteRequest('guest', 'PROMO10K'))).json();
  for (const quantity of [2, 0, 3, '1']) {
    const r = await t.api(
      orderReq(
        goodBody('guest', {
          promoCode: q.promoCode,
          quoteKey: q.quoteKey,
          quantity,
        }),
      ),
    );
    assert.equal(r.status, 400);
    assert.equal(((await r.json()) as any).error, 'bad_quantity');
  }
  for (const ticket of ['guest_peak', 'host', 'nuremberg_meetup', 'meetup']) {
    const r = await t.api(quoteRequest(ticket, 'PROMO10K'));
    assert.ok(r.status >= 400);
  }
  for (const code of ['PROMO10', 'PROMO10Q', 'PROMO10K FAMILY10T'])
    assert.equal((await t.api(quoteRequest('guest', code))).status, 400);
  assert.equal(t.stripeCalls.length, 0);
  const r = await t.api(
    orderReq(
      goodBody('guest', {
        promoCode: q.promoCode,
        quoteKey: q.quoteKey,
        quantity: 1,
        secondParticipantName: 'Алексей',
        amount: 1,
      }),
    ),
  );
  assert.equal(r.status, 200);
  const order: any = t.d1.db.prepare('SELECT * FROM orders').get();
  assert.equal(order.quantity, 1);
  assert.equal(order.second_participant_name, null);
  assert.equal(order.amount_cents, 7200);
  assert.equal(order.promotion_kind, 'promo');
  assert.equal(t.stripeCalls[0].body.get('line_items[0][quantity]'), '1');
  assert.equal(
    t.stripeCalls[0].body.get('line_items[0][price_data][unit_amount]'),
    '7200',
  );
  t.d1.db.exec("UPDATE discount_campaigns SET active=0 WHERE id='promo'");
  assert.equal((await t.api(quoteRequest('guest', 'PROMO10K'))).status, 400);
  assert.equal((await t.api(quoteRequest('guest', 'FAMILY10K'))).status, 200);
  await t.api(
    signedEvent(
      'checkout.session.completed',
      paidSession(order.id, order.provider_session_id, 14400),
      'evt_wrong_pair',
    ),
  );
  assert.equal(row(t, order.id).status, 'pending');
  for (let n = 0; n < 2; n++) {
    await t.api(
      signedEvent(
        'checkout.session.completed',
        paidSession(order.id, order.provider_session_id, 7200),
        'evt_single_paid',
      ),
    );
    await t.flush();
  }
  assert.equal(row(t, order.id).status, 'paid');
  assert.equal(t.sheetCalls.length, 1);
  assert.equal(t.sheetCalls[0].row[7], 72);
  assert.deepEqual(t.sheetCalls[0].row.slice(17), [
    80,
    10,
    8,
    'PROMO10K',
    'Одиночная скидка',
    'Кристина',
    1,
    '',
  ]);
});
