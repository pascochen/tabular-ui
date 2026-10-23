import { cn } from '../../../lib/utils';
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from '../../foundational/MessageScroller';
import { Spinner } from '../../foundational/Spinner';
import { AgentBlock } from '../AgentBlock';
import { AttachmentRow } from '../AttachmentRow';
import { AgentPlan, type AgentPlanProps } from '../AgentPlan';
import { AgentReasoning, type AgentReasoningProps } from '../AgentReasoning';
import { WorkingLabel } from '../workingLabel';

export type ChatUserTurn = {
  /** Stable across renders: the scroller anchors and restores by it. */
  id: string;
  role: 'user';
  /**
   * A node, so model and column names can be set in `--font-mono` (§8.3).
   * May be empty when the files are the whole message.
   */
  text?: React.ReactNode;
  /** Files sent with the question, listed above it, so the thread records what the agent was given. */
  attachments?: { id: string; name: string; size?: string }[];
};

/**
 * An assistant turn with no `reasoning`, `text` or `plan` yet renders a
 * "Working…" row. Add the turn as soon as the question is sent.
 */
export type ChatAssistantTurn = {
  id: string;
  role: 'assistant';
  /** The AgentBlock label. Defaults to "AI". */
  authorship?: string;
  /** Beside the label: a time, a model. */
  meta?: string;
  /**
   * When the agent started on this turn, epoch ms. Drives the elapsed figure
   * on "Working…" (§11.5); without it, the figure counts from when the turn
   * appeared.
   */
  startedAt?: number;
  reasoning?: Pick<AgentReasoningProps, 'text' | 'status' | 'durationSeconds' | 'startedAt'>;
  /** Prose, after the reasoning and before the plan. A node, as `text` on a user turn. */
  text?: React.ReactNode;
  plan?: Omit<AgentPlanProps, 'className'>;
};

export type ChatTurn = ChatUserTurn | ChatAssistantTurn;

export type ChatThreadProps = {
  /** Oldest first. */
  turns: ChatTurn[];
  /**
   * True while a turn is still streaming. Sets `aria-busy` on the log, so a
   * screen reader announces the finished turn rather than every step.
   */
  busy?: boolean;
  /** The scroll region's accessible name. */
  label?: string;
  /**
   * Shown in place of the thread while `turns` is empty: a `ChatStarter`.
   * Sits at the bottom, against the composer.
   */
  empty?: React.ReactNode;
  className?: string;
};

/**
 * ChatThread — product. A conversation for the chat panel: user turns and
 * assistant turns in a `MessageScroller`.
 *
 * Plain props. It knows nothing about where turns come from: no AI SDK, no
 * runtime, no transport. The caller passes the turns as they stand and
 * re-renders as they change.
 *
 * **Put it in the panel instead of `AppShellPanelBody`**, between the header
 * and the footer. The panel body is a scroll container, and a scroller inside
 * a scroller gives two scrollbars and breaks anchoring. ChatThread carries the
 * body's insets itself, inside its viewport, so the scrollbar sits at the
 * panel's edge.
 *
 * Each assistant turn is one `AgentBlock`, holding its `AgentReasoning`, text
 * and `AgentPlan`. One block per turn: the parts draw no rail of their own.
 * User turns anchor: a new question scrolls to near the top of the panel and
 * the answer grows below it (`MessageScroller`).
 */
