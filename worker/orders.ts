import { routes } from '../src/lib/site';
import { isEarlyBirdActive } from '../src/lib/early-bird';
import { TICKETS, isTicketKey } from './tickets';

export interface OrdersEnv {
  ORDERS: D1Database;
  ORDERS_ENV?: string; // 'test' | 'live'
  PAYMENTS_ENABLED?: string; // must be 'true'
  stripe_test?: string; // Secret (test key)
  STRIPE_SECRET_KEY?: string; // Secret (live key)
  STRIPE_WEBHOOK_SECRET?: string; // Secret
  ADMIN_TOKEN?: string; // Secret, protects the CSV export
  SHEETS_WEBHOOK_URL?: string; // Google Apps Script web app URL
  SHEETS_TOKEN?: string; // Secret shared with the Apps Script
  PAYPAL_ENABLED?: string;
  PAYPAL_MODE?: string; // 'sandbox' | 'live', must match ORDERS_ENV
  PAYPAL_CLIENT_ID?: string;
  PAYPAL_CLIENT_SECRET?: string;
  PAYPAL_PAYEE_EMAIL?: string;
  PAYPAL_WEBHOOK_ID?: string;
}

export interface Deps {
  fetch: typeof fetch;
  now: () => number; // ms
}
const defaultDeps: Deps = {
  fetch: (...a) => fetch(...a),
  now: () => Date.now(),
};

