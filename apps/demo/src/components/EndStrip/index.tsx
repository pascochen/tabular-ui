import { ArrowCounterClockwiseIcon, ArrowSquareOutIcon } from '@phosphor-icons/react';
import { Button, buttonVariants } from 'tabular-ui';

import { useReplay } from '../../lib/replay';
import { progress } from '../../lib/close-state';
import { useClose } from '../../lib/close-context';
import { close } from '../../lib/kasane';
import { AI_COMPONENTS_URL } from '../../lib/links';
import { hrefFor, onViewLinkClick } from '../../lib/view';

const openItems = { kind: 'channel', channel: 'open-items' } as const;
const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/**
 * Where the scripted run ends: what the close came to, then where to go.
 * Replay, the open items, or the AI components on tabularui.com. Neutral, and not an
 * `AgentBlock`: the demo says this, not the agent. A `region` with its own
 * name, so it can be found from the landmarks list.
 */
export function EndStrip() {
  const { state } = useClose();
  const replay = useReplay();
  const { resolved, total } = progress(state);
  // What's still not settled, from the state: after a Skip the cut-off is
  // open too, so no line here can be written ahead of time.
  const left = close.exceptions.flatMap((e) => {
    const status = state.exceptions[e.id].status;
    if (status === 'waiting' && 'waiting' in e && e.waiting) return [`${e.title} waits on the ${lower(e.waiting.on)}.`];
    return status === 'open' ? [`${e.title} is still open.`] : [];
  });
  return (
    <section
      aria-label="End of the demo"
      className="flex flex-col gap-[var(--gap-field)] rounded-md border border-border bg-surface p-[var(--pad-card)]"
    >
      <div className="flex flex-col gap-[var(--gap-bonded)]">
        <h2 className="text-md font-semibold text-text-primary">{close.endStrip.title}</h2>
        <p className="text-text-body">
          <span className="tabular-nums">
            {resolved} of {total}
          </span>{' '}
          resolved. {left.join(' ')}
        </p>
      </div>
      <div className="flex flex-wrap gap-[var(--gap-inline)]">
        <Button size="sm" onClick={replay}>
          <ArrowCounterClockwiseIcon aria-hidden="true" />
          Replay
        </Button>
        <a
          className={buttonVariants({ variant: 'outline', size: 'sm' })}
          href={hrefFor(openItems)}
          onClick={onViewLinkClick(openItems)}
        >
          See the open items
        </a>
        <a
          className={buttonVariants({ variant: 'outline', size: 'sm' })}
          href={AI_COMPONENTS_URL}
          target="_blank"
          rel="noreferrer"
        >
          Browse the AI components
          <ArrowSquareOutIcon aria-hidden="true" />
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      </div>
    </section>
  );
}