function ChatThread({ turns, busy = false, label = 'Messages', empty, className }: ChatThreadProps) {
  // Outside the scroller: its content is the transcript, role="log", and
  // suggestions are not a message. Same insets as the thread, and it scrolls
  // on its own if the panel is too short to hold it. mt-auto, not
  // justify-end: an overflowing justify-end column pushes its top out of
  // reach of the scrollbar. scroll-padding matches the inset, so a suggestion
  // scrolled into view by Tab stops where it would rest, not flush with the
  // edge, where the overflow clipped its focus ring (§4).
  if (turns.length === 0 && empty) {
    return (
      <div
        data-slot="chat-thread"
        className={cn(
          'flex min-h-0 flex-1 flex-col overflow-y-auto px-[var(--pad-page-x)] py-[var(--pad-page-y)]',
          'scroll-py-[var(--pad-page-y)]',
          className,
        )}
      >
        <div className="mt-auto">{empty}</div>
      </div>
    );
  }

  return (
    <MessageScrollerProvider autoScroll defaultScrollPosition="last-anchor">
      <MessageScroller data-slot="chat-thread" className={cn('flex-1', className)}>
        <MessageScrollerViewport aria-label={label}>
          {/* AppShellPanelBody's insets: --pad-page-x sides, --pad-page-y top and bottom. */}
          <MessageScrollerContent
            aria-busy={busy || undefined}
            className="px-[var(--pad-page-x)] py-[var(--pad-page-y)]"
          >
            {turns.map((turn) => (
              <MessageScrollerItem key={turn.id} messageId={turn.id} scrollAnchor={turn.role === 'user'}>
                {turn.role === 'user' ? <UserTurn turn={turn} /> : <AssistantTurn turn={turn} />}
              </MessageScrollerItem>
            ))}
          </MessageScrollerContent>
        </MessageScrollerViewport>
        <MessageScrollerButton />
      </MessageScroller>
    </MessageScrollerProvider>
  );
}

/**
 * The user's words: neutral, right-aligned, the canvas step. No hue (§0
 * rule 1). Alignment says "you" to the eye; the hidden prefix says it to a
 * screen reader, which hears the assistant's turn named by its label.
 */
function UserTurn({ turn }: { turn: ChatUserTurn }) {
  return (
    <div className="ml-auto flex w-fit max-w-[85%] flex-col gap-[var(--gap-field)] rounded-md bg-canvas p-[var(--pad-card)] text-base text-text-body">
      {/* First, so a screen reader names the speaker before the files.
          sr-only is absolutely positioned, so it takes no flex gap. */}
      <span className="sr-only">You:</span>
      {turn.attachments?.length ? (
        // As in ChatComposer: -mx lands each glyph on the text's left edge.
        <ul role="list" aria-label="Attached files" className="-mx-[var(--pad-cell-x)] flex flex-col">
          {turn.attachments.map((file) => (
            <li key={file.id}>
              <AttachmentRow name={file.name} size={file.size} />
            </li>
          ))}
        </ul>
      ) : null}
      {turn.text ? <div className="whitespace-pre-wrap">{turn.text}</div> : null}
    </div>
  );
}

function AssistantTurn({ turn }: { turn: ChatAssistantTurn }) {
  const pending = !turn.reasoning && !turn.text && !turn.plan;
  return (
    <AgentBlock authorship={turn.authorship ?? 'AI'} meta={turn.meta}>
      <div className="flex flex-col gap-[var(--gap-group)]">
        {/*
          Nothing has arrived yet. §5 "agent working": an activity indicator,
          in the block the answer will fill, so the answer grows in place
          rather than a block appearing later and shifting the thread. Same
          size, colour and spinner as AgentReasoning's "Thinking…" row, which
          usually replaces it. After 3s the label gains its elapsed figure.
        */}
        {pending ? (
          <div className="flex items-center gap-[var(--gap-control-icon)] text-sm text-text-secondary">
            <Spinner />
            <WorkingLabel label="Working" startedAt={turn.startedAt} />
          </div>
        ) : null}
        {turn.reasoning ? <AgentReasoning {...turn.reasoning} /> : null}
        {/* A div, not a <p>: the node may hold block content. */}
        {turn.text ? <div className="whitespace-pre-wrap">{turn.text}</div> : null}
        {turn.plan ? <AgentPlan {...turn.plan} /> : null}
      </div>
    </AgentBlock>
  );
}

export { ChatThread };
