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
  /**
   * When to reach for it, and when not, with what to use instead: the first
   * thing its page shows (owner, approved 2026-10-27). Built components only.
   * `code` in backticks renders as code.
   */
  useWhen?: [string, string];
  avoidWhen?: [string, string];
};

export const entries: ComponentEntry[] = [
  {
    name: 'chat-starter',
    title: 'Chat starter',
    moment: 'asking',
    decision: 'A suggestion fills the box and never sends, so you can add the period first.',
    useWhen: [
      'The chat panel is empty and people need to know what they can ask.',
      'The right questions depend on the screen beside the panel: a run log asks about runs.',
    ],
    avoidWhen: [
      'The person has started typing. Hide it while there’s a draft, because a pick replaces the text.',
      'You want a greeting or a usage disclaimer. It has neither, on purpose.',
    ],
  },
  {
    name: 'chat-composer',
    title: 'Chat composer',
    moment: 'asking',
    decision: 'Nothing sends while a file is still uploading, and you can stop any answer.',
    useWhen: [
      'People write to the agent, with or without files attached.',
      'Answers stream, and people may need to stop one partway.',
    ],
    avoidWhen: [
      'The field searches or filters. Use Input.',
      'The form has several fields. Use Field with Input or Textarea.',
    ],
  },
  {
    name: 'agent-reasoning',
    title: 'Agent reasoning',
    moment: 'thinking',
    decision: 'Thinking stays folded until you open it, so nothing jumps while you read.',
    useWhen: [
      'The agent’s working-out is worth checking, but not worth reading every time.',
      'The answer takes a few seconds, and people should see the agent is thinking.',
    ],
    avoidWhen: [
      'It would stand on its own. It draws no rail or label: put it inside an Agent block.',
      'The steps are for someone to carry out. Use Agent plan.',
    ],
  },
  {
    name: 'agent-plan',
    title: 'Agent plan',
    moment: 'thinking',
    decision: 'The agent writes its plan where you can see it, before and while it works.',
    useWhen: [
      'The agent proposes steps before it acts, so a person can check or change them.',
      'A person will take the steps themselves, in order. Hide the buttons with `showActions={false}`.',
    ],
    avoidWhen: [
      'The plan is running and needs progress on each step. It has no per-step state.',
      'It’s the agent’s own working-out. Use Agent reasoning.',
    ],
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
    useWhen: [
      'A figure or model is built from others, and people need to trace it to its source.',
      'The nesting runs deep. Each level indents 12px, so six levels still fit a panel.',
    ],
    avoidWhen: [
      'The items are a flat list with columns to sort. Use Data table.',
      'The items are events over time, such as runs. Use Run log row.',
    ],
  },
  {
    name: 'attachment-row',
    title: 'Attachment row',
    moment: 'showing',
    decision: 'The file name is the link, so you can still select and copy it.',
    useWhen: [
      'A file needs its name, size and state on one 28px line: an upload, a source, evidence on a record.',
      'People copy file names. The name stays selectable text, and only the name is the link.',
    ],
    avoidWhen: [
      'A click anywhere in the row should open something. Use Data table with `onRowClick`.',
      'You need the place to drop or pick files. Use Empty state with a Button, as the UploadTarget story does.',
    ],
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
    useWhen: [
      'The agent wrote it: an answer, a proposal, a plan.',
      'The agent proposes a change to the books. Its label says the proposal awaits review until a person decides.',
    ],
    avoidWhen: [
      'You’re reaching for a generic card. The rail and label are how people tell the agent’s work from a person’s.',
      'It would sit inside another Agent block. Use one per agent turn, with Agent reasoning and Agent plan inside it.',
    ],
  },
  {
    name: 'chat-thread',
    title: 'Chat thread',
    moment: 'waiting',
    decision: 'The answer’s space appears when you ask, so it grows in place.',
    useWhen: [
      'It’s the conversation in the chat panel: questions, answers, and the agent at work.',
      'Answers stream. The answer’s space appears as soon as the question is sent, so the thread doesn’t jump.',
    ],
    avoidWhen: [
      'It would sit inside a scrolling panel body. It scrolls itself: put it between the panel’s header and footer.',
      'You need a record of what ran. Use Run log row.',
    ],
  },
  {
    name: 'run-log-row',
    title: 'Run log row',
    moment: 'recording',
    decision: 'A failed run opens its error in place, so you keep your spot.',
    useWhen: [
      'People scan a list of runs: status, name, time, duration.',
      'A failure needs its error. A failed row opens its error in place.',
    ],
    avoidWhen: [
      'People read rows across columns or sort them. Use Data table, at 28px.',
      'The row is a file. Use Attachment row.',
    ],
  },
  {
    name: 'status-badge',
    title: 'Status badge',
    // Draft: reworded for D1. The wireframe's line quoted an authorship label.
    moment: 'recording',
    decision: 'Status copy names the state, never the agent.',
    useWhen: [
      'Something has a state: a run, a check, a file. Queued, running, passed, failed and the rest.',
      'The same state shows on several screens, and must look the same on each.',
    ],
    avoidWhen: [
      'You’d pick a Badge’s colour by hand. The status sets the colour, icon and label.',
      'It sits in a run log with its icon hidden. The icon keeps states apart in grayscale.',
    ],
  },
];

/** A component's Docs page in Storybook: `Product/AgentBlock` is `product-agentblock--docs`. */
export function storybookDocs(name: string): string {
  return `https://storybook.tabularui.com/?path=/docs/product-${name.replace(/-/g, '')}--docs`;
}
