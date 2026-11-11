import { test, expect } from '@playwright/test';

const pages = [
  {
    lang: 'ru',
    path: '/ru/vedushchie-igr/',
    events: '/ru/meropriyatiya/',
    label: 'Хочу провести игру',
    total: 'Стоимость участия',
    now: 'Сейчас',
    later: 'Позже',
    submit: 'Зарегистрироваться и занять стол',
  },
  {
    lang: 'de',
    path: '/de/spiele-leiten/',
    events: '/de/veranstaltungen/',
    label: 'Ich möchte ein Spiel leiten',
    total: 'Teilnahmekosten',
    now: 'Jetzt',
    later: 'Später',
    submit: 'Anmelden und Tisch sichern',
  },
] as const;

test('a cancelled checkout never claims a confirmed place', async ({ page }) => {
  for (const item of pages) {
    await page.goto(`${item.path}?payment=cancelled`);
    await expect(page.locator('#host-status')).toBeVisible();
    await expect(page.locator('#host-status-message')).toContainText(
      item.lang === 'ru' ? 'Оплата отменена' : 'Zahlung abgebrochen',
    );
    await expect(page.locator('#host-status-message')).not.toContainText(
      item.lang === 'ru' ? 'Стол №' : 'Tisch Nr.',
    );
  }
});
