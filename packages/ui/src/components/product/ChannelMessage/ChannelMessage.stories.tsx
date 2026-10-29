import type { Meta, StoryObj } from '@storybook/react-vite';
import { RobotIcon } from '@phosphor-icons/react';
import { expect, userEvent, within } from 'storybook/test';

import { Avatar, AvatarFallback } from '../../foundational/Avatar';
import { Badge } from '../../foundational/Badge';
import { people } from '../../../fixtures/kasane';
import { ChannelMessage, ChannelMessageList, ChannelMessageReply } from './index';

const person = (p: { initials: string }) => (
  <Avatar>
    <AvatarFallback>{p.initials}</AvatarFallback>
  </Avatar>
);

const agentAvatar = (
  <Avatar>
    <AvatarFallback>
      <RobotIcon weight="bold" />
    </AvatarFallback>
  </Avatar>
);

const controller = { name: people.controller.name, avatar: person(people.controller) };
const payables = { name: people.payables.name, avatar: person(people.payables) };
const mei = { name: people.fpa.name, avatar: person(people.fpa) };
const agent = { name: 'Close agent', avatar: agentAvatar };

/** §8.3: an identifier in mono, one step below the --text-base body beside it. */
const Ident = ({ children }: { children: string }) => <code className="font-mono text-sm">{children}</code>;

const meta = {
  title: 'Product/ChannelMessage',
  component: ChannelMessage,
  parameters: { layout: 'padded' },
  // A channel is main's column, 720px: a laptop with the sidebar and the
  // panel open. `parameters.panel` narrows it to the 440px panel.
  decorators: [
    (Story, { parameters }) => (
      <div className={parameters.panel ? 'w-[var(--w-panel)]' : 'max-w-[720px]'}>
        <ChannelMessageList>
          <Story />
        </ChannelMessageList>
      </div>
    ),
  ],
} satisfies Meta<typeof ChannelMessage>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A person's message. Name, time and body; no replies, so no disclosure. */
export const Default: Story = {
  args: {
    author: controller,
    time: '13:48',
    dateTime: '2026-10-16T13:48',
    children: 'Logistics confirms it left Tsukuba on 1 Oct. The cut-off review missed it.',
  },
};

/**
 * The agent as a member. `authorship` puts the body in an `AgentBlock`, so
 * the orchid rail and label say "agent" whatever the body holds. The header
 * carries no badge: the block's label already says "AI".
 */
export const AgentMessage: Story = {
  args: {
    author: agent,
    time: '09:04',
    dateTime: '2026-10-16T09:04',
    authorship: 'AI · Catch-up',
    children: (
      <ul role="list" className="flex list-disc flex-col gap-[var(--gap-bonded)] pl-4">
        <li>September was locked on 8 Oct, business day 6.</li>
        <li>6 exceptions found since. 2 are resolved.</li>
        <li>September revenue includes ¥42.7m delivered in October.</li>
      </ul>
    ),
  },
  play: async ({ canvasElement }) => {
    const block = canvasElement.querySelector('[data-slot="agent-block"]');
    await expect(block).not.toBeNull();
    await expect(within(block as HTMLElement).getByText('AI · Catch-up')).toBeVisible();
  },
};

/**
 * Replies fold behind a count. One press shows them inline, beneath the
 * message, on a 1px neutral rule; the count stays the label and the caret
 * and `aria-expanded` carry the state.
 */
