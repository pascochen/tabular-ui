# LineageTree

Product. Nested dbt dependencies.

```tsx
<LineageTree nodes={nodes} selectedId={selected} onSelect={(n) => setSelected(n.id)} />
```

## 12px per level

`--gap-tree-indent`, applied as `calc(var(--pad-cell-x) + depth * var(--gap-tree-indent))`. 12px is enough to read the nesting and tight enough that a six-deep lineage still fits a panel — at 16px it would not, and lineage in this product goes deep.

Rows are 24px (`--h-row-xs`), matching `RunLogRow`: a tree is scanned, not read.

## Depth is announced, not only drawn

Nested lists: each branch's children are a `<ul>` inside its `<li>`, so a screen reader names the nesting level of every list it enters. Indentation alone tells a screen reader nothing — it is a visual convention, and without the structure a six-level lineage is a flat list of names. The lists carry `role="list"` because Preflight's `list-style: none` drops list semantics in Safari.

The caret and the label are **separate buttons**: expanding a branch and selecting a node are different intents, and conflating them means you cannot inspect a node without collapsing your view of it. The caret is a disclosure button with `aria-expanded`. The selected node's name carries `aria-current="true"`, so the selection is announced as well as tinted. A leaf has no caret, only an `aria-hidden` spacer of the same size, so identifiers stay aligned down the tree and there is no control to tab past.

### Why not `role="tree"`

Until 2026-10-28 it rendered `role="tree"`, `treeitem` and `aria-level`. Those roles promise the WAI-ARIA tree pattern: the whole tree is one tab stop, arrow keys move between items, Left and Right collapse and expand, and the selected item carries `aria-selected`. The component implemented none of it: every caret and every name was its own tab stop, inside a `treeitem` that was never focused. A screen reader user was told "tree" and then found that its keys did nothing. The Codex review of 2026-10-28 found it.

Nested lists with disclosure buttons promise only what they deliver, and keep what the roles were added for: depth is still announced. If a screen ever needs keyboard movement through a deep lineage, implement the full tree pattern (roving tabindex, arrow keys, typeahead, `aria-selected`) and test it. Never put the roles back without the behaviour.

## Composition

Status comes from `StatusBadge`; the tree does not decide what a failed model looks like. Selection uses `--color-bg-interactive` — selection *is* the interactive role, and §4 is explicit that no `--color-bg-selected` exists.

Identifiers render in `--font-mono` at `--text-xs` with the slashed zero (§8.3), because they are read as data.
