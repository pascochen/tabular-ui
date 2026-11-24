import { useState } from 'react';

import { GestureKeyframes, tickIn } from '../../../lib/gestures';
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
  const ticked = useTickOnPass(status);
  return (
    <Badge tone={tone} data-status={status} className={cn(className)} {...props}>
      {hideIcon ? null : working ? (
        <Spinner />
      ) : (
        <Icon
          weight="bold"
          aria-hidden="true"
          data-ticked={ticked || undefined}
          className={ticked ? tickIn : undefined}
        />
      )}
      {ticked ? <GestureKeyframes /> : null}
      {children ?? label}
    </Badge>
  );
}

/**
 * The tracer becomes a tick (docs/explorations/motion-page-spec.md, M1): when
 * work seen running ends `passed`, the check mark is drawn in, left to right,
 * in 140ms. Only on a change seen live: a badge that mounts passed is still, or
 * a list of fifty passed runs would tick on every load. A failure lands in
 * place: nothing about it is "checked". Under reduced motion the mark swaps.
 *
 * The previous status is kept in state and compared during render, React's
 * pattern for a value derived from a change of props.
 */
function useTickOnPass(status: RunStatus) {
  const [previous, setPrevious] = useState(status);
  const [ticked, setTicked] = useState(false);
  if (status !== previous) {
    setPrevious(status);
    setTicked(status === 'passed' && !!runStatuses[previous].working);
  }
  return ticked;
}

export { StatusBadge };
