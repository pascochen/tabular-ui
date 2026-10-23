import { cn } from '../../../lib/utils';

export type ProgressBarTone = 'info' | 'interactive' | 'success' | 'warning' | 'danger' | 'agent';

export type ProgressBarProps = {
  /** 0–100. Omit for an indeterminate bar. */
  value?: number;
  /**
   * Which of §1's roles fills the track. `info` is a run in progress (§5);
   * `danger`/`warning` belong to a threshold being breached, not to decoration.
   */
  tone?: ProgressBarTone;
  /**
   * @deprecated Use `tone`. Renamed 2026-10-09: `role` is the ARIA attribute,
   * and this component always renders `role="progressbar"` itself.
   */
  role?: ProgressBarTone;
  /** Accessible name. Required — a bare bar announces nothing. */
  label: string;
  /** Shows the figure beside the track. */
  showValue?: boolean;
  size?: 'sm' | 'default';
  className?: string;
};

const fills = {
  info: 'bg-fill-info',
  interactive: 'bg-fill-interactive',
  success: 'bg-fill-success',
  warning: 'bg-fill-warning',
  danger: 'bg-fill-danger',
  agent: 'bg-fill-agent',
} as const;

/**
 * ProgressBar — product.
 *
 * A track and a fill. The track is `--color-border-strong` rather than a
 * surface step, so it stays visible on both the canvas and a raised surface.
 *
 * **The hue must be true of the run** (§0 rule 1). `info` for work in
 * progress, because it is the role that means running (§1, §5) — not
 * `interactive`, which is ledger ink and renders a neutral bar that says
 * nothing about the run's state; `danger` or `warning` only when something
 * actually is failing or degrading. A red bar because a number is low is
 * decoration.
 *
 * `--radius-full` is correct here: the track is a capsule, and §7.7 permits
 * full radius for things that are inherently round. It is not a pill in the
 * sense §7.7 warns about — that argument is about repeated status markers
 * scalloping a column edge.
 */
function ProgressBar({ value, tone, role, label, showValue, size = 'default', className }: ProgressBarProps) {
  const fill = fills[tone ?? role ?? 'info'];
  const indeterminate = value === undefined;
  const clamped = indeterminate ? 0 : Math.max(0, Math.min(100, value));

  return (
    <div data-slot="progress-bar" className={cn('flex items-center gap-[var(--gap-control-icon)]', className)}>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={indeterminate ? undefined : Math.round(clamped)}
        aria-valuemin={0}
        aria-valuemax={100}
        className={cn(
          'relative w-full overflow-hidden rounded-full bg-border-strong',
          size === 'sm' ? 'h-[2px]' : 'h-[4px]',
        )}
      >
        <div
          className={cn(
            // motion-safe for the same reason the pulse below carries it: a
            // determinate fill sliding to its new value is movement, and under
            // prefers-reduced-motion the bar should arrive rather than travel.
            // Nothing is lost — the width, the label and the optional figure
            // all still report the value. The component previously gated the
            // indeterminate animation and not this one, which meant a user who
            // had asked for less motion still got the sliding fill on every
            // update; on a long pipeline run that is the animation they see
            // most.
            'h-full rounded-full motion-safe:transition-[width]',
            fill,
            // Indeterminate work still has to look like work. motion-safe so it
            // stops under prefers-reduced-motion, where the track alone reads
            // as "in progress" via its label.
            indeterminate && 'w-1/3 motion-safe:animate-[pulse_1.4s_ease-in-out_infinite]',
          )}
          style={indeterminate ? undefined : { width: `${clamped}%` }}
        />
      </div>

      {showValue && !indeterminate ? (
        <span className="shrink-0 text-xs tabular-nums text-text-secondary">{Math.round(clamped)}%</span>
      ) : null}
    </div>
  );
}

export { ProgressBar };
