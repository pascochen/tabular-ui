import type { Config } from '@react-router/dev/config';

export default {
  // `src`, not React Router's default `app`: the design-system lint gate
  // covers `apps/*/src/**`, and route modules outside it would skip every
  // rule without an error (docs/site.md §8).
  appDirectory: 'src',
  // Static site: every route is prerendered to HTML at build time, so content
  // is there before JavaScript loads (docs/site.md §3).
  ssr: false,
  prerender: true,
} satisfies Config;
