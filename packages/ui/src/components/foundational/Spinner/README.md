# Spinner

Foundational. Added 2026-10-20 (approved): the working indicator. The full rule is `docs/design-system.md` §11.5; the exploration behind it is `docs/explorations/working-indicator-brainstorm.md`.

```tsx
import { Spinner } from 'tabular-ui';

<div className="flex items-center gap-[var(--gap-control-icon)] text-sm text-text-secondary">
  <Spinner />
  <span>Working…</span>
</div>

<Spinner aria-label="Loading results" /> {/* only where there is no visible label */}
```

## The mark

A square tracer: three quarters of a square outline, with the gap travelling clockwise at constant speed, 1.2s a lap. It is the notch spinner redrawn at 0px radius, so anyone who knows a spinner reads it at once, and it belongs to this product rather than to every app.

| | |
|---|---|
| Box | 16 units, `1em`, like a Phosphor icon |
| Square | 10.5 units a side: the area of `CircleNotch`'s circle |
| Segment | 75% of the perimeter, the notch's weight of ink |
| Stroke | Phosphor's scale: `bold` 1.5, `regular` 1, `light` 0.75, `thin` 0.5 units |

## Written, not `shadcn add`ed

shadcn's `Spinner` is a lucide `Loader2` with `animate-spin`, `role="status"` and `aria-label="Loading"`. This keeps its API (an `<svg>` with `data-slot="spinner"` that takes `className`) and draws our glyph. It is the one mark drawn outside Phosphor, an approved exception to §11.1, and it is drawn here only. Never hand-draw another.

## Behaviour

- **Size and colour come from context**, as a Phosphor icon's do: `1em` and `currentColor`. Inline, it takes its label's size. Elsewhere, pass the slot's size class (`size-[var(--size-icon-xs)]`). A `Badge` sizes it to its 10px mark.
- **Weight comes from `IconContext`.** Inside a `Button` it is `bold`, and `light` when the button is disabled (§11.2). Phosphor's own context default, `regular`, is read as unset and gives `bold`, the floor at 16px and below. An explicit `weight` prop wins over both.
- **Reduced motion.** The animation runs under `motion-safe` only. Otherwise the mark stands on its still frame: the segment centred on the top-right corner, the gap at the bottom left. That is also frame 0, which screenshot tests record.
- **Decorative by default** (`aria-hidden`). The label beside it says what is working. Given `aria-label`, it becomes `role="status"`.
- **Its keyframes ship with it.** The component renders a `<style href="tui-spinner">`, which React hoists to `<head>` once however many spinners mount. A consuming app needs no stylesheet of ours for it.

## Where it ships

`ChatThread` ("Working…"), `AgentReasoning` ("Thinking…"), `AgentPlan` ("Drafting step N…"), `StatusBadge` `running` and `agent-working`, and `apps/demo`'s `StageTracker`. The three labelled ones gain an elapsed figure after 3 seconds (`Working · 0:07`, §11.5), through the product layer's shared `WorkingLabel`. The figure is not the Spinner's job: a badge shows the mark alone.
