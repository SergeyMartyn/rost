import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isTicketSoldOut } from '../src/lib/ticket-availability';
import { TICKETS } from '../worker/tickets';
test('published inventory closes only the basic participant tickets', () => {
  for (const key of ['guest', 'guest_early'] as const) {
    assert.equal(isTicketSoldOut(key), true);
    assert.equal(TICKETS[key].soldOut, true);
  }
  for (const key of ['guest_peak', 'host', 'nuremberg_meetup'] as const) {
    assert.equal(isTicketSoldOut(key), false);
    assert.notEqual(TICKETS[key].soldOut, true);
  }
});
