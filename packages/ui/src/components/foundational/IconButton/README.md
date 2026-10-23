# IconButton

Foundational. Built from the shared control contract (`../controlBase.ts`), not vendored — shadcn folds icon-only buttons into `Button`'s `size="icon"`, and `CLAUDE.md` requires them separate.

```tsx
import { IconButton } from 'tabular-ui';

<IconButton aria-label="Re-run"><ArrowClockwiseIcon /></IconButton>
<IconButton aria-label="Delete model" variant="danger" size="sm"><TrashIcon /></IconButton>
```

## Why it is not a Button size

Three contracts differ, and folding them into one component is how the label silently goes missing:

- **No label**, so it is square with no horizontal padding — the icon centres on both axes.
- **The icon is standalone**, so it takes an explicit `--size-icon-*` token rather than Phosphor's 1em default. In `Button` the icon sits beside text and scales with it (§11.3).
- **`aria-label` is required, not optional.** It is enforced in the type — omitting it is a compile error, not a lint warning.

## Variants and sizes

Grounds are shared with `Button`: `default` · `outline` · `ghost` · `danger` · `inline`. Only `danger` carries a hue (§0 rule 1). `destructive` is its deprecated spelling (renamed 2026-10-10, see `Button`'s README).

**`inline`** is for an icon control inside another component's row, like `LineageTree`'s expand caret. No size variant applies: size the box and the icon to the row's grid in `className` (`size-[var(--size-icon-sm)]`), because a 24px `--h-control-sm` square would push a 24px row taller. The weight is still injected (`bold`). Pass `tooltip={false}` when the row already shows what the control acts on.

**Defaults to `ghost`**, unlike `Button`. Icon-only buttons are overwhelmingly toolbar and table-row actions, where a fill or border on every row is noise. A filled icon button, the ink primary fill, is still available via `variant="default"`.

| Size | Control | Icon | Token |
|---|---|---|---|
| `sm` | 24px | 14px | `--h-control-sm` / `--size-icon-sm` |
| `default` | 32px | 16px | `--h-control` / `--size-icon-md` |
| `lg` | 36px | 20px | `--h-control-lg` / `--size-icon-lg` |

`sm` fits inside a `--h-row-sm` (28px) table row with 4px of clearance.

## Icon weight is injected

§11.2 maps weight to icon size, and the mapping is not intuitive: **14px and 16px take `bold`** (at or below the 16px legibility floor) while **20px takes `regular`** (above the floor, matching the control's own 500 type weight). A 20px regular stroke and a 14px bold stroke read at equivalent visual weight — that is the optical correction working, not an inconsistency.

Because it is mechanical and easy to get wrong, `IconButton` clones its icon child and sets `weight` per size. **An explicit `weight` on the icon always wins**, so `<TrashIcon weight="fill" />` is untouched.

**Disabled overrides the size band: the icon draws `light`** (§11.2's state table, where state wins first), on every variant including `danger`. An icon-only button has no label to dim, so without this the whole-control `opacity-50` would leave a bold glyph sitting on a faded ground. See the `Disabled` story.

## Accessibility

The label goes on the **button**, never on the icon — once the button is named, the icon is decorative. Do not also put a `title` or `aria-label` on the icon; that produces a doubled announcement.

**Tooltip is automatic.** The button wraps itself in a `Tooltip` whose text defaults to `aria-label`, so a correctly labelled button is explained to sighted users for free. Pass `tooltip="…"` to override the text, or `tooltip={false}` to opt out — only when the control already sits inside its own tooltip or menu.

This division is deliberate and matters: Base UI's tooltip is **visual only** and its text is never announced. `aria-label` carries the accessible name, the tooltip carries the sighted affordance, and neither depends on the other. See `Tooltip/README.md`.

Requires `TooltipProvider` mounted at the app root — without it the delay silently falls back to Base UI's default.
