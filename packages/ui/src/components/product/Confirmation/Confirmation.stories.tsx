import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import { AgentBlock } from '../AgentBlock';
import { Confirmation } from './index';

/** §8.3: identifiers in mono, one step below the --text-base value. */
function Ident({ children }: { children: string }) {
  return <code className="font-mono text-sm">{children}</code>;
}

const sent = 'Sent once, by you. The next send asks again.';

/**
 * Confirmation is a part of an AgentBlock, so every story renders it inside
 * one, at the chat panel's width (--w-panel) on the panel's ground. A story
 * sets the block's label with `parameters.authorship`.
 *
 * Sending is planned, not built: today the agent changes nothing, so a
 * conversation doesn't show a Confirmation yet. These stories document it for
 * when that changes (`docs/agent-voice.md`, *Fixed strings*).
 */
const meta = {
  title: 'Product/Confirmation',
  component: Confirmation,
  parameters: { layout: 'padded', authorship: 'AI · Awaiting confirmation' },
  args: {
    title: 'Send the variance summary to the controller?',
    changes: (
      <>
        Nothing in the books. One message goes out, with <Ident>rpt_variance_summary</Ident> for September.
      </>
    ),
    reaches: 'The controller, by email. No one else.',
    confirmLabel: 'Send summary',
    stopLabel: 'Don’t send',
    onConfirm: fn(),
    onStop: fn(),
  },
  decorators: [
    (Story, { parameters }) => (
      <div className="w-[var(--w-panel)] bg-surface px-[var(--pad-page-x)] py-[var(--pad-page-y)]">
        <AgentBlock authorship={parameters.authorship as string}>
          <Story />
        </AgentBlock>
      </div>
    ),
  ],
} satisfies Meta<typeof Confirmation>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Waiting: the action, what it changes, who it reaches, and the two buttons. */
export const Waiting: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const section = canvas.getByRole('region', { name: 'Send the variance summary to the controller?' });
    await expect(section).toHaveAttribute('data-state', 'waiting');
    const terms = canvas.getAllByRole('term').map((t) => t.textContent);
    await expect(terms).toEqual(['What changes', 'Who it reaches']);
    await expect(canvas.getByRole('button', { name: 'Send summary' })).toBeEnabled();
    await expect(canvas.getByRole('button', { name: 'Don’t send' })).toBeEnabled();
  },
};

/**
 * Once: a double click runs the action one time, and both buttons stay
 * disabled until the outcome arrives. Focus stays on the pressed button.
 */
export const Answering: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const send = canvas.getByRole('button', { name: 'Send summary' });
    await userEvent.dblClick(send);
    await expect(args.onConfirm).toHaveBeenCalledTimes(1);
    await expect(args.onStop).not.toHaveBeenCalled();
    await expect(send).toHaveAttribute('aria-disabled', 'true');
    await expect(canvas.getByRole('button', { name: 'Don’t send' })).toHaveAttribute('aria-disabled', 'true');
    await expect(send).toHaveFocus();
  },
};

/** Sent: the outcome takes the buttons' place, and the block's label says what happened. */
export const Sent: Story = {
  parameters: { authorship: 'AI · Sent' },
  args: { outcome: sent },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole('button')).toBeNull();
    await expect(canvas.getByText(sent)).toBeVisible();
    // Mounted already decided, so it takes no focus from the page.
    await expect(canvas.getByText(sent)).not.toHaveFocus();
  },
};

/** Not sent: stopping is an answer too, and it is recorded the same way. */
export const NotSent: Story = {
  parameters: { authorship: 'AI · Not sent' },
  args: { outcome: 'Not sent. The summary stays here.' },
};

/**
 * The whole exchange, live: press either button and the outcome replaces
 * them, with focus moved to it, so focus is never dropped on the page.
 */
export const Decide: Story = {
  render: function Render(args) {
    const [outcome, setOutcome] = useState<string>();
    return (
      <Confirmation
        {...args}
        onConfirm={() => {
          args.onConfirm?.();
          setOutcome(sent);
        }}
        onStop={() => {
          args.onStop?.();
          setOutcome('Not sent. The summary stays here.');
        }}
        outcome={outcome}
      />
    );
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    canvas.getByRole('button', { name: 'Send summary' }).focus();
    await userEvent.keyboard('{Enter}');
    await expect(args.onConfirm).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(canvas.getByText(sent)).toHaveFocus());
    await expect(canvas.queryByRole('button')).toBeNull();
  },
};

/**
 * An action that reaches people through a system: a rebuild reaches no one
 * directly, but everyone reading the dashboards sees new figures. Long values
 * wrap under their own value, never under the label.
 */
export const ReachesThroughASystem: Story = {
  args: {
    title: 'Rebuild fct_revenue and the monthly mart?',
    changes: (
      <>
        Replaces <Ident>fct_revenue</Ident> and <Ident>mart_revenue_monthly</Ident> with figures built on{' '}
        <Ident>net_amount</Ident>. Nothing in the books.
      </>
    ),
    reaches: (
      <>
        No one directly. The revenue dashboards read <Ident>mart_revenue_monthly</Ident>, so everyone viewing them sees
        the new figures.
      </>
    ),
    confirmLabel: 'Rebuild models',
    stopLabel: 'Don’t rebuild',
  },
};