interface Ctx {
  waitUntil(p: Promise<unknown>): void;
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
const iso = (ms: number) => new Date(ms).toISOString();

// ---------- helpers ----------
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
const hex = (buf: ArrayBuffer) =>
  [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

export async function verifyStripeSignature(
  body: string,
  header: string | null,
  secret: string,
  nowSec: number,
  toleranceSec = 300,
): Promise<boolean> {
  if (!header || !secret) return false;
  const pairs = header.split(',').map((p) => p.trim().split('='));
  const t = pairs.find(([k]) => k === 't')?.[1];
  const sigs = pairs.filter(([k]) => k === 'v1').map(([, v]) => v);
  if (!t || !/^\d+$/.test(t) || !sigs.length) return false;
  if (Math.abs(nowSec - Number(t)) > toleranceSec) return false;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const expected = hex(
    await crypto.subtle.sign(
      'HMAC',
      key,
      new TextEncoder().encode(`${t}.${body}`),
    ),
  );
  return sigs.some((s) => timingSafeEqual(s, expected));
}

export function normalizeContact(
  channel: string,
  raw: string,
): { method: string; value: string } | null {
  const value = raw.trim();
  const user = value.replace(/^@/, '');
  if (channel === 'Telegram' && /^[A-Za-z][A-Za-z0-9_]{4,26}$/.test(user))
    return { method: 'telegram', value: '@' + user };
  if (
    channel === 'Instagram' &&
    /^[A-Za-z0-9_][A-Za-z0-9._]{0,29}$/.test(user) &&
    !user.endsWith('.') &&
    !user.includes('..')
  )
    return { method: 'instagram', value: '@' + user };
  if (
    channel === 'WhatsApp-username' &&
    /^[A-Za-z0-9_][A-Za-z0-9._]{2,29}$/.test(user)
  )
    return { method: 'whatsapp-username', value: '@' + user };
  if (channel === 'WhatsApp-phone') {
    let n = value.replace(/[\s()-]/g, '');
    if (/^0\d{8,13}$/.test(n)) n = '+49' + n.slice(1);
    if (/^\+[1-9]\d{9,14}$/.test(n))
      return { method: 'whatsapp-phone', value: n };
  }
  return null;
}

function stripeKey(env: OrdersEnv): string | null {
  const live = env.ORDERS_ENV === 'live';
  const key = live ? env.STRIPE_SECRET_KEY : env.stripe_test;
  if (!key) return null;
  // Never mix modes: test key only in test env, live key only in live env.
  const ok = live ? /^(sk|rk)_live_/.test(key) : /^(sk|rk)_test_/.test(key);
  return ok ? key : null;
}

function paymentsAllowed(url: URL, env: OrdersEnv): boolean {
  if (env.PAYMENTS_ENABLED !== 'true') return false;
  // Test payments must never be reachable from the public domain.
  if (env.ORDERS_ENV !== 'live' && !url.hostname.endsWith('.workers.dev'))
    return false;
  return true;
}

function paypalReady(env: OrdersEnv): boolean {
  const mode = env.ORDERS_ENV === 'live' ? 'live' : 'sandbox';
  return (
    env.PAYPAL_ENABLED === 'true' &&
    env.PAYPAL_MODE === mode &&
    !!env.PAYPAL_CLIENT_ID &&
    !!env.PAYPAL_CLIENT_SECRET &&
    !!env.PAYPAL_PAYEE_EMAIL &&
    !!env.PAYPAL_WEBHOOK_ID
  );
}

const paypalBase = (env: OrdersEnv) =>
  env.ORDERS_ENV === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

async function paypalToken(env: OrdersEnv, deps: Deps): Promise<string | null> {
  if (!paypalReady(env)) return null;
  const credentials = btoa(
    `${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`,
  );
  try {
    const res = await deps.fetch(`${paypalBase(env)}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { access_token?: string };
    return data.access_token || null;
  } catch {
    return null;
  }
}

function paypalApprovalUrl(links: unknown, live: boolean): string | null {
  if (!Array.isArray(links)) return null;
  const href = links.find(
    (link) => link?.rel === 'payer-action' || link?.rel === 'approve',
  )?.href;
  if (typeof href !== 'string') return null;
  try {
    const url = new URL(href);
    const host = live ? 'www.paypal.com' : 'www.sandbox.paypal.com';
    return url.protocol === 'https:' && url.hostname === host ? href : null;
  } catch {
    return null;
  }
}

const euroAmount = (cents: number) => (cents / 100).toFixed(2);

// ---------- POST /api/orders ----------
async function createOrder(
  request: Request,
  env: OrdersEnv,
  deps: Deps,
): Promise<Response> {
  const url = new URL(request.url);
  if (!paymentsAllowed(url, env))
    return json({ error: 'payments_disabled' }, 403);
  const origin = request.headers.get('Origin');
  let originHost: string | null = null;
  try {
    originHost = origin ? new URL(origin).host : null;
  } catch {
    originHost = null;
  }
  if (originHost !== url.host) return json({ error: 'bad_origin' }, 403);
  const text = await request.text();
  if (text.length > 4096) return json({ error: 'too_large' }, 413);
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(text);
  } catch {
    return json({ error: 'bad_json' }, 400);
  }
  // NOTE: any amount/price sent by the browser is ignored on purpose.
  if (!isTicketKey(body.ticket)) return json({ error: 'bad_ticket' }, 400);
  const requestTime = deps.now();
  if (body.ticket === 'guest_early' && !isEarlyBirdActive(requestTime))
    return json({ error: 'offer_ended', serverTime: requestTime }, 409);
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (name.length < 2 || name.length > 80)
    return json({ error: 'bad_name' }, 400);
  const contact = normalizeContact(
    String(body.channel ?? ''),
    String(body.contact ?? ''),
  );
  if (!contact) return json({ error: 'bad_contact' }, 400);
  if (body.consent !== true) return json({ error: 'consent_required' }, 400);
  const lang = body.lang === 'de' ? 'de' : 'ru';
  const provider =
    body.provider === undefined || body.provider === 'stripe'
      ? 'stripe'
      : body.provider === 'paypal'
        ? 'paypal'
        : null;
  if (!provider) return json({ error: 'bad_provider' }, 400);
  const key = provider === 'stripe' ? stripeKey(env) : null;
  if (provider === 'stripe' ? !key : !paypalReady(env))
    return json({ error: 'payments_not_configured' }, 503);

  const ticket = TICKETS[body.ticket];
  const id = crypto.randomUUID();
  const now = iso(requestTime);
  await env.ORDERS.prepare(
    `INSERT INTO orders (id,event_id,ticket_type,customer_name,contact_method,contact_value,amount_cents,currency,status,provider,created_at,updated_at)
     VALUES (?,?,?,?,?,?,?, 'EUR','pending',?,?,?)`,
  )
    .bind(
      id,
      ticket.eventId,
      body.ticket,
      name,
      contact.method,
      contact.value,
      ticket.amountCents,
      provider,
      now,
      now,
    )
    .run();

  const events = `${url.origin}${routes.events[lang]}`;
  if (provider === 'paypal') {
    const accessToken = await paypalToken(env, deps);
    if (!accessToken) {
      await failPendingOrder(env, id, deps.now());
      return json({ error: 'paypal_unavailable' }, 502);
    }
    try {
      const res = await deps.fetch(`${paypalBase(env)}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'PayPal-Request-Id': id,
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          intent: 'CAPTURE',
          purchase_units: [
            {
              reference_id: id,
              custom_id: id,
              description: ticket.label[lang],
              payee: { email_address: env.PAYPAL_PAYEE_EMAIL },
              amount: {
                currency_code: 'EUR',
                value: euroAmount(ticket.amountCents),
              },
            },
          ],
          payment_source: {
            paypal: {
              experience_context: {
                return_url: `${url.origin}/api/paypal/return?order=${id}&lang=${lang}`,
                cancel_url: `${url.origin}/api/paypal/cancel?order=${id}&lang=${lang}`,
                shipping_preference: 'NO_SHIPPING',
                user_action: 'PAY_NOW',
              },
            },
          },
        }),
      });
      const data = (await res.json()) as { id?: string; links?: unknown };
      const approval = paypalApprovalUrl(data.links, env.ORDERS_ENV === 'live');
      if (!res.ok || !data.id || !approval) throw new Error('paypal_error');
      await env.ORDERS.prepare(
        `UPDATE orders SET provider_session_id=?, updated_at=? WHERE id=?`,
      )
        .bind(data.id, iso(deps.now()), id)
        .run();
      return json({ url: approval });
    } catch {
      await failPendingOrder(env, id, deps.now());
      return json({ error: 'paypal_unavailable' }, 502);
    }
  }
  const form = new URLSearchParams({
    mode: 'payment',
    'payment_method_types[0]': 'card',
    'line_items[0][quantity]': '1',
    'line_items[0][price_data][currency]': 'eur',
    'line_items[0][price_data][unit_amount]': String(ticket.amountCents),
    'line_items[0][price_data][product_data][name]': ticket.label[lang],
    client_reference_id: id,
    'metadata[order_id]': id,
    'payment_intent_data[metadata][order_id]': id,
    success_url: `${events}?payment=success`,
    cancel_url: `${events}?payment=cancelled`,
    locale: lang,
    expires_at: String(Math.floor(deps.now() / 1000) + 35 * 60),
  });
  let session: { id?: string; url?: string } = {};
  try {
    const res = await deps.fetch(
      'https://api.stripe.com/v1/checkout/sessions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Idempotency-Key': `order-${id}`,
        },
        body: form.toString(),
      },
    );
    session = (await res.json()) as typeof session;
    if (!res.ok || !session.id || !session.url) throw new Error('stripe_error');
  } catch {
    await failPendingOrder(env, id, deps.now());
    return json({ error: 'stripe_unavailable' }, 502);
  }
  await env.ORDERS.prepare(
    `UPDATE orders SET provider_session_id=?, updated_at=? WHERE id=?`,
  )
    .bind(session.id, iso(deps.now()), id)
    .run();
  return json({ url: session.url });
}

