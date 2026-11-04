import { AppShellPanelBody, PresenceStack } from 'tabular-ui';

import { ExceptionLink } from '../components/ExceptionLink';
import { Section } from '../components/ClosePanel';
import { channels, exceptions, member, memberName, visitor, type ChannelId } from '../lib/kasane';
import { MemberAvatar } from '../shell/members';

/** Who a member is, beside their name. The visitor is "you" (pages spec, D2). */
function roleOf(key: string) {
  const m = member(key)!;
  if (m.kind === 'agent') return 'Agent';
  return key === 'visitor' ? `${visitor.title} (you)` : m.person.title;
}

/** A channel's topic, owner and members. Neutral throughout: none of this is a state (§0 rule 1). */
export function ChannelFacts({ channel }: { channel: ChannelId }) {
  const c = channels.find((x) => x.id === channel)!;
  return (
    <>
      <Section title="Topic">
        <p className="text-sm text-text-body">{c.topic}</p>
      </Section>
      <Section title="Owner">
        <p className="text-sm text-text-body">
          {memberName(c.owner)}
          <span className="text-text-secondary">, {roleOf(c.owner)}</span>
        </p>
      </Section>
      <Section title="Members">
        <PresenceStack
          max={c.members.length}
          label={`In ${c.name}`}
          members={c.members.map((key) => ({
            id: key,
            name: memberName(key),
            avatar: <MemberAvatar memberKey={key} />,
          }))}
        />
        <ul role="list" className="flex flex-col gap-[var(--gap-bonded)] text-sm text-text-body">
          {c.members.map((key) => (
            <li key={key}>
              {memberName(key)}
              <span className="text-text-secondary">, {roleOf(key)}</span>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}

/**
 * The right panel of a channel other than #close: its details and the tasks it
 * holds. #close's panel is the record (`ClosePanel`).
 */
export function ChannelDetails({ channel }: { channel: ChannelId }) {
  const held = exceptions.filter((e) => e.channel === channel);
  return (
    <AppShellPanelBody className="flex flex-col gap-[var(--gap-section)]">
      <ChannelFacts channel={channel} />
      <Section title="Tasks in this channel">
        {held.length ? (
          <ul role="list" className="-mx-[var(--pad-control-x)] flex flex-col">
            {held.map((e) => (
              <li key={e.id}>
                <ExceptionLink exception={e} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-text-secondary">None</p>
        )}
      </Section>
    </AppShellPanelBody>
  );
}
