// One switch for the public UI and new-order validation.
export const BASIC_TICKETS_SOLD_OUT = true;
export const isTicketSoldOut = (key: string): boolean =>
  BASIC_TICKETS_SOLD_OUT && (key === 'guest' || key === 'guest_early');
