# Button

Foundational. Adopted from shadcn/ui (Base UI, `base-mira`) and retokenized.

Behavior — focus, keyboard, ARIA — comes from `@base-ui/react/button`. Our work is the token layer. **Never inline a styled `<button>`.** If a context needs a button that looks different, add a variant here.

```tsx
import { Button } from 'tabular-ui';

<Button>Run pipeline</Button>
<Button variant="outline" size="sm">Retry</Button>
<Button variant="danger"><TrashIcon aria-hidden="true" />Delete model</Button>
```

## Variants

| Variant | Ground | Use |
|---|---|---|
| `default` | `--color-fill-interactive` + `--color-on-interactive` | Primary action. The interactive role (§1). |
| `outline` | 1px `--color-border`, transparent | Secondary action beside a primary one |
| `ghost` | transparent | Toolbars, table rows — anywhere a border would add noise |
| `danger` | `--color-bg-danger` + `--color-text-danger` | Delete, drop, force-fail |
| `inline` | none, no border, no padding, no hover fill | A control embedded in another component's structure: a sortable column header, a tree row |

Only `danger` carries a hue. Everything else is neutral, per §0 rule 1 — colour means state, not hierarchy.

**`danger`, not `destructive`.** Until 2026-10-10 this variant was `destructive`, while Badge, ProgressBar and every token called the same role `danger`. The old spelling still renders the same and logs a one-time warning in development (`foundational/dangerVariant.ts`); `buttonVariants({ variant: 'destructive' })` is honoured too. Lint rejects `variant="destructive"` and `variant: 'destructive'`, so new code uses `danger`. The deprecated spelling will be removed in a later, separate change.

**`danger` is a tint, not a solid fill.** A permanently-red solid button in a toolbar competes with genuine failure state in the data. `--color-fill-danger` / `--color-on-danger` stay available if a confirmation dialog later needs a solid destructive; that would be a new variant, not a change to this one.

**`inline` takes everything from its context.** No size variant applies, so it adds no height or padding, and font size, line height, case and colour come from the element around it. Weight is normal; set it if the context needs more (`DataTable`'s headers pass `font-medium`). What it adds is Base UI's behaviour and the system focus ring, which is the point: before it existed, those places hand-styled a `<button>`, and lint now rejects that outside `foundational/`. Pass alignment (`justify-start`) and, inside a flex row that must truncate, `shrink`. The row around it owns hover, so it has no hover fill. Case is inherited explicitly: browsers give `<button>` `text-transform: none`, and that is how every sortable `DataTable` header rendered mixed case until 2026-10-09.

```tsx
<th className="text-2xs font-medium uppercase …">
  <Button variant="inline" className="w-full justify-start font-medium" onClick={sort}>Rows</Button>
</th>
```

**Dropped from the vendored source:** `secondary` (a third neutral treatment overlapping `outline` and `ghost`) and `link` (a link is an anchor; §1 colours it with `--color-text-interactive`).

## Sizes

| Size | Height | Token | Type |
|---|---|---|---|
| `sm` | 24px | `--h-control-sm` | `--text-sm` |
| `default` | 32px | `--h-control` | `--text-base` |
| `lg` | 36px | `--h-control-lg` | `--text-base` |

`sm` exists to fit inside a `--h-row-sm` (28px) table row with 2px of clearance. `--h-control-sm` was added to §7.6 with this component.

**There is no icon-only size.** Icon-only buttons are `IconButton` — different padding, mandatory `aria-label`.

## Mechanisms worth knowing

**Hover and press composite; they never swap the fill.** A single `::after` overlay takes `--color-bg-hover` / `--color-bg-active`, which resolves correctly over a solid fill, over a bordered transparent ground, and over the bare canvas. One mechanism, four variants, no per-variant hover tokens — see §4.

**Focus is `outline`, never `box-shadow`.** The vendored source shipped `focus-visible:ring-2`, which compiles to box-shadow and gets clipped by `overflow: hidden` on scrolling table containers. Converted to `outline` with `outline-offset`, both read from `--ring-width` / `--ring-offset`. The lint gate rejects the ring form.

**Disabled dims the whole button** (`opacity-50`) rather than only its label via `--color-text-disabled`. On a solid fill a dimmed label over a full-strength ground still reads as enabled. **Its icon also drops to `light`** (§11.2), on every variant including `danger`, so the mark recedes with the control rather than staying a bold stroke on a faded ground. See the `Disabled` story, which pairs each disabled button with its enabled twin.

**Icons keep Phosphor's 1em default**, so they scale with the button's type (§11.3 — an icon beside its label is inline with text). At these sizes that puts every icon at ≤16px, where §11.2 requires `bold`.

**`Button` applies `bold` itself**, through Phosphor's `IconContext`, so callers pass no `weight`. It used to be left to the call site, and every call site forgot: the shell audit (2026-10-07) found Chat, Generate spec, Account and the breadcrumb all drawing Phosphor's default `regular`, a 0.8px stroke beside 1.4px label stems, next to `IconButton`s that were already bold. An explicit `weight` on the icon still wins, which is how a state treatment (`fill`, `light`) gets through. Context rather than `IconButton`'s `cloneElement`, because a labelled button's icon sits among text nodes and fragments.

**Icon gap is `--gap-control-icon` (6px), not `--gap-icon-label` (2px).** The 2px value belongs to badges and chips, where the icon and label are one atomic mark. In a control the icon reads as a word in a phrase, so the gap must exceed the font's word space — 2.60px at `--text-base` in Source Sans 3 (3.46px in Inter, when this rule was set). A 2px gap binds the icon to the first word more tightly than the words bind to each other, and the phrase visibly breaks in the wrong place. See §7.4.

**Edge padding drops to 6px on a side that leads or trails with an icon**, because Phosphor glyphs sit ~1px inboard of their box. This is detected in `index.tsx`, not in CSS: `svg:last-child` counts *element* children only, so in `<Button><Icon/>Label</Button>` the icon matches both `:first-child` and `:last-child` — the trailing text node is invisible to the selector — and a leading-icon button would lose padding on its text side too. React can see the text node; CSS cannot.

## Adoption note

`shadcn add button` writes to `src/components/ui/`. That is a landing zone, not the destination: the file was moved to `src/components/foundational/Button/index.tsx`, retokenized, and `ui/` deleted. `buttonVariants` lives in `variants.ts` because react-refresh disables fast refresh for any file that mixes component and non-component exports.
