import { Fragment, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { ChannelMessage, ChannelMessageList, ChatComposer } from 'tabular-ui';

import { ExceptionCard } from '../components/ExceptionCard';
import { useHeroReplies } from '../components/HeroThread/useHeroReplies';
import { sceneNow } from '../lib/clock';
import { useClose } from '../lib/close-context';
import { awaitsVisitor } from '../lib/close-state';
import { useDecisionInView, useExceptionLink } from '../lib/decision-in-view';
import { close, memberName } from '../lib/kasane';
import { MemberAvatar } from '../shell/members';

const titleOf = (id: string) => close.exceptions.find((e) => e.id === id)!.title;

const isHero = (e: (typeof close.exceptions)[number]) => 'hero' in e && e.hero === true;
const dateTime = (at: string) => `${close.scene.date}T${at}`;

/**
 * Said once, under the visitor's first post, by a system that isn't the agent or
 * a person (docs/agent-voice.md, rule 1). "To your message": the people do still
 * reply, in their threads.
 */
const SCRIPTED_NOTE = 'The people and the AI are scripted, so nobody will reply to your message.';

/**
 * #sep-close: one message per exception with its replies inline, the decision
 * first so it opens above the fold, then whatever the visitor writes, and the
 * composer. The decision and the
 * timeline change it all through the close state.
 */
export function SepCloseChannel() {
  const { state, dispatch } = useClose();
  const heroReplies = useHeroReplies();
  const composerBar = useRef<HTMLDivElement>(null);
  useDecisionInView(composerBar);
  useExceptionLink();
  const [heard, setHeard] = useState('');
  return (
    <div className="flex min-h-full flex-col gap-[var(--gap-group)]">
      <ChannelMessageList aria-label="Messages in sep-close">
        {close.exceptions.map((e, i) => (
          <ExceptionCard
            key={e.id}
            awaitsYou={awaitsVisitor(state, e.id)}
            exception={e}
            state={state.exceptions[e.id]}
            // A run: the agent posted every exception at once. Same author, same
            // minute, so one header (ChannelMessage's `continued`). Except after
            // the hero, whose thread opens with a person's reply: a headerless
            // message under it would read as that person's.
            continued={i > 0 && close.exceptions[i - 1].postedAt === e.postedAt && !isHero(close.exceptions[i - 1])}
            // The decision the visitor makes: open on arrival, so the reply is there.
            defaultRepliesOpen={isHero(e)}
            extraReplies={isHero(e) ? heroReplies : undefined}
          />
        ))}
        {state.posts.map((p, i) => (
          <Fragment key={i}>
            <ChannelMessage
              author={{ name: memberName('visitor'), avatar: <MemberAvatar memberKey="visitor" /> }}
              time={p.at}
              dateTime={dateTime(p.at)}
              // The second post follows the note: headerless, it would read as System's.
              continued={i > 1 && state.posts[i - 1].at === p.at}
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
          {state.typing ? `${memberName(state.typing.who)} is replying on ${titleOf(state.typing.exception)}…` : null}
        </p>
        <ChatComposer
          label="Message sep-close"
          placeholder="Message #sep-close"
          onSend={(text) => {
            flushSync(() => dispatch({ type: 'say', text, at: sceneNow() }));
            // A post lands at the channel's foot, off screen from anywhere above it.
            const scroller = composerBar.current?.closest('[data-slot="app-shell-main-body"]');
            scroller?.scrollTo({ top: scroller.scrollHeight });
            if (state.posts.length === 0) {
              setHeard(SCRIPTED_NOTE);
              setTimeout(() => setHeard(''), 7000);
            }
          }}
        />
      </div>
    </div>
  );
}
