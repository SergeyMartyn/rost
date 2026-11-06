import { test, expect } from '@playwright/test';
for (const lang of ['ru', 'de'] as const) {
  test(`sold out ${lang}: base disabled on catalogue and detail, VIP remains purchasable`, async ({ page }) => {
    const paths = lang === 'ru' ? ['/ru/meropriyatiya/', '/ru/meropriyatiya/transformatsionnye-igry/'] : ['/de/veranstaltungen/', '/de/veranstaltungen/transformationsspiele/'];
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const path of paths) {
        await page.goto(path);
        const basic = page.locator('input[type="radio"][value="guest"]');
        for (const radio of await basic.all()) {
          await expect(radio).toBeDisabled();
          await expect(radio.locator('..')).toContainText(lang === 'ru' ? 'Распродано' : 'Ausverkauft');
        }
        await expect(page.locator('input[type="radio"][value="guest_peak"]').first()).toBeChecked();
        await page.locator('[data-ticket="guest"][data-ticket-group]').click();
        await expect(page.locator('#ticket-dialog')).toBeVisible();
        await expect(page.locator('#ticket-summary')).toContainText('€180');
        await page.locator('#ticket-close').click();
        // A stale or modified page cannot open the removed basic ticket in the dialog.
        await basic.first().evaluate((input: HTMLInputElement) => { input.disabled = false; input.checked = true; });
        await page.locator('[data-ticket="guest"][data-ticket-group]').click();
        await expect(page.locator('#ticket-dialog')).not.toBeVisible();
      }
    }
  });
}
