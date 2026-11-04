import type { ReactElement, ReactNode } from 'react';
import { BooksIcon, HashIcon, MagnifyingGlassIcon, TrayIcon } from '@phosphor-icons/react';
import { AppShellNav, AppShellNavGroup, AppShellNavItem, Badge, StatusDot, TruncatedText } from 'tabular-ui';

import { agents, channels, close, directMessages, kasaneCompany, memberName, visitor } from '../lib/kasane';
import { BUILT_CHANNELS, BUILT_PLACES, hrefFor, onViewLinkClick, placeOf, useView, type View } from '../lib/view';
import { useClose } from '../lib/close-context';
import { channelMark, channelMarkText, isUnread, openCount } from '../lib/close-state';
import { MemberAvatar } from './members';

function NavLink({
  view,
  icon,
  avatar,
  trailing,
  unread,
  children,
}: {
  view: View;
  unread?: boolean;
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
      active={placeOf(current) === placeOf(view)}
      icon={icon}
      avatar={avatar}
      trailing={trailing}
      unread={unread}
    >
      {children}
    </AppShellNavItem>
  );
}

const PLACES = {
  search: { label: 'Search', icon: <MagnifyingGlassIcon />, view: { kind: 'search' } },
  tasks: { label: 'Tasks', icon: <TrayIcon />, view: { kind: 'tasks' } },
  sources: { label: 'Sources', icon: <BooksIcon />, view: { kind: 'sources' } },
} satisfies Record<(typeof BUILT_PLACES)[number], { label: string; icon: ReactElement; view: View }>;

/**
 * The sidebar: one home for everything. The places, the channels, the agents
 * and the direct messages, in that order. Every item opens a built view
 * (`lib/view.ts`), because a dead link is where a three-minute visitor leaves,
 * so a section with nothing built isn't drawn.
 */
export function Sidebar() {
  const { state } = useClose();
  const open = openCount(state);
  return (
    <AppShellNav aria-label="Workspace">
      {BUILT_PLACES.length ? (
        <AppShellNavGroup>
          {BUILT_PLACES.map((place) => (
            <NavLink
              key={place}
              view={PLACES[place].view}
              icon={PLACES[place].icon}
              trailing={
                place === 'tasks' ? (
                  <Badge shape="count" aria-hidden="true">
                    {open}
                  </Badge>
                ) : undefined
              }
            >
              {PLACES[place].label}
              {place === 'tasks' ? <span className="sr-only">, {open} open</span> : null}
            </NavLink>
          ))}
        </AppShellNavGroup>
      ) : null}
      <AppShellNavGroup label="Channels">
        {BUILT_CHANNELS.map((id) => channels.find((c) => c.id === id)!).map((c) => {
          const mark = channelMark(state, c.id);
          return (
            <NavLink
              key={c.id}
              view={{ kind: 'channel', channel: c.id }}
              icon={<HashIcon />}
              unread={isUnread(state, c.id)}
              trailing={mark ? <StatusDot status={mark} /> : undefined}
            >
              {c.name}
              {mark ? <span className="sr-only">{channelMarkText[mark]}</span> : null}
            </NavLink>
          );
        })}
      </AppShellNavGroup>
      <AppShellNavGroup label="Agents">
        {agents.map((a) => (
          <NavLink key={a.key} view={{ kind: 'dm', member: a.key }} avatar={<MemberAvatar memberKey={a.key} />}>
            {a.name}
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

/**
 * The company and the period, on two lines. Static: Kasane is the only company,
 * and nothing in the demo is filtered by period, so a switcher would change
 * nothing visible (pages spec, D7).
 */
export function SidebarHeader() {
  return (
    <div className={`${itemInset} flex min-h-[var(--h-control)] min-w-0 flex-col justify-center`}>
      <TruncatedText className="text-sm font-semibold text-text-primary">{kasaneCompany.legalName}</TruncatedText>
      <TruncatedText className="text-xs text-text-secondary">{close.period.open}</TruncatedText>
    </div>
  );
}

/** Who the visitor is playing, on two lines. Not a control: the demo has no account to manage. */
export function SidebarFooter() {
  return (
    <div className={`${itemInset} flex h-[var(--h-control)] min-w-0 items-center gap-[var(--gap-control-icon)]`}>
      <MemberAvatar memberKey="visitor" />
      <div className="flex min-w-0 flex-col">
        <TruncatedText className="text-sm text-text-body">{visitor.name}</TruncatedText>
        <TruncatedText className="text-xs text-text-secondary">{visitor.title}</TruncatedText>
      </div>
    </div>
  );
}
