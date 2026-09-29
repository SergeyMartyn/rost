import { test, expect } from '@playwright/test';
import site from '../../site.config.json' with { type: 'json' };

const domain = site.domain || 'https://example.invalid';
const entries = Object.entries(site.routes).flatMap(([page, row]) =>
  Object.entries(row as Record<string, string>).map(([lang, path]) => ({
    page,
    lang,
    path,
  })),
);

test('structured data, canonical and social metadata on every page', async ({
  request,
}) => {
  for (const { lang, path } of entries) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
    const html = await response.text();

    expect(html.match(/rel="canonical"/g) ?? [], path).toHaveLength(1);
    for (const hreflang of ['de', 'ru', 'x-default'])
      expect(html, `${path} ${hreflang}`).toContain(`hreflang="${hreflang}"`);

    expect(html, path).toContain('property="og:site_name"');
    expect(html, path).toContain('property="og:image:width" content="1200"');
    expect(html, path).toContain('property="og:image:height" content="630"');
    expect(html, path).toContain('property="og:image:alt"');
    expect(html, path).toContain(
      'name="twitter:card" content="summary_large_image"',
    );
    expect(html, path).toContain('name="twitter:title"');

    const match = html.match(
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/,
    );
    expect(match, `${path} json-ld`).not.toBeNull();
    const data = JSON.parse(match![1]);
    const graph: Array<{ '@type': string } & Record<string, unknown>> =
      data['@graph'] ?? [];
    const types = graph.map((node) => node['@type']);
    expect(types, path).toContain('Organization');
    expect(types, path).toContain('WebSite');
    const organization = graph.find((node) => node['@type'] === 'Organization')!;
    expect(organization.url, path).toBe(domain);
    expect(organization.name, path).toBe(site.name);
    const website = graph.find((node) => node['@type'] === 'WebSite')!;
    expect(website.inLanguage, path).toBe(lang);
  }
});

test('critical fonts are preloaded', async ({ request }) => {
  const html = await (await request.get('/de/')).text();
  expect(html).toContain('rel="preload"');
  expect(html).toContain('/fonts/Marmelad-Regular.woff2');
  expect(html).toContain('/fonts/Onest-Regular.woff2');
});

test('llms.txt, robots.txt and sitemap are served', async ({ request }) => {
  const llms = await request.get('/llms.txt');
  expect(llms.status()).toBe(200);
  expect(await llms.text()).toContain('# R.O.S.T.');

  const robots = await request.get('/robots.txt');
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toContain('/sitemap.xml');

  const sitemap = await (await request.get('/sitemap.xml')).text();
  expect(sitemap).toContain('<urlset');
  expect(sitemap).toContain(`${domain}${site.routes.home.ru}`);
  expect(sitemap.match(/<loc>/g) ?? []).toHaveLength(entries.length);
  expect(sitemap).toContain('<lastmod>');
});

test('security and cache headers are applied; _headers is not served', async ({
  request,
}) => {
  const page = await request.get('/de/');
  expect(page.headers()['x-content-type-options']).toBe('nosniff');
  expect(page.headers()['referrer-policy']).toBe(
    'strict-origin-when-cross-origin',
  );
  expect(page.headers()['permissions-policy']).toContain('geolocation=()');

  const html = await page.text();
  const cssPath = html.match(/href="(\/_astro\/[^"]+\.css)"/)?.[1];
  expect(cssPath, 'hashed css link').toBeTruthy();
  const css = await request.get(cssPath!);
  expect(css.headers()['cache-control']).toContain('immutable');

  const font = await request.get('/fonts/Marmelad-Regular.woff2');
  expect(font.headers()['cache-control']).toContain('immutable');

  const forbidden = await request.get('/_headers');
  expect(forbidden.status()).toBe(404);
});
