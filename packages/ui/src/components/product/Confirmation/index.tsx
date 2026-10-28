import { useEffect, useId, useRef, useState } from 'react';

import { cn } from '../../../lib/utils';
import { Button } from '../../foundational/Button';

export type ConfirmationProps = {
  /**
   * The one action, asked as a question: "Send the variance summary to the
   * controller?" Sentence case, with its question mark.
   */
  title: string;
  /**
   * What running it changes. **Required**, and said even when it's nothing:
   * "Nothing in the books." is a claim the person can rely on.
   */
  changes: React.ReactNode;
  /** Who or what it reaches: a person, a team, a system outside this one. **Required.** */
  reaches: React.ReactNode;
  /** Names the action: "Send summary". Never a bare "Allow" or "Confirm" (`docs/agent-voice.md`, *Fixed strings*). */
  confirmLabel: string;
  /** Names what not running it means: "Don't send". */
  stopLabel: string;
  onConfirm?: () => void;
  onStop?: () => void;
  /**
   * Once the person has answered: the line that takes the buttons' place,
   * "Sent once, by you. The next send asks again." Until it arrives, both
   * buttons stay disabled after the first press, so the action can't run twice.
   */
  outcome?: React.ReactNode;
  className?: string;
};

/**
 * Confirmation — product. Permission for one action before it runs: the
 * action as a question, what it changes and who it reaches, then a button
 * that runs it once and one that stops it.
 *
 * **A part of an `AgentBlock`, not a block of its own**, like `AgentPlan`. The
 * block around it carries the rail and the authorship label, and the agent is
 * the one asking (CLAUDE.md: agent output is never a generic `Card`).
 *
 * **Once.** The permission covers one run. The first press disables both
 * buttons, so a double click or a second press can't run the action again,
 * and there is no "always allow". When `outcome` arrives it replaces the
 * buttons, and focus moves to it, so focus is never dropped on the page.
 */
function Confirmation({
  title,
  changes,
  reaches,
  confirmLabel,
  stopLabel,
  onConfirm,
  onStop,
  outcome,
  className,
}: ConfirmationProps) {
  const titleId = useId();
  const [answered, setAnswered] = useState(false);
  const outcomeRef = useRef<HTMLParagraphElement>(null);
  const decided = outcome != null;

  // Focus follows the press: the button that had it is about to unmount.
  useEffect(() => {
    if (decided && answered) outcomeRef.current?.focus();
  }, [decided, answered]);

  const answer = (handler?: () => void) => () => {
    if (answered) return;
    setAnswered(true);
    handler?.();
  };

  return (
    <section
      data-slot="confirmation"
      data-state={decided ? 'decided' : 'waiting'}
      aria-labelledby={titleId}
      className={cn('flex flex-col gap-[var(--gap-group)]', className)}
    >
      <h3 id={titleId} className="text-md font-semibold text-text-primary">
        {title}
      </h3>

      {/*
        Label and value side by side; the label column is as wide as its
        longest label. A description list, so a screen reader hears each
        value with its label.
      */}
      <dl className="grid grid-cols-[auto_1fr] gap-x-[var(--gap-group)] gap-y-[var(--gap-field)] text-base">
        <dt className="text-text-secondary">What changes</dt>
        <dd className="min-w-0 text-text-body">{changes}</dd>
        <dt className="text-text-secondary">Who it reaches</dt>
        <dd className="min-w-0 text-text-body">{reaches}</dd>
      </dl>

      {decided ? (
        // A focus target, not a control: no ring, as AppShell's <main>.
        <p ref={outcomeRef} tabIndex={-1} className="text-base text-text-secondary outline-none">
          {outcome}
        </p>
      ) : (
        <div className="flex justify-end gap-[var(--gap-inline)]">
          {/* Focusable while disabled, so the press that disables it keeps focus here. */}
          <Button size="sm" variant="ghost" disabled={answered} focusableWhenDisabled onClick={answer(onStop)}>
            {stopLabel}
          </Button>
          <Button size="sm" disabled={answered} focusableWhenDisabled onClick={answer(onConfirm)}>
            {confirmLabel}
          </Button>
        </div>
      )}
    </section>
  );
}

export { Confirmation };
