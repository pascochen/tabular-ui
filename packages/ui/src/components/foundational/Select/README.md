# Select

Foundational. Adopted from shadcn/ui (Base UI, `base-mira`) and retokenized.

**There is no `Radio`.** In dense UI a Select beats a radio group — it costs one row instead of one row per option. If you want a radio group, use this.

```tsx
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from 'tabular-ui';

<Select defaultValue="prod">
  <SelectTrigger><SelectValue placeholder="Choose an environment" /></SelectTrigger>
  <SelectContent>
    <SelectItem value="dev">Development</SelectItem>
    <SelectItem value="prod">Production</SelectItem>
  </SelectContent>
</Select>

// identifier list — content goes on the root, so trigger and items agree
<Select defaultValue="fct_gl_entries" content="mono">
  <SelectTrigger><SelectValue placeholder="Choose a model" /></SelectTrigger>
  <SelectContent>
    <SelectItem value="fct_gl_entries">fct_gl_entries</SelectItem>
    <SelectItem value="dim_accounts">dim_accounts</SelectItem>
  </SelectContent>
</Select>
```

## The trigger is a field, not a button

It matches `Input` exactly — transparent ground, 1px `--color-border`, value left-aligned in the body weight, same heights, same `--pad-control-x`, same `--color-text-tertiary` placeholder — so a form of mixed controls lines up and reads as one system.

But it *is* pressed, so it takes the hover and press overlay. That is why `controlOverlay` is a separate export from `pressableBase`: the Select trigger needs the overlay without `justify-center` or `font-medium`, which would centre its value and set it in a label weight.

## `content`

| `content` | Face | For |
|---|---|---|
| `text` *(default)* | `--font-sans` | Environments, statuses, plain options |
| `mono` | `--font-mono`, one step below adjacent sans, slashed zero | Model names, schemas, run IDs (§8.3) |

Set it on **`Select`**, the root — not on the trigger. `SelectContent` and `SelectItem` are siblings of `SelectTrigger`, not descendants, so a provider on the trigger reaches nothing; `content` describes what the whole control holds anyway. Trigger and items both read it from context, so a value does not change face between the open list and the closed control. Either can override individually.

`numeric` is deliberately absent — right alignment and decimal alignment solve a column problem a picker does not have.

## Sizes

`sm` 24px · `default` 32px · `lg` 36px — `--h-control-sm` / `--h-control` / `--h-control-lg`, matching Button, IconButton and Input.

**Items are 28px (`--h-row-sm`)** regardless of trigger size, so a dropdown over a table shares the table's rhythm. A popup is transient and does not compete for permanent screen space the way a grid does, so it can afford the larger pointer target.

## Popup and states

- **Raised surface**: `--color-surface-raised` + 1px `--color-border-strong`, `--radius-md`, **no shadow** — §4 expresses depth with a background step plus a border because shadows barely register on a `ledger-950` canvas. The vendored source shipped `shadow-md` and a `ring-1`; both are gone.
- **Highlighted** item (pointer or keyboard) takes `--color-bg-hover`, the same neutral overlay every control uses.
- **Selected** item takes `--color-bg-interactive`. §4 is explicit that selection *is* the interactive role and that no `--color-bg-selected` exists — inventing one would be a duplicate by another name.
- **Group labels** use `--text-2xs` uppercase with `--tracking-wide`, §8.1's micro-label tier.
- **Invalid** (`aria-invalid`) tints the border with `--color-border-danger`; pair it with a message in `--color-text-danger`, as a border alone does not survive grayscale.
- The caret and check are Phosphor at `--size-icon-sm` (14px), so `weight="bold"` per §11.2.
