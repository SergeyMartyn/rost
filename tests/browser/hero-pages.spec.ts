import { expect, test } from '@playwright/test';

const paths = {
  ru: ['/ru/', '/ru/meropriyatiya/', '/ru/o-nas/', '/ru/kontakty/'],
  de: ['/de/', '/de/veranstaltungen/', '/de/ueber-uns/', '/de/kontakt/'],
};

test('all four heroes share spacing and type at every viewport', async ({
  page,
}) => {
  for (const [lang, routes] of Object.entries(paths)) {
    for (const width of [390, 768, 1440]) {
      const styles: Array<string[]> = [];
      const videoTops: number[] = [];
      await page.setViewportSize({ width, height: 900 });
      for (const [index, route] of routes.entries()) {
        await page.goto(route);
        await expect(page.locator('.hero__video')).toHaveCount(1);
        expect(
          await page
            .locator('.hero')
            .evaluate((element) =>
              Math.round(element.getBoundingClientRect().top),
            ),
        ).toBe(0);
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          `${route} at ${width}px`,
        ).toBe(true);
        styles.push(
          await page.locator('.hero').evaluate((element) => {
            const inner = element.querySelector('.hero__inner')!;
            const eyebrow = element.querySelector('.hero__eyebrow')!;
            const title = element.querySelector('.hero__title')!;
            const copy = element.querySelector('.hero__description')!;
            return [
              getComputedStyle(inner).paddingTop,
              getComputedStyle(inner).paddingBottom,
              getComputedStyle(eyebrow).fontSize,
              getComputedStyle(title).fontSize,
              getComputedStyle(copy).fontSize,
            ];
          }),
        );
        if (width === 1440) {
          videoTops.push(
            await page
              .locator('.hero__video')
              .evaluate((element) =>
                Math.round(element.getBoundingClientRect().top),
              ),
          );
        }
        if (lang === 'ru') {
          await page.screenshot({
            path: `test-results/hero-${index}-${width}.png`,
            fullPage: false,
          });
        }
      }
      for (const style of styles.slice(1)) expect(style).toEqual(styles[0]);
      if (width === 1440) {
        for (const top of videoTops.slice(1)) expect(top).toBe(videoTops[0]);
      }
    }
  }
});

test('games date and venue agree across pages and ticket summary', async ({
  page,
}) => {
  for (const [lang, routes] of Object.entries(paths)) {
    await page.goto(routes[0]);
    await expect(page.locator('.events__date').last()).toHaveAttribute(
      'datetime',
      '2026-11-07',
    );
    await page.goto(routes[1]);
    await expect(page.locator('#games')).toContainText(
      lang === 'ru' ? '7 ноября 2026' : '7. November 2026',
    );
    await expect(page.locator('#games')).toContainText(
      lang === 'ru' ? 'Перхтингер-штрассе, 12' : 'Perchtinger Straße 12',
    );
    await expect(page.locator('#games a[href*="maps"]')).toHaveCount(0);
    if (lang === 'ru') {
      await page.locator('#games').screenshot({
        path: 'test-results/games-venue-ru.png',
      });
    }
    await page.locator('[data-ticket="guest"]').click();
    await expect(page.locator('#ticket-summary')).toContainText(
      lang === 'ru' ? '7 ноября' : '7. November',
    );
  }
});

test('footer centers at tablet and wraps legal links below copyright on phones', async ({
  page,
}) => {
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/ru/');
    const positions = await page.locator('.site-footer').evaluate((element) => {
      const copyright = element
        .querySelector('.site-footer__copyright')!
        .getBoundingClientRect();
      const links = element
        .querySelector('.site-footer__links')!
        .getBoundingClientRect();
      return { copyright, links };
    });
    if (width < 768) {
      expect(positions.links.top).toBeGreaterThan(positions.copyright.bottom);
    }
    const copyrightCenter =
      positions.copyright.left + positions.copyright.width / 2;
    if (width < 768)
      expect(Math.abs(copyrightCenter - width / 2)).toBeLessThan(2);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});
