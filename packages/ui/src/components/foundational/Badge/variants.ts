import { cva, type VariantProps } from 'class-variance-authority';

/**
 * Static marker. Not a control — it takes no `controlBase`: nothing here is
 * focusable, hoverable or disable-able. A badge that needs a hover state is a
 * `Chip`.
 *
 * §7.7's taxonomy separates two shapes that both live here:
 *
 *   status badge — "passed", "stale"  → --radius-xs, tint, no border
 *   count badge  — "3", "12"          → --radius-full, 1–2 characters only
 *
 * The vendored source shipped `rounded-full` for everything. §7.7 rejects
 * that for status: down a 30-row status column, pills pull their visual mass
 * inward and scallop the left edge against the grid's vertical rhythm, and
 * they need ~10px of horizontal padding against 6px to avoid looking cramped.
 */
const badgeCva = cva(
  [
    'inline-flex w-fit shrink-0 items-center justify-center gap-[var(--gap-icon-label)]',
    // No border, not even a transparent one. The vendored source carried
    // `border border-transparent` so bordered variants would not shift
    // layout; Badge has no bordered variant (border is Chip's signal, §7.7),
    // and the 2px it adds breaks §7.3's 18px computation.
    'overflow-hidden whitespace-nowrap',

    // §7.3 — 10px text with 14px line-height and --pad-badge-y renders 18px
    // tall, which sits comfortably inside a 28px row.
    'px-[var(--pad-badge-x)] py-[var(--pad-badge-y)]',
    'text-2xs font-medium uppercase tracking-[var(--tracking-wide)]',

    // §11.3 — the mark beside a badge label is smaller than the icon scale's
    // floor, so it takes the primitive step.
    '[&>svg]:pointer-events-none [&>svg]:size-2.5',
  ],
  {
    variants: {
      /**
       * §4 — tint ground with the matching role foreground. The tint is
       * {hue}-500 at 10%, never a 900/950 step: those drift in lightness by
       * hue and would not sit at equal depth across the roles (§0 rule 3).
       */
      tone: {
        neutral: 'bg-bg-hover text-text-secondary',
        interactive: 'bg-bg-interactive text-text-interactive',
        danger: 'bg-bg-danger text-text-danger',
        warning: 'bg-bg-warning text-text-warning',
        success: 'bg-bg-success text-text-success',
        agent: 'bg-bg-agent text-text-agent',
        // §5 — running and in-progress work. Not `interactive`: that is
        // sage, and a running badge would read as passed (§1).
        info: 'bg-bg-info text-text-info',
      },
      shape: {
        status: 'rounded-xs',
        // §7.7 — the one legitimate pill. A count is 1–2 characters, so the
        // round ends enclose it rather than trailing off it.
        count: 'min-w-[18px] rounded-full px-[var(--pad-badge-y)] tabular-nums',
      },
    },
    defaultVariants: { tone: 'neutral', shape: 'status' },
  },
);

/** One of §1's six roles, or `neutral`. The prop is `tone`, not `role`. */
export type BadgeTone = NonNullable<VariantProps<typeof badgeCva>['tone']>;

export const badgeTones = [
  'neutral',
  'interactive',
  'danger',
  'warning',
  'success',
  'agent',
  'info',
] as const satisfies readonly BadgeTone[];

// The cva's own options (tone, shape, and a class to append), plus `role`.
export type BadgeVariantOptions = NonNullable<Parameters<typeof badgeCva>[0]> & {
  /** @deprecated Use `tone`. Renamed 2026-10-09; still honoured. */
  role?: BadgeTone | null;
};

/**
 * The prop was `role` until 2026-10-09. That is also the HTML attribute that
 * tells assistive technology what an element is, so a badge could never carry
 * a real one, and `<Badge role="danger">` read as an ARIA role to anyone who
 * knew the attribute. `role` is still accepted here so existing calls keep
 * working; `tone` wins when both are given.
 */
export function badgeVariants({ tone, role, ...rest }: BadgeVariantOptions = {}) {
  return badgeCva({ ...rest, tone: tone ?? role });
}
