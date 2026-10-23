# StatusBadge

Product. Composes `Badge` — it does not restyle it.

```tsx
<StatusBadge status="failed" />
<StatusBadge status="running" />
```

## Why this exists

§5 maps run and validation state onto the roles. This component holds that mapping in **one place** (`statuses.ts`), so three screens cannot each decide what "degraded" looks like. Import this rather than reaching for `Badge` with a hand-picked role — writing a second StatusBadge is in the failure log.

| Status | Role | Icon |
|---|---|---|
| `queued` | neutral | Clock |
| `running` | info | `Spinner` |
| `passed` | success | CheckCircle |
| `failed` | danger | XCircle |
| `stale` | warning | Warning |
| `needs-review` | warning | Eye |
| `agent-working` | agent | `Spinner` |
| `agent-proposed` | agent | Sparkle |
| `skipped` | neutral | MinusCircle |

## Icons are not decoration

Every status ships an icon as well as a hue, because §10 requires a **grayscale pass**: convert a run log to grayscale and every state must remain distinguishable. Colour alone fails that, and fails deuteranopia too. `hideIcon` exists for tight layouts but must not be used in a run log.

The two working states draw `Spinner` (§11.5), which moves only under `motion-safe` and stands on its still frame under `prefers-reduced-motion`. Every other mark is a circle or a figure, so the square stays distinct in grayscale. `running` and `agent-working` share it (decided 2026-10-20): in a badge they differ by hue and label, and for a deuteranope in dark mode the label is what separates them. Until then `agent-working` spun the Robot glyph, which tumbled.

The status map's `working` flag says which statuses draw the `Spinner`. `spin` is its deprecated alias, kept for callers that read the map.

## Row treatments are not the badge's job

§5 assigns some statuses a treatment that extends beyond the badge — a `--color-bg-danger` tint across a failed row, the `--color-bg-agent` ground and solid `--color-text-agent` left rail on an agent proposal (the rail `AgentBlock` draws, since 2026-10-21). A badge cannot tint the row it sits in, so those live in `runStatusRowTreatment`, which `DataTable`, `RunLogRow` and `AttachmentRow` read. A row that applies it pads with `--pad-cell-x`: the treatment takes the rail's 2px back off the left. Nothing else should.

## Labels

The default label comes from the table. Pass children to override the text while keeping the icon and tone — useful when a screen has its own vocabulary ("halted" rather than "failed"). The role never changes: that is the contract.

## `tone`, and `role` as an ARIA role

Each `runStatuses` entry carries `tone`, the `Badge` tone for that status. Until 2026-10-09 the field was `role`; it is still present with the same value, deprecated, so code reading `.role` keeps working. `StatusBadge` takes no `tone` (the status decides it) but passes `role` through as the ARIA attribute, e.g. `role="status"` on a badge that updates while a run progresses.
