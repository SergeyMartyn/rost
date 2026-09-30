import { test, expect } from '@playwright/test';

test('events section keeps shared spacing and equal card widths', async ({
  page,
}) => {
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/ru/');

    const section = page.locator('.events');
    const frames = section.locator('.events__frame');
    await expect(section.locator('h2')).toHaveText('Ближайшие мероприятия');
    await expect(section.locator('.events__value')).toHaveText(
      'Мы предлагаем вам хорошее окружение,а также повод встретиться снова.',
    );

    const widths = await frames.evaluateAll((elements) =>
      elements.map((element) => element.getBoundingClientRect().width),
    );
    expect(widths).toHaveLength(2);
    expect(widths[0]).toBeCloseTo(widths[1], 1);

    const padding = await section.evaluate((element) => {
      const style = getComputedStyle(element);
      return [style.paddingTop, style.paddingBottom];
    });
    expect(padding[0]).toBe(padding[1]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);

    await page.screenshot({
      path: `test-results/events-ru-${width}.png`,
      fullPage: true,
    });
  }

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/ru/');
  const firstFrame = page.locator('.events__frame').first();
  await firstFrame.hover();
  await expect(firstFrame).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, -8)');
  await expect(firstFrame.locator('.events__photo')).not.toHaveCSS(
    'transform',
    'none',
  );

  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto('/de/');
  await expect(page.locator('.events__heading')).toHaveText(
    'Nächste Veranstaltungen',
  );
  await expect(page.locator('.events__item')).toHaveCount(2);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: 'test-results/events-de-390.png',
    fullPage: true,
  });
});

test('event photographs fill the cards and open uncropped in both languages', async ({
  page,
}) => {
  for (const lang of ['ru', 'de']) {
    for (const width of [390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/${lang}/`);
      const previews = page.locator('.events__photo img');
      await expect(previews).toHaveCount(2);
      for (const image of await previews.all()) {
        await image.scrollIntoViewIfNeeded();
        await expect
          .poll(() =>
            image.evaluate(
              (element: HTMLImageElement) =>
                element.complete && element.naturalWidth > 0,
            ),
          )
          .toBe(true);
        await expect(image).toHaveCSS('object-fit', 'cover');
      }
      for (const index of [0, 1]) {
        await page.locator('.events__photo-trigger').nth(index).click();
        await expect(page.locator('#event-photo-dialog')).toBeVisible();
        await expect
          .poll(() =>
            page
              .locator('#event-photo-full')
              .evaluate(
                (element: HTMLImageElement) =>
                  element.complete && element.naturalWidth > 0,
              ),
          )
          .toBe(true);
        await expect(page.locator('#event-photo-full')).toHaveCSS(
          'object-fit',
          'contain',
        );
        const fits = await page
          .locator('#event-photo-full')
          .evaluate((element) => {
            const box = element.getBoundingClientRect();
            return box.width <= innerWidth && box.height <= innerHeight;
          });
        expect(fits).toBe(true);
        await page.keyboard.press('Escape');
        await expect(page.locator('#event-photo-dialog')).not.toBeVisible();
      }
      await expect(page.locator('.events__link').first()).toHaveAttribute(
        'href',
        new RegExp(`/${lang}/.*#regensburg$`),
      );
    }
  }
});

test('header overlays each hero without a scroll gap at phone, tablet and desktop widths', async ({
  page,
}) => {
  for (const lang of ['ru', 'de']) {
    for (const width of [390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const path of [
        lang === 'ru' ? '/ru/' : '/de/',
        lang === 'ru' ? '/ru/meropriyatiya/' : '/de/veranstaltungen/',
      ]) {
        await page.goto(path);
        const selector =
          path.endsWith('/') && (path === '/ru/' || path === '/de/')
            ? '.home-main'
            : '#main > div > section:first-child';
        expect(
          await page
            .locator(selector)
            .evaluate((element) =>
              Math.round(element.getBoundingClientRect().top),
            ),
          `${path} at ${width}px`,
        ).toBe(0);
        await page.evaluate(() => scrollTo(0, 1));
        expect(
          await page
            .locator(selector)
            .evaluate((element) =>
              Math.round(element.getBoundingClientRect().top),
            ),
          `${path} after scrolling at ${width}px`,
        ).toBe(-1);
        await expect(page.locator('.site-header')).toHaveCSS(
          'background-color',
          'rgba(0, 0, 0, 0)',
        );
        if (
          lang === 'ru' &&
          path.includes('meropriyatiya') &&
          (width === 390 || width === 1440)
        ) {
          await page.evaluate(() => scrollTo(0, 0));
          await page.screenshot({
            path: `test-results/event-page-ru-${width}.png`,
          });
        }
      }
    }
  }
});

