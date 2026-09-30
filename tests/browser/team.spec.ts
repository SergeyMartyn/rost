import { test, expect } from '@playwright/test';

test('team section keeps the requested order and responsive layout', async ({
  page,
}) => {
  const portraits = [
    'kristina',
    'timur-portrait',
    'maksim',
    'margo',
    'sergey',
  ].map((name) => `/images/team/${name}.webp`);
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
        await page
          .locator('.team__portrait img')
          .evaluateAll((images) =>
            images.every((image) => image.getAttribute('alt') === ''),
          ),
      ).toBe(true);
      expect(
        await page
          .locator('.team__portrait img')
          .evaluateAll((images) =>
            images.map((image) => image.getAttribute('src')),
          ),
      ).toEqual(portraits);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${path} at ${width}px`,
      ).toBe(true);
      const positions = await page
        .locator('.team__person')
        .evaluateAll((people) =>
          people.map((person) => {
            const rect = person.getBoundingClientRect();
            return {
              top: rect.top,
              bottom: rect.bottom,
              center: rect.left + rect.width / 2,
            };
          }),
        );
      if (width < 768) {
        for (let index = 1; index < positions.length; index++) {
          expect(positions[index].top).toBeGreaterThan(
            positions[index - 1].bottom,
          );
        }
      } else if (width < 1024) {
        expect(positions[0].top).toBe(positions[1].top);
        expect(positions[2].top).toBe(positions[3].top);
        expect(positions[2].top).toBeGreaterThan(positions[0].bottom);
        expect(positions[4].top).toBeGreaterThan(positions[2].bottom);
        expect(Math.abs(positions[4].center - width / 2)).toBeLessThan(2);
      } else {
        expect(
          positions.every((position) => position.top === positions[0].top),
        ).toBe(true);
      }
      if (width === 390) {
        await expect(page.locator('[data-team-direction]')).toHaveCount(0);
        await page.screenshot({
          path: `test-results/team-${path.startsWith('/ru') ? 'ru' : 'de'}-mobile.png`,
          fullPage: true,
        });
      }
      if (width === 768) {
        await page.screenshot({
          path: `test-results/team-${path.startsWith('/ru') ? 'ru' : 'de'}-tablet.png`,
          fullPage: true,
        });
      }
      if (width === 1440) {
        await page.locator('.team__people').scrollIntoViewIfNeeded();
        await expect
          .poll(() =>
            page
              .locator('.team__portrait img')
              .evaluateAll((images) =>
                images.every(
                  (image) =>
                    (image as HTMLImageElement).complete &&
                    (image as HTMLImageElement).naturalWidth > 0,
                ),
              ),
          )
          .toBe(true);
        await expect(page.locator('.team__controls')).toHaveCount(0);
        await page.screenshot({
          path: `test-results/team-${path.startsWith('/ru') ? 'ru' : 'de'}-desktop.png`,
          fullPage: true,
        });
      }
    }
  }
});
