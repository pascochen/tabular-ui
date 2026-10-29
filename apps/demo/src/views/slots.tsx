import type { ReactNode } from 'react';
import { ChatsIcon, HashIcon, HouseIcon, ListChecksIcon, TreeStructureIcon, UserIcon } from '@phosphor-icons/react';
import { AppShellPanelHeader } from 'tabular-ui';

import { channels, lastClosedMonth, memberName } from '../lib/kasane';
import type { View } from '../lib/view';
import { PanelPlaceholder, Placeholder, Profile } from './parts';

/**
 * What one view puts in the shell's slots: the page header, the main body and,
 * for some views, the right panel. The bodies are placeholders until the
 * phase that builds each view (kasane-close-demo-plan.md §6); the header, the
 * panel's place and the profile are real.
 */
export type ViewSlots = {
  title: string;
  body: ReactNode;
  panel?: { label: string; content: ReactNode };
};

const channelName = (id: string) => channels.find((c) => c.id === id)!;

export function slotsFor(view: View): ViewSlots {
  if (view.kind === 'home') {
    return {
      title: 'Home',
      body: <Placeholder icon={HouseIcon} title="Home" description="The close at a glance. Built in phase 9." />,
    };
  }
  if (view.kind === 'dm') {
    return {
      title: memberName(view.member),
      body: (
        <Placeholder
          icon={view.member === 'agent' ? ChatsIcon : UserIcon}
          title={`Messages with ${memberName(view.member)}`}
          description="A short scripted history. Built in phase 7."
        />
      ),
      panel: {
        label: 'Profile',
        content: (
          <>
            <AppShellPanelHeader title="Profile" />
            <Profile memberKey={view.member} />
          </>
        ),
      },
    };
  }
  const channel = channelName(view.channel);
  const title = `# ${channel.name}`;
  if (view.channel === 'sep-close') {
    return {
      title,
      body: <Placeholder icon={HashIcon} title={channel.topic} description="The channel. Built in phase 4." />,
      panel: {
        label: `${lastClosedMonth} close`,
        content: (
          <>
            <AppShellPanelHeader title={`${lastClosedMonth} close`} />
            <PanelPlaceholder title="The close panel" description="Progress, tiles and the decision log. Phase 4." />
          </>
        ),
      },
    };
  }
  if (view.channel === 'open-items') {
    return {
      title,
      body: <Placeholder icon={ListChecksIcon} title={channel.topic} description="The open items. Built in phase 8." />,
      panel: {
        label: 'Item',
        content: (
          <>
            <AppShellPanelHeader title="Item" />
            <PanelPlaceholder title="No item selected" description="Select an item to see where it came from." />
          </>
        ),
      },
    };
  }
  return {
    title,
    body: <Placeholder icon={TreeStructureIcon} title={channel.topic} description="Built in phase 10." />,
  };
}
