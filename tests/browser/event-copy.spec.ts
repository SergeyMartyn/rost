import { test, expect } from '@playwright/test';
import site from '../../site.config.json' with { type: 'json' };

for (const lang of ['ru', 'de'] as const) {
  test(`event copy ${lang}: inspect every profile, including the second game`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 950 });
    await page.goto(site.routes.tiGames[lang]);
    const data = await page.locator('#practitioner-data').textContent();
    expect(data).not.toMatch(
      /98\s?%|скрытые причины|подсознани|Чувствуете тревогу|Вернуть уверенность|Найдёте внутреннюю|Unterbewusstsein|verborgene Ursachen|Du fühlst Unruhe|innere Stabilität zurückgewinnen/iu,
    );
    await expect(page.locator('.ti-about')).toContainText(
      lang === 'ru'
        ? 'Это не медицинская консультация и не психотерапия'
        : 'Es ist keine medizinische Beratung oder Psychotherapie',
    );
    await expect(page.locator('#ti-ticket-card')).toContainText('€80');
    await expect(page.locator('#ti-ticket-card')).toContainText('€180');
    await expect(page.locator('[data-practitioner]')).toHaveCount(4);
    for (let i = 0; i < 4; i++) {
      await page.locator(`[data-practitioner="${i}"]`).click();
      const dialog = page.locator('#practitioner-dialog');
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText(
        lang === 'ru' ? 'Темы и вопросы' : 'Themen und Fragen',
      );
      await expect(dialog).toContainText(
        lang === 'ru' ? 'Как проходит игра' : 'Ablauf im Spiel',
      );
      await expect(page.locator('#practitioner-results li')).not.toHaveCount(0);
      if (i === 3) {
        await expect(page.locator('#practitioner-other-game')).toBeVisible();
        await expect(
          page.locator('#practitioner-other-results li'),
        ).not.toHaveCount(0);
      }
      await page.keyboard.press('Escape');
      await expect(dialog).toBeHidden();
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });

  test(`event copy ${lang}: concrete promotion channels and unchanged fees`, async ({
    page,
  }) => {
    await page.goto(site.routes.host[lang]);
    const main = page.locator('main');
    await expect(main).toContainText('Instagram');
    await expect(main).toContainText('Telegram');
    await expect(main).toContainText(
      lang === 'ru' ? 'на сайте' : 'auf der Website',
    );
    for (const amount of ['€249', '€349', '€79', '€50'])
      await expect(main).toContainText(amount);
    await expect(main).toContainText(
      lang === 'ru' ? 'сертификат участия' : 'Teilnahmebescheinigung',
    );
    expect(await main.textContent()).not.toMatch(/на сцене|auf der Bühne/iu);
  });
}
