import { ELAPSED_AFTER_SECONDS, formatElapsed, useElapsedSeconds } from '../../lib/elapsed';

/**
 * The label beside a working `Spinner`, with its elapsed figure (§11.5):
 * "Working…" for the first three seconds, then "Working · 0:07". Shared by
 * `ChatThread`, `AgentReasoning` and `AgentPlan`.
 *
 * Two copies of the label. Assistive technology reads the hidden one, the bare
 * label, which never changes; the visible one ticks and is `aria-hidden`.
 * Inside a live region (`ChatThread`'s log) a ticking text node would
 * otherwise be read out every second.
 *
 * Mount it only while the work runs, and key it to the piece of work, so the
 * figure starts again at the next one.
 */
export function WorkingLabel({ label, startedAt }: { label: string; startedAt?: number }) {
  const seconds = useElapsedSeconds(startedAt);
  return (
    <span>
      <span className="sr-only">{label}</span>
      <span aria-hidden="true" className="tabular-nums">
        {seconds < ELAPSED_AFTER_SECONDS ? `${label}…` : `${label} · ${formatElapsed(seconds)}`}
      </span>
    </span>
  );
}
