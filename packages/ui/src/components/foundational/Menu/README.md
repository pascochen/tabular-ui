# Menu

Foundational. Adopted from shadcn/ui (Base UI, `base-mira`) and retokenized.

Named **`Menu`**, per `CLAUDE.md`'s inventory. shadcn files it under `dropdown-menu`, but the primitive underneath is Base UI's `menu` and the same component serves row actions, toolbar overflow and sort menus.

```tsx
<Menu>
  <MenuTrigger render={<Button variant="outline">Actions</Button>} />
  <MenuContent>
    <MenuItem>Re-run<MenuShortcut>⌘R</MenuShortcut></MenuItem>
    <MenuSeparator />
    <MenuItem variant="danger">Delete model</MenuItem>
  </MenuContent>
</Menu>
```

## Menu or Select?

**Menu** for actions — things that happen.
**Select** for picking a value that then stays visible.

## Surface

Content and items come from the shared popup primitives in `../popupSurface.ts`, so Menu, Select, Tooltip and Popover cannot drift apart:

- **`popupSurface`** — `--color-surface-raised` + 1px `--color-border-strong`, `--radius-md`, no shadow (§4).
- **`popupItem`** — 28px (`--h-row-sm`) rows, `--radius-xs`, highlighted takes `--color-bg-hover`.
- **`popupLabel`** — `--text-2xs` uppercase with `--tracking-wide` (§8.1, §8.8).
- **`popupSpaced`** — the `spaced` density, layered on the three above. Below.

## Density

`density` goes on `MenuContent` once. Every part inside reads it through context, submenus included, so items need no props.

```tsx
<MenuContent density="spaced">…</MenuContent>
```

**`default`** is the table rhythm: 28px rows, flush. Row menus, toolbar overflow, sort menus, anything opened over data. Keep it unless the menu is part of the shell.

**`spaced`** is for a menu picked from the shell rather than scanned over a table: `ContextSwitcher` (so `OrgSwitcher` and `ProjectSwitcher`) and `AccountMenu`. Measured from Ferndesk's workspace switcher (2026-10-08). Select and Combobox do not take it.

| Part | `spaced` |
|---|---|
| Row | `--h-control-lg` (36px), `--gap-inline` (8px) icon gap, `--radius-md` (0px since 2026-10-16), `--pad-cell-x` (8px) |
| Between rows | 4px (`gap-1`, a primitive fallback: no row-gap token exists) |
| Label | `--text-2xs` and `--tracking-wide` (the micro-label tier, kept), weight 500, `--color-text-secondary`, 8px over and 6px under: a 28px row |
| Separator | `--color-border-strong` at 50%, softer than the popup's border. Not `--color-border`, which is the raised surface's own colour in dark mode |
| Hover | `--color-bg-hover`, faded over 75ms; none under reduced motion |
| Elevation | None in either mode, as every popup: step plus border (§4). The light-mode `shadow-md` was removed 2026-10-19 |

Not matched, on purpose: Ferndesk's 12px / 0.08em label (would need a new tracking token, and would break the set the sidebar's section labels form) and its −0.14px row tracking (`--tracking-tight` is scoped to `--text-lg` and up, §8).

**Why a context, set on the content.** The parts that read it (items, labels, separators, groups, the submenu) all render inside `MenuContent`, so its provider reaches them. A provider on the trigger would reach none of them: in a compound component the parts are siblings (failure log).

`apps/storybook/tests/menu-density.spec.ts` checks every part against the `Spaced` story, the submenu included, and that `default` stays at 28px.

## Danger items

`variant="danger"` colours the **text**, not the ground, and tints the ground only on highlight. A red row sitting in every open menu would compete with genuine failure state in the data (§0 rule 1).

`destructive` is the deprecated spelling (renamed 2026-10-10, see `Button`'s README), still honoured with a one-time development warning. `data-variant` always reports `danger`.

## Checkbox and radio items

Both ship. `CLAUDE.md`'s "there is no `Radio`" is about **standalone radio groups**, where a `Select` is denser — it does not forbid the menu affordance, which is the normal way to express a single-choice setting like sort order.

### Switch indicator

`MenuCheckboxItem indicator="switch"` draws a trailing switch instead of a leading check. Use it for a setting that takes effect the moment it flips, such as dark mode. Keep the check for choosing among items. This is the same split `Switch` and `Checkbox` draw outside menus.

```tsx
<MenuCheckboxItem indicator="switch" checked={dark} onCheckedChange={setDark}>
  <MoonIcon weight="bold" aria-hidden="true" />
  Dark mode
</MenuCheckboxItem>
```

- **The switch is the item's indicator, not a `Switch`.** The item is what's checkable (`role="menuitemcheckbox"`, `aria-checked`). A real `Switch` inside it would be a second, nested control.
- **It reuses `switchVariants`,** so it can't drift from `Switch`. It's kept mounted, so the off track shows.
- **The menu stays open** (`closeOnClick={false}`), because the point of a switch is seeing it flip.

## Shortcuts

`MenuShortcut` renders mono one step below the item's sans (§8.3), in `--color-text-secondary`. It is a hint, not a control, but it is text the user reads, so it clears AA (tertiary measured under 4.5:1 on the raised popup; §3, decided 2026-10-08).
