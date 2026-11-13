import { StatusBadge } from 'tabular-ui';

import type { ExceptionStatus as Status, TaskStep } from '../lib/close-state';

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

/**
 * A finding's status in Tasks, where no thread sits under the badge to say why
 * it's open. The agent reading, the check rerunning and a skipped question each
 * get their own word, and a confirmation isn't called an answer. The rerun is the
 * deterministic check, so it's `running`, not the agent's (docs/agent-voice.md, rule 1).
 */
export function TaskStepStatus({ step }: { step: TaskStep }) {
  switch (step) {
    case 'needs-answer':
      return <StatusBadge status="needs-review">Needs your answer</StatusBadge>;
    case 'needs-confirmation':
      return <StatusBadge status="needs-review">Needs your confirmation</StatusBadge>;
    case 'agent-reading':
      return <StatusBadge status="agent-working" />;
    case 'rerunning':
      return <StatusBadge status="running">Check running</StatusBadge>;
    case 'skipped':
      return <StatusBadge status="skipped">Skipped</StatusBadge>;
    default:
      return <ExceptionStatus status={step} />;
  }
}
