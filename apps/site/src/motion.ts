/**
 * Every motion that ships, for the Motion page's Timing section
 * (docs/explorations/motion-page-spec.md). There is no motion token: the
 * library and the site write each value in place. So each entry names the file
 * it's written in and the text that writes it, and tests/motion.spec.ts reads
 * each file and fails when the text is gone. A value changed in a component
 * fails that test until this list says the same.
 */

export type MotionPurpose = 'Feedback' | 'Continuity' | 'Work in progress';

export type MotionEntry = {
  name: string;
  /** Where it ships: a component, or the site. */
  where: string;
  /** Duration and curve, as written. */
  timing: string;
  purpose: MotionPurpose;
  /** What a visitor who asked for reduced motion gets instead. */
  reduced: string;
  /** The file, from the repository root, and the text in it that sets the value. */
  source: { file: string; text: string[] };
};

export const motions: MotionEntry[] = [
  {
    name: 'Copy is ticked',
    where: 'Site, copy command',
    timing: '140ms ease-out; back after 2s, 120ms',
    purpose: 'Feedback',
    reduced: 'The icons swap in place.',
    source: {
      file: 'apps/site/src/components/copy-command.tsx',
      text: ['site-tick_140ms_ease-out', 'site-fade-in_120ms_ease-out', '2000'],
    },
  },
  {
    name: 'Play and Replay take a wash',
    where: 'Site, every specimen',
    timing: 'In 140ms ease-out; out 200ms ease-in',
    purpose: 'Feedback',
    reduced: 'No wash: the run jumps to its end.',
    source: {
      file: 'apps/site/src/lib/styles.ts',
      text: ['site-wash-in_140ms_ease-out', 'site-wash-out_200ms_ease-in'],
    },
  },
  {
    name: 'A link’s word takes the ink',
    where: 'Site, standalone links',
    timing: '240ms ease-out',
    purpose: 'Feedback',
    reduced: 'The colour changes in place.',
    source: { file: 'apps/site/src/lib/styles.ts', text: ['duration-[240ms] motion-safe:ease-out'] },
  },
  {
    name: 'A menu row is highlighted',
    where: 'Menu, Select, Combobox',
    timing: '75ms',
    purpose: 'Feedback',
    reduced: 'The tone changes in place.',
    source: {
      file: 'packages/ui/src/components/foundational/popupSurface.ts',
      text: ['transition-colors duration-75 motion-reduce:transition-none'],
    },
  },
  {
    name: 'A switch’s thumb travels',
    where: 'Switch',
    timing: '150ms, Tailwind’s default curve',
    purpose: 'Feedback',
    reduced: 'The thumb arrives.',
    source: {
      file: 'packages/ui/src/components/foundational/Switch/variants.ts',
      text: ['transition-transform motion-reduce:transition-none'],
    },
  },
  {
    name: 'A caret turns',
    where: 'Agent reasoning, Tool, Lineage tree, Run log row',
    timing: '90°, 150ms',
    purpose: 'Feedback',
    reduced: 'The caret turns at once.',
    source: {
      file: 'packages/ui/src/components/product/AgentReasoning/index.tsx',
      text: ['transition-transform motion-reduce:transition-none'],
    },
  },
  {
    name: 'A run is ticked',
    where: 'Status badge, Run log row',
    timing: '140ms ease-out, when work seen running passes',
    purpose: 'Feedback',
    reduced: 'The mark swaps in place.',
    source: { file: 'packages/ui/src/lib/gestures.tsx', text: ['tui-tick_140ms_ease-out'] },
  },
  {
    name: 'Copied cells take a wash',
    where: 'Data table',
    timing: 'In 140ms, held 400ms, out 200ms, linear',
    purpose: 'Feedback',
    reduced: 'The tone shows for 600ms, still.',
    source: {
      file: 'packages/ui/src/lib/gestures.tsx',
      text: ['WASH_IN_MS = 140', 'WASH_HOLD_MS = 400', 'WASH_OUT_MS = 200', 'WASH_STILL_MS = 600'],
    },
  },
  {
    name: 'The total is ruled',
    where: 'Data table, totals row',
    timing: '200ms ease-out, when the rows come to sum',
    purpose: 'Feedback',
    reduced: 'The rule appears.',
    source: {
      file: 'packages/ui/src/components/product/DataTable/index.tsx',
      text: ['motion-safe:after:animate-[tui-unrule_200ms_ease-out_both]'],
    },
  },
  {
    name: 'A copied ID is ticked',
    where: 'Context switcher: Org and Project switchers',
    timing: '140ms ease-out; back after 1.5s, 120ms',
    purpose: 'Feedback',
    reduced: 'The icons swap in place.',
    source: {
      file: 'packages/ui/src/components/product/ContextSwitcher/index.tsx',
      text: ['COPIED_MS = 1500', 'tickIn', 'fadeBack'],
    },
  },
  {
    name: 'The page turns',
    where: 'Site, between pages',
    timing: 'Out 80ms linear; in 150ms ease-out',
    purpose: 'Continuity',
    reduced: 'A hard cut.',
    source: { file: 'apps/site/src/index.css', text: ['animation-duration: 80ms', 'animation-duration: 150ms'] },
  },
  {
    name: 'A popup fades',
    where: 'Menu, Select, Combobox, Popover, Dialog',
    timing: '100ms, in and out',
    purpose: 'Continuity',
    reduced: 'Still fades: opacity, not movement.',
    source: {
      file: 'packages/ui/src/components/foundational/popupSurface.ts',
      text: ['duration-100', 'data-open:fade-in-0', 'data-closed:fade-out-0'],
    },
  },
  {
    name: 'Scroll to latest',
    where: 'Message scroller',
    timing: '200ms fade and scale; a smooth scroll',
    purpose: 'Continuity',
    reduced: 'The button appears and the scroll jumps.',
    source: {
      file: 'packages/ui/src/components/foundational/MessageScroller/index.tsx',
      text: ['transition-[translate,scale,opacity] duration-200 motion-reduce:transition-none', "'smooth'"],
    },
  },
  {
    name: 'A progress bar fills',
    where: 'Progress bar',
    timing: '150ms',
    purpose: 'Continuity',
    reduced: 'The fill arrives.',
    source: {
      file: 'packages/ui/src/components/product/ProgressBar/index.tsx',
      text: ['motion-safe:transition-[width]'],
    },
  },
  {
    name: 'The square tracer',
    where: 'Spinner: every working state',
    timing: '1.2s linear, looping while the work runs',
    purpose: 'Work in progress',
    reduced: 'The still frame, a notch at the top right.',
    source: {
      file: 'packages/ui/src/components/foundational/Spinner/index.tsx',
      text: ['motion-safe:animate-[tui-spinner_1.2s_linear_infinite]'],
    },
  },
  {
    name: 'The elapsed figure',
    where: 'Chat thread, Agent reasoning, Agent plan, Tool',
    timing: 'From 3s, each second',
    purpose: 'Work in progress',
    reduced: 'It keeps ticking: a changing number isn’t movement.',
    source: { file: 'packages/ui/src/lib/elapsed.ts', text: ['ELAPSED_AFTER_SECONDS = 3'] },
  },
  {
    name: 'Work of unknown length',
    where: 'Progress bar, indeterminate',
    timing: '1.4s ease-in-out, while the work runs',
    purpose: 'Work in progress',
    reduced: 'Holds still; its label says it’s working.',
    source: {
      file: 'packages/ui/src/components/product/ProgressBar/index.tsx',
      text: ['motion-safe:animate-[pulse_1.4s_ease-in-out_infinite]'],
    },
  },
];

/** The site's player: how fast a specimen steps, and the longest run (docs/site.md §6). */
export const playerSource = {
  file: 'apps/site/src/lib/playback.ts',
  text: ['MAX_SEQUENCE_MS = 5000', 'STEP_MS = 900'],
};
