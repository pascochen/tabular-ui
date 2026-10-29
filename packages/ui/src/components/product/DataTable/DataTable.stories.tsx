import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ColumnDef } from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';

import { Button } from '../../foundational/Button';
import { Checkbox } from '../../foundational/Checkbox';
import { IconButton } from '../../foundational/IconButton';
import { Input } from '../../foundational/Input';
import { StatusBadge } from '../StatusBadge';
import { runStatusRowTreatment, type RunStatus } from '../StatusBadge/statuses';
import { DataTable } from './index';
import { DotsThreeIcon } from '@phosphor-icons/react';

/** Mode is driven by the toolbar Theme control. Dark is canonical. */
/**
 * `component` is deliberately omitted: DataTable is generic, and Storybook's
 * arg inference resolves `typeof DataTable` to `unknown` data, which then
 * demands `args` on every story. All stories render explicitly anyway.
 */
const meta = {
  title: 'Product/DataTable',
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;
type Story = StoryObj;

type Model = {
  model: string;
  status: RunStatus;
  rows: number;
  duration: number;
  variance: number;
  owner: string;
};

const STATUSES: RunStatus[] = [
  'passed',
  'failed',
  'running',
  'stale',
  'queued',
  'agent-proposed',
  'skipped',
  'needs-review',
];
const OWNERS = ['a.kanzaki', 's.kurosawa', 'n.okabe', 's.morimoto'];

function makeRows(n: number): Model[] {
  return Array.from({ length: n }, (_, i) => ({
    model: `${['fct', 'dim', 'stg_sap', 'int'][i % 4]}_${['gl_entries', 'accounts', 'bkpf', 'fx_rates_daily', 'ap_aging', 'cost_centers'][i % 6]}_${i}`,
    status: STATUSES[i % STATUSES.length],
    rows: Math.floor(Math.abs(Math.sin(i) * 2_400_000)),
    duration: Math.abs(Math.cos(i) * 900),
    variance: Math.sin(i * 1.7) * 18.4,
    owner: OWNERS[i % OWNERS.length],
  }));
}

const columns: ColumnDef<Model, unknown>[] = [
  { accessorKey: 'model', header: 'Model', meta: { content: 'mono' }, size: 260 },
  {
    accessorKey: 'status',
    header: 'Status',
    size: 150,
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    accessorKey: 'rows',
    header: 'Rows',
    meta: { align: 'numeric' },
    size: 110,
    cell: ({ getValue }) => (getValue() as number).toLocaleString('en-US'),
  },
  {
    accessorKey: 'duration',
    header: 'Duration',
    meta: { align: 'numeric' },
    size: 100,
    cell: ({ getValue }) => `${(getValue() as number).toFixed(1)}s`,
  },
  {
    accessorKey: 'variance',
    header: 'Variance',
    meta: { align: 'numeric' },
    size: 100,
    // §5 — polarity colour on variance and delta columns ONLY, never on
    // every figure. Zero is neutral, never a hue.
    cell: ({ getValue }) => {
      const v = getValue() as number;
      const cls = v > 0.05 ? 'text-text-success' : v < -0.05 ? 'text-text-danger' : 'text-text-secondary';
      return (
        <span className={cls}>
          {v > 0 ? '+' : ''}
          {v.toFixed(1)}%
        </span>
      );
    },
  },
  { accessorKey: 'owner', header: 'Owner', size: 110 },
];

/** 28px rows, sticky neutral header, sortable columns, tabular figures. */
export const Default: Story = {
  render: () => (
    <div style={{ height: 420 }}>
      <DataTable
        columns={columns}
        data={makeRows(24)}
        rowClassName={(row) => runStatusRowTreatment[row.original.status]}
      />
    </div>
  ),
};

/** 50,000 rows, windowed. Scroll — the row height must not drift. */
export const Virtualized: Story = {
  render: function VirtualizedStory() {
    const data = useMemo(() => makeRows(50_000), []);
    return (
      <div style={{ height: 480 }}>
        <DataTable columns={columns} data={data} rowClassName={(row) => runStatusRowTreatment[row.original.status]} />
      </div>
    );
  },
};

/** Filtering, selection and a row action — the full dense surface. */
export const WithSelectionAndFilter: Story = {
  render: function FullStory() {
    const [query, setQuery] = useState('');
    const [selected, setSelected] = useState<Record<string, boolean>>({});
    const data = useMemo(() => makeRows(60), []);

    const cols = useMemo<ColumnDef<Model, unknown>[]>(
      () => [
        {
          id: 'select',
          size: 36,
          // No visible header, but never an empty one: a screen reader names
          // each cell by its column, and "blank" names nothing.
          header: () => <span className="sr-only">Select</span>,
          meta: { truncate: false },
          cell: ({ row }) => (
            <Checkbox
              size="sm"
              checked={!!selected[row.id]}
              onCheckedChange={(v) => setSelected((s) => ({ ...s, [row.id]: !!v }))}
              aria-label={`Select ${row.original.model}`}
            />
          ),
        },
        ...columns,
        {
          id: 'actions',
          size: 40,
          header: () => <span className="sr-only">Actions</span>,
          meta: { truncate: false },
          cell: ({ row }) => (
            <IconButton size="sm" aria-label={`Actions for ${row.original.model}`}>
              <DotsThreeIcon />
            </IconButton>
          ),
        },
      ],
      [selected],
    );

    const count = Object.values(selected).filter(Boolean).length;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-field)', height: 460 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap-inline)' }}>
          <Input
            size="sm"
            placeholder="Filter models…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ width: 240 }}
          />
          <span
            className="text-text-secondary"
            style={{ fontSize: 'var(--text-xs)', fontVariantNumeric: 'var(--font-numeric)' }}
          >
            {count > 0 ? `${count} selected` : `${data.length} ${data.length === 1 ? 'model' : 'models'}`}
          </span>
        </div>
        <div style={{ flex: 1, minHeight: 0 }}>
          <DataTable
            columns={cols}
            data={data}
            globalFilter={query}
            rowClassName={(row) => runStatusRowTreatment[row.original.status]}
            empty={`No models match “${query}”.`}
          />
        </div>
      </div>
    );
  },
};

