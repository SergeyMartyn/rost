import { routes, origin, languages, site, type Language } from '../lib/site';
const esc = (s: string) =>
  s.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
export function GET() {
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${Object.values(
      routes,
    )
      .flatMap((row) =>
        languages.map(
          (lang) =>
            `<url><loc>${esc(origin + row[lang])}</loc>${languages.map((l) => `<xhtml:link rel="alternate" hreflang="${l}" href="${esc(origin + row[l])}"/>`).join('')}<xhtml:link rel="alternate" hreflang="x-default" href="${esc(origin + row[site.defaultLanguage as Language])}"/></url>`,
        ),
      )
      .join('')}</urlset>`,
    { headers: { 'Content-Type': 'application/xml' } },
  );
}