async function failPendingOrder(env: OrdersEnv, id: string, now: number) {
  await env.ORDERS.prepare(
    `UPDATE orders SET status='failed', updated_at=? WHERE id=? AND status='pending'`,
  )
    .bind(iso(now), id)
    .run();
}

// ---------- POST /api/stripe/webhook ----------
interface OrderRow {
  id: string;
  provider: string;
  ticket_type: string;
  customer_name: string;
  contact_method: string;
  contact_value: string;
  amount_cents: number;
  currency: string;
  status: string;
  provider_session_id: string | null;
}
// deno-lint-ignore no-explicit-any
type Obj = any;

function paypalReturnLocation(url: URL, payment: string): string {
  const lang = url.searchParams.get('lang') === 'de' ? 'de' : 'ru';
  const target = new URL(routes.events[lang], url.origin);
  target.searchParams.set('payment', payment);
  return target.toString();
}

function returnRedirect(url: URL, payment: string): Response {
  return new Response(null, {
    status: 303,
    headers: {
      Location: paypalReturnLocation(url, payment),
      'Cache-Control': 'no-store',
    },
  });
}

function paypalCaptureDetails(
  data: Obj,
  order: OrderRow,
  payeeEmail: string,
): {
  captureId: string;
  email: string | null;
} | null {
  const unit = data?.purchase_units?.[0];
  const capture = unit?.payments?.captures?.[0];
  if (
    data?.id !== order.provider_session_id ||
    data?.status !== 'COMPLETED' ||
    capture?.status !== 'COMPLETED' ||
    unit?.reference_id !== order.id ||
    unit?.custom_id !== order.id ||
    unit?.payee?.email_address?.toLowerCase() !== payeeEmail.toLowerCase() ||
    capture?.amount?.currency_code !== order.currency ||
    capture?.amount?.value !== euroAmount(order.amount_cents) ||
    typeof capture?.id !== 'string'
  )
    return null;
  return { captureId: capture.id, email: data?.payer?.email_address ?? null };
}

