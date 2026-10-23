import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { FilterChip } from './index';

const meta = {
  title: 'Product/FilterChip',
  component: FilterChip,
  parameters: { layout: 'padded' },
  args: { field: 'Owner', value: 'a.kanzaki' },
} satisfies Meta<typeof FilterChip>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { field: 'Owner', value: 'a.kanzaki' } };

/** The field/value split is the point — "a.kanzaki" alone is a guess. */
export const Applied: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--gap-chip)', flexWrap: 'wrap' }}>
      <FilterChip field="Owner" value="a.kanzaki" />
      <FilterChip field="Status" value="failed" />
      <FilterChip field="Schema" value="analytics_marts" />
      <FilterChip field="Period" value="Q2 FY2026" />
    </div>
  ),
};

/** Selected uses the interactive role — selection IS interactive (§4). */
export const Selected: Story = {
  render: function SelectedStory() {
    const [on, setOn] = useState(true);
    return <FilterChip field="Status" value="failed" selected={on} onClick={() => setOn((v) => !v)} />;
  },
};

export const Dismissible: Story = {
  render: function DismissibleStory() {
    const [chips, setChips] = useState([
      { field: 'Owner', value: 'a.kanzaki' },
      { field: 'Status', value: 'failed' },
      { field: 'Schema', value: 'analytics_marts' },
    ]);
    return (
      <div style={{ display: 'flex', gap: 'var(--gap-chip)', flexWrap: 'wrap', alignItems: 'center' }}>
        {chips.map((c) => (
          <FilterChip
            key={c.field}
            field={c.field}
            value={c.value}
            dismissLabel={`Remove ${c.field} filter`}
            onDismiss={() => setChips((s) => s.filter((x) => x.field !== c.field))}
          />
        ))}
        {chips.length === 0 ? (
          <span className="text-text-secondary" style={{ fontSize: 'var(--text-xs)' }}>
            No filters
          </span>
        ) : null}
      </div>
    );
  },
};

/** Neutral even when filtering for a state — the chip is not itself failing. */
export const NeutralByDesign: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--gap-chip)' }}>
      <FilterChip field="Status" value="failed" />
      <FilterChip field="Status" value="passed" />
      <FilterChip field="Status" value="stale" />
    </div>
  ),
};
