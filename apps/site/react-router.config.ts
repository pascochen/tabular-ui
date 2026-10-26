import { readFileSync } from 'node:fs';

import type { Config } from '@react-router/dev/config';

import { entries } from './src/component-list';

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
} satisfies Config;
