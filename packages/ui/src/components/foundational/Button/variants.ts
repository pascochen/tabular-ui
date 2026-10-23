import { cva } from 'class-variance-authority';

import { controlBase, controlGrounds, pressableBase } from '../controlBase';

/**
 * Separate module so index.tsx exports only the component — react-refresh
 * disables fast refresh for any file mixing components with other exports.
 *
 * Structure, focus, hover/press and disabled come from the shared control
 * contract. Only what is specific to a labelled button lives here.
 */
export const buttonVariants = cva(
  [
    ...controlBase,
    ...pressableBase,
    'group/button',

    // §7.4 — a control's icon gap is NOT a badge's. It must exceed the word
    // space (2.60px at --text-base, §7.4) or the icon binds to the first word more
    // tightly than the words bind to each other.
    'gap-[var(--gap-control-icon)]',
  ],
  {
    variants: {
      variant: controlGrounds,
      size: {
        sm: 'h-[var(--h-control-sm)] px-[var(--pad-control-x)] text-sm',
        default: 'h-[var(--h-control)] px-[var(--pad-control-x)] text-base',
        lg: 'h-[var(--h-control-lg)] px-[var(--pad-control-x)] text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);
