import type { Meta, StoryObj } from '@storybook/react-vite';
import { HashIcon } from '@phosphor-icons/react';

import { AppShellNav, AppShellNavGroup, AppShellNavItem } from '../AppShell';
import { StatusDot, type StatusDotStatus } from './index';

/** Mode is driven by the toolbar Theme control. Dark is canonical. */
const meta = {
  title: 'Product/StatusDot',
  component: StatusDot,
  parameters: { layout: 'padded' },
  args: { status: 'needs-review' },
} satisfies Meta<typeof StatusDot>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** The two kinds: solid when something waits on the viewer, hollow when it doesn't. */
export const Kinds: Story = {
  render: () => (
    <div className="flex flex-col gap-[var(--gap-field)]">
      <div className="flex items-center gap-[var(--gap-inline)]">
        <StatusDot status="needs-review" />
        <span className="text-sm text-text-body">Waiting on you</span>
      </div>
      <div className="flex items-center gap-[var(--gap-inline)]">
        <StatusDot status="open" />
        <span className="text-sm text-text-body">Open, and not waiting on you</span>
      </div>
    </div>
  ),
};

const channels: { name: string; status?: StatusDotStatus; active?: boolean; unread?: boolean; hidden?: string }[] = [
  { name: 'close', status: 'open', active: true, hidden: ', open finding' },
  { name: 'cash' },
  { name: 'receivables', status: 'open', unread: true, hidden: ', open finding' },
  { name: 'payables', status: 'open', hidden: ', open finding' },
  { name: 'revenue', status: 'needs-review', hidden: ', needs your answer' },
  { name: 'intercompany' },
];

function Sidebar() {
  return (
    <AppShellNav aria-label="Channels" className="max-w-[240px]">
      <AppShellNavGroup label="Channels">
        {channels.map((c) => (
          <AppShellNavItem
            key={c.name}
            href="#channel"
            icon={<HashIcon />}
            active={c.active}
            unread={c.unread}
            trailing={c.status ? <StatusDot status={c.status} /> : undefined}
          >
            {c.name}
            {c.hidden ? <span className="sr-only">{c.hidden}</span> : null}
          </AppShellNavItem>
        ))}
      </AppShellNavGroup>
    </AppShellNav>
  );
}

/** Where it lives: the trailing edge of a sidebar row, beside active and unread names. */
export const InSidebar: Story = { render: () => <Sidebar /> };

/** §11.1: with hue removed, the channel that needs the viewer holds the only solid dot. */
export const Grayscale: Story = {
  render: () => (
    <div style={{ filter: 'grayscale(1)' }}>
      <Sidebar />
    </div>
  ),
};
