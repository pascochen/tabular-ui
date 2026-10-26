/**
 * The 15 agent components, in run order (docs/site.md §1), with no imports, so
 * react-router.config.ts can read it to list the component pages to prerender.
 * src/content.ts adds whether each is built.
 */
export type MomentId = 'asking' | 'thinking' | 'showing' | 'waiting' | 'recording';

export type ComponentEntry = {
  /** The registry item name when built; the planned name when not. */
  name: string;
  title: string;
  moment: MomentId;
  /** The one decision the component exists to make (wireframe `78:191`). */
  decision: string;
};

export const entries: ComponentEntry[] = [
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

/** A component's Docs page in Storybook: `Product/AgentBlock` is `product-agentblock--docs`. */
export function storybookDocs(name: string): string {
  return `https://storybook.tabularui.com/?path=/docs/product-${name.replace(/-/g, '')}--docs`;
}
