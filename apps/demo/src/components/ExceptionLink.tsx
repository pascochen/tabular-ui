import { buttonVariants, cn } from 'tabular-ui';

import { useClose } from '../lib/close-context';
import { awaitsVisitor } from '../lib/close-state';
import type { Exception } from '../lib/kasane';
import { hrefFor, onViewLinkClick, placeOf, useView, type View } from '../lib/view';
import { ExceptionStatus } from './ExceptionStatus';

/**
 * A row linking to a finding's message, with its status. In the channel that holds
 * it, a plain fragment the browser scrolls to, which keeps the rest of the URL
 * (`?at=end`). From anywhere else, a link to the channel with the fragment, which
 * `useExceptionLink` lands. A list that only shows status is a dead end.
 */
export function ExceptionLink({ exception: e }: { exception: Exception }) {
  const { state } = useClose();
  const channel: View = { kind: 'channel', channel: e.channel };
  const here = placeOf(useView()) === placeOf(channel);
  const hash = `#${e.id}`;
  return (
    <a
      href={here ? hash : `${hrefFor(channel)}${hash}`}
      onClick={here ? undefined : onViewLinkClick(channel, hash)}
      className={cn(buttonVariants({ variant: 'ghost' }), 'w-full justify-between font-normal text-text-body')}
    >
      <span className="min-w-0 truncate">{e.title}</span>
      <ExceptionStatus status={state.exceptions[e.id].status} awaitsYou={awaitsVisitor(state, e.id)} />
    </a>
  );
}
