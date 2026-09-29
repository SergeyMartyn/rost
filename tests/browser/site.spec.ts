import { test, expect } from '@playwright/test';
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
    ['en', site.routes.home[site.defaultLanguage as 'de' | 'ru']],
  ]) {
    const r = await request.get('/', {
      headers: { 'Accept-Language': language },
      maxRedirects: 0,
    });
    expect(r.status()).toBe(302);
    expect(r.headers().location).toContain(target);
  }
  const sitemap = await (await request.get('/sitemap.xml')).text();
  expect(sitemap.match(/<loc>/g)).toHaveLength(
    Object.keys(site.routes).length * 2,
  );
  expect(await (await request.get('/robots.txt')).text()).toContain(
    '/sitemap.xml',
  );
  expect((await request.get('/social.png')).status()).toBe(200);
});
test('responsive pages, no external requests; keyboard and language selection', async ({
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
      }
  await page.goto('/de/impressum/');
  await page.keyboard.press('Tab');
  await expect(page.locator('a[href="#main"]')).toBeFocused();
  await page
    .locator('.site-header__desktop-actions [data-language="ru"]')
    .click();
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
