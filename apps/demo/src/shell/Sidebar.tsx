import type { ReactElement, ReactNode } from 'react';
import { HashIcon } from '@phosphor-icons/react';
import { AppShellNav, AppShellNavGroup, AppShellNavItem, Badge, TruncatedText } from 'tabular-ui';

import { channels, directMessages, kasaneCompany, memberName, visitor } from '../lib/kasane';
import { BUILT_CHANNELS, hrefFor, onViewLinkClick, sameView, useView, type View } from '../lib/view';
import { useClose } from '../lib/close-context';
import { progress } from '../lib/close-state';
import { MemberAvatar } from './members';

function NavLink({
  view,
  icon,
  avatar,
  trailing,
  children,
}: {
  view: View;
  icon?: ReactElement;
  avatar?: ReactElement;
  trailing?: ReactNode;
  children: ReactNode;
}) {
  const current = useView();
  return (
    <AppShellNavItem
      href={hrefFor(view)}
      onClick={onViewLinkClick(view)}
      active={sameView(current, view)}
      icon={icon}
      avatar={avatar}
      trailing={trailing}
    >
      {children}
    </AppShellNavItem>
  );
}

/**
 * The sidebar: the channels and the direct messages. Every item
 * opens a view (`lib/view.ts`), because a dead link is where a three-minute
 * visitor leaves.
 */
export function Sidebar() {
  const { resolved, total } = progress(useClose().state);
  const open = total - resolved;
  return (
    <AppShellNav aria-label="Workspace">
      <AppShellNavGroup label="Channels">
        {BUILT_CHANNELS.map((id) => channels.find((c) => c.id === id)!).map((c) => (
          <NavLink
            key={c.id}
            view={{ kind: 'channel', channel: c.id }}
            icon={<HashIcon />}
            trailing={
              c.id === 'sep-close' ? (
                <Badge shape="count" aria-hidden="true">
                  {open}
                </Badge>
              ) : undefined
            }
          >
            {c.name}
            {c.id === 'sep-close' ? <span className="sr-only">, {open} open</span> : null}
          </NavLink>
        ))}
      </AppShellNavGroup>
      <AppShellNavGroup label="Direct messages">
        {directMessages.map((key) => (
          <NavLink key={key} view={{ kind: 'dm', member: key }} avatar={<MemberAvatar memberKey={key} />}>
            {memberName(key)}
          </NavLink>
        ))}
      </AppShellNavGroup>
    </AppShellNav>
  );
}

/**
 * Lines up with the nav icons: the same padding as a nav item, plus its 1px
 * transparent border (failure log, `ContextSwitcherLabel`).
 */
const itemInset = 'border-x border-transparent px-[var(--pad-sidebar-item)]';

/** The workspace. Static: Kasane is the only company, so a switcher would offer nothing. */
export function SidebarHeader() {
  return (
    <TruncatedText className={`${itemInset} text-sm font-semibold text-text-primary`}>
      {kasaneCompany.legalName}
    </TruncatedText>
  );
}

/** Who the visitor is playing. Not a control: the demo has no account to manage. */
export function SidebarFooter() {
  return (
    <div className={`${itemInset} flex h-[var(--h-control)] min-w-0 items-center gap-[var(--gap-control-icon)]`}>
      <MemberAvatar memberKey="visitor" />
      <TruncatedText className="text-sm text-text-body">{`${visitor.name} · ${visitor.title}`}</TruncatedText>
    </div>
  );
}
