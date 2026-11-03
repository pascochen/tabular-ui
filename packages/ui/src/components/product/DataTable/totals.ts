import type { Column, ColumnDef, Row } from '@tanstack/react-table';

/**
 * The arithmetic behind DataTable's totals row (docs/design-system.md §7.8).
 *
 * A figure takes one path: number, then `toFixed`, then a whole count of its
 * last printed digit. The cell prints that count and the total adds it, so the
 * table adds exactly what it prints. Float addition would let re-sorting flip
 * the mark (0.1 + 0.2 + 0.3 and 0.3 + 0.2 + 0.1 are different numbers), and
 * rounding separately from printing would let the two part (`Math.round` and
 * `toFixed` disagree on 1.45). Nothing here reads a formatted figure back
 * (§8.6): the sign and the grouping go on last, at the print step.
 */

/** How a column of figures prints. DataTable prints it, and ignores the column's `cell`. */
export type Figure<TData> = {
  /** Digits printed after the point. 0 for yen or a row count, 2 for cents. */
  decimals: number;
  /**
   * What the column holds: one unit, or how to read it off a row. It is required
   * so a caller has to say. It isn't printed, so name a single unit in the header.
   * Rows in more than one unit are never added together.
   */
  unit: string | ((row: TData) => string);
};

export type DataTableTotals = {
  /** Names the row. While rows are hidden it reads "Subtotal, n of m rows" instead. */
  label?: string;
  /**
   * Column id to the total as your records state it. Pass a figure that comes from
   * somewhere other than these rows: the table adds the rows on display and draws
   * the double rule only when the two match, at the precision printed. No prop
   * sets the rule. A sum of these same rows passed here can only ever match, so it
   * belongs in `sum`.
   */
  stated?: Record<string, number>;
  /** Column ids to add up with nothing to check against. These never get the double rule. */
  sum?: string[];
};

export type ColumnTotal = {
  /** What the cell shows: a figure, or the word for why there isn't one. */
  text: string;
  /** The rows on display sum to the stated total. The only thing that draws the double rule. */
  foots: boolean;
  /** Stated minus the sum, printed. Null unless every part could be added and they miss. */
  difference: string | null;
};

export type TotalsRow = {
  label: string;
  cells: Map<string, ColumnTotal>;
};

/** `value` as a whole count of its last printed digit: 1234.5 at 2 decimals is 123450n. Null if it can't print. */
export function toUnits(value: unknown, decimals: number): bigint | null {
  // `toFixed` falls back to exponent form at 1e21, which BigInt can't read.
  if (typeof value !== 'number' || !Number.isFinite(value) || Math.abs(value) >= 1e21) return null;
  return BigInt(value.toFixed(decimals).replace('.', ''));
}

/** Those units as a cell shows them: grouped, with U+2212 on a negative (§8.6). A rounded -0.4 prints as 0. */
export function printUnits(units: bigint, decimals: number): string {
  const digits = (units < 0n ? -units : units).toString().padStart(decimals + 1, '0');
  const whole = digits.slice(0, digits.length - decimals).replace(/\B(?=(\d{3})+$)/g, ',');
  const fraction = decimals > 0 ? `.${digits.slice(-decimals)}` : '';
  return `${units < 0n ? '−' : ''}${whole}${fraction}`;
}

/** A body cell's text. A value that can't print leaves the cell empty, and the total counts it as missing. */
export function printFigure(value: unknown, decimals: number): string {
  const units = toUnits(value, decimals);
  return units === null ? '' : printUnits(units, decimals);
}

/**
 * One column's total, in one of three states, because a check that couldn't run
 * has neither passed nor failed: it foots, it misses by a printed difference, or
 * it can't be checked. Only the first draws the rule.
 */
export function columnTotal<TData>(
  rows: Row<TData>[],
  columnId: string,
  figure: Figure<TData>,
  stated: number | undefined,
  allShown: boolean,
): ColumnTotal {
  let sum = 0n;
  let incomplete = false;
  const units = new Set<string>();
  for (const row of rows) {
    // A grouped or expanded row isn't a part: its children are counted too.
    const nested = row.depth > 0 || row.subRows.length > 0;
    const part = nested ? null : toUnits(row.getValue(columnId), figure.decimals);
    if (part === null) incomplete = true;
    else sum += part;
    units.add(typeof figure.unit === 'function' ? figure.unit(row.original) : figure.unit);
  }
  const mixed = units.size > 1;
  const print = (value: bigint) => printUnits(value, figure.decimals);

  // A stated total describes every row, so it stands only while every row is shown.
  const statedUnits = allShown ? toUnits(stated, figure.decimals) : null;
  if (statedUnits !== null) {
    const checkable = !incomplete && !mixed;
    return {
      text: print(statedUnits),
      foots: checkable && sum === statedUnits,
      difference: checkable && sum !== statedUnits ? print(statedUnits - sum) : null,
    };
  }
  if (mixed) return { text: 'Mixed', foots: false, difference: null };
  if (incomplete) return { text: 'Incomplete', foots: false, difference: null };
  return { text: print(sum), foots: false, difference: null };
}

/**
 * The totals row for what the table is showing. `rows` is the whole row model,
 * every row left after filtering, scrolled into view or not: never the
 * virtualizer's window. Null when there is nothing to total.
 */
export function totalsRow<TData>(
  totals: DataTableTotals,
  rows: Row<TData>[],
  rowCount: number,
  columns: Column<TData, unknown>[],
): TotalsRow | null {
  if (rows.length === 0) return null;
  // Counts, not "is a filter set": a filter that hides nothing leaves every row
  // on display, and pagination hides rows with no filter at all.
  const allShown = rows.length === rowCount;
  const cells = new Map<string, ColumnTotal>();
  for (const column of columns) {
    const stated = totals.stated?.[column.id];
    if (stated === undefined && !totals.sum?.includes(column.id)) continue;
    const figure = column.columnDef.meta?.figure;
    if (!figure) {
      warnOnce(
        `DataTable: totals names column "${column.id}", which has no meta.figure, so it has no total. The table only totals figures it prints itself.`,
      );
      continue;
    }
    cells.set(column.id, columnTotal(rows, column.id, figure, stated, allShown));
  }
  if (cells.size === 0) return null;
  return {
    label: allShown
      ? (totals.label ?? 'Total')
      : `Subtotal, ${printUnits(BigInt(rows.length), 0)} of ${printUnits(BigInt(rowCount), 0)} rows`,
    cells,
  };
}

/** A column with `meta.figure` and its own `cell` could print something other than what gets checked. */
export function warnOnFigureCells<TData>(columns: ColumnDef<TData, unknown>[]) {
  for (const column of columns) {
    if ('columns' in column && column.columns) warnOnFigureCells(column.columns);
    if (column.meta?.figure && column.cell) {
      warnOnce(
        `DataTable: a column with meta.figure ignores its cell ("${column.id ?? column.header}"). The table prints figures itself, so what it checks is what shows.`,
      );
    }
  }
}

// Once per message, not per render: a table re-renders on every scroll.
const warned = new Set<string>();

function warnOnce(message: string) {
  // `?.`: this also renders under Node, on a server and in the Playwright specs,
  // where nothing defines import.meta.env.
  if (import.meta.env?.DEV && !warned.has(message)) {
    warned.add(message);
    console.warn(message);
  }
}
