import { cva } from 'class-variance-authority';

import { controlBase, controlOverlay } from '../controlBase';
import { popupItem } from '../popupSurface';

/**
 * The trigger reads as a field, not as a button: its value is left-aligned and
 * set in the body weight, matching `Input` so a form of mixed controls lines
 * up. But it IS pressed, so it takes `controlOverlay` — which is exactly why
 * that overlay is separate from `pressableBase`.
 */
export const selectTriggerVariants = cva(
  [
    ...controlBase,
    ...controlOverlay,
    'relative flex w-full min-w-0 select-none items-center justify-between',
    'gap-[var(--gap-control-icon)] whitespace-nowrap',

    // §0 rule 7 — border does the work. Matches Input exactly.
    'border border-border bg-transparent text-text-body',

    // §3 — placeholder is what --color-text-tertiary is scoped to.
    'data-[placeholder]:text-text-tertiary',

    'disabled:cursor-not-allowed',
    'aria-invalid:border-border-danger',

    '[&_svg]:pointer-events-none [&_svg]:shrink-0',
  ],
  {
    variants: {
      content: {
        text: 'font-sans',
        // §8.3 — identifier lists (models, schemas, run IDs) read in mono,
        // one step below adjacent sans, with the slashed zero.
        mono: 'font-mono',
      },
      size: {
        sm: 'h-[var(--h-control-sm)] px-[var(--pad-control-x)] text-sm',
        default: 'h-[var(--h-control)] px-[var(--pad-control-x)] text-base',
        lg: 'h-[var(--h-control-lg)] px-[var(--pad-control-x)] text-base',
      },
    },
    // Emitted last so mono wins the font-size conflict against `size`.
    compoundVariants: [
      { content: 'mono', size: 'sm', class: 'text-xs' },
      { content: 'mono', size: 'default', class: 'text-sm' },
      { content: 'mono', size: 'lg', class: 'text-sm' },
    ],
    defaultVariants: { content: 'text', size: 'default' },
  },
);

/**
 * Items carry the trigger's face so a value does not change appearance between
 * the list and the closed control.
 */
export const selectItemVariants = cva(
  [
    ...popupItem,
    // §4 — the SELECTED item takes --color-bg-interactive, because selection
    // is the interactive role and no --color-bg-selected exists by design.
    // Highlighted comes from popupItem, shared with Menu.
    'data-[selected]:bg-bg-interactive data-[selected]:text-text-primary',
  ],
  {
    variants: {
      content: {
        text: 'font-sans text-base',
        mono: 'font-mono text-sm',
      },
    },
    defaultVariants: { content: 'text' },
  },
);
