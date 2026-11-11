import { test, expect } from '@playwright/test';
import site from '../../site.config.json' with { type: 'json' };

for (const lang of ['ru', 'de'] as const) {
  test(`${lang}: November games are archived and December meetings have separate dates`, async ({
    page,
    request,
  }) => {
    const legacy =
      lang === 'ru'
        ? '/ru/meropriyatiya/transformatsionnye-igry/'
        : '/de/veranstaltungen/transformationsspiele/';
    const redirect = await request.get(legacy, { maxRedirects: 0 });
    expect(redirect.status()).toBe(301);
    expect(redirect.headers().location).toContain(site.routes.tiGames[lang]);

    await page.goto(site.routes.archive[lang]);
    await expect(
      page
        .locator(`main a[href="${site.routes.archiveRegensburg[lang]}"]`)
        .first(),
    ).toBeVisible();
    await page
      .locator(`main a[href="${site.routes.tiGames[lang]}"]`)
      .first()
      .click();
    await expect(
      page.locator('main time[datetime="2026-11-07"]'),
    ).toBeVisible();
    await expect(page.locator('#ti-program')).toBeVisible();
    await expect(page.locator('[data-practitioner]')).toHaveCount(4);
    await expect(page.locator('[data-ticket], #ti-sticky-buy')).toHaveCount(0);

    await page.goto(site.routes.host[lang]);
    await expect(page.locator('main h1')).toContainText(
      lang === 'ru' ? 'завершена' : 'geschlossen',
    );
    await expect(page.locator('#host-registration-form')).toHaveCount(0);

    await page.goto(site.routes.events[lang]);
    await expect(page.locator('#munich time')).toHaveAttribute(
      'datetime',
      '2026-12-12',
    );
    await page.locator('#munich a').click();
    await expect(page.locator('main time')).toHaveAttribute(
      'datetime',
      '2026-12-12',
    );
    await expect(page.locator('[data-ticket]')).toHaveCount(0);
    await page.goto(site.routes.events[lang]);
    await page.locator('[data-ticket="nuremberg_meetup"]').click();
    await expect(page.locator('#ticket-summary')).toContainText(
      lang === 'ru' ? '13 декабря' : '13. Dezember',
    );
    await expect(page.locator('#ticket-summary')).toContainText('€29');
  });
}
