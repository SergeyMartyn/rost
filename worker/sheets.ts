import type { Deps, OrdersEnv } from './orders';
import type { HostRegistrationRow } from './host';
import { TICKETS } from './tickets';

type Payment = {
  quantity?: number;
  second_participant_name?: string | null;
  id: string;
  provider: string;
  ticket_type: string;
  customer_name: string;
  contact_method: string;
  contact_value: string;
  email: string | null;
  amount_cents: number;
  paid_at: string | null;
  base_amount_cents?: number | null;
  discount_cents?: number;
  discount_percent?: number;
  promo_code?: string | null;
  promotion_kind?: string | null;
  issuer_name?: string | null;
};
type SheetRow = (string | number)[];
const safeCell = (value: string | number): string | number =>
  typeof value === 'string' && /^[=+\-@\t\r]/.test(value) ? "'" + value : value;

// Live Tickets layout: H amount, I method, J status; host fields K:Q, pricing R:Y.
const paymentMethod = (provider: string): string =>
  provider === 'stripe' ? 'Stripe' : provider === 'paypal' ? 'PayPal' : '';
export function orderSheetRow(order: Payment): SheetRow {
  return [
    order.paid_at ?? '',
    order.id,
    order.ticket_type,
    order.customer_name,
    order.contact_method,
    order.contact_value,
    order.email ?? '',
    order.amount_cents / 100,
    paymentMethod(order.provider),
    'paid',
    // Keep K:Q reserved for hosts. New pricing columns start at R.
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    (order.base_amount_cents ?? order.amount_cents) / 100,
    order.discount_percent ?? 0,
    (order.discount_cents ?? 0) / 100,
    order.promo_code ?? '',
    order.promotion_kind === 'family'
      ? 'Семейная'
      : order.promotion_kind === 'referral'
        ? 'Приведи друга'
        : order.promotion_kind === 'promo'
          ? 'Одиночная скидка'
          : '',
    order.issuer_name ?? '',
    order.quantity ?? 1,
    order.second_participant_name ?? '',
  ];
}

export function hostSheetRow(host: HostRegistrationRow): SheetRow {
  return [
    host.paid_at ?? '',
    host.id,
    'host',
    host.customer_name,
    host.contact_method,
    host.contact_value,
    host.email,
    host.amount_paid_cents / 100,
    paymentMethod(host.provider),
    'paid',
    host.total_cents / 100,
    host.remaining_cents / 100,
    host.table_no ?? '',
    host.deposit_requested ? 'Предоплата' : 'Полная оплата',
    host.format === 'expanded' ? 'Расширенный' : 'Стандартный',
    host.media_package ? 'Да' : 'Нет',
    host.game_title,
  ];
}

async function deliver(
  env: OrdersEnv,
  deps: Deps,
  exportId: string,
  tab: string,
  row: SheetRow,
): Promise<void> {
  if (!env.SHEETS_WEBHOOK_URL || !env.SHEETS_TOKEN) return;
  const now = deps.now();
  const lease = crypto.randomUUID();
  try {
    // Atomic lease prevents concurrent webhook/cron deliveries. If an isolate dies,
    // the lease expires; the receiving script deduplicates ambiguous successes.
    const claimed = await env.ORDERS.prepare(
      `
      INSERT INTO sheet_exports(export_id, attempts, next_attempt_at, lease_token)
      VALUES (?, 1, ?, ?)
      ON CONFLICT(export_id) DO UPDATE SET attempts=attempts+1,
        next_attempt_at=excluded.next_attempt_at, lease_token=excluded.lease_token
      WHERE delivered_at IS NULL AND next_attempt_at<=?
    `,
    )
      .bind(exportId, now + 120_000, lease, now)
      .run();
    if (claimed.meta.changes !== 1) return;
    try {
      const response = await deps.fetch(env.SHEETS_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: env.SHEETS_TOKEN,
          tab,
          row: row.map(safeCell),
        }),
        signal: AbortSignal.timeout(10_000),
      });
      // Apps Script can return HTTP 200 with "forbidden" or an HTML error page.
      const reader = response.body?.getReader();
      let reply = '';
      if (reader) {
        try {
          while (true) {
            const part = await reader.read();
            if (part.done) break;
            reply += new TextDecoder().decode(part.value);
            if (reply.length > 256) break;
          }
        } finally {
          await reader.cancel();
        }
      }
      if (!response.ok || reply.trim() !== 'ok')
        throw new Error(
          response.ok ? 'invalid_acknowledgement' : `http_${response.status}`,
        );
      await env.ORDERS.prepare(
        `UPDATE sheet_exports SET delivered_at=?,
        lease_token=NULL, last_error=NULL WHERE export_id=? AND lease_token=?`,
      )
        .bind(new Date(deps.now()).toISOString(), exportId, lease)
        .run();
    } catch (error) {
      // Store no URL, token, response body or buyer information in diagnostics.
      const reason =
        error instanceof Error &&
        /^(http_\d+|invalid_acknowledgement)$/.test(error.message)
          ? error.message
          : 'delivery_failed';
      await env.ORDERS.prepare(
        `UPDATE sheet_exports SET lease_token=NULL,
        last_error=?, next_attempt_at=? + MIN(3600000, 60000 * (1 << MIN(attempts-1, 6)))
        WHERE export_id=? AND lease_token=?`,
      )
        .bind(reason, deps.now(), exportId, lease)
        .run();
      console.error('sheet delivery deferred', { exportId, reason });
    }
  } catch {
    // Reconciliation also finds paid records for which no receipt was created.
    console.error('sheet delivery state unavailable', { exportId });
  }
}

