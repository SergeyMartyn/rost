import { readFileSync, writeFileSync } from 'node:fs';
const site = JSON.parse(readFileSync('site.config.json', 'utf8'));
if (!['de', 'ru'].includes(site.defaultLanguage))
  throw Error('defaultLanguage must be de or ru');
writeFileSync(
  'wrangler.generated.json',
  JSON.stringify(
    {
      $schema: './node_modules/wrangler/config-schema.json',
      name: site.workerName,
      main: 'worker/index.ts',
      compatibility_date: '2026-09-24',
      assets: {
        directory: './dist',
        binding: 'ASSETS',
        run_worker_first: ['/'],
        not_found_handling: '404-page',
        html_handling: 'force-trailing-slash',
      },
      vars: { DEFAULT_LANGUAGE: site.defaultLanguage },
    },
    null,
    2,
  ),
);
