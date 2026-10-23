import { test, expect, type Page } from '@playwright/test';
import site from '../../site.config.json' with { type: 'json' };

async function openPayment(page: Page, lang: 'ru' | 'de', ticket = 'guest') {
  await page.goto(site.routes.tiGames[lang]);
  await page.locator(`#ti-ticket-card input[value="${ticket}"]`).check();
  await page.locator('#ti-ticket-card [data-ticket]').click();
  await page.locator('#ticket-form input[name="name"]').fill('Test Person');
  await page.locator('#ticket-form input[name="contact"]').fill('test_person');
  await page.locator('#ticket-form button[type="submit"]').click();
  await page.locator('#ticket-privacy').check();
  await expect(page.locator('#ticket-price-total')).toHaveText(
    ticket === 'guest_peak' ? '€180' : '€80',
  );
}
async function mockPricing(page: Page) {
  await page.route('**/api/config', (route) =>
    route.fulfill({
      json: { paymentsEnabled: true, mode: 'test', stripe: true, paypal: true },
    }),
  );
  await page.route('**/api/orders/quote', async (route) => {
    const body = route.request().postDataJSON();
    const code = String(body.promoCode || '')
      .trim()
      .toUpperCase();
    if (code === 'WRONG')
      return route.fulfill({ status: 400, json: { error: 'invalid_promo' } });
    if (code && body.ticket === 'guest_peak')
      return route.fulfill({
        status: 400,
        json: { error: 'promo_not_applicable' },
      });
    const base = body.ticket === 'guest_peak' ? 18000 : 8000;
    const quantity = code && !code.startsWith('PROMO10') ? 2 : 1;
    return route.fulfill({
      json: {
        quantity,
        unitAmountCents: base,
        baseAmountCents: base * quantity,
        amountCents: code ? 7200 * quantity : base,
        discountCents: code ? 800 * quantity : 0,
        discountPercent: code ? 10 : 0,
        promoCode: code || null,
        promotionKind: code ? 'family' : null,
        issuerCode: code ? 'T' : null,
        issuerName: code ? 'Тимур' : null,
        quoteKey: `quote:${body.ticket}:${code}`,
      },
    });
  });
}
for (const lang of ['ru', 'de'] as const)
  for (const width of [320, 390, 1440]) {
    test(`promo UI ${lang} ${width}: apply, edit, error, remove and send snapshot`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 950 });
      await mockPricing(page);
      let submitted: any;
      await page.route('**/api/orders', async (route) => {
        submitted = route.request().postDataJSON();
        return route.fulfill({
          status: 502,
          json: { error: 'stripe_unavailable' },
        });
      });
      await openPayment(page, lang);
      await page.locator('#ticket-promo-details summary').click();
      const input = page.locator('#ticket-promo');
      const pay = page.locator('[data-payment="stripe"]');
      await input.fill(' family10t ');
      await expect(pay).toBeDisabled();
      await input.press('Enter');
      await expect(page.locator('#ticket-price-total')).toHaveText('€144');
      await expect(input).toHaveValue('FAMILY10T');
      await expect(pay).toBeEnabled();
      await expect(page.locator('#ticket-price-discount')).toContainText('10%');
      await page
        .locator('#ticket-payment')
        .screenshot({ path: `test-results/promo-${lang}-${width}.png` });
      expect(
        await page
          .locator('#ticket-dialog')
          .evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
      ).toBe(true);
      await pay.click();
      expect(submitted).toBeUndefined();
      await expect(page.locator('#ticket-second-name')).toBeFocused();
      await page.locator('#ticket-second-name').fill('Алексей');
      await pay.click();
      await expect(page.locator('#ticket-error')).toBeVisible();
      expect(submitted.quantity).toBe(2);
      expect(submitted.secondParticipantName).toBe('Алексей');
      expect(submitted.promoCode).toBe('FAMILY10T');
      expect(submitted.quoteKey).toBe('quote:guest:FAMILY10T');
      await input.fill('WRONG');
      await expect(pay).toBeDisabled();
      await page.locator('#ticket-promo-apply').click();
      await expect(input).toHaveAttribute('aria-invalid', 'true');
      await expect(pay).toBeDisabled();
      await page.locator('#ticket-promo-remove').click();
      await expect(page.locator('#ticket-price-total')).toHaveText('€80');
      await expect(pay).toBeEnabled();
      await expect(page.locator('#ticket-second-participant')).toBeHidden();
      await expect(page.locator('#ticket-second-name')).toHaveValue('');
    });
  }
