# RunLogRow

Product. One pipeline execution entry.

```tsx
<RunLogRow status="passed" name="stg_sap__bkpf" timestamp="14:21:02" duration="1.8s" />
<RunLogRow status="failed" name="dim_accounts" timestamp="14:21:09" detail={errorText} />
```

## 24px, not 28px

`--h-row-xs`, tighter than `DataTable`'s `--h-row-sm`, because a run log is **scanned** rather than read. §7.6 assigns 24px to exactly this: "dense table rows, log lines, activity feed items".

An 18px `StatusBadge` in a 24px row leaves 3px each side — tight but correct, and the reason §7.3 justifies the 2px padding step at all.

## Composes, does not decide

The status hue, icon and label come from `StatusBadge`. The row tint comes from `runStatusRowTreatment` — the `--color-bg-danger` ground on a failed run, the `--color-bg-agent` ground and a solid `--color-text-agent` left rail on an agent proposal, with 2px less left padding so the row's content stays in line. §5 owns that mapping and it lives in one place; this component only applies it.

## Expansion

Passing `detail` makes the row expandable. A failed run is useless without its error, and sending the reader to a detail page loses their place in the log.

- Collapsed row stays 24px; the caret is present-but-invisible on non-expandable rows so identifiers stay aligned down the log
- Detail renders in `--font-mono` with the slashed zero, `whitespace-pre-wrap`, behind a `--border-width-2` rail
- Controlled via `open`/`onOpenChange`, or uncontrolled via `defaultOpen`
- Only an expandable row is a control: `Button variant="inline"` with `aria-expanded`, the same as `LineageTree`'s rows. A plain row is a `<div>`. Both take one set of row classes, so they render identically (checked pixel for pixel, 2026-10-12). Until then the row chose its tag through a variable (`const Row = expandable ? 'button' : 'div'`), a hand-styled `<button>` the lint gate could not see.

Its focus ring uses a **negative** `outline-offset` so it survives a scrolling log with `overflow: hidden` (§4).

## Identifiers

`name` renders in `--font-mono` at `--text-xs` — one step below the adjacent sans, because mono runs visually larger at equal px (§8.3) — with `"zero" 1` for the slashed zero, since these are read as data.

## This is the run-log screen

The two checks still open in §10 — whether `bold` as the default icon weight reads too heavy (§11.2), and the grayscale pass — are meant to be judged here. The `RunLog` and `Grayscale` stories exist for that.
