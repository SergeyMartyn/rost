// Server-side ticket catalogue. Prices are decided HERE, never taken from the browser.
export type TicketKey =
  | 'meetup'
  | 'nuremberg_meetup'
  | 'guest_early'
  | 'guest'
  | 'guest_peak'
  | 'host';

export interface Ticket {
  eventId: string;
  amountCents: number;
  label: { de: string; ru: string };
  /** Google Sheets tab that receives paid orders for this event. */
  sheetTab: string;
  /** Historical tickets remain in the catalogue for webhook reconciliation. */
  salesClosed?: boolean;
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
    salesClosed: true,
  },
  nuremberg_meetup: {
    eventId: 'nuremberg-2026-12-12',
    amountCents: 2900,
    label: {
      de: 'R.O.S.T. Kennenlerntreffen Nürnberg, 12. Dezember 2026',
      ru: 'R.O.S.T. Встреча-знакомство в Нюрнберге, 12 декабря 2026',
    },
    sheetTab: '12.12.26 - Nuernberg',
  },
  guest: {
    eventId: 'munich-games-2026-11-07',
    amountCents: 8000,
    label: {
      de: 'R.O.S.T. Spiele München, Ticket „Basisimpuls“',
      ru: 'R.O.S.T. Игры в Мюнхене, билет «Базовый импульс»',
    },
    sheetTab: '07.11.2026 - TI_München',
  },
  guest_peak: {
    eventId: 'munich-games-2026-11-07',
    amountCents: 18000,
    label: {
      de: 'R.O.S.T. Spiele München, Ticket „Gipfel der Transformation“',
      ru: 'R.O.S.T. Игры в Мюнхене, билет «Пик трансформации»',
    },
    sheetTab: '07.11.2026 - TI_München',
  },
  guest_early: {
    eventId: 'munich-games-2026-11-07',
    amountCents: 8000,
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
