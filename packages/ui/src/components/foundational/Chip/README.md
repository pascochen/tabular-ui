# Chip

Foundational. **Not vendored** — shadcn has no chip. `CLAUDE.md`'s 14 are foundational by decision, not by shadcn's catalogue, so this is built from `controlBase` and the token layer.

```tsx
<Chip>SAP</Chip>
<Chip selected onClick={toggle}>Failed</Chip>
<Chip dismissLabel="Remove SAP filter" onDismiss={remove}>SAP</Chip>
```

## Chip or Badge?

**Chip** is interactive — filters, facets, anything toggleable or removable.
**Badge** is static — run state, validation state, counts.

The signal is **border and hover, not radius** (§7.7): a chip has a border, a transparent ground and a hover state; a badge has a tint ground and no border. Every rectangle is square (since 2026-10-16), so radius cannot carry the distinction.

## Neutral by design

A chip names a **filter** — "SAP", "Q2 FY2026" — and a filter is not state, so it carries no hue (§0 rule 1). Allowing role-hued chips would make a hue mean "this filter mentions a state" rather than "this *is* the state", which is exactly the erosion that rule exists to prevent.

**Selection is the one exception**, because selection *is* the interactive role: a selected chip takes `--color-bg-interactive` with `--color-border-interactive`. §4 is explicit that no `--color-bg-selected` exists — it would duplicate this.

## Structure

Renders a `<button>`, so it is keyboard-reachable and takes the standard focus outline from `controlBase`.

**A dismissible chip is two sibling buttons:** the chip's own, and the X beside it, wrapped in a `<span data-slot="chip-dismissible">`. Neither is inside the other. Until 2026-10-09 the X was a `<span role="button">` inside the chip's `<button>`. That dodged invalid HTML but not the accessibility problem: a button's content is presentational, so screen readers can flatten a control nested in one (axe `nested-interactive`).

- **Nothing moved.** The X is laid over the chip's right edge, and the chip's right padding reserves exactly its width (the 2px gap, the 12px icon, and the padding less the 2px optical pull), so the chip renders pixel-identical to before.
- **Keyboard:** Tab reaches the chip, then its X. Enter or Space on the X calls `onDismiss` (a native button click, so `onDismiss` receives a `MouseEvent<HTMLButtonElement>`), and the chip's own `onClick` does not fire.
- **Focus:** the chip's ring wraps the whole chip as before. The X's ring is inset, so it stays inside the chip and a scrolling filter bar cannot clip it.
- **Hover:** hovering the X also shows the chip's hover overlay, as it did when the X was inside.
- `className` and every other prop go to the chip's own button, dismissible or not. `dismissLabel` names the X; it defaults to "Remove", which is ambiguous in a bar of chips, so always pass it.

Behaviour is pinned in `apps/storybook/tests/inline-controls.spec.ts`.

## Sizes

`sm` (`--text-xs`) and `default` (`--text-sm`), both with `--pad-chip-x` / `--pad-chip-y`. Sized by type rather than by `--h-control`, because a chip is a label with a border, not a control on the grid.
