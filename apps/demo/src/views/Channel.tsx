import { Fragment, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { HashIcon } from '@phosphor-icons/react';
import { ChannelMessage, ChannelMessageList, ChatComposer, EmptyState } from 'tabular-ui';

import { ExceptionCard } from '../components/ExceptionCard';
import { useHeroReplies } from '../components/HeroThread/useHeroReplies';
import { sceneNow } from '../lib/clock';
import { useClose } from '../lib/close-context';
import { awaitsVisitor } from '../lib/close-state';
import { useDecisionInView, useExceptionLink } from '../lib/decision-in-view';
import { channels, close, exceptions, memberName, type ChannelId, type Exception } from '../lib/kasane';
import { SCRIPTED_NOTE } from '../lib/scripted-note';
import { MemberAvatar } from '../shell/members';

const titleOf = (id: string) => exceptions.find((e) => e.id === id)!.title;
const channelOf = (id: string) => exceptions.find((e) => e.id === id)!.channel;

const isHero = (e: Exception) => 'hero' in e && e.hero === true;
const dateTime = (at: string) => `${close.scene.date}T${at}`;

/**
 * A channel: one message per finding it holds, with its replies inline, then
 * whatever the visitor writes, and the composer. The decision and the timeline
 * change it all through the close state. A channel holding no finding shows its
 * topic.
 *
 * App keys this by channel, so `useExceptionLink` and `useDecisionInView` run
 * again on each way in.
 */
export function ChannelView({ channel }: { channel: ChannelId }) {
  const { state, dispatch } = useClose();
  const heroReplies = useHeroReplies();
  const composerBar = useRef<HTMLDivElement>(null);
  useDecisionInView(composerBar);
  useExceptionLink();
  const [heard, setHeard] = useState('');
  const c = channels.find((x) => x.id === channel)!;
  const held = exceptions.filter((e) => e.channel === channel);
  const posts = state.posts.filter((p) => p.where === channel);
  // Only this channel's: elsewhere, the sidebar's unread mark says it when the reply lands.
  const typing = state.typing && channelOf(state.typing.exception) === channel ? state.typing : null;
  return (
    <div className="flex min-h-full flex-col gap-[var(--gap-group)]">
      {held.length === 0 ? (
        <EmptyState icon={HashIcon} title={`Nothing open in #${c.name}`} description={c.topic} />
      ) : null}
      <ChannelMessageList aria-label={`Messages in ${c.name}`}>
        {held.map((e) => (
          <ExceptionCard
            key={e.id}
            awaitsYou={awaitsVisitor(state, e.id)}
            exception={e}
            state={state.exceptions[e.id]}
            // The decision the visitor makes: open on arrival, so the reply is there.
            defaultRepliesOpen={isHero(e)}
            extraReplies={isHero(e) ? heroReplies : undefined}
          />
        ))}
        {posts.map((p, i) => (
          <Fragment key={i}>
            <ChannelMessage
              author={{ name: memberName('visitor'), avatar: <MemberAvatar memberKey="visitor" /> }}
              time={p.at}
              dateTime={dateTime(p.at)}
              // The second post follows the note: headerless, it would read as System's.
              continued={i > 1 && posts[i - 1].at === p.at}
            >
              {p.text}
            </ChannelMessage>
            {i === 0 ? (
              <ChannelMessage
                author={{ name: 'System', avatar: <MemberAvatar memberKey="system" /> }}
                time={p.at}
                dateTime={dateTime(p.at)}
              >
                {SCRIPTED_NOTE}
              </ChannelMessage>
            ) : null}
          </Fragment>
        ))}
      </ChannelMessageList>
      {/* Focus stays in the composer, so the note is said as well. Then emptied, or reading the channel hears it twice. */}
      <p role="status" className="sr-only">
        {heard}
      </p>
      {/*
        The composer stays at the foot of the channel while it scrolls. The
        typing line sits on it; aria-hidden, because a screen reader hears the
        reply itself when it lands, and "typing" once per reply is noise.
        Sticky to the scroller's edge, not its padding: the main body has
        --pad-page-y at the bottom, and at bottom-0 the messages showed
        through that strip. The canvas ground covers it.
      */}
      <div
        ref={composerBar}
        className="sticky bottom-[calc(var(--pad-page-y)*-1)] -mb-[var(--pad-page-y)] mt-auto flex flex-col gap-[var(--gap-bonded)] bg-canvas pb-[var(--pad-page-y)]"
      >
        <p aria-hidden="true" className="min-h-[var(--text-xs--line-height)] text-xs text-text-secondary">
          {/* Names the card, since its thread may be off screen. */}
          {typing ? `${memberName(typing.who)} is replying on ${titleOf(typing.exception)}…` : null}
        </p>
        <ChatComposer
          label={`Message ${c.name}`}
          placeholder={`Message #${c.name}`}
          onSend={(text) => {
            flushSync(() => dispatch({ type: 'say', where: channel, text, at: sceneNow() }));
            // A post lands at the channel's foot, off screen from anywhere above it.
            const scroller = composerBar.current?.closest('[data-slot="app-shell-main-body"]');
            scroller?.scrollTo({ top: scroller.scrollHeight });
            if (posts.length === 0) {
              setHeard(SCRIPTED_NOTE);
              setTimeout(() => setHeard(''), 7000);
            }
          }}
        />
      </div>
    </div>
  );
}
