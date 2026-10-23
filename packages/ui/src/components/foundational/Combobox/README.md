# Combobox

Foundational — the last of the 14. Base UI primitive, retokenized.

```tsx
<Combobox items={filtered} onInputValueChange={setQuery}>
  <ComboboxInput placeholder="Search models…" content="mono" />
  <ComboboxContent>
    <ComboboxEmpty>No models match “{query}”.</ComboboxEmpty>
    <ComboboxList>
      {(item: string) => <ComboboxItem key={item} value={item}>{item}</ComboboxItem>}
    </ComboboxList>
  </ComboboxContent>
</Combobox>
```

## Combobox or Select?

**Select** when the list is short enough to scan — environments, statuses, a handful of options.
**Combobox** when it is not — model names, accounts, schemas — and for **multi-select**, which Select deliberately does not cover.

## Composed from `Input`, not `InputGroup`

The vendored shadcn source depends on an `InputGroup` component that is **not among the 14**, and `CLAUDE.md` forbids adding a fifteenth foundational component without asking. This builds the field from `inputVariants` instead, with the caret and clear affordances absolutely positioned on the trailing edge.

That is also the better outcome: a combobox field is pixel-identical to every other field in a form — same height, padding, border, placeholder colour — which a separate wrapper component would not have guaranteed.

It takes `Input`'s `content` prop too, so `content="mono"` gives identifier lists the right face (§8.3).

## Surface

Popup, rows and group labels come from the shared `../popupSurface.ts` primitives, so Combobox, Select, Menu, Tooltip and Popover cannot drift. Selected rows take `--color-bg-interactive`, matching Select — selection is the interactive role (§4).

## Scroll cue

The list caps at 18rem and scrolls. Base UI gives Combobox no scroll arrows (Select has them), so `ComboboxList` masks whichever edge still hides rows, over 24px (`--h-row-xs`), the band Select's arrows occupy. A small hook sets `data-overflow-y-start` / `data-overflow-y-end` on the list (ScrollArea's attribute names) from scroll, resize and content changes, so filtering a list down to fit removes the cue. `scroll-padding` matches the fade, so arrow keys never park the highlighted row in the faded band. Rationale in §4, *Scroll cue*.

## Multi-select chips

`ComboboxChip` reuses **`chipVariants`** rather than being restyled from scratch. Base UI owns the chip's *behaviour* here — it is not our `Chip` component, which is a `<button>` with its own dismiss handling — but it must not look like a second kind of chip.

The chips container carries the `Input` treatment and grows with its contents, with `focus-within` driving the ring.

## Empty state

`ComboboxEmpty` is not optional. A list that silently renders zero rows reads as a bug; say that nothing matched, and echo the query.

## Filtering

Filtering is the caller's job — pass the narrowed array as `items`. Base UI's own helper is re-exported as **`useComboboxFilter`** if you want its matching rather than your own.

> shadcn's vendored file also exported a `useComboboxAnchor` helper. That is a shadcn local, not a Base UI export, and is not reproduced here. To anchor the popup to a chips container instead of the input, pass your own ref to `ComboboxContent`'s `anchor` prop — Base UI's Positioner takes it directly.
