import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker, { chooseLanguage } from '../worker/index';
import { validate } from '../scripts/config-check.mjs';
import site from '../site.config.json';
test('language priorities, regional tags, zero quality, wildcard and fallback', () => {
  for (const [header, fallback, result] of [
    ['ru-RU, de;q=0.8', 'de', 'ru'],
    ['ru;q=0.1,de;q=0.9', 'ru', 'de'],
    ['en-US,en;q=.9', 'ru', 'ru'],
    ['ru;q=0,de;q=.5', 'ru', 'de'],
    ['ru;q=0,*;q=.8', 'ru', 'de'],
    ['de;q=oops,ru;q=.5', 'de', 'ru'],
    ['ru;q=.5,de;q=.5', 'de', 'ru'],
    ['', 'de', 'de'],
  ] as const)
    assert.equal(chooseLanguage(header, fallback), result);
});
test('cookie wins at root, query survives, redirects cannot be cached', async () => {
  const response = await worker.fetch(
    new Request('https://unit.test/?source=a', {
      headers: { Cookie: 'site_language=ru', 'Accept-Language': 'de' },
    }),
    {
      DEFAULT_LANGUAGE: 'de',
      ASSETS: { fetch: async () => new Response('asset') },
    },
  );
  assert.equal(response.status, 302);
  assert.equal(
    response.headers.get('Location'),
    'https://unit.test/ru/?source=a',
  );
  assert.match(response.headers.get('Cache-Control')!, /no-store/);
});
test('direct localized paths and missing pages are never language redirected', async () => {
  for (const path of ['/de/', '/ru/konfidentsialnost/', '/missing']) {
    let passed = false;
    const response = await worker.fetch(
      new Request('https://unit.test' + path, {
        headers: { 'Accept-Language': 'ru' },
      }),
      {
        DEFAULT_LANGUAGE: 'de',
        ASSETS: {
          fetch: async () => {
            passed = true;
            return new Response('asset', {
              status: path === '/missing' ? 404 : 200,
            });
          },
        },
      },
    );
    assert.ok(passed);
    assert.equal(response.status, path === '/missing' ? 404 : 200);
  }
});
test('configuration permits empty content and checks only technical values', () => {
  assert.deepEqual(validate(site), []);
  const ready = {
    ...site,
    name: 'Studio',
    domain: 'https://studio.de',
    workerName: 'studio-site',
    legal: {
      operator: 'Owner',
      address: 'Street 1',
      email: 'mail@studio.de',
      privacyContact: 'Owner',
    },
    legalText: {
      imprint: { de: 'Geprüfter Text', ru: 'Проверенный текст' },
      privacy: { de: 'Geprüfter Text', ru: 'Проверенный текст' },
    },
  };
  assert.deepEqual(validate(ready), []);
  assert.deepEqual(validate({ ...site, domain: 'https://example.com' }), []);
  assert.ok(validate({ ...site, domain: 'not-a-url' }).includes('domain'));
  assert.ok(validate({ ...site, workerName: '' }).includes('workerName'));
  assert.ok(validate({ ...site, defaultLanguage: 'en' }).includes('defaultLanguage'));
});
