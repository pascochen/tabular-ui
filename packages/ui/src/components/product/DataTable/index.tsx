import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type Column,
  type ColumnDef,
  type Row,
  type SortingState,
  type TableOptions,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { CaretDownIcon, CaretUpDownIcon, CaretUpIcon } from '@phosphor-icons/react';
import { useMemo, useRef, useState } from 'react';

import { cn } from '../../../lib/utils';
import { Button } from '../../foundational/Button';
import { printFigure, totalsRow, warnOnFigureCells, type DataTableTotals, type Figure, type TotalsRow } from './totals';

/**
 * Column metadata the table reads. Declared as a module augmentation so
 * `meta.align` is type-checked at the call site rather than being a loose
 * record — a numeric column that forgets `align` loses `tabular-nums`, and
 * §0 rule 6 calls that a correctness hazard.
 *
 * It lives HERE, not in a sibling .d.ts: this file is a module, so the
 * augmentation travels with the import graph. The previous meta.d.ts was
 * only loaded through the root tsconfig's `include: ["src"]` — a workspace
 * consumer compiling Tabular UI as source never saw it, and `meta.align` failed to
 * type-check in every consuming app. Found by the journey app's first build.
 */
declare module '@tanstack/react-table' {
  // TValue is required by the interface signature we are augmenting, even though
  // this declaration does not reference it.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    /** `numeric` right-aligns and applies tabular-nums. Use for every figure. */
    align?: 'text' | 'numeric';
    /** `mono` renders identifiers in --font-mono, one step down (§8.3). */
    content?: 'text' | 'mono';
    /** Cells truncate by default; set false for cells that must wrap. */
    truncate?: boolean;
    /**
     * The table prints this column itself, and its `cell` is ignored, so what
     * `totals` checks is what shows. Right-aligned and tabular, and never
     * truncated: a clipped figure reads as a different figure.
     */
    figure?: Figure<TData>;
  }
}

export type DataTableProps<TData> = {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  /**
   * Rows above this count are virtualized. Below it the table renders every
   * row, which keeps Cmd-F and screen-reader row counts working on the small
   * tables where virtualization buys nothing.
   */
  virtualizeAfter?: number;
  /** Extra classes per row — how `runStatusRowTreatment` gets applied (§5). */
  rowClassName?: (row: Row<TData>) => string | undefined;
  /**
   * Whole-row activation, for the pointer. A `<tr>` is not a control, so the
   * keyboard path is a link or button in the row's identifier cell that does
   * the same thing. A click on any control inside the row belongs to that
   * control and does not reach this. See the README.
   */
  onRowClick?: (row: Row<TData>) => void;
  /**
   * A totals row, sticky at the bottom. Its columns need `meta.figure`. A figure
   * gets the double rule only when the rows on display sum to its stated total:
   * no prop sets it (§7.8). See the README.
   */
  totals?: DataTableTotals;
  /** Rendered in place of the body when there are no rows. */
  empty?: React.ReactNode;
  className?: string;
  /** Escape hatch for TanStack options we do not surface. */
  tableOptions?: Partial<TableOptions<TData>>;
  globalFilter?: string;
};

const ROW_HEIGHT = 28; // --h-row-sm. Virtualization needs a number, not a var.

const ROW_CONTROLS =
  'a[href], button, input, select, textarea, label, [role="button"], [role="checkbox"], [role="switch"], [role="link"], [role="menuitem"]';

/**
 * Whether a click inside a row was meant for something other than the row: a
 * control in one of its cells (the identifier's own link, a checkbox, a row
 * action), or a popup portalled out of the row, whose clicks React still
 * bubbles through the `<tr>`. Without this, clicking a cell's link would
 * activate the row as well, and selecting a row would open it.
 */
function isClickForControl(event: React.MouseEvent<HTMLTableRowElement>) {
  const target = event.target as Element;
  if (!event.currentTarget.contains(target)) return true;
  const control = target.closest(ROW_CONTROLS);
  return control !== null && event.currentTarget.contains(control);
}

