import { HOST_TABLE_COUNT, type HostFormat } from '../src/lib/host';

export interface HostEnv {
  ORDERS: D1Database;
}

export interface HostRegistrationRow {
  id: string;
  payment_account: 'margarita' | 'timur';
  event_id: string;
  customer_name: string;
  email: string;
  contact_method: string;
  contact_value: string;
  game_title: string;
  game_description: string;
  format: HostFormat;
  media_package: number;
  deposit_requested: number;
  total_cents: number;
  due_now_cents: number;
  remaining_cents: number;
  amount_paid_cents: number;
  currency: string;
  status: string;
  table_no: number | null;
  hold_expires_at: string;
  provider: string;
  provider_session_id: string | null;
  provider_payment_id: string | null;
  created_at: string;
  updated_at: string;
  paid_at: string | null;
  cancelled_at: string | null;
  refunded_at: string | null;
}

export interface NewHostRegistration {
  id: string;
  eventId: string;
  name: string;
  email: string;
  contactMethod: string;
  contactValue: string;
  gameTitle: string;
  gameDescription: string;
  format: HostFormat;
  media: boolean;
  deposit: boolean;
  totalCents: number;
  dueNowCents: number;
  remainingCents: number;
  holdExpiresAt: string;
  tableNo: number;
  createdAt: string;
  paymentAccount?: 'margarita' | 'timur';
}

const iso = (ms: number) => new Date(ms).toISOString();

export async function releaseExpiredHostHolds(
  env: HostEnv,
  nowMs: number,
): Promise<void> {
  const now = iso(nowMs);
  await env.ORDERS.batch([
    env.ORDERS.prepare(
      `UPDATE host_registrations SET status='expired', updated_at=?
       WHERE status='pending' AND hold_expires_at<=?`,
    ).bind(now, now),
    env.ORDERS.prepare(
      `UPDATE host_table_slots
       SET registration_id=NULL, status='free', expires_at=NULL, updated_at=?
       WHERE status='pending' AND (expires_at IS NULL OR expires_at<=?)`,
    ).bind(now, now),
  ]);
}

export async function allocateHostTable(
  env: HostEnv,
  registrationId: string,
  expiresAt: string | null,
  nowMs: number,
  status: 'pending' | 'paid' = 'pending',
): Promise<number | null> {
  const now = iso(nowMs);
  const result = await env.ORDERS.prepare(
    `UPDATE host_table_slots
     SET registration_id=?, status=?, expires_at=?, updated_at=?
     WHERE slot_no = (
       SELECT slot_no FROM host_table_slots
       WHERE slot_no <= ?
         AND (
           registration_id IS NULL
           OR (status='pending' AND (expires_at IS NULL OR expires_at<=?))
         )
       ORDER BY slot_no
       LIMIT 1
     )
     AND (
       registration_id IS NULL
       OR (status='pending' AND (expires_at IS NULL OR expires_at<=?))
     )`,
  )
    .bind(registrationId, status, expiresAt, now, HOST_TABLE_COUNT, now, now)
    .run();
  if (result.meta.changes !== 1) return null;
  const row = await env.ORDERS.prepare(
    `SELECT slot_no FROM host_table_slots WHERE registration_id=? AND status=?`,
  )
    .bind(registrationId, status)
    .first<{ slot_no: number }>();
  return row?.slot_no ?? null;
}

export async function insertHostRegistration(
  env: HostEnv,
  registration: NewHostRegistration,
): Promise<void> {
  await env.ORDERS.prepare(
    `INSERT INTO host_registrations
       (id,event_id,customer_name,email,contact_method,contact_value,
        game_title,game_description,format,media_package,deposit_requested,
        total_cents,due_now_cents,remaining_cents,currency,status,table_no,
        hold_expires_at,provider,payment_account,created_at,updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,'EUR','pending',?,?,'stripe',?,?,?)`,
  )
    .bind(
      registration.id,
      registration.eventId,
      registration.name,
      registration.email,
      registration.contactMethod,
      registration.contactValue,
      registration.gameTitle,
      registration.gameDescription,
      registration.format,
      registration.media ? 1 : 0,
      registration.deposit ? 1 : 0,
      registration.totalCents,
      registration.dueNowCents,
      registration.remainingCents,
      registration.tableNo,
      registration.holdExpiresAt,
      registration.paymentAccount ?? 'margarita',
      registration.createdAt,
      registration.createdAt,
    )
    .run();
}

export async function setHostProviderSession(
  env: HostEnv,
  id: string,
  sessionId: string,
  nowMs: number,
): Promise<void> {
  await env.ORDERS.prepare(
    `UPDATE host_registrations SET provider_session_id=?, updated_at=? WHERE id=?`,
  )
    .bind(sessionId, iso(nowMs), id)
    .run();
}

