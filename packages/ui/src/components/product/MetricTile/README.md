# MetricTile

Product. A KPI figure.

```tsx
<MetricTile label="Net sales" value="¥34.4bn" delta="+7.9%" deltaValue={7.9} caption="vs. H1 FY2025" />
<MetricTile label="SG&A" value="¥14.0bn" delta="+1.5%" deltaValue={1.5} higherIsBetter={false} />
```

## The only user of the display tier

`--font-display` (Source Serif 4) applies here and **nowhere else** (§8.3). Headings share the serif through `--font-heading`, which reads from it. Spacing drawn for 13px text reads airy at 32px, and tabular figures compound it. With `font-optical-sizing: auto` the browser picks the serif's display cut at this size, which is drawn tighter, per glyph: `$847.2M` at 32px/600 measures 118.75px against 127.78px in the text cut (§8.4).

Set the family with the `font-display` utility, as every other family is set, and not with an inline `fontFamily`.

Tracking is **0, never negative** (§8.8). The optical size has already done that work; `--tracking-tight` on top double-counts.

| `size` | Token | Use |
|---|---|---|
| `default` | `--text-metric` (32px/36px) | The single hero figure |
| `sm` | `--text-metric-sm` (24px/28px) | A tile in a grid of 4+ |

## Direction is not goodness

`higherIsBetter` defaults to `true`. **Set it `false` for cost, error rate, latency, days-to-close** — anything where up is bad. A rising cost rendered green is not a styling slip; it is the dashboard telling the reader the opposite of the truth.

The delta arrow always follows the *direction* of the number; only the colour follows polarity. So a cost increase shows an up arrow in `--color-text-danger`, which is the honest reading.

Zero is neutral, never a hue (§5). §5 also restricts polarity colour to variance and delta — which is exactly what this prop colours, and why the figure itself never takes one.

## Formatting is the caller's

`value` and `delta` are rendered as given. Currency, locale and precision belong to the screen, which knows the user's locale and the account's currency; a tile that formatted `847200000` would have to guess both.

`deltaValue` is the raw signed number and exists only to decide polarity.

## Note

`tabular-nums` is repeated in both branches of the size ternary on purpose — the rule-5 lint heuristic matches one string literal at a time, so a metric class separated from its `tabular-nums` reads as a violation. Cheaper to satisfy the gate than to blunt it.