export const WithReplies: Story = {
  args: {
    author: payables,
    time: '09:20',
    dateTime: '2026-10-16T09:20',
    children: (
      <>
        <Ident>MFL-58821</Ident> was entered twice and paid twice: $48,216.40 each.
      </>
    ),
    replies: [
      <ChannelMessageReply key="1" author={payables} time="09:24" dateTime="2026-10-16T09:24">
        The duplicate check compares the description too. &ldquo;June&rdquo; and &ldquo;Jun&rdquo; got past it.
      </ChannelMessageReply>,
      <ChannelMessageReply key="2" author={payables} time="09:31" dateTime="2026-10-16T09:31">
        Midwest Freight has agreed to credit $48,216.40 against the next invoice.
      </ChannelMessageReply>,
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole('button', { name: '2 replies' });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(canvas.queryByRole('list', { name: /Replies to/ })).toBeNull();
    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    const thread = canvas.getByRole('list', { name: `Replies to ${people.payables.name}` });
    await expect(toggle).toHaveAttribute('aria-controls', thread.id);
    await expect(within(thread).getAllByRole('listitem')).toHaveLength(2);
  },
};

/**
 * The hero exception's thread as the demo lands on it: open, a person's
 * reply, then the agent's question, which is an `AgentBlock` inside the
 * thread. One block per agent turn, never nested in another.
 */
export const ThreadWithAgentReply: Story = {
  args: {
    author: agent,
    time: '09:04',
    dateTime: '2026-10-16T09:04',
    authorship: 'AI · Open',
    defaultRepliesOpen: true,
    children: (
      <>
        Invoice <Ident>INV-KJP-2609-00363</Ident> is dated 30 Sep but was delivered 2 Oct, so ¥42.7m of revenue is in
        the wrong month.
      </>
    ),
    replies: [
      <ChannelMessageReply key="1" author={controller} time="13:48" dateTime="2026-10-16T13:48">
        Logistics confirms it left Tsukuba on 1 Oct. The cut-off review missed it.
      </ChannelMessageReply>,
      <ChannelMessageReply
        key="2"
        author={agent}
        time="13:49"
        dateTime="2026-10-16T13:49"
        authorship="AI · Awaiting your answer"
      >
        September is locked. Where should the ¥42.7m correction go?
      </ChannelMessageReply>,
    ],
  },
};

/**
 * A member who is neither a person nor the agent: a deterministic check
 * posts as "System" (`docs/agent-voice.md`, rule 1). The badge is neutral:
 * being a system is context, not a state.
 */
export const SystemMember: Story = {
  args: {
    author: {
      name: 'Revenue cut-off check',
      avatar: (
        <Avatar>
          <AvatarFallback>SY</AvatarFallback>
        </Avatar>
      ),
      badge: <Badge>System</Badge>,
    },
    time: '14:02',
    dateTime: '2026-10-16T14:02',
    children: 'Reran in 2s. September revenue on invoices delivered after the month: ¥0.',
  },
};

/**
 * The narrow case: the 440px panel, a long name, and an address with no
 * break opportunity. The header wraps under the name, and the body breaks
 * the address rather than widening the column.
 */
export const Narrow: Story = {
  parameters: { panel: true },
  args: {
    author: { name: people.longName.name, avatar: person(people.longName) },
    time: '10:12',
    dateTime: '2026-10-16T10:12',
    children: (
      <>
        Send the Europe sales pack to <Ident>{people.longName.email}</Ident> before the board meeting.
      </>
    ),
  },
  play: async ({ canvasElement }) => {
    const li = canvasElement.querySelector<HTMLElement>('[data-slot="channel-message"]')!;
    // Nothing widens the 440px column.
    await expect(li.scrollWidth).toBeLessThanOrEqual(li.clientWidth);
  },
};

/**
 * A channel: messages from people and the agent, the visitor's own among
 * them. Every message names its author and time, so the list reads out of
 * order and out of context.
 */
export const Channel: Story = {
  args: Default.args,
  render: () => (
    <>
      <ChannelMessage author={agent} time="09:04" dateTime="2026-10-16T09:04" authorship="AI · Catch-up">
        6 exceptions found since September was locked. 2 are resolved.
      </ChannelMessage>
      <ChannelMessage
        author={controller}
        time="09:31"
        dateTime="2026-10-16T09:31"
        replies={[
          <ChannelMessageReply key="1" author={mei} time="09:35" dateTime="2026-10-16T09:35">
            Agreed. The board pack can say six.
          </ChannelMessageReply>,
        ]}
      >
        Five is Japan. The group needs a sixth day for consolidation.
      </ChannelMessage>
      <ChannelMessage author={mei} time="13:52" dateTime="2026-10-16T13:52">
        Looking at the cut-off now.
      </ChannelMessage>
    </>
  ),
  play: async ({ canvasElement }) => {
    const list = canvasElement.querySelector('[data-slot="channel-message-list"]') as HTMLElement;
    // Three messages; the folded reply isn't a message of the channel's list.
    await expect(within(list).getAllByRole('listitem')).toHaveLength(3);
  },
};
