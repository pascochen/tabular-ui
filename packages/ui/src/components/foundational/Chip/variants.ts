import { cva } from 'class-variance-authority';

import { controlBase, controlOverlay } from '../controlBase';

/**
 * The interactive half of §7.7's badge/chip pair. Not vendored — shadcn has no
 * chip; `CLAUDE.md`'s 14 are foundational by decision, not by shadcn's
 * catalogue.
 *
 * **The difference from `Badge` is border and hover, not radius.** §7.7 is
 * explicit: every rectangle is square (since 2026-10-16), so radius
 * cannot carry the signal. A static badge gets a tint ground and no border; an
 * interactive chip gets a border, a transparent ground, and a hover state.
 *
 * Neutral only. A chip names a filter — "SAP", "Q2 FY2026" — and a filter is not
 * state, so it carries no hue (§0 rule 1). Selection is the one exception,
 * because selection *is* the interactive role.
 */
export const chipVariants = cva(
  [
    ...controlBase,
    ...controlOverlay,
    'relative inline-flex w-fit shrink-0 select-none items-center',
    'gap-[var(--gap-icon-label)] whitespace-nowrap',
    'rounded-md', // §7.7 — interactive tier, --radius-md since 2026-10-15
    'px-[var(--pad-chip-x)] py-[var(--pad-chip-y)]',
    'text-sm font-medium',

    // Border + transparent ground: the interactive signal.
    'border border-border bg-transparent text-text-body',

    // Selection is the interactive role — §4 is explicit that no
    // --color-bg-selected exists, because it would duplicate this.
    'data-[selected]:border-border-interactive data-[selected]:bg-bg-interactive',
    'data-[selected]:text-text-interactive',

    'disabled:cursor-not-allowed',
    '[&>svg]:pointer-events-none [&>svg]:shrink-0 [&>svg]:size-[var(--size-icon-xs)]',
  ],
  {
    variants: {
      size: {
        sm: 'text-xs',
        default: 'text-sm',
      },
    },
    defaultVariants: { size: 'default' },
  },
);
