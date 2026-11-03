import { useId, useState, type ReactElement } from 'react';
import { CaretRightIcon } from '@phosphor-icons/react';
import { Button, ChannelMessage, ChannelMessageReply, InlineCitation, Sources, cn } from 'tabular-ui';

import { notCheckedWith, type ExceptionState } from '../../lib/close-state';
import { useClose } from '../../lib/close-context';
import { close, memberName, type Exception } from '../../lib/kasane';
import { citationOf, sourcesOf } from '../../lib/sources';
import { CitedSentence } from '../CitedSentence';
import { ExceptionStatus } from '../ExceptionStatus';
import { MemberAvatar } from '../../shell/members';

const authorOf = (key: string) => ({ name: memberName(key), avatar: <MemberAvatar memberKey={key} /> });

export type ExceptionCardProps = {
  exception: Exception;
  state: ExceptionState;
  defaultRepliesOpen?: boolean;
  /** The decision is the visitor's to make: the badge says so. */
  awaitsYou?: boolean;
  /** Replies the close state doesn't hold as text: the hero's question, proposal and rerun. After the others. */
  extraReplies?: ReactElement[];
};

/**
 * One close exception, as the agent that raised it posted it: what was said,
 * what the data shows, and the files that show it. A message by an agent, so
 * its body is an `AgentBlock` (ChannelMessage does that). Its status is a
 * `StatusBadge`, so a resolved exception says so in words and icon, not only
 * colour. Replies follow inline.
 *
 * App-local, as the plan says (§3): it composes `ChannelMessage`,
 * `StatusBadge` and `Sources`, and promotes if a second screen needs it.
 */
export function ExceptionCard({
  exception: e,
  state,
  defaultRepliesOpen = false,
  awaitsYou = false,
  extraReplies = [],
}: ExceptionCardProps) {
  const { state: closeState } = useClose();
  const [sourcesOpen, setSourcesOpen] = useState(false);
  // The thread opens by itself when a teammate replies in it after landing,
  // so the reply is read, not just counted. Once the visitor opens or closes
  // it by hand, their choice holds.
  const [chosen, setChosen] = useState<boolean>();
  const atLanding = e.replies.filter((r) => 'at' in r && r.at).length;
  const repliesOpen = chosen ?? (defaultRepliesOpen || state.replies.length > atLanding);
  const sourcesId = useId();
  const sources = sourcesOf(e);

  return (
    <ChannelMessage
      author={authorOf(e.agent)}
      time={e.postedAt}
      dateTime={`${close.scene.date}T${e.postedAt}`}
      authorship={memberName(e.agent)}
      repliesOpen={repliesOpen}
      onRepliesOpenChange={setChosen}
      replies={[
        ...state.replies.map((r, i) => (
          <ChannelMessageReply key={i} author={authorOf(r.author)} time={r.at} dateTime={`${close.scene.date}T${r.at}`}>
            {r.text}
          </ChannelMessageReply>
        )),
        ...extraReplies,
      ]}
    >
      <div className="flex flex-col gap-[var(--gap-field)]">
        <div className="flex items-center gap-[var(--gap-inline)]">
          {/* The close panel's exception list links here, by id. */}
          <h2 id={e.id} className="scroll-mt-[var(--pad-page-y)] text-md font-semibold text-text-primary">
            {e.title}
          </h2>
          <ExceptionStatus status={state.status} awaitsYou={awaitsYou} />
        </div>
        <CitedSentence text={e.summary}>
          {sources.map((s, i) => (
            <InlineCitation key={s.id} number={i + 1} source={s} {...citationOf(e, i)} />
          ))}
        </CitedSentence>
        {state.status === 'waiting' && 'waiting' in e && e.waiting ? (
          <p className="text-sm text-text-secondary">
            Waiting on the {e.waiting.on.charAt(0).toLowerCase() + e.waiting.on.slice(1)}.
          </p>
        ) : null}
        <div className="flex flex-col items-start gap-[var(--gap-field)]">
          <Button
            variant="inline"
            aria-expanded={sourcesOpen}
            aria-controls={sourcesOpen ? sourcesId : undefined}
            onClick={() => setSourcesOpen(!sourcesOpen)}
            // ChannelMessage's replies disclosure, the same recipe, so the two
            // controls in one message read alike.
            className="-mx-1.5 -my-0.5 cursor-pointer select-none gap-[var(--gap-control-icon)] px-1.5 py-0.5 text-sm font-medium text-text-secondary after:block hover:text-text-body"
          >
            <CaretRightIcon
              aria-hidden="true"
              className={cn('transition-transform motion-reduce:transition-none', sourcesOpen && 'rotate-90')}
            />
            <span className="tabular-nums">{sources.length === 1 ? '1 source' : `${sources.length} sources`}</span>
          </Button>
          {sourcesOpen ? (
            <div id={sourcesId} className="w-full">
              <Sources sources={sources} notChecked={notCheckedWith(closeState, e.sources, e.notChecked)} />
            </div>
          ) : null}
        </div>
      </div>
    </ChannelMessage>
  );
}
