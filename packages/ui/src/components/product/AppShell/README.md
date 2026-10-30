# AppShell

Product. Composed from `AppBar`, `IconButton`, `TruncatedText` and `Button`'s cva; nothing new at the primitive layer.

The application frame, built from the shell sketch (expanded and collapsed sidebar). The sketch was used for structure only. Its colours and styling were ignored.

```
┌──────────┬────────────────────────────────────────────┐
│ sidebar  │ top nav                                    │  ← one 49px rule across
│ header   ├──────────────────────────┬─────────────────┤
│──────────│ page header              │ panel header    │  ← and a second one
│ sidebar  │──────────────────────────│─────────────────│
│ body     │ main body                │ panel body      │
│          │ (scrolls)                │ (scrolls)       │
│──────────│                          │─────────────────│
│ footer   │                          │ panel footer    │
└──────────┴──────────────────────────┴─────────────────┘
```

The shell owns region geometry, scroll containment, and whether the sidebar and panel are open. It never owns content; every region is a slot.

```tsx
<AppShell
  topNav={
    <AppBar
      brand={<><AppShellSidebarToggle /><Breadcrumb /></>}
      actions={<><ChatToggle /><Button>Generate spec</Button></>}
    />
  }
  sidebarHeader={<OrgSwitcher orgs={orgs} currentOrgId={orgId} … />}
  sidebar={
    <>
      <ContextSwitcherLabel id="project-label">Project</ContextSwitcherLabel>
      <ProjectSwitcher projects={projects} currentProjectId={projectId} labelId="project-label" … />
      <AppShellNav>
        <AppShellNavGroup label="Business">
          <AppShellNavItem href="/analysis" icon={<PulseIcon />} active>Analysis</AppShellNavItem>
          <AppShellNavItem href="/questions" icon={<QuestionIcon />}>Questions</AppShellNavItem>
        </AppShellNavGroup>
      </AppShellNav>
    </>
  }
  sidebarFooter={<AccountMenu />}
  panel={
    <>
      <AppShellPanelHeader title="Chat" />
      <ChatThread turns={turns} busy={busy} />
      <AppShellPanelFooter>
        <ChatComposer onSend={ask} busy={busy} />
      </AppShellPanelFooter>
    </>
  }
  panelLabel="Chat"
  pageHeader={<AppShellPageHeader title="Analysis" actions={<PageActions />} />}
>
  <AnalysisPage />
</AppShell>
```

Region content that has to react to the layout reads it with `useAppShell()`:

```tsx
function ChatToggle() {
  const { panelOpen, togglePanel, panelId } = useAppShell();
  return (
    <Button variant="outline" aria-expanded={panelOpen} aria-controls={panelId} onClick={togglePanel}>
      <ChatsIcon /> Chat
    </Button>
  );
}

function Breadcrumb() {
  const { sidebarOpen } = useAppShell();
  // Company and project are already in the sidebar while it is pinned.
  const showAncestors = !sidebarOpen;
  …
}
```

## Sidebar: pinned or collapsed, and peek on hover

The sidebar has two states. **A click never opens an overlay.**

| State | What you see | Where the toggle is | Click | Mouse hover |
|---|---|---|---|---|
| **Pinned** | Docked, full height, 240px, pushes main | Sidebar header, trailing edge | Collapses | — |
| **Collapsed** | Gone. **No rail.** The breadcrumb takes over company and project | Top nav, leading edge | **Pins** | **Peeks** |

