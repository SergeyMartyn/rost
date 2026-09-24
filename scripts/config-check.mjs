import { readFileSync } from 'node:fs';

export function validate(site) {
  const errors = [];
  if (typeof site.workerName !== 'string' || !/^[a-z0-9][a-z0-9-]{0,62}$/.test(site.workerName)) errors.push('workerName');
  if (!['de', 'ru'].includes(site.defaultLanguage)) errors.push('defaultLanguage');
  // Empty domain uses the existing local fallback. Only validate a supplied URL.
  if (site.domain) {
    try {
      const url = new URL(site.domain);
      if (!['http:', 'https:'].includes(url.protocol) || url.pathname !== '/' || url.search || url.hash || url.username || url.password || site.domain.endsWith('/')) errors.push('domain');
    } catch { errors.push('domain'); }
  }
  return errors;
}

if (process.argv[1]?.endsWith('config-check.mjs')) {
  const errors = validate(JSON.parse(readFileSync('site.config.json', 'utf8')));
  if (errors.length) {
    console.error('Invalid configuration: ' + errors.join(', '));
    process.exitCode = 1;
  }
}
