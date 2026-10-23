# Checkbox

Foundational. Adopted from shadcn/ui (Base UI, `base-mira`) and retokenized.

```tsx
<Checkbox id="upstream" defaultChecked />
<label htmlFor="upstream">Include upstream models</label>

<Checkbox size="sm" aria-label="Select all" indeterminate={some} checked={all} />
```

## Checkbox or Switch?

**Checkbox** for a staged choice that takes effect on submit, and for selecting rows.
**Switch** for a setting that applies the moment it is flipped.

## Appearance

- **`--radius-xs`, square (0px) since 2026-10-16** (§7.7; 2px before, because at a 14–16px box even 4px read soft). §7.7 says explicitly *do not encode interactivity in radius*, so radius here is an optical choice, not a signal that the box is clickable, and it matches the status badge.
- **Unchecked matches `Input`**: transparent with a 1px `--color-border`.
- **Checked and indeterminate use `--color-fill-interactive`** with an `--color-on-interactive` mark. Selection is the interactive role (§1).
- **Invalid** tints the border with `--color-border-danger`; pair with a message.

## Sizes

| Size | Box | Mark | Beside |
|---|---|---|---|
| `sm` | 14px | 10px | `--text-sm` (12px) — table rows |
| `default` | 16px | 12px | `--text-base` (13px) — forms |

The box tracks the **icon** scale, not the control scale: a checkbox is a mark beside text, so it sits at the size of an inline icon rather than at `--h-control`.

## Hit area

The visual box is 14–16px, well under WCAG 2.5.8's 24px target minimum. An `::after` overlay extends the pointer target past the box without affecting layout — kept from the vendored source. This is also why Checkbox does not use `controlOverlay`: that shares the same `::after` slot.

## Labels are the caller's job

Wrap in a `<label>` or pair with `<label htmlFor>`. A bare checkbox has no accessible name. For row-selection checkboxes with no visible label, pass `aria-label`.
