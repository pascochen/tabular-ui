import { GaugeIcon, MoneyIcon, StampIcon, TrendUpIcon, type Icon } from '@phosphor-icons/react';

/**
 * Each agent's glyph, by its key, so the four tell apart in a column of
 * avatars and in the sidebar. Neutral like the robot they replace: an agent is
 * no person, so it takes no identity ground (§1). An agent missing here keeps
 * the robot. Indexed, never looked up through a function, which React's
 * compiler reads as a component made during render.
 */
export const agentIcons: Record<string, Icon> = {
  'cutoff-ai': TrendUpIcon,
  'payments-ai': MoneyIcon,
  'approvals-ai': StampIcon,
  'credit-ai': GaugeIcon,
};