const FOOT_CELL = 'h-[var(--h-row-sm)] bg-surface px-[var(--pad-cell-x)] align-middle whitespace-nowrap';
const TOTAL_CELL = 'border-t border-text-primary text-text-primary';
// The double rule's slot, on every cell of the totals row: 3px of transparent
// border where it doesn't draw, so the text stays at one height whichever state
// the row is in, and a label stays on its figure's line. It is inside the cell's
// 28px, so the row doesn't grow, and clear of the table's own bottom border,
// where a rule across the cell would read as three lines once the table scrolls.
const RULE_SLOT = 'block border-b-3 border-transparent';

/**
 * The totals row, and a Difference row under it when a figure misses. A rule
 * can't say why it isn't there, so the difference is text a reader can see,
 * select and hear. Figures stay at the body's weight: tabular digits are wider at
 * a heavier one (ten at 12px: 59.65px at 400, 61.55px at 600), so a bold total
 * would drift out of its column.
 */
function TotalsFoot<TData>({ row, columns }: { row: TotalsRow; columns: Column<TData, unknown>[] }) {
  const first = columns.findIndex((column) => row.cells.has(column.id));
  const misses = [...row.cells.values()].some((total) => total.difference !== null);
  return (
    <tfoot className="sticky bottom-0 z-10">
      <tr>
        {first > 0 ? (
          <th scope="row" colSpan={first} className={cn(FOOT_CELL, TOTAL_CELL, 'text-left font-medium')}>
            <span className={RULE_SLOT}>{row.label}</span>
          </th>
        ) : null}
        {columns.slice(first).map((column, index) => {
          const total = row.cells.get(column.id);
          return (
            <td key={column.id} className={cn(FOOT_CELL, TOTAL_CELL, 'text-right font-normal tabular-nums')}>
              {first === 0 && index === 0 ? <span className="sr-only">{row.label}</span> : null}
              {total ? (
                <span className={cn(RULE_SLOT, total.foots && 'border-double border-text-primary')}>
                  {total.text}
                  {/* Hidden from a copied selection too: people paste these figures. */}
                  {total.foots ? <span className="sr-only select-none"> adds up</span> : null}
                </span>
              ) : null}
            </td>
          );
        })}
      </tr>
      {misses ? (
        <tr>
          {first > 0 ? (
            <th scope="row" colSpan={first} className={cn(FOOT_CELL, 'text-left font-normal text-text-danger')}>
              Difference
            </th>
          ) : null}
          {columns.slice(first).map((column, index) => (
            <td key={column.id} className={cn(FOOT_CELL, 'text-right tabular-nums text-text-danger')}>
              {first === 0 && index === 0 ? <span className="sr-only">Difference</span> : null}
              {row.cells.get(column.id)?.difference}
            </td>
          ))}
        </tr>
      ) : null}
    </tfoot>
  );
}

/**
 * DataTable — product.
 *
 * The densest surface in the system, and the one that exercises the most of
 * it: 28px rows, `tabular-nums`, the hover overlay, sticky headers and the
 * focus-ring-inside-`overflow:hidden` case §4 exists to prevent.
 *
 * Behaviour is TanStack Table (headless) — sorting, filtering, column sizing —
 * and TanStack Virtual for windowing. Both ship zero styles, so the token
 * layer stays authoritative.
 *
 * **Give the parent a bounded height.** This fills its container; if that
 * container is unbounded the table renders every row and virtualization
 * silently does nothing.
 *
 * **Numeric columns must set `meta.align: 'numeric'`.** That is what applies
 * `tabular-nums` and right-alignment; §0 rule 6 calls misaligned figure
 * columns a correctness hazard, not an aesthetic one.
 *
 * **The double rule comes from a check, never a prop (§7.8).** `totals` gives the
 * table the total as your records state it; the table adds the rows on display
 * and draws the rule only when the two match. See `totals.ts`.
 */
