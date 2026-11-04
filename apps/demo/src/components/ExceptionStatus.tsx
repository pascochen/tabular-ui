import { StatusBadge } from 'tabular-ui';

import type { ExceptionStatus as Status } from '../lib/close-state';

/**
 * An exception's status as a `StatusBadge`, in one place for the card and the
 * panel, as `runStatuses` does for runs. §5's mapping: open is `open`, or
 * `needs-review` when it waits on the visitor, resolved is passed, waiting is
 * queued. Each with its word and icon, so the state survives grayscale.
 *
 * `awaitsYou` takes the ochre and says whose it is: in the user tests every
 * tester missed the decision, and "Open" didn't tell them it was theirs.
 */
export function ExceptionStatus({ status, awaitsYou = false }: { status: Status; awaitsYou?: boolean }) {
  if (status === 'resolved') return <StatusBadge status="passed">Resolved</StatusBadge>;
  if (status === 'waiting') return <StatusBadge status="queued">Waiting</StatusBadge>;
  if (awaitsYou) return <StatusBadge status="needs-review">Needs your answer</StatusBadge>;
  return <StatusBadge status="open">Open</StatusBadge>;
}
