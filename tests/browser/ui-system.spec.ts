import { test, expect } from '@playwright/test';
import site from '../../site.config.json' with { type: 'json' };

for (const lang of ['ru', 'de'] as const) {
  for (const width of [320, 390, 767, 768, 769, 1023, 1024, 1025, 1440]) {
    test(`shared UI: ${lang} at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      let titleSize: string | undefined;
      for (const [key, route] of Object.entries(site.routes)) {
        await page.goto(route[lang]);
        await page.evaluate(() => document.fonts.ready);
        const title = page.locator('main h1');
        await expect(title).toHaveCount(1);
        const metrics = await title.evaluate((el) => {
          const s = getComputedStyle(el);
          return { font: s.fontSize, family: s.fontFamily, align: s.textAlign };
        });
        titleSize ??= metrics.font;
        expect(metrics.font, `${key}: shared PageTitle size`).toBe(titleSize);
        expect(metrics.family).toContain('Marmelad');
        if (width < 1024)
          expect(metrics.align, `${key}: centered H1`).toBe('center');
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          `${key}: no overflow`,
        ).toBe(true);

        const crumbs = page.locator('.ui-breadcrumbs');
        await expect(crumbs).toHaveCount(0);
        for (const button of await page.locator('.ui-button:visible').all()) {
          const buttonBox = await button.boundingBox();
          expect(buttonBox!.height).toBeGreaterThanOrEqual(48);
          const overflow = await button.evaluate(
            (el) => el.scrollWidth > el.clientWidth + 1,
          );
          expect(overflow, `${key}: button label fits`).toBe(false);
        }
        if (
          ['home', 'archive', 'archiveRegensburg', 'tiGames', 'host'].includes(
            key,
          ) &&
          [390, 1440].includes(width)
        ) {
          await page.screenshot({
            path: `test-results/ui-${key}-${lang}-${width}.png`,
          });
        }
      }
    });
  }
}

test('shared submit button still submits contact forms and dialog restores focus', async ({
  page,
}) => {
  await page.goto('/ru/meropriyatiya/transformatsionnye-igry/');
  const trigger = page.locator('#ti-ticket-card [data-ticket]');
  await trigger.click();
  const submit = page.locator('#ticket-form button[type="submit"]');
  await expect(submit).toHaveClass(/ui-button/);
  await page.locator('#ticket-form input[name="name"]').fill('Анна');
  await page.locator('#ticket-form input[name="contact"]').fill('anna_test');
  await submit.click();
  await expect(page.locator('#ticket-payment')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
});
