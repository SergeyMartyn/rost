import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { handleApi, type Deps, type OrdersEnv } from '../worker/orders';

const HOST = 'https://rost.sergeymartyn.workers.dev';
const SESSION = 'PAYPAL123456789';
const NOW = 1_790_000_000_000;

function setup(over: Partial<OrdersEnv> = {}) {
  const db = new DatabaseSync(':memory:');
  db.exec(readFileSync('migrations/0001_orders.sql', 'utf8'));
  db.exec(readFileSync('migrations/0002_host_registrations.sql', 'utf8'));
  db.exec(readFileSync('migrations/0003_sheet_exports.sql', 'utf8'));
  db.exec(readFileSync('migrations/0004_payment_account.sql', 'utf8'));
  db.exec(readFileSync('migrations/0005_promotions.sql', 'utf8'));
  db.exec(readFileSync('migrations/0006_promo_pairs.sql', 'utf8'));
  db.exec(readFileSync('migrations/0007_single_promotions.sql', 'utf8'));

  const statement = (sql: string) => {
    let args: unknown[] = [];
    const s: any = {
      bind: (...values: unknown[]) => ((args = values), s),
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
  const d1 = {
    prepare: statement,
    batch: async (items: any[]) => {
      db.exec('BEGIN');
      try {
        const result = items.map((item) => item._run());
        db.exec('COMMIT');
        return result;
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
    },
  };
  const env: OrdersEnv = {
    ORDERS: d1 as any,
    ORDERS_ENV: 'test',
    PAYMENTS_ENABLED: 'true',
    PAYPAL_ENABLED: 'true',
    PAYPAL_MODE: 'sandbox',
    PAYPAL_CLIENT_ID: 'client-test',
    PAYPAL_CLIENT_SECRET: 'secret-test',
    PAYPAL_PAYEE_EMAIL: 'mail@margaritamartyn.com',
    PAYPAL_WEBHOOK_ID: 'WH-TEST',
    ...over,
  };
  let created: any;
  let captureCount = 0;
  let verification = 'SUCCESS';
  let captureOverride: any = null;
  const sheetCalls: any[] = [];
  const tokenClients: string[] = [];
  const verifiedWebhookIds: string[] = [];
  const completedOrder = () => ({
    id: SESSION,
    status: 'COMPLETED',
    payer: { email_address: 'buyer@example.com' },
    purchase_units: [
      {
        reference_id: created.purchase_units[0].reference_id,
        custom_id: created.purchase_units[0].custom_id,
        payee: created.purchase_units[0].payee,
        payments: {
          captures: [
            {
              id: 'CAPTURE123',
              status: 'COMPLETED',
              amount: created.purchase_units[0].amount,
            },
          ],
        },
      },
    ],
  });
  const deps: Deps = {
    now: () => NOW,
    fetch: (async (url: string, init: any = {}) => {
      const path = String(url);
      if (path.endsWith('/v1/oauth2/token')) {
        tokenClients.push(
          Buffer.from(init.headers.Authorization.slice(6), 'base64')
            .toString()
            .split(':')[0],
        );
        return Response.json({ access_token: 'token' });
      }
      if (path.endsWith('/v2/checkout/orders') && init.method === 'POST') {
        created = JSON.parse(init.body);
        return Response.json({
          id: SESSION,
          links: [
            {
              rel: 'payer-action',
              href: `https://www.sandbox.paypal.com/checkoutnow?token=${SESSION}`,
            },
          ],
        });
      }
      if (path.endsWith(`/v2/checkout/orders/${SESSION}/capture`)) {
        captureCount++;
        return Response.json(captureOverride ?? completedOrder());
      }
      if (path.endsWith(`/v2/checkout/orders/${SESSION}`))
        return Response.json(completedOrder());
      if (path.endsWith('/v1/notifications/verify-webhook-signature')) {
        verifiedWebhookIds.push(JSON.parse(init.body).webhook_id);
        return Response.json({ verification_status: verification });
      }
      if (path.includes('script.google.com')) {
        sheetCalls.push(JSON.parse(init.body));
        return new Response('ok');
      }
      throw new Error(`unexpected fetch: ${path}`);
    }) as any,
  };
  const pending: Promise<unknown>[] = [];
  const ctx = {
    waitUntil: (promise: Promise<unknown>) => void pending.push(promise),
  };
  return {
    db,
    env,
    deps,
    created: () => created,
    captures: () => captureCount,
    setVerification: (value: string) => (verification = value),
    sheetCalls,
    tokenClients,
    verifiedWebhookIds,
    setCapture: (value: any) => (captureOverride = value),
    api: (request: Request) => handleApi(request, env, ctx, deps),
    flush: () => Promise.all(pending.splice(0)),
  };
}

function orderRequest(extra: object = {}, host = HOST) {
  return new Request(`${host}/api/orders`, {
    method: 'POST',
    headers: { Origin: host, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ticket: 'nuremberg_meetup',
      name: 'Buyer Example',
      channel: 'Telegram',
      contact: '@buyer_example',
      lang: 'ru',
      consent: true,
      provider: 'paypal',
      ...extra,
    }),
  });
}

const record = (t: ReturnType<typeof setup>) =>
  t.db.prepare("SELECT * FROM orders WHERE provider='paypal'").get() as any;
const paypalReturn = (id: string, path = 'return', token = SESSION) =>
  new Request(`${HOST}/api/paypal/${path}?order=${id}&lang=ru&token=${token}`);

test('PayPal uses the same discounted quote and preserves attribution on capture and refund', async () => {
  const t = setup({
    SHEETS_WEBHOOK_URL: 'https://script.google.com/test',
    SHEETS_TOKEN: 'test',
  });
  const preview = await t.api(
    new Request(`${HOST}/api/orders/quote`, {
      method: 'POST',
      headers: { Origin: HOST, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticket: 'guest', promoCode: 'FRIEND10X' }),
    }),
  );
  const q: any = await preview.json();
  assert.equal(
    (
      await t.api(
        orderRequest({
          ticket: 'guest',
          promoCode: q.promoCode,
          quoteKey: q.quoteKey,
          secondParticipantName: 'Second Person',
        }),
      )
    ).status,
    200,
  );
  assert.equal(t.created().purchase_units[0].amount.value, '144.00');
  const order = record(t);
  assert.equal(order.issuer_name, 'Максим');
  t.db.exec('UPDATE discount_campaigns SET active=0');
  await t.api(paypalReturn(order.id));
  await t.flush();
  assert.equal(record(t).status, 'paid');
  assert.equal(record(t).amount_cents, 14400);
  assert.equal(t.sheetCalls[0].row[7], 144);
  assert.equal(t.sheetCalls[0].row[8], 'PayPal');
  assert.equal(t.sheetCalls[0].row[9], 'paid');
  assert.equal(t.sheetCalls[0].row[20], 'FRIEND10X');
  assert.equal(t.sheetCalls[0].row[22], 'Максим');
  await t.api(
    webhook(
      'PAYMENT.CAPTURE.REFUNDED',
      {
        id: 'REFUND-DISCOUNT',
        status: 'COMPLETED',
        amount: { value: '144.00', currency_code: 'EUR' },
        supplementary_data: { related_ids: { capture_id: 'CAPTURE123' } },
      },
      'refund-discount',
    ),
  );
  assert.equal(record(t).status, 'refunded');
  assert.equal(record(t).discount_cents, 1600);
});

test('new PayPal purchases can be paused without breaking an existing approved checkout', async () => {
  const t = setup();
  assert.equal((await t.api(orderRequest())).status, 200);
  const id = record(t).id;
  t.env.PAYPAL_NEW_ORDERS_ENABLED = 'false';
  assert.equal((await t.api(orderRequest())).status, 503);
  const config = (await (
    await t.api(new Request(`${HOST}/api/config`))
  ).json()) as any;
  assert.equal(config.paypal, false);
  await t.api(paypalReturn(id));
  assert.equal(record(t).status, 'paid');
  assert.equal(record(t).payment_account, 'margarita');
  assert.equal(t.captures(), 1);
});
const webhook = (type: string, resource: object, id: string) =>
  new Request(`${HOST}/api/paypal/webhook`, {
    method: 'POST',
    headers: {
      'paypal-transmission-id': 'transmission',
      'paypal-transmission-time': '2026-09-29T12:00:00Z',
      'paypal-cert-url': 'https://api-m.sandbox.paypal.com/cert',
      'paypal-auth-algo': 'SHA256withRSA',
      'paypal-transmission-sig': 'signed',
    },
    body: JSON.stringify({ id, event_type: type, resource }),
  });

const timurConfig: Partial<OrdersEnv> = {
  PAYPAL_ACCOUNT_OWNER: 'timur',
  PAYPAL_TIMUR_CLIENT_ID: 'timur-client',
  PAYPAL_TIMUR_CLIENT_SECRET: 'timur-secret',
  PAYPAL_TIMUR_PAYEE_EMAIL: 'timur@example.com',
  PAYPAL_TIMUR_WEBHOOK_ID: 'WH-TIMUR',
  SHEETS_WEBHOOK_URL: 'https://script.google.com/test',
  SHEETS_TOKEN: 'test',
};
async function timurWebhook(
  t: ReturnType<typeof setup>,
  type: string,
  resource: object,
  id: string,
) {
  const req = webhook(type, resource, id);
  return t.api(
    new Request(`${HOST}/api/paypal/timur/webhook`, {
      method: 'POST',
      headers: req.headers,
      body: await req.text(),
    }),
  );
}

test('Timur checkout uses its own recipient, credentials and webhook; old account cannot refund it', async () => {
  const t = setup(timurConfig);
  assert.equal((await t.api(orderRequest())).status, 200);
  assert.equal(record(t).payment_account, 'timur');
  assert.equal(
    t.created().purchase_units[0].payee.email_address,
    'timur@example.com',
  );
  assert.equal(t.tokenClients.at(-1), 'timur-client');
  // Original account cannot apply a signed event to a new-account purchase.
  await t.api(webhook('CHECKOUT.ORDER.APPROVED', { id: SESSION }, 'WH-SHARED'));
  assert.equal(record(t).status, 'pending');
  assert.equal(t.captures(), 0);
  assert.equal(
    (
      await timurWebhook(
        t,
        'CHECKOUT.ORDER.APPROVED',
        { id: SESSION },
        'WH-SHARED',
      )
    ).status,
    200,
  );
  await t.flush();
  assert.equal(record(t).status, 'paid');
  assert.equal(t.verifiedWebhookIds.at(-1), 'WH-TIMUR');
  assert.equal(t.tokenClients.at(-1), 'timur-client');
  assert.equal(t.sheetCalls.length, 1);
  await timurWebhook(
    t,
    'CHECKOUT.ORDER.APPROVED',
    { id: SESSION },
    'WH-SHARED',
  );
  assert.equal(t.captures(), 1);
  const refund = {
    status: 'COMPLETED',
    amount: { currency_code: 'EUR', value: '29.00' },
    supplementary_data: { related_ids: { capture_id: 'CAPTURE123' } },
  };
  await t.api(webhook('PAYMENT.CAPTURE.REFUNDED', refund, 'WH-OLD-REFUND'));
  assert.equal(record(t).status, 'paid');
  await timurWebhook(t, 'PAYMENT.CAPTURE.REFUNDED', refund, 'WH-TIMUR-REFUND');
  assert.equal(record(t).status, 'refunded');
});

test('old PayPal browser return still uses original account after new-sales selector changes', async () => {
  const t = setup();
  await t.api(orderRequest());
  const id = record(t).id;
  Object.assign(t.env, timurConfig);
  const reply = await t.api(paypalReturn(id));
  assert.match(reply.headers.get('Location')!, /payment=success/);
  assert.equal(record(t).status, 'paid');
  assert.equal(record(t).payment_account, 'margarita');
  assert.equal(t.tokenClients.at(-1), 'client-test');
});

test('old PayPal approval webhook remains functional after selecting Timur for new sales', async () => {
  const t = setup();
  await t.api(orderRequest());
  Object.assign(t.env, timurConfig);
  await t.api(webhook('CHECKOUT.ORDER.APPROVED', { id: SESSION }, 'WH-LEGACY'));
  assert.equal(record(t).status, 'paid');
  assert.equal(t.tokenClients.at(-1), 'client-test');
  assert.equal(t.verifiedWebhookIds.at(-1), 'WH-TEST');
});

test('missing Timur credentials close new PayPal sales instead of falling back to original account', async () => {
  const t = setup({ PAYPAL_ACCOUNT_OWNER: 'timur' });
  assert.equal((await t.api(orderRequest())).status, 503);
  for (const path of ['/api/config', '/api/payments/config']) {
    const config = (await (
      await t.api(new Request(HOST + path))
    ).json()) as any;
    assert.equal(config.paypal, false);
  }
  assert.equal(t.db.prepare('SELECT COUNT(*) n FROM orders').get()!.n, 0);
});

test('PayPal uses server price and marks paid only after verified capture', async () => {
  const t = setup({
    SHEETS_WEBHOOK_URL: 'https://script.google.com/macros/s/x/exec',
    SHEETS_TOKEN: 'sheets-secret',
  });
  const created = await t.api(orderRequest({ amount_cents: 1, price: 0.01 }));
  assert.equal(created.status, 200);
  assert.match(
    ((await created.json()) as { url: string }).url,
    /sandbox\.paypal\.com/,
  );
  assert.equal(t.created().purchase_units[0].amount.value, '29.00');
  assert.equal(t.created().purchase_units[0].custom_id, record(t).id);
  assert.equal(record(t).status, 'pending');
  assert.equal(
    (await t.api(paypalReturn(record(t).id, 'return', 'WRONGTOKEN123'))).status,
    400,
  );
  assert.equal(record(t).status, 'pending');
  const success = await t.api(paypalReturn(record(t).id));
  assert.equal(success.status, 303);
  assert.match(success.headers.get('Location')!, /payment=success/);
  assert.equal(record(t).status, 'paid');
  assert.equal(record(t).provider_payment_id, 'CAPTURE123');
  await t.flush();
  assert.equal(t.sheetCalls.length, 1);
  await t.api(paypalReturn(record(t).id));
  assert.equal(t.captures(), 1);
  assert.equal(t.sheetCalls.length, 1);
});

test('PayPal peak ticket uses the server-side 180 EUR price', async () => {
  const t = setup();
  const response = await t.api(
    orderRequest({ ticket: 'guest_peak', amount_cents: 1 }),
  );
  assert.equal(response.status, 200);
  assert.equal(t.created().purchase_units[0].amount.value, '180.00');
  assert.equal(record(t).ticket_type, 'guest_peak');
  assert.equal(record(t).amount_cents, 18000);
});

test('PayPal cancellation never marks the order paid', async () => {
  const t = setup();
  await t.api(orderRequest());
  const response = await t.api(paypalReturn(record(t).id, 'cancel'));
  assert.equal(response.status, 303);
  assert.equal(record(t).status, 'cancelled');
  assert.equal(t.captures(), 0);
});

test('a verified late capture takes precedence over a cancelled browser return', async () => {
  const t = setup();
  await t.api(orderRequest());
  const id = record(t).id;
  await t.api(paypalReturn(id, 'cancel'));
  assert.equal(record(t).status, 'cancelled');
  const event = webhook(
    'PAYMENT.CAPTURE.COMPLETED',
    {
      id: 'CAPTURE123',
      status: 'COMPLETED',
      amount: { currency_code: 'EUR', value: '29.00' },
      supplementary_data: { related_ids: { order_id: SESSION } },
    },
    'WH-LATE-CAPTURE',
  );
  assert.equal((await t.api(event)).status, 200);
  assert.equal(record(t).status, 'paid');
  assert.equal(record(t).cancelled_at, null);
});

test('verified approval webhook recovers a purchase when the browser never returns', async () => {
  const t = setup();
  await t.api(orderRequest());
  assert.equal(
    (
      await t.api(
        webhook('CHECKOUT.ORDER.APPROVED', { id: SESSION }, 'WH-APPROVED'),
      )
    ).status,
    200,
  );
  assert.equal(record(t).status, 'paid');
  assert.equal(
    (
      await t.api(
        webhook('CHECKOUT.ORDER.APPROVED', { id: SESSION }, 'WH-APPROVED'),
      )
    ).status,
    200,
  );
  assert.equal(t.captures(), 1);
  assert.equal(
    t.db.prepare('SELECT COUNT(*) AS n FROM webhook_events').get()!.n,
    1,
  );
});

test('invalid webhook and wrong mode cannot collect a payment', async () => {
  const t = setup();
  await t.api(orderRequest());
  t.setVerification('FAILURE');
  assert.equal(
    (await t.api(webhook('CHECKOUT.ORDER.APPROVED', { id: SESSION }, 'WH-BAD')))
      .status,
    400,
  );
  assert.equal(record(t).status, 'pending');
  assert.equal(t.captures(), 0);
  const wrong = setup({ PAYPAL_MODE: 'live' });
  assert.equal((await wrong.api(orderRequest())).status, 503);
  assert.equal(
    wrong.db.prepare('SELECT COUNT(*) AS n FROM orders').get()!.n,
    0,
  );
});

test('PayPal rejects a wrong capture amount even after browser return', async () => {
  const t = setup();
  await t.api(orderRequest());
  t.setCapture({
    id: SESSION,
    status: 'COMPLETED',
    purchase_units: [
      {
        reference_id: record(t).id,
        custom_id: record(t).id,
        payee: { email_address: t.env.PAYPAL_PAYEE_EMAIL },
        payments: {
          captures: [
            {
              id: 'CAPTURE123',
              status: 'COMPLETED',
              amount: { currency_code: 'EUR', value: '0.01' },
            },
          ],
        },
      },
    ],
  });
  const response = await t.api(paypalReturn(record(t).id));
  assert.match(response.headers.get('Location')!, /payment=error/);
  assert.equal(record(t).status, 'pending');
});

test('a signed capture webhook is reconciled against the PayPal order', async () => {
  const t = setup();
  await t.api(orderRequest());
  const event = webhook(
    'PAYMENT.CAPTURE.COMPLETED',
    {
      id: 'CAPTURE123',
      status: 'COMPLETED',
      amount: { currency_code: 'EUR', value: '29.00' },
      supplementary_data: { related_ids: { order_id: SESSION } },
    },
    'WH-CAPTURE',
  );
  assert.equal((await t.api(event)).status, 200);
  assert.equal(record(t).status, 'paid');
  assert.equal(t.captures(), 0);
});

test('PayPal single promo captures only one discounted ticket and exports the source', async () => {
  const t = setup({
    SHEETS_WEBHOOK_URL: 'https://script.google.com/test',
    SHEETS_TOKEN: 'test',
  });
  const q: any = await (
    await t.api(
      new Request(`${HOST}/api/orders/quote`, {
        method: 'POST',
        headers: { Origin: HOST, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket: 'guest', promoCode: 'PROMO10X' }),
      }),
    )
  ).json();
  assert.equal(
    (
      await t.api(
        orderRequest({
          ticket: 'guest',
          promoCode: q.promoCode,
          quoteKey: q.quoteKey,
          quantity: 1,
        }),
      )
    ).status,
    200,
  );
  assert.equal(t.created().purchase_units[0].amount.value, '72.00');
  const order = record(t);
  assert.equal(order.quantity, 1);
  assert.equal(order.second_participant_name, null);
  t.db.exec("UPDATE discount_campaigns SET active=0 WHERE id='promo'");
  await t.api(paypalReturn(order.id));
  await t.flush();
  await t.api(paypalReturn(order.id));
  await t.flush();
  assert.equal(record(t).status, 'paid');
  assert.equal(record(t).amount_cents, 7200);
  assert.equal(t.sheetCalls.length, 1);
  assert.deepEqual(t.sheetCalls[0].row.slice(17), [
    80,
    10,
    8,
    'PROMO10X',
    'Одиночная скидка',
    'Максим',
    1,
    '',
  ]);
});