/**
 * Whole-row activation, with the keyboard path it needs. The row is the
 * pointer's shortcut; the model name is a real button that does the same
 * thing, and a click on it opens the row once, not twice.
 */
export const ClickableRows: StoryObj<{ onOpen: (model: string) => void }> = {
  args: { onOpen: fn() },
  render: function ClickableStory(args) {
    const [opened, setOpened] = useState<string | null>(null);
    const data = useMemo(() => makeRows(8), []);
    const open = (model: string) => {
      setOpened(model);
      args.onOpen(model);
    };

    const cols: ColumnDef<Model, unknown>[] = [
      {
        accessorKey: 'model',
        header: 'Model',
        meta: { content: 'mono' },
        size: 260,
        cell: ({ row }) => (
          <Button variant="inline" className="max-w-full shrink" onClick={() => open(row.original.model)}>
            <span className="truncate">{row.original.model}</span>
          </Button>
        ),
      },
      ...columns.slice(1),
    ];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-field)', height: 320 }}>
        <p role="status" className="text-xs text-text-secondary">
          {opened ? `Opened ${opened}` : 'No model open'}
        </p>
        <div style={{ flex: 1, minHeight: 0 }}>
          <DataTable columns={cols} data={data} onRowClick={(row) => open(row.original.model)} />
        </div>
      </div>
    );
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const status = canvas.getByRole('status');

    // The pointer: anywhere on the row.
    await userEvent.click(canvas.getAllByRole('cell', { name: 'a.kanzaki' })[0]);
    await expect(status).toHaveTextContent('Opened fct_gl_entries_0');

    // The keyboard: the identifier is a tab stop that opens the same row.
    const second = canvas.getByRole('button', { name: 'dim_accounts_1' });
    second.focus();
    await userEvent.keyboard('{Enter}');
    await expect(status).toHaveTextContent('Opened dim_accounts_1');

    // A click on the identifier is the button's, not the row's as well.
    await userEvent.click(canvas.getByRole('button', { name: 'stg_sap_bkpf_2' }));
    await expect(status).toHaveTextContent('Opened stg_sap_bkpf_2');
    // One call per open. Enter on the button and a click on it each bubble to
    // the row; without the row's control guard this would be 5.
    await expect(args.onOpen).toHaveBeenCalledTimes(3);
  },
};

/** Empty state — a table with no rows and no explanation reads as broken. */
export const Empty: Story = {
  render: () => (
    <div style={{ height: 240 }}>
      <DataTable columns={columns} data={[]} empty="No models in this project yet." />
    </div>
  ),
};
