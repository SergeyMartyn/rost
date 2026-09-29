import { test, expect } from '@playwright/test';

test('team section keeps the requested order and responsive layout', async ({
  page,
}) => {
  const cases = [
    {
      path: '/ru/o-nas/',
      names: [
        'Кристина Бауэр',
        'Тимур Черепанов',
        'Максим Бурлаков',
        'Маргарита Мартын',
        'Сергей Мартын',
      ],
      roles: [
        'Вдохновительница, ведущая',
        'Ведущий встреч, фотограф',
        'Организует наши выходные',
        'Менеджер проектов',
        'Сайт, маркетинг, реклама',
      ],
    },
    {
      path: '/de/ueber-uns/',
      names: [
        'Kristina Bauer',
        'Timur Cherepanov',
        'Maksim Burlakov',
        'Margarita Martyn',
        'Sergey Martyn',
      ],
      roles: [
        'Ideengeberin, Gastgeberin',
        'Gastgeber, Fotograf',
        'Plant unsere gemeinsamen Wochenenden',
        'Projektmanagerin',
        'Website, Marketing, Werbung',
      ],
    },
  ];

  for (const { path, names, roles } of cases) {
    for (const width of [320, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(path);
      await expect(page.locator('.team__name')).toHaveText(names);
      await expect(page.locator('.team__role')).toHaveText(roles);
      await expect(page.locator('.team__portrait')).toHaveCount(5);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${path} at ${width}px`,
      ).toBe(true);
      if (width === 390) {
        const people = page.locator('.team__people');
        await expect(
          page.locator('[data-team-direction="previous"]'),
        ).toBeDisabled();
        await page.screenshot({
          path: `test-results/team-${path.startsWith('/ru') ? 'ru' : 'de'}-mobile.png`,
          fullPage: true,
        });
        await page.locator('[data-team-direction="next"]').click();
        await expect
          .poll(() => people.evaluate((element) => element.scrollLeft))
          .toBeGreaterThan(0);
      }
      if (width === 768) {
        await page.screenshot({
          path: `test-results/team-${path.startsWith('/ru') ? 'ru' : 'de'}-tablet.png`,
          fullPage: true,
        });
      }
      if (width === 1440) {
        await expect(page.locator('.team__controls')).toBeHidden();
        await page.screenshot({
          path: `test-results/team-${path.startsWith('/ru') ? 'ru' : 'de'}-desktop.png`,
          fullPage: true,
        });
      }
    }
  }
});