async function markPayPalPaid(
  env: OrdersEnv,
  ctx: Ctx,
  deps: Deps,
  order: OrderRow,
  details: { captureId: string; email: string | null },
): Promise<void> {
  const now = iso(deps.now());
  const result = await env.ORDERS.prepare(
    `UPDATE orders SET status='paid', email=?, provider_payment_id=?, paid_at=?, cancelled_at=NULL, updated_at=?
     WHERE id=? AND provider='paypal' AND status IN ('pending','cancelled')`,
  )
    .bind(details.email, details.captureId, now, now, order.id)
    .run();
  if (result.meta.changes === 1)
    ctx.waitUntil(pushToSheet(env, deps, order, details.email, now));
}

async function capturePayPalOrder(
  env: OrdersEnv,
  deps: Deps,
  order: OrderRow,
): Promise<{ captureId: string; email: string | null } | null> {
  if (!order.provider_session_id || !env.PAYPAL_PAYEE_EMAIL) return null;
  const accessToken = await paypalToken(env, deps);
  if (!accessToken) return null;
  try {
    const res = await deps.fetch(
      `${paypalBase(env)}/v2/checkout/orders/${encodeURIComponent(order.provider_session_id)}/capture`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'PayPal-Request-Id': `c${order.id.replace(/-/g, '')}`,
          Prefer: 'return=representation',
        },
        body: '{}',
      },
    );
    if (!res.ok) return null;
    return paypalCaptureDetails(
      await res.json(),
      order,
      env.PAYPAL_PAYEE_EMAIL,
    );
  } catch {
    return null;
  }
}

async function paypalReturn(
  request: Request,
  env: OrdersEnv,
  ctx: Ctx,
  deps: Deps,
): Promise<Response> {
  if (request.method !== 'GET') return json({ error: 'method' }, 405);
  const url = new URL(request.url);
  const id = url.searchParams.get('order');
  const token = url.searchParams.get('token');
  if (
    !id ||
    !token ||
    !/^[0-9a-f-]{36}$/i.test(id) ||
    !/^[A-Z0-9]{10,30}$/.test(token)
  )
    return json({ error: 'bad_return' }, 400);
  const order = await env.ORDERS.prepare(
    `SELECT * FROM orders WHERE id=? AND provider='paypal'`,
  )
    .bind(id)
    .first<OrderRow>();
  if (!order || order.provider_session_id !== token)
    return json({ error: 'bad_return' }, 400);
  if (order.status === 'paid') return returnRedirect(url, 'success');
  if (order.status !== 'pending' && order.status !== 'cancelled')
    return returnRedirect(url, 'error');
  const details = await capturePayPalOrder(env, deps, order);
  if (!details) return returnRedirect(url, 'error');
  await markPayPalPaid(env, ctx, deps, order, details);
  return returnRedirect(url, 'success');
}

