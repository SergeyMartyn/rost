import { test, expect, type Page } from '@playwright/test';
import site from '../../site.config.json' with { type: 'json' };
import { consentConfig } from '../../src/lib/services';

const GTM_URL = 'googletagmanager.com/gtm.js';
const home = site.routes.home;

test.beforeEach(async ({ page }) => {
  // hideFromBots hides the banner for automated browsers; tests act as a human.
  await page.addInitScript(() =>
    Object.defineProperty(navigator, 'webdriver', { get: () => false }),
  );
});

function trackExternal(page: Page) {
  const external: string[] = [];
  page.on('request', (r) => {
    if (!r.url().startsWith('http://127.0.0.1:8787')) external.push(r.url());
  });
  return external;
}

async function stubGtm(page: Page) {
  // The real container is never contacted; the stub records the load order.
  await page.route('https://www.googletagmanager.com/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: 'window.__gtmLoadedAfter = JSON.stringify(window.dataLayer);',
    }),
  );
}

test('HTML has no GTM snippet, noscript or pre-connect hints', async ({
  request,
}) => {
  for (const row of Object.values(site.routes))
    for (const path of Object.values(row)) {
      const html = await (await request.get(path)).text();
      expect(html, path).not.toContain('googletagmanager');
      expect(html, path).not.toContain('google-analytics');
      expect(html, path).not.toMatch(/rel="(preconnect|dns-prefetch)"/);
    }
});

for (const lang of ['de', 'ru'] as const)
  test(`banner ${lang}: shown, no requests before choice, equal buttons`, async ({
    page,
  }) => {
    const external = trackExternal(page);
    await page.goto(home[lang]);
    const bar = page.locator('#cc-main .cm');
    await expect(bar).toBeVisible();
    await expect(page.locator('#cc-main .cm__close')).toHaveCount(0);
    await page.waitForTimeout(500);
    expect(external).toEqual([]);
    const style = async (selector: string) =>
      page.locator(selector).evaluate((el) => {
        const s = getComputedStyle(el);
        return [
          s.backgroundColor,
          s.color,
          s.fontSize,
          s.fontWeight,
          s.borderTopWidth,
          s.borderRadius,
          Math.round(el.getBoundingClientRect().height),
        ].join('|');
      });
    expect(await style('[data-role="all"]')).toBe(
      await style('[data-role="necessary"]'),
    );
    // page stays usable behind the non-modal bar
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });

test('reject: no GTM, choice persists, cookie settings link reopens', async ({
  page,
}) => {
  const external = trackExternal(page);
  await page.goto(home.ru);
  await page.locator('[data-role="necessary"]').click();
  await expect(page.locator('#cc-main .cm')).toBeHidden();
  await page.reload();
  await expect(page.locator('#cc-main .cm')).toBeHidden();
  expect(external).toEqual([]);
  await page.locator('.site-footer__cookie-settings').click();
  await expect(page.locator('#cc-main .pm')).toBeVisible();
});

