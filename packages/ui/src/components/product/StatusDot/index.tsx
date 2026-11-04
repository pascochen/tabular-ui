import { cn } from '../../../lib/utils';
import type { RunStatus } from '../StatusBadge/statuses';

export type StatusDotStatus = Extract<RunStatus, 'needs-review' | 'open'>;

export type StatusDotProps = Omit<React.ComponentProps<'span'>, 'children'> & {
  status: StatusDotStatus;
};

const dotClasses: Record<StatusDotStatus, string> = {
  // Forced colours replace backgrounds, so a plain fill would disappear there.
  // A system colour is kept, and it stops this being the one dot that vanishes.
  'needs-review': 'bg-fill-warning forced-colors:bg-[CanvasText]',
  open: 'border-[length:var(--border-width)] border-text-secondary',
};

/**
 * StatusDot — product.
 *
 * §7.7's status dot: 6px, no text, for a place too tight for a `StatusBadge`,
 * such as a sidebar row. §5 sets its two kinds. Solid ochre means something is
 * waiting on the viewer, and a hollow neutral ring means something is open but
 * isn't theirs.
 *
 * Shape carries the difference as well as hue (§11.1), so it survives
 * grayscale. The ring also has about 55% of a solid dot's area, which is what
 * lets the ochre dot read first despite its lower contrast.
 *
 * Always `aria-hidden`: a dot says nothing to a screen reader, so the caller
 * puts the meaning beside it as hidden text.
 */
function StatusDot({ status, className, ...props }: StatusDotProps) {
  return (
    <span
      data-slot="status-dot"
      data-status={status}
      {...props}
      aria-hidden="true"
      className={cn('size-1.5 shrink-0 rounded-full', dotClasses[status], className)}
    />
  );
}

export { StatusDot };
