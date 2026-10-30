import { AppShellPanelBody, Badge, EmptyState } from 'tabular-ui';

import { agent, member, memberName, people } from '../lib/kasane';
import { MemberAvatar } from '../shell/members';

export function Placeholder({ icon, title, description }: Parameters<typeof EmptyState>[0]) {
  return <EmptyState size="page" icon={icon} title={title} description={description} />;
}

export function PanelPlaceholder({ title, description }: { title: string; description: string }) {
  return (
    <AppShellPanelBody>
      <EmptyState size="sm" title={title} description={description} />
    </AppShellPanelBody>
  );
}

/** A member's profile, in the right panel of their direct messages. Phase 7 adds the rest. */
export function Profile({ memberKey }: { memberKey: string }) {
  const m = member(memberKey)!;
  return (
    <AppShellPanelBody className="flex flex-col gap-[var(--gap-field)]">
      <div className="flex items-center gap-[var(--gap-control-icon)]">
        <MemberAvatar memberKey={memberKey} size="default" />
        <div className="flex min-w-0 flex-col">
          <span className="flex items-center gap-[var(--gap-inline)] text-sm font-semibold text-text-primary">
            {memberName(memberKey)}
            {m.kind === 'agent' ? <Badge tone="agent">{agent.authorship}</Badge> : null}
          </span>
          <span className="text-sm text-text-secondary">
            {m.kind === 'agent' ? `Set up by ${people[agent.setUpBy].name}` : `${m.person.title} · ${m.person.entity}`}
          </span>
        </div>
      </div>
    </AppShellPanelBody>
  );
}
