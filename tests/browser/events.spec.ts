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
