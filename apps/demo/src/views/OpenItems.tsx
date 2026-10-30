import { Badge, DataTable, type DataTableProps } from 'tabular-ui';

import { findings } from '../lib/kasane';

type Item = { id: string; kind: 'Gap' | 'Follow-up'; text: string; sources: string[] };

/** What onboarding left open: the material's gaps, then the questions to ask. From findings.json. */
const items: Item[] = [
  ...findings.gaps.map((g) => ({ id: g.id, kind: 'Gap' as const, text: g.text, sources: g.sources })),
  ...findings.followUps.map((f) => ({ id: f.id, kind: 'Follow-up' as const, text: f.text, sources: f.sources })),
];

const columns: DataTableProps<Item>['columns'] = [
  {
    accessorKey: 'kind',
    header: 'Kind',
    size: 104,
    // Neutral: a gap is a kind of item, not a state (§0 rule 1).
    cell: ({ getValue }) => <Badge>{getValue<string>()}</Badge>,
  },
  // The item is the whole point of the row, so it wraps rather than truncates.
  { accessorKey: 'text', header: 'Item', meta: { truncate: false } },
  {
    id: 'sources',
    header: 'Sources',
    size: 96,
    accessorFn: (row) => row.sources.length,
    meta: { align: 'numeric' },
    cell: ({ getValue }) => `${getValue<number>()} ${getValue<number>() === 1 ? 'file' : 'files'}`,
  },
];

/**
 * #open-items: the gaps and follow-ups onboarding found, as a plain table. The
 * plan's phase 8 adds filters and a row detail in the panel; until then the
 * list is real, and nothing on it is a dead end.
 */
export function OpenItemsChannel() {
  return <DataTable columns={columns} data={items} />;
}
