import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TICKETS } from '../worker/tickets';

test('archived Munich tickets stay in the catalogue with sales closed', () => {
  for (const key of ['guest', 'guest_early', 'guest_peak', 'host'] as const) {
    assert.equal(TICKETS[key].salesClosed, true);
    assert.equal(TICKETS[key].eventId, 'munich-games-2026-11-07');
  }
  assert.equal(TICKETS.nuremberg_meetup.salesClosed, undefined);
  assert.match(TICKETS.nuremberg_meetup.label.ru, /13 декабря 2026/);
  assert.match(TICKETS.nuremberg_meetup.label.de, /13\. Dezember 2026/);
});
