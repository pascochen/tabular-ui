import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ColumnDef } from '@tanstack/react-table';
import { useCallback, useMemo, useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';

import { Button } from '../../foundational/Button';
import { Checkbox } from '../../foundational/Checkbox';
import { IconButton } from '../../foundational/IconButton';
import { Input } from '../../foundational/Input';
import { operatingBridge, segmentsH1 } from '../../../fixtures/kasane';
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
          {v > 0 ? '+' : v < 0 ? '−' : ''}
          {Math.abs(v).toFixed(1)}%
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

const bridgeColumns: ColumnDef<(typeof operatingBridge.steps)[number], unknown>[] = [
  { accessorKey: 'label', header: 'Step', size: 400 },
  {
    accessorKey: 'value',
    header: 'Against budget',
    meta: { align: 'numeric' },
    size: 140,
    cell: ({ getValue }) => {
      const v = getValue() as number;
      return `${v < 0 ? '−' : ''}¥${Math.abs(v).toLocaleString('en-US')}`;
    },
  },
];

/**
 * Exact, signed figures. A negative takes U+2212 on screen and a hyphen on the
 * clipboard, and a double-click takes the whole figure, sign included (§8.6).
 */
export const SignedFigures: Story = {
  render: () => (
    <div style={{ height: 198 }}>
      <DataTable columns={bridgeColumns} data={operatingBridge.steps} />
    </div>
  ),
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
  render: function ClickableStory({ onOpen }) {
    const [opened, setOpened] = useState<string | null>(null);
    const [opens, setOpens] = useState(0);
    const data = useMemo(() => makeRows(8), []);
    const open = useCallback(
      (model: string) => {
        setOpened(model);
        setOpens((count) => count + 1);
        onOpen(model);
      },
      [onOpen],
    );

    // Stable, because TanStack renders `cell` as a component: a new function on
    // every render remounts the identifier, and each open dropped focus to <body>.
    const cols = useMemo<ColumnDef<Model, unknown>[]>(
      () => [
        {
          accessorKey: 'model',
          header: 'Model',
          meta: { content: 'mono' },
          size: 260,
          // The text directly, with no <span>: a child of Button is a flex item,
          // and a copied row breaks in two around one. See the README.
          cell: ({ row }) => (
            <Button
              variant="inline"
              className="inline-block max-w-full truncate"
              onClick={() => open(row.original.model)}
            >
              {row.original.model}
            </Button>
          ),
        },
        ...columns.slice(1),
      ],
      [open],
    );

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-field)', height: 320 }}>
        {/* `data-opens` is what data-table-selection.spec.ts counts: the text reads
            the same when one row opens twice. */}
        <p role="status" data-opens={opens} className="text-xs text-text-secondary">
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

type BridgeLine = { id: string; label: string; yen: number };

const bridgeLines: BridgeLine[] = [
  { id: 'budget', label: 'Budget', yen: operatingBridge.budget },
  ...operatingBridge.steps.map((step) => ({ id: step.id, label: step.label, yen: step.value })),
];

const bridgeLineColumns: ColumnDef<BridgeLine, unknown>[] = [
  { accessorKey: 'label', header: 'H1 operating profit' },
  { accessorKey: 'yen', header: 'Yen', size: 140, meta: { figure: { decimals: 0, unit: 'JPY' } } },
];

const noDoubleRule = (canvasElement: HTMLElement) =>
  expect(
    [...canvasElement.querySelectorAll('tfoot span')].filter((s) => getComputedStyle(s).borderBottomStyle === 'double'),
  ).toHaveLength(0);

/**
 * The bridge foots: budget plus its six steps is the actual, which comes from the
 * ledger rather than from these rows. The table adds them and draws the double
 * rule under the figure. No prop asks for it.
 */
export const TotalThatFoots: Story = {
  render: () => (
    <div style={{ height: 320 }}>
      <DataTable
        columns={bridgeLineColumns}
        data={bridgeLines}
        totals={{ label: 'Actual', stated: { yen: operatingBridge.actual } }}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const figure = within(canvasElement).getByText('2,192,778,193');
    await expect(getComputedStyle(figure).borderBottomStyle).toBe('double');
    await expect(within(canvasElement).queryByText('Difference')).toBeNull();
  },
};

const segmentColumns: ColumnDef<(typeof segmentsH1)[number], unknown>[] = [
  { accessorKey: 'segment', header: 'H1 by segment' },
  { accessorKey: 'externalSales', header: 'External sales', size: 150, meta: { figure: { decimals: 0, unit: 'JPY' } } },
  {
    accessorKey: 'operatingProfit',
    header: 'Operating profit',
    size: 150,
    meta: { figure: { decimals: 0, unit: 'JPY' } },
  },
];

/**
 * A segment table that left out "Adjustments and eliminations". External sales
 * still foot, because that line's sales are zero, so that figure keeps its rule.
 * Operating profit misses by exactly that line's profit: no rule, and the
 * difference in words a reader can select. The stated figure stays, because the
 * rows are what's wrong.
 */
export const OneColumnDoesNotFoot: Story = {
  render: () => {
    const consolidated = segmentsH1.find((s) => s.segment === 'Consolidated')!;
    const shown = segmentsH1.filter((s) => s !== consolidated && !s.segment.startsWith('Adjustments'));
    return (
      <div style={{ height: 280 }}>
        <DataTable
          columns={segmentColumns}
          data={shown}
          totals={{
            stated: { externalSales: consolidated.externalSales, operatingProfit: consolidated.operatingProfit },
          }}
        />
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(getComputedStyle(canvas.getByText('34,436,068,352')).borderBottomStyle).toBe('double');
    await expect(getComputedStyle(canvas.getByText('2,192,778,193')).borderBottomStyle).not.toBe('double');
    await expect(canvas.getByText('Difference')).toBeVisible();
    await expect(canvas.getByText('214,140,479')).toBeVisible();
  },
};

/**
 * D5's footing error, caught. Each step prints rounded to the million, so the
 * table adds what shows: −41 and −275 make −316, against a stated −317. A rounding gap is
 * still a gap, so it gets no tolerance. `docs/site.md` D5 is why figures beside
 * their parts are exact.
 */
export const RoundedPartsDoNotFoot: Story = {
  render: () => {
    const fx = operatingBridge.steps.filter((step) => step.id.startsWith('fx-'));
    return (
      <div style={{ height: 160 }}>
        <DataTable
          columns={[
            { accessorKey: 'label', header: 'Exchange rates' },
            {
              accessorKey: 'millions',
              header: 'Yen, millions',
              size: 140,
              meta: { figure: { decimals: 0, unit: 'JPY' } },
            },
          ]}
          data={fx.map((step) => ({ label: step.label, millions: step.value / 1e6 }))}
          totals={{ stated: { millions: fx.reduce((sum, step) => sum + step.value, 0) / 1e6 } }}
        />
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('−317')).toBeVisible();
    await expect(canvas.getByText('Difference')).toBeVisible();
    await noDoubleRule(canvasElement);
  },
};

/**
 * Rows hidden by a filter make it a subtotal of what's shown, and the stated total
 * steps aside, because it describes rows that aren't on screen. Clear the filter
 * and the actual and its rule come back.
 */
export const TotalWhileFiltered: Story = {
  render: function FilteredTotalStory() {
    const [query, setQuery] = useState('Exchange');
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-field)', height: 300 }}>
        <Input
          size="sm"
          aria-label="Filter the bridge"
          placeholder="Filter the bridge…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ width: 240 }}
        />
        <div style={{ flex: 1, minHeight: 0 }}>
          <DataTable
            columns={bridgeLineColumns}
            data={bridgeLines}
            globalFilter={query}
            totals={{ label: 'Actual', stated: { yen: operatingBridge.actual } }}
          />
        </div>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Subtotal, 2 of 7 rows')).toBeVisible();
    await expect(canvas.queryByText('Actual')).toBeNull();
    await noDoubleRule(canvasElement);
  },
};

const invoices = [
  { invoice: 'MFL-58821', usd: 48216.4 },
  { invoice: 'MFL-58907', usd: 1204.1 },
  { invoice: 'MFL-59012', usd: 33.3 },
  { invoice: 'MFL-59140', usd: 2750.05 },
];

/**
 * Cents, and a sortable column. These four add to a different float depending on
 * the order they're added in, so a float sum would lose the rule on one sort
 * direction. The table adds integers, so sorting changes nothing.
 */
export const TotalWithCents: Story = {
  render: () => (
    <div style={{ height: 200 }}>
      <DataTable
        columns={[
          { accessorKey: 'invoice', header: 'Invoice', meta: { content: 'mono' } },
          { accessorKey: 'usd', header: 'USD', size: 140, meta: { figure: { decimals: 2, unit: 'USD' } } },
        ]}
        data={invoices}
        totals={{ stated: { usd: 52203.85 } }}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(getComputedStyle(within(canvasElement).getByText('52,203.85')).borderBottomStyle).toBe('double');
  },
};

/**
 * One wide figure, thousands of rows down. A windowed table measures only the rows
 * it renders, so each figure column reserves room for its widest figure, and the
 * columns hold still when this one scrolls in. It's never clipped, even in a
 * column sized narrower than it.
 */
export const WideFigureFarDown: Story = {
  render: function WideFigureStory() {
    const data = useMemo(
      () =>
        Array.from({ length: 5000 }, (_, i) => ({ label: `Line ${i + 1}`, yen: i === 3000 ? 123456789012345 : 12 })),
      [],
    );
    return (
      <div style={{ height: 300 }}>
        <DataTable
          columns={[
            { accessorKey: 'label', header: 'Line' },
            { accessorKey: 'yen', header: 'Yen', meta: { figure: { decimals: 0, unit: 'JPY' } } },
            {
              id: 'narrow',
              accessorFn: (row) => row.yen,
              header: 'Sized 80',
              size: 80,
              meta: { figure: { decimals: 0, unit: 'JPY' } },
            },
          ]}
          data={data}
        />
      </div>
    );
  },
};

type Charge = {
  team: string;
  hours: number;
  currency: string;
  amount: number | null;
  fees: number | null;
  net: number | null;
};

const charges: Charge[] = [
  { team: 'Close', hours: 12.5, currency: 'JPY', amount: 420000, fees: 1200, net: 418800 },
  { team: 'Treasury', hours: 8, currency: 'USD', amount: 2750.05, fees: null, net: null },
  { team: 'Tax', hours: 3.5, currency: 'JPY', amount: 96000, fees: 300, net: 95700 },
];

/**
 * Three totals that claim nothing. Hours is a plain `sum`, with nothing to check
 * it against. Amount holds two currencies, so it isn't added at all. Net has a
 * stated figure, but a part is missing, so a check couldn't run: no rule and no
 * Difference, because a check that hasn't run hasn't failed.
 */
export const TotalsThatCannotBeChecked: Story = {
  render: () => (
    <div style={{ height: 200 }}>
      <DataTable
        columns={[
          { accessorKey: 'team', header: 'Team' },
          { accessorKey: 'hours', header: 'Hours', size: 90, meta: { figure: { decimals: 1, unit: 'hours' } } },
          { accessorKey: 'currency', header: 'Currency', size: 90 },
          {
            accessorKey: 'amount',
            header: 'Amount',
            size: 110,
            meta: { figure: { decimals: 0, unit: (row: Charge) => row.currency } },
          },
          { accessorKey: 'fees', header: 'Fees', size: 110, meta: { figure: { decimals: 0, unit: 'JPY' } } },
          { accessorKey: 'net', header: 'Net', size: 110, meta: { figure: { decimals: 0, unit: 'JPY' } } },
        ]}
        data={charges}
        totals={{ stated: { net: 514500 }, sum: ['hours', 'amount', 'fees'] }}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('24.0')).toBeVisible();
    await expect(canvas.getByText('Mixed')).toBeVisible();
    await expect(canvas.getByText('Incomplete')).toBeVisible();
    await expect(canvas.getByText('514,500')).toBeVisible();
    await expect(canvas.queryByText('Difference')).toBeNull();
    await noDoubleRule(canvasElement);
  },
};

/**
 * 50,000 rows, windowed. The total covers every row, not the few in the DOM, and
 * stays in view. The row sits outside the virtualized rows, so scrolling can't
 * drift. `rows` is stated here to show the check at this size; in a product the
 * figure comes from the source.
 */
export const TotalOverManyRows: Story = {
  render: function ManyRowsTotalStory() {
    const data = useMemo(() => makeRows(50_000), []);
    const stated = useMemo(() => data.reduce((sum, row) => sum + row.rows, 0), [data]);
    const cols = useMemo<ColumnDef<Model, unknown>[]>(
      () => [
        {
          accessorKey: 'model',
          header: 'Model',
          meta: { content: 'mono' },
          cell: ({ row }) => (
            <Button variant="inline" className="max-w-full shrink">
              <span className="truncate">{row.original.model}</span>
            </Button>
          ),
        },
        { accessorKey: 'rows', header: 'Rows', size: 140, meta: { figure: { decimals: 0, unit: 'rows' } } },
        {
          accessorKey: 'duration',
          header: 'Duration, s',
          size: 140,
          meta: { figure: { decimals: 1, unit: 'seconds' } },
        },
      ],
      [],
    );
    return (
      <div style={{ height: 320 }}>
        <DataTable columns={cols} data={data} totals={{ stated: { rows: stated }, sum: ['duration'] }} />
      </div>
    );
  },
};
