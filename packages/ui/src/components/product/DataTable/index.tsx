import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type Column,
  type ColumnDef,
  type ColumnMeta,
  type Row,
  type SortingState,
  type Table,
  type TableOptions,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { CaretDownIcon, CaretUpDownIcon, CaretUpIcon } from '@phosphor-icons/react';
import { useMemo, useRef, useState } from 'react';

import { cn } from '../../../lib/utils';
import { Button } from '../../foundational/Button';
import {
  printFigure,
  totalsRow,
  warnOnFigureCells,
  warnOnUnmatchedTotals,
  widestFigures,
  type DataTableTotals,
  type Figure,
  type TotalsRow,
} from './totals';

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
   * control and does not reach this, and neither does a press that selects text.
   * See the README.
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
function isClickForControl(event: React.MouseEvent<HTMLElement>) {
  const target = event.target as Element;
  if (!event.currentTarget.contains(target)) return true;
  const control = target.closest(ROW_CONTROLS);
  return control !== null && event.currentTarget.contains(control);
}

/**
 * How far a press travels before it counts as a drag, in px. Under this it is a
 * click that wobbled, and those open the row even when they select a character:
 * 1px of travel did in 3 presses of 16, and 3px in 8 (measured 2026-11-02).
 */
const DRAG_DISTANCE = 4;

/**
 * Whether a click inside a row is the end of selecting text: a drag that left a
 * selection, a Shift-click that extended one, or the later clicks of a double or
 * triple click. The browser sends each of them a click, and a drag across two
 * cells sends it to the `<tr>`.
 *
 * A selection alone doesn't say so. Chromium clears one on release, after the
 * click, so a click on text that is already selected still finds it there, and a
 * click on `user-select: none` content never clears it. Those are plain clicks,
 * and they open the row.
 */
function isClickForSelection(event: React.MouseEvent<HTMLTableRowElement>, pressedAt: { x: number; y: number } | null) {
  if (document.getSelection()?.isCollapsed !== false) return false;
  if (event.shiftKey || event.detail > 1) return true;
  return pressedAt !== null && Math.hypot(event.clientX - pressedAt.x, event.clientY - pressedAt.y) >= DRAG_DISTANCE;
}

/**
 * Right-aligned, tabular and double-clicked whole. One test, because writing it
 * out at each use is how a double-click first missed `figure` columns.
 */
function isNumeric<TData>(meta: ColumnMeta<TData, unknown> | undefined) {
  return meta?.align === 'numeric' || meta?.figure !== undefined;
}

/**
 * How many rows there are in all, or null when only a server knows. With manual
 * filtering or pagination the core row model is one page of an answer, so counting
 * it would call a page every row, and a ledger's stated total would show a false
 * Difference on each one.
 */
function allRowCount<TData>(table: Table<TData>) {
  const { manualFiltering, manualPagination, rowCount } = table.options;
  const { globalFilter, columnFilters } = table.getState();
  if (manualFiltering && (globalFilter || columnFilters.length > 0)) return null;
  if (manualPagination) return rowCount ?? null;
  return table.getCoreRowModel().rows.length;
}

const FOOT_CELL = 'h-[var(--h-row-sm)] bg-surface px-[var(--pad-cell-x)] align-middle whitespace-nowrap';
const TOTAL_CELL = 'border-t border-text-primary text-text-primary';
// The double rule's slot, on every cell of the totals row: 3px of padding where it
// doesn't draw, so the text stays at one height whichever state the row is in, and
// a label stays on its figure's line. Padding, not a transparent border: forced
// colours paint a transparent border solid, which would give a total that misses a
// heavier line than one that foots. It is inside the cell's 28px, so the row doesn't
// grow, and clear of the table's own bottom border, where a rule across the cell
// would read as three lines once the table scrolls.
const NO_RULE = 'block pb-[3px]';
const DOUBLE_RULE = 'block border-b-3 border-double border-text-primary';

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
            <span className={NO_RULE}>{row.label}</span>
          </th>
        ) : null}
        {columns.slice(first).map((column, index) => {
          const total = row.cells.get(column.id);
          return (
            <td
              key={column.id}
              onDoubleClick={total ? selectWholeFigure : undefined}
              className={cn(
                FOOT_CELL,
                TOTAL_CELL,
                'text-right font-normal tabular-nums',
                column.columnDef.meta?.content === 'mono' && 'font-mono text-xs',
              )}
            >
              {/* Hidden words stay out of a copied selection: people paste these figures. */}
              {first === 0 && index === 0 ? <span className="sr-only select-none">{row.label}</span> : null}
              {total ? (
                <span className={total.foots ? DOUBLE_RULE : NO_RULE}>
                  {total.text}
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
            <td
              key={column.id}
              onDoubleClick={row.cells.get(column.id)?.difference ? selectWholeFigure : undefined}
              className={cn(
                FOOT_CELL,
                'text-right tabular-nums text-text-danger',
                column.columnDef.meta?.content === 'mono' && 'font-mono text-xs',
              )}
            >
              {first === 0 && index === 0 ? <span className="sr-only select-none">Difference</span> : null}
              {row.cells.get(column.id)?.difference}
            </td>
          ))}
        </tr>
      ) : null}
    </tfoot>
  );
}

