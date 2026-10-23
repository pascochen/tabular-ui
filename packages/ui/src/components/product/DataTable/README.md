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

**Every figure column needs `align: 'numeric'`.** §0 rule 6 calls misaligned figure columns a correctness hazard, not an aesthetic one.

## What the table does not decide

**Row treatments come from the caller** via `rowClassName`. §5 assigns a `--color-bg-danger` tint to failed rows and, to agent proposals, the `--color-bg-agent` tint with a solid `--color-text-agent` left rail; those live in `runStatusRowTreatment`, exported from `StatusBadge`. The table is `border-separate`, which paints no border on a `<tr>`, so the treatment draws the rail on the row's first cell and takes 2px off that cell's left padding. The table applies whatever it is handed and owns none of that mapping.

**Polarity colour belongs to the cell renderer**, and §5 restricts it to variance and delta columns — never every figure. A table where every number is green or red is unreadable and destroys the signal on the rows that need attention. Zero is neutral, never a hue.

## Structure

Headers are neutral (§0 rule 1: structure never takes a hue), uppercase `--text-2xs` with `--tracking-wide`, sticky, on `--color-surface`.

Sort affordances are real `<button>`s with `aria-sort` on the header cell. Their focus ring uses a **negative** `outline-offset`, so it sits inside the cell — an outset ring on a sticky header inside `overflow: hidden` gets clipped, which is the exact failure §4 exists to prevent.

Hover uses the single `--color-bg-hover` overlay, composited (§4) — not a per-state background swap.

## Columns with no visible header

A selection or row-action column still needs a header name. Pass one that is visually hidden, never `''`:

```tsx
{ id: 'select', size: 36, header: () => <span className="sr-only">Select</span>, cell: … }
```

A screen reader names each cell by its column, so an empty header leaves a column of unnamed checkboxes. axe reports it as `empty-table-header`.
