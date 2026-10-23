import { cn } from '../../../lib/utils';
import { Badge } from '../../foundational/Badge';
import { Spinner } from '../../foundational/Spinner';
import type { BadgeProps } from '../../foundational/Badge';
import { runStatuses, type RunStatus } from './statuses';

export type StatusBadgeProps = Omit<BadgeProps, 'tone' | 'role' | 'shape' | 'children'> & {
  status: RunStatus;
  /** An ARIA role for the element, e.g. `status` when a change should be announced. The tone follows `status`. */
  role?: React.AriaRole;
  /** Override the default label. The icon and tone still follow `status`. */
  children?: React.ReactNode;
  /** Hide the icon. Do not use in a run log — §10 requires a grayscale pass. */
  hideIcon?: boolean;
};

/**
 * StatusBadge — product.
 *
 * Run and validation state. Composes `Badge`; it does not restyle it — the
 * whole point is that a status maps to a tone in exactly one place
 * (`statuses.ts`), so three screens cannot each decide what "degraded" looks
 * like.
 *
 * Every status ships an icon as well as a hue. That is not decoration: §10
 * requires that a run log converted to grayscale keep every state
 * distinguishable, and colour alone fails that test.
 *
 * Row-level treatments — the `--color-bg-danger` tint on a failed row, the
 * agent left rail — are **not** here. A badge cannot tint the row it sits in.
 * `DataTable` and `RunLogRow` read `runStatusRowTreatment` for those.
 */
function StatusBadge({ status, children, hideIcon, className, ...props }: StatusBadgeProps) {
  const { label, tone, icon: Icon, working } = runStatuses[status];
  return (
    <Badge tone={tone} data-status={status} className={cn(className)} {...props}>
      {hideIcon ? null : working ? <Spinner /> : <Icon weight="bold" aria-hidden="true" />}
      {children ?? label}
    </Badge>
  );
}

export { StatusBadge };
