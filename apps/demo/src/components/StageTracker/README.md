# StageTracker

A four-stage run tracker: done / active / pending. Journey-local on purpose —
one screen needs it. If a second screen ever does, promote it to
`src/components/product/` in Tabular UI with stories and a design review, per the
journey brief.

## State treatment

| State | Icon | Text | Why |
|---|---|---|---|
| done | `CheckCircle` bold, neutral | `--color-text-secondary` | finished work is context, not focus |
| active | `Spinner` (bold, §11.5), the label's colour | `--color-text-primary`, 500 | a running state: §5 never gives it the interactive sage, which reads as "passed" |
| pending | `Circle` light, `--color-text-tertiary` | `--color-text-secondary` | de-emphasized (§11.2 state treatment); the name is read, so not tertiary (§3) |

No stage carries a hue (until 2026-10-21 the active spinner was sage, the
success green). The spinner glyph and the `medium` label weight mark the
active stage, so it survives grayscale (§10): it is the one square mark in a
column of circles. Under `prefers-reduced-motion` the spinner's still frame
plus the weight mark the stage.

`activeIndex === stages.length` renders every stage done.
