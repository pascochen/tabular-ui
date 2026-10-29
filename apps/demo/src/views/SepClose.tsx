import { ChannelMessage, ChannelMessageList } from 'tabular-ui';

import { ExceptionCard } from '../components/ExceptionCard';
import { useClose } from '../lib/close-context';
import { agent, close } from '../lib/kasane';
import { MemberAvatar } from '../shell/members';

const isHero = (e: (typeof close.exceptions)[number]) => 'hero' in e && e.hero === true;

/**
 * #sep-close: the agent's catch-up, then one message per exception, each with
 * its replies inline. Phase 4 is the landing state; the decision (phase 5)
 * and the timeline (phase 6) change it through the close state.
 */
export function SepCloseChannel() {
  const { state } = useClose();
  return (
    <ChannelMessageList aria-label="Messages in sep-close">
      <ChannelMessage
        author={{ name: agent.name, avatar: <MemberAvatar memberKey="agent" /> }}
        time={close.scene.landingTime}
        dateTime={`${close.scene.date}T${close.scene.landingTime}`}
        authorship={`${agent.authorship} · Catch-up`}
      >
        <ul role="list" className="flex list-disc flex-col gap-[var(--gap-bonded)] pl-4">
          {close.catchUp.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </ChannelMessage>
      {close.exceptions.map((e, i) => (
        <ExceptionCard
          key={e.id}
          exception={e}
          state={state.exceptions[e.id]}
          // A run: the agent posted every exception at once. Same author, same
          // minute, so one header (ChannelMessage's `continued`). Except after
          // the hero, whose thread opens with a person's reply: a headerless
          // message under it would read as that person's.
          continued={i > 0 && close.exceptions[i - 1].postedAt === e.postedAt && !isHero(close.exceptions[i - 1])}
          // The decision the visitor makes: open on arrival, so the reply is there.
          defaultRepliesOpen={isHero(e)}
        />
      ))}
    </ChannelMessageList>
  );
}