test('VIP rejects codes; a changed server price requires a second deliberate payment click', async ({
  page,
}) => {
  await mockPricing(page);
  await openPayment(page, 'ru', 'guest_peak');
  await page.locator('#ticket-promo-details summary').click();
  await page.locator('#ticket-promo').fill('FAMILY10T');
  await page.locator('#ticket-promo-apply').click();
  await expect(page.locator('#ticket-promo-message')).toContainText(
    'не применяется',
  );
  await expect(page.locator('[data-payment="stripe"]')).toBeDisabled();
  await page.locator('#ticket-promo-remove').click();
  await expect(page.locator('#ticket-price-total')).toHaveText('€180');
  await expect(page.locator('[data-payment="stripe"]')).toBeEnabled();
  let calls = 0;
  await page.route('**/api/orders', (route) => {
    calls++;
    return route.fulfill({ status: 409, json: { error: 'price_changed' } });
  });
  await page.locator('[data-payment="stripe"]').click();
  await expect(page.locator('#ticket-promo-message')).toContainText(
    'Цена обновилась',
  );
  await expect(page.locator('[data-payment="stripe"]')).toBeEnabled();
  expect(calls).toBe(1);
});
test('stale quote replies cannot restore a discount after editing or switching tickets', async ({
  page,
}) => {
  await mockPricing(page);
  await openPayment(page, 'ru');
  await page.locator('#ticket-promo-details summary').click();
  await page.locator('#ticket-promo').fill('FAMILY10T');
  let release!: () => void;
  const held = new Promise<void>((resolve) => (release = resolve));
  let requested!: () => void;
  const started = new Promise<void>((resolve) => (requested = resolve));
  await page.route('**/api/orders/quote', async (route) => {
    const data = route.request().postDataJSON();
    requested();
    await held;
    return route.fulfill({
      json: {
        baseAmountCents: 8000,
        amountCents: 7200,
        discountCents: 800,
        discountPercent: 10,
        promoCode: data.promoCode,
        quoteKey: 'stale',
      },
    });
  });
  await page.locator('#ticket-promo-apply').click();
  await started;
  await page.locator('#ticket-promo').fill('FRIEND10X');
  release();
  await expect(page.locator('[data-payment="stripe"]')).toBeDisabled();
  await expect(page.locator('#ticket-price')).toBeHidden();
});

for (const lang of ['ru', 'de'] as const)
  for (const width of [320, 390, 1440])
    test(`single promo ${lang} ${width}: pair to single to pair and removal`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 950 });
      await mockPricing(page);
      let submitted: any;
      await page.route('**/api/orders', (route) => {
        submitted = route.request().postDataJSON();
        return route.fulfill({
          status: 502,
          json: { error: 'stripe_unavailable' },
        });
      });
      await openPayment(page, lang);
      await page.locator('#ticket-promo-details summary').click();
      const input = page.locator('#ticket-promo');
      const second = page.locator('#ticket-second-name');
      const pay = page.locator('[data-payment="stripe"]');
      await input.fill('FAMILY10T');
      await input.press('Enter');
      await expect(page.locator('#ticket-price-total')).toHaveText('€144');
      await second.fill(lang === 'ru' ? 'Алексей' : 'Alex');
      await input.fill(' promo10k ');
      await expect(pay).toBeDisabled();
      await input.press('Enter');
      await expect(page.locator('#ticket-price-total')).toHaveText('€72');
      await expect(input).toHaveValue('PROMO10K');
      await expect(page.locator('#ticket-price-base')).toHaveText('€80');
      await expect(page.locator('#ticket-price-discount')).toContainText('−€8');
      await expect(page.locator('#ticket-second-participant')).toBeHidden();
      await expect(second).toHaveValue('');
      await expect(second).toBeDisabled();
      await expect(second).not.toHaveAttribute('required', '');
      expect(
        await page
          .locator('#ticket-dialog')
          .evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
      ).toBe(true);
      await page
        .locator('#ticket-payment')
        .screenshot({ path: `test-results/single-promo-${lang}-${width}.png` });
      await pay.click();
      await expect(page.locator('#ticket-error')).toBeVisible();
      expect(submitted.promoCode).toBe('PROMO10K');
      expect(submitted.quantity).toBe(1);
      expect(submitted.secondParticipantName).toBeUndefined();
      submitted = undefined;
      await input.fill('FRIEND10X');
      await input.press('Enter');
      await expect(page.locator('#ticket-price-total')).toHaveText('€144');
      await expect(second).toBeVisible();
      await expect(second).toHaveValue('');
      await pay.click();
      expect(submitted).toBeUndefined();
      await expect(second).toBeFocused();
      await page.locator('#ticket-promo-remove').click();
      await expect(page.locator('#ticket-price-total')).toHaveText('€80');
      await expect(second).toBeDisabled();
      await expect(second).toHaveValue('');
    });
