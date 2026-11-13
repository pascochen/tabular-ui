import { GaugeIcon, GearSixIcon, MoneyIcon, RobotIcon, StampIcon, TrendUpIcon, type Icon } from '@phosphor-icons/react';
import { Avatar, AvatarFallback } from 'tabular-ui';

import { member } from '../lib/kasane';

/**
 * Each agent's glyph, by its key, so the four tell apart in a column of
 * avatars. Neutral like the robot they replace: an agent is no person, so it
 * takes no identity ground (§1). An agent missing here keeps the robot.
 */
const agentIcons: Record<string, Icon> = {
  'cutoff-ai': TrendUpIcon,
  'payments-ai': MoneyIcon,
  'approvals-ai': StampIcon,
  'credit-ai': GaugeIcon,
};

/**
 * A member's avatar. The script has no photos, so a person's is one letter on
 * their identity ground and an agent's its own glyph on neutral, never a
 * person's avatar. `system`, a deterministic check, takes a gear. Always beside the name, so hidden from assistive
 * technology, or a link reads "D Daisuke Onodera".
 */
export function MemberAvatar({ memberKey, size = 'sm' }: { memberKey: string; size?: 'sm' | 'default' }) {
  const m = member(memberKey);
  const AgentIcon = agentIcons[memberKey] ?? RobotIcon;
  return (
    <Avatar size={size} aria-hidden="true">
      <AvatarFallback identity={m?.kind === 'person' ? m.person.identity : undefined}>
        {m?.kind === 'person' ? (
          m.person.initials
        ) : memberKey === 'system' ? (
          <GearSixIcon weight="bold" />
        ) : (
          <AgentIcon weight="bold" />
        )}
      </AvatarFallback>
    </Avatar>
  );
}
