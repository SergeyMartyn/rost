import { cpSync, mkdirSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, resolve } from 'node:path';
const target = resolve(
  '.copy-check',
  new Date().toISOString().replaceAll(':', '-'),
);
mkdirSync(target, { recursive: true });
const files = [
  'src',
  'public',
  'worker',
  'scripts',
  'tests',
  'site.config.json',
  'astro.config.mjs',
  'tsconfig.json',
  'playwright.config.ts',
  'package.json',
  'package-lock.json',
  '.gitignore',
  '.prettierrc.json',
  '.prettierignore',
  'README.md',
  'worker-configuration.d.ts',
];
for (const file of files) cpSync(file, join(target, file), { recursive: true });
for (const name of [
  '.env',
  '.dev.vars',
  '.git',
  'node_modules',
  'dist',
  '.wrangler',
])
  if (existsSync(join(target, name)))
    throw Error('Unexpected copied file: ' + name);
function npm(args) {
  const result = spawnSync(
    process.platform === 'win32' ? 'npm.cmd' : 'npm',
    args,
    {
      cwd: target,
      shell: process.platform === 'win32',
      stdio: 'inherit',
      env: {
        ...process.env,
        ASTRO_TELEMETRY_DISABLED: '1',
        WRANGLER_SEND_METRICS: 'false',
      },
    },
  );
  if (result.status !== 0)
    throw Error('Copy verification failed: ' + args.join(' '));
}
npm(['ci', '--prefer-offline']);
npm(['run', 'check']);
npm(['run', 'build']);
npm(['test']);
for (const path of [
  '/de/',
  '/ru/',
  '/de/impressum/',
  '/ru/pravovaya-informatsiya/',
])
  if (!existsSync(join(target, 'dist', path, 'index.html')))
    throw Error('Missing copied output ' + path);
console.log('Clean-copy verification passed: ' + target);
