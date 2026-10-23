import { CaretRightIcon } from '@phosphor-icons/react';
import { useEffect, useId, useRef, useState } from 'react';

import { cn } from '../../../lib/utils';
import { Button } from '../../foundational/Button';
import { Spinner } from '../../foundational/Spinner';
import { WorkingLabel } from '../workingLabel';

export type AgentReasoningStatus = 'streaming' | 'done';

export type AgentReasoningProps = {
  /**
   * The agent's reasoning. Line breaks in strings are kept. A node, so model
   * and column names can be set in `--font-mono` (§8.3).
   */
  text: React.ReactNode;
  /** `streaming` while the agent is still thinking; `done` once it has finished. */
  status: AgentReasoningStatus;
  /**
   * How long the thinking took, in whole seconds. Shown once `status` is
   * `done` ("Thought for 4s"). Supplied by the caller rather than timed here:
   * a reopened thread knows the real figure, and a component that times
   * itself renders a different label on every load.
   */
  durationSeconds?: number;
  /**
   * When the thinking began, epoch ms. While streaming, "Thinking…" gains an
   * elapsed figure after 3s (§11.5), counted from here; without it, from when
   * the component mounted.
   */
  startedAt?: number;
  /** Controlled open state. Omit to let the component hold it. */
  open?: boolean;
  /** Collapsed by default, streaming or not. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
};

function summary(status: AgentReasoningStatus, durationSeconds: number | undefined) {
  if (status === 'streaming') return 'Thinking…';
  if (durationSeconds === undefined) return 'Reasoning';
  return `Thought for ${Math.max(1, Math.round(durationSeconds))}s`;
}

/**
 * What the live region says. The summary, except where the summary is not a
 * status: "Thinking…" loses its ellipsis, which a screen reader may voice, and
 * "Reasoning" (done, no duration) names the section rather than saying it
 * finished.
 */
function announcement(status: AgentReasoningStatus, durationSeconds: number | undefined) {
  if (status === 'streaming') return 'Thinking';
  if (durationSeconds === undefined) return 'Finished thinking';
  return summary(status, durationSeconds);
}

/**
 * How long an announcement stays in the live region before it is cleared, as
 * react-aria's announcer does. Long enough for a screen reader to queue it.
 */
const ANNOUNCEMENT_MS = 7000;

/**
 * The live region's text: the announcement when the state changes, then
 * nothing. Left in place, it repeated the button's own label to anyone
 * reading the transcript ("Thought for 2s, Thought for 2s"). A turn that
 * mounts already done, as a reopened thread's do, announces nothing: there
 * was no change to report. One that mounts streaming says "Thinking".
 */
function useAnnouncement(message: string, initiallyDone: boolean) {
  const [live, setLive] = useState('');
  // The message a done turn mounted with, which is not news. Compared, not a
  // one-shot flag: development mode runs effects twice, and a flag would let
  // the second run announce it.
  const mountedWith = useRef(initiallyDone ? message : null);
  useEffect(() => {
    if (message === mountedWith.current) return;
    mountedWith.current = null;
    // Set in a frame, not synchronously: the region must exist empty before
    // its text arrives, or a screen reader may not treat it as a change.
    const show = requestAnimationFrame(() => setLive(message));
    const clear = setTimeout(() => setLive(''), ANNOUNCEMENT_MS);
    return () => {
      cancelAnimationFrame(show);
      clearTimeout(clear);
    };
  }, [message]);
  return live;
}

/**
 * AgentReasoning — product. The agent's "thinking", collapsed behind a
 * one-line summary.
 *
 * **A part of an `AgentBlock`, not a block of its own.** It draws no rail,
 * or authorship label: the `AgentBlock` around it carries both §5 signals,
 * and nesting a second block would double the rail and the label.
 * Used anywhere else, wrap it in an `AgentBlock`.
 *
 * **It never opens or closes by itself.** It starts collapsed and changes only
 * when the reader toggles it. Opening on stream start and closing on finish
 * (AI Elements' Reasoning) grows and then shrinks the block under a reader
 * who may be reading below it: the plan they were reading jumps.
 *
 * The disclosure is `Button variant="inline"` with `aria-expanded`, the
 * content rendered only when open, as `RunLogRow` does. No collapsible
 * primitive exists, and this one needs nothing beyond a toggle.
 */
function AgentReasoning({
  text,
  status,
  durationSeconds,
  startedAt,
  open,
  defaultOpen = false,
  onOpenChange,
  className,
}: AgentReasoningProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultOpen);
  const isOpen = open ?? uncontrolled;
  const contentId = useId();
  const streaming = status === 'streaming';
  const live = useAnnouncement(announcement(status, durationSeconds), !streaming);

  const setOpen = (next: boolean) => {
    if (open === undefined) setUncontrolled(next);
    onOpenChange?.(next);
  };

  return (
    <div data-slot="agent-reasoning" data-status={status} className={cn('flex flex-col items-start', className)}>
      <Button
        variant="inline"
        aria-expanded={isOpen}
        aria-controls={contentId}
        onClick={() => setOpen(!isOpen)}
        className={cn(
          // Metadata, so secondary (§3: read, never tertiary). --text-sm, one
          // step below the block's --text-base body, as a summary line should
          // be. Medium weight, one step above the body text it opens, so it
          // reads as the control; the colour stays free to step up on hover.
          'gap-[var(--gap-control-icon)] text-sm font-medium text-text-secondary hover:text-text-body',
          // `inline` hides the hover fill, because a row around it usually
          // owns hover. Nothing here does, so it comes back, padded so it does
          // not sit tight on the glyphs. The equal negative margin keeps the
          // caret and label exactly where they were. Primitive steps, not a
          // role token: none exists for this case, and §7.4's fallback rule
          // keeps the gap visible rather than borrowing a chip's padding.
          'cursor-pointer after:block',
          'px-1.5 py-0.5 -mx-1.5 -my-0.5',
        )}
      >
        {/* Same 1em, bold caret as RunLogRow's disclosure. Button sets bold. */}
        <CaretRightIcon
          aria-hidden="true"
          className={cn('transition-transform motion-reduce:transition-none', isOpen && 'rotate-90')}
        />
        {/*
          §0 rule 7: the duration is a figure. While streaming, the label
          ticks after 3s (§11.5); the button's name stays "Thinking".
        */}
        {streaming ? (
          <WorkingLabel label="Thinking" startedAt={startedAt} />
        ) : (
          <span className="tabular-nums">{summary(status, durationSeconds)}</span>
        )}
        {/*
          §5 "agent working": the Spinner. Same colour as its label (§11.1);
          the AgentBlock around it already says "agent". Under reduced motion
          it stands still and the figure keeps counting.
        */}
        {streaming ? <Spinner /> : null}
      </Button>

      {/*
        Announces the state change, streaming to done, then empties (see
        useAnnouncement). Beside the button, not in it: inside, it would join
        the button's accessible name. The reasoning text itself is never
        announced; it streams in token by token, and a reader opens it when
        they want it.
      */}
      <span role="status" className="sr-only">
        {live}
      </span>

      {isOpen ? (
        <div
          id={contentId}
          className={cn(
            // A hanging indent: the text starts under the label, not under the
            // caret. The caret is 1em at this same --text-sm, so 1em plus the
            // button's icon gap lands on the label's left edge exactly.
            // No rule on the left: the AgentBlock's rail is already a vertical
            // line beside it, and a second one read as a double line.
            'mt-[var(--gap-field)] pl-[calc(1em+var(--gap-control-icon))]',
            'text-sm whitespace-pre-wrap text-text-secondary',
          )}
        >
          {text}
        </div>
      ) : null}
    </div>
  );
}

export { AgentReasoning };
