import { cva } from 'class-variance-authority';

import { controlBase } from '../controlBase';

/**
 * Geometry is derived, not inherited. The vendored source shipped
 * `h-[16.6px] w-[28px]` — a fractional height that lands off the pixel grid
 * and belongs to no scale. These sizes come from the icon scale, with a
 * uniform 2px inset and a travel distance that follows from it:
 *
 *   default  track 28×16, thumb 12, inset 2, travel 12
 *   sm       track 24×14, thumb 10, inset 2, travel 10
 *
 * The inset is the 1px border plus 1px of padding. The border is transparent
 * but still inside the box, and `aria-invalid` colours it. With `p-[2px]` the
 * inset was 3px: the thumb sat 3px from the left edge, 2px from top and
 * bottom (it overflowed the 10px content height), and 1px from the right
 * when on, because the travel assumed 2px (found 2026-10-20).
 *
 * Square since 2026-10-23 (owner's decision, after a side-by-side in
 * Storybook). The track is a control, so `--radius-md`; the thumb is a part
 * inset inside it, so `--radius-sm` (§7.7). Every control in the system is
 * square, and `--radius-full` is left to marks that are read, not operated.
 */
export const switchVariants = cva(
  [
    ...controlBase,
    'group/switch peer relative inline-flex shrink-0 items-center',
    'rounded-md border border-transparent p-px',

    // Off is neutral and must stay visible on the canvas; --color-border is
    // too close to the ground (1.29:1 light, 1.80:1 dark, §3), so the off track takes the stronger
    // step. On is the interactive role (§1).
    'data-unchecked:bg-border-strong',
    'data-checked:bg-fill-interactive',

    'aria-invalid:border-border-danger',
    'data-disabled:cursor-not-allowed data-disabled:opacity-50',

    // Hit area: the track is 14–16px tall, under the 24px WCAG 2.5.8 target
    // minimum. Extends the pointer target without affecting layout.
    'after:absolute after:-inset-x-2 after:-inset-y-2',
  ],
  {
    variants: {
      size: {
        sm: 'h-[14px] w-[24px]',
        default: 'h-[16px] w-[28px]',
      },
    },
    defaultVariants: { size: 'default' },
  },
);

/**
 * The thumb flips light/dark rather than staying one colour, because a single
 * thumb colour cannot clear both grounds in both modes — paper on
 * `ledger-300` in light mode is 1.62:1. Position is the non-colour half of
 * the state signal and survives grayscale on its own.
 */
export const switchThumbVariants = cva(
  [
    // The slide is movement; under reduced motion the thumb jumps (§4, as
    // Spinner and AgentReasoning's caret do).
    'pointer-events-none block rounded-sm transition-transform motion-reduce:transition-none',
    'group-data-unchecked/switch:bg-text-primary',
    'group-data-checked/switch:bg-on-interactive',
  ],
  {
    variants: {
      size: {
        sm: 'size-[10px] group-data-checked/switch:translate-x-[10px]',
        default: 'size-[12px] group-data-checked/switch:translate-x-[12px]',
      },
    },
    defaultVariants: { size: 'default' },
  },
);