test('event contact form validates channels and repeats the contact before payment', async ({
  page,
}) => {
  for (const [lang, path, name] of [
    ['ru', '/ru/meropriyatiya/', 'Анна'],
    ['de', '/de/veranstaltungen/', 'Anna'],
  ]) {
    await page.setViewportSize({ width: 390, height: 850 });
    await page.goto(path);
    await page.locator('[data-ticket="meetup"]').click();
    await expect(page.locator('#ticket-close svg')).toBeVisible();
    await page.locator('input[name="name"]').fill(name);
    await page.locator('input[name="contact"]').fill('валпвиеи');
    await expect(page.locator('#contact-error')).toBeVisible();
    await page.locator('#ticket-form button[type="submit"]').click();
    await expect(page.locator('#ticket-payment')).toBeHidden();
    await page.locator('input[name="contact"]').fill('anna_test');
    await page.locator('#ticket-form button[type="submit"]').click();
    await expect(page.locator('#ticket-payment')).toBeVisible();
    await expect(page.locator('#ticket-person')).toHaveText(name);
    await expect(page.locator('#ticket-contact')).toHaveText(
      'Telegram · @anna_test',
    );
    if (lang === 'ru')
      await page.screenshot({ path: 'test-results/ticket-payment-ru.png' });
    await expect(page.locator('#ticket-privacy')).not.toBeChecked();
    const stripeButton = page.locator('[data-payment="stripe"]');
    await expect(page.locator('[data-payment="paypal"]')).toBeHidden();
    await expect(stripeButton).toBeVisible();
    await expect(stripeButton).toBeDisabled();
    await expect(page.locator('#ticket-preview-note')).toContainText(
      lang === 'ru' ? 'недоступна' : 'nicht verfügbar',
    );
    await page.locator('#ticket-privacy').check();
    // On the local preview host no payment method is enabled by /api/config.
    await expect(stripeButton).toBeDisabled();
    await page.locator('#ticket-back').click();
    await page
      .locator('input[name="channel"][value="WhatsApp"] + span')
      .click();
    await page.locator('input[name="contact"]').fill('+49 176 12345678');
    await page.locator('#ticket-form button[type="submit"]').click();
    await expect(page.locator('#ticket-contact')).toHaveText(
      'WhatsApp · +4917612345678',
    );
    await page.locator('#ticket-close').click();
    await expect(page.locator('#ticket-dialog')).not.toBeVisible();
  }
});

test('contact errors replace hints, local WhatsApp numbers normalize, and terms links resolve', async ({
  page,
  request,
}) => {
  for (const [lang, path, termsPath, name] of [
    ['ru', '/ru/meropriyatiya/', '/ru/usloviya-uchastiya/', 'Анна'],
    ['de', '/de/veranstaltungen/', '/de/teilnahmebedingungen/', 'Anna'],
  ]) {
    await page.goto(path);
    await page.locator('[data-ticket="meetup"]').click();
    await page.locator('input[name="name"]').fill(name);
    await expect(page.locator('#contact-hint')).not.toContainText('27');
    await page.locator('input[name="contact"]').fill('кириллица');
    await expect(page.locator('#contact-error')).toBeVisible();
    await expect(page.locator('#contact-hint')).toBeHidden();
    await page
      .locator('input[name="channel"][value="WhatsApp"] + span')
      .click();
    await expect(page.locator('input[name="contact"]')).toHaveAttribute(
      'placeholder',
      lang === 'ru'
        ? '+49 176 12345678 или 0176 12345678'
        : '+49 176 12345678 oder 0176 12345678',
    );
    await page.locator('input[name="contact"]').fill('abc');
    await expect(page.locator('#contact-hint')).toBeHidden();
    await page.locator('input[name="contact"]').fill('0176 12345678');
    await expect(page.locator('#contact-error')).toBeHidden();
    await page.locator('#ticket-form button[type="submit"]').click();
    await expect(page.locator('#ticket-contact')).toHaveText(
      'WhatsApp · +4917612345678',
    );
    await expect(page.locator('#ticket-payment a').first()).toHaveAttribute(
      'href',
      termsPath,
    );
    await expect(page.locator('#ticket-payment a').nth(1)).toHaveAttribute(
      'href',
      lang === 'ru' ? '/ru/konfidentsialnost/' : '/de/datenschutz/',
    );
    expect((await request.get(termsPath)).status()).toBe(200);
  }
});

