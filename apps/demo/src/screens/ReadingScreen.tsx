import { useEffect, useRef, useState } from 'react';
import { Button, ProgressBar, RunLogRow } from 'tabular-ui';

import { StageTracker } from '../components/StageTracker';
import { estimateRunMinutes, formatMinutes, type JourneyFile } from '../lib/files';

// react-refresh wants component files exporting only components; the stage
// list is module-local and screens needing it later should move it to lib/.
const STAGES = ['Reading documents', 'Finding topics', 'Checking contradictions', 'Writing questions'] as const;

/** Demo pacing: the whole run plays out in well under a minute. */
const MS_PER_FILE = 1400;
const MS_PER_STAGE = 6000;

export type RunOutcome = {
  filesRead: number;
  totalFiles: number;
  elapsedMinutes: number;
  cancelled: boolean;
};

export type ReadingScreenProps = {
  files: JourneyFile[];
  onFinished: (outcome: RunOutcome) => void;
};

/**
 * Step 4: the long-running read. The user will not stay — the screen's job
 * is to be legible in one glance (where the run is, how much is left, that
 * leaving is fine) and then be left open in a tab.
 *
 * The running file carries the info hue (§5: running). Stages carry none: the
 * active one stands out by its spinner and weight. Everything done is
 * neutral; pending icons are tertiary. All animation is `motion-safe:` inside Tabular UI, so under
 * prefers-reduced-motion the statuses still read via icon and label.
 */
export function ReadingScreen({ files, onFinished }: ReadingScreenProps) {
  const total = files.length;
  const [filesDone, setFilesDone] = useState(0);
  // 0–3 = the active stage; STAGES.length = everything done.
  const [stage, setStage] = useState(0);

  // Latest-callback ref, synced in an effect (writing during render trips
  // react-hooks/refs). The timers below read it so they never go stale.
  const finishedRef = useRef(onFinished);
  useEffect(() => {
    finishedRef.current = onFinished;
  }, [onFinished]);

  const progress = stage === 0 ? (filesDone / Math.max(total, 1)) * 70 : Math.min(70 + (stage - 1) * 10, 100);
  // The pretend wall-clock length of a real run of these files, as the
  // pre-flight dialog quoted it.
  const runMinutes = estimateRunMinutes(files);
  const remainingMinutes = runMinutes * (1 - progress / 100);
  const elapsedMinutes = runMinutes - remainingMinutes;

  useEffect(() => {
    if (stage === 0 && filesDone < total) {
      const t = setTimeout(() => setFilesDone((n) => n + 1), MS_PER_FILE);
      return () => clearTimeout(t);
    }
    if (stage < STAGES.length) {
      const t = setTimeout(() => setStage((s) => s + 1), stage === 0 ? 800 : MS_PER_STAGE);
      return () => clearTimeout(t);
    }
    const t = setTimeout(
      () =>
        finishedRef.current({
          filesRead: total,
          totalFiles: total,
          elapsedMinutes: runMinutes,
          cancelled: false,
        }),
      800,
    );
    return () => clearTimeout(t);
  }, [stage, filesDone, total, runMinutes]);

  // Demo only: a visitor who has seen the run need not wait for it.
  const skip = () =>
    finishedRef.current({
      filesRead: total,
      totalFiles: total,
      elapsedMinutes: runMinutes,
      cancelled: false,
    });

  const cancel = () =>
    finishedRef.current({
      filesRead: filesDone,
      totalFiles: total,
      elapsedMinutes,
      cancelled: true,
    });

  return (
    <section className="flex flex-col gap-[var(--gap-group)]">
      <header className="flex items-start gap-[var(--gap-inline)]">
        <div className="flex min-w-0 flex-1 flex-col gap-[var(--gap-bonded)]">
          <h1 className="text-lg font-semibold text-text-primary">Reading your documents</h1>
          <p className="text-sm text-text-secondary">
            In the product a run continues if you leave. This demo runs in this tab, so a reload starts it again, and it
            is shortened to under a minute. Anything already read is kept if you cancel.
          </p>
        </div>
        <Button variant="ghost" onClick={skip}>
          Skip to results
        </Button>
        <Button variant="outline" onClick={cancel}>
          Cancel run
        </Button>
      </header>

      <div className="flex flex-col gap-[var(--gap-group)] rounded-md border border-border bg-surface p-[var(--pad-panel)]">
        <StageTracker stages={STAGES} activeIndex={stage} />
        <div className="flex flex-col gap-[var(--gap-bonded)]">
          <ProgressBar label="Overall progress" value={progress} showValue />
          <div className="flex items-baseline gap-[var(--gap-inline)]">
            <span className="text-sm tabular-nums text-text-body">
              {Math.min(filesDone, total)} of {total} {total === 1 ? 'file' : 'files'} read
            </span>
            <span className="flex-1" />
            <span
              className="text-xs tabular-nums text-text-secondary"
              // The figure is simulated, scaled to the estimate the dialog quoted.
              aria-live="off"
            >
              {stage >= STAGES.length ? 'Finishing…' : `about ${formatMinutes(remainingMinutes)} left`}
            </span>
          </div>
        </div>
      </div>

      {/* py-1 keeps the rows' inset focus rings clear of the scroll edges (§4). */}
      <ul className="max-h-[288px] overflow-y-auto rounded-md border border-border py-1">
        {files.map((item, i) => (
          <li key={item.id}>
            <RunLogRow
              status={i < filesDone ? 'passed' : i === filesDone && stage === 0 ? 'running' : 'queued'}
              name={item.name}
              duration={i < filesDone ? `${(2 + ((i * 37) % 55) / 10).toFixed(1)}s` : undefined}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
