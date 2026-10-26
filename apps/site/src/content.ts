import registry from '../../../packages/ui/registry.json';

import { entries, type MomentId } from './component-list';

export type { MomentId };
export { storybookDocs } from './component-list';

/**
 * Everything the owner writes for the site, in one place (docs/site.md §5).
 * Copy marked "draft" is waiting for the owner's review.
 */

// ---------------------------------------------------------------------------
// Pages
// ---------------------------------------------------------------------------

/**
 * The site's pages, in nav order, and whether each is built yet. A link to a
 * page that isn't live is left out, so the site never links to a 404 while it
 * is built page by page (docs/site.md §13).
 */
export const pages = {
  // The component grid is on Home since 2026-10-26 (owner); /components redirects
  // there (vercel.json). `current` is the path under which the nav marks it as
  // the page you're on: the component pages.
  components: { href: '/#components', label: 'Components', live: true, current: '/components' },
  principles: { href: '/principles', label: 'Principles', live: true },
  vocabulary: { href: '/vocabulary', label: 'Vocabulary', live: true },
  foundations: { href: '/foundations/color', label: 'Foundations', live: true, current: '/foundations' },
  gettingStarted: { href: '/getting-started', label: 'Getting started', live: true },
  color: { href: '/foundations/color', label: 'Color', live: true },
  typography: { href: '/foundations/typography', label: 'Typography', live: true },
  density: { href: '/foundations/density', label: 'Density', live: true },
} as const;

/** A built component's own page (docs/site.md §3). */
export function componentPage(name: string): string {
  return `/components/${name}`;
}

export const external = {
  storybook: { href: 'https://storybook.tabularui.com', label: 'Storybook' },
  demo: { href: 'https://demo.tabularui.com', label: 'Demo' },
  github: { href: 'https://github.com/pascochen/tabular-ui', label: 'GitHub' },
  changelog: {
    href: 'https://github.com/pascochen/tabular-ui/blob/main/packages/ui/CHANGELOG.md',
    label: 'Changelog',
  },
  license: { href: 'https://github.com/pascochen/tabular-ui/blob/main/LICENSE', label: 'MIT license' },
  byline: { href: 'https://pascalchenier.com', label: 'By Pascal Chenier' },
} as const;

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

const registryNames = new Set(registry.items.map((item) => item.name));

/**
 * Built means the shadcn registry has the item (docs/site.md §5), so the site
 * can't say a component ships when it doesn't.
 */
export const components = entries.map((entry) => ({ ...entry, built: registryNames.has(entry.name) }));
export type SiteComponent = (typeof components)[number];

export function component(name: string): SiteComponent {
  const found = components.find((c) => c.name === name);
  if (!found) throw new Error(`No component named ${name} in content.ts`);
  return found;
}

// ---------------------------------------------------------------------------
// Moments and principles
// ---------------------------------------------------------------------------

/** The life of one agent run (wireframe `76:151`). */
export const moments = (
  [
    { id: 'asking', title: 'Asking', line: 'A person asks.' },
    { id: 'thinking', title: 'Thinking', line: 'The agent works it out.' },
    { id: 'showing', title: 'Showing', line: 'The agent shows its evidence.' },
    { id: 'waiting', title: 'Waiting', line: 'The agent stops for a person.' },
    { id: 'recording', title: 'Recording', line: 'The run is written down.' },
  ] as const
).map((moment) => ({ ...moment, components: components.filter((c) => c.moment === moment.id) }));

/** The three principles (wireframe `77:230`). The Check lines are drafts. */
export const principles = [
  {
    title: 'An agent stops before anything that posts to the ledger.',
    why: 'A proposal costs nothing to change. A journal entry changes the books, so only a person posts one.',
    check: 'Nothing reaches the books until a person presses Post.',
    carriedBy: ['agent-block', 'confirmation', 'question'],
  },
  {
    title: 'Every number opens down to the entry behind it.',
    why: 'A figure nobody can trace is a figure nobody can sign.',
    check: 'Click any figure. It opens the entries it was built from.',
    carriedBy: ['lineage-tree', 'attachment-row', 'inline-citation', 'sources'],
  },
  {
    // Reworded for D1 (docs/site.md): a role tag may say who; the agent is never a subject.
    title: 'Status labels name the state.',
    why: 'A role tag may say who, as AI. The agent is never a sentence’s subject.',
    check: 'No status label has a subject.',
    carriedBy: ['status-badge', 'run-log-row', 'agent-block'],
  },
].map((principle) => ({ ...principle, carriedBy: principle.carriedBy.map(component) }));