**Peek** is a floating overlay over main, opened by hovering the top-nav toggle with a mouse.
- It sits below the top nav, so the toggle that summoned it stays visible and clickable.
- It uses §4's overlay elevation (raised surface, strong border, the `--shadow-overlay` sheet, as `Dialog`). The 8px margin leaves the sheet 4px clear of the window edge and §7.7's drawer radius.
- It opens on a real mouse **move** over the toggle, not on `pointerenter`. The toggle mounts wherever the sidebar collapses, and when that is under a resting pointer (an unpin from the keyboard, crossing below the floor) Chromium fires a trusted `pointerenter` with no movement a frame later. Opening on that popped a peek straight after the user collapsed the sidebar. Enter arms the peek; the first move over the toggle opens it.
- It closes 300ms after the pointer leaves both the toggle and the peek.
- Escape closes it, and following a link closes it.
- Clicking the top-nav toggle, or the peek's own header toggle, **pins** it.
- It does not change `sidebarOpen`. The breadcrumb doesn't reflow under the pointer, and `aria-expanded` stays `false`: a peek is a pointer preview, not a state assistive technology acts on.
- A menu or select opened from inside the peek renders its popup outside the sidebar, so moving onto that popup reads as leaving. While a trigger inside the peek reports `aria-expanded="true"`, the peek stays open.

The model is complete without hover: Enter or a tap pins the sidebar, which reaches everything a peek shows. Touch pointers never peek.

**The toggle changes places, and focus goes with it.** Pinning removes the top-nav toggle the user pressed and reveals the one in the sidebar header. Collapsing does the reverse. The shell moves focus each time, so it never falls to `<body>`.

## Responsive behaviour

**Desktop only: laptop through wide monitor.** There is one breakpoint, Tailwind's stock `xl` (80rem, which is 1280px at the default root size). **Width only sets the default:**

- ≥1280px starts pinned (`defaultSidebarOpen`). Below 1280px it starts collapsed, and crossing below the floor collapses it.
- Pinning below the floor docks the sidebar there too: it pushes main rather than covering it. That pin doesn't survive a trip above the floor and back. Each width class keeps its own pin state, so a user who collapsed the sidebar on a wide screen gets it back collapsed.
- **The panel pushes main instead of covering it**, at every width. At the 1280px floor with both sides open, main keeps 600px (`AtFloor` story). Below the floor, pinning the sidebar with the chat open leaves main narrow: 344px at 1024px.
- **The page is capped, the prose is not.** Once `<main>` is wider than `--w-content` (1280px, gutters included), the page header and body centre in that column (§7.9), so a wide monitor gets margins either side. **Table pages opt out with `contentWidth="full"`**: where extra width means extra columns, the grid runs to main's edges less the 48px frame gutter, and the page header follows. Prose, forms, dashboards and detail pages keep the default, `"contained"`. Compare the `Wide` and `CentredColumn` stories, both at 2560. Prose still sets its own, narrower measure; the story uses `max-w-[56ch]`, about 69 characters a line at `--text-base`. A `ch` is the width of "0" (6.46px in Source Sans 3 at 13px), wider than the average character (~5.3px, spaces included), so `Nch` gives roughly 1.2×N characters. The ratio is the font's: it was ~1.3 in Inter (8.2px against ~6.2px) and Archivo (7.4px against ~5.7px). The measure was kept at 56ch through the switch to Source Sans 3 (2026-10-16), so lines run about 4 characters shorter than before. `72ch` looked right and ran to about 95. Use container queries (`@container`) for content that has to respond to the width of main. Pinning, collapsing and the panel all change that width while the viewport stays the same.

## Parts

