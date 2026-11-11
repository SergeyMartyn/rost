import { test, expect } from '@playwright/test';
import site from '../../site.config.json' with { type: 'json' };

test('compact consent fits phone and desktop with all actions in one row', async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, 'webdriver', { get: () => false }),
  );
  for (const lang of ['ru', 'de'] as const) {
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(site.routes.home[lang]);
      const bar = page.locator('#cc-main .cm');
      await expect(bar).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      await expect
        .poll(async () => {
          const box = (await bar.boundingBox())!;
          return box.y + box.height;
        })
        .toBeLessThanOrEqual(900);
      const boxes = await bar.locator('.cm__btns > button').evaluateAll((els) =>
        els.map((el) => {
          const rect = el.getBoundingClientRect();
          return {
            x: rect.x,
            y: rect.y,
            right: rect.right,
            height: rect.height,
            fits: el.scrollWidth <= el.clientWidth + 1,
          };
        }),
      );
      expect(boxes).toHaveLength(3);
      expect(
        Math.max(...boxes.map((b) => b.y)) - Math.min(...boxes.map((b) => b.y)),
      ).toBeLessThan(1);
      await page.screenshot({
        path: `test-results/consent-${lang}-${width}.png`,
      });
      expect(
        boxes.every(
          (b) => b.fits && b.x >= 0 && b.right <= width && b.height >= 44,
        ),
        JSON.stringify({ lang, width, boxes }),
      ).toBe(true);
      expect((await bar.boundingBox())!.height).toBeLessThanOrEqual(120);
      await page.screenshot({
        path: `test-results/consent-${lang}-${width}.png`,
      });
    }
  }
});

test('mobile menu contains both localized event destinations', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  for (const lang of ['ru', 'de'] as const) {
    await page.goto(site.routes.home[lang]);
    await page.locator('.site-header__toggle').click();
    const links = page.locator('.site-header__event-links a');
    await expect(links).toHaveCount(2);
    await expect(links.nth(0)).toHaveAttribute(
      'href',
      site.routes.munichMeetup[lang],
    );
    await expect(links.nth(1)).toHaveAttribute(
      'href',
      `${site.routes.events[lang]}#nuremberg`,
    );
    await expect(links.nth(1)).toContainText('2026');
    await page.screenshot({ path: `test-results/menu-${lang}-390.png` });
    await page.keyboard.press('Escape');
    await expect(page.locator('.site-header__toggle')).toBeFocused();
  }
});
