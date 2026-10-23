import { BuildingsIcon, GlobeIcon, ReceiptIcon, SignOutIcon, UserIcon } from '@phosphor-icons/react';
import { useState } from 'react';

import type { ThemePreference } from '../../../lib/theme';
import { cn } from '../../../lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../../foundational/Avatar';
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuLabel,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuTrigger,
} from '../../foundational/Menu';

export type AccountUser = {
  /** Full name — the menu header and the accessible name. */
  name: string;
  /** What the row shows — usually the first name. Defaults to `name`. */
  shortName?: string;
  email: string;
  /** Still avatar image. */
  avatarSrc?: string;
  /** Animated version of the avatar; plays on row hover and in the menu header. */
  avatarAnimatedSrc?: string;
  /** Shown until the image loads, or if there is none. */
  initials: string;
};

export type AccountMenuProps = {
  user: AccountUser;
  /**
   * The user's theme preference, which the Theme group checks: `dark`, `light`, or
   * `system` (follow the OS). Pass `useTheme()`'s `preference`.
   */
  theme: ThemePreference;
  /** The user picked a preference. Pass `useTheme()`'s `setPreference`, which applies it. */
  onThemeChange: (theme: ThemePreference) => void;
  onOpenProfile: () => void;
  /** The current workspace's settings. The caller knows which workspace is current. */
  onOpenWorkspaceSettings: () => void;
  /** The current workspace's subscription and billing. */
  onOpenBilling: () => void;
  onOpenHomepage: () => void;
  onSignOut: () => void;
  className?: string;
};

/**
 * AccountMenu — product. Composes `Avatar` and `Menu` (spaced density, a
 * `MenuRadioGroup` for the theme).
 *
 * The sidebar footer's account row: the avatar and the user's short name
 * open the account menu. Workspace settings are in the menu, not a button
 * beside the row, so there is one way in.
 *
 * **One trigger, one ring.** Avatar and name are a single `MenuTrigger`, so
 * the name is a target too, but the hover, open and focus ring draws only
 * around the avatar. It lives in the avatar's 2px transparent border and is
 * an **inset outline** (`outline-offset` of minus the ring width), never a
 * box-shadow, so the sidebar's overflow cannot clip it (§4). The 6px
 * `--gap-control-icon` to the name leaves the ring clear of the text.
 *
 * **Motion is a hover affordance, not a state.** The row avatar plays only
 * while a mouse is over the row, and stops while the menu is open. The menu
 * header's avatar always plays. `AvatarImage` suppresses both under
 * `prefers-reduced-motion: reduce`.
 */
function AccountMenu({
  user,
  theme,
  onThemeChange,
  onOpenProfile,
  onOpenWorkspaceSettings,
  onOpenBilling,
  onOpenHomepage,
  onSignOut,
  className,
}: AccountMenuProps) {
  const [hovered, setHovered] = useState(false);
  const [open, setOpen] = useState(false);

  return (
    <div
      data-slot="account-menu"
      className={cn('flex min-w-0 items-center', className)}
      // Mouse only: a touch "hover" is a tap, and the tap opens the menu.
      onPointerEnter={(e) => e.pointerType === 'mouse' && setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      <Menu open={open} onOpenChange={setOpen}>
        <MenuTrigger
          // Starts with the visible name, so label-in-name (WCAG 2.5.3) holds.
          aria-label={`${user.name}, account`}
          className={cn(
            'group/account flex h-[var(--h-control)] min-w-0 select-none items-center',
            'gap-[var(--gap-control-icon)] text-base font-medium outline-none',
            // AppShellNavItem's text steps: secondary at rest so the
            // account row does not outrank the nav above it, body on hover
            // and while the menu is open. Bracketed data-[popup-open] — the
            // shorthand compiles inside :where() and loses on source order.
            'text-text-secondary hover:text-text-body data-[popup-open]:text-text-body',
            // The avatar *image* starts on the sidebar's text line: nav items
            // put text at their 1px border plus --pad-sidebar-item, and the
            // image sits inside a 2px ring border, so the trigger insets by
            // the difference.
            'pl-[calc(var(--pad-sidebar-item)+1px-var(--border-width-2))]',
          )}
        >
          <span
            data-slot="account-avatar-ring"
            className={cn(
              'flex shrink-0 rounded-full border-[length:var(--border-width-2)] border-transparent',
              'outline-solid outline-[length:var(--ring-width)] outline-offset-[calc(var(--ring-width)*-1)] outline-transparent',
              'group-hover/account:outline-border-strong group-data-[popup-open]/account:outline-border-strong',
              // Last, so keyboard focus wins over hover and open.
              'group-focus-visible/account:outline-ring',
            )}
          >
            <Avatar size="sm">
              {/* alt="": the name is beside it and in the trigger's label. */}
              <AvatarImage
                src={user.avatarSrc}
                alt=""
                animatedSrc={user.avatarAnimatedSrc}
                animate={hovered && !open}
              />
              <AvatarFallback>{user.initials}</AvatarFallback>
            </Avatar>
          </span>
          <span className="min-w-0 truncate">{user.shortName ?? user.name}</span>
        </MenuTrigger>
        <MenuContent density="spaced" side="top" align="start" className="max-w-(--available-width)">
          <div
            data-slot="account-menu-header"
            className="flex items-center gap-[var(--gap-inline)] px-[var(--pad-cell-x)] py-[var(--pad-popover)]"
          >
            <Avatar>
              <AvatarImage src={user.avatarSrc} alt="" animatedSrc={user.avatarAnimatedSrc} animate />
              <AvatarFallback>{user.initials}</AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-base font-medium text-text-primary">{user.name}</span>
              <span className="truncate text-sm text-text-secondary">{user.email}</span>
            </div>
          </div>
          <MenuSeparator />
          <MenuItem onClick={onOpenProfile}>
            <UserIcon weight="bold" aria-hidden="true" />
            Your profile
          </MenuItem>
          <MenuSeparator />
          {/*
            A radio group, not a segmented control inside a row: two buttons
            in one menuitem would be nested controls the menu's arrow keys
            cannot reach. The indicator column is --size-icon-sm, the same as
            the icons above, so "Dark" starts where "Your profile" does. Radio
            items keep the menu open, so the change is seen.
          */}
          <MenuRadioGroup value={theme} onValueChange={(next) => onThemeChange(next as ThemePreference)}>
            <MenuLabel>Theme</MenuLabel>
            <MenuRadioItem value="dark">Dark</MenuRadioItem>
            <MenuRadioItem value="light">Light</MenuRadioItem>
            <MenuRadioItem value="system">System</MenuRadioItem>
          </MenuRadioGroup>
          <MenuSeparator />
          <MenuItem onClick={onOpenWorkspaceSettings}>
            <BuildingsIcon weight="bold" aria-hidden="true" />
            Workspace settings
          </MenuItem>
          <MenuItem onClick={onOpenBilling}>
            <ReceiptIcon weight="bold" aria-hidden="true" />
            Subscription and billing
          </MenuItem>
          <MenuItem onClick={onOpenHomepage}>
            <GlobeIcon weight="bold" aria-hidden="true" />
            Homepage
          </MenuItem>
          <MenuSeparator />
          <MenuItem onClick={onSignOut}>
            <SignOutIcon weight="bold" aria-hidden="true" />
            Sign out
          </MenuItem>
        </MenuContent>
      </Menu>
    </div>
  );
}

export { AccountMenu };
