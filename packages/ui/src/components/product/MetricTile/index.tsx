import { ArrowDownIcon, ArrowUpIcon, MinusIcon } from '@phosphor-icons/react';

import { cn } from '../../../lib/utils';

type MetricTileBase = {
  label: string;
  /** Pre-formatted. The tile does not format — currency and locale are the caller's. */
  value: React.ReactNode;
  /**
   * Whether an increase is good. **Set `false` for cost, error rate, latency,
   * days-to-close** — anything where up is bad. Direction and goodness are not
   * the same thing in a finance tool.
   */
  higherIsBetter?: boolean;
  /** Context under the figure — "vs. H1 FY2025", "12 models". */
  caption?: React.ReactNode;
  /** `default` is the 32px hero figure; `sm` the 24px tile in a grid of 4+. */
  size?: 'sm' | 'default';
  className?: string;
};

/**
 * A delta comes with its number or not at all. The tile cannot read a
 * direction out of a formatted string, so a `delta` without `deltaValue`
 * would draw an arrow it had guessed.
 */
type MetricTileDelta =
  | { delta?: undefined; deltaValue?: undefined }
  | {
      /** Signed change against the comparison period, pre-formatted for display. */
      delta: React.ReactNode;
      /** The signed number behind `delta`. It decides the arrow and the colour. */
      deltaValue: number;
    };

export type MetricTileProps = MetricTileBase & MetricTileDelta;

/**
 * MetricTile — product.
 *
 * The one place in the system that uses the display tier: `--font-display`
 * (Source Serif 4) at `--text-metric` or `--text-metric-sm`, and nowhere
 * else (§8.3). Headings share the serif through `--font-heading`. Spacing
 * drawn for 13px reads airy at 32px; the serif's display optical size
 * (§8.4) is drawn tighter, so `$847.2M` reads as a single quantity.
 *
 * Tracking is **0**, never negative (§8.8). The optical size has already
 * done that work; `--tracking-tight` on top double-counts.
 */
function MetricTile({
  label,
  value,
  delta,
  deltaValue,
  higherIsBetter = true,
  caption,
  size = 'default',
  className,
}: MetricTileProps) {
  // §5 — polarity belongs on variance and delta, and zero is neutral, never a
  // hue. `higherIsBetter` is what keeps a rising cost from rendering green.
  const good = deltaValue === undefined ? null : higherIsBetter ? deltaValue > 0 : deltaValue < 0;
  const flat = deltaValue !== undefined && Math.abs(deltaValue) < Number.EPSILON;
  // No number, no arrow: a JavaScript caller can still pass `delta` alone, and
  // a guessed direction is worse than none.
  const DeltaIcon = deltaValue === undefined ? null : flat ? MinusIcon : deltaValue > 0 ? ArrowUpIcon : ArrowDownIcon;

  return (
    <div
      data-slot="metric-tile"
      className={cn(
        'flex flex-col gap-[var(--gap-bonded)] rounded-md border border-border',
        'bg-surface p-[var(--pad-card)]',
        className,
      )}
    >
      {/* Labels are structure, so they stay neutral (§0 rule 1). */}
      <span className="text-2xs font-medium uppercase tracking-[var(--tracking-wide)] text-text-secondary">
        {label}
      </span>

      <span
        className={cn(
          'font-display tracking-[var(--tracking-display)] text-text-primary',
          // tabular-nums is repeated per branch on purpose: the rule-5 lint
          // heuristic matches one string literal at a time, so a metric class
          // split from its tabular-nums reads as a violation. Cheaper to
          // satisfy the gate than to blunt it.
          size === 'sm' ? 'text-metric-sm tabular-nums' : 'text-metric tabular-nums',
        )}
        style={{ fontWeight: 600 }}
      >
        {value}
      </span>

      {delta !== undefined || caption ? (
        <div className="flex items-center gap-[var(--gap-control-icon)]">
          {delta !== undefined ? (
            <span
              className={cn(
                'inline-flex items-center gap-[var(--gap-icon-label)] text-sm tabular-nums',
                flat || good === null ? 'text-text-secondary' : good ? 'text-text-success' : 'text-text-danger',
              )}
            >
              {DeltaIcon ? <DeltaIcon weight="bold" aria-hidden="true" className="size-[var(--size-icon-xs)]" /> : null}
              {delta}
            </span>
          ) : null}
          {caption ? <span className="text-xs text-text-secondary">{caption}</span> : null}
        </div>
      ) : null}
    </div>
  );
}

export { MetricTile };
