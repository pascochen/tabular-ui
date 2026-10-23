# Input

Foundational. Adopted from shadcn/ui (Base UI, `base-mira`) and retokenized.

```tsx
import { Input } from 'tabular-ui';

<Input placeholder="Search models…" />
<Input content="numeric" defaultValue="1,284,102.00" />
<Input content="mono" size="sm" defaultValue="fct_gl_entries_v2" />
```

## `content` is the prop that matters

It declares **what the field holds**, and the system applies the typography that implies. This is §8.6 and §8.3 made structural instead of remembered.

| `content` | Typography | For |
|---|---|---|
| `text` *(default)* | `--font-sans` | Names, descriptions, free text |
| `numeric` | `--font-sans`, `tabular-nums lining-nums`, **right-aligned** | Balances, thresholds, row counts |
| `mono` | `--font-mono`, one step below adjacent sans, slashed zero | Model names, account codes, run IDs |

`numeric` right-aligns so figures line up on the decimal, exactly as they do in a variance column — stack four of them and the column reads. §8.6 calls misaligned figure columns a correctness hazard, not an aesthetic one, which is why this is a variant rather than a note in a doc.

`numeric` also sets `inputMode="decimal"` unless the caller overrides it.

`mono` sets its own size (one step below the sans it sits beside), so the `size` variant does not re-set it.

## Sizes

| Size | Height | Token |
|---|---|---|
| `sm` | 24px | `--h-control-sm` |
| `default` | 32px | `--h-control` |
| `lg` | 36px | `--h-control-lg` |

## Ground and states

**Transparent with a 1px `--color-border`** — no fill. §0 rule 7: borders do the work. A field stays quiet on the canvas and on a surface alike, and reads consistently with the `outline` Button.

- **Placeholder** is `--color-text-tertiary`, which §3 scopes to exactly this — placeholder text, disabled labels, non-text marks. Never a value the user must read.
- **Invalid** (`aria-invalid`) tints the border with `--color-border-danger`. **Pair it with a message in `--color-text-danger`.** The border alone does not survive grayscale, and §5 pairs the border tint with a text signal for that reason.
- **Disabled** dims the whole field and sets `not-allowed`.

## Labels are the caller's job

Pair with a `<label htmlFor>`, or wrap in `Field` when that component lands. **A placeholder is not a label** — it disappears the moment the user types, taking the field's accessible name with it.

## Note on `controlBase`

This is the component that split the shared contract in two. `Input` uses `controlBase` (shape, focus ring, disabled) but **not** `pressableBase`: a field is typed into, not pressed, so `select-none` would block selecting its own text, `justify-center` would centre the value, `font-medium` would set it in a label weight, and a hover-fill overlay makes no sense on a text field. Anything added to `controlBase` from now on must be true of an input, a button, a select and a tab alike.
