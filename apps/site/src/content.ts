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
/** The first built component in run order: where Components opens the run. */
const firstBuilt = entries.find((entry) => registry.items.some((item) => item.name === entry.name));
if (!firstBuilt) throw new Error('No component in the run is in registry.json');

/** Home's component grid, the overview: the hero's "Browse components" and Principles' onward link. */
export const componentGrid = '/#components';

export const pages = {
  // Components opens the run at its first component, and previous and next walk
  // it (owner, 2026-10-27); /components redirects there too (vercel.json). Until
  // then it went to Home's grid, so it read as a link to the page you were on.
  // `current` is the path under which the nav marks it as the page you're on.
  components: { href: componentPage(firstBuilt.name), label: 'Components', live: true, current: '/components' },
  // "Get started" in the nav and the footer (owner, 2026-10-27); the page's own title stays "Getting started".
  gettingStarted: { href: '/getting-started', label: 'Get started', live: true },
  principles: { href: '/principles', label: 'Principles', live: true },
  vocabulary: { href: '/vocabulary', label: 'Vocabulary', live: true },
  foundations: { href: '/foundations/color', label: 'Foundations', live: true, current: '/foundations' },
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
  // Not ready yet (owner, 2026-10-26): every demo action shows "Demo (soon)",
  // disabled, until this is true.
  demo: { href: 'https://demo.tabularui.com', label: 'Demo', ready: false as boolean },
  github: { href: 'https://github.com/pascochen/tabular-ui', label: 'GitHub' },
  license: { href: 'https://github.com/pascochen/tabular-ui/blob/main/LICENSE', label: 'MIT license' },
  // The footer's closing line names the author (owner, 2026-10-27).
  author: { href: 'https://www.linkedin.com/in/pascal-chenier/', label: 'Pascal' },
} as const;

/** The demo's label while it isn't ready (owner, 2026-10-26). */
export const demoSoonLabel = `${external.demo.label} (soon)`;

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
    // Each line says what the moment holds, not what its title already says (owner, 2026-10-27).
    { id: 'asking', title: 'Asking', line: 'Suggestions to start from, and the box you type in.' },
    { id: 'thinking', title: 'Thinking', line: 'The agent’s reasoning and plan, shown while it works.' },
    { id: 'showing', title: 'Showing', line: 'The figures, files and sources behind an answer.' },
    { id: 'waiting', title: 'Waiting', line: 'Where the run stops until a person answers or approves.' },
    { id: 'recording', title: 'Recording', line: 'What the run leaves on record, and its state.' },
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