/**
 * A copy leaves the screen, so it leaves U+2212 behind (§8.6). Excel is reported
 * to read `−1,234` as text. A `1,234` beside it stays a number, so SUM skips only
 * the negatives, with no error. Numbers reads either sign, so a hyphen is never
 * the worse choice.
 *
 * Only a selection holding the minus is rewritten: setting one clipboard flavour
 * drops the browser's others, including the HTML a rich-text paste needs. The
 * swap runs on the selection's joined text because a cell can render its sign and
 * its figure as separate text nodes. `toString()` applies `text-transform`, so a
 * `StatusBadge` copies as it reads on screen. What someone typed into a field in
 * a cell is theirs, and §8.6 leaves it alone.
 */
function copyWithPlainSign(event: React.ClipboardEvent<HTMLTableElement>) {
  if ((event.target as Element).closest('input, textarea, [contenteditable="true"]')) return;
  const text = document.getSelection()?.toString() ?? '';
  if (!text.includes('−')) return;
  event.clipboardData.setData('text/plain', text.replaceAll('−', '-'));
  event.preventDefault();
}

/**
 * A browser's double-click selects a word, and neither the sign nor the currency
 * symbol is part of it: `−¥41,415,809` copies as `41,415,809`, a positive figure
 * that pastes as a number and raises nothing. In a numeric cell it takes the
 * whole figure.
 */
function selectWholeFigure(event: React.MouseEvent<HTMLTableCellElement>) {
  if (!isClickForControl(event)) document.getSelection()?.selectAllChildren(event.currentTarget);
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
  const pressedAt = useRef<{ x: number; y: number } | null>(null);

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

  if (import.meta.env?.DEV) {
    warnOnFigureCells(columns);
    if (totals) {
      warnOnUnmatchedTotals(
        totals,
        table.getAllLeafColumns().map((column) => column.id),
      );
    }
  }

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
  // what the table is showing, only what's in the DOM. 6 to 8ms a column over 50,000
  // rows in Chromium, so it's keyed by value: `totals` is usually written inline,
  // and a parent's re-render shouldn't add every row again. JSON reads NaN as null,
  // which the check treats the same way, as a figure it can't print.
  const leafColumns = table.getVisibleLeafColumns();
  const rowCount = allRowCount(table);
  const totalsKey = totals ? JSON.stringify(totals) : null;
  const totalsFoot = useMemo(
    () => (totalsKey ? totalsRow(JSON.parse(totalsKey) as DataTableTotals, rows, rowCount, leafColumns) : null),
    [totalsKey, rows, rowCount, leafColumns],
  );
  // A figure is never truncated, so it widens its column. A windowed table measures
  // only the rows it renders, so a wide figure scrolling in would shift every column.
  // Each figure column reserves room for its widest figure, across every row.
  const figureLengths = useMemo(
    () => (shouldVirtualize ? widestFigures(rows, leafColumns) : null),
    [shouldVirtualize, rows, leafColumns],
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
        <table className="w-full border-separate border-spacing-0 text-sm" onCopy={copyWithPlainSign}>
          <thead className="sticky top-0 z-10">
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                {group.headers.map((header) => {
                  const headerMeta = header.column.columnDef.meta;
                  const numeric = isNumeric(headerMeta);
                  const reserved = figureLengths?.get(header.column.id);
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
                            // Stays out of a copy. `inline` is `select-auto`,
                            // which does not take the <th>'s `select-none` in
                            // Chromium: the labels ran together on one line.
                            'select-none',
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
                      {reserved ? (
                        // In the cells' own type, so `ch` is one of their digits. No
                        // figure is wider than this many digits: a comma is narrower,
                        // and a minus is a digit's width (§8.6).
                        <span
                          aria-hidden="true"
                          className={cn('block h-0', headerMeta?.content === 'mono' ? 'font-mono text-xs' : 'text-sm')}
                          style={{ width: `${reserved}ch` }}
                        />
                      ) : null}
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
                onPointerDown={
                  onRowClick
                    ? (event) => {
                        pressedAt.current = { x: event.clientX, y: event.clientY };
                      }
                    : undefined
                }
                onClick={
                  onRowClick
                    ? (event) => {
                        if (!isClickForControl(event) && !isClickForSelection(event, pressedAt.current)) {
                          onRowClick(row);
                        }
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
                      onDoubleClick={isNumeric(meta) ? selectWholeFigure : undefined}
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
                        isNumeric(meta) && 'text-right tabular-nums',
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
