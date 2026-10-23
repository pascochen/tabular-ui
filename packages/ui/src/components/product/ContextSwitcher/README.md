# ContextSwitcher

Product. Composes `Menu`, `Button` and `TruncatedText`.

Switches the context the rest of the screen is about. **Reach for a wrapper first**:

| Wrapper | Trigger | Where |
|---|---|---|
| `OrgSwitcher` | `compact` | Sidebar header, beside the toggle |
| `ProjectSwitcher` | `block` | Sidebar body, under a `ContextSwitcherLabel` |

Use `ContextSwitcher` directly only for a new kind of context, and give it a wrapper once it has a second call site. The wrappers own the wording, and this component owns the behaviour, so the two switchers cannot drift apart on keyboard, truncation or copy confirmation.

```tsx
<ContextSwitcherLabel id="workspace-label">Workspace</ContextSwitcherLabel>
<ContextSwitcher
  items={workspaces}
  currentId={workspaceId}
  onSwitch={setWorkspaceId}
  label="Workspaces"
  actions={[
    { type: 'item', label: 'Archive workspace', icon: <ArchiveIcon />, onSelect: archive },
    { type: 'copy-id', label: 'Copy workspace ID', announcement: 'Workspace ID copied' },
  ]}
  createLabel="Create workspace"
  onCreate={openCreate}
  trigger="block"
  labelId="workspace-label"
/>
```

## Props

| Prop | Type | Notes |
|---|---|---|
| `items` | `{ id, name }[]` | Display order |
| `currentId` | `string` | Shown on the trigger and checked; the only row with a submenu, if `actions` is given |
| `onSwitch` | `(id) => void` | Picking another item. The menu closes |
| `label` | `string` | The menu's section label — "Projects" |
| `actions` | `ContextAction[]?` | The current item's submenu, top to bottom. Omit it for no submenu: the current row then only closes the menu, with its check at the trailing edge |
| `createLabel` | `string` | "Create project" |
| `onCreate` | `() => void` | |
| `trigger` | `'compact' \| 'block'` | Default `compact` |
| `labelId` | `string` | `block` only — the `ContextSwitcherLabel`'s `id` |

`ContextAction` is either `{ type: 'item', label, icon, onSelect, variant? }` or `{ type: 'copy-id', label, announcement }`. Copy is built in because it owns state: the "Copied" label and its announcement. Icons are Phosphor elements, and their weight is filled in at §11.2's ≤16px floor (`bold`) the way `IconButton` does it. `variant: 'destructive'` uses `MenuItem`'s destructive treatment: text colour, tinted only on highlight.

## Triggers

Both are `Button variant="ghost"`. Neither is a hand-styled `<button>`.

**`compact`** sizes to the name with the caret beside it, for a header band shared with other controls. `shrink` undoes `Button`'s `shrink-0`, or a long name would push past the sidebar (see the failure log).

**`block`** fills its container:

| State | Treatment |
|---|---|
| Rest | Plain text. Ghost is transparent and its border is transparent |
| Hover | The shared `--color-bg-hover` overlay; text steps body → primary |
| Open | Same fill and text, held by `data-popup-open` while the pointer is in the menu |
| Focus | The shared outline ring, `:focus-visible` only |

The caret sits at the far edge. The name takes the free width, and `--gap-inline` (8px) is the *minimum* gap a long name truncates against. The menu is `w-(--anchor-width)`, so it drops out of the trigger at its width. The trigger is named by its label and then its own content, as in "Project FY2026 H1 close". The label alone would drop which project is current.

The cursor is the default arrow, like every control and menu row in the system.

## `ContextSwitcherLabel`

The §8.1 micro-label tier, matching `AppShellNavGroup`'s label. Its inline padding is the trigger's `--pad-sidebar-item`, **plus the same 1px transparent inline border `Button` carries**. With padding alone the label's text lands 1px short of the trigger's. Measured: the label and name both start at the same x, which `apps/storybook/tests/project-switcher.spec.ts` asserts.

## Menu

Two layouts, chosen by whether `actions` is given:

| | With `actions` (`ProjectSwitcher`) | Without (`OrgSwitcher`) |
|---|---|---|
| Current row | Leading check, trailing chevron, opens the submenu | Trailing check, closes the menu |
| Leading slot | Every row reserves `--size-icon-sm`, holding the check, the plus or nothing, so names line up (the same mechanism as `MenuCheckboxItem`'s indicator) | None. Names start at the row padding; the plus starts with them |

The trailing edge holds one mark: the chevron when the row opens something, the check otherwise.

- **Only the current item can have a submenu.** Rows that switch and the row that configures are never the same gesture.
- **The check is neutral.** "Current" is carried by shape (the check), position and the accessible name (`"…, current"`). A hue would be colour as hierarchy (§0 rule 1).

### Density

`MenuContent density="spaced"`: the switcher is picked from the sidebar, not scanned over a table. The values and their rationale are in `Menu`'s README.

Submenu timing, flip and keyboard are all Base UI's:
- The submenu opens on hover after Base UI's 100ms delay.
- It opens inline-end and flips on collision.
- Right or Enter opens it; Left or Esc closes only the submenu; a second Esc closes the menu and returns focus to the trigger.

## Copy ID

There is no toast in the system. The item reads **"Copied"** for 1.5s with the menu kept open (`closeOnClick={false}`), and `announcement` goes to a polite `role="status"` region outside the portal. A rejected clipboard write leaves the label unchanged.

## Truncation

Names truncate on the trigger and on every row through `TruncatedText`, so **only a name that is actually cut off** gets a tooltip. The component is shared; this switcher only picks the sides.

| Where | Side | Why |
|---|---|---|
| Other rows | inline-end, clear of the popup | Covers nothing. `rowTooltipOffset` adds `popupRowInset()` (the row padding, list inset and border, read from their tokens when the tooltip is positioned) to Tooltip's 4px, so a token change moves it with no edit here |
| Current row | top | Inline-end is where its submenu opens, or, without one, the check, which `rowTooltipOffset` does not clear |
| Trigger | bottom | Inline-end is the caret, then the toggle or the sidebar edge |

`TruncatedText` tooltips are never hoverable (`disableHoverablePopup`, `pointer-events-none`), so one sitting over other rows cannot catch the pointer.

## Testing

- `apps/storybook/tests/org-switcher.spec.ts`: the menu without `actions`, through the `compact` wrapper. Keyboard, wording, the trailing check and name alignment, spaced density as this switcher gets it, no shadow in either mode, switching and truncation.
- `apps/storybook/tests/project-switcher.spec.ts`: the `block` trigger and the submenu. Rest, hover and open fill, caret placement, keyboard-only ring, label alignment, accessible name, menu width, the project submenu, the leading check, and copy confirmation.
