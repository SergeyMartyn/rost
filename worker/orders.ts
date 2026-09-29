import { routes } from '../src/lib/site';
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
}

export interface Deps {
  fetch: typeof fetch;
  now: () => number; // ms
}
const defaultDeps: Deps = { fetch: (...a) => fetch(...a), now: () => Date.now() };

interface Ctx {
  waitUntil(p: Promise<unknown>): void;
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
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
    await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${t}.${body}`)),
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
  if (channel === 'WhatsApp-username' && /^[A-Za-z0-9_][A-Za-z0-9._]{2,29}$/.test(user))
    return { method: 'whatsapp-username', value: '@' + user };
  if (channel === 'WhatsApp-phone') {
    let n = value.replace(/[\s()-]/g, '');
    if (/^0\d{8,13}$/.test(n)) n = '+49' + n.slice(1);
    if (/^\+[1-9]\d{9,14}$/.test(n)) return { method: 'whatsapp-phone', value: n };
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
  if (env.ORDERS_ENV !== 'live' && !url.hostname.endsWith('.workers.dev')) return false;
  return true;
}

// ---------- POST /api/orders ----------
async function createOrder(request: Request, env: OrdersEnv, deps: Deps): Promise<Response> {
  const url = new URL(request.url);
  if (!paymentsAllowed(url, env)) return json({ error: 'payments_disabled' }, 403);
  const origin = request.headers.get('Origin');
  let originHost: string | null = null;
  try {
    originHost = origin ? new URL(origin).host : null;
  } catch {
    originHost = null;
  }
  if (!originHost || originHost !== url.host) return json({ error: 'bad_origin' }, 403);
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
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (name.length < 2 || name.length > 80) return json({ error: 'bad_name' }, 400);
  const contact = normalizeContact(String(body.channel ?? ''), String(body.contact ?? ''));
  if (!contact) return json({ error: 'bad_contact' }, 400);
  if (body.consent !== true) return json({ error: 'consent_required' }, 400);
  const lang = body.lang === 'de' ? 'de' : 'ru';
  const key = stripeKey(env);
  if (!key) return json({ error: 'payments_not_configured' }, 503);

  const ticket = TICKETS[body.ticket];
  const id = crypto.randomUUID();
  const now = iso(deps.now());
  await env.ORDERS.prepare(
    `INSERT INTO orders (id,event_id,ticket_type,customer_name,contact_method,contact_value,amount_cents,currency,status,provider,created_at,updated_at)
     VALUES (?,?,?,?,?,?,?, 'EUR','pending','stripe',?,?)`,
  )
    .bind(id, ticket.eventId, body.ticket, name, contact.method, contact.value, ticket.amountCents, now, now)
    .run();

  const events = `${url.origin}${routes.events[lang]}`;
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
    const res = await deps.fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Idempotency-Key': `order-${id}`,
      },
      body: form.toString(),
    });
    session = (await res.json()) as typeof session;
    if (!res.ok || !session.id || !session.url) throw new Error('stripe_error');
  } catch {
    await env.ORDERS.prepare(
      `UPDATE orders SET status='failed', updated_at=? WHERE id=? AND status='pending'`,
    )
      .bind(iso(deps.now()), id)
      .run();
    return json({ error: 'stripe_unavailable' }, 502);
  }
  await env.ORDERS.prepare(`UPDATE orders SET provider_session_id=?, updated_at=? WHERE id=?`)
    .bind(session.id, iso(deps.now()), id)
    .run();
  return json({ url: session.url });
}

// ---------- POST /api/stripe/webhook ----------
interface OrderRow {
  id: string;
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

  const seen = await env.ORDERS.prepare(`SELECT 1 AS x FROM webhook_events WHERE event_id=?`)
    .bind(eventId)
    .first();
  if (seen) return json({ received: true, duplicate: true });

  const record = (orderId: string | null, outcome: string) =>
    env.ORDERS.prepare(
      `INSERT OR IGNORE INTO webhook_events (event_id,type,order_id,outcome,received_at) VALUES (?,?,?,?,?)`,
    ).bind(eventId, type, orderId, outcome, now);

  const orderFor = async (session: Obj) => {
    const orderId: string | undefined = session.client_reference_id ?? session.metadata?.order_id;
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
        await record(obj.client_reference_id ?? null, 'ignored:not_paid_yet').run();
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
      else if (String(obj.currency ?? '').toUpperCase() !== order.currency) reason = 'currency_mismatch';
      else if (obj.amount_total !== order.amount_cents) reason = 'amount_mismatch';
      if (reason) {
        await record(order.id, `rejected:${reason}`).run();
        console.error('stripe webhook rejected', { eventId, orderId: order.id, reason });
        break;
      }
      if (order.status !== 'pending') {
        await record(order.id, `ignored:status_${order.status}`).run();
        break;
      }
      const email: string | null = obj.customer_details?.email ?? obj.customer_email ?? null;
      const [, upd] = await env.ORDERS.batch([
        record(order.id, 'applied'),
        env.ORDERS.prepare(
          `UPDATE orders SET status='paid', email=?, provider_payment_id=?, paid_at=?, updated_at=?
           WHERE id=? AND status='pending'`,
        ).bind(email, obj.payment_intent ?? null, now, now, order.id),
      ]);
      if (upd.meta.changes === 1) ctx.waitUntil(pushToSheet(env, deps, order, email, now));
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
  if (!timingSafeEqual(auth, `Bearer ${env.ADMIN_TOKEN}`)) return json({ error: 'unauthorized' }, 401);
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
  const csv = [cols.join(','), ...results.map((r) => cols.map((c) => csvCell(r[c])).join(','))].join('\n');
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
  const { pathname } = new URL(request.url);
  if (pathname === '/api/orders') {
    if (request.method !== 'POST') return json({ error: 'method' }, 405);
    return createOrder(request, env, deps);
  }
  if (pathname === '/api/config' && request.method === 'GET') {
    const enabled = paymentsAllowed(new URL(request.url), env) && stripeKey(env) !== null;
    return json({ paymentsEnabled: enabled, mode: env.ORDERS_ENV === 'live' ? 'live' : 'test' });
  }
  if (pathname === '/api/stripe/webhook') return stripeWebhook(request, env, ctx, deps);
  if (pathname === '/api/admin/orders.csv' && request.method === 'GET') return adminCsv(request, env);
  return json({ error: 'not_found' }, 404);
}
