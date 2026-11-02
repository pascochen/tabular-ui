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

The strip stands on a 1px rule in `--color-fill-interactive` that stops at the last tab. Each tab has `--color-border` on its top and sides and none at the bottom, and neighbours share one line: the list pulls each item back over the one before. The rule paints over each tab's last pixel, on the list's `::after`, so the strip stays one control height, the selected fill meets the rule, and no side border crosses it. Vertical turns this a quarter, with the rule on the inline edge, as `line` has it. Hover is `--color-bg-hover`. The selected tab is `--color-fill-interactive` with `--color-on-interactive`, and its overlay is `--color-bg-hover-inverse`, as a primary button's is (§4). No 2px indicator: the fill is the signal, and the rule is 1px because §7.8 keeps 2px for the three things it lists. It stops at the last tab because a rule running on would promise a panel, and a link has none (owner, after a side-by-side of four versions in place, 2026-11-02). Labels are SemiBold in the text's own case. No tab moves when the selection does.

**Focus.** The ring is inset by its own width plus the item's border, `-3px`, so it sits inside the shared line and a pixel above the rule. At the usual `-2px` the next item's border, painted later, covers the ring's outer pixel.

Inset, the ring sits on the item's own ground, so on the selected item it is `--color-on-interactive`, paper on ink, at 16.39:1 in both modes. `--color-ring` measures 1.80:1 in light and 1.29:1 in dark on that fill, under the 3:1 a focus indicator needs, and in a strip Tab lands on the selected tab first (owner, 2026-11-02). Every other item keeps `--color-ring`. No other control has an `on-*` ring, because every other ring sits outside the fill.

**Size.** `size` takes `default` (`--h-control`, `--text-base`, 14px icons) or `lg` (`--h-control-lg`, `--text-lg` with `--tracking-tight`, 16px icons), on `TabsList` or on `tabVariants`. `lg` is for a strip beside display type, where 13px goes unnoticed. `line` and `segmented` have no size, and the type rejects one.

**Forced colours** remove the fill and force the rule and every border to one colour, so the selected tab also gets a 2px underline there, §7.8's active tab width.

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

Use a real `<a>`, not `TabsTrigger`. A trigger renders a `<button>`, which does nothing before hydration or without JavaScript, and a screen reader announces a tab where a page load follows. Selected follows `aria-current="page"` on a link and `data-active` on a tab. Pass the result through `cn()`, which resolves the ring's offset against `controlBase`'s; `cva` on its own keeps both classes.

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
