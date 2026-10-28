/**
 * Every route the tests visit (docs/site.md §11). A route is added here when
 * it's built; quality.spec.ts checks the sitemap against this list.
 */
export const componentPages = [
  'chat-starter',
  'chat-composer',
  'agent-reasoning',
  'agent-plan',
  'lineage-tree',
  'attachment-row',
  'inline-citation',
  'sources',
  'confirmation',
  'agent-block',
  'chat-thread',
  'run-log-row',
  'status-badge',
].map((name) => `/components/${name}`);

export const routes = [
  '/',
  '/principles',
  ...componentPages,
  '/vocabulary',
  '/foundations/color',
  '/foundations/typography',
  '/foundations/density',
  '/getting-started',
  '/404',
];
