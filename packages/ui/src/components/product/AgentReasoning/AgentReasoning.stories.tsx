import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { AgentBlock } from '../AgentBlock';
import { AgentReasoning } from './index';

/**
 * §8.3: identifiers in mono, one step below the sans beside them: --text-xs
 * in the --text-sm reasoning, --text-sm in the --text-base reply.
 */
function Ident({ children, size }: { children: string; size: 'text-xs' | 'text-sm' }) {
  return <code className={`font-mono ${size}`}>{children}</code>;
}

/** Story helper: `backticked` names become <Ident>, the rest stays text. */
function mono(text: string, size: 'text-xs' | 'text-sm' = 'text-xs') {
  return text.split(/`([^`]+)`/).map((part, i) =>
    i % 2 ? (
      <Ident key={i} size={size}>
        {part}
      </Ident>
    ) : (
      part
    ),
  );
}

const reasoning = `\`fct_revenue\` reads \`order_total\` in two places, and \`mart_revenue_monthly\` sums it.
Revenue should be net of tax, so \`net_amount\` replaces \`order_total\`.
Tax gets its own column so the monthly totals still reconcile.`;

/**
 * AgentReasoning is a part of an AgentBlock, so every story renders it inside
 * one, at the chat panel's width (--w-panel) on the panel's ground.
 */
const meta = {
  title: 'Product/AgentReasoning',
  component: AgentReasoning,
  parameters: { layout: 'padded' },
  args: { text: mono(reasoning), status: 'done', durationSeconds: 4 },
  decorators: [
    (Story) => (
      <div className="w-[var(--w-panel)] bg-surface px-[var(--pad-page-x)] py-[var(--pad-page-y)]">
        <AgentBlock authorship="AI" meta="14:22">
          <Story />
        </AgentBlock>
      </div>
    ),
  ],
} satisfies Meta<typeof AgentReasoning>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Finished and collapsed: the default. One line, with how long it took. */
export const Done: Story = {
  play: async ({ canvasElement }) => {
    const toggle = within(canvasElement).getByRole('button', { name: 'Thought for 4s' });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(within(canvasElement).getByText(/Revenue should be net of tax/)).toBeVisible();
    // The live region sits beside the toggle, so it is not part of its name.
    // Mounted already done, it has nothing to announce, and stays empty:
    // otherwise a reader of the transcript hears the label twice.
    const status = within(canvasElement).getByRole('status');
    await expect(toggle).not.toContainElement(status);
    await expect(status).toBeEmptyDOMElement();
  },
};

/** Finished, opened by the reader. */
export const DoneOpen: Story = {
  args: { defaultOpen: true },
};

/**
 * Finished and open, with the agent's reply after it in the same block, laid
 * out as `ChatThread` lays out a turn. Shows where the reasoning ends and the
 * reply begins.
 */
export const DoneOpenWithReply: Story = {
  name: 'Done open, with reply',
  args: { defaultOpen: true },
  render: (args) => (
    <div className="flex flex-col gap-[var(--gap-group)]">
      <AgentReasoning {...args} />
      <div className="whitespace-pre-wrap">
        {mono(
          '`fct_revenue` now sums `net_amount`, and tax has its own column. The monthly totals still match the ledger.',
          'text-sm',
        )}
      </div>
    </div>
  ),
};

/**
 * Still thinking. Collapsed: it does not open by itself. The spinner stands
 * still under reduced motion; the label carries the state either way.
 */
export const Streaming: Story = {
  args: { status: 'streaming', durationSeconds: undefined, text: mono(reasoning.split('\n')[0]) },
  play: async ({ canvasElement }) => {
    // The name is the bare label; the visible copy, which gains the elapsed
    // figure after 3s (§11.5), is aria-hidden so the name never ticks.
    const toggle = within(canvasElement).getByRole('button', { name: 'Thinking' });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(within(toggle).getByText('Thinking…')).toBeVisible();
    await waitFor(() => expect(within(canvasElement).getByRole('status')).toHaveTextContent(/^Thinking$/));
  },
};

/**
 * Thinks, then finishes while you watch. The live region announces each
 * change ("Thinking", then "Thought for 3s"), then empties, so the summary is
 * not read twice by anyone reading the transcript later.
 */
export const Finishes: Story = {
  args: { status: 'streaming', durationSeconds: undefined },
  render: function Finishes(args) {
    const [done, setDone] = useState(false);
    useEffect(() => {
      const timer = setTimeout(() => setDone(true), 600);
      return () => clearTimeout(timer);
    }, []);
    return <AgentReasoning {...args} status={done ? 'done' : 'streaming'} durationSeconds={done ? 3 : undefined} />;
  },
  play: async ({ canvasElement }) => {
    const status = within(canvasElement).getByRole('status');
    await waitFor(() => expect(status).toHaveTextContent('Thought for 3s'), { timeout: 3000 });
    await expect(within(canvasElement).getByRole('button', { name: 'Thought for 3s' })).not.toContainElement(status);
  },
};

/** Still thinking, opened by the reader: the text so far. */
export const StreamingOpen: Story = {
  args: { ...Streaming.args, defaultOpen: true },
};

/** No duration supplied: a neutral summary rather than a guessed figure. */
export const NoDuration: Story = {
  args: { durationSeconds: undefined },
  play: async ({ canvasElement }) => {
    // Mounted done: nothing to announce (see Done).
    await expect(within(canvasElement).getByRole('status')).toBeEmptyDOMElement();
    await expect(within(canvasElement).getByRole('button', { name: 'Reasoning' })).toBeVisible();
  },
};

/** A long run of reasoning wraps inside the 440px panel; nothing truncates. */
export const LongText: Story = {
  args: {
    defaultOpen: true,
    durationSeconds: 38,
    text: mono(
      `${reasoning}\n\nThree downstream models also read \`order_total\`: \`rpt_sales_by_region\`, \`rpt_customer_ltv\` and the \`finance_close\` snapshot. The snapshot is frozen per period, so rebuilding it would rewrite closed months. It stays on \`order_total\` until the September close is signed off, and the other two move with \`fct_revenue\`.`,
    ),
  },
};

/** Plain text works too; identifiers then render in the sans. */
export const PlainText: Story = {
  args: { defaultOpen: true, text: 'Revenue should be net of tax, so the net amount replaces the order total.' },
};
