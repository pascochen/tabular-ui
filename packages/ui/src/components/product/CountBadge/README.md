# CountBadge

Product. Composes `Badge`.

A static summary marker — a category and how many are in it. A row of them sits
above a table or panel.

```tsx
<CountBadge label="Unmatched" count={12} />
<CountBadge label="Needs review" count={5} />
<CountBadge label="Stale" count={3} />
```

## Props

| Prop | Type | Default | Notes |
|---|---|---|---|
| `label` | `string` | — | The category — "Gaps", "Unmatched" |
| `count` | `number` | — | The figure |
| `max` | `number` | `99` | Above this the figure renders `{max}+`; the true count still reaches AT |

Everything else passes through to `Badge` except `tone`, `shape` and `children`,
which this component owns: the tone is always `neutral`. `role` passes through as
the ARIA attribute.

## Mechanisms worth knowing

**Static, so tint ground and no border.** §7.7 makes border-plus-transparent the
*interactive* signal and tint-plus-no-border the static one, deliberately not
carrying the difference in radius — every rectangle is square (since
2026-10-16). A bordered static marker reads as clickable and does nothing when
clicked.

**The upgrade path is a primitive swap, not a prop.** The day these filter
something they become `Chip`s, and gain a border, a hover state and selection —
exactly the affordances §7.7 reserves those signals for. The `StaticVersusInteractive`
story shows both. Do not add a border here to preview it.

**Neutral, always.** A count is a quantity, not state (§0 rule 1). "Failed 6"
stays neutral because the badge is not itself failing — the same reasoning
`FilterChip` carries. Spending a hue here would make it mean less where it is
genuinely true of the data.

**Not `Badge shape="count"`.** That shape is a bare figure with no label, and its
`--radius-full` ends would fight the `--radius-xs` corners of the badge enclosing
them. The figure earns emphasis from colour instead — label at
`--color-text-secondary`, figure at `--color-text-primary`. No second radius, no
second ground.

**The label-to-figure gap is `gap-1` (4px), a documented §7.4 fallback.** No role
token covers it. It has to exceed the font's word space — 2.00px at `--text-2xs`,
scaling §7.4's measured 2.60px at `--text-base` (Source Sans 3) — or the figure binds to the label
more tightly than the words bind to each other, which is the inversion already in
the failure log. Badge's own `--gap-icon-label` (2px) is for an icon and its label
as one atomic mark; a figure with its own colour is a second object. If a second
component needs this same 4px, that is the moment to ask for a role token.

**Truncation is visual only.** Above `max` the figure shows `99+`, but that span is
`aria-hidden` and the true count is rendered visually-hidden beside it — so a
screen reader hears "Unmatched 1284" while the eye sees "99+". One code path
whether truncated or not.

**Zero renders as zero.** "Failed 0" is a real answer and a useful one; it is not
an empty state and does not disappear. Callers who want it hidden should not render
the badge.

## Differences from the reference screenshot

Deliberate, and worth knowing if the two are compared side by side:

- **Uppercase at `--text-2xs`.** `Badge` sets the static-marker treatment, and
  every other one in the system reads that way — `PASSED`, `NEEDS REVIEW`. Sentence
  case here would make this the odd marker out.
- **No border**, per §7.7 — see above.
- **The figure has no ground of its own.** One tinted container, not a nested chip
  inside a pill; the enclosing badge is already 18px, and a second ground inside it
  would need padding the geometry does not have.

## Adoption note

Not vendored. shadcn's `base/badge` is 48 lines with a single `variant` axis
(default / secondary / destructive / outline) and no count concept — confirmed
against the source. There is nothing upstream to adopt; this is `Badge` plus a
label/figure split, the same shape of composite as `FilterChip`.
