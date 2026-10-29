import { useId, useState } from 'react';
import { CaretRightIcon } from '@phosphor-icons/react';
import {
  Button,
  ChannelMessage,
  ChannelMessageReply,
  InlineCitation,
  Sources,
  StatusBadge,
  cn,
  type Source,
} from 'tabular-ui';

import type { ExceptionState } from '../../lib/close-state';
import { agent, close, memberName, packFile } from '../../lib/kasane';
import { MemberAvatar } from '../../shell/members';

type Exception = (typeof close.exceptions)[number];

const agentAuthor = { name: agent.name, avatar: <MemberAvatar memberKey="agent" /> };
const authorOf = (key: string) => ({ name: memberName(key), avatar: <MemberAvatar memberKey={key} /> });

const kb = (bytes: number) => `${Math.max(1, Math.round(bytes / 1024)).toLocaleString('en-US')} KB`;

/** An exception's files as `Sources` rows, numbered in the order the finding cites them. */
function sourcesOf(e: Exception): Source[] {
  return e.sources.map((name) => {
    const f = packFile(name);
    return { id: name, name, size: f ? kb(f.bytes) : undefined };
  });
}

export type ExceptionCardProps = {
  exception: Exception;
  state: ExceptionState;
  defaultRepliesOpen?: boolean;
  /** The agent posted the message before this one in the same minute: group it under that header. */
  continued?: boolean;
};

/**
 * One close exception, as the agent posted it in #sep-close: what was said,
 * what the data shows, and the files that show it. A message by the agent, so
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
  continued = false,
}: ExceptionCardProps) {
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const sourcesId = useId();
  const sources = sourcesOf(e);
  const resolved = state.status === 'resolved';
  const split = e.summary.lastIndexOf(' ') + 1;
  const lead = e.summary.slice(0, split);
  const lastWord = e.summary.slice(split);

  return (
    <ChannelMessage
      author={agentAuthor}
      time={e.postedAt}
      dateTime={`${close.scene.date}T${e.postedAt}`}
      authorship={close.agent.authorship}
      defaultRepliesOpen={defaultRepliesOpen}
      continued={continued}
      replies={state.replies.map((r, i) => (
        <ChannelMessageReply key={i} author={authorOf(r.author)} time={r.at} dateTime={`${close.scene.date}T${r.at}`}>
          {r.text}
        </ChannelMessageReply>
      ))}
    >
      <div className="flex flex-col gap-[var(--gap-field)]">
        <div className="flex items-center gap-[var(--gap-inline)]">
          {/* The close panel's exception list links here, by id. */}
          <h2 id={e.id} className="scroll-mt-[var(--pad-page-y)] text-md font-semibold text-text-primary">
            {e.title}
          </h2>
          {resolved ? (
            <StatusBadge status="passed">Resolved</StatusBadge>
          ) : (
            <StatusBadge status="needs-review">Open</StatusBadge>
          )}
        </div>
        <p>
          {lead}
          {/* The marks stay on the line of the word they follow: wrapped alone, they cite nothing. */}
          <span className="whitespace-nowrap">
            {lastWord}
            {sources.map((s, i) => (
              <InlineCitation key={s.id} number={i + 1} source={s} />
            ))}
          </span>
        </p>
        <div className="flex flex-col items-start gap-[var(--gap-field)]">
          <Button
            variant="inline"
            aria-expanded={sourcesOpen}
            aria-controls={sourcesOpen ? sourcesId : undefined}
            onClick={() => setSourcesOpen(!sourcesOpen)}
            // ChannelMessage's replies disclosure, the same recipe, so the two
            // controls in one message read alike.
            className="-mx-1.5 -my-0.5 cursor-pointer gap-[var(--gap-control-icon)] px-1.5 py-0.5 text-sm font-medium text-text-secondary after:block hover:text-text-body"
          >
            <CaretRightIcon
              aria-hidden="true"
              className={cn('transition-transform motion-reduce:transition-none', sourcesOpen && 'rotate-90')}
            />
            <span className="tabular-nums">{sources.length === 1 ? '1 source' : `${sources.length} sources`}</span>
          </Button>
          {sourcesOpen ? (
            <div id={sourcesId} className="w-full">
              <Sources sources={sources} notChecked={e.notChecked} />
            </div>
          ) : null}
        </div>
      </div>
    </ChannelMessage>
  );
}
