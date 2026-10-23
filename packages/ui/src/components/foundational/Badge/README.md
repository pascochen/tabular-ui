# Badge

Foundational. Adopted from shadcn/ui (Base UI, `base-mira`) and retokenized.

```tsx
<Badge tone="success">passed</Badge>
<Badge tone="danger">failed</Badge>
<Badge shape="count" tone="danger">12</Badge>
<Badge tone="info" role="status">running</Badge>   {/* role is the ARIA attribute */}
```

## `tone`, not `role`

`tone` takes one of §1's roles: `neutral` (default) · `interactive` · `danger` · `warning` · `success` · `agent` · `info`. The spec still calls these *roles*; only the prop is named `tone`.

Until 2026-10-09 the prop was `role`. That is also the HTML attribute that tells assistive technology what an element is, so a badge could never carry a real one, and `<Badge role="danger">` read as an ARIA role to anyone who knew the attribute. Now `role` goes to the element: `role="status"` for a badge whose change should be announced.

**The old spelling still works.** No ARIA role is named after a tone, so a tone name in `role` is read as `tone` (and logs a one-time warning in development); anything else is passed through as the ARIA role. `badgeVariants({ role })` and `runStatuses[status].role` are honoured the same way. Lint rejects a literal tone name in `role` on `Badge`, `ProgressBar`, `StatusBadge` and `CountBadge`, so new code uses `tone`. The deprecated spelling will be removed in a later, separate change.

## Badge or Chip?

**Badge** is static — run state, validation state, a count. It has no hover, no focus, no disabled state, and takes no `controlBase`.
**Chip** is interactive — filters and facets.

§7.7 encodes that difference in **border and hover, not radius**: every rectangle is square (since 2026-10-16), so radius cannot carry it. A badge gets a tint ground and no border; a chip gets a border, a transparent ground, and a hover state.

## Shapes

| `shape` | Radius | For |
|---|---|---|
| `status` *(default)* | `--radius-xs` | "passed", "stale", "failed" |
| `count` | `--radius-full` | "3", "12" — 1–2 characters only |

**Status badges are not pills.** The vendored source shipped `rounded-full` for everything; §7.7 rejects it. Down a 30-row status column, pills pull their visual mass inward and scallop the left edge against the grid's vertical rhythm, and they need ~10px of horizontal padding against 6px to avoid looking cramped — width that repeats on every row.

`count` is the one legitimate pill: at 1–2 characters the round ends enclose the figure rather than trailing off it. Counts carry `tabular-nums`.

## Roles

`neutral` *(default)* · `interactive` · `danger` · `warning` · `success` · `agent` · `info`

Each is a `--color-bg-{role}` tint with the matching `--color-text-{role}` foreground. The tint is `{hue}-500` at 8–10%, never a 900/950 step — those drift in lightness by hue and would not sit at equal visual depth across the roles (§0 rule 3).

**Running is `info`, not `interactive`.** Interactive is sage, the same hue as success (§1), so a running badge on `interactive` reads as passed. `info` (federal) exists for in-progress work. `interactive` stays for a badge marking the user's selection or focus.

**The hue must be true of the thing the badge marks** (§0 rule 1). A badge is not decoration and never signals importance.

## Type

`--text-2xs` (10px/14px), uppercase, `--tracking-wide`. With `--pad-badge-y` this renders **18px tall**, which §7.3 works through as the reason the 2px step exists: at 4px the badge is 22px and forces the row to 32px, costing four rows per viewport.

## For pipeline state

Use the `StatusBadge` product component once it exists. It maps run and validation states onto these roles so the mapping lives in one place rather than at every call site.
