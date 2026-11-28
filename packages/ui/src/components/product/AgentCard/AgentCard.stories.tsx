import type { Meta, StoryObj } from '@storybook/react-vite';
import { GaugeIcon, MoneyIcon, StampIcon, TrendUpIcon, type Icon } from '@phosphor-icons/react';

import { StatusBadge } from '../StatusBadge';
import type { RunStatus } from '../StatusBadge/statuses';
import { AgentCard, AgentCardFinding } from './index';

/** Mode is driven by the toolbar Theme control. Dark is canonical. */
const meta = {
  title: 'Product/Agent/AgentCard',
  id: 'product-agentcard',
  component: AgentCard,
  parameters: { layout: 'padded' },
  args: {
    icon: TrendUpIcon,
    name: 'Revenue AI',
    href: '#revenue-ai',
    rule: 'Revenue lands in the month of delivery.',
    meta: 'Reads 3 files',
  },
  decorators: [
    (Story) => (
      <div className="max-w-[360px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AgentCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A finding's row: its title links to it, and its status says whose move it is. */
function Finding({ title, status, children }: { title: string; status: RunStatus; children: string }) {
  return (
    <AgentCardFinding title={title} href="#finding" status={<StatusBadge status={status}>{children}</StatusBadge>} />
  );
}

/** An agent that has raised nothing: no findings, and no rule for them. */
export const Default: Story = {};

/** The one hue on the card is the finding's status. */
export const WithFinding: Story = {
  args: {
    children: (
      <Finding title="Revenue booked early" status="needs-review">
        Needs your answer
      </Finding>
    ),
  },
};

/** A card that only displays: the name is text. */
export const Unlinked: Story = { args: { href: undefined } };

const agents: {
  icon: Icon;
  name: string;
  rule: string;
  reads: number;
  finding: string;
  status: RunStatus;
  word: string;
}[] = [
  {
    icon: TrendUpIcon,
    name: 'Revenue AI',
    rule: 'Revenue lands in the month of delivery.',
    reads: 3,
    finding: 'Revenue booked early',
    status: 'needs-review',
    word: 'Needs your answer',
  },
  {
    icon: MoneyIcon,
    name: 'Payments AI',
    rule: 'Nothing is paid twice.',
    reads: 2,
    finding: 'Duplicate payment',
    status: 'passed',
    word: 'Resolved',
  },
  {
    icon: StampIcon,
    name: 'Approvals AI',
    rule: 'Every manual entry has a different approver.',
    reads: 2,
    finding: 'Self-approved entry',
    status: 'open',
    word: 'Open',
  },
  {
    icon: GaugeIcon,
    name: 'Credit AI',
    rule: 'Customers stay within their credit limit.',
    reads: 2,
    finding: 'Credit limit',
    status: 'queued',
    word: 'Waiting',
  },
];

function Grid() {
  return (
    <ul role="list" className="grid grid-cols-1 gap-[var(--gap-group)] sm:grid-cols-2">
      {agents.map((a) => (
        <li key={a.name} className="flex">
          <AgentCard
            className="flex-1"
            icon={a.icon}
            name={a.name}
            href="#agent"
            rule={a.rule}
            meta={`Reads ${a.reads} files`}
          >
            <Finding title={a.finding} status={a.status}>
              {a.word}
            </Finding>
          </AgentCard>
        </li>
      ))}
    </ul>
  );
}

const wide = [(Story: () => React.ReactNode) => <div className="max-w-[720px]">{Story()}</div>];

/** Where it lives: a page of agents, two to a row, each a different glyph and status. */
export const InAGrid: Story = { decorators: wide, render: () => <Grid /> };

/** §11.1: with hue removed, each status keeps its word and icon, and each agent its glyph. */
export const Grayscale: Story = {
  decorators: wide,
  render: () => (
    <div style={{ filter: 'grayscale(1)' }}>
      <Grid />
    </div>
  ),
};

/** A narrow card: the rule wraps, and the finding's title truncates before its status does. */
export const Narrow: Story = {
  decorators: [(Story) => <div className="max-w-[240px]">{Story()}</div>],
  args: {
    name: 'Intercompany reconciliation AI',
    rule: 'Every intercompany balance agrees with the balance its counterparty holds, in the same month.',
    children: (
      <Finding title="Intercompany balance out by one invoice" status="needs-review">
        Needs your answer
      </Finding>
    ),
  },
};

/**
 * A card 343px wide, as a 375px phone gives it, with the close's longest
 * finding titles. A title too long for its row is cut, and shows whole in a
 * tooltip on hover and on keyboard focus.
 */
export const LongTitles: Story = {
  decorators: [(Story) => <div style={{ width: 343 }}>{Story()}</div>],
  args: {
    name: 'Accounts Payable AI',
    rule: 'Every supplier invoice is entered once and paid once.',
    children: (
      <>
        <Finding title="Duplicate payment" status="needs-review">
          Needs your answer
        </Finding>
        <Finding title="List INV-KJP-2609-00363 for the auditors?" status="needs-review">
          Needs your answer
        </Finding>
        <Finding title="Reverse INV-KJP-2609-00363 in September?" status="passed">
          Answered
        </Finding>
      </>
    ),
  },
};
