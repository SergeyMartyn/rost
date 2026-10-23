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

test('ticket contents select the whole card and synchronize the purchase', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(site.routes.tiGames.ru);
  const basic = page.locator(
    'input[name="games-ticket-details"][value="guest"]',
  );
  await basic
    .locator('xpath=ancestor::label')
    .getByRole('listitem')
    .last()
    .click();
  await expect(basic).toBeChecked();
  await expect(
    page.locator('input[name="games-ticket"][value="guest"]'),
  ).toBeChecked();
  const peak = page.locator(
    'input[name="games-ticket-details"][value="guest_peak"]',
  );
  await peak
    .locator('xpath=ancestor::label')
    .click({ position: { x: 10, y: 10 } });
  await expect(peak).toBeChecked();
  await peak.focus();
  await page.keyboard.press('ArrowLeft');
  await expect(basic).toBeChecked();
  const first = page.locator('[data-practitioner="0"]');
  await expect(first).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await first.scrollIntoViewIfNeeded();
  await first.screenshot({ path: 'test-results/first-practitioner-390.png' });
  await first.click();
  await expect(page.locator('#practitioner-dialog')).toBeVisible();
});

test('value sections use localized copy and optimized event photographs', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  for (const lang of ['ru', 'de'] as const) {
    for (const [route, audience] of [
      [site.routes.host[lang], 'hosts'],
      [site.routes.tiGames[lang], 'participants'],
    ]) {
      await page.goto(route);
      const section = page.locator(
        `section[aria-labelledby="event-value-${audience}"]`,
      );
      const image = section.locator('img');
      await image.scrollIntoViewIfNeeded();
      await expect
        .poll(() =>
          image.evaluate(
            (el: HTMLImageElement, audience) =>
              el.complete &&
              el.naturalWidth > 0 &&
              /-(600|1200)\.(avif|webp)$/.test(el.currentSrc) &&
              Math.abs(
                el.naturalWidth / el.naturalHeight -
                  (audience === 'hosts' ? 4 / 3 : 16 / 9),
              ) < 0.01,
            audience,
          ),
        )
        .toBe(true);
      await expect(section.getByRole('heading', { level: 3 })).toHaveCount(3);
      await expect(image).not.toHaveAttribute('alt', '');
      await section.screenshot({
        style:
          '.site-header, #ti-sticky-buy, body > a { visibility: hidden !important; }',
        path: `test-results/value-${audience}-${lang}-390.png`,
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
      site.routes.tiGames[lang],
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
