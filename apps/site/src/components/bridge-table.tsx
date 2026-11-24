import { DataTable } from 'tabular-ui';

import { bridgeColumns, bridgeLines, bridgeTotals } from '../bridge';

/**
 * The site's one double rule (docs/site.md D11): the bridge Lineage tree opens
 * down to, closing on the actual. The table draws the rule itself, because the
 * lines add up to the actual (design system §7.8).
 */
export function BridgeTable() {
  return <DataTable columns={bridgeColumns} data={bridgeLines} totals={bridgeTotals} />;
}