test('the three ticket prices agree in both languages', async ({ page }) => {
  for (const lang of ['ru', 'de'] as const) {
    const home = lang === 'ru' ? '/ru/' : '/de/';
    const events =
      lang === 'ru' ? '/ru/meropriyatiya/' : '/de/veranstaltungen/';
    await page.goto(home);
    await page
      .locator('.faq__question-text')
      .filter({
        hasText:
          lang === 'ru'
            ? 'Сколько стоит участие?'
            : 'Was kostet die Teilnahme?',
      })
      .click();
    const answer = page
      .locator('.faq__question-text')
      .filter({
        hasText:
          lang === 'ru'
            ? 'Сколько стоит участие?'
            : 'Was kostet die Teilnahme?',
      })
      .locator('..')
      .locator('..');
    await expect(answer).toContainText('29 €');
    await expect(answer).toContainText('99 €');
    await expect(answer).toContainText('249 €');

    await page.goto(events);
    for (const [ticket, price] of [
      ['meetup', '29 €'],
      ['guest', '99 €'],
      ['host', '249 €'],
    ] as const) {
      await page.locator(`[data-ticket="${ticket}"]`).click();
      await expect(page.locator('#ticket-summary')).toContainText(price);
      await page.locator('#ticket-close').click();
    }
    await page.goto(
      lang === 'ru' ? '/ru/usloviya-uchastiya/' : '/de/teilnahmebedingungen/',
    );
    for (const price of ['29 €', '99 €', '249 €'])
      await expect(page.locator('main')).toContainText(price);
  }
});

test('requested FAQ order and purchase hover colors', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/ru/');
  await expect(page.locator('.faq__question-text')).toHaveText([
    'Кто обычно приходит на встречи?',
    'Сколько стоит участие?',
    'На каком языке мы общаемся?',
    'Есть ли возрастные ограничения?',
    'Где проходит мероприятие?',
    'Как проходит первая встреча?',
    'Лучше приходить одному или с другом?',
    'Можно ли предложить свою тему или формат?',
  ]);
  await page.locator('.site-header__desktop-actions .site-header__cta').hover();
  await expect(
    page.locator('.site-header__desktop-actions .site-header__cta'),
  ).toHaveCSS('color', 'rgb(240, 207, 99)');
  const heroMargins = await page.evaluate(() => {
    const header = document
      .querySelector('.site-header__bar')!
      .getBoundingClientRect();
    const content = document
      .querySelector('.hero__content')!
      .getBoundingClientRect();
    const video = document
      .querySelector('.hero__video')!
      .getBoundingClientRect();
    return [content.left - header.left, header.right - video.right];
  });
  expect(Math.abs(heroMargins[0] - heroMargins[1])).toBeLessThan(2);
  await page.goto('/ru/meropriyatiya/');
  await page.locator('a[href="#regensburg"]').hover();
  await expect(page.locator('a[href="#regensburg"]')).toHaveCSS(
    'background-color',
    'rgb(33, 76, 63)',
  );
  await page.locator('[data-ticket="meetup"]').hover();
  await expect(page.locator('[data-ticket="meetup"]')).toHaveCSS(
    'color',
    'rgb(240, 207, 99)',
  );
  await page.locator('[data-ticket="guest"]').hover();
  await expect(page.locator('[data-ticket="guest"]')).toHaveCSS(
    'background-color',
    'rgb(33, 76, 63)',
  );
  await expect(page.locator('[data-ticket="guest"]')).toHaveCSS(
    'color',
    'rgb(240, 207, 99)',
  );
  await page.goto('/de/');
  await expect(page.locator('.faq__question-text').first()).toHaveText(
    'Wer kommt zu den Treffen?',
  );
  await expect(page.locator('.faq__question-text')).toHaveCount(8);
});
