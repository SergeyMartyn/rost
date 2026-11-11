import { test, expect } from '@playwright/test';

const pages = [
  {
    lang: 'ru',
    path: '/ru/arkhiv-meropriyatiy/transformatsionnye-igry-myunhen/',
    host: '/ru/vedushchie-igr/',
    title: 'День',
    program: 'Программа',
    practitioners: 'Ведущие игр',
    tickets: 'Что входит в участие',
    buy: 'Купить билет участника',
    basic: 'Базовый импульс',
    peak: 'Пик трансформации',
    firstName: 'Кристина Бауэр',
    secondName: 'Катарина Базаль',
  },
  {
    lang: 'de',
    path: '/de/veranstaltungsarchiv/transformationsspiele-muenchen/',
    host: '/de/spiele-leiten/',
    title: 'Tag der',
    program: 'Programm',
    practitioners: 'Spielleitende',
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
      await expect(page.locator('#ti-about-title')).toBeVisible();
      const features = page.locator('.ti-about h3');
      await expect(features).toHaveCount(3);
      for (const feature of await features.all())
        await expect(feature).toBeVisible();
      await expect(page.locator('.ti-about')).toContainText(
        item.lang === 'ru' ? 'Общение' : 'Austausch',
      );
      await expect(
        page.getByRole('button', { name: /Елена Гельмель|Elena Gelmel/ }),
      ).toHaveCount(0);
      await expect(page.locator('#ti-program')).toContainText('09:30–10:00');
      await expect(page.locator('#ti-practitioners-title')).toContainText(
        item.practitioners,
      );
      await expect(page.locator('[data-practitioner]')).toHaveCount(4);
      if (item.lang === 'ru' && (width === 390 || width === 1440))
        await page.screenshot({
          path: `test-results/ti-games-ru-${width}.png`,
        });
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
      await expect(images).toHaveCount(4);
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
    await expect(page.locator('#practitioner-facts li')).not.toHaveCount(0);
    await expect(page.locator('#practitioner-fit li')).not.toHaveCount(0);
    await expect(page.locator('#practitioner-results li')).not.toHaveCount(0);
    await expect(page.locator('#practitioner-note')).not.toBeEmpty();
    if (item.lang === 'ru')
      await page
        .locator('#practitioner-dialog')
        .screenshot({ path: 'test-results/practitioner-dialog-ru.png' });
    await page.locator('#practitioner-nav button').first().click();
    await expect(page.locator('#practitioner-name')).toHaveText(
      item.secondName,
    );
    await expect(page.locator('#practitioner-facts li')).not.toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(page.locator('#practitioner-dialog')).not.toBeVisible();
    await expect(first).toBeFocused();
  }
});

test('long practitioner details remain scrollable on a phone', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 760 });
  await page.goto('/ru/arkhiv-meropriyatiy/transformatsionnye-igry-myunhen/');
  await page.locator('[data-practitioner="3"]').click();
  await expect(page.locator('#practitioner-name')).toHaveText(
    'Алла Афанасенко',
  );
  await expect(page.locator('#practitioner-other-name')).toHaveText(
    'Дивергент',
  );
  await expect(page.locator('#practitioner-other-fit li')).toHaveCount(3);
  await page.locator('#practitioner-other-results').scrollIntoViewIfNeeded();
  await expect(page.locator('#practitioner-other-results')).toBeInViewport();
  await page.locator('#practitioner-close').click();
  await expect(page.locator('#practitioner-dialog')).not.toBeVisible();
});
