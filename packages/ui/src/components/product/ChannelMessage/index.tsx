import { Children, cloneElement, isValidElement, useId, useState, type ReactElement, type ReactNode } from 'react';
import { CaretRightIcon } from '@phosphor-icons/react';

import { Button } from '../../foundational/Button';
import { cn } from '../../../lib/utils';
import { AgentBlock } from '../AgentBlock';

export type ChannelMessageAuthor = {
  /** The member's display name. */
  name: string;
  /**
   * An `Avatar`. The message sets its size (32px, 24px in a reply) and hides it
   * from assistive technology, since the name beside it says the same.
   */
  avatar: ReactElement<{ size?: 'sm' | 'default'; 'aria-hidden'?: boolean | 'true' }>;
  /**
   * A `Badge` after the name, for a member who isn't a person: "System" for a
   * deterministic check (`docs/agent-voice.md`, rule 1). An agent's message
   * needs none: its `AgentBlock` label already says "AI".
   */
  badge?: ReactNode;
};

type MessageBase = {
  author: ChannelMessageAuthor;
  /** As shown: "14:02". */
  time: string;
  /** Machine-readable time for `<time>`, e.g. `2026-10-16T14:02`. */
  dateTime?: string;
  /**
   * Set when the agent wrote this message: the body goes inside an
   * `AgentBlock` with this label ("AI", "AI · Catch-up"). Required for agent
   * content, because the block's rail and label are the trust signal (§5).
   */
  authorship?: string;
  /** Controls in the `AgentBlock`'s header. Only with `authorship`. */
  agentActions?: ReactNode;
  /**
   * The same author's next message in the same minute: no avatar and no
   * visible header, so a run of messages reads as one voice. The name and time
   * stay for assistive technology. The caller decides what counts as a run;
   * a later minute starts a new header, or its time would be shown nowhere.
   */
  continued?: boolean;
  children: ReactNode;
  className?: string;
};

export type ChannelMessageProps = MessageBase & {
  /**
   * `ChannelMessageReply` elements, shown inline beneath the message behind a
   * disclosure. One level only: a reply takes no replies.
   */
  replies?: ReactNode;
  repliesOpen?: boolean;
  defaultRepliesOpen?: boolean;
  onRepliesOpenChange?: (open: boolean) => void;
};

export type ChannelMessageReplyProps = MessageBase;

export type ChannelMessageListProps = React.ComponentProps<'ol'>;

/**
 * The channel: a real list, so a screen reader announces how many messages
 * there are. `role="list"` because Safari drops list semantics from a
 * `list-style: none` list (as `AppShellNavGroup`).
 */
function ChannelMessageList({ className, ...props }: ChannelMessageListProps) {
  return (
    <ol
      role="list"
      data-slot="channel-message-list"
      className={cn('flex flex-col gap-[var(--gap-group)]', className)}
      {...props}
    />
  );
}

