import type { DataTableProps } from 'tabular-ui';

import { kasane } from './data';

/** H1 operating profit, budget to actual: the lines Lineage tree's bridge table reads (D11). */
export type BridgeLine = { id: string; label: string; yen: number };

const bridge = kasane.operatingBridge;
/** Budget, then each step to the actual. The Motion page's copy wash uses the lines alone, with no total (D11). */
export const bridgeLines: BridgeLine[] = [
  { id: 'budget', label: 'Budget', yen: bridge.budget },
  ...bridge.steps.map((step) => ({ id: step.id, label: step.label, yen: step.value })),
];

// No sorting: a bridge reads from budget to actual, and with no sort buttons in
// the header there's nothing here that waits for hydration (docs/site.md §12).
export const bridgeColumns: DataTableProps<BridgeLine>['columns'] = [
  { accessorKey: 'label', header: 'H1 operating profit', enableSorting: false, meta: { truncate: false } },
  {
    accessorKey: 'yen',
    header: 'Yen',
    size: 140,
    enableSorting: false,
    meta: { figure: { decimals: 0, unit: 'JPY' } },
  },
];

/** The stated total the lines must reach: the actual. */
export const bridgeTotals = { label: 'Actual', stated: { yen: bridge.actual } };
