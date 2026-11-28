import { CaretRightIcon } from '@phosphor-icons/react';
import { useState } from 'react';

import { cn } from '../../../lib/utils';
import { Button } from '../../foundational/Button';
import { StatusBadge } from '../StatusBadge';
import { TruncatedText } from '../TruncatedText';
import { forcedColorsRowEdge, runStatusRowTreatment, type RunStatus } from '../StatusBadge/statuses';

export type RunLogRowProps = {
  status: RunStatus;
  /** Usually a dbt model or task identifier — rendered in mono (§8.3). */
  name: string;
  /** Pre-formatted. Wall-clock or elapsed; the row does not format time. */
  timestamp?: string;
  /** Pre-formatted duration, e.g. "4.2s". */
  duration?: string;
  /**
   * Log output or error detail. Its presence makes the row expandable. A row
   * whose `name` is cut off is expandable too, and opens to the full name.
   */
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
 *
 * **Expands when its name is cut off, too.** A name too long for the row
 * truncates, with a tooltip on hover and on keyboard focus, as
 * `TruncatedText` gives. A tooltip never opens on touch, so the row also
 * opens in place to the full name, the same disclosure an error uses.
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
  // Measured by TruncatedText, after layout and on every resize.
  const [nameCut, setNameCut] = useState(false);
  const isOpen = open ?? uncontrolled;
  const hasDetail = detail !== undefined;
  // An open row stays a control until it is closed, so a resize that lets the
  // name fit again can't strand an open row with no way to close it.
  const expandable = hasDetail || nameCut || isOpen;
  // The full name heads the detail while it's cut, and is the whole detail of
  // a row with nothing else to show.
  const nameInDetail = nameCut || !hasDetail;
  // A tint-only row's forced-colours edge (§5) goes round the row and its
  // open detail together, so the error sits inside its row's edge: the
  // wrapper draws it and the row draws none, one edge rather than two.
  const edgeOnWrapper = expandable && isOpen && !!runStatusRowTreatment[status]?.includes(forcedColorsRowEdge);

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
    edgeOnWrapper && 'forced-colors:outline-none',
  );

  const cells = (
    <>
      <CaretRightIcon
        weight="bold"
        aria-hidden="true"
        className={cn(
          'size-[var(--size-icon-xs)] shrink-0 text-text-tertiary transition-transform motion-reduce:transition-none',
          isOpen && 'rotate-90',
          !expandable && 'invisible',
        )}
      />

      {timestamp ? (
        <span className="shrink-0 font-mono text-xs tabular-nums text-text-secondary">{timestamp}</span>
      ) : null}

      <StatusBadge status={status} />

      {/*
        §8.3 — identifiers render mono, one step below the adjacent sans.
        Cut off, the name shows whole in a tooltip on hover and on keyboard
        focus of the row, and the row opens to it (touch has no tooltip).
      */}
      <TruncatedText showOnControlFocus onTruncatedChange={setNameCut} className="flex-1 font-mono text-xs">
        {name}
      </TruncatedText>

      {duration ? <span className="shrink-0 tabular-nums text-xs text-text-secondary">{duration}</span> : null}
    </>
  );

  return (
    <div data-slot="run-log-row" className={cn('group/run', edgeOnWrapper && forcedColorsRowEdge, className)}>
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
        // No rail: §7.8 keeps a 2px edge for the agent rail, the focus ring
        // and the active tab. The detail hangs past the caret column instead
        // (padding, caret, gap), so its text starts where the row's first
        // content after the caret does: the badge, or the timestamp when
        // there is one. An agent-proposed row's rail takes its 2px off the
        // row's own padding (runStatusRowTreatment), so that x holds there too.
        <div
          data-slot="run-log-detail"
          className={cn(
            'pr-[var(--pad-cell-x)] pl-[calc(var(--pad-cell-x)*2+var(--size-icon-xs))] py-[var(--pad-cell-y)]',
            'font-mono text-xs whitespace-pre-wrap text-text-secondary',
          )}
        >
          {nameInDetail ? (
            // The identifier whole, wrapping anywhere, since a model name has
            // no spaces to break at. Body colour, so it reads as the row's own
            // name and not as log output.
            <p
              data-slot="run-log-name"
              className={cn('text-text-body [overflow-wrap:anywhere]', hasDetail && 'mb-[var(--gap-bonded)]')}
            >
              {name}
            </p>
          ) : null}
          {hasDetail ? detail : null}
        </div>
      ) : null}
    </div>
  );
}

export { RunLogRow };
