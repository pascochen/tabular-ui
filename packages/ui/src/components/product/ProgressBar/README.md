# ProgressBar

Product. A track and a fill.

```tsx
<ProgressBar value={62} label="Run progress" showValue />  {/* tone defaults to info */}
<ProgressBar label="Compiling dbt project" />  {/* indeterminate */}
```

## `label` is required

A bare bar announces nothing. `role="progressbar"` without an accessible name tells a screen-reader user that something is at 62% — of what, they cannot tell.

## The hue must be true of the run

§0 rule 1 applies here as everywhere: `info` (the default) for work in progress, because it is the role that means running (§1, §5) — not `interactive`, which is ledger ink and renders a neutral bar that says nothing about the run's state, so it is decoration — `success` when it completed, `danger` or `warning` only when something genuinely is failing or degrading. **A red bar because a number is low is decoration**, and it spends a hue that then means less everywhere else.

## Geometry

2px (`sm`) or 4px track — thin enough to sit in a 28px row without fighting its rhythm. The track is `--color-border-strong` rather than a surface step, so it stays visible on the canvas *and* on a raised surface.

`--radius-full` is correct here and is not the pill §7.7 warns about: that argument concerns repeated status markers scalloping a column edge. A progress track is a capsule, and §7.7 permits full radius for things that are inherently round.

Indeterminate bars animate under `motion-safe:` only. Under `prefers-reduced-motion` the bar holds still and the label carries the meaning.

## `tone`, not `role`

The colour prop is `tone` (`info` by default; `interactive` · `success` · `warning` · `danger` · `agent`). It was `role` until 2026-10-09, which is the ARIA attribute this component always sets to `progressbar` itself. `role` is still honoured as the deprecated spelling of `tone`; lint rejects it in new code.
