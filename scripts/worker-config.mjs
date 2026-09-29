import { readFileSync, writeFileSync } from 'node:fs';
const site = JSON.parse(readFileSync('site.config.json', 'utf8'));
if (!['de', 'ru'].includes(site.defaultLanguage))
  throw Error('defaultLanguage must be de or ru');

// D1 orders database. ORDERS_ENV=test (default) or live.
// IDs live in scripts/orders-db.json so the binding survives every build.
const ordersEnv = process.env.ORDERS_ENV || 'test';
const dbs = JSON.parse(readFileSync('scripts/orders-db.json', 'utf8'));
const db = dbs[ordersEnv];
if (!db?.database_id || db.database_id.startsWith('TODO'))
  throw Error(`orders-db.json: no database_id for "${ordersEnv}"`);

writeFileSync(
  'wrangler.generated.json',
  JSON.stringify(
    {
      $schema: './node_modules/wrangler/config-schema.json',
      name: site.workerName,
      main: 'worker/index.ts',
      compatibility_date: '2026-09-24',
      routes: [{ pattern: 'rost.community/*', zone_name: 'rost.community' }],
      workers_dev: true,
      preview_urls: false,
      assets: {
        directory: './dist',
        binding: 'ASSETS',
        run_worker_first: ['/', '/api/*'],
        not_found_handling: '404-page',
        html_handling: 'force-trailing-slash',
      },
      vars: {
        DEFAULT_LANGUAGE: site.defaultLanguage,
        ORDERS_ENV: ordersEnv,
        // Test mode is safe to enable: the Worker only accepts test orders on *.workers.dev.
        // Live payments stay off until PAYMENTS_ENABLED=true is set explicitly for the deploy.
        PAYMENTS_ENABLED:
          ordersEnv === 'test' ? 'true' : process.env.PAYMENTS_ENABLED || 'false',
      },
      d1_databases: [
        {
          binding: 'ORDERS',
          database_name: db.database_name,
          database_id: db.database_id,
          migrations_dir: 'migrations',
        },
      ],
    },
    null,
    2,
  ),
);
