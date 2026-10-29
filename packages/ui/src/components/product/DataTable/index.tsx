import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
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
  // TData/TValue are required by the interface signature we are augmenting,
  // even though this declaration does not reference them.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    /** `numeric` right-aligns and applies tabular-nums. Use for every figure. */
    align?: 'text' | 'numeric';
    /** `mono` renders identifiers in --font-mono, one step down (§8.3). */
    content?: 'text' | 'mono';
    /** Cells truncate by default; set false for cells that must wrap. */
    truncate?: boolean;
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
 */
function DataTable<TData>({
  columns,
  data,
  virtualizeAfter = 100,
  rowClassName,
  onRowClick,
  empty,
  className,
  tableOptions,
  globalFilter,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

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
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-auto">
        <table className="w-full border-separate border-spacing-0 text-sm">
          <thead className="sticky top-0 z-10">
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                {group.headers.map((header) => {
                  const align = header.column.columnDef.meta?.align;
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
                        align === 'numeric' ? 'text-right' : 'text-left',
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
                            align === 'numeric' ? 'justify-end' : 'justify-start',
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
                        meta?.align === 'numeric' && 'text-right tabular-nums',
                        meta?.content === 'mono' && 'font-mono text-xs',
                        meta?.truncate !== false && 'max-w-0 truncate',
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
        </table>

        {rows.length === 0 ? (
          <div className="p-[var(--pad-card)] text-sm text-text-secondary">{empty ?? 'No rows.'}</div>
        ) : null}
      </div>
    </div>
  );
}

export { DataTable };