export function exportOrderPayment(env: OrdersEnv, deps: Deps, order: Payment) {
  const ticket = TICKETS[order.ticket_type as keyof typeof TICKETS];
  return deliver(
    env,
    deps,
    `order:${order.id}`,
    ticket?.sheetTab ?? 'Other',
    orderSheetRow(order),
  );
}

export function exportHostPayment(
  env: OrdersEnv,
  deps: Deps,
  host: HostRegistrationRow,
) {
  return deliver(
    env,
    deps,
    `host:${host.id}`,
    TICKETS.host.sheetTab,
    hostSheetRow(host),
  );
}

// Runs on the five-minute cron. Catches failed/missed sends and
// backfills existing paid records, without changing payment or booking state.
export async function reconcileSheetPayments(
  env: OrdersEnv,
  deps: Deps,
): Promise<void> {
  if (!env.SHEETS_WEBHOOK_URL || !env.SHEETS_TOKEN) return;
  const due = await env.ORDERS.prepare(
    `
    SELECT 'order' AS kind, o.id FROM orders o
    LEFT JOIN sheet_exports e ON e.export_id='order:'||o.id
    WHERE o.status='paid' AND (e.export_id IS NULL OR (e.delivered_at IS NULL AND e.next_attempt_at<=?))
    UNION ALL
    SELECT 'host' AS kind, h.id FROM host_registrations h
    LEFT JOIN sheet_exports e ON e.export_id='host:'||h.id
    WHERE h.status='paid' AND (e.export_id IS NULL OR (e.delivered_at IS NULL AND e.next_attempt_at<=?))
    LIMIT 10
  `,
  )
    .bind(deps.now(), deps.now())
    .all<{ kind: string; id: string }>();
  for (const item of due.results) {
    if (item.kind === 'host') {
      const host = await env.ORDERS.prepare(
        `SELECT id, provider, paid_at, customer_name, email,
        contact_method, contact_value, amount_paid_cents, total_cents, remaining_cents,
        table_no, deposit_requested, format, media_package, game_title
        FROM host_registrations WHERE id=? AND status='paid'`,
      )
        .bind(item.id)
        .first<HostRegistrationRow>();
      if (host) await exportHostPayment(env, deps, host);
    } else {
      const order = await env.ORDERS.prepare(
        `SELECT id, provider, paid_at, ticket_type, customer_name,
        contact_method, contact_value, email, amount_cents,
        base_amount_cents, discount_cents, discount_percent, promo_code, promotion_kind, issuer_name, quantity, second_participant_name
        FROM orders WHERE id=? AND status='paid'`,
      )
        .bind(item.id)
        .first<Payment>();
      if (order) await exportOrderPayment(env, deps, order);
    }
  }
}
