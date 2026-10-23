# Tabs

Foundational. Adopted from shadcn/ui (Base UI, `base-mira`) and retokenized.

```tsx
<Tabs defaultValue="runs">
  <TabsList>
    <TabsTrigger value="runs">Runs</TabsTrigger>
    <TabsTrigger value="lineage">Lineage</TabsTrigger>
  </TabsList>
  <TabsContent value="runs">…</TabsContent>
  <TabsContent value="lineage">…</TabsContent>
</Tabs>
```

## `line` is the default

§7.8 reserves the 2px border width for exactly three things — agent left rail, focus ring, **active tab indicator**. The line variant is the one the spec anticipates, so it is the default.

The indicator is `--color-fill-interactive`, because §1 assigns "active nav item" to the interactive role. It renders on `::after` so it overlaps the list's 1px rule rather than displacing it, which keeps the row from shifting by a pixel when selection moves.

**Colour is not carrying this alone.** The active tab also steps from `--color-text-secondary` to `--color-text-primary`, so the state survives grayscale (§10).

## `segmented`

For switching **view modes** — table / chart / JSON — where the tabs read as a control rather than as navigation. The active tab lifts onto `--color-surface-raised` inside a `--color-bg-hover` track. No 2px indicator: the shape change is the signal.

## Orientation

`orientation="vertical"` moves the indicator to the inline edge and the rule to the inline border. Triggers go full width and left-aligned. It also switches the arrow keys to Up and Down and sets `aria-orientation="vertical"`, because `Tabs` passes the prop to Base UI as well as using it for layout. Before 2026-10-09 it used it only for layout, so a vertical strip was driven by Left and Right.

## Keyboard

From Base UI, pinned in `apps/storybook/tests/tabs.spec.ts`:

- The strip is **one tab stop**. Tab lands on the selected tab; the next Tab goes to its panel.
- Arrows **move focus without selecting** (manual activation). Enter or Space selects. A panel that runs a query shouldn't load because focus passed over its tab.
- Arrows wrap at the ends; Home and End jump to them.

## Disabled

A disabled tab stays **focusable**, so a screen-reader user arrowing through the strip hears that it exists. It is never selected, by click or by key. Because it's focusable, Base UI marks it with `data-disabled` and `aria-disabled` rather than the native `disabled` attribute. `controlBase` fades on both, so a disabled tab recedes at 50% like every other disabled control.

## Sizing

Triggers are `--h-control` (32px) with `--pad-control-x`, matching Button and Input, so a tab strip aligns with the controls beside it. Icons take `--size-icon-sm`, and `TabsTrigger` sets their weight from §11.2's state table: **`fill`** on the selected tab (solid vs outline is the state signal), **`light`** on a disabled one, **`bold`** on the rest (the ≤16px floor). Disabled wins if a tab is both. Don't pass `weight` on a tab's icon unless you mean to override the table. Until 2026-10-11 the stories passed `bold` by hand and nothing applied the other two rows.
