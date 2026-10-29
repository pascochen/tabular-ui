import {
  CheckCircleIcon,
  CircleNotchIcon,
  ClockIcon,
  EyeIcon,
  MinusCircleIcon,
  RobotIcon,
  SparkleIcon,
  WarningIcon,
  XCircleIcon,
} from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';

import type { BadgeTone } from '../../foundational/Badge/variants';

/**
 * §5's run/pipeline state table, in one place.
 *
 * The point of centralising it: a status is mapped to a tone **once**. Three
 * screens each deciding that "degraded" is ochre is how a system drifts.
 *
 * Every status carries an icon as well as a hue, because §10 requires a
 * grayscale pass — convert a run log to grayscale and every state must still
 * be distinguishable. Colour alone does not survive that, and neither does it
 * survive deuteranopia (§5 "Agent authorship treatment").
 */
export type RunStatus =
  | 'queued'
  | 'running'
  | 'passed'
  | 'failed'
  | 'stale'
  | 'needs-review'
  | 'agent-working'
  | 'agent-proposed'
  | 'skipped';

type RunStatusEntry = {
  label: string;
  /** The Badge tone this status takes. */
  tone: BadgeTone;
  /** @deprecated Use `tone`. Same value; kept while callers migrate (2026-10-09). */
  role: BadgeTone;
  /** The status mark. A `working` status draws `Spinner` in its place; this stays as its static fallback. */
  icon: Icon;
  /** Work in progress: `StatusBadge` draws `Spinner` instead of `icon` (§11.5). */
  working?: boolean;
  /** @deprecated Use `working`. Same value; kept while callers migrate (2026-10-20). */
  spin?: boolean;
};

const entries: Record<RunStatus, Omit<RunStatusEntry, 'role' | 'spin'>> = {
  queued: { label: 'queued', tone: 'neutral', icon: ClockIcon },
  running: { label: 'running', tone: 'info', icon: CircleNotchIcon, working: true },
  passed: { label: 'passed', tone: 'success', icon: CheckCircleIcon },
  failed: { label: 'failed', tone: 'danger', icon: XCircleIcon },
  stale: { label: 'stale', tone: 'warning', icon: WarningIcon },
  'needs-review': { label: 'needs review', tone: 'warning', icon: EyeIcon },
  // Spinner, as running (§11.5, 2026-10-20). The robot spun here until then and tumbled.
  // "AI", agent-voice's word for the role: with the mark shared, the label is the badge's authorship signal (2026-10-25).
  'agent-working': { label: 'AI working', tone: 'agent', icon: RobotIcon, working: true },
  'agent-proposed': { label: 'proposed', tone: 'agent', icon: SparkleIcon },
  skipped: { label: 'skipped', tone: 'neutral', icon: MinusCircleIcon },
};

export const runStatuses = Object.fromEntries(
  Object.entries(entries).map(([status, entry]) => [status, { ...entry, role: entry.tone, spin: entry.working }]),
) as Record<RunStatus, RunStatusEntry>;

/**
 * §5 — forced colours (Windows high contrast) removes backgrounds, so a row
 * whose state is shown by its tint alone has no edge there. It draws a 1px
 * outline instead, inside itself (negative offset). An outline, not a border:
 * a border is geometry and would push the content right (failure log,
 * Switch). An agent-proposed row needs none, because its rail is a border and
 * forced colours keep borders.
 *
 * Exported so `RunLogRow` can move the same edge to its wrapper when the row
 * is open, and the error sits inside its row's edge.
 */
export const forcedColorsRowEdge = [
  'forced-colors:outline-solid',
  'forced-colors:outline-[length:var(--border-width)]',
  'forced-colors:outline-offset-[calc(var(--border-width)*-1)]',
].join(' ');

/**
 * Row-level treatments §5 assigns to a status but which are **not** the
 * badge's job — a badge cannot tint the row it sits in.
 *
 * `DataTable`, `RunLogRow` and `AttachmentRow` read this; nothing else should.
 */
export const runStatusRowTreatment: Partial<Record<RunStatus, string>> = {
  // §5: "Failed → --color-text-danger + --color-bg-danger row tint", and in
  // forced colours, where the tint is gone, a 1px edge (2026-10-29).
  failed: ['bg-bg-danger', forcedColorsRowEdge].join(' '),
  // §5: "Agent proposed → --color-bg-agent ground + solid --color-text-agent
  // left rail", the rail AgentBlock draws (2026-10-21). The tinted
  // --color-border-agent rail it replaces measured 1.38:1, under the 3:1 a
  // required signal needs.
  //
  // A border is geometry: the rail takes 2px of the row's width, so 2px comes
  // off the left padding and the content keeps its x (failure log, Switch).
  // A table row cannot draw it at all: DataTable's separated-borders table
  // paints no border on a <tr>, so there the first cell draws the rail and
  // takes the padding. Rows that use this pad with --pad-cell-x.
  'agent-proposed': [
    'bg-bg-agent',
    'border-l-[length:var(--border-width-2)] border-l-text-agent',
    'pl-[calc(var(--pad-cell-x)-var(--border-width-2))]',
    '[&>td:first-child]:border-l-[length:var(--border-width-2)] [&>td:first-child]:border-l-text-agent',
    '[&>td:first-child]:pl-[calc(var(--pad-cell-x)-var(--border-width-2))]',
  ].join(' '),
};
