import type { ReactNode } from 'react';
import { AppShellPanelHeader } from 'tabular-ui';

import { ClosePanel } from '../components/ClosePanel';
import { channels, lastClosedMonth, memberName, selectedTask } from '../lib/kasane';
import type { View } from '../lib/view';
import { ChannelPresence } from '../shell/ChannelPresence';
import { NoMessages, Profile } from './parts';
import { SepCloseChannel } from './SepClose';
import { TaskPanel, TasksView } from './Tasks';

/**
 * What one view puts in the shell's slots: the page header, the main body and,
 * for some views, the right panel. Only built views reach here (`lib/view.ts`).
 */
export type ViewSlots = {
  title: string;
  /** Trailing the title, in the page header band. */
  actions?: ReactNode;
  body: ReactNode;
  panel?: { label: string; content: ReactNode };
  /** `full` for a table page, where extra width is extra columns (AppShell, §7.9). */
  contentWidth?: 'full';
};

export function slotsFor(view: View): ViewSlots {
  if (view.kind === 'tasks') {
    const task = selectedTask(view.task);
    return {
      title: 'Tasks',
      body: <TasksView />,
      contentWidth: 'full',
      panel: {
        label: 'Task',
        content: (
          <>
            <AppShellPanelHeader title={task.title} />
            <TaskPanel task={task} />
          </>
        ),
      },
    };
  }
  // Only these reach here until their steps are built (`BUILT_PLACES`).
  if (view.kind !== 'channel' && view.kind !== 'dm') throw new Error(`No view for "${view.kind}" yet`);
  if (view.kind === 'dm') {
    return {
      title: memberName(view.member),
      body: <NoMessages memberKey={view.member} />,
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
  const channel = channels.find((c) => c.id === view.channel)!;
  const title = `# ${channel.name}`;
  return {
    title,
    actions: <ChannelPresence channel="revenue" />,
    body: <SepCloseChannel />,
    panel: {
      label: `${lastClosedMonth} close`,
      content: (
        <>
          <AppShellPanelHeader title={`${lastClosedMonth} close`} />
          <ClosePanel />
        </>
      ),
    },
  };
}
