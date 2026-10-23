# AppBar

Product. Composed from `Button`'s cva and `Menu`; nothing new at the primitive layer.

The application's top navigation band — brand, navigation, and trailing actions.

```tsx
<AppBar
  brand={<Logo />}
  actions={
    <>
      <IconButton aria-label="Search"><MagnifyingGlassIcon /></IconButton>
      <AccountMenu />
    </>
  }
>
  <AppBarNav align="end">
    <AppBarNavItem href="/" active>Dashboard</AppBarNavItem>
    <AppBarNavItem href="/pipelines">Pipelines</AppBarNavItem>
    <AppBarNavItem href="/models">Models</AppBarNavItem>
  </AppBarNav>
</AppBar>
```

## Parts

| Part | Renders | Notes |
|---|---|---|
| `AppBar` | `<header role="banner">` | `sticky top-0 z-40`. Three regions: `brand`, `children`, `actions` |
| `AppBarNav` | `<nav>` + `<ul role="list">` | Takes the slack between brand and actions |
| `AppBarNavItem` | `<li>` + `<a>` | `active` drives `aria-current="page"` and `data-active` |

## Props

| Prop | On | Default | Notes |
|---|---|---|---|
| `brand` | `AppBar` | — | ReactNode slot. `AppBar` owns no branding |
| `actions` | `AppBar` | — | ReactNode slot, 8px `--gap-inline` between children. `ml-auto`: always on the trailing edge, with or without an `AppBarNav` |
| `align` | `AppBarNav` | `start` | `start` / `center` / `end` |
| `aria-label` | `AppBarNav` | `"Main"` | Distinguishes the landmark when a page has more than one `<nav>` |
| `active` | `AppBarNavItem` | `false` | Current page |
| `render` | `AppBarNavItem` | — | Swap the `<a>` for a router link |

## Geometry

49px tall, measured: `py-2` (8px) around a 32px `--h-control` item, plus the 1px
`border-b`, which counts in the border box. `--h-control-lg` (36px) is the `min-h`
floor, matching `Toolbar`. `--pad-page-x` (16px) on the sides.

The nav list carries **no gap** — each item is a ghost control with
`--pad-control-x` (8px) per side, so adjacent labels already sit 16px apart.

Vertical padding is the one place with no role token. §7.4's fallback rule says to
use the primitive scale explicitly and say so, which is what `py-2` is doing. A
second shell component needing the same value is the moment to ask for
`--pad-appbar-y`, not before.

## Mechanisms worth knowing

**A nav item is a real `<a>` styled with `buttonVariants`, not Base UI's `Button`.**
`Button` runs `useButton`, which merges `type="button"` when `nativeButton` is true —
and logs a dev-time error if the rendered element is not a `<button>` — or
`role="button"` when it is false. On an anchor the second is a genuine regression: the
link gets announced as a button and loses its navigation semantics, with nothing
failing in CI to tell you. An anchor needs no behavior polyfill; the browser already
provides focus, Enter activation, middle-click and open-in-new-tab. So only the
*appearance* is shared, through the same cva `Button` itself consumes. This is not an
inlined primitive — there is no primitive behavior being reimplemented.

**`data-[active]`, bracketed, never `data-active:`.** Tailwind's shorthand compiles
inside `:where()`, which has zero specificity, so it ties with the base
`text-text-secondary` and loses on source order. The rule silently never applies.
`Tabs` documents the same trap.

**The active item has no 2px underline, deliberately.** §7.8 reserves
`--border-width-2` for exactly three things — agent left rail, focus ring, active tab
indicator — and a navbar is not a tab list. Keeping the underline out also keeps
`AppBar` visually distinct from `Tabs`, which matters because they mean different
things: tabs switch a view, a navbar changes the page.

**The active treatment is neutral, and that is a choice, not the only legal one.**
§1 lists "active nav item" under the interactive role, so a sage treatment would pass
review. Neutral is the default here because the active item is already redundantly
communicated by the page content itself, and §0 rule 1's reasoning applies — a
coloured pixel that is not carrying state is stealing attention from one that is. To
reverse it, change `data-[active]:text-text-primary` to `text-text-interactive`; do
not add an indicator bar.

Active also shifts the weight 500 → 600 per §8.5, which changes the label's width
slightly. That reflow only happens on navigation, when the page repaints anyway, so it
is not worth reserving width to prevent.

**`role="list"` is explicit on the `<ul>`.** Tailwind's preflight sets
`list-style: none`, and Safari drops list semantics from an unstyled list — the item
count stops being announced, with no visible symptom.

**Dropdowns use `Menu`, not a NavigationMenu primitive.** shadcn's `NavigationMenu`
would be a fifteenth foundational component and a change to the system contract.
`Menu` already ships submenus, checkbox and radio items, and keyboard wiring; it opens
on click rather than hover, which is the better behaviour in a tool people use for
hours. See the `WithDropdown` story. If hover-intent and a shared morphing viewport
are ever required, `NavigationMenu` gets added then and this component's public API
does not change.

**Router-agnostic by construction.** `AppBarNavItem` takes `active` as a plain boolean
and `render` for the element swap, so wiring React Router, TanStack Router, or plain
anchors is the app's decision. The design system adds no router dependency.

## Not implemented

**Responsive collapse.** Items are `shrink-0` and the bar does not scroll; a narrow
viewport overflows. The `Overflow` story makes this visible. `overflow-x-auto` is not
the fix — it would clip the items' focus rings, which is the failure §4 exists to
prevent. The right answer depends on the approved design (a "More" menu, a hamburger,
or a priority-plus pattern), so it waits for it.

## Adoption note

Not vendored — shadcn has no navbar block, and its `NavigationMenu` is a different
thing (a dropdown primitive, not an application bar). Built from `buttonVariants`,
`Menu`, and the token layer.

`AppBar` takes no state, so the "all five semantic roles" story requirement does not
apply: the component is neutral by §0 rule 1 in every configuration.
