# InlineCitation

Product. Composed from `Chip` and `Popover`. Pairs with `Sources`.

Each figure names what it rests on, in the line where it appears.

```tsx
<p>
  Invoice MFL-58821 was paid twice, $48,216.40 each time.
  <InlineCitation
    number={1}
    source={{ id: 'invoices', name: 'supplier_invoices_fy2026_h1.csv', href: '/files/invoices' }}
    locator="API-KUS-2607-00007 and API-KUS-2607-00011"
  />
</p>
```

## Props

| Prop | Type | Notes |
|---|---|---|
| `number` | `number` | Required. The source's position in the answer's `Sources`, from 1 |
| `source` | `Source` | Required. The same object passed to `Sources` |
| `locator` | `string` | Where in the source: rows, entries, lines. Optional, and worth giving |
| `className` | `string` | |

## Geometry

A `Chip` (`size="sm"`), 16px tall, at least 16px wide, with 2px each side: a one- or two-digit figure in a square or near-square box. 16px is a `--text-sm` line, so the mark never makes the line it sits in taller, at `--text-sm` or `--text-base`. No token names an inline mark's size, so `h-4 min-w-4 px-0.5` are primitive steps, used as §7.4's fallback.

The popover is `Popover`'s own: `--pad-popover`, as wide as its content up to `--w-panel`. The figure, then the file name in mono `--text-xs` (§8.3), a link when the source has an `href`, then the locator.

## Mechanisms worth knowing

**A Popover, never a Tooltip.** Base UI's tooltip is visual only. A source shown in one would reach no screen reader, and its link couldn't be followed (CLAUDE.md, failure log). The popover's content is in the accessibility tree: its title names the file, its description is the locator, and Escape returns focus to the mark.

**A Chip, because it's an interactive marker.** §7.7: border, transparent ground and a hover state mean "press this", and a tint with no border means "this is a label". A citation opens something, so it's the first kind. It's neutral, because a citation isn't a state (§0 rule 1).

**The accessible name is "Source 1: supplier_invoices_fy2026_h1.csv".** A bare "1" says nothing out of context. The name keeps the visible figure in it, so a speech user can still say what they see (WCAG 2.5.3).

**One number, two places.** The mark's `number` is the row's position in `Sources`, and both take the same `Source`. The caller numbers once, from the array it passes to `Sources`, and passes `index + 1`.

**It brings its own space, a no-break one.** Put the mark straight after the figure or sentence it supports, with no space of your own. A normal space is a place to wrap, and the mark then starts a line alone, away from what it cites. Found on the first site build, where it did exactly that.

## Not part of this component

**Jumping to the row in `Sources`.** The popover already says which file, and where in it. Scrolling the answer away to show the same name would lose the reader's place.

**Opening on hover.** It opens on press, Enter or Space. A hover peek fired by a pointer resting over the line is the `AppShell` failure-log entry's problem, for something people read across all the time.
