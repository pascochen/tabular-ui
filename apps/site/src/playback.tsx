import { ArrowCounterClockwiseIcon } from '@phosphor-icons/react';
import { Button } from 'tabular-ui';

import { useAnnouncer, usePlayback } from './lib/playback';
import { runWash } from './lib/styles';

/** A polite live region: says a result once (docs/site.md §6). */
export function LiveRegion({ message }: { message: string }) {
  return (
    <p role="status" className="sr-only">
      {message}
    </p>
  );
}

/** The Replay control: a real button, named for what it replays (§11). */
export function ReplayButton({
  title,
  onClick,
  run,
}: {
  title: string;
  onClick: () => void;
  /** The run's state, for the wash (`runWash`). */
  run?: 'playing' | 'ended';
}) {
  return (
    <Button
      size="sm"
      variant="outline"
      onClick={onClick}
      aria-label={`Replay ${title}`}
      data-run={run}
      className={runWash}
    >
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
 *
 * While it plays, the rest frame sits invisibly in the same grid cell, so the
 * plate keeps its rest height and Replay never makes the page jump (owner,
 * 2026-10-26, on the Chat starter card). `invisible` also takes it out of the
 * accessibility tree and the tab order.
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
  const { ref, frame, playing, play, run } = usePlayback({ frames });
  const { announce, message } = useAnnouncer();
  return (
    <div ref={ref} className="flex flex-1 flex-col gap-[var(--gap-group)]">
      <div aria-busy={playing || undefined} className="grid flex-1 grid-cols-1 content-center">
        <div className="col-start-1 row-start-1">{children(frame)}</div>
        {frame < frames - 1 ? (
          <div aria-hidden="true" className="invisible col-start-1 row-start-1">
            {children(frames - 1)}
          </div>
        ) : null}
      </div>
      <div className="flex justify-end">
        <ReplayButton title={title} run={run} onClick={() => play(() => announce(`${title} replayed.`))} />
      </div>
      <LiveRegion message={message} />
    </div>
  );
}
