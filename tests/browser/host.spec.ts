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

test('host page is reachable from the participant purchase block', async ({
  page,
}) => {
  for (const item of pages) {
    await page.goto(item.events);
    const link = page.locator(`a[href="${item.path}"]`);
    await expect(link).toBeVisible();
    await expect(link).toContainText(item.label);
    await expect(page.locator('[data-ticket="host"]')).toHaveCount(0);
    await link.click();
    await expect(page).toHaveURL(new RegExp(`${item.path}$`));
    await expect(page.locator('#host-registration-form')).toBeVisible();
    await expect(page.locator('#host-benefits')).toContainText(
      item.lang === 'ru' ? 'QR-код' : 'QR-Code',
    );
    await expect(page.locator('#host-benefits')).toContainText(
      item.lang === 'ru' ? 'сторис R.O.S.T.' : 'R.O.S.T.-Storys',
    );
    if (item.lang === 'ru')
      await page.locator('#host-benefits').screenshot({ path: 'test-results/host-benefits-ru.png' });
  }
});

test('host page shows all four totals and the deposit switches only the amount due now', async ({
  page,
}) => {
  for (const item of pages) {
    for (const width of [390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(item.path);
      await expect(page.locator('#host-title')).toBeVisible();
      await expect(page.locator('#host-registration')).toBeVisible();
      await expect(page.locator('#host-submit')).toHaveCount(1);
      await expect(page.locator('#host-submit')).toHaveText(item.submit);
      const formatRadio = page.locator('input[name="host-format"][value="standard"]');
      const radioBox = await formatRadio.boundingBox();
      expect(radioBox?.width).toBeGreaterThanOrEqual(16);
      if (item.lang === 'ru' && width === 390) {
        await formatRadio.scrollIntoViewIfNeeded();
        await page.screenshot({ path: 'test-results/host-formats-ru-390.png' });
      }
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);

      await page
        .locator('input[name="host-format"][value="standard"]')
        .check({ force: true });
      await page.locator('#host-media').uncheck();
      await page.locator('#host-deposit').uncheck();
      await expect(page.locator('#host-total')).toHaveText('249 €');
      await expect(page.locator('#host-due')).toHaveText('249 €');
      await expect(page.locator('#host-remaining-row')).toBeHidden();

      await page.locator('#host-media').check();
      await expect(page.locator('#host-total')).toHaveText('328 €');
      await expect(page.locator('#host-due')).toHaveText('328 €');

      await page
        .locator('input[name="host-format"][value="expanded"]')
        .check({ force: true });
      await expect(page.locator('#host-total')).toHaveText('428 €');
      await expect(page.locator('#host-due')).toHaveText('428 €');

      await page.locator('#host-deposit').check();
      await expect(page.locator('#host-total')).toHaveText('428 €');
      await expect(page.locator('#host-due')).toHaveText('50 €');
      await expect(page.locator('#host-remaining-row')).toBeVisible();
      await expect(page.locator('#host-remaining')).toHaveText('378 €');
      await expect(page.locator('#host-cta-due')).toHaveText('50 €');
      await expect(page.locator('#host-deposit-note')).toBeVisible();

      await page.locator('#host-media').uncheck();
      await page
        .locator('input[name="host-format"][value="standard"]')
        .check({ force: true });
      await expect(page.locator('#host-total')).toHaveText('249 €');
      await expect(page.locator('#host-due')).toHaveText('50 €');
      await expect(page.locator('#host-remaining')).toHaveText('199 €');
    }
  }
});

test('host form validates contacts and the required consents before payment', async ({
  page,
}) => {
  for (const item of pages) {
    await page.setViewportSize({ width: 390, height: 850 });
    await page.goto(item.path);
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="gameTitle"]')).toBeVisible();
    await expect(page.locator('textarea[name="gameDescription"]')).toBeVisible();
    await expect(page.locator('input[name="terms"]')).not.toBeChecked();
    await expect(page.locator('input[name="privacy"]')).not.toBeChecked();

    await page.locator('input[name="contact"]').fill('кириллица');
    await expect(page.locator('#host-contact-error')).toBeVisible();
    await expect(page.locator('#host-contact-hint')).toBeHidden();
    await page
      .locator('input[name="channel"][value="WhatsApp"] + span')
      .click();
    await expect(page.locator('#host-whatsapp-type')).toBeVisible();
    await page.locator('input[name="contact"]').fill('0176 12345678');
    await expect(page.locator('#host-contact-error')).toBeHidden();
    await page
      .locator('input[name="channel"][value="Telegram"] + span')
      .click();
    await expect(page.locator('input[name="contact"]')).toHaveAttribute(
      'placeholder',
      '@username',
    );
  }
});

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

test('the manual switch disables the payment button', async ({ page }) => {
  await page.route('**/api/host-registrations/availability', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        registrationOpen: false,
        freeTables: 7,
        totalTables: 7,
        holdMinutes: 30,
        serverTime: Date.now(),
      }),
    }),
  );
  for (const item of pages) {
    await page.goto(item.path);
    await expect(page.locator('#host-submit')).toBeDisabled();
    await expect(page.locator('#host-closed-note')).toBeVisible();
    await expect(page.locator('#host-closed-note')).toContainText(
      item.lang === 'ru' ? 'Регистрация ведущих закрыта' : 'Anmeldung für Spielleitende ist geschlossen',
    );
  }
});
