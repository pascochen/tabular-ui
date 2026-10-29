import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import type { Config } from '@react-router/dev/config';

import { entries } from './src/component-list';
import { deferHydration, hydrates } from './src/lib/defer-hydration';

// A component has a page when the registry has the item (docs/site.md §3).
const registry = JSON.parse(readFileSync(new URL('../../packages/ui/registry.json', import.meta.url), 'utf8')) as {
  items: { name: string }[];
};
const built = new Set(registry.items.map((item) => item.name));

export default {
  // `src`, not React Router's default `app`: the design-system lint gate
  // covers `apps/*/src/**`, and route modules outside it would skip every
  // rule without an error (docs/site.md §8).
  appDirectory: 'src',
  // Static site: every route is prerendered to HTML at build time, so content
  // is there before JavaScript loads (docs/site.md §3).
  ssr: false,
  // The static routes, one page per built component, and /404, which the build
  // copies to 404.html for Vercel to serve on any path it can't find.
  async prerender({ getStaticPaths }) {
    return [
      ...getStaticPaths(),
      ...entries.filter((e) => built.has(e.name)).map((e) => `/components/${e.name}`),
      '/404',
    ];
  },
  // Every prerendered page starts hydrating after it has painted
  // (src/lib/defer-hydration.ts, docs/site.md §12). Runs once prerendering has
  // written the pages; the build's own copy to 404.html comes after it.
  buildEnd({ reactRouterConfig }) {
    const client = join(reactRouterConfig.buildDirectory, 'client');
    const pages = readdirSync(client, { recursive: true, encoding: 'utf8' }).filter((file) => file.endsWith('.html'));
    let deferred = 0;
    for (const page of pages) {
      const path = join(client, page);
      const html = readFileSync(path, 'utf8');
      if (!hydrates(html)) continue;
      writeFileSync(path, deferHydration(html));
      deferred++;
    }
    if (deferred === 0) throw new Error(`No prerendered page to defer hydration on in ${client}`);
    console.log(`Hydration deferred until after paint on ${deferred} pages`);
  },
} satisfies Config;
