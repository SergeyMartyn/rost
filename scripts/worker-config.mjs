import { readFileSync, writeFileSync } from 'node:fs';
const site = JSON.parse(readFileSync('site.config.json', 'utf8'));
if (!['de', 'ru'].includes(site.defaultLanguage))
  throw Error('defaultLanguage must be de or ru');

// D1 orders database. Builds default to test; deploy passes --live explicitly.
// IDs live in scripts/orders-db.json so the binding survives every build.
const liveDeploy = process.argv.includes('--live');
const ordersEnv = liveDeploy ? 'live' : process.env.ORDERS_ENV || 'test';
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
      triggers: { crons: ['* * * * *'] },
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
        // Test mode only accepts orders on *.workers.dev. The production deploy
        // explicitly selects the live database and enables live checkout.
        PAYMENTS_ENABLED:
          liveDeploy || ordersEnv === 'test'
            ? 'true'
            : process.env.PAYMENTS_ENABLED || 'false',
        PAYPAL_ENABLED: liveDeploy
          ? 'true'
          : process.env.PAYPAL_ENABLED || 'false',
        PAYPAL_MODE: ordersEnv === 'live' ? 'live' : 'sandbox',
        PAYPAL_PAYEE_EMAIL:
          process.env.PAYPAL_PAYEE_EMAIL || 'mail@margaritamartyn.com',
        HOST_REGISTRATION_OPEN:
          process.env.HOST_REGISTRATION_OPEN || 'true',
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
