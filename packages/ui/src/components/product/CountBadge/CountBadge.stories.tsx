import type { Meta, StoryObj } from '@storybook/react-vite';

import { Chip } from '../../foundational/Chip';
import { CountBadge } from './index';

const meta = {
  title: 'Product/CountBadge',
  component: CountBadge,
  parameters: { layout: 'padded' },
  args: { label: 'Gaps', count: 3 },
} satisfies Meta<typeof CountBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** The summary strip: a row of categories with their counts. All neutral. */
export const SummaryStrip: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-[var(--gap-inline)]">
      <CountBadge label="Unmatched" count={12} />
      <CountBadge label="Needs review" count={5} />
      <CountBadge label="Stale" count={3} />
      <CountBadge label="Failed" count={1} />
    </div>
  ),
};

/**
 * Counts are quantities, not state (§0 rule 1) — "Failed 1" is still neutral,
 * because the badge is not itself failing. Compare the row above: nothing in it
 * competes for attention, so a real hue elsewhere on the screen still lands.
 */
export const NeutralEvenWhenCountingFailures: Story = {
  render: () => (
    <div className="flex flex-col gap-[var(--gap-field)]">
      <div className="flex items-center gap-[var(--gap-inline)]">
        <CountBadge label="Passed" count={48} />
        <CountBadge label="Failed" count={6} />
        <CountBadge label="Skipped" count={2} />
      </div>
      <span className="text-xs text-text-secondary">
        Zero is a real answer and renders as one — it is not an empty state.
      </span>
      <div className="flex items-center gap-[var(--gap-inline)]">
        <CountBadge label="Failed" count={0} />
      </div>
    </div>
  ),
};

/**
 * Above `max` the figure truncates. The true count still reaches assistive
 * technology — the visible "99+" is `aria-hidden` and the real number is
 * rendered visually-hidden beside it.
 */
export const Truncation: Story = {
  render: () => (
    <div className="flex items-center gap-[var(--gap-inline)]">
      <CountBadge label="Entries" count={99} />
      <CountBadge label="Entries" count={100} />
      <CountBadge label="Entries" count={1284} />
      <CountBadge label="Entries" count={1284} max={999} />
    </div>
  ),
};

/**
 * The upgrade path. Static today; the day these filter something they become
 * `Chip`s and gain a border, hover and selection — the signals §7.7 reserves
 * for interactivity. Side by side, the difference is the affordance.
 */
export const StaticVersusInteractive: Story = {
  render: () => (
    <div className="flex flex-col gap-[var(--gap-field)]">
      <div className="flex items-center gap-[var(--gap-inline)]">
        <span className="w-24 text-xs text-text-secondary">Static</span>
        <CountBadge label="Gaps" count={3} />
        <CountBadge label="Follow-ups" count={7} />
        <CountBadge label="Contradictions" count={5} />
      </div>
      <div className="flex items-center gap-[var(--gap-inline)]">
        <span className="w-24 text-xs text-text-secondary">Interactive</span>
        <Chip>
          Gaps <span className="tabular-nums text-text-secondary">3</span>
        </Chip>
        <Chip data-selected="">
          Follow-ups <span className="tabular-nums">7</span>
        </Chip>
        <Chip>
          Contradictions <span className="tabular-nums text-text-secondary">5</span>
        </Chip>
      </div>
    </div>
  ),
};

/** The dense case: a summary strip above a 28px table row. */
export const Dense: Story = {
  render: () => (
    <div className="max-w-xl rounded-md border border-border">
      <div className="flex items-center gap-[var(--gap-inline)] border-b border-border px-[var(--pad-cell-x)] py-[var(--gap-chip)]">
        <CountBadge label="Unmatched" count={12} />
        <CountBadge label="Needs review" count={5} />
        <CountBadge label="Stale" count={3} />
      </div>
      {['fct_gl_entries', 'dim_accounts', 'stg_sap__bkpf'].map((m) => (
        <div
          key={m}
          className="flex h-[var(--h-row-sm)] items-center px-[var(--pad-cell-x)] font-mono text-xs text-text-body"
        >
          {m}
        </div>
      ))}
    </div>
  ),
};

/** Long category names do not wrap — `Badge` is `whitespace-nowrap` by design. */
export const LongLabel: Story = {
  render: () => (
    <div className="flex w-72 flex-wrap items-center gap-[var(--gap-inline)]">
      <CountBadge label="Reconciliation contradictions" count={5} />
      <CountBadge label="Unresolved follow-ups" count={17} />
    </div>
  ),
};
