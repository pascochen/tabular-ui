import { Button, MetricTile } from 'tabular-ui';

import { evidenceSheetCount, formatMinutes } from '../lib/files';
import type { RunOutcome } from './ReadingScreen';

export type RecapCounts = {
  gaps: number;
  followUps: number;
  contradictions: number;
  /** One per file read, flagged files included. */
  evidenceSheets: number;
  /** Sheets from files the pre-flight check flagged; read, and marked for review. */
  flaggedSheets: number;
};

export type RecapScreenProps = {
  outcome: RunOutcome;
  counts: RecapCounts;
  /**
   * Opens the modeling surface (the discovery summary). **Must not discard
   * the run** — this is the journey's primary action, and a primary action
   * that silently clears the screen is indistinguishable from the destructive
   * one beside it.
   */
  onOpenModeling: () => void;
  /** Clears the run and returns to the dropzone. The only destructive action here. */
  onRestart: () => void;
};

/**
 * Step 5: the recap. Three counts of what the run found, then the run
 * summary. The counts are neutral on purpose — a gap count is not a variance
 * (§5: polarity colour belongs on deltas only), and MetricTile without a
 * delta renders exactly that.
 */
export function RecapScreen({ outcome, counts, onOpenModeling, onRestart }: RecapScreenProps) {
  const summary: Array<[string, string]> = [
    ['Files read', `${outcome.filesRead} of ${outcome.totalFiles}`],
    ['Evidence sheets', evidenceSheetCount(counts)],
    ['Elapsed', formatMinutes(outcome.elapsedMinutes)],
  ];

  return (
    <section className="flex flex-col gap-[var(--gap-group)]">
      <header className="flex flex-col gap-[var(--gap-bonded)]">
        <h1 className="text-lg font-semibold text-text-primary">
          {outcome.cancelled ? 'Run cancelled' : 'First pass complete'}
        </h1>
        <p className="text-sm text-text-secondary">
          {outcome.cancelled
            ? `Cancelled after ${outcome.filesRead} of ${outcome.totalFiles} files. Everything read so far is kept below.`
            : `Drafted from your material: ${counts.evidenceSheets} evidence ${counts.evidenceSheets === 1 ? 'sheet' : 'sheets'}${counts.flaggedSheets > 0 ? `, ${counts.flaggedSheets} flagged for review` : ''}. Review the findings, then open the model.`}
        </p>
      </header>

      <div className="grid grid-cols-3 gap-[var(--gap-group)]">
        <MetricTile size="sm" label="Gaps" value={counts.gaps} caption="missing material" />
        <MetricTile size="sm" label="Follow-ups" value={counts.followUps} caption="questions drafted" />
        <MetricTile size="sm" label="Contradictions" value={counts.contradictions} caption="between sources" />
      </div>

      <dl className="flex flex-col divide-y divide-border rounded-md border border-border bg-surface">
        {summary.map(([label, value]) => (
          <div key={label} className="flex h-[var(--h-row-sm)] items-center px-[var(--pad-cell-x)] text-sm">
            <dt className="flex-1 text-text-secondary">{label}</dt>
            <dd className="tabular-nums text-text-body">{value}</dd>
          </div>
        ))}
      </dl>

      <footer className="flex items-center gap-[var(--gap-inline)]">
        <Button variant="ghost" onClick={onRestart}>
          Start a new run
        </Button>
        <span className="flex-1" />
        <Button size="lg" onClick={onOpenModeling}>
          Open modeling
        </Button>
      </footer>
    </section>
  );
}