| Part | Renders | Notes |
|---|---|---|
| `AppShell` | 2×2 grid: pinned sidebar spans column 1; top nav and body in column 2 | `h-dvh`. A peeking sidebar moves into the body cell and overlaps main. It's the same element, so its scroll position survives |
| `AppShellSidebarToggle` | `IconButton` | Top-nav toggle. First in `AppBar`'s `brand` slot. Renders only while collapsed. Click pins; mouse hover peeks. No tooltip, because the peek would land on top of it |
| `AppShellPageHeader` | 49px band with the page's `<h1>` + `actions` | In the `pageHeader` slot. Its rule lines up with the panel header's |
| `AppShellPanelHeader` | 49px band with an `<h2>` + `actions` | Same band height as the top nav |
| `AppShellPanelBody` | Scrolling region | A panel that isn't a chat. `ChatThread` goes in its place: it carries the body's insets and is its own scroller |
| `AppShellPanelFooter` | Pinned region | The composer, `ChatComposer` |
| `AppShellNav` / `AppShellNavGroup` / `AppShellNavItem` | `<nav>` / labelled `<ul>` / `<li><a>` | An item takes `icon`, or `avatar` for a person, and `trailing` for a count or badge after the label. See below |
| `useAppShell()` | Hook | `sidebarOpen` (pinned; a peek doesn't count), `toggleSidebar`, `panelOpen`, `setPanelOpen`, `togglePanel`, `panelId` |

The sidebar-header toggle is rendered by the shell itself, after `sidebarHeader`. You don't place it.

The shell's landmarks: the top nav is `AppBar`'s `banner`, the page is `main`, the panel is a `complementary` named by `panelLabel`, and the sidebar is a `region` named by `sidebarLabel` ("Sidebar"), with `AppShellNav`'s `navigation` inside it. Everything the shell renders sits in one of them. See *The sidebar is one region* below.

## Props

| Prop | Default | Notes |
|---|---|---|
| `topNav` | (required) | Normally an `AppBar` |
| `sidebarHeader` | — | Leading edge of the sidebar header: the company switcher |
| `sidebar` | — | Sidebar body. Scrolls on its own |
| `sidebarFooter` | — | Pinned to the bottom: account, settings |
| `sidebarLabel` | `"Sidebar"` | Name of the sidebar's `region` landmark, which holds the header, body and footer |
| `defaultSidebarOpen` | `true` | Whether the sidebar starts pinned at ≥1280px. Below the floor it always starts collapsed |
| `panel` | — | Panel content. Without it there is no panel and nothing to toggle |
| `panelLabel` | — | Name of the `complementary` landmark. Pass it whenever `panel` is set |
| `pageHeader` | — | An `AppShellPageHeader`. Rendered at the top of `<main>`, above its scrolling body |
| `panelOpen` / `defaultPanelOpen` / `onPanelOpenChange` | — / `true` / — | Controlled or uncontrolled panel state |

If none of the three sidebar slots is set, the shell has no sidebar, and neither toggle renders.

## Geometry

- **Header bands: 49px**, measured: `--pad-band-y` (8px) around a 32px `--h-control` child, plus the 1px rule. `AppBar` uses the same recipe. The height is emergent on purpose (§7.4 explains why there is no `--h-band`), so a band's child must be at least `--h-control` tall. Both headings have a 32px minimum height for that reason. Two rules run across the shell: the top nav with the sidebar header, and the page header with the panel header. The spec checks both.
- **Sidebar: `--w-sidebar` (240px). Panel: `--w-panel` (440px).** §7.9. The panel width comes from the sketch (about 440px at 1440). `ContextSwitcher`'s compact popup is capped at `--w-sidebar` too.
- **One top inset for every region: `--pad-page-y` (16px)**, while `<main>` is under 672px. The sidebar body, `<main>` and the panel body all start their first content 16px below the shared header rule, so the three columns open on one line. Before the 2026-10-07 audit these were 8px, 16px and 12px. Once main is 672px or wider, it opens `--pad-frame-top` (48px) below the rule instead (§7.3 "Frame tier"); the sidebar and panel stay at 16px.
- **One side gutter for every chrome column: `--pad-page-x` (16px).** The sidebar's edges match the top nav's, and the panel's content edge lines up with the top nav's trailing action above it. The panel used `--pad-panel` (12px) until 2026-10-07. `--pad-panel` stays the token for panels *inside* a page, such as `Dialog`.
- **Main is wider: `--pad-content-x` (24px)**, on the page header and the main body alike, while main is under 672px. The title and the body text start at x+24 from main's edge, in line with the breadcrumb text in the top nav (§7.4). **At 672px and wider, the frame tier's `--pad-frame-x` (48px)** takes over, and the breadcrumb alignment is given up for the page's air (§7.3). `<main>` is an `@container/main`, so this follows main's own width: pinning the sidebar or opening the panel can switch it while the viewport stays the same. At the 1280px floor with both sides open (600px), the frame is off. Tabs indent their labels by their own 8px padding, so their underline starts on the text edge.
- **Sidebar sections are `--gap-nav-group` (24px) apart**, both between `AppShellNav`'s groups and between the project block and the nav.
- **Both footer bands carry `py-3` (12px)**, from the primitive scale. The sidebar's is 56px around its 32px account row. The panel's holds `ChatComposer`, a two-row box, so it is taller and the two bottom rows no longer share a line. That changed on 2026-10-13, when Send moved inside the composer, where every chat surface people know puts it; the line-up was decided while the composer was a one-line sketch.
- **`<main>` padding** is also what gives focus rings room inside the scroll container (§4, "Room").
- **Active nav icons switch to `fill`** (§11.2's state rule), on top of the weight and text-step change. An explicit `weight` on the icon overrides it.

## Page title: `AppShellPageHeader`

Every page passes an `AppShellPageHeader` to `pageHeader`. It renders the page's `<h1>` at §8.1's page-title tier: `--text-lg` (16/24), 600, `--tracking-tight`, `--color-text-primary`. That is one step above the 14px section headings, so a 13px screen has somewhere for the eye to start. Page-level controls go in `actions`.

```tsx
<AppShell pageHeader={<AppShellPageHeader title="Analysis" actions={<PageActions />} />} …>
```

**Why it's a shell part, not a component the page drops into its content.** The band's rule lines up with the panel header's because the shell places both directly under the top nav. A page header inside the scrolling body would only line up when scrolled to the top, and only if main's padding happened to add up to the band height. Before this part existed, the tab underline sat on the panel rule by exactly that kind of coincidence. The same placement keeps the title visible while the body scrolls.

**`<main>` is a column**: the page header, then `app-shell-main-body`, the region that scrolls. The title stays inside the `main` landmark, so the skip link and a screen reader's landmark navigation land on it.

**Tabs stay in the page body.** They belong to the content they switch, and a band holds one `--h-control` row.

**Long titles truncate with an ellipsis** (`LongPageTitle` story). The ellipsis sits on an inner `<span>`, because `text-overflow` does nothing on a flex container. `AppShellPanelHeader`'s `<h2>` had that bug and now uses the same span. The full title stays in the DOM, and `TruncatedText` shows it in a tooltip below the title, only when it is actually cut off. `title` is a string for that reason: the tooltip repeats it.

## Mechanisms worth knowing

**The bounded height belongs to the shell.** `DataTable` virtualizes against its scroll container. If the parent has no height limit, every row renders (see the failure log). The `WithTable` story has 2,000 rows, and the spec asserts that fewer than 100 are in the DOM.

**The peek is not a `Popover` and not a `Dialog`.** It's the sidebar itself, restyled in place.
- A `Dialog` is modal: a scrim and a focus trap for something that should vanish when the pointer leaves.
- A `Popover` anchors to its trigger, but the peek is pinned to the shell's leading edge at full height.
- No focus trap and no scroll lock: the page stays live under a peek. All the shell adds is hover-intent timing and Escape.

**Element references are refs fed by callback refs, and read only in effects and handlers.** The top-nav toggle registers itself through `registerToggle` in context. Reading a ref's element through context during render fails `react-hooks/refs`. The toggle also destructures the context before using it, because passing a context member as a ref makes React Compiler treat the whole object as a ref.

**The sidebar is one region.** The `<section>` that holds the header, body and footer carries `aria-label={sidebarLabel}`, so it is a `region` landmark. Until 2026-10-29 the sidebar's only landmark was `AppShellNav`'s `<nav>`, and the header (`OrgSwitcher`), the footer (`AccountMenu`) and the project block above the nav sat outside every landmark: axe's `region` rule flags that, and a screen reader's landmark list never reached them. The story tests missed it because they scope axe to the story root; an axe run on the whole Kasane demo page found it.
- **`region`, not `complementary` or `nav`.** It names a place to jump to and claims nothing about what is in it. `complementary` would say the workspace switcher and the navigation are supporting content, and an outer `nav` would put a second navigation landmark around the first. `AppShellNav`'s `<nav>` nests inside the region unchanged.
- **One landmark, not one per band.** A region each for the header and footer would add two entries to the landmark list for one control each.
- **It follows the sidebar's state.** Collapsed, the `hidden` attribute takes the region out of the accessibility tree; a peek shows it again. The toggles' `aria-controls` already point at it.

**`flex` only while the sidebar is shown.** A `display` utility beats the `hidden` attribute. An unconditional `flex` would keep a "hidden" sidebar on screen.

**The skip link is parked above the viewport rather than using `sr-only`.** See the failure log: `buttonVariants`' `relative` beat `sr-only`'s `absolute`, and the link took a grid cell.

**Closing the panel from inside it returns focus to the panel's opener**, meaning whatever carries `aria-controls={panelId}`. Otherwise the focused element would unmount and focus would drop to `<body>`.

**Active nav is neutral**, the same as `AppBarNavItem`. If the current page needs a background, §4's answer is `--color-bg-interactive`, never `--color-bg-hover`.

## People and counts in the sidebar

`AppShellNavItem` takes two optional slots beside `icon` (`PeopleAndCounts` story):

- **`avatar`**: an `Avatar size="sm"` for a link to a person, in `icon`'s place. It is a separate prop because `icon` is cloned with a Phosphor `weight` (§11.2), which an avatar would pass to the DOM. At 24px it sits in the 32px row as it does in the sidebar footer, so a person's label starts 8px right of an icon's.
- **`trailing`**: what follows the label, such as a `Badge shape="count"` or the `agent` badge that marks the AI as a member. The label truncates and the trailing content keeps its width.
- **The link's name is its label**, so what sits beside the label must not repeat it or run into it. An avatar beside a name takes `aria-hidden`, or the link reads "DO Daisuke Onodera". A count's badge takes `aria-hidden` too, and its meaning follows the label as visually hidden text, `sep-close<span className="sr-only">, 4 open</span>`. Inside the badge, the link read "sep-close4 open".

## Not implemented

These are needed by the sketch but fall outside the shell. The stories use fixtures for them:

- **Breadcrumb.** The story builds one inline from `Button`/`Menu`, including the page switcher (`Analysis ⇕`). It should become a product component.

These shell features are also not built yet:

- Persisting collapsed state (the docked sidebar is uncontrolled).
- A keyboard shortcut for either toggle.
- Resizable regions.

## Testing

`apps/storybook/tests/app-shell.spec.ts` (Playwright, 29 tests) covers the sketch geometry, the shared rule, one text-start x for every sidebar label, trigger and nav item, pin and collapse with the focus hand-off, peek (overlay geometry, survives crossing into it, closes on leave and Escape, pins on either toggle, doesn't reflow the breadcrumb, doesn't open for a toggle that reappears under a resting pointer), the panel toggle, virtualization, focus-ring room, the skip link, and pin state across the floor, and axe's `region` rule on the whole page, Storybook's own hidden screens removed first. Behaviour depends on the viewport, and the vitest browser runner ignores Storybook's viewport globals, so this coverage lives in Playwright rather than story play functions.

Stories pin a viewport with `globals: { viewport: { value: 'laptopLg' } }` (1440, the sketch's width). The desktop viewports are defined in `apps/storybook/.storybook/preview.tsx`.
