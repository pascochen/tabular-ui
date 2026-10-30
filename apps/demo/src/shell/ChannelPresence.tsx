import { PresenceStack } from 'tabular-ui';

import { channels, member, type ChannelId } from '../lib/kasane';
import { MemberAvatar } from './members';

/**
 * Who is in a channel, in its page header: the people other than the visitor.
 * The agent is a member too, but it is always there, and its messages carry
 * their own mark. Neutral, as PresenceStack is: being here is not a state.
 */
export function ChannelPresence({ channel }: { channel: ChannelId }) {
  const c = channels.find((x) => x.id === channel)!;
  const members = c.members.flatMap((key) => {
    const m = member(key);
    if (key === 'visitor' || m?.kind !== 'person') return [];
    return [{ id: m.person.id, name: m.person.name, avatar: <MemberAvatar memberKey={key} /> }];
  });
  return <PresenceStack members={members} label={`In ${c.name}`} />;
}
