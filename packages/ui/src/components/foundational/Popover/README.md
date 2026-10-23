# Popover

Foundational. Adopted from shadcn/ui (Base UI, `base-mira`) and retokenized.

```tsx
<Popover>
  <PopoverTrigger render={<Button variant="outline">Add filter</Button>} />
  <PopoverContent>
    <PopoverHeader>
      <PopoverTitle>Add filter</PopoverTitle>
      <PopoverDescription>Applies to the current view.</PopoverDescription>
    </PopoverHeader>
    {/* any content, including focusable controls */}
    <PopoverClose render={<Button size="sm">Apply</Button>} />
  </PopoverContent>
</Popover>
```

## Popover, Tooltip or Menu?

- **Popover** — arbitrary content the user can click into: a filter panel, a small form, a detail card.
- **Tooltip** — a short label on hover or focus. Not focusable.
- **Menu** — a list of actions.

**Reach for Popover over Tooltip whenever the content matters.** Base UI's tooltip is visual only: its text carries no `id`, no `role`, and never reaches the accessibility tree. A Popover's content is real DOM and is announced normally.

## Surface

`popupSurface` from `../popupSurface.ts` — `--color-surface-raised` + 1px `--color-border-strong`, `--radius-md`, no shadow (§4). Same treatment as Tooltip, Select and Menu, from one definition.

Padding is `--pad-popover` (8px) and children are stacked with `--gap-field`.

**Width defaults to `w-72` and is meant to be overridden.** A filter panel and a detail card want different measures; the default exists so an unstyled popover is not ragged.

## No arrow

Consistent with `Tooltip`: in dense UI an arrow is noise, and the directional slide-in already indicates the anchor.
