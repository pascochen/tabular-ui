import type { ReactNode } from 'react';
import { AppShellPanelHeader } from 'tabular-ui';

import { ClosePanel } from '../components/ClosePanel';
import { channels, documents, lastClosedMonth, member, memberName, selectedTask } from '../lib/kasane';
import type { View } from '../lib/view';
import { ChannelPresence } from '../shell/ChannelPresence';
import { Profile } from './parts';
import { DirectMessageView } from './DirectMessage';
import { AgentProfile, AgentView } from './AgentView';
import { AgentsView } from './Agents';
import { ChannelDetails, ChannelFacts } from './ChannelDetails';
import { ChannelView } from './Channel';
import { NewChatView } from './NewChat';
import { SearchView } from './Search';
import { SourcesView } from './Sources';
import { NoTaskPanel, TaskPanel, TasksView } from './Tasks';

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
  if (view.kind === 'new-chat') {
    return { title: 'New chat', body: <NewChatView /> };
  }
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
            <AppShellPanelHeader title={task ? task.title : 'Task'} />
            {task ? <TaskPanel task={task} /> : <NoTaskPanel />}
          </>
        ),
      },
    };
  }
  if (view.kind === 'sources') {
    return {
      title: 'Sources',
      actions: <span className="text-sm text-text-secondary tabular-nums">{documents.length} files</span>,
      body: <SourcesView source={view.source} item={view.item} />,
      contentWidth: 'full',
    };
  }
  if (view.kind === 'search') {
    return { title: 'Search', body: <SearchView q={view.q} /> };
  }
  if (view.kind === 'agents') {
    return { title: 'Agents', body: <AgentsView /> };
  }
  if (view.kind === 'dm') {
    const m = member(view.member);
    if (m?.kind === 'agent') {
      return {
        title: m.agent.name,
        // Keyed so a half-typed message stays with the agent it was for.
        body: <AgentView key={m.agent.key} agent={m.agent} />,
        panel: {
          label: 'Profile',
          content: (
            <>
              <AppShellPanelHeader title="Profile" />
              <AgentProfile agent={m.agent} />
            </>
          ),
        },
      };
    }
    return {
      title: memberName(view.member),
      // Keyed so a half-typed message stays with the person it was for.
      body: <DirectMessageView key={view.member} memberKey={view.member} />,
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
    actions: <ChannelPresence channel={view.channel} />,
    // Keyed so a link's landing runs again on each way into a channel.
    body: <ChannelView key={view.channel} channel={view.channel} />,
    // #close keeps the record. Every other channel shows its details.
    panel:
      view.channel === 'close'
        ? {
            label: `${lastClosedMonth} close`,
            content: (
              <>
                <AppShellPanelHeader title={`${lastClosedMonth} close`} />
                <ClosePanel>
                  <ChannelFacts channel="close" />
                </ClosePanel>
              </>
            ),
          }
        : {
            label: 'Channel details',
            content: (
              <>
                <AppShellPanelHeader title="Channel details" />
                <ChannelDetails channel={view.channel} />
              </>
            ),
          },
  };
}
