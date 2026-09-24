import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { transformSync } from 'esbuild';
import site from '../../site.config.json' with { type: 'json' };
test('HTTP, root negotiation, metadata and sitemap', async ({ request }) => {
  for (const row of Object.values(site.routes))
    for (const [lang, path] of Object.entries(row)) {
      const response = await request.get(path, {
        headers: { 'Accept-Language': lang === 'ru' ? 'de' : 'ru' },
        maxRedirects: 0,
      });
      expect(response.status()).toBe(200);
      const html = await response.text();
      expect(html).toContain(`lang="${lang}"`);
      expect(html).toContain(
        `href="${site.domain || 'https://example.invalid'}${path}"`,
      );
      expect(html).toContain('hreflang="de"');
      expect(html).toContain('hreflang="ru"');
      expect(html).toContain('property="og:image"');
    }
  expect((await request.get('/missing')).status()).toBe(404);
  for (const [language, target] of [
    ['ru-RU,de;q=.5', '/ru/'],
    ['de;q=.2,ru;q=.8', '/ru/'],
    ['en', '/de/'],
  ]) {
    const r = await request.get('/', {
      headers: { 'Accept-Language': language },
      maxRedirects: 0,
    });
    expect(r.status()).toBe(302);
    expect(r.headers().location).toContain(target);
  }
  const sitemap = await (await request.get('/sitemap.xml')).text();
  expect(sitemap.match(/<loc>/g)).toHaveLength(6);
  expect(await (await request.get('/robots.txt')).text()).toContain(
    '/sitemap.xml',
  );
  expect((await request.get('/social.png')).status()).toBe(200);
});
test('responsive pages, no optional banner or external requests; keyboard and language selection', async ({
  page,
  context,
}) => {
  const external: string[] = [];
  page.on('request', (r) => {
    if (!r.url().startsWith('http://127.0.0.1:8787')) external.push(r.url());
  });
  for (const width of [320, 375, 768, 1024, 1440])
    for (const row of Object.values(site.routes))
      for (const path of Object.values(row)) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(path);
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          `${path} at ${width}px`,
        ).toBe(true);
        await expect(page.locator('#consent')).not.toBeVisible();
      }
  await page.goto('/de/impressum/');
  await page.keyboard.press('Tab');
  await expect(page.locator('a[href="#main"]')).toBeFocused();
  await page.locator('[data-language="ru"]').click();
  await expect(page).toHaveURL(/pravovaya-informatsiya/);
  expect(
    (await context.cookies()).find((c) => c.name === 'site_language')?.value,
  ).toBe('ru');
  await page.goto('/');
  await expect(page).toHaveURL(/\/ru\/$/);
  expect(external).toEqual([]);
  await page.screenshot({
    path: 'test-results/home-ru-desktop.png',
    fullPage: true,
  });
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/de/');
  await page.screenshot({
    path: 'test-results/home-de-mobile.png',
    fullPage: true,
  });
});
for (const lang of ['de', 'ru'])
  test(`enabled consent ${lang}: reject, purpose selection, persist, revoke and no pre-consent request`, async ({
    page,
  }) => {
    const calls: string[] = [];
    await page.route('https://optional.invalid/**', (route) => {
      calls.push(route.request().url());
      return route.fulfill({ status: 200, body: 'ok' });
    });
    const module = transformSync(readFileSync('src/lib/consent.ts', 'utf8'), {
      loader: 'ts',
      format: 'iife',
      globalName: 'ConsentTest',
    }).code;
    async function enable() {
      await page.addScriptTag({ content: module });
      await page.evaluate(() => {
        (window as any).ConsentTest.initConsent([
          {
            id: 'test-statistics',
            purpose: 'analytics',
            start: () => {
              void fetch('https://optional.invalid/analytics');
            },
          },
          {
            id: 'test-media',
            purpose: 'media',
            start: () => {
              void fetch('https://optional.invalid/media');
            },
          },
        ]);
      });
    }
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto(`/${lang}/`);
    await enable();
    await expect(page.locator('#consent')).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    for (let i = 0; i < 6; i++) await page.keyboard.press('Tab');
    expect(
      await page.evaluate(() =>
        document.querySelector('#consent')?.contains(document.activeElement),
      ),
    ).toBe(true);
    await page.locator('[data-consent="configure"]').click();
    await expect(page.locator('#consent-options')).toBeVisible();
    await page.screenshot({
      path: `test-results/consent-${lang}-mobile.png`,
      fullPage: true,
    });
    expect(calls).toEqual([]);
    await page.locator('[data-consent="reject"]').click();
    expect(calls).toEqual([]);
    await page.reload();
    await enable();
    await expect(page.locator('#consent')).not.toBeVisible();
    await page.locator('#consent-open').click();
    await page.locator('input[value="media"]').check();
    await page.locator('[data-consent="save"]').click();
    await expect.poll(() => calls.length).toBe(1);
    expect(calls[0]).toContain('/media');
    await page.reload();
    await enable();
    await expect.poll(() => calls.length).toBe(2);
    await expect(page.locator('#consent')).not.toBeVisible();
    await page.locator('#consent-open').click();
    await page.locator('[data-consent="reject"]').click();
    await page.waitForLoadState();
    await enable();
    await expect(page.locator('#consent')).not.toBeVisible();
    expect(calls).toHaveLength(2);
    await page.locator('#consent-open').click();
    await page.locator('[data-consent="accept"]').click();
    await expect.poll(() => calls.length).toBe(4);
  });
