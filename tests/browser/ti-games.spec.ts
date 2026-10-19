import { test, expect } from '@playwright/test';

const pages = [
  {
    lang: 'ru',
    path: '/ru/meropriyatiya/transformatsionnye-igry/',
    host: '/ru/vedushchie-igr/',
    title: 'День',
    program: 'Программа',
    practitioners: 'С кем можно сыграть',
    tickets: 'Что входит в участие',
    buy: 'Купить билет участника',
    basic: 'Базовый импульс',
    peak: 'Пик трансформации',
    firstName: 'Кристина Бауэр',
    secondName: 'Катарина Базаль',
  },
  {
    lang: 'de',
    path: '/de/veranstaltungen/transformationsspiele/',
    host: '/de/spiele-leiten/',
    title: 'Tag der',
    program: 'Programm',
    practitioners: 'Mit wem du spielen kannst',
    tickets: 'Was in der Teilnahme enthalten ist',
    buy: 'Ticket für Teilnehmende kaufen',
    basic: 'Basisimpuls',
    peak: 'Gipfel der Transformation',
    firstName: 'Kristina Bauer',
    secondName: 'Katharina Basal',
  },
] as const;

test('TI page renders all mockup sections without horizontal overflow', async ({
  page,
}) => {
  for (const item of pages) {
    for (const width of [390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(item.path);
      await expect(page.locator('h1')).toContainText(item.title);
      await expect(page.locator('#ti-ticket-card')).toBeVisible();
      await expect(page.locator('#ti-about-title')).toBeVisible();
      await expect(page.locator('#ti-program')).toContainText('09:30–10:00');
      await expect(page.locator('#ti-practitioners-title')).toContainText(
        item.practitioners,
      );
      await expect(page.locator('[data-practitioner]')).toHaveCount(5);
      await expect(page.locator('#ti-tickets-title')).toContainText(
        item.tickets,
      );
      await expect(page.locator('#ti-ticket-card')).toContainText('80 €');
      await expect(page.locator('#ti-ticket-card')).toContainText('180 €');
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
  }
});

test('practitioner photos load on phone and desktop', async ({ page }) => {
  for (const item of pages) {
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(item.path);
      const images = page.locator('[data-practitioner] img');
      await expect(images).toHaveCount(5);
      for (const image of await images.all()) {
        await image.scrollIntoViewIfNeeded();
        await expect
          .poll(() =>
            image.evaluate(
              (element: HTMLImageElement) =>
                element.complete && element.naturalWidth > 0,
            ),
          )
          .toBe(true);
      }
    }
  }
});

test('TI ticket selection opens the shared purchase dialog with the right price', async ({
  page,
}) => {
  for (const item of pages) {
    await page.goto(item.path);
    await expect(
      page.locator('input[name="games-ticket"][value="guest_peak"]'),
    ).toBeChecked();
    await page.locator('[data-ticket="guest"]').click();
    await expect(page.locator('#ticket-dialog')).toBeVisible();
    await expect(page.locator('#ticket-summary')).toContainText('180 €');
    await page.locator('#ticket-close').click();
    await page
      .locator('input[name="games-ticket"][value="guest"]')
      .check({ force: true });
    await page.locator('[data-ticket="guest"]').click();
    await expect(page.locator('#ticket-summary')).toContainText('80 €');
    await page.locator('#ticket-close').click();
  }
});

test('practitioner cards open an accessible overlay and switch between people', async ({
  page,
}) => {
  for (const item of pages) {
    await page.goto(item.path);
    const first = page.locator('[data-practitioner="0"]');
    await first.click();
    await expect(page.locator('#practitioner-dialog')).toBeVisible();
    await expect(page.locator('#practitioner-name')).toHaveText(item.firstName);
    await expect(page.locator('#practitioner-qualification')).not.toBeEmpty();
    await expect(page.locator('#practitioner-fit li')).not.toHaveCount(0);
    await expect(page.locator('#practitioner-note')).not.toBeEmpty();
    await page.locator('#practitioner-nav button').first().click();
    await expect(page.locator('#practitioner-name')).toHaveText(item.secondName);
    await page.keyboard.press('Escape');
    await expect(page.locator('#practitioner-dialog')).not.toBeVisible();
    await expect(first).toBeFocused();
  }
});

test('mobile sticky ticket bar opens the tariff sheet and continues to purchase', async ({
  page,
}) => {
  for (const item of pages) {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(item.path);
    await expect(page.locator('#ti-sticky-buy')).toBeHidden();
    await page.locator('#ti-program').scrollIntoViewIfNeeded();
    await expect(page.locator('#ti-sticky-buy')).toBeVisible();
    await page.locator('#ti-sticky-buy').click();
    await expect(page.locator('#ti-ticket-sheet')).toBeVisible();
    await page
      .locator('input[name="ti-mobile-ticket"][value="guest"]')
      .check({ force: true });
    await page.locator('#ti-sheet-continue').click();
    await expect(page.locator('#ticket-dialog')).toBeVisible();
    await expect(page.locator('#ticket-summary')).toContainText('80 €');
    await page.locator('#ticket-close').click();
  }
});

test('desktop ticket card stays visible while the programme scrolls', async ({
  page,
}) => {
  for (const item of pages) {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(item.path);
    await page.locator('#ti-program').scrollIntoViewIfNeeded();
    const box = await page.locator('#ti-ticket-card').boundingBox();
    expect(box).not.toBeNull();
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.y).toBeLessThan(200);
  }
});

test('mobile sticky ticket bar hides near the footer', async ({ page }) => {
  for (const item of pages) {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(item.path);
    await page.locator('#ti-program').scrollIntoViewIfNeeded();
    await expect(page.locator('#ti-sticky-buy')).toBeVisible();
    await page.locator('.site-footer').scrollIntoViewIfNeeded();
    await expect(page.locator('#ti-sticky-buy')).toBeHidden();
  }
});

test('TI ticket card keeps the host link', async ({ page }) => {
  for (const item of pages) {
    await page.goto(item.path);
    await expect(
      page.locator(`#ti-ticket-card a[href="${item.host}"]`),
    ).toBeVisible();
  }
});
