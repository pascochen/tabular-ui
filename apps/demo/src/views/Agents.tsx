import { RobotIcon } from '@phosphor-icons/react';
import { AgentCard, AgentCardFinding } from 'tabular-ui';

import { ExceptionStatus } from '../components/ExceptionStatus';
import { useClose } from '../lib/close-context';
import { awaitsVisitor } from '../lib/close-state';
import { agents, exceptions, type Exception } from '../lib/kasane';
import { hrefFor, onViewLinkClick, type View } from '../lib/view';
import { agentIcons } from '../shell/agent-icons';

/**
 * Every agent, from the sidebar's All agents, each a card: its glyph, the rule
 * it checks, how many files it reads, and the finding it raised with its
 * status as it stands now. The name links to the agent's own view and the
 * finding to its message. The Accountant Workspace story ends the Agents group
 * with More, for adding an agent. The demo has no such flow, and a sidebar item
 * that opens nothing is where a visitor leaves (`lib/view.ts`), so All agents
 * opens this page and says so.
 *
 * Cards, not a ruled list (2026-11-18): people think of agents as separate
 * things and pick one out by its mark. The marks are neutral, so what tells
 * the four apart at a glance is each finding's status.
 */
export function AgentsView() {
  return (
    <div className="flex flex-col gap-[var(--gap-section)]">
      <p className="text-sm text-text-secondary">
        Each agent checks one rule and reads only its own files. Adding an agent isn’t part of this demo.
      </p>
      <ul role="list" className="grid grid-cols-1 gap-[var(--gap-group)] md:grid-cols-2">
        {agents.map((a) => {
          const view: View = { kind: 'dm', member: a.key };
          const finding = exceptions.find((e) => e.id === a.finding);
          return (
            <li key={a.key} className="flex">
              <AgentCard
                className="min-w-0 flex-1"
                icon={agentIcons[a.key] ?? RobotIcon}
                name={a.name}
                render={<a href={hrefFor(view)} onClick={onViewLinkClick(view)} />}
                rule={a.checks}
                meta={`Reads ${a.reads.length} ${a.reads.length === 1 ? 'file' : 'files'}`}
              >
                {finding ? <Finding exception={finding} /> : null}
              </AgentCard>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** The finding an agent raised: a link to its message in its channel, with its status as the close stands. */
function Finding({ exception: e }: { exception: Exception }) {
  const { state } = useClose();
  const channel: View = { kind: 'channel', channel: e.channel };
  const hash = `#${e.id}`;
  return (
    <AgentCardFinding
      title={e.title}
      render={<a href={`${hrefFor(channel)}${hash}`} onClick={onViewLinkClick(channel, hash)} />}
      status={<ExceptionStatus status={state.exceptions[e.id].status} awaitsYou={awaitsVisitor(state, e.id)} />}
    />
  );
}
