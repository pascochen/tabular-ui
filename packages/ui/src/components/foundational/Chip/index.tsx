import { XIcon } from '@phosphor-icons/react';
import type { VariantProps } from 'class-variance-authority';
import type { ComponentProps, MouseEvent } from 'react';

import { cn } from '../../../lib/utils';
import { chipVariants } from './variants';

export type ChipProps = Omit<ComponentProps<'button'>, 'onSelect'> &
  VariantProps<typeof chipVariants> & {
    /** Marks the chip as active. Uses --color-bg-interactive (§4). */
    selected?: boolean;
    /**
     * Renders a dismiss button beside the chip's own. Its click (or Enter /
     * Space) calls this; the chip's own onClick does not fire.
     */
    onDismiss?: (event: MouseEvent<HTMLButtonElement>) => void;
    /** Accessible name for the dismiss affordance. Required when dismissible. */
    dismissLabel?: string;
  };

/**
 * Chip — foundational.
 *
 * The interactive counterpart to `Badge`. Use for filters, facets and
 * anything the user can toggle or remove. If it is not clickable, it is a
 * `Badge`.
 *
 * Renders a `<button>`, so it is keyboard-reachable and takes the standard
 * focus outline. Neutral by design — see `variants.ts`.
 *
 * **A dismissible chip is two sibling buttons, never one inside the other.**
 * The dismiss control used to be a `<span role="button">` inside the chip's
 * `<button>`. That is valid HTML but not valid accessibility: a button's
 * content is presentational, so screen readers can flatten the inner control
 * away (axe `nested-interactive`). Now the chip's button keeps its look and
 * its full-width focus ring, and the dismiss button is a sibling laid over
 * the same right-hand edge the X always occupied. Geometry is unchanged:
 * the chip's right padding reserves exactly the dismiss button's width.
 */
function Chip({ className, size = 'default', selected, onDismiss, dismissLabel, children, ...props }: ChipProps) {
  const chip = (
    <button
      type="button"
      data-slot="chip"
      data-selected={selected ? '' : undefined}
      aria-pressed={selected}
      className={cn(
        chipVariants({ size }),
        // Room for the sibling dismiss button: the 2px label gap, the icon,
        // and the right padding less the 2px optical pull (§7.4).
        onDismiss &&
          'pr-[calc(var(--pad-chip-x)+var(--gap-icon-label)+var(--size-icon-xs)-2px)] group-hover/chip:after:bg-bg-hover group-active/chip:after:bg-bg-active',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );

  if (!onDismiss) return chip;

  return (
    <span data-slot="chip-dismissible" className="group/chip relative inline-flex w-fit shrink-0">
      {chip}
      <button
        type="button"
        data-slot="chip-dismiss"
        aria-label={dismissLabel ?? 'Remove'}
        disabled={props.disabled}
        onClick={onDismiss}
        className={cn(
          // Over the chip's right edge: 2px gap + icon + (padding − 2px) +
          // the chip's 1px border, the same 19px the X has always spanned.
          'absolute inset-y-0 right-0 inline-flex items-center rounded-r-md',
          'pl-[var(--gap-icon-label)] pr-[calc(var(--pad-chip-x)-1px)]',
          'text-text-secondary hover:text-text-body',
          'outline-none focus-visible:outline-ring',
          'focus-visible:outline-solid focus-visible:outline-[length:var(--ring-width)]',
          // Inset: the ring stays inside the chip, so a scrolling filter bar
          // cannot clip it (§4).
          'focus-visible:outline-offset-[-2px]',
          'disabled:pointer-events-none disabled:opacity-50',
          '[&>svg]:size-[var(--size-icon-xs)] [&>svg]:shrink-0',
        )}
      >
        <XIcon weight="bold" aria-hidden="true" />
      </button>
    </span>
  );
}

export { Chip };
