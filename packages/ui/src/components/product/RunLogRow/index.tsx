import { CaretRightIcon } from '@phosphor-icons/react';
import { useState } from 'react';

import { cn } from '../../../lib/utils';
import { Button } from '../../foundational/Button';
import { StatusBadge } from '../StatusBadge';
import { runStatusRowTreatment, type RunStatus } from '../StatusBadge/statuses';

export type RunLogRowProps = {
  status: RunStatus;
  /** Usually a dbt model or task identifier — rendered in mono (§8.3). */
  name: string;
  /** Pre-formatted. Wall-clock or elapsed; the row does not format time. */
  timestamp?: string;
  /** Pre-formatted duration, e.g. "4.2s". */
  duration?: string;
  /** Log output or error detail. Its presence is what makes the row expandable. */
  detail?: React.ReactNode;
  /** Controlled disclosure. Omit for uncontrolled. */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
};

/**
 * RunLogRow — product.
 *
 * A single pipeline execution entry at `--h-row-xs` (24px) — tighter than
 * `DataTable`'s 28px, because a run log is scanned rather than read.
 *
 * Composes `StatusBadge`, and takes its row treatment from
 * `runStatusRowTreatment` rather than deciding what a failed run looks like:
 * §5 owns that mapping, and it lives in exactly one place.
 *
 * **Expands when given `detail`.** A failed run is useless without its error,
 * and sending the reader to a detail page loses their place in the log. The
 * collapsed row stays 24px; the detail renders in mono beneath it.
 */
function RunLogRow({
  status,
  name,
  timestamp,
  duration,
  detail,
  open,
  defaultOpen = false,
  onOpenChange,
  className,
}: RunLogRowProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultOpen);
  const isOpen = open ?? uncontrolled;
  const expandable = detail !== undefined;

  const setOpen = (next: boolean) => {
    if (open === undefined) setUncontrolled(next);
    onOpenChange?.(next);
  };

  const rowClassName = cn(
    'flex w-full items-center gap-[var(--pad-cell-x)] text-left',
    'h-[var(--h-row-xs)] px-[var(--pad-cell-x)]',
    'text-sm text-text-body',
    // §4 — the single composited overlay, not a background swap.
    'hover:bg-bg-hover',
    'outline-none focus-visible:outline-ring',
    'focus-visible:outline-solid focus-visible:outline-[length:var(--ring-width)]',
    // Inset, so the ring survives a scrolling log with overflow:hidden (§4).
    'focus-visible:outline-offset-[-2px]',
    runStatusRowTreatment[status],
  );

  const cells = (
    <>
      <CaretRightIcon
        weight="bold"
        aria-hidden="true"
        className={cn(
          'size-[var(--size-icon-xs)] shrink-0 text-text-tertiary transition-transform',
          isOpen && 'rotate-90',
          !expandable && 'invisible',
        )}
      />

      {timestamp ? (
        <span className="shrink-0 font-mono text-xs tabular-nums text-text-secondary">{timestamp}</span>
      ) : null}

      <StatusBadge status={status} />

      {/* §8.3 — identifiers render mono, one step below the adjacent sans. */}
      <span className="min-w-0 flex-1 truncate font-mono text-xs">{name}</span>

      {duration ? <span className="shrink-0 tabular-nums text-xs text-text-secondary">{duration}</span> : null}
    </>
  );

  return (
    <div data-slot="run-log-row" className={cn('group/run', className)}>
      {expandable ? (
        // The row is the disclosure, so it is the real control: `Button
        // variant="inline"`, as LineageTree's rows are, never a hand-styled
        // <button>. The inline variant adds no padding or height; the
        // overrides undo the control shape it does carry, so the row renders
        // exactly as the plain one does: content starts left, square corners,
        // and the ground runs under the border. controlBase's
        // `bg-clip-padding` stopped the agent tint at the 2px rail's inner
        // edge, so an expandable agent-proposed row drew a lighter rail than
        // a plain one (caught by a pixel diff, 2026-10-12).
        <Button
          variant="inline"
          aria-expanded={isOpen}
          onClick={() => setOpen(!isOpen)}
          data-status={status}
          className={cn(rowClassName, 'cursor-pointer justify-start rounded-none bg-clip-border')}
        >
          {cells}
        </Button>
      ) : (
        <div data-status={status} className={rowClassName}>
          {cells}
        </div>
      )}

      {expandable && isOpen ? (
        <div
          className={cn(
            'border-l-[length:var(--border-width-2)] border-l-border-strong',
            'ml-[var(--pad-cell-x)] px-[var(--pad-cell-x)] py-[var(--pad-cell-y)]',
            'font-mono text-xs whitespace-pre-wrap text-text-secondary',
          )}
        >
          {detail}
        </div>
      ) : null}
    </div>
  );
}

export { RunLogRow };