async function paypalCancel(
  request: Request,
  env: OrdersEnv,
  deps: Deps,
): Promise<Response> {
  if (request.method !== 'GET') return json({ error: 'method' }, 405);
  const url = new URL(request.url);
  const id = url.searchParams.get('order');
  const token = url.searchParams.get('token');
  if (
    !id ||
    !token ||
    !/^[0-9a-f-]{36}$/i.test(id) ||
    !/^[A-Z0-9]{10,30}$/.test(token)
  )
    return json({ error: 'bad_return' }, 400);
  await env.ORDERS.prepare(
    `UPDATE orders SET status='cancelled', cancelled_at=?, updated_at=?
     WHERE id=? AND provider='paypal' AND provider_session_id=? AND status='pending'`,
  )
    .bind(iso(deps.now()), iso(deps.now()), id, token)
    .run();
  const current = await env.ORDERS.prepare(
    "SELECT status FROM orders WHERE id=? AND provider='paypal'",
  )
    .bind(id)
    .first<{ status: string }>();
  return returnRedirect(
    url,
    current?.status === 'paid' ? 'success' : 'cancelled',
  );
}

async function paypalOrderDetails(
  env: OrdersEnv,
  deps: Deps,
  order: OrderRow,
): Promise<Obj | null> {
  if (!order.provider_session_id) return null;
  const token = await paypalToken(env, deps);
  if (!token) return null;
  try {
    const res = await deps.fetch(
      `${paypalBase(env)}/v2/checkout/orders/${encodeURIComponent(order.provider_session_id)}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

// PayPal verifies the signed event using this app's webhook ID. No event is trusted
// merely because it arrived at our public URL.
async function verifyPayPalWebhook(
  request: Request,
  raw: string,
  env: OrdersEnv,
  deps: Deps,
): Promise<boolean | null> {
  const fields = {
    transmission_id: request.headers.get('paypal-transmission-id'),
    transmission_time: request.headers.get('paypal-transmission-time'),
    cert_url: request.headers.get('paypal-cert-url'),
    auth_algo: request.headers.get('paypal-auth-algo'),
    transmission_sig: request.headers.get('paypal-transmission-sig'),
    webhook_id: env.PAYPAL_WEBHOOK_ID,
  };
  if (Object.values(fields).some((v) => !v)) return false;
  const token = await paypalToken(env, deps);
  if (!token) return null;
  try {
    const res = await deps.fetch(
      `${paypalBase(env)}/v1/notifications/verify-webhook-signature`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        // PayPal requires the webhook event to be posted back exactly as received.
        body: `${JSON.stringify(fields).slice(0, -1)},"webhook_event":${raw}}`,
      },
    );
    if (!res.ok) return null;
    const result = (await res.json()) as { verification_status?: string };
    return result.verification_status === 'SUCCESS';
  } catch {
    return null;
  }
}

async function paypalWebhook(
  request: Request,
  env: OrdersEnv,
  ctx: Ctx,
  deps: Deps,
): Promise<Response> {
  if (request.method !== 'POST') return json({ error: 'method' }, 405);
  if (!paypalReady(env)) return json({ error: 'not_configured' }, 503);
  const raw = await request.text();
  if (raw.length > 65536) return json({ error: 'too_large' }, 413);
  let event: Obj;
  try {
    event = JSON.parse(raw);
  } catch {
    return json({ error: 'bad_json' }, 400);
  }
  const verified = await verifyPayPalWebhook(request, raw, env, deps);
  if (verified === null)
    return json({ error: 'verification_unavailable' }, 503);
  if (!verified) return json({ error: 'bad_signature' }, 400);
  if (typeof event?.id !== 'string' || typeof event?.event_type !== 'string')
    return json({ error: 'bad_event' }, 400);
  const eventId = `paypal:${event.id}`;
  if (
    await env.ORDERS.prepare(
      'SELECT 1 AS x FROM webhook_events WHERE event_id=?',
    )
      .bind(eventId)
      .first()
  )
    return json({ received: true, duplicate: true });

  const type = event.event_type as string;
  const resource = event.resource ?? {};
  let order: OrderRow | null = null;
  let outcome = 'ignored:unrelated';
  const sessionId =
    type === 'CHECKOUT.ORDER.APPROVED'
      ? resource.id
      : resource.supplementary_data?.related_ids?.order_id;
  if (typeof sessionId === 'string') {
    order = await env.ORDERS.prepare(
      "SELECT * FROM orders WHERE provider='paypal' AND provider_session_id=?",
    )
      .bind(sessionId)
      .first<OrderRow>();
  }
  if (
    type === 'CHECKOUT.ORDER.APPROVED' &&
    (order?.status === 'pending' || order?.status === 'cancelled')
  ) {
    const details = await capturePayPalOrder(env, deps, order);
    if (!details) return json({ error: 'capture_unavailable' }, 503);
    await markPayPalPaid(env, ctx, deps, order, details);
    outcome = 'applied';
  } else if (type === 'PAYMENT.CAPTURE.COMPLETED' && order) {
    if (order.status === 'pending' || order.status === 'cancelled') {
      const paypalOrder = await paypalOrderDetails(env, deps, order);
      if (!paypalOrder) return json({ error: 'order_unavailable' }, 503);
      const details = paypalCaptureDetails(
        paypalOrder,
        order,
        env.PAYPAL_PAYEE_EMAIL!,
      );
      if (
        details &&
        details.captureId === resource.id &&
        resource.status === 'COMPLETED' &&
        resource.amount?.currency_code === order.currency &&
        resource.amount?.value === euroAmount(order.amount_cents)
      ) {
        await markPayPalPaid(env, ctx, deps, order, details);
        outcome = 'applied';
      } else outcome = 'rejected:capture_mismatch';
    } else outcome = `ignored:status_${order.status}`;
  } else if (type === 'PAYMENT.CAPTURE.REFUNDED') {
    const related = resource.supplementary_data?.related_ids?.capture_id;
    const up = Array.isArray(resource.links)
      ? resource.links.find((link: Obj) => link?.rel === 'up')?.href
      : null;
    const captureId =
      typeof related === 'string'
        ? related
        : typeof up === 'string'
          ? up.match(/\/v2\/payments\/captures\/([A-Z0-9]+)$/)?.[1]
          : null;
    if (captureId) {
      order = await env.ORDERS.prepare(
        "SELECT * FROM orders WHERE provider='paypal' AND provider_payment_id=?",
      )
        .bind(captureId)
        .first<OrderRow>();
    }
    if (
      order?.status === 'paid' &&
      resource.status === 'COMPLETED' &&
      resource.amount?.currency_code === order.currency &&
      resource.amount?.value === euroAmount(order.amount_cents)
    ) {
      await env.ORDERS.prepare(
        "UPDATE orders SET status='refunded', refunded_at=?, updated_at=? WHERE id=? AND provider='paypal' AND status='paid'",
      )
        .bind(iso(deps.now()), iso(deps.now()), order.id)
        .run();
      outcome = 'applied';
    } else outcome = 'ignored:partial_or_unknown_refund';
  }
  await env.ORDERS.prepare(
    'INSERT OR IGNORE INTO webhook_events (event_id,type,order_id,outcome,received_at) VALUES (?,?,?,?,?)',
  )
    .bind(eventId, type, order?.id ?? null, outcome, iso(deps.now()))
    .run();
  return json({ received: true });
}

async function stripeWebhook(
  request: Request,
  env: OrdersEnv,
  ctx: Ctx,
  deps: Deps,
): Promise<Response> {
  if (request.method !== 'POST') return json({ error: 'method' }, 405);
  if (!env.STRIPE_WEBHOOK_SECRET) return json({ error: 'not_configured' }, 503);
  const body = await request.text();
  const ok = await verifyStripeSignature(
    body,
    request.headers.get('Stripe-Signature'),
    env.STRIPE_WEBHOOK_SECRET,
    Math.floor(deps.now() / 1000),
  );
  if (!ok) return json({ error: 'bad_signature' }, 400);
  const event: Obj = JSON.parse(body);
  const eventId: string = event.id;
  const type: string = event.type;
  const obj: Obj = event.data?.object ?? {};
  const now = iso(deps.now());

  const seen = await env.ORDERS.prepare(
    `SELECT 1 AS x FROM webhook_events WHERE event_id=?`,
  )
    .bind(eventId)
    .first();
  if (seen) return json({ received: true, duplicate: true });

  const record = (orderId: string | null, outcome: string) =>
    env.ORDERS.prepare(
      `INSERT OR IGNORE INTO webhook_events (event_id,type,order_id,outcome,received_at) VALUES (?,?,?,?,?)`,
    ).bind(eventId, type, orderId, outcome, now);

  const orderFor = async (session: Obj) => {
    const orderId: string | undefined =
      session.client_reference_id ?? session.metadata?.order_id;
    if (!orderId) return { orderId: null, order: null };
    const order = await env.ORDERS.prepare(`SELECT * FROM orders WHERE id=?`)
      .bind(orderId)
      .first<OrderRow>();
    return { orderId, order };
  };

  switch (type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded': {
      if (obj.payment_status !== 'paid') {
        await record(
          obj.client_reference_id ?? null,
          'ignored:not_paid_yet',
        ).run();
        break;
      }
      const { orderId, order } = await orderFor(obj);
      if (!order) {
        await record(orderId, 'rejected:unknown_order').run();
        break;
      }
      // Reconcile order id, session id, currency and amount before touching the order.
      let reason: string | null = null;
      if (order.provider_session_id !== obj.id) reason = 'session_mismatch';
      else if (String(obj.currency ?? '').toUpperCase() !== order.currency)
        reason = 'currency_mismatch';
      else if (obj.amount_total !== order.amount_cents)
        reason = 'amount_mismatch';
      if (reason) {
        await record(order.id, `rejected:${reason}`).run();
        console.error('stripe webhook rejected', {
          eventId,
          orderId: order.id,
          reason,
        });
        break;
      }
      if (order.status !== 'pending') {
        await record(order.id, `ignored:status_${order.status}`).run();
        break;
      }
      const email: string | null =
        obj.customer_details?.email ?? obj.customer_email ?? null;
      const [, upd] = await env.ORDERS.batch([
        record(order.id, 'applied'),
        env.ORDERS.prepare(
          `UPDATE orders SET status='paid', email=?, provider_payment_id=?, paid_at=?, updated_at=?
           WHERE id=? AND status='pending'`,
        ).bind(email, obj.payment_intent ?? null, now, now, order.id),
      ]);
      if (upd.meta.changes === 1)
        ctx.waitUntil(pushToSheet(env, deps, order, email, now));
      break;
    }
    case 'checkout.session.expired': {
      const { orderId } = await orderFor(obj);
      await env.ORDERS.batch([
        record(orderId, 'applied'),
        env.ORDERS.prepare(
          `UPDATE orders SET status='cancelled', cancelled_at=?, updated_at=?
           WHERE id=? AND provider_session_id=? AND status='pending'`,
        ).bind(now, now, orderId, obj.id),
      ]);
      break;
    }
    case 'checkout.session.async_payment_failed': {
      const { orderId } = await orderFor(obj);
      await env.ORDERS.batch([
        record(orderId, 'applied'),
        env.ORDERS.prepare(
          `UPDATE orders SET status='failed', updated_at=? WHERE id=? AND provider_session_id=? AND status='pending'`,
        ).bind(now, orderId, obj.id),
      ]);
      break;
    }
    case 'charge.refunded': {
      if (obj.refunded !== true) {
        await record(null, 'ignored:partial_refund').run();
        break;
      }
      await env.ORDERS.batch([
        record(null, 'applied'),
        env.ORDERS.prepare(
          `UPDATE orders SET status='refunded', refunded_at=?, updated_at=?
           WHERE provider_payment_id=? AND status='paid'`,
        ).bind(now, now, obj.payment_intent),
      ]);
      break;
    }
    default:
      break; // other event types are acknowledged without changes
  }
  return json({ received: true });
}

async function pushToSheet(
  env: OrdersEnv,
  deps: Deps,
  order: OrderRow,
  email: string | null,
  paidAt: string,
) {
  if (!env.SHEETS_WEBHOOK_URL || !env.SHEETS_TOKEN) return;
  const ticket = TICKETS[order.ticket_type as keyof typeof TICKETS];
  try {
    await deps.fetch(env.SHEETS_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: env.SHEETS_TOKEN,
        tab: ticket?.sheetTab ?? 'Other',
        row: [
          paidAt,
          order.id,
          order.ticket_type,
          order.customer_name,
          order.contact_method,
          order.contact_value,
          email ?? '',
          order.amount_cents / 100,
          'paid',
        ],
      }),
    });
  } catch (e) {
    console.error('sheet push failed (order is safe in D1)', order.id, e);
  }
}

// ---------- GET /api/admin/orders.csv ----------
const csvCell = (v: unknown) => {
  let s = v == null ? '' : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; // spreadsheet formula injection
  return `"${s.replace(/"/g, '""')}"`;
};

