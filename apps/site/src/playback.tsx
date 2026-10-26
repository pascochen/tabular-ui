import { ArrowCounterClockwiseIcon } from '@phosphor-icons/react';
import { Button } from 'tabular-ui';

import { useAnnouncer, usePlayback } from './lib/playback';

/** A polite live region: says a result once (docs/site.md §6). */
export function LiveRegion({ message }: { message: string }) {
  return (
    <p role="status" className="sr-only">
      {message}
    </p>
  );
}

/** The Replay control: a real button, named for what it replays (§11). */
export function ReplayButton({ title, onClick }: { title: string; onClick: () => void }) {
  return (
    <Button size="sm" variant="outline" onClick={onClick} aria-label={`Replay ${title}`}>
      <ArrowCounterClockwiseIcon aria-hidden="true" />
      Replay
    </Button>
  );
}

/**
 * A card's specimen: its frames, played once on view, with Replay inside the
 * plate at the bottom right (wireframe `78:191`). The content is aria-busy while
 * it plays, so a screen reader doesn't read a half-built frame, and a Replay
 * says once that it has finished.
 */
export function Specimen({
  title,
  frames,
  children,
}: {
  title: string;
  frames: number;
  children: (frame: number) => React.ReactNode;
}) {
  const { ref, frame, playing, play } = usePlayback({ frames });
  const { announce, message } = useAnnouncer();
  return (
    <div ref={ref} className="flex flex-1 flex-col gap-[var(--gap-group)]">
      <div aria-busy={playing || undefined} className="flex-1">
        {children(frame)}
      </div>
      <div className="flex justify-end">
        <ReplayButton title={title} onClick={() => play(() => announce(`${title} replayed.`))} />
      </div>
      <LiveRegion message={message} />
    </div>
  );
}
