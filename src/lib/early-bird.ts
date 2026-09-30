// 16 October 2026, 00:00 in Europe/Berlin (CEST, UTC+02:00).
// The discounted price is valid through the end of 15 October locally.
export const EARLY_BIRD_END_MS = Date.parse('2026-10-15T22:00:00Z');

export const isEarlyBirdActive = (nowMs: number): boolean =>
  nowMs < EARLY_BIRD_END_MS;