async function adminCsv(request: Request, env: OrdersEnv): Promise<Response> {
  if (!env.ADMIN_TOKEN) return json({ error: 'not_found' }, 404);
  const auth = request.headers.get('Authorization') ?? '';
  if (!timingSafeEqual(auth, `Bearer ${env.ADMIN_TOKEN}`))
    return json({ error: 'unauthorized' }, 401);
  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const eventId = url.searchParams.get('event');
  const where: string[] = [];
  const args: string[] = [];
  if (status) (where.push('status=?'), args.push(status));
  if (eventId) (where.push('event_id=?'), args.push(eventId));
  const { results } = await env.ORDERS.prepare(
    `SELECT id,event_id,ticket_type,customer_name,contact_method,contact_value,email,amount_cents,currency,status,provider,provider_session_id,provider_payment_id,created_at,paid_at,refunded_at,cancelled_at
     FROM orders ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY created_at`,
  )
    .bind(...args)
    .all<Record<string, unknown>>();
  const cols = results.length ? Object.keys(results[0]) : [];
  const csv = [
    cols.join(','),
    ...results.map((r) => cols.map((c) => csvCell(r[c])).join(',')),
  ].join('\n');
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="rost-orders.csv"',
      'Cache-Control': 'no-store',
    },
  });
}

