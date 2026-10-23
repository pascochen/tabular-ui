import { CheckCircleIcon, CircleIcon } from '@phosphor-icons/react';

import { cn, Spinner } from 'tabular-ui';

export type StageTrackerProps = {
  stages: readonly string[];
  /**
   * Index of the stage currently running. Everything before it is done,
   * everything after is pending. Pass `stages.length` when all are done.
   */
  activeIndex: number;
  className?: string;
};

/**
 * StageTracker — journey-local, deliberately not in Tabular UI. One screen needs
 * it; promote it when a second does (per the journey brief).
 *
 * No stage carries a hue. The active one is a running state, and §5 makes
 * running info, never interactive: sage is the success green, so a sage
 * spinner read as "passed" (it was sage until 2026-10-21). The spinner takes
 * its label's colour instead (§11.1, §11.5), and the active stage stands out
 * by shape and weight. Done stages get a check and secondary text; pending a
 * light circle.
 *
 * Grayscale survival (§10): the active stage is also the only one with a
 * spinner glyph and a `medium` label — shape and weight carry the state,
 * not colour alone.
 */
export function StageTracker({ stages, activeIndex, className }: StageTrackerProps) {
  return (
    <ol className={cn('flex items-center gap-[var(--gap-inline)]', className)}>
      {stages.map((label, i) => {
        const state = i < activeIndex ? 'done' : i === activeIndex ? 'active' : 'pending';
        return (
          <li
            key={label}
            aria-current={state === 'active' ? 'step' : undefined}
            className={cn(
              'flex items-center gap-[var(--gap-control-icon)] text-sm',
              // Connector between stages — neutral, 1px, structure not state.
              // The connector is the only flexible width: labels hold their
              // full text rather than truncating a stage name.
              i > 0 && 'flex-1 before:h-px before:min-w-4 before:flex-1 before:bg-border before:content-[""]',
            )}
          >
            {state === 'done' ? (
              // ≤16px floor: bold (§11.2).
              <CheckCircleIcon
                weight="bold"
                aria-hidden="true"
                className="size-[var(--size-icon-sm)] shrink-0 text-text-secondary"
              />
            ) : state === 'active' ? (
              // The square among circles: shape carries "active" too (§11.5).
              // No colour of its own: currentColor, the label's (§11.5).
              <Spinner className="size-[var(--size-icon-sm)] text-text-primary" />
            ) : (
              // De-emphasized state treatment: `light` — §11.2's state row wins
              // over the size floor. The icon carries pending; the label is
              // secondary, because a stage name is text the user reads.
              <CircleIcon
                weight="light"
                aria-hidden="true"
                className="size-[var(--size-icon-sm)] shrink-0 text-text-tertiary"
              />
            )}
            <span
              className={cn(
                'shrink-0 whitespace-nowrap',
                state === 'done' && 'text-text-secondary',
                state === 'active' && 'font-medium text-text-primary',
                state === 'pending' && 'text-text-secondary',
              )}
            >
              {label}
              <span className="sr-only">
                {state === 'done' ? ' — done' : state === 'active' ? ' — in progress' : ' — pending'}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
