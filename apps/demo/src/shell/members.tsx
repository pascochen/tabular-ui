import { GearSixIcon, RobotIcon } from '@phosphor-icons/react';
import { Avatar, AvatarFallback } from 'tabular-ui';

import { member } from '../lib/kasane';

/**
 * A member's avatar. The script has no photos, so a person's is one letter on
 * their identity ground and an agent's the agent glyph on neutral, never a
 * person's avatar. `system`, a deterministic check, takes a gear. Always beside the name, so hidden from assistive
 * technology, or a link reads "D Daisuke Onodera".
 */
export function MemberAvatar({ memberKey, size = 'sm' }: { memberKey: string; size?: 'sm' | 'default' }) {
  const m = member(memberKey);
  return (
    <Avatar size={size} aria-hidden="true">
      <AvatarFallback identity={m?.kind === 'person' ? m.person.identity : undefined}>
        {m?.kind === 'person' ? (
          m.person.initials
        ) : memberKey === 'system' ? (
          <GearSixIcon weight="bold" />
        ) : (
          <RobotIcon weight="bold" />
        )}
      </AvatarFallback>
    </Avatar>
  );
}
