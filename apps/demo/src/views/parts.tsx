import { ChatsIcon, UserIcon } from '@phosphor-icons/react';
import { AppShellPanelBody, EmptyState, buttonVariants } from 'tabular-ui';

import { Section } from '../components/ClosePanel';
import { agent, member, memberName, people } from '../lib/kasane';
import { DEFAULT_VIEW, hrefFor, onViewLinkClick } from '../lib/view';
import { MemberAvatar } from '../shell/members';

/**
 * A direct message before anyone has written in it: what the view is, and the
 * way back to where the close is happening. A real empty state, not a
 * placeholder, so the view is never a dead end.
 */
export function NoMessages({ memberKey }: { memberKey: string }) {
  return (
    <EmptyState
      size="page"
      icon={memberKey === 'agent' ? ChatsIcon : UserIcon}
      title={`No messages with ${memberName(memberKey)} yet`}
      description="The close is happening in #sep-close."
      action={
        <a
          className={buttonVariants({ variant: 'outline' })}
          href={hrefFor(DEFAULT_VIEW)}
          onClick={onViewLinkClick(DEFAULT_VIEW)}
        >
          Go to #sep-close
        </a>
      }
    />
  );
}

/** One of the agent's lists in its profile. Plain rows: nothing here is a state, so nothing takes a hue (§0 rule 1). */
function AgentList({ title, items, mono = false }: { title: string; items: string[]; mono?: boolean }) {
  return (
    <Section title={title}>
      <ul role="list" className="flex flex-col gap-[var(--gap-field)] text-sm text-text-body">
        {items.map((item) => (
          // Mono runs one step below adjacent sans (§8.3).
          <li key={item} className={mono ? 'font-mono text-xs' : undefined}>
            {item}
          </li>
        ))}
      </ul>
    </Section>
  );
}

/** A member's profile, in the right panel of their direct messages. The agent's says what it can and can't do. */
export function Profile({ memberKey }: { memberKey: string }) {
  const m = member(memberKey)!;
  return (
    <AppShellPanelBody className="flex flex-col gap-[var(--gap-section)]">
      <div className="flex items-center gap-[var(--gap-control-icon)]">
        <MemberAvatar memberKey={memberKey} size="default" />
        <div className="flex min-w-0 flex-col">
          <span className="flex items-center gap-[var(--gap-inline)] text-sm font-semibold text-text-primary">
            {memberName(memberKey)}
          </span>
          <span className="text-sm text-text-secondary">
            {m.kind === 'agent' ? `Set up by ${people[agent.setUpBy].name}` : `${m.person.title} · ${m.person.entity}`}
          </span>
        </div>
      </div>
      {m.kind === 'agent' ? (
        <>
          <AgentList title="What it does" items={agent.does} />
          <AgentList title="What it never does" items={agent.never} />
          <AgentList title="What it reads" items={agent.reads} mono />
        </>
      ) : null}
    </AppShellPanelBody>
  );
}
