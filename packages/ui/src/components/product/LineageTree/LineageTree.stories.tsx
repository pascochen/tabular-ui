import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { LineageTree, type LineageNode } from './index';

const meta = {
  title: 'Product/LineageTree',
  component: LineageTree,
  parameters: { layout: 'padded' },
  args: { nodes: [] },
} satisfies Meta<typeof LineageTree>;
export default meta;
type Story = StoryObj<typeof meta>;

const NODES: LineageNode[] = [
  {
    id: 'fct_gl_entries',
    name: 'fct_gl_entries',
    status: 'failed',
    meta: '1.2M rows',
    children: [
      {
        id: 'int_gl_normalised',
        name: 'int_gl_normalised',
        status: 'passed',
        meta: '1.2M',
        children: [
          { id: 'stg_sap__bkpf', name: 'stg_sap__bkpf', status: 'passed', meta: '412k' },
          { id: 'stg_sap__bseg', name: 'stg_sap__bseg', status: 'passed', meta: '2.1M' },
        ],
      },
      {
        id: 'dim_accounts',
        name: 'dim_accounts',
        status: 'failed',
        meta: '8.2k',
        children: [{ id: 'stg_sap__skat', name: 'stg_sap__skat', status: 'stale', meta: '8.2k' }],
      },
      { id: 'dim_calendar', name: 'dim_calendar', status: 'passed', meta: '3.7k' },
    ],
  },
];

/** 12px indent per level (§7.4) — enough to read, tight enough for six levels. */
export const Default: Story = { args: { nodes: NODES } };

export const WithSelection: Story = {
  render: function SelectionStory() {
    const [selected, setSelected] = useState('dim_accounts');
    return (
      <div
        style={{
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          maxWidth: 480,
        }}
      >
        <LineageTree nodes={NODES} selectedId={selected} onSelect={(n) => setSelected(n.id)} />
      </div>
    );
  },
};

/** Collapsed to the root — `aria-expanded` and `aria-level` carry the structure. */
export const Collapsed: Story = { args: { nodes: NODES, defaultExpanded: ['fct_gl_entries'] } };
