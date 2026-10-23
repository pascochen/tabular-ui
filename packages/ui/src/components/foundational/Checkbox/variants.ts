import { cva } from 'class-variance-authority';

import { controlBase } from '../controlBase';

/**
 * Uses `controlBase` only. Not `pressableBase` — there is no label to centre
 * and no ground to tint — and not `controlOverlay`, whose `::after` is already
 * spent here on the hit area below.
 */
export const checkboxVariants = cva(
  [
    ...controlBase,
    'peer relative flex shrink-0 items-center justify-center',
    'rounded-xs', // §7.7 --radius-xs, square since 2026-10-16. Radius never
    // encodes interactivity (§7.7), so this is optical only.

    // Unchecked matches Input: transparent with a 1px border.
    'border border-border bg-transparent',

    // Checked is the interactive role (§1) — selection is interactive.
    'data-checked:border-transparent data-checked:bg-fill-interactive data-checked:text-on-interactive',
    'data-indeterminate:border-transparent data-indeterminate:bg-fill-interactive data-indeterminate:text-on-interactive',

    'aria-invalid:border-border-danger',
    'disabled:cursor-not-allowed',

    // Hit area, not decoration. The visual box is 14–16px, well under the 24px
    // WCAG 2.5.8 target minimum; this extends the pointer target past the box
    // without moving it in layout. Kept from the vendored source.
    'after:absolute after:-inset-x-3 after:-inset-y-2',
  ],
  {
    variants: {
      size: {
        // The box tracks the icon scale, not the control scale: a checkbox is
        // a mark beside text, so it sits at the size of an inline icon.
        sm: 'size-[var(--size-icon-sm)] [&_svg]:size-2.5', // 14px box, 10px check
        default: 'size-[var(--size-icon-md)] [&_svg]:size-[var(--size-icon-xs)]', // 16px box, 12px check
      },
    },
    defaultVariants: { size: 'default' },
  },
);
