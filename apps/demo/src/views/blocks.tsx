import {
  AttachmentRow,
  CodeView,
  DataTable,
  LineageTree,
  MetricTile,
  RunLogRow,
  Sources,
  StatusBadge,
  type DataTableProps,
  type LineageNode,
} from 'tabular-ui';

import { ThreadLink } from '../components/ThreadLink';
import { useClose } from '../lib/close-context';
import { notCheckedWith } from '../lib/close-state';
import { docsOf, exceptions, type DmBlock } from '../lib/kasane';
import { sourcesOf } from '../lib/sources';
import { navigate } from '../lib/view';

const kb = (bytes: number) => `${Math.max(1, Math.round(bytes / 1024)).toLocaleString('en-US')} KB`;

type BridgeRow = Extract<DmBlock, { type: 'bridge' }>['rows'][number];
type EntryRow = Extract<DmBlock, { type: 'entries' }>['rows'][number];

/** A wrapped cell has no padding of its own: --pad-cell-y less the row's 1px rule, as the hero's entry does. */
const wrapped = (text: string) => <span className="block py-[calc(var(--pad-cell-y)-1px)]">{text}</span>;

const bridgeColumns: DataTableProps<BridgeRow>['columns'] = [
  {
    accessorKey: 'label',
    header: 'H1 operating profit',
    meta: { truncate: false },
    cell: ({ getValue }) => wrapped(getValue<string>()),
  },
  { accessorKey: 'yen', header: 'Yen', size: 132, meta: { figure: { decimals: 0, unit: 'JPY' } } },
];

type AgingRow = Extract<DmBlock, { type: 'aging' }>['rows'][number];
type LimitRow = Extract<DmBlock, { type: 'limitHistory' }>['rows'][number];

const yen = { figure: { decimals: 0, unit: 'JPY' } };
const agingColumns: DataTableProps<AgingRow>['columns'] = [
  { accessorKey: 'entity', header: 'Yen', meta: { content: 'mono' } },
  { accessorKey: 'notDue', header: 'Not due', meta: yen },
  { accessorKey: 'days1to60', header: '1–60 days', meta: yen },
  { accessorKey: 'over60', header: 'Over 60', meta: yen },
  { accessorKey: 'total', header: 'Total', meta: yen },
];

const dollars = (v: number) =>
  Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const limitColumns = (currency: string): DataTableProps<LimitRow>['columns'] => [
  {
    accessorKey: 'month',
    header: 'Month-end',
    cell: ({ getValue }) => <span className="tabular-nums">{getValue<string>()}</span>,
  },
  { accessorKey: 'balance', header: `Balance, ${currency}`, meta: { figure: { decimals: 2, unit: currency } } },
  {
    accessorKey: 'over',
    header: 'Against limit',
    // The variance column, so the one place polarity colour goes (§5). The sign says it too:
    // over the limit is the bad direction, within it the good one, and zero takes no hue.
    meta: { align: 'numeric' },
    cell: ({ getValue }) => {
      const over = getValue<number>();
      return (
        <span className={over > 0 ? 'text-text-danger' : over < 0 ? 'text-text-success' : undefined}>
          {over > 0 ? '+' : over < 0 ? '−' : ''}
          {dollars(over)}
        </span>
      );
    },
  },
];

type RunRow = Extract<DmBlock, { type: 'paymentRuns' }>['rows'][number];

const runColumns: DataTableProps<RunRow>['columns'] = [
  { accessorKey: 'entity', header: 'Company', size: 88, meta: { content: 'mono' } },
  { accessorKey: 'method', header: 'Method' },
  { accessorKey: 'payments', header: 'Payments', size: 96, meta: { figure: { decimals: 0, unit: 'payments' } } },
  // Each row in its own currency: the table reads the unit off the row, and never adds across them.
  { accessorKey: 'amount', header: 'Amount', meta: { figure: { decimals: 2, unit: (row) => row.currency } } },
  { accessorKey: 'currency', header: 'Currency', size: 88, meta: { content: 'mono' } },
];

/**
 * A duplicate's trail as a tree: the supplier's number, each entry of it, and
 * the payment against each. The second entry is the one that failed the rule.
 * A name opens the file its record is in, with the finding's records selected,
 * so no row is a control that does nothing.
 */
function PaymentTrail({ block }: { block: Extract<DmBlock, { type: 'paymentTrail' }> }) {
  const docOf: Record<string, string> = { [block.number]: 'supplier-invoices' };
  const nodes: LineageNode[] = [
    {
      id: block.number,
      name: block.number,
      meta: block.supplier,
      children: block.entries.map((e) => {
        docOf[e.entry] = 'supplier-invoices';
        docOf[e.payment] = 'supplier-payments';
        return {
          id: e.entry,
          name: e.entry,
          meta: <span className="tabular-nums">{`Entered ${e.entered}, ${e.amount}`}</span>,
          status: e.duplicate ? ('failed' as const) : undefined,
          children: [
            {
              id: e.payment,
              name: e.payment,
              meta: <span className="tabular-nums">{`Paid ${e.paidOn}, ${e.method}`}</span>,
            },
          ],
        };
      }),
    },
  ];
  return (
    <LineageTree
      nodes={nodes}
      onSelect={(node) => navigate({ kind: 'sources', source: docOf[node.id], item: block.finding })}
    />
  );
}

type CalendarRow = Extract<DmBlock, { type: 'calendar' }>['rows'][number];

