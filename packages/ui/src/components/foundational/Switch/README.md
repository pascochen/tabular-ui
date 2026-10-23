# Switch

Foundational. Adopted from shadcn/ui (Base UI, `base-mira`) and retokenized.

```tsx
<Switch id="auto-retry" defaultChecked />
<label htmlFor="auto-retry">Auto-retry</label>
```

## Switch or Checkbox?

**Switch** for a setting that takes effect the moment it is flipped — it implies no Save button.
**Checkbox** for a staged choice that applies on submit, and for selecting rows.

## Geometry is derived, not inherited

The vendored source shipped `h-[16.6px] w-[28px]` — a fractional height that lands off the pixel grid and belongs to no scale. These come from the icon scale with a uniform 2px inset:

| Size | Track | Thumb | Travel |
|---|---|---|---|
| `sm` | 24×14 | 10px | 10px |
| `default` | 28×16 | 12px | 12px |

The 2px inset is the track's 1px transparent border plus 1px of padding. The border stays because `aria-invalid` colours it, and it counts in the box: with 2px of padding on top of it, the thumb sat 3px from the left and 1px from the right when on. `apps/storybook/tests/switch.spec.ts` measures all four gaps, in both states and both sizes, and expects exactly 2px.

## Why square

Square since 2026-10-23, by the owner's decision after a side-by-side in Storybook. The track is a control, so it takes `--radius-md` with every other control. The thumb is a part inset inside it, so `--radius-sm`. Both are 0px (§7.7).

Until then it was a pill, on the argument that the thumb had to be circular to read as sliding. It doesn't: a switch reads by its wide track with the thumb parked at one end. Round, it was the only control in the system that wasn't square. `--radius-full` is now for marks that are read, not operated: the status dot, count badge, avatar and progress track.

The cost, accepted with it in view: an off thumb is a small solid square, as a checked `Checkbox` is, and the two share settings lists. The track around the thumb is what tells them apart.

`Menu`'s switch indicator reuses these variants, so it is square too. `apps/storybook/tests/switch.spec.ts` asserts 0px on both.

## Colour

- **Off**: `--color-border-strong`. `--color-border` sits at 1.31:1 against the canvas and would nearly disappear; the off state still has to be visible.
- **On**: `--color-fill-interactive` — the interactive role (§1).
- **Thumb** flips between `--color-text-primary` (off) and `--color-on-interactive` (on). A single thumb colour cannot clear both grounds in both modes — paper on `ledger-300` in light mode is 1.62:1. **Position is the non-colour half of the signal** and survives grayscale on its own.

## Hit area

The track is 14–16px tall, under WCAG 2.5.8's 24px minimum. An `::after` overlay extends the pointer target without affecting layout.

## Labels are the caller's job

A switch with no label has no accessible name, and "on/off" is rarely enough on its own.