function DataTable<TData>({
  columns,
  data,
  virtualizeAfter = 100,
  rowClassName,
  onRowClick,
  totals,
  empty,
  className,
  tableOptions,
  globalFilter,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  if (import.meta.env?.DEV) warnOnFigureCells(columns);

  // React Compiler cannot memoize TanStack Table's API (its functions are
  // stable objects that change internally), so it skips this component and
  // says so. That is correct and nothing here can change it. Disabled on this
  // line only, because lint fails on any warning: a warning nobody acts on
  // trains everyone to ignore the next one.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    ...tableOptions,
  });

  const rows = table.getRowModel().rows;
  const shouldVirtualize = rows.length > virtualizeAfter;

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 12,
    enabled: shouldVirtualize,
  });

  const virtualRows = virtualizer.getVirtualItems();
  const paddingTop = shouldVirtualize && virtualRows.length ? virtualRows[0].start : 0;
  const paddingBottom =
    shouldVirtualize && virtualRows.length ? virtualizer.getTotalSize() - virtualRows[virtualRows.length - 1].end : 0;
  const renderedRows = useMemo(
    () => (shouldVirtualize ? virtualRows.map((v) => rows[v.index]) : rows),
    [shouldVirtualize, virtualRows, rows],
  );

  // Worked out during render, not in an effect, so prerendered HTML already says
  // whether a total foots. It reads `rows`, never `renderedRows`: the window isn't
  // what the table is showing, only what's in the DOM. About 5ms over 50,000 rows.
  const leafColumns = table.getVisibleLeafColumns();
  const rowCount = table.getCoreRowModel().rows.length;
  const totalsFoot = useMemo(
    () => (totals ? totalsRow(totals, rows, rowCount, leafColumns) : null),
    [totals, rows, rowCount, leafColumns],
  );
  const footRows = totalsFoot ? ([...totalsFoot.cells.values()].some((total) => total.difference !== null) ? 2 : 1) : 0;

  return (
    <div
      className={cn(
        // h-full is load-bearing: without it the root sizes to content, the
        // scroll container grows to the full table height, nothing actually
        // scrolls, and the virtualizer — seeing a viewport as tall as the
        // data — renders every row. The parent must have a bounded height.
        'flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-border',
        'bg-canvas text-text-body',
        className,
      )}
    >
      <div
        ref={scrollRef}
        className={cn(
          'min-h-0 flex-1 overflow-auto',
          // A control tabbed to in a row must not land under the sticky foot.
          footRows === 1 && 'scroll-pb-[var(--h-row-sm)]',
          footRows === 2 && 'scroll-pb-[calc(var(--h-row-sm)*2)]',
        )}
      >
        <table className="w-full border-separate border-spacing-0 text-sm">
          <thead className="sticky top-0 z-10">
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                {group.headers.map((header) => {
                  const headerMeta = header.column.columnDef.meta;
                  const numeric = headerMeta?.align === 'numeric' || headerMeta?.figure !== undefined;
                  const sortable = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  return (
                    <th
                      key={header.id}
                      scope="col"
                      aria-sort={
                        sorted === 'asc'
                          ? 'ascending'
                          : sorted === 'desc'
                            ? 'descending'
                            : sortable
                              ? 'none'
                              : undefined
                      }
                      style={{ width: header.getSize() === 150 ? undefined : header.getSize() }}
                      className={cn(
                        // Column headers are neutral. §0 rule 1: structure
                        // never takes a hue.
                        'h-[var(--h-row-sm)] bg-surface px-[var(--pad-cell-x)]',
                        'border-b border-border text-2xs font-medium uppercase',
                        'tracking-[var(--tracking-wide)] text-text-secondary',
                        'whitespace-nowrap select-none',
                        numeric ? 'text-right' : 'text-left',
                      )}
                    >
                      {header.isPlaceholder ? null : sortable ? (
                        // `inline`: the header cell owns size, case, tracking and
                        // colour; the button adds behaviour and the ring.
                        <Button
                          variant="inline"
                          onClick={header.column.getToggleSortingHandler()}
                          className={cn(
                            'w-full gap-[var(--gap-icon-label)] rounded-xs font-medium hover:text-text-body',
                            // Offset is negative so the ring sits INSIDE the
                            // cell: an outset ring on a sticky header inside
                            // overflow:hidden gets clipped (§4).
                            'focus-visible:outline-offset-[-2px]',
                            numeric ? 'justify-end' : 'justify-start',
                          )}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {sorted === 'asc' ? (
                            <CaretUpIcon weight="bold" aria-hidden="true" className="size-2.5 text-text-interactive" />
                          ) : sorted === 'desc' ? (
                            <CaretDownIcon
                              weight="bold"
                              aria-hidden="true"
                              className="size-2.5 text-text-interactive"
                            />
                          ) : (
                            <CaretUpDownIcon
                              weight="bold"
                              aria-hidden="true"
                              className="size-2.5 opacity-0 group-hover:opacity-100"
                            />
                          )}
                        </Button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>

          <tbody>
            {paddingTop > 0 ? (
              <tr aria-hidden="true">
                <td colSpan={table.getAllLeafColumns().length} style={{ height: paddingTop }} />
              </tr>
            ) : null}

            {renderedRows.map((row) => (
              <tr
                key={row.id}
                data-row-id={row.id}
                onClick={
                  onRowClick
                    ? (event) => {
                        if (!isClickForControl(event)) onRowClick(row);
                      }
                    : undefined
                }
                className={cn(
                  // §4 — one neutral overlay, composited. Not a per-state
                  // background swap.
                  'hover:bg-bg-hover',
                  onRowClick && 'cursor-pointer',
                  rowClassName?.(row),
                )}
              >
                {row.getVisibleCells().map((cell) => {
                  const meta = cell.column.columnDef.meta;
                  return (
                    <td
                      key={cell.id}
                      className={cn(
                        // Height on the CELL, not padding. A fixed --pad-cell-y
                        // plus an 18px StatusBadge renders a 31px row while the
                        // virtualizer estimates 28 — scroll position then drifts
                        // over 50k rows. With the height fixed and content
                        // centred, text lands at 6px of breathing room (which is
                        // --pad-cell-y) and a badge at 5px, which is exactly
                        // §7.3's "18px badge sits comfortably in a 28px row".
                        'h-[var(--h-row-sm)] border-b border-border px-[var(--pad-cell-x)] align-middle',
                        // §0 rule 6 — every figure column is tabular. Mono
                        // runs one step below adjacent sans (§8.3).
                        (meta?.align === 'numeric' || meta?.figure) && 'text-right tabular-nums',
                        meta?.content === 'mono' && 'font-mono text-xs',
                        meta?.figure ? 'whitespace-nowrap' : meta?.truncate !== false && 'max-w-0 truncate',
                      )}
                    >
                      {meta?.figure
                        ? printFigure(cell.getValue(), meta.figure.decimals)
                        : flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  );
                })}
              </tr>
            ))}

            {paddingBottom > 0 ? (
              <tr aria-hidden="true">
                <td colSpan={table.getAllLeafColumns().length} style={{ height: paddingBottom }} />
              </tr>
            ) : null}
          </tbody>

          {/* Outside the virtualized rows: the virtualizer never counts or measures it. */}
          {totalsFoot ? <TotalsFoot row={totalsFoot} columns={leafColumns} /> : null}
        </table>

        {rows.length === 0 ? (
          <div className="p-[var(--pad-card)] text-sm text-text-secondary">{empty ?? 'No rows.'}</div>
        ) : null}
      </div>
    </div>
  );
}

export { DataTable };
