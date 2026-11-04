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

## `bordered`

One 1px `--color-border` rectangle frames the strip, the same frame as the site's nav and a table, with no line between tabs. It's on the list's `::before`, so the strip stays one control tall, and the tabs paint over it. The selected tab is `--color-fill-interactive` with `--color-on-interactive`, reaching the strip's edge like an inked cell in a ruled row, and its overlay is `--color-bg-hover-inverse`, as a primary button's is (§4). Hover on the others is `--color-bg-hover`. Vertical uses the same rectangle, with the tabs stacked and left-aligned. No 2px indicator: the fill is the signal. Labels are SemiBold in the text's own case, and start where a `Button`'s do. No tab moves when the selection does.

The owner chose this on 2026-11-03, from a side-by-side with separate rectangles and an inset fill. It replaced boxed tabs on a 1px ink rule (2026-11-02), which belonged to neither the nav nor the tables. Separate rectangles measured the same as `Button variant="outline"` in everything but weight, so a strip beside buttons read as more buttons. An inset fill has `segmented`'s geometry.

**Focus.** The ring is inset by its own width plus one pixel, `-3px`, so a pixel of the item's ground stays outside it. At `-2px` the ring reaches the item's edge, and on the selected tab a paper ring would meet a paper canvas, so the fill would only look smaller.

Inset, the ring sits on the item's own ground, so on the selected item it is `--color-on-interactive`, paper on ink, at 16.39:1 in both modes. `--color-ring` measures 1.80:1 in light and 1.29:1 in dark on that fill, under the 3:1 a focus indicator needs, and in a strip Tab lands on the selected tab first (owner, 2026-11-02). Every other item keeps `--color-ring`. No other control has an `on-*` ring, because every other ring sits outside the fill.

**Size.** `size` takes `default` (`--h-control`, `--text-base`, 14px icons) or `lg` (`--h-control-lg`, `--text-lg` with `--tracking-tight`, 16px icons), on `TabsList` or on `tabVariants`. `lg` is for a strip beside display type, where 13px goes unnoticed. `line` and `segmented` have no size, and the type rejects one.

**Forced colours** remove the fill and paint every item's transparent border, so each tab keeps an edge. All of them look alike there, so the selected tab also gets a 2px underline, §7.8's active tab width.

### `tabVariants`, for links

The appearance is exported on its own, for a nav that changes the page:

```tsx
<nav aria-label="Foundations">
  <ul role="list" className={tabsListVariants({ variant: 'bordered' })}>
    <li>
      <a href="/color" aria-current="page" className={cn(tabVariants({ size: 'lg' }))}>
        Color
      </a>
    </li>
  </ul>
</nav>
```

Use a real `<a>`, not `TabsTrigger`. A trigger renders a `<button>`, which does nothing before hydration or without JavaScript, and a screen reader announces a tab where a page load follows. Selected follows `aria-current="page"` on a link and `data-active` on a tab. Pass the result through `cn()`, which resolves the ring's offset, the background clip and the overlay's inset against `controlBase`'s; `cva` on its own keeps both classes of each.

## Orientation

`orientation="vertical"` moves `line`'s indicator to the inline edge and its rule to the inline border. Triggers go full width and left-aligned. It also switches the arrow keys to Up and Down and sets `aria-orientation="vertical"`, because `Tabs` passes the prop to Base UI as well as using it for layout. Before 2026-10-09 it used it only for layout, so a vertical strip was driven by Left and Right.

## Keyboard

From Base UI, pinned in `apps/storybook/tests/tabs.spec.ts`:

- The strip is **one tab stop**. Tab lands on the selected tab; the next Tab goes to its panel.
- Arrows **move focus without selecting** (manual activation). Enter or Space selects. A panel that runs a query shouldn't load because focus passed over its tab.
- Arrows wrap at the ends; Home and End jump to them.

## Disabled

A disabled tab stays **focusable**, so a screen-reader user arrowing through the strip hears that it exists. It is never selected, by click or by key. Because it's focusable, Base UI marks it with `data-disabled` and `aria-disabled` rather than the native `disabled` attribute. `controlBase` fades on both, so a disabled tab recedes at 50% like every other disabled control.

## Sizing

Triggers are `--h-control` (32px) with `--pad-control-x`, matching Button and Input, so a tab strip aligns with the controls beside it. Icons take `--size-icon-sm`, and `TabsTrigger` sets their weight from §11.2's state table: **`fill`** on the selected tab (solid vs outline is the state signal), **`light`** on a disabled one, **`bold`** on the rest (the ≤16px floor). Disabled wins if a tab is both. Don't pass `weight` on a tab's icon unless you mean to override the table. Until 2026-10-11 the stories passed `bold` by hand and nothing applied the other two rows.
