# DataTable

Product. The densest surface in the system, and the one that exercises the most of it.

```tsx
<div style={{ height: 480 }}>
  <DataTable
    columns={columns}
    data={models}
    rowClassName={(row) => runStatusRowTreatment[row.original.status]}
    empty="No models in this project yet."
  />
</div>
```

## Engine

[TanStack Table](https://tanstack.com/table) for sorting, filtering and column sizing; [TanStack Virtual](https://tanstack.com/virtual) for windowing. Both are **headless** — they ship zero styles, so the token layer stays authoritative.

Rows virtualize past `virtualizeAfter` (default 100). Below that every row renders, which keeps Cmd-F and screen-reader row counts working on small tables where windowing buys nothing.

## Two things that will bite

**Give the parent a bounded height.** The table fills its container. If that container is unbounded, the scroll area grows to the full table height, nothing scrolls, and the virtualizer — seeing a viewport as tall as the data — renders every row. It looks like virtualization is simply off, with no error. This was a real bug during the build: 50,000 rows in the DOM.

**Row height lives on the cell, not on the row.** A `--pad-cell-y` of 6px plus an 18px `StatusBadge` renders a 31px row while the virtualizer estimates 28 — and scroll position then drifts over 50k rows. Cells carry `h-[var(--h-row-sm)]` with `align-middle` instead, so text lands at 6px of breathing room and a badge at 5px, which is exactly §7.3's "18px badge sits comfortably in a 28px row".

## Column metadata

`ColumnMeta` is augmented so these are type-checked at the call site:

| `meta` | Effect |
|---|---|
| `align: 'numeric'` | Right-aligns and applies `tabular-nums` |
| `content: 'mono'` | `--font-mono` one step down (§8.3) — model names, IDs, account codes |
| `truncate: false` | Opts a cell out of truncation |
| `figure: { decimals, unit }` | The table prints the column itself: right-aligned, tabular, never truncated. Needed for a [totals row](#totals-row) |

**Every figure column needs `align: 'numeric'` or `figure`.** §0 rule 6 calls misaligned figure columns a correctness hazard, not an aesthetic one.

## What the table does not decide

**Row treatments come from the caller** via `rowClassName`. §5 assigns a `--color-bg-danger` tint to failed rows and, to agent proposals, the `--color-bg-agent` tint with a solid `--color-text-agent` left rail; those live in `runStatusRowTreatment`, exported from `StatusBadge`. The table is `border-separate`, which paints no border on a `<tr>`, so the treatment draws the rail on the row's first cell and takes 2px off that cell's left padding. The table applies whatever it is handed and owns none of that mapping.

**Polarity colour belongs to the cell renderer**, and §5 restricts it to variance and delta columns — never every figure. A table where every number is green or red is unreadable and destroys the signal on the rows that need attention. Zero is neutral, never a hue.

## Totals row

A double rule tells a finance reader that a total adds up, so the table draws it from a check, and no prop sets it (§7.8). You give the table the total as your records state it. It adds up the rows on display and compares.

```tsx
const columns = [
  { accessorKey: 'label', header: 'H1 operating profit' },
  { accessorKey: 'yen', header: 'Yen', meta: { figure: { decimals: 0, unit: 'JPY' } } },
];

<DataTable columns={columns} data={rows} totals={{ label: 'Actual', stated: { yen: bridge.actual } }} />;
```

- **`totals.stated`** maps a column id to its stated total. Naming a column asks for the check and can't answer it.
- **`totals.sum`** lists columns to simply add (`sum: ['hours']`). They never get the rule.
- **`meta.figure`** is required on a totalled column. `decimals` is how many digits it prints after the point. `unit` is what the column holds, a string or `(row) => string`, and isn't printed, so name a single unit in the header.

A `totals` key must be the column's id. TanStack turns `accessorKey: 'cost.yen'` into the id `cost_yen`, so give such a column an `id`. A key that matches nothing warns in development.

**A figure column prints through the table, and its `cell` is ignored**, with a warning in development. A custom `cell` could print something other than what gets checked. So a figure column has no polarity colour and no per-row symbol. A zero prints as `0`.

**A figure past 15 significant digits prints empty**, and warns in development, because a double can't hold it exactly: 80000000000000.01 would print as .02. At 2 decimals, the limit is 9,999,999,999,999.99.

**A figure is never truncated, so it can widen its column.** A windowed table measures only the rows it renders, so each figure column reserves room for its widest figure across every row. The columns hold still as you scroll.

### What shows

| The table finds | Figure | Under it | Also |
|---|---|---|---|
| All rows shown, sum equals stated | Stated | Double rule | Hidden "adds up" text for screen readers |
| All rows shown, sum differs | Stated, never replaced by the sum | Nothing | A "Difference" row in `--color-text-danger` |
| The stated total isn't a figure (`NaN`, a runtime `null`) | "Incomplete", never the sum | Nothing | |
| Rows hidden | Sum of the rows shown | Nothing | "Subtotal, n of m rows" |
| `sum` column | Sum | Nothing | |
| A part is empty or not a number | Stated, or "Incomplete" for `sum` | Nothing | No Difference: a check that couldn't run hasn't failed |
| Rows in more than one unit | Stated, or "Mixed" for `sum` | Nothing | No sum attempted |
| No rows | No totals row | | |

Every state has the 1px ink rule above the row. The result is worked out during render, so prerendered HTML already carries the mark.

### Total of what

Every row left after filtering, scrolled into view or not. The sum never reads the virtualizer's window, and the row sits outside the virtualized rows, so scrolling can't drift. Sorting changes nothing. Rows are hidden when the row model holds fewer rows than the data, by a filter or by pagination through `tableOptions`, so a filter that hides nothing still closes.

**On a server-side table,** one page isn't every row. With `manualPagination`, pass `rowCount`: the row reads "Subtotal, 50 of 1,284 rows" until every row is on the page. Without `rowCount`, or while `manualFiltering` has a filter set, only the server knows the whole, so it reads "Subtotal, 50 rows". Neither draws the rule or a Difference.

### Rounding

The table adds what it prints: each value goes through `toFixed(decimals)` once, and that is both the cell's text and the integer it adds. There is no tolerance. A ¥1 gap from rounding shows as "Difference 1", because a total that doesn't match its printed parts is a footing error (`docs/site.md`, D5). The arithmetic is in `totals.ts`.

### What the check can't prove

**"Final."** It proves a total adds up. A total can foot and still include rows that aren't posted, because the table doesn't know a row's status. Use `sum` until a set is closed.

**That your figure is independent.** `stated: { yen: sum(rows) }` can only ever match, so it draws a true but empty rule, and nothing can detect it. If you have no figure from elsewhere, use `sum`.

### Geometry

The row is 28px in every state. The rule sits inside the cell, under the figure, and clears the table's own bottom border by 4px: across the whole row it would land on that border once the table scrolls, and read as three lines. Every cell keeps the rule's 3px as padding, so text doesn't move when the rule comes and goes. Not as a transparent border, which forced colours paint solid. Figures stay at the body's weight, because tabular digits are wider at a heavier one, and a bold total drifts out of its column.

**A totals row needs a text column ahead of its first figure.** Without one, its label is for screen readers only. A filtered total then shows as a bare number, and a miss as an unlabelled red one.

## Structure

Headers are neutral (§0 rule 1: structure never takes a hue), uppercase `--text-2xs` with `--tracking-wide`, sticky, on `--color-surface`.

Sort affordances are real `<button>`s with `aria-sort` on the header cell. Their focus ring uses a **negative** `outline-offset`, so it sits inside the cell — an outset ring on a sticky header inside `overflow: hidden` gets clipped, which is the exact failure §4 exists to prevent.

**A label sits on its column's edge, and the caret on the inner side:** to the left of a right-aligned label, to the right of a left-aligned one. So a figure column's label shares its figures' right edge, sortable or not (owner, 2026-11-02). The caret stays in the layout at opacity 0 until hover or a sort draws it, so drawing it moves no label and, in a squeezed table, resizes no column. It does not go in the cell's padding: at 10px it is wider than `--pad-cell-x`, so it would overhang the cell, fall outside the focus ring, and make a table whose last column holds figures scroll 2px sideways.

The button reaches `--ring-width` into the cell's padding on each side and pads it back. An inset ring paints over the button's outer 2px, so without that it would sit on the label's first or last letter.

Hover uses the single `--color-bg-hover` overlay, composited (§4) — not a per-state background swap.

## Clickable rows

`onRowClick` makes the whole row a pointer target. It is a shortcut for the mouse, not the way in: a `<tr>` is not a control, and it gets no `tabIndex`, because in a table of 50,000 rows that is 50,000 tab stops. **Whenever you pass `onRowClick`, render the row's identifier as a link or a `Button variant="inline"` that does the same thing.** That control is the keyboard path and the screen reader's path. Use a link when the row has a URL, because only a link can be middle-clicked.

```tsx
{
  accessorKey: 'model',
  header: 'Model',
  meta: { content: 'mono' },
  cell: ({ row }) => (
    <Button variant="inline" className="inline-block max-w-full truncate" onClick={() => open(row.original)}>
      {row.original.model}
    </Button>
  ),
}
```

- **Give the button its text directly,** with `inline-block truncate` for the ellipsis. A `<span>` inside it splits every copied row in two (see Copying).
- **A link is a plain `<a>`**, with the focus ring `AttachmentRow`'s filename carries but not its `block`. `buttonVariants` brings `select-none`, whichever variant you pass, so a link styled with it drops out of a copy.
- **Keep `columns` stable:** outside the component, or in `useMemo`. TanStack renders `cell` as a component, so a new function on every render remounts the identifier, and opening a row dropped focus to `<body>`.

A click on any control inside a row stays with that control: the identifier's own button, a selection checkbox or a row action never also fires `onRowClick`, and neither does a click inside a popup opened from the row. So the identifier's handler and `onRowClick` can be the same function without opening the row twice. The `ClickableRows` story shows the pattern and tests all three paths.

**Selecting text doesn't open the row.** Filenames, GL references and model names are copied constantly, and a row that navigates would take the page away first. A drag that leaves a selection, a Shift-click that extends one, and the later clicks of a double or triple click don't fire `onRowClick`. `tests/data-table-selection.spec.ts` drives each with real pointer events, in Chromium only.

- **A double-click still opens the row, on its first click.** That click can't know a second is coming, and waiting to find out would delay every open. In a table whose rows navigate, drag to select: the whole figure a double-click takes (see Copying) never arrives there. A total sits outside the rows, so a click in the totals row opens nothing.
- **A selection alone doesn't decide it.** Chromium clears a selection on release, after the click, so a click on selected text, or anywhere after select-all, still finds one, and a click on `user-select: none` content never clears it. Those are plain clicks, and they open the row. So a press that leaves a selection also has to travel 4px. 1px of wobble selected a character in 3 presses of 16, and 3px in 8, and those are clicks too.
- **A drag that selects nothing is still a click**, across a cell's padding, say.
- **A drag ending on the identifier is the same case as any other.** The browser sends the click to the `<tr>`, the control never gets it, and the row stays closed, with as much of the name as the drag reached in the selection.
- **A press that starts and ends on the identifier is the control's own click.** A drag that starts on `Button variant="inline"` selects nothing, and it opens the row. A double-click there opens it twice, through the control's own handler. The row can't see those clicks, so `select-text` on an identifier would select and open, and its handler would need a guard of its own.

`AttachmentRow` follows the same split outside a table: the filename is the link, and whole-row activation is left to `DataTable`.

## Copying

A negative takes U+2212 on screen and a hyphen on the clipboard (§8.6). Excel is reported to read `−1,234` as text, and a `1,234` beside it stays a number, so a sum skips only the negatives with no error.

- **A selection holding a minus** is written as tab-separated plain text, with a hyphen in place of each minus. The screen, the DOM and the selection don't change. It pastes into a document as tabs, not as a table, and a `StatusBadge` copies as it reads, `PASSED`.
- **A selection with no minus** keeps the browser's own copy.
- **A double-click in a `numeric` or `figure` column**, or on a total or a difference, takes the whole figure. A browser's double-click would select only a word, so `−¥41,415,809` would copy as `41,415,809`, a positive figure. A figure inside a control stays with that control.
- **A field in a cell** keeps what was typed.
- **An identifier stays in its row, on one line,** because the figures mean nothing without it. A child of `Button` is a flex item, so it lays out as a block, and Chromium writes a line break either side of a block. With a `<span className="truncate">` inside the button, every row copied as `dim_accounts_1\nfailed\t2,019,530…`, with a blank line after it. A `<div>` or a `flex` element directly in a cell breaks a row the same way.
- **One name on its own is awkward.** A drag or a double-click that starts on the button clicks it and selects nothing, as on any button, so start the drag in the cell's padding or the cell beside it.

The limits are in §8.6: `¥` and comma-decimal locales, rendered rows only in a virtualized table, no header row, no single column, and a selection that starts outside the table keeps U+2212. A selection with no minus keeps the browser's HTML, which holds a `<button>` for the identifier, and that hasn't been pasted into Excel or Docs (§10). `apps/storybook/tests/data-table-copy.spec.ts` reads the clipboard, and the `SignedFigures` story has the figures.

## Columns with no visible header

A selection or row-action column still needs a header name. Pass one that is visually hidden, never `''`:

```tsx
{ id: 'select', size: 36, header: () => <span className="sr-only">Select</span>, cell: … }
```

A screen reader names each cell by its column, so an empty header leaves a column of unnamed checkboxes. axe reports it as `empty-table-header`.
