# AccountMenu

Product. Composes `Avatar` and `Menu` (`spaced` density, a `MenuRadioGroup` for the theme).

The sidebar footer's account row. It goes in `AppShell`'s `sidebarFooter` slot.

```tsx
<AccountMenu
  user={{ name: 'Mei Tachibana', shortName: 'Mei', email, avatarSrc, avatarAnimatedSrc, initials: 'MT' }}
  theme={preference}            // from useTheme()
  onThemeChange={setPreference}
  onOpenProfile={…}
  onOpenWorkspaceSettings={…}
  onOpenBilling={…}
  onOpenHomepage={…}
  onSignOut={…}
/>
```

## Props

| Prop | Type | Notes |
|---|---|---|
| `user.name` | `string` | Menu header, and the trigger's accessible name ("Mei Tachibana, account") |
| `user.shortName` | `string` | What the row shows. Defaults to `name` |
| `user.email` | `string` | Menu header |
| `user.avatarSrc` | `string` | The still image |
| `user.avatarAnimatedSrc` | `string` | The animated version. See `Avatar` |
| `user.initials` | `string` | Fallback |
| `theme` | `'dark' \| 'light' \| 'system'` | The user's preference, which the Theme group checks. Pass `useTheme()`'s `preference` (not its resolved `theme`, or System could never show as chosen) |
| `onThemeChange` | `(theme) => void` | The user picked a preference. Pass `useTheme()`'s `setPreference`: the hook applies it and owns `data-theme` on the root |
| `onOpenProfile`, `onOpenHomepage`, `onSignOut` | `() => void` | Router-agnostic; the caller navigates |
| `onOpenWorkspaceSettings`, `onOpenBilling` | `() => void` | The **current** workspace's settings and billing. The caller knows which workspace is current; the menu does not |

## Row

A 32px row (`--h-control`, the trigger's height) inside the footer's `py-2`, so the band is 49px with its rule. The trigger is the row's only control. There is no Settings button beside it: workspace settings are a menu row, so there is one way in.

| Part | Geometry |
|---|---|
| Ring | 28px circle: a 2px transparent border around the 24px avatar |
| Avatar image | Starts at x=25, the sidebar's text line (16px gutter + 1px + `--pad-sidebar-item`). The trigger insets by `--pad-sidebar-item + 1px − --border-width-2` to put it there |
| Name | 6px (`--gap-control-icon`) after the ring, so the ring never touches text. `--color-text-secondary` at rest, `--color-text-body` on hover and while open — `AppShellNavItem`'s steps, so the account row does not outrank the nav above it |

**One trigger, one ring.** The avatar and the name together are the `MenuTrigger`, so clicking "Mei" opens the menu too. The ring draws only around the avatar:

| State | Ring |
|---|---|
| Rest | Transparent |
| Hover on the trigger, or menu open | `--color-border-strong` |
| Keyboard focus | `--color-ring`, which wins over hover and open |

The ring is an **outline with a negative offset** (`-2px`, the ring width), so it paints inside the 2px border and never outside the 28px box. That is §4's inset form. It is not a box-shadow, and the sidebar's overflow cannot clip it.

The trigger is the `Menu` primitive's own button, styled here, not a `Button`. No `Button` variant puts its ring on a child or has no fill on hover, and bending one to do both would override most of its contract.

## Motion

| Where | Plays |
|---|---|
| Row avatar | Only while a **mouse** is over the row, anywhere on it, past the name too. Not at rest, not on keyboard focus, not while the menu is open |
| Menu header avatar | Always, while the menu is open |
| Either | Never under `prefers-reduced-motion: reduce` (enforced in `AvatarImage`) |

Each hover starts the loop from the first frame. See `Avatar`.

## Menu

`MenuContent density="spaced"`, as in the switchers: 36px rows 4px apart, no shadow (§4). See `Menu`'s README.

Header (32px avatar, full name, email) → Your profile → **Theme**: Dark · Light · System → Workspace settings · Subscription and billing · Homepage → Sign out.

**Theme** is a `MenuRadioGroup` with its own `MenuLabel`, so it is announced as a group named "Theme" of three `menuitemradio` rows. **System** (added 2026-10-11) follows the OS setting, live; Dark and Light keep their places, and System goes last. The design sketch drew a sun/moon segmented control inside one row. That would be two buttons nested in a menu item, out of reach of the menu's arrow keys, and no foundational toggle group exists. The radio indicator sits in the same `--size-icon-sm` column as the other rows' icons, so "Dark" starts where "Your profile" does. Radio items keep the menu open, so the change is seen.

**Workspace settings** moved here from `OrgSwitcher`'s submenu (2026-10-08), with the row's old Settings button removed. **Sign out** is neutral, as in the sketch; it is not destructive.

**Homepage** is a callback, not a link, consistent with the other items. If it needs link semantics (open in new tab, copy link address), the right fix is wrapping Base UI's `Menu.LinkItem` as a `MenuLinkItem`, which is a foundational change.

## Testing

`apps/storybook/tests/account-menu.spec.ts` (Playwright) covers:
- the row geometry, and the trigger as the row's only control;
- the trigger covering the name;
- when each avatar animates, including under reduced motion;
- the ring states and its inset offset;
- the Theme group: its label, flipping `data-theme`, keeping the menu open, System following the OS (including a live change), and its rows' text on the other rows' x;
- the menu order and the 36px rows.

`apps/storybook/tests/app-shell.spec.ts` asserts that the account avatar shares the sidebar's text line.
