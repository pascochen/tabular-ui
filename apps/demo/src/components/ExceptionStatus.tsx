import { StatusBadge } from 'tabular-ui';

import type { ExceptionStatus as Status } from '../lib/close-state';

/**
 * An exception's status as a `StatusBadge`, in one place for the card and the
 * panel, as `runStatuses` does for runs. §5's mapping: open needs review,
 * resolved passed, waiting queued. Each with its word and icon, so the state
 * survives grayscale.
 *
 * `awaitsYou` is the same review state, with the word saying whose it is: in
 * the user tests every tester missed the decision, and "Open" didn't tell them
 * it was theirs.
 */
export function ExceptionStatus({ status, awaitsYou = false }: { status: Status; awaitsYou?: boolean }) {
  if (status === 'resolved') return <StatusBadge status="passed">Resolved</StatusBadge>;
  if (status === 'waiting') return <StatusBadge status="queued">Waiting</StatusBadge>;
  return <StatusBadge status="needs-review">{awaitsYou ? 'Needs your answer' : 'Open'}</StatusBadge>;
}
