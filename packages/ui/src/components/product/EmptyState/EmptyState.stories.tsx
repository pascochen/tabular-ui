import type { Meta, StoryObj } from '@storybook/react-vite';
import { MagnifyingGlassIcon, TableIcon } from '@phosphor-icons/react';

import { Button } from '../../foundational/Button';
import { EmptyState } from './index';

const meta = {
  title: 'Product/EmptyState',
  component: EmptyState,
  parameters: { layout: 'padded' },
  args: { title: 'Nothing here yet' },
} satisfies Meta<typeof EmptyState>;
export default meta;
type Story = StoryObj<typeof meta>;

/** 48px icon at `thin` weight — the only display-size icon in the system. */
export const Default: Story = {
  args: {
    icon: TableIcon,
    title: 'No models in this project yet',
    description: 'Connect a dbt project to start tracking model runs, tests and lineage.',
    action: <Button>Connect a project</Button>,
  },
};

export const NoResults: Story = {
  args: {
    icon: MagnifyingGlassIcon,
    title: 'No models match “fct_recon”',
    description: 'Check the spelling, or clear the filters to see all 1,284 models.',
    action: <Button variant="outline">Clear filters</Button>,
  },
};

/**
 * `page` when the empty state stands in for a whole page: `--pad-frame-empty`
 * (64px) above and below, the frame tier's one non-shell use (§7.3). Inside
 * a card, table or drop zone, use `default`.
 */
export const Page: Story = {
  args: {
    size: 'page',
    icon: TableIcon,
    title: 'No models in this project yet',
    description: 'Connect a dbt project to start tracking model runs, tests and lineage.',
    action: <Button>Connect a project</Button>,
  },
};

/** `sm` for an empty state inside a panel rather than a page. */
export const Small: Story = {
  args: { size: 'sm', icon: TableIcon, title: 'No downstream models', description: 'Nothing depends on this model.' },
};

/** Everything neutral — §0 rule 1 names empty states explicitly. An absence has no state. */
export const InsideAPanel: Story = {
  render: () => (
    <div
      style={{
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        height: 260,
        display: 'grid',
        placeItems: 'center',
      }}
    >
      <EmptyState
        icon={TableIcon}
        title="No runs in the last 24 hours"
        description="Scheduled runs show here when they start."
      />
    </div>
  ),
};
