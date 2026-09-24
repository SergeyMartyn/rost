import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import { readFileSync } from 'node:fs';
const site = JSON.parse(
  readFileSync(new URL('./site.config.json', import.meta.url)),
);
export default defineConfig({
  site: site.domain || 'https://example.invalid',
  output: 'static',
  trailingSlash: 'always',
  vite: { plugins: [tailwindcss()] },
});
