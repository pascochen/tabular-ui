import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { ArrowClockwiseIcon, DownloadSimpleIcon, FunnelIcon, PlusIcon, TrashIcon } from '@phosphor-icons/react';

import { Button } from '../../foundational/Button';
import { IconButton } from '../../foundational/IconButton';
import { Input } from '../../foundational/Input';
import { FilterChip } from '../FilterChip';
import { Toolbar, ToolbarSeparator, ToolbarSpacer } from './index';

const meta = { title: 'Product/Toolbar', component: Toolbar, parameters: { layout: 'padded' } } satisfies Meta<
  typeof Toolbar
>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Toolbar>
      <Button size="sm">
        <PlusIcon />
        New model
      </Button>
      <Button size="sm" variant="outline">
        <ArrowClockwiseIcon />
        Run all
      </Button>
      <ToolbarSeparator />
      <Input size="sm" placeholder="Filter models…" style={{ width: 200 }} />
      <ToolbarSpacer />
      <IconButton size="sm" aria-label="Download as CSV">
        <DownloadSimpleIcon />
      </IconButton>
    </Toolbar>
  ),
};

/** With applied filters. The band is neutral; only a selected chip carries a hue. */
export const WithFilters: Story = {
  render: function WithFiltersStory() {
    const [filters, setFilters] = useState([
      { field: 'Owner', value: 'a.kanzaki' },
      { field: 'Status', value: 'failed' },
      { field: 'Schema', value: 'analytics_marts' },
    ]);
    return (
      <Toolbar>
        <FunnelIcon
          weight="bold"
          aria-hidden="true"
          className="text-text-secondary"
          style={{ width: 14, height: 14 }}
        />
        {filters.map((f) => (
          <FilterChip
            key={f.field}
            field={f.field}
            value={f.value}
            dismissLabel={`Remove ${f.field} filter`}
            onDismiss={() => setFilters((s) => s.filter((x) => x.field !== f.field))}
          />
        ))}
        {filters.length === 0 ? (
          <span className="text-text-secondary" style={{ fontSize: 'var(--text-xs)' }}>
            No filters
          </span>
        ) : null}
        <ToolbarSpacer />
        <Button size="sm" variant="ghost" onClick={() => setFilters([])}>
          Clear all
        </Button>
      </Toolbar>
    );
  },
};

/** Selection mode — the one place a destructive action belongs in a toolbar. */
export const SelectionMode: Story = {
  render: () => (
    <Toolbar>
      <span
        className="text-text-body"
        style={{ fontSize: 'var(--text-sm)', fontVariantNumeric: 'var(--font-numeric)' }}
      >
        3 selected
      </span>
      <ToolbarSeparator />
      <Button size="sm" variant="outline">
        <ArrowClockwiseIcon />
        Re-run
      </Button>
      <Button size="sm" variant="danger">
        <TrashIcon />
        Delete 3 models
      </Button>
      <ToolbarSpacer />
      <Button size="sm" variant="ghost">
        Clear selection
      </Button>
    </Toolbar>
  ),
};

/** `bare` for a toolbar already inside a bordered container. */
export const Bare: Story = {
  render: () => (
    <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
      <Toolbar variant="bare" className="border-b border-border">
        <Button size="sm" variant="ghost">
          <ArrowClockwiseIcon />
          Refresh
        </Button>
        <ToolbarSpacer />
        <IconButton size="sm" aria-label="Download as CSV">
          <DownloadSimpleIcon />
        </IconButton>
      </Toolbar>
      <div style={{ padding: 'var(--pad-card)', fontSize: 'var(--text-sm)' }} className="text-text-secondary">
        Panel content
      </div>
    </div>
  ),
};
