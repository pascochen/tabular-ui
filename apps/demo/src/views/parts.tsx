import { AppShellPanelBody } from 'tabular-ui';

import { people } from '../lib/kasane';
import { MemberAvatar } from '../shell/members';

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