test('accept: consent default before GTM, events, cookies, revoke', async ({
  page,
  context,
}) => {
  await stubGtm(page);
  const gtm: string[] = [];
  page.on('request', (r) => {
    if (r.url().includes(GTM_URL)) gtm.push(r.url());
  });
  await page.goto(home.ru);
  await page.locator('[data-role="all"]').click();
  await expect.poll(() => gtm.length).toBe(1);
  expect(gtm[0]).toContain(consentConfig.gtmId);
  const layer = await page.evaluate(() =>
    (window as any).dataLayer.map((x: any) =>
      Object.prototype.toString.call(x) === '[object Arguments]'
        ? Array.from(x)
        : x,
    ),
  );
  const flat = JSON.stringify(layer);
  const iDefault = flat.indexOf('"consent","default"');
  const iStart = flat.indexOf('gtm.start');
  const iEvent = flat.indexOf('consent_statistics_granted');
  expect(iDefault).toBeGreaterThan(-1);
  expect(iDefault).toBeLessThan(iStart);
  expect(iStart).toBeLessThan(iEvent);
  expect(flat).toContain('"consent_statistics":"granted"');
  await expect
    .poll(() => page.evaluate(() => (window as any).__gtmLoadedAfter as string))
    .toContain('"analytics_storage":"granted"');
  const loadedAfter = await page.evaluate(
    () => (window as any).__gtmLoadedAfter as string,
  );
  expect(loadedAfter).toContain('"analytics_storage":"granted"');
  expect(loadedAfter).toContain('"ad_storage":"denied"');
  expect(loadedAfter).toContain('"ad_user_data":"denied"');
  expect(loadedAfter).toContain('"ad_personalization":"denied"');
  expect(loadedAfter).toContain('"security_storage":"granted"');

  // saved choice: GTM is loaded again on the next page, without a banner
  gtm.length = 0;
  await page.reload();
  await expect.poll(() => gtm.length).toBe(1);
  await expect(page.locator('#cc-main .cm')).toBeHidden();

  // revoke: fake a _ga cookie, switch statistics off in the settings
  await context.addCookies([
    { name: '_ga', value: 'x', url: 'http://127.0.0.1:8787' },
    { name: '_ga_DMY7BHLRLX', value: 'x', url: 'http://127.0.0.1:8787' },
  ]);
  await page.locator('.site-footer__cookie-settings').click();
  await page
    .locator('#cc-main input.section__toggle[value="analytics"]')
    .evaluate((el: HTMLInputElement) => el.click());
  await page.locator('#cc-main .pm__btn--secondary').first().click();
  await page.waitForLoadState('load');
  await expect
    .poll(
      async () =>
        (await context.cookies()).filter((c) => c.name.startsWith('_ga'))
          .length,
    )
    .toBe(0);
  gtm.length = 0;
  await page.reload();
  await page.waitForTimeout(500);
  expect(gtm).toEqual([]);
});

test('language switch keeps the choice; new revision asks again', async ({
  page,
  context,
}) => {
  await stubGtm(page);
  await page.goto(home.de);
  await page.locator('[data-role="all"]').click();
  await page.goto(home.ru);
  await expect(page.locator('#cc-main .cm')).toBeHidden();
  const cookie = (await context.cookies()).find(
    (c) => c.name === consentConfig.cookieName,
  )!;
  const value = decodeURIComponent(cookie.value).replace(
    /"revision":\d+/,
    '"revision":999',
  );
  await context.addCookies([{ ...cookie, value: encodeURIComponent(value) }]);
  await page.goto(home.ru);
  await expect(page.locator('#cc-main .cm')).toBeVisible();
});

for (const [key, lang] of [
  ['home', 'ru'],
  ['home', 'de'],
  ['events', 'ru'],
  ['about', 'ru'],
  ['contacts', 'de'],
] as const)
  test(`video facade ${key}/${lang}: placeholder stays local`, async ({
    page,
  }) => {
    const external = trackExternal(page);
    await page.goto(site.routes[key][lang]);
    const notice = page.locator('.hero__notice').first();
    await expect(notice).toHaveText(
      lang === 'ru' ? 'Видео скоро появится.' : 'Das Video folgt in Kürze.',
    );
    expect(await notice.evaluate((el) => getComputedStyle(el).fontWeight)).toBe(
      '400',
    );
    await expect(page.locator('iframe')).toHaveCount(0);
    await page.waitForTimeout(300);
    expect(external.filter((u) => u.includes('youtube'))).toEqual([]);
    await expect(page.locator('.hero__video [data-facade-load]')).toBeDisabled();
    await expect(page.locator('.hero__video iframe')).toHaveCount(0);
    await page.reload();
    await expect(page.locator('iframe')).toHaveCount(0);
  });

test('events page: address shown as text, no map embed or external requests', async ({
  page,
}) => {
  const external = trackExternal(page);
  await page.goto(site.routes.events.de);
  await expect(page.getByText('St. Katharinenplatz 5').first()).toBeVisible();
  await expect(page.locator('a[href*="google.com/maps"]')).toHaveCount(0);
  await expect(page.locator('a[href*="maps.google"]')).toHaveCount(0);
  const gamesAddress = page.locator('main p', {
    hasText: 'Perchtinger Straße',
  });
  if (await gamesAddress.count())
    await expect(gamesAddress.locator('a')).toHaveCount(0);
  await expect(page.locator('iframe[src*="google.com/maps"]')).toHaveCount(0);
  await page.waitForTimeout(300);
  expect(external.filter((u) => u.includes('google'))).toEqual([]);
});
