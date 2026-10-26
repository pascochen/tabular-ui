import kasane from '../data/kasane.json';
import { isCurrency, money } from './lib/format';

/**
 * Every Kasane figure, ID, file name and date the site shows comes from here:
 * data/kasane.json, written by apps/demo/scripts/export-fixtures.mjs from the
 * Kasane dataset (docs/site.md §5). Nothing in src/ types a figure.
 */
export { kasane };

const duplicate = kasane.duplicatePayment;
if (!isCurrency(duplicate.currency)) throw new Error(`Unknown currency in kasane.json: ${duplicate.currency}`);

/** The hero's story (docs/site.md D5): one supplier invoice, entered and paid twice. */
export const duplicatePayment = {
  ...duplicate,
  currency: duplicate.currency,
  /** The second entry, the one the agent proposes to reverse. */
  reverse: duplicate.entries[duplicate.entries.length - 1],
  amountLabel: money(duplicate.amount, duplicate.currency),
};

const bridge = kasane.operatingBridge;
const step = (id: string) => {
  const found = bridge.steps.find((s) => s.id === id);
  if (!found) throw new Error(`kasane.json's operating bridge has no step "${id}"`);
  return found.value;
};

/**
 * The H1 operating profit gap, for the explaining specimens (D5). Sums are
 * taken on exact yen and formatted once, so ¥41m and ¥275m never claim to
 * make ¥316m (D5, point 3).
 */
export const h1Gap = {
  shortfall: bridge.budget - bridge.actual,
  exchangeRates: -(step('fx-subsidiaries') + step('fx-intercompany')),
};

/** A pack file's name, failing the build if the export stops producing it. */
export function packFile(name: string): string {
  if (!kasane.pack.some((f) => f.name === name)) throw new Error(`kasane.json's pack has no file named ${name}`);
  return name;
}
