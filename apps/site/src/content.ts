import registry from '../../../packages/ui/registry.json';

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
  components: { href: '/components', label: 'Components', live: false },
  vocabulary: { href: '/vocabulary', label: 'Vocabulary', live: false },
  foundations: { href: '/foundations/color', label: 'Foundations', live: false },
  principles: { href: '/principles', label: 'Principles', live: false },
  gettingStarted: { href: '/getting-started', label: 'Getting started', live: false },
  color: { href: '/foundations/color', label: 'Color', live: false },
  typography: { href: '/foundations/typography', label: 'Typography', live: false },
  density: { href: '/foundations/density', label: 'Density', live: false },
} as const;

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

export type MomentId = 'asking' | 'thinking' | 'showing' | 'waiting' | 'recording';

type ComponentEntry = {
  /** The registry item name when built; the planned name when not. */
  name: string;
  title: string;
  moment: MomentId;
  /** The one decision the component exists to make (wireframe `78:191`). */
  decision: string;
};

/** The 15 agent components, in run order (docs/site.md §1). */
const entries: ComponentEntry[] = [
  {
    name: 'chat-starter',
    title: 'Chat starter',
    moment: 'asking',
    decision: 'A suggestion fills the box and never sends, so you can add the period first.',
  },
  {
    name: 'chat-composer',
    title: 'Chat composer',
    moment: 'asking',
    decision: 'Nothing sends while a file is still uploading, and you can stop any answer.',
  },
  {
    name: 'agent-reasoning',
    title: 'Agent reasoning',
    moment: 'thinking',
    decision: 'Thinking stays folded until you open it, so nothing jumps while you read.',
  },
  {
    name: 'agent-plan',
    title: 'Agent plan',
    moment: 'thinking',
    decision: 'The agent writes its plan where you can see it, before and while it works.',
  },
  {
    name: 'tool',
    title: 'Tool',
    moment: 'thinking',
    decision: 'An action says it’s done only after it ran. A failure says what to do next.',
  },
  {
    name: 'lineage-tree',
    title: 'Lineage tree',
    moment: 'showing',
    decision: 'Every number opens down to the entry behind it.',
  },
  {
    name: 'attachment-row',
    title: 'Attachment row',
    moment: 'showing',
    decision: 'The file name is the link, so you can still select and copy it.',
  },
  {
    name: 'inline-citation',
    title: 'Inline citation',
    moment: 'showing',
    decision: 'Each figure names what it rests on, in the line where it appears.',
  },
  {
    name: 'sources',
    title: 'Sources',
    moment: 'showing',
    decision: 'Lists what the answer rests on, and what wasn’t checked.',
  },
  {
    name: 'question',
    title: 'Question',
    moment: 'waiting',
    decision: 'One question, with options you can answer in a word.',
  },
  {
    name: 'confirmation',
    title: 'Confirmation',
    moment: 'waiting',
    decision: 'Before an action runs, you see exactly what it changes and who it reaches.',
  },
  {
    name: 'agent-block',
    title: 'Agent block',
    moment: 'waiting',
    decision: 'An agent stops before anything that posts to the ledger.',
  },
  {
    name: 'chat-thread',
    title: 'Chat thread',
    moment: 'waiting',
    decision: 'The answer’s space appears when you ask, so it grows in place.',
  },
  {
    name: 'run-log-row',
    title: 'Run log row',
    moment: 'recording',
    decision: 'A failed run opens its error in place, so you keep your spot.',
  },
  {
    name: 'status-badge',
    title: 'Status badge',
    // Draft: reworded for D1. The wireframe's line quoted an authorship label.
    moment: 'recording',
    decision: 'Status copy names the state, never the agent.',
  },
];

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
