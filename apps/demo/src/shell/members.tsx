import { RobotIcon } from '@phosphor-icons/react';
import { Avatar, AvatarFallback } from 'tabular-ui';

import { member } from '../lib/kasane';

/**
 * A member's avatar. The script has no photos, so a person's is initials and
 * the agent's a glyph: its "AI" badge sits beside it, and initials would say
 * it twice. Always beside the name, so hidden from assistive technology, or a
 * link reads "DO Daisuke Onodera".
 */
export function MemberAvatar({ memberKey, size = 'sm' }: { memberKey: string; size?: 'sm' | 'default' }) {
  const m = member(memberKey);
  return (
    <Avatar size={size} aria-hidden="true">
      <AvatarFallback>{m?.kind === 'person' ? m.person.initials : <RobotIcon weight="bold" />}</AvatarFallback>
    </Avatar>
  );
}
