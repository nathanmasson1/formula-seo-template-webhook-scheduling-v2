import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = dirname(fileURLToPath(import.meta.url));
const configuredSite = (() => {
  try {
    const raw = readFileSync(resolve(projectRoot, 'src/data/siteConfig.json'), 'utf-8');
    const siteConfig = JSON.parse(raw);
    return (siteConfig.url || 'https://formulaseo.com.br').replace(/\/+$/, '');
  } catch {
    return 'https://formulaseo.com.br';
  }
})();

export default defineConfig({
  site: configuredSite,
  output: 'static',
  adapter: vercel(),
  integrations: [
    react(),
    tailwind({ applyBaseStyles: false }),
  ],
  markdown: {
    shikiConfig: {
      theme: 'dracula',
    },
  },
  vite: {
    optimizeDeps: {
      include: ['marked', 'lucide-react'],
      exclude: ['react/jsx-dev-runtime'],
    },
  },
});
