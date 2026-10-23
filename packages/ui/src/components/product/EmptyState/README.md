# EmptyState

Product. The only host of a display-size icon.

```tsx
<EmptyState icon={TableIcon} title="No models in this project yet"
  description="Connect a dbt project to start tracking runs." action={<Button>Connect a project</Button>} />
```

## The one display icon

`--size-icon-display` (48px) at **`thin`** weight. §11.2: a stroke tuned to read at 16px looks heavy at 48px — the same correction §8.3 makes for type when it narrows the metric tier above 24px, in the same direction. This token landed with this component, exactly as §11.3 anticipated; do not reach for it elsewhere. A 48px icon in a dense screen is a mistake, not an emphasis.

## Sizes

| Size | Where | Padding |
|---|---|---|
| `sm` | inside a panel | 16px, icon drops to `--size-icon-lg` |
| `default` | inside a card, table or drop zone | 16px |
| `page` | stands in for a whole page | 16px sides, `--pad-frame-empty` (64px) top and bottom |

`page` is the frame tier's one use outside `AppShell` (§7.3 "Frame tier"): page-level air, paid once. Don't use it inside a container, where 64px is component spacing past the cap.

The 16px is `p-4`, by §7.4's fallback rule. Until 2026-10-08 it borrowed `--gap-section`, which then rose to 32px; tying an empty state's padding to a gap token would have doubled every empty state in a panel.

## Entirely neutral

§0 rule 1 names empty states in its neutral list. An empty table is not an error, a warning or a success — it is an **absence**, and absence has no state to communicate. Reaching for a hue here is exactly how a hue stops meaning anything elsewhere.

## Give it a way out

`action` is optional but nearly always right. An empty state that explains the absence and offers no next step is a dead end.
