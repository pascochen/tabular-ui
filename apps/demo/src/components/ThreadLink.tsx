import { buttonVariants } from 'tabular-ui';

import { useClose } from '../lib/close-context';
import { taskStep } from '../lib/close-state';
import type { Exception } from '../lib/kasane';
import { hrefFor, onViewLinkClick, type View } from '../lib/view';

/**
 * The way from a finding to its thread, where the decision is made. Primary
 * while the visitor owes an answer or a confirmation, and it says which. One
 * place, for Tasks' panel and for a finding's records in Sources.
 */
export function ThreadLink({ task }: { task: Exception }) {
  const { state } = useClose();
  const step = taskStep(state, task.id);
  const channel: View = { kind: 'channel', channel: task.channel };
  const hash = `#${task.id}`;
  const yours = step === 'needs-answer' || step === 'needs-confirmation';
  return (
    <a
      className={buttonVariants({ variant: yours ? 'default' : 'outline' })}
      href={`${hrefFor(channel)}${hash}`}
      onClick={onViewLinkClick(channel, hash)}
    >
      {step === 'needs-answer' ? 'Answer' : step === 'needs-confirmation' ? 'Review' : 'Open'} in #{task.channel}
    </a>
  );
}
