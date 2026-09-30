// Server-side ticket catalogue. Prices are decided HERE, never taken from the browser.
export type TicketKey = 'meetup' | 'guest_early' | 'guest' | 'host';

export interface Ticket {
  eventId: string;
  amountCents: number;
  label: { de: string; ru: string };
  /** Google Sheets tab that receives paid orders for this event. */
  sheetTab: string;
}

export const TICKETS: Record<TicketKey, Ticket> = {
  meetup: {
    eventId: 'regensburg-2026-10-10',
    amountCents: 2900,
    label: {
      de: 'R.O.S.T. Treffen Regensburg, 10. Oktober 2026',
      ru: 'R.O.S.T. Встреча в Регенсбурге, 10 октября 2026',
    },
    sheetTab: '10.10.26 - Regensburg',
  },
  guest: {
    eventId: 'munich-games-2026-11-07',
    amountCents: 9900,
    label: {
      de: 'R.O.S.T. Spiele München, Ticket für Teilnehmende',
      ru: 'R.O.S.T. Игры в Мюнхене, билет участника',
    },
    sheetTab: '07.11.2026 - TI_München',
  },
  guest_early: {
    eventId: 'munich-games-2026-11-07',
    amountCents: 7000,
    label: {
      de: 'R.O.S.T. Spiele München, Frühbucherticket für Teilnehmende',
      ru: 'R.O.S.T. Игры в Мюнхене, ранний билет участника',
    },
    sheetTab: '07.11.2026 - TI_München',
  },
  host: {
    eventId: 'munich-games-2026-11-07',
    amountCents: 24900,
    label: {
      de: 'R.O.S.T. Spiele München, Ticket für Spielleitende',
      ru: 'R.O.S.T. Игры в Мюнхене, билет ведущего игр',
    },
    sheetTab: '07.11.2026 - TI_München',
  },
};

export const isTicketKey = (v: unknown): v is TicketKey =>
  typeof v === 'string' && Object.prototype.hasOwnProperty.call(TICKETS, v);
