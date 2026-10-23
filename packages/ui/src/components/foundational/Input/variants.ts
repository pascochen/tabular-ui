import { cva } from 'class-variance-authority';

import { controlBase } from '../controlBase';

/**
 * Uses `controlBase` only — NOT `pressableBase`. A field is typed into, not
 * pressed: it must allow text selection, align its value to the reading edge,
 * and set that value in the body weight rather than a label weight.
 */
export const inputVariants = cva(
  [
    ...controlBase,
    'w-full min-w-0',

    // §0 rule 7 — the border does the work. No fill: a field stays quiet on
    // the canvas and on a surface alike, and reads like the outline Button.
    'border border-border bg-transparent',
    'text-text-body',

    // §3 — placeholder is exactly what --color-text-tertiary is scoped to
    // (4.18:1 dark / 4.53:1 light; non-essential text only).
    'placeholder:text-text-tertiary',

    'disabled:cursor-not-allowed',

    // §5 — invalid pairs a border tint with a danger-coloured message beside
    // the field. The message is the non-colour half and is the caller's job;
    // a border alone does not survive grayscale.
    'aria-invalid:border-border-danger',

    // The file-picker button, kept minimal and retokenized.
    'file:inline-flex file:border-0 file:bg-transparent file:font-medium file:text-text-body',
  ],
  {
    variants: {
      /**
       * What the field holds — not how it looks. §8.6 makes tabular figures
       * mandatory wherever a number is rendered, and §8.3 puts identifiers in
       * mono; both are structural here rather than remembered per call site.
       */
      content: {
        text: 'font-sans',
        // Figures align on the decimal, as they do in a variance column.
        numeric: 'font-sans text-right tabular-nums lining-nums',
        // §8.3 — mono runs one step below adjacent sans, with the slashed
        // zero, because account codes and run IDs get transcribed by hand.
        // Size is set per size in compoundVariants, NOT here: cva emits the
        // size variant after content, so a font-size set here loses to it.
        mono: 'font-mono',
      },
      size: {
        sm: 'h-[var(--h-control-sm)] px-[var(--pad-control-x)] text-sm',
        default: 'h-[var(--h-control)] px-[var(--pad-control-x)] text-base',
        lg: 'h-[var(--h-control-lg)] px-[var(--pad-control-x)] text-base',
      },
    },
    // §8.3 — mono one step below the sans it sits beside. Emitted last so it
    // wins the font-size conflict against the size variant.
    compoundVariants: [
      { content: 'mono', size: 'sm', class: 'text-xs' }, // sans 12 → mono 11
      { content: 'mono', size: 'default', class: 'text-sm' }, // sans 13 → mono 12
      { content: 'mono', size: 'lg', class: 'text-sm' }, // sans 13 → mono 12
    ],
    defaultVariants: {
      content: 'text',
      size: 'default',
    },
  },
);