/** The badge's word for a calendar row: what a close calendar says, not what a pipeline run does. */
const calendarLabel = { passed: 'Done', open: 'Open', queued: 'Scheduled' } as const;

const calendarColumns: DataTableProps<CalendarRow>['columns'] = [
  {
    accessorKey: 'item',
    header: 'Close calendar',
    meta: { truncate: false },
    cell: ({ getValue }) => wrapped(getValue<string>()),
  },
  {
    accessorKey: 'when',
    header: 'When',
    size: 96,
    // A text column, so the table doesn't set it: the dates stack, digit over digit.
    cell: ({ getValue }) => <span className="tabular-nums">{getValue<string>()}</span>,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    size: 112,
    cell: ({ row }) => <StatusBadge status={row.original.status}>{calendarLabel[row.original.status]}</StatusBadge>,
  },
];

const entryColumns: DataTableProps<EntryRow>['columns'] = [
  { accessorKey: 'entry', header: 'Entry', size: 150, meta: { content: 'mono' } },
  {
    accessorKey: 'date',
    header: 'Entered',
    size: 96,
    // A text column, so the table doesn't set it: the two dates stack, digit over digit.
    cell: ({ getValue }) => <span className="tabular-nums">{getValue<string>()}</span>,
  },
  {
    accessorKey: 'description',
    header: 'Description',
    meta: { truncate: false },
    cell: ({ getValue }) => wrapped(getValue<string>()),
  },
  { accessorKey: 'amount', header: 'Amount', size: 96, meta: { align: 'numeric' } },
  {
    id: 'check',
    header: 'Check',
    size: 104,
    // The second entry is the one paid again. The first was the invoice.
    cell: ({ row }) => (row.original.duplicate ? <StatusBadge status="failed">Duplicate</StatusBadge> : null),
  },
];

/**
 * What a message carries under its text, in a direct message or a channel. The
 * export resolved each block from the data, so this draws what it's given.
 */
export function MessageBlock({ block, at }: { block: DmBlock; at: string }) {
  switch (block.type) {
    case 'tiles':
      return (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-[var(--gap-group)]">
          {block.tiles.map((t) => {
            const base = {
              size: 'sm' as const,
              label: t.label,
              value: t.value,
              higherIsBetter: t.higherIsBetter,
              caption: t.caption,
            };
            // A delta comes with its number or not at all (MetricTile).
            return t.delta !== undefined && t.deltaValue !== undefined ? (
              <MetricTile key={t.label} {...base} delta={t.delta} deltaValue={t.deltaValue} />
            ) : (
              <MetricTile key={t.label} {...base} />
            );
          })}
        </div>
      );
    case 'bridge':
      return (
        <DataTable
          columns={bridgeColumns}
          data={block.rows}
          totals={{ label: block.total.label, stated: { yen: block.total.yen } }}
        />
      );
    case 'entries':
      return <DataTable columns={entryColumns} data={block.rows} />;
    case 'code':
      return (
        <CodeView language="sql" label={block.label} showLineNumbers>
          {block.code}
        </CodeView>
      );
    case 'sources':
      return <FindingSources finding={block.finding} />;
    case 'attachment':
      return (
        <AttachmentRow
          name={block.name}
          size={block.bytes === undefined ? undefined : kb(block.bytes)}
          timestamp={at}
        />
      );
    case 'aging': {
      const { notDue, days1to60, over60, total } = block.total;
      return (
        <DataTable
          columns={agingColumns}
          data={block.rows}
          totals={{ label: 'Group', stated: { notDue, days1to60, over60, total } }}
        />
      );
    }
    case 'limitHistory':
      return (
        <div className="flex flex-col gap-[var(--gap-bonded)]">
          <p className="text-sm text-text-secondary tabular-nums">
            {block.customer}, credit limit {block.limit.toLocaleString('en-US')} {block.currency}
          </p>
          <DataTable columns={limitColumns(block.currency)} data={block.rows} />
        </div>
      );
    case 'paymentRuns':
      return <DataTable columns={runColumns} data={block.rows} totals={{ sum: ['payments'] }} />;
    case 'paymentTrail':
      return <PaymentTrail block={block} />;
    case 'calendar':
      return <DataTable columns={calendarColumns} data={block.rows} />;
    case 'controlRun':
      return (
        <div>
          {block.rows.map((r) => (
            <RunLogRow
              key={r.entity}
              // No manual entry, so the rule had nothing to run on: neither passed nor failed.
              status={r.entries === 0 ? 'skipped' : r.failed.length ? 'failed' : 'passed'}
              name={r.entity}
              // The row's trailing figure: here how many entries the rule read, not how long it took.
              duration={`${r.entries} ${r.entries === 1 ? 'entry' : 'entries'}`}
              detail={
                r.failed.length
                  ? r.failed.map((f) => `${f.entry}: created and approved by ${f.by}`).join('\n')
                  : undefined
              }
              defaultOpen={r.failed.length > 0}
            />
          ))}
        </div>
      );
    case 'thread': {
      const finding = exceptions.find((e) => e.id === block.finding)!;
      return (
        <div>
          <ThreadLink task={finding} />
        </div>
      );
    }
  }
}

/** A finding's files, each opening at what it rests on, with what wasn't checked: as its card lists them. */
function FindingSources({ finding }: { finding: string }) {
  const { state } = useClose();
  const e = exceptions.find((x) => x.id === finding)!;
  return (
    <Sources numbered={false} sources={sourcesOf(e)} notChecked={notCheckedWith(state, docsOf(e), e.notChecked)} />
  );
}
