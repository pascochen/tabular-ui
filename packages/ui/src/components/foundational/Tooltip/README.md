# Tooltip

Foundational. Adopted from shadcn/ui (Base UI, `base-mira`) and retokenized.

**Not optional.** A truncated table cell is unreadable without one, and truncation is the norm in this product, not the edge case.

```tsx
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from 'tabular-ui';

// once, at the app root
<TooltipProvider>{app}</TooltipProvider>

<Tooltip>
  <TooltipTrigger render={<Button variant="outline">Hover me</Button>} />
  <TooltipContent>Re-run every downstream model</TooltipContent>
</Tooltip>
```

Composition uses Base UI's `render` prop, not `asChild`.

## `TooltipProvider` is required, not decorative

`Tooltip.Root` has **no delay prop of its own** — Base UI reads the delay from the provider. Without one mounted, every tooltip silently falls back to the library default and the 300ms decision below does not apply. There is no error and nothing visibly breaks; the timing is just wrong.

Mount it once at the app root. Storybook mounts it in `apps/storybook/.storybook/preview.tsx`.

## Timing

| | |
|---|---|
| `delay` | **300ms** |
| grouping `timeout` | 400ms (Base UI default) |

300ms is long enough that sweeping a pointer across a 30-row table does not fire a storm of popups, and short enough to feel responsive when you rest on a target. Once any tooltip is open, adjacent ones open **instantly** for 400ms after the previous closes — so scanning a toolbar reads as one continuous gesture rather than a series of waits.

## Appearance

**A raised surface, not an inverted ground.** shadcn ships `bg-foreground text-background` — the conventional dark-on-light tooltip. §4's elevation table names tooltip explicitly under *Raised → `--color-surface-raised` + `--color-border-strong`*, and the spec wins on rules. No shadow: shadows barely register on a `ledger-950` canvas, which is why the system expresses depth with a background step plus a 1px border.

- Radius `--radius-md` (0px since 2026-10-16) — §7.7 groups tooltip with dropdown and popover
- Text `--text-xs` (11px/16px) — §8.1's help-text tier
- Padding `--pad-popover` (8px) horizontal; **4px vertical from the primitive scale**, an explicit fallback since no vertical popover token exists. Measured height is 26px — 16px line-height, 8px padding, 2px border.

**No arrow.** The vendored source shipped one; in dense UI it is ~10px of noise per tooltip, and the directional slide-in already indicates the anchor. The per-side arrow positioning block was removed with it.

The `kbd` slot handling from the vendored source was also removed — there is no `Kbd` component yet. Restore it from git history if one lands.

## Accessibility — read this before putting anything in a tooltip

**Base UI's tooltip is visual only. Its text is not announced to screen readers.** Verified 2026-08-02: the popup carries no `id` and no `role`, the trigger gets no `aria-describedby`, and the string `aria-describedby` does not appear anywhere in `@base-ui/react/tooltip`. This is Base UI's design, not a misconfiguration on our side.

The consequence is a hard rule:

> **Never put information in a tooltip that exists nowhere else.**

A tooltip is a convenience for sighted users. The accessible name or description has to come from somewhere else — and in every case the system currently has, it does:

- **`IconButton`** — `aria-label` is mandatory and supplies the name independently. The tooltip merely shows sighted users what screen-reader users already get. This is the correct pattern, not a workaround.
- **Truncated table cells** — the full text is in the DOM and only visually clipped by `text-overflow`, so assistive technology reads it in full.

If a case ever genuinely needs tooltip-only content announced, wire `aria-describedby` explicitly at that call site, or reach for `Popover` instead. Do not assume this component does it.

Tooltips **do** open on keyboard focus, so the affordance is reachable without a pointer — verified by tabbing to a trigger.

## Related

`IconButton` wraps itself in a Tooltip automatically, using its required `aria-label` as the text. See that component's README.