export async function releaseHostTable(
  env: HostEnv,
  registrationId: string,
  nowMs: number,
  onlyPending = true,
): Promise<void> {
  await env.ORDERS.prepare(
    `UPDATE host_table_slots
     SET registration_id=NULL, status='free', expires_at=NULL, updated_at=?
     WHERE registration_id=? ${onlyPending ? "AND status='pending'" : ''}`,
  )
    .bind(iso(nowMs), registrationId)
    .run();
}

export async function markHostRegistrationFailed(
  env: HostEnv,
  id: string,
  nowMs: number,
  status: 'failed' | 'cancelled' | 'expired' = 'failed',
): Promise<void> {
  const now = iso(nowMs);
  await env.ORDERS.batch([
    env.ORDERS.prepare(
      `UPDATE host_registrations
       SET status=?, cancelled_at=?, updated_at=?
       WHERE id=? AND status='pending'`,
    ).bind(status, status === 'failed' ? null : now, now, id),
    env.ORDERS.prepare(
      `UPDATE host_table_slots
       SET registration_id=NULL, status='free', expires_at=NULL, updated_at=?
       WHERE registration_id=? AND status='pending'`,
    ).bind(now, id),
  ]);
}

export async function findHostRegistration(
  env: HostEnv,
  id: string,
): Promise<HostRegistrationRow | null> {
  return env.ORDERS.prepare(`SELECT * FROM host_registrations WHERE id=?`)
    .bind(id)
    .first<HostRegistrationRow>();
}

export async function findHostRegistrationBySession(
  env: HostEnv,
  sessionId: string,
): Promise<HostRegistrationRow | null> {
  return env.ORDERS.prepare(
    `SELECT * FROM host_registrations WHERE provider='stripe' AND provider_session_id=?`,
  )
    .bind(sessionId)
    .first<HostRegistrationRow>();
}

export async function findHostRegistrationByPayment(
  env: HostEnv,
  paymentId: string,
  account: 'margarita' | 'timur' = 'margarita',
): Promise<HostRegistrationRow | null> {
  return env.ORDERS.prepare(
    `SELECT * FROM host_registrations WHERE provider='stripe' AND payment_account=? AND provider_payment_id=?`,
  )
    .bind(account, paymentId)
    .first<HostRegistrationRow>();
}

export async function confirmHostPayment(
  env: HostEnv,
  nowMs: number,
  registration: HostRegistrationRow,
  paymentId: string | null,
): Promise<number | null> {
  await releaseExpiredHostHolds(env, nowMs);
  const now = iso(nowMs);
  let slot = await env.ORDERS.prepare(
    `UPDATE host_table_slots
     SET status='paid', expires_at=NULL, updated_at=?
     WHERE registration_id=? AND status='pending'`,
  )
    .bind(now, registration.id)
    .run();
  let tableNo: number | null = null;
  if (slot.meta.changes === 1) {
    const row = await env.ORDERS.prepare(
      `SELECT slot_no FROM host_table_slots WHERE registration_id=? AND status='paid'`,
    )
      .bind(registration.id)
      .first<{ slot_no: number }>();
    tableNo = row?.slot_no ?? null;
  } else {
    const existing = await env.ORDERS.prepare(
      `SELECT slot_no FROM host_table_slots WHERE registration_id=? AND status='paid'`,
    )
      .bind(registration.id)
      .first<{ slot_no: number }>();
    if (existing) tableNo = existing.slot_no;
    else
      tableNo = await allocateHostTable(
        env,
        registration.id,
        null,
        nowMs,
        'paid',
      );
  }
  await env.ORDERS.prepare(
    `UPDATE host_registrations
     SET status='paid', table_no=?, amount_paid_cents=due_now_cents,
         provider_payment_id=?, paid_at=COALESCE(paid_at,?), updated_at=?
     WHERE id=? AND status IN ('pending','expired','cancelled','failed')`,
  )
    .bind(tableNo, paymentId, now, now, registration.id)
    .run();
  return tableNo;
}

export async function expireHostCheckout(
  env: HostEnv,
  id: string,
  nowMs: number,
): Promise<void> {
  const registration = await findHostRegistration(env, id);
  if (!registration || Date.parse(registration.hold_expires_at) > nowMs) return;
  await markHostRegistrationFailed(env, id, nowMs, 'expired');
}

export async function refundHostRegistration(
  env: HostEnv,
  registration: HostRegistrationRow,
  nowMs: number,
): Promise<void> {
  const now = iso(nowMs);
  await env.ORDERS.batch([
    env.ORDERS.prepare(
      `UPDATE host_registrations
       SET status='refunded', refunded_at=?, updated_at=?
       WHERE id=? AND status='paid'`,
    ).bind(now, now, registration.id),
    env.ORDERS.prepare(
      `UPDATE host_table_slots
       SET registration_id=NULL, status='free', expires_at=NULL, updated_at=?
       WHERE registration_id=?`,
    ).bind(now, registration.id),
  ]);
}
