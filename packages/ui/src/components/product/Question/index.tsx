import { useEffect, useId, useRef, useState } from 'react';

import { cn } from '../../../lib/utils';
import { Button } from '../../foundational/Button';
import { Input } from '../../foundational/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../foundational/Select';
import { Field } from '../Field';

export type QuestionOption = {
  /** Stable, and what `onAnswer` reports. */
  id: string;
  /** One word or a few: "KJP only". It is the button's whole label. */
  label: string;
};

/** What the person did. One of four, so the agent knows which it got. */
export type QuestionAnswer =
  { kind: 'option'; id: string } | { kind: 'text'; text: string } | { kind: 'skip' } | { kind: 'delegate' };

export type QuestionProps = {
  /** The one question, sentence case, with its question mark. It names the options. */
  title: string;
  /**
   * The answers, each in a word or a few. Up to four are buttons, one press
   * each. Five or more go in a `Select`, with Answer to send the pick.
   */
  options?: readonly QuestionOption[];
  /**
   * A text field, for a fact the options can't hold: its label, as `Field`
   * takes it. A question with no options needs one.
   */
  text?: { label: string };
  onAnswer?: (answer: QuestionAnswer) => void;
  /**
   * Once the person has answered: the line that takes the controls' place,
   * "Answered by you: KJP only." Until it arrives, every control stays
   * disabled after the first answer, so the question is answered once.
   */
  outcome?: React.ReactNode;
  className?: string;
};

/** Up to this many options are buttons; more go in a Select (owner, 2026-10-28). */
const MAX_BUTTONS = 4;

/**
 * Question — product. One question the agent can't settle alone, with
 * options the person can answer in a word, and two ways out: Skip, and
 * Choose for me.
 *
 * **A part of an `AgentBlock`, not a block of its own**, like `Confirmation`.
 * The agent is the one asking, so the block carries the rail and the label.
 *
 * **One press answers.** Up to four options are `outline` buttons: an option
 * is an answer that stands on its own (§4, *Button groups*), and pressing it
 * is the answer, with no selected state and no submit. That is why this is
 * not a radio group, which CLAUDE.md rules out. Five or more go in a
 * `Select`, which costs one row however long the list (Select's README).
 *
 * Skip and Choose for me are always there (Vocabulary: "Answer, skip, or let
 * the agent decide"). They step back from answering, so they are `ghost`, at
 * the trailing edge. When there's a field to send, Answer is the filled
 * action after them.
 *
 * **Once.** The first answer disables every control (focusable while
 * disabled, so focus stays), and `outcome` replaces them and takes focus.
 */
function Question({ title, options = [], text, onAnswer, outcome, className }: QuestionProps) {
  const titleId = useId();
  const [answered, setAnswered] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const outcomeRef = useRef<HTMLParagraphElement>(null);
  const decided = outcome != null;
  const asSelect = options.length > MAX_BUTTONS;

  // Focus follows the answer: the control that had it is about to unmount.
  useEffect(() => {
    if (decided && answered) outcomeRef.current?.focus();
  }, [decided, answered]);

  const answer = (value: QuestionAnswer) => {
    if (answered) return;
    setAnswered(true);
    onAnswer?.(value);
  };

  // What Answer sends: typed text first, else the Select's pick.
  const typed = draft.trim();
  const pending: QuestionAnswer | null = typed
    ? { kind: 'text', text: typed }
    : picked
      ? { kind: 'option', id: picked }
      : null;
  const hasField = asSelect || text != null;
  const lock = { disabled: answered, focusableWhenDisabled: true } as const;

  return (
    <section
      data-slot="question"
      data-state={decided ? 'decided' : 'waiting'}
      aria-labelledby={titleId}
      className={cn('flex flex-col gap-[var(--gap-group)]', className)}
    >
      <h3 id={titleId} className="text-md font-semibold text-text-primary">
        {title}
      </h3>

      {decided ? (
        // A focus target, not a control: no ring, as AppShell's <main>.
        <p ref={outcomeRef} tabIndex={-1} className="text-base text-text-secondary outline-none">
          {outcome}
        </p>
      ) : (
        <form
          className="flex flex-col gap-[var(--gap-group)]"
          onSubmit={(event) => {
            event.preventDefault();
            if (pending) answer(pending);
          }}
        >
          {options.length > 0 && !asSelect ? (
            // A group named by the question, so each button is heard as one of its answers.
            <div role="group" aria-labelledby={titleId} className="flex flex-wrap gap-[var(--gap-inline)]">
              {options.map((option) => (
                <Button
                  key={option.id}
                  type="button"
                  size="sm"
                  variant="outline"
                  {...lock}
                  onClick={() => answer({ kind: 'option', id: option.id })}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          ) : null}

          {asSelect ? (
            <Select value={picked} onValueChange={(value) => setPicked(value as string | null)} disabled={answered}>
              <SelectTrigger aria-labelledby={titleId} className="w-full">
                <SelectValue placeholder="Choose an answer" />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}

          {text ? (
            <Field label={text.label}>
              {(p) => (
                // Read-only once answered, not disabled: Enter in the field answers, and focus stays.
                <Input {...p} value={draft} readOnly={answered} onChange={(event) => setDraft(event.target.value)} />
              )}
            </Field>
          ) : null}

          {/* A decision's buttons: right-aligned, the action last, the others ghost (§4). */}
          <div className="flex flex-wrap justify-end gap-[var(--gap-inline)]">
            <Button type="button" size="sm" variant="ghost" {...lock} onClick={() => answer({ kind: 'skip' })}>
              Skip
            </Button>
            <Button type="button" size="sm" variant="ghost" {...lock} onClick={() => answer({ kind: 'delegate' })}>
              Choose for me
            </Button>
            {hasField ? (
              <Button type="submit" size="sm" disabled={answered || !pending} focusableWhenDisabled>
                Answer
              </Button>
            ) : null}
          </div>
        </form>
      )}
    </section>
  );
}

export { Question };
