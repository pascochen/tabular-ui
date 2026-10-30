import { StatusBadge } from 'tabular-ui';

import type { ExceptionStatus as Status } from '../lib/close-state';

/**
 * An exception's status as a `StatusBadge`, in one place for the card and the
 * panel, as `runStatuses` does for runs. §5's mapping: open needs review,
 * resolved passed, waiting queued. Each with its word and icon, so the state
 * survives grayscale.
 */
export function ExceptionStatus({ status }: { status: Status }) {
  if (status === 'resolved') return <StatusBadge status="passed">Resolved</StatusBadge>;
  if (status === 'waiting') return <StatusBadge status="queued">Waiting</StatusBadge>;
  return <StatusBadge status="needs-review">Open</StatusBadge>;
}