// ---------- router ----------
export async function handleApi(
  request: Request,
  env: OrdersEnv,
  ctx: Ctx,
  deps: Deps = defaultDeps,
): Promise<Response> {
  const url = new URL(request.url);
  const { pathname } = url;
  if (pathname === '/api/payments/config') {
    if (request.method !== 'GET') return json({ error: 'method' }, 405);
    const enabled = paymentsAllowed(url, env);
    return json({
      mode: env.ORDERS_ENV === 'live' ? 'live' : 'test',
      stripe: enabled && !!stripeKey(env),
      paypal: enabled && paypalReady(env),
    });
  }
  if (pathname === '/api/config') {
    if (request.method !== 'GET') return json({ error: 'method' }, 405);
    const enabled = paymentsAllowed(url, env);
    const stripe = enabled && stripeKey(env) !== null;
    const paypal = enabled && paypalReady(env);
    return json({
      paymentsEnabled: stripe || paypal,
      mode: env.ORDERS_ENV === 'live' ? 'live' : 'test',
      stripe,
      paypal,
      serverTime: deps.now(),
    });
  }
  if (pathname === '/api/orders') {
    if (request.method !== 'POST') return json({ error: 'method' }, 405);
    return createOrder(request, env, deps);
  }
  if (pathname === '/api/paypal/return')
    return paypalReturn(request, env, ctx, deps);
  if (pathname === '/api/paypal/cancel')
    return paypalCancel(request, env, deps);
  if (pathname === '/api/paypal/webhook')
    return paypalWebhook(request, env, ctx, deps);
  if (pathname === '/api/stripe/webhook')
    return stripeWebhook(request, env, ctx, deps);
  if (pathname === '/api/admin/orders.csv' && request.method === 'GET')
    return adminCsv(request, env);
  return json({ error: 'not_found' }, 404);
}
