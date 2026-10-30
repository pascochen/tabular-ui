import { ArrowClockwiseIcon } from '@phosphor-icons/react';
import { Button, ChannelMessage, ChannelMessageList, ChatComposer, cn } from 'tabular-ui';

import { EndStrip } from '../components/EndStrip';
import { ExceptionCard } from '../components/ExceptionCard';
import { useHeroReplies } from '../components/HeroThread/useHeroReplies';
import { sceneNow } from '../lib/clock';
import { useClose } from '../lib/close-context';
import { agent, close, memberName } from '../lib/kasane';
import { MemberAvatar } from '../shell/members';

// AttachmentRow's and InlineCitation's link: the interactive role, underlined
// on hover, the system's offset ring.
const linkClassName = cn(
  'text-text-interactive hover:underline',
  'rounded-xs outline-none focus-visible:outline-ring',
  'focus-visible:outline-solid focus-visible:outline-[length:var(--ring-width)]',
  'focus-visible:outline-offset-[var(--ring-offset)]',
);

const titleOf = (id: string) => close.exceptions.find((e) => e.id === id)!.title;

const isHero = (e: (typeof close.exceptions)[number]) => 'hero' in e && e.hero === true;
const dateTime = (at: string) => `${close.scene.date}T${at}`;

/**
 * The catch-up, as of its last refresh. The count is the state's, filled into
 * the authored line; the cut-off line shows only while that check is untied,
 * because once it ties out the line is no longer true.
 */
function CatchUp() {
  const { state, dispatch } = useClose();
  const { catchUp } = state;
  // Waiting on the visitor: the hero question has no answer yet.
  const asking = !state.hero.rounds[state.hero.rounds.length - 1].answer;
  const lines = close.catchUp.flatMap((line): { text: string; href?: string }[] => {
    if (typeof line === 'string') return [{ text: line.replace('{resolved}', String(catchUp.resolved)) }];
    if ('whileAsking' in line) return asking ? [{ text: line.text, href: `#${line.links}` }] : [];
    return catchUp.tiedOut.includes(line.whileUntied) ? [] : [{ text: line.text }];
  });
  return (
    <ChannelMessage
      author={{ name: agent.name, avatar: <MemberAvatar memberKey="agent" /> }}
      time={catchUp.at}
      dateTime={dateTime(catchUp.at)}
      authorship={`${agent.authorship} · Catch-up`}
      agentActions={
        <Button size="sm" variant="ghost" onClick={() => dispatch({ type: 'refresh', at: sceneNow() })}>
          <ArrowClockwiseIcon aria-hidden="true" />
          Refresh
        </Button>
      }
    >
      <ul role="list" className="flex list-disc flex-col gap-[var(--gap-bonded)] pl-4">
        {lines.map((line) => (
          <li key={line.text}>
            {line.href ? (
              // The decision is below the fold at landing; this is the way to it.
              <a href={line.href} className={linkClassName}>
                {line.text}
              </a>
            ) : (
              line.text
            )}
          </li>
        ))}
      </ul>
    </ChannelMessage>
  );
}

/**
 * #sep-close: the agent's catch-up, one message per exception with its replies
 * inline, whatever the visitor writes, and the composer. The decision and the
 * timeline change it all through the close state.
 */
export function SepCloseChannel() {
  const { state, dispatch } = useClose();
  const heroReplies = useHeroReplies();
  return (
    <div className="flex min-h-full flex-col gap-[var(--gap-group)]">
      <ChannelMessageList aria-label="Messages in sep-close">
        <CatchUp />
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
            extraReplies={isHero(e) ? heroReplies : undefined}
          />
        ))}
        {state.posts.map((p, i) => (
          <ChannelMessage
            key={i}
            author={{ name: memberName('visitor'), avatar: <MemberAvatar memberKey="visitor" /> }}
            time={p.at}
            dateTime={dateTime(p.at)}
            continued={i > 0 && state.posts[i - 1].at === p.at}
          >
            {p.text}
          </ChannelMessage>
        ))}
      </ChannelMessageList>
      {state.ended ? <EndStrip /> : null}
      {/*
        The composer stays at the foot of the channel while it scrolls. The
        typing line sits on it; aria-hidden, because a screen reader hears the
        reply itself when it lands, and "typing" once per reply is noise.
        Sticky to the scroller's edge, not its padding: the main body has
        --pad-page-y at the bottom, and at bottom-0 the messages showed
        through that strip. The canvas ground covers it.
      */}
      <div className="sticky bottom-[calc(var(--pad-page-y)*-1)] -mb-[var(--pad-page-y)] mt-auto flex flex-col gap-[var(--gap-bonded)] bg-canvas pb-[var(--pad-page-y)]">
        <p aria-hidden="true" className="min-h-[var(--text-xs--line-height)] text-xs text-text-secondary">
          {/* Names the card, since its thread may be off screen. */}
          {state.typing ? `${memberName(state.typing.who)} is replying on ${titleOf(state.typing.exception)}…` : null}
        </p>
        <ChatComposer
          label="Message sep-close"
          placeholder="Message #sep-close"
          onSend={(text) => dispatch({ type: 'say', text, at: sceneNow() })}
        />
      </div>
    </div>
  );
}
