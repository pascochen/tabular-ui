import { useState, type ReactElement, type ReactNode } from 'react';
import {
  CurrencyCircleDollarIcon,
  DotsThreeIcon,
  FilesIcon,
  HashIcon,
  ListChecksIcon,
  PlusIcon,
} from '@phosphor-icons/react';
import {
  AccountMenu,
  AppShellNav,
  AppShellNavGroup,
  AppShellNavItem,
  Badge,
  OrgSwitcher,
  StatusDot,
  type ThemePreference,
} from 'tabular-ui';

import { agents, channels, directMessages, memberName, visitor } from '../lib/kasane';
import { SITE_URL } from '../lib/links';
import { BUILT_CHANNELS, SIDEBAR_PLACES, hrefFor, onViewLinkClick, placeOf, useView, type View } from '../lib/view';
import { useClose } from '../lib/close-context';
import { channelMark, channelMarkText, isUnread, openCount } from '../lib/close-state';
import { AboutDemoDialog, DemoActions } from '../components/DemoActions';
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
  tasks: { label: 'Tasks', icon: <ListChecksIcon />, view: { kind: 'tasks' } },
  sources: { label: 'Sources', icon: <FilesIcon />, view: { kind: 'sources' } },
} satisfies Record<(typeof SIDEBAR_PLACES)[number], { label: string; icon: ReactElement; view: View }>;

/**
 * The sidebar: one home for everything. New chat and the places, the agents,
 * the channels and the direct messages, in that order, with the Accountant
 * Workspace story's icons and its More (since 2026-11-13). Every item opens a
 * built view (`lib/view.ts`), because a dead link is where a three-minute
 * visitor leaves, so a section with nothing built isn't drawn, and More opens
 * the Agents page rather than an add-an-agent flow that doesn't exist.
 *
 * The agents take the story's one icon here; in a thread each keeps the agent
 * glyph (`MemberAvatar`), which marks authorship beside a person's letter.
 */
export function Sidebar() {
  const { state } = useClose();
  const open = openCount(state);
  return (
    <AppShellNav aria-label="Workspace">
      {SIDEBAR_PLACES.length ? (
        <AppShellNavGroup>
          <NavLink view={{ kind: 'new-chat' }} icon={<PlusIcon />}>
            New chat
          </NavLink>
          {SIDEBAR_PLACES.map((place) => (
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
      <AppShellNavGroup label="Agents">
        {agents.map((a) => (
          <NavLink key={a.key} view={{ kind: 'dm', member: a.key }} icon={<CurrencyCircleDollarIcon />}>
            {a.name}
          </NavLink>
        ))}
        <NavLink view={{ kind: 'agents' }} icon={<DotsThreeIcon />}>
          More
        </NavLink>
      </AppShellNavGroup>
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
 * The group's companies by their short names, as a workspace list shows them,
 * then Create Workspace (owner, 2026-11-13). Written here, not exported: they
 * are labels, and nothing in the demo is filtered by company.
 */
const companies = [
  { id: 'KJP', name: 'Kasane Corporation' },
  { id: 'KUS', name: 'Kasane Americas' },
  { id: 'KDE', name: 'Kasane Europe' },
];

/**
 * The workspace switcher, as in the Accountant Workspace story. Every view
 * shows Kasane Corporation's group, so nothing switches: picking another
 * company or Create Workspace opens About this demo, which says what the demo
 * covers. A switch that only renamed the header would put the group's figures
 * under a subsidiary's name.
 */
export function SidebarHeader() {
  const [aboutOpen, setAboutOpen] = useState(false);
  return (
    <>
      <OrgSwitcher
        orgs={companies}
        currentOrgId="KJP"
        onSwitch={() => setAboutOpen(true)}
        onCreateOrg={() => setAboutOpen(true)}
      />
      <AboutDemoDialog open={aboutOpen} onOpenChange={setAboutOpen} />
    </>
  );
}

/**
 * The demo's controls, then the visitor's `AccountMenu` (since 2026-11-13).
 * The menu holds only what the demo has: the theme and the homepage, which is
 * tabularui.com. Profile, settings, billing and sign-out have no page here, so
 * they aren't drawn.
 */
export function SidebarFooter({
  theme,
  onThemeChange,
}: {
  theme: ThemePreference;
  onThemeChange: (theme: ThemePreference) => void;
}) {
  return (
    <div className="flex flex-col gap-[var(--gap-inline)]">
      <DemoActions />
      <AccountMenu
        user={visitor}
        theme={theme}
        onThemeChange={onThemeChange}
        onOpenHomepage={() => window.location.assign(SITE_URL)}
      />
    </div>
  );
}
