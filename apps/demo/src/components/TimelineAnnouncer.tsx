import { useClose } from '../lib/close-context';
import { close, memberName } from '../lib/kasane';
import { timeline } from '../lib/timeline';

const titleOf = (id: string) => close.exceptions.find((e) => e.id === id)!.title;

/**
 * The teammates' side, said once each for assistive technology: a reply, a
 * resolution, a wait, the end. The last applied event decides the line; a
 * Skip, which applies them all at once, is said as one line. Typing is never
 * announced: the reply that follows is.
 */
export function TimelineAnnouncer() {
  const { state } = useClose();
  const last = state.applied ? timeline[state.applied - 1].effect : null;
  let message = '';
  if (state.ended) message = 'The scripted close has ended. Replay starts it again.';
  else if (last?.kind === 'reply')
    message = `${memberName(last.author)} replied on ${titleOf(last.exception)}: ${last.text}`;
  else if (last?.kind === 'resolve') message = `${titleOf(last.exception)} resolved by ${memberName(last.by)}.`;
  else if (last?.kind === 'wait') message = `${titleOf(last.exception)} is waiting.`;
  return (
    <p role="status" className="sr-only">
      {message}
    </p>
  );
}
