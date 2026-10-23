export const HOST_EVENT_ID = 'munich-games-2026-11-07';
export const HOST_TABLE_COUNT = 7;
export const HOST_HOLD_MINUTES = 30;
// One minute of grace before an unpaid table can be allocated again.
export const HOST_RELEASE_MINUTES = HOST_HOLD_MINUTES + 1;
export const HOST_DEPOSIT_CENTS = 5000;
export const HOST_MEDIA_CENTS = 7900;

export const HOST_FORMATS = {
  standard: { amountCents: 24900 },
  expanded: { amountCents: 34900 },
} as const;

export type HostFormat = keyof typeof HOST_FORMATS;

export interface HostPrice {
  totalCents: number;
  dueNowCents: number;
  remainingCents: number;
}

export function isHostFormat(value: unknown): value is HostFormat {
  return value === 'standard' || value === 'expanded';
}

export function hostPrice(
  format: HostFormat,
  media: boolean,
  deposit: boolean,
): HostPrice {
  const totalCents =
    HOST_FORMATS[format].amountCents + (media ? HOST_MEDIA_CENTS : 0);
  const dueNowCents = deposit ? HOST_DEPOSIT_CENTS : totalCents;
  return {
    totalCents,
    dueNowCents,
    remainingCents: totalCents - dueNowCents,
  };
}

export const formatEuro = (cents: number) => `€${cents / 100}`;
