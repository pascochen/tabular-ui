import { cn } from '../../../lib/utils';
import { Badge, type BadgeProps } from '../../foundational/Badge';

export type CountBadgeProps = Omit<BadgeProps, 'children' | 'shape' | 'tone' | 'role'> & {
  /** An ARIA role for the element. The tone is always neutral. */
  role?: React.AriaRole;
  /** The category being counted — "Gaps", "Follow-ups", "Unmatched". */
  label: string;
  count: number;
  /**
   * Above this the figure renders as `{max}+`. The true count still reaches
   * assistive technology, so truncation is visual only.
   */
  max?: number;
};

/**
 * CountBadge — product. Composes `Badge`.
 *
 * A static summary marker: a category and how many are in it. A row of these
 * sits above a table or panel — "Unmatched 12 · Needs review 5 · Stale 3".
 *
 * **Static, so it has a tint ground and no border.** §7.7 is explicit that
 * border-plus-transparent is the *interactive* signal and tint-plus-no-border
 * is the static one; the difference is deliberately not carried by radius,
 * because every rectangle is square (since 2026-10-16). A bordered static
 * marker reads as clickable and does nothing when clicked.
 *
 * That also means the upgrade path is free: **the day these become filters,
 * they become `Chip`s** and gain a border, a hover state and selection — which
 * is exactly the affordance change the system reserves those signals for. Do
 * not add a border here to preview that; swap the primitive.
 *
 * **Neutral, always.** A count is not state (§0 rule 1) — twelve unmatched
 * entries is a quantity, and the badge is not itself failing. `FilterChip`
 * carries the same note for the same reason. If a *threshold* is breached and
 * that is genuinely true of the data, the surrounding surface says so; this
 * marker still does not.
 *
 * Not `Badge shape="count"`. That shape is a bare figure with no label, and its
 * `--radius-full` ends would fight the `--radius-xs` corners of the badge
 * enclosing them here. The figure earns its emphasis from weight of colour
 * instead: label at `--color-text-secondary`, figure at `--color-text-primary`.
 */
function CountBadge({ label, count, max = 99, className, ...props }: CountBadgeProps) {
  const truncated = count > max;

  return (
    <Badge
      tone="neutral"
      shape="status"
      // §7.4 fallback: no role token fits a label-to-figure gap, so the
      // primitive step is used explicitly. It must exceed the font's word
      // space — 2.00px at --text-2xs, scaling §7.4's measured 2.60px at
      // --text-base — or the figure binds to the label more tightly than the
      // words do, which is the inversion already in the failure log. 4px is
      // 2x. Badge's own 2px --gap-icon-label is for an icon and its label
      // as one atomic mark; a figure with its own colour is a second object.
      className={cn('gap-1', className)}
      {...props}
    >
      {label}
      {/*
        The visible figure is aria-hidden and the true count is rendered
        visually-hidden beside it, so a truncated "99+" still announces the
        real number. One code path, truncated or not.
      */}
      <span aria-hidden="true" className="tabular-nums text-text-primary">
        {truncated ? `${max}+` : count}
      </span>
      <span className="sr-only">{count}</span>
    </Badge>
  );
}

export { CountBadge };
