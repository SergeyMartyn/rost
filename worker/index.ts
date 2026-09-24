import { routes, type Language } from '../src/lib/site';
export function chooseLanguage(header: string, fallback: Language): Language {
  const ranges = header.split(',').map((part, index) => {
    const [tag, ...params] = part.trim().toLowerCase().split(';');
    const qParam = params.find((p) => p.trim().startsWith('q='));
    const q = qParam ? Number(qParam.trim().slice(2)) : 1;
    return { tag, q: Number.isFinite(q) && q >= 0 && q <= 1 ? q : 0, index };
  });
  const scores = (['de', 'ru'] as Language[]).map((lang) => {
    const matches = ranges.filter(
      (r) => r.tag === lang || r.tag.startsWith(lang + '-'),
    );
    const best = matches.length
      ? matches.sort((a, b) => b.q - a.q || a.index - b.index)[0]
      : ranges.find((r) => r.tag === '*');
    return { lang, q: best?.q ?? 0, index: best?.index ?? 999 };
  });
  scores.sort(
    (a, b) => b.q - a.q || a.index - b.index || (a.lang === fallback ? -1 : 1),
  );
  return scores[0].q > 0 ? scores[0].lang : fallback;
}
type WorkerEnv = {
  ASSETS: Pick<Env['ASSETS'], 'fetch'>;
  DEFAULT_LANGUAGE: Language;
};
export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname !== '/') return env.ASSETS.fetch(request);
    if (request.method !== 'GET' && request.method !== 'HEAD')
      return new Response('Method not allowed', {
        status: 405,
        headers: { Allow: 'GET, HEAD' },
      });
    const cookie = request.headers
      .get('Cookie')
      ?.match(/(?:^|;\s*)site_language=(de|ru)(?:;|$)/)?.[1] as
      Language | undefined;
    const lang =
      cookie ||
      chooseLanguage(
        request.headers.get('Accept-Language') || '',
        env.DEFAULT_LANGUAGE,
      );
    url.pathname = routes.home[lang];
    return new Response(null, {
      status: 302,
      headers: {
        Location: url.toString(),
        'Cache-Control': 'private, no-store',
        Vary: 'Accept-Language, Cookie',
      },
    });
  },
};
