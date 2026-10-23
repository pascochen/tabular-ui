# Toolbar

Product. A horizontal band of controls above a table or panel.

```tsx
<Toolbar>
  <Button size="sm"><PlusIcon />New model</Button>
  <ToolbarSeparator />
  <Input size="sm" placeholder="Filter models…" />
  <ToolbarSpacer />
  <IconButton size="sm" aria-label="Download as CSV"><DownloadSimpleIcon /></IconButton>
</Toolbar>
```

Renders `role="toolbar"`, which tells assistive technology these controls are one group.

## Parts

| Part | Purpose |
|---|---|
| `Toolbar` | The band. `variant="bare"` when it is already inside a bordered container. |
| `ToolbarSpacer` | Pushes everything after it to the trailing edge. |
| `ToolbarSeparator` | Vertical rule between control groups. |

`ToolbarSeparator` uses **`--color-border-strong`**, not `--color-border`. On `--color-surface` the plain border token is invisible in dark mode, where §3 gives both the same value — the same trap the popup dividers hit.

## Neutral by construction

A toolbar is structure, so the band itself never takes a hue (§0 rule 1). Any colour inside it comes from a control that is genuinely in a state — a selected `FilterChip`, a destructive `Button` — never from the container.
