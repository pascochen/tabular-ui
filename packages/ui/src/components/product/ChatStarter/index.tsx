import { useId } from 'react';

import { cn } from '../../../lib/utils';
import { Button } from '../../foundational/Button';
import { TruncatedText } from '../TruncatedText';

export type ChatStarterProps = {
  /**
   * What can be asked here, in one or two sentences, with no agent name.
   * Promise only what the agent does today: this line is how the user learns what to ask.
   */
  description?: React.ReactNode;
  /**
   * Questions the user can start from, for the screen the panel sits beside.
   * Three or four, each a whole question, about 50 characters or fewer.
   */
  suggestions: string[];
  /** Called with the picked question. Fill the composer with it; don't send it. */
  onSelect: (text: string) => void;
  /** The list's label. "Suggested". */
  label?: string;
  className?: string;
};

/**
 * ChatStarter — product. What the chat panel shows before the first message:
 * one line on what can be asked here, and questions to start from.
 *
 * Goes in `ChatThread`'s `empty` slot, which sits it at the bottom of the
 * panel, against the composer. A picked question fills the composer
 * (`ChatComposerHandle.fill`) and is never sent on its own: the user names
 * the model, period or entity first, or sends it as it is.
 *
 * Neutral throughout (§0 rule 1 lists empty states). No greeting and no
 * display icon: the agent is "a colleague reporting to a finance lead, not a
 * host welcoming a guest" (`docs/agent-voice.md`).
 */
function ChatStarter({ description, suggestions, onSelect, label = 'Suggested', className }: ChatStarterProps) {
  const labelId = useId();
  return (
    <div data-slot="chat-starter" className={cn('flex flex-col gap-[var(--gap-group)]', className)}>
      {description ? <p className="text-sm text-text-secondary">{description}</p> : null}
      {suggestions.length > 0 ? (
        <div className="flex flex-col gap-[var(--gap-field)]">
          {/* §8.1 micro-label, as AppShellNavGroup's: secondary, because it is read. */}
          <div
            id={labelId}
            className="text-2xs font-medium tracking-[var(--tracking-wide)] text-text-secondary uppercase"
          >
            {label}
          </div>
          {/* gap-1 (4px) between rows: §7.4 fallback, no row-gap token by
              decision, as Menu's spaced rows. 2px made the bordered rows read
              as one broken table; 8px as unrelated buttons. */}
          <ul role="list" aria-labelledby={labelId} className="flex flex-col gap-1">
            {suggestions.map((text) => (
              <li key={text} className="flex">
                {/* Outline, so a row reads as something to press before it is
                    hovered; its edge lines up with the composer's box below.
                    `shrink` beats Button's shrink-0 (failure log, OrgSwitcher),
                    so a long question truncates instead of overflowing.
                    Regular weight, not Button's 500: four rows at 500
                    outweighed the composer (owner's review, 2026-10-14). */}
                <Button
                  variant="outline"
                  className="w-full shrink justify-start font-normal"
                  onClick={() => onSelect(text)}
                >
                  <TruncatedText showOnControlFocus>{text}</TruncatedText>
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export { ChatStarter };