function MessageRow({
  author,
  time,
  dateTime,
  authorship,
  agentActions,
  children,
  continued = false,
  reply,
  after,
}: MessageBase & { reply: boolean; after?: ReactNode }) {
  const avatar = isValidElement(author.avatar)
    ? cloneElement(author.avatar, { size: reply ? 'sm' : 'default', 'aria-hidden': true })
    : author.avatar;
  const timeClass = 'text-xs text-text-secondary tabular-nums';
  const body = (
    <div data-slot="channel-message-body" className="min-w-0 break-words text-base text-text-body">
      {authorship ? (
        <AgentBlock authorship={authorship} actions={agentActions}>
          {children}
        </AgentBlock>
      ) : (
        children
      )}
    </div>
  );

  if (continued) {
    return (
      <div data-continued="" className="relative flex items-start gap-[var(--gap-inline)]">
        {/*
          Who and when, for assistive technology, first: read alone, the
          message still says who wrote it and at what time. Visually both are
          the run's first message's, by definition of a run (same author, same
          minute), so showing them again would say nothing new. sr-only is
          absolute: it takes no flex gap.
        */}
        <span className="sr-only">
          {author.name} <time dateTime={dateTime}>{time}</time>
        </span>
        {/* The avatar's width, so the body starts where the run's first body does. */}
        <span aria-hidden="true" className={cn('shrink-0', reply ? 'w-6' : 'w-8')} />
        <div className="flex min-w-0 flex-1 flex-col gap-[var(--gap-bonded)]">
          {body}
          {after}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-[var(--gap-inline)]">
      {avatar}
      <div className="flex min-w-0 flex-1 flex-col gap-[var(--gap-bonded)]">
        {/*
          The header is as tall as the avatar (32px, a reply's 24px), so the
          name sits level with the avatar's centre and the body starts below
          it. Primitive steps, the avatar's own (no size tokens, Avatar
          README). min-h, not h: a long name wraps instead of overlapping.
        */}
        <div
          data-slot="channel-message-header"
          className={cn('flex flex-wrap items-center gap-x-[var(--gap-inline)]', reply ? 'min-h-6' : 'min-h-8')}
        >
          <span className={cn('font-semibold text-text-primary', reply ? 'text-sm' : 'text-base')}>{author.name}</span>
          {author.badge}
          {/* §0 rule 7: a time is a figure. Secondary, never tertiary: it is read (§3). */}
          <time dateTime={dateTime} className={timeClass}>
            {time}
          </time>
        </div>
        {body}
        {after}
      </div>
    </div>
  );
}

const repliesLabel = (n: number) => (n === 1 ? '1 reply' : `${n} replies`);

/**
 * ChannelMessage — product. One member's message in a channel of several
 * people, with its replies inline beneath it.
 *
 * `ChatThread` is a conversation between one user and one assistant; this is
 * the multi-person case: every message names its author, and the agent is a
 * member among people. An agent's message passes `authorship`, and its body
 * renders inside an `AgentBlock`, never as plain text beside a person's, so
 * the authorship signal can't be left out (`CLAUDE.md`).
 *
 * Replies fold behind `Button variant="inline"` with `aria-expanded`, as
 * `AgentReasoning` does, and render only when open. The count stays the
 * label, open or closed: the caret and `aria-expanded` carry the state.
 */
function ChannelMessage({
  replies,
  repliesOpen,
  defaultRepliesOpen = false,
  onRepliesOpenChange,
  className,
  ...message
}: ChannelMessageProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultRepliesOpen);
  const isOpen = repliesOpen ?? uncontrolled;
  const repliesId = useId();
  const count = Children.toArray(replies).length;

  const setOpen = (next: boolean) => {
    if (repliesOpen === undefined) setUncontrolled(next);
    onRepliesOpenChange?.(next);
  };

  return (
    <li
      data-slot="channel-message"
      className={cn(
        'min-w-0',
        // A run sits --gap-field apart, closer than the list's --gap-group
        // between authors, so the run reads as one block.
        message.continued && 'mt-[calc(var(--gap-field)-var(--gap-group))]',
        className,
      )}
    >
      <MessageRow
        {...message}
        reply={false}
        after={
          count > 0 ? (
            <div className="flex flex-col items-start gap-[var(--gap-field)] pt-[var(--gap-field)]">
              <Button
                variant="inline"
                aria-expanded={isOpen}
                aria-controls={isOpen ? repliesId : undefined}
                onClick={() => setOpen(!isOpen)}
                className={cn(
                  // AgentReasoning's disclosure, unchanged: a summary line one
                  // step below the body, medium weight so it reads as the
                  // control, and the inline hover fill padded off the glyphs.
                  'gap-[var(--gap-control-icon)] text-sm font-medium text-text-secondary hover:text-text-body',
                  'cursor-pointer after:block',
                  'px-1.5 py-0.5 -mx-1.5 -my-0.5',
                )}
              >
                <CaretRightIcon
                  aria-hidden="true"
                  className={cn('transition-transform motion-reduce:transition-none', isOpen && 'rotate-90')}
                />
                <span className="tabular-nums">{repliesLabel(count)}</span>
              </Button>
              {isOpen ? (
                <ol
                  id={repliesId}
                  role="list"
                  aria-label={`Replies to ${message.author.name}`}
                  data-slot="channel-message-replies"
                  // The thread's rule: 1px neutral, structure not state (§0
                  // rule 1). Replies sit --gap-group in from it.
                  className="flex w-full flex-col gap-[var(--gap-field)] border-l border-border pl-[var(--gap-group)]"
                >
                  {replies}
                </ol>
              ) : null}
            </div>
          ) : null
        }
      />
    </li>
  );
}

/** A reply, inside a `ChannelMessage`'s `replies`. Smaller avatar and name; takes no replies of its own. */
function ChannelMessageReply({ className, ...message }: ChannelMessageReplyProps) {
  return (
    <li data-slot="channel-message-reply" className={cn('min-w-0', className)}>
      <MessageRow {...message} reply />
    </li>
  );
}

export { ChannelMessage, ChannelMessageList, ChannelMessageReply };
