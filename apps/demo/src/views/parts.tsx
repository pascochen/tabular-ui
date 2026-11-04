import { UserIcon } from '@phosphor-icons/react';
import { AppShellPanelBody, EmptyState, buttonVariants, cn } from 'tabular-ui';

import { people } from '../lib/kasane';
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
      icon={UserIcon}
      title={`No messages with ${people[memberKey].name} yet`}
      description="The close is happening in #revenue."
      action={
        <a
          className={cn(buttonVariants({ variant: 'outline' }))}
          href={hrefFor(DEFAULT_VIEW)}
          onClick={onViewLinkClick(DEFAULT_VIEW)}
        >
          Go to #revenue
        </a>
      }
    />
  );
}

/** A person's profile, in the right panel of their direct messages. */
export function Profile({ memberKey }: { memberKey: string }) {
  const person = people[memberKey];
  return (
    <AppShellPanelBody className="flex flex-col gap-[var(--gap-section)]">
      <div className="flex items-center gap-[var(--gap-control-icon)]">
        <MemberAvatar memberKey={memberKey} size="default" />
        <div className="flex min-w-0 flex-col">
          <span className="flex items-center gap-[var(--gap-inline)] text-sm font-semibold text-text-primary">
            {person.name}
          </span>
          <span className="text-sm text-text-secondary">{`${person.title}, ${person.entity}`}</span>
        </div>
      </div>
    </AppShellPanelBody>
  );
}
