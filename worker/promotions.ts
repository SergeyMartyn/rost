import { TICKETS, isTicketKey } from './tickets';
import { isEarlyBirdActive } from '../src/lib/early-bird';

export class PricingError extends Error {
  constructor(
    public code: string,
    public status = 400,
  ) {
    super(code);
  }
}
export interface PriceQuote {
  quantity: number;
  unitAmountCents: number;
  baseAmountCents: number;
  discountCents: number;
  discountPercent: number;
  amountCents: number;
  promoCode: string | null;
  promotionKind: string | null;
  issuerCode: string | null;
  issuerName: string | null;
  quoteKey: string;
}
export async function quotePrice(
  db: D1Database,
  ticketKey: unknown,
  code: unknown,
  now: number,
): Promise<PriceQuote> {
  if (!isTicketKey(ticketKey)) throw new PricingError('bad_ticket');
  const ticket = TICKETS[ticketKey];
  if (ticket.salesClosed) throw new PricingError('event_archived', 410);
  if (ticketKey === 'guest_early' && !isEarlyBirdActive(now))
    throw new PricingError('offer_ended', 409);
  if (code !== undefined && code !== null && typeof code !== 'string')
    throw new PricingError('invalid_promo');
  const normalized = typeof code === 'string' ? code.trim().toUpperCase() : '';
  if (normalized && !/^[A-Z0-9]{3,32}$/.test(normalized))
    throw new PricingError('invalid_promo');
  let percent = 0;
  let quantity = 1;
  let kind: string | null = null;
  let issuerCode: string | null = null;
  let issuerName: string | null = null;
  if (normalized) {
    const row = await db
      .prepare(
        `SELECT r.id, r.discount_percent, r.quantity, r.active AS rule_active,
      r.starts_at,r.ends_at,c.active AS code_active,c.issuer_code,c.issuer_name,
      s.active AS scope_active FROM discount_codes c
      JOIN discount_campaigns r ON r.id=c.rule_id
      LEFT JOIN discount_scopes s ON s.rule_id=r.id AND s.event_id=? AND s.ticket_type=?
      WHERE c.code=?`,
      )
      .bind(ticket.eventId, ticketKey, normalized)
      .first<{
        id: string;
        discount_percent: number;
        quantity: number;
        rule_active: number;
        starts_at: number | null;
        ends_at: number | null;
        code_active: number;
        issuer_code: string;
        issuer_name: string;
        scope_active: number | null;
      }>();
    if (
      !row ||
      !row.rule_active ||
      !row.code_active ||
      (row.starts_at !== null && now < row.starts_at) ||
      (row.ends_at !== null && now >= row.ends_at)
    )
      throw new PricingError('invalid_promo');
    // Always exclude VIP and hosts, even if an administrator adds a wrong scope.
    if (
      ticketKey === 'guest_peak' ||
      ticketKey === 'host' ||
      row.scope_active !== 1
    )
      throw new PricingError('promo_not_applicable');
    percent = row.discount_percent;
    if (row.quantity !== 1 && row.quantity !== 2)
      throw new PricingError('invalid_promo');
    quantity = row.quantity;
    if (!Number.isInteger(percent) || percent < 1 || percent > 99)
      throw new PricingError('invalid_promo');
    kind = row.id;
    issuerCode = row.issuer_code;
    issuerName = row.issuer_name;
  }
  // Round each participant's discount in cents, then sum the tickets.
  const unitDiscount = Math.round((ticket.amountCents * percent) / 100);
  const discount = unitDiscount * quantity;
  const amount = (ticket.amountCents - unitDiscount) * quantity;
  return {
    quantity,
    unitAmountCents: ticket.amountCents,
    baseAmountCents: ticket.amountCents * quantity,
    discountCents: discount,
    discountPercent: percent,
    amountCents: amount,
    promoCode: normalized || null,
    promotionKind: kind,
    issuerCode,
    issuerName,
    quoteKey: JSON.stringify([
      2,
      ticketKey,
      quantity,
      ticket.amountCents,
      percent,
      discount,
      amount,
      normalized,
    ]),
  };
}
