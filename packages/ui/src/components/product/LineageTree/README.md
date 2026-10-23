# LineageTree

Product. Nested dbt dependencies.

```tsx
<LineageTree nodes={nodes} selectedId={selected} onSelect={(n) => setSelected(n.id)} />
```

## 12px per level

`--gap-tree-indent`, applied as `calc(var(--pad-cell-x) + depth * var(--gap-tree-indent))`. 12px is enough to read the nesting and tight enough that a six-deep lineage still fits a panel — at 16px it would not, and lineage in this product goes deep.

Rows are 24px (`--h-row-xs`), matching `RunLogRow`: a tree is scanned, not read.

## Depth is announced, not only drawn

`role="tree"` with `aria-level` on every item and `aria-expanded` on every branch. Indentation alone tells a screen reader nothing — it is a visual convention, and without the roles a six-level lineage is a flat list of names.

The caret and the label are **separate buttons**: expanding a branch and selecting a node are different intents, and conflating them means you cannot inspect a node without collapsing your view of it. Leaf carets are `invisible` rather than absent, so identifiers stay aligned down the tree.

## Composition

Status comes from `StatusBadge`; the tree does not decide what a failed model looks like. Selection uses `--color-bg-interactive` — selection *is* the interactive role, and §4 is explicit that no `--color-bg-selected` exists.

Identifiers render in `--font-mono` at `--text-xs` with the slashed zero (§8.3), because they are read as data.
