import { DataTable, type DataTableProps } from 'tabular-ui';

import { kasane } from '../data';

type Line = { id: string; label: string; yen: number };

const bridge = kasane.operatingBridge;
const lines: Line[] = [
  { id: 'budget', label: 'Budget', yen: bridge.budget },
  ...bridge.steps.map((step) => ({ id: step.id, label: step.label, yen: step.value })),
];

// No sorting: a bridge reads from budget to actual, and with no sort buttons in
// the header there's nothing here that waits for hydration (docs/site.md §12).
const columns: DataTableProps<Line>['columns'] = [
  { accessorKey: 'label', header: 'H1 operating profit', enableSorting: false, meta: { truncate: false } },
  {
    accessorKey: 'yen',
    header: 'Yen',
    size: 140,
    enableSorting: false,
    meta: { figure: { decimals: 0, unit: 'JPY' } },
  },
];

/**
 * The site's one double rule (docs/site.md D11): the bridge Lineage tree opens
 * down to, closing on the actual. The table draws the rule itself, because the
 * lines add up to the actual (design system §7.8).
 */
export function BridgeTable() {
  return <DataTable columns={columns} data={lines} totals={{ label: 'Actual', stated: { yen: bridge.actual } }} />;
}
