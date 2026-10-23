import { IconContext, type IconWeight } from '@phosphor-icons/react';
import { useContext, type ComponentProps } from 'react';

import { cn } from '../../../lib/utils';

export type SpinnerProps = Omit<ComponentProps<'svg'>, 'children'> & {
  /** Stroke weight on Phosphor's scale. Defaults to the surrounding `IconContext`, else `bold` (§11.2). */
  weight?: IconWeight;
};

// Phosphor's strokes on its 256 grid (8 / 12 / 16 / 24), scaled to 16 units.
// fill and duotone have no outline form; they draw at bold.
const strokeWidth: Record<IconWeight, number> = {
  thin: 0.5,
  light: 0.75,
  regular: 1,
  bold: 1.5,
  fill: 1.5,
  duotone: 1.5,
};

// Same area as CircleNotch's 12-unit circle: side = r√π (§11.5).
const side = 10.5;
const origin = (16 - side) / 2;

// The segment is 75 of a 100-unit perimeter. An offset of 12.5 centres it on
// the top-right corner: the still frame, and frame 0 of the lap.
const keyframes = '@keyframes tui-spinner { from { stroke-dashoffset: 12.5; } to { stroke-dashoffset: -87.5; } }';

/**
 * Spinner — foundational. Added 2026-10-20 (approved).
 *
 * The working indicator: a square tracer, three quarters of a square outline
 * with the gap travelling clockwise at constant speed (§11.5). shadcn's
 * `Spinner` API, an `<svg>` with `data-slot="spinner"`, written from source
 * because the glyph is ours. It is the one mark drawn outside Phosphor
 * (§11.1), and it is drawn here only.
 *
 * Sized and coloured like a Phosphor icon: `1em`, `currentColor`, so it
 * takes its label's size and colour wherever it sits. Under reduced motion it
 * stands still on the frame above.
 *
 * Decorative by default: the label beside it says what is working. Given an
 * `aria-label`, it becomes `role="status"`, for a place with no visible label.
 */
function Spinner({ weight, className, ...props }: SpinnerProps) {
  // Phosphor's own context default is `regular`, which a bare Spinner would
  // otherwise inherit, under §11.2's bold floor. Read it as unset. A provider
  // that sets anything else wins (Button's `light` when disabled), and an
  // explicit prop wins over both.
  const context = useContext(IconContext).weight;
  const resolved = weight ?? (context && context !== 'regular' ? context : 'bold');
  const labelled = props['aria-label'] !== undefined;
  return (
    <>
      {/* React hoists this to <head> once, however many spinners mount, so
          the animation travels with the import graph: a consuming app needs
          no stylesheet of ours for it. */}
      <style href="tui-spinner" precedence="default">
        {keyframes}
      </style>
      <svg
        data-slot="spinner"
        viewBox="0 0 16 16"
        width="1em"
        height="1em"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth[resolved]}
        role={labelled ? 'status' : undefined}
        aria-hidden={labelled ? undefined : true}
        className={cn('shrink-0', className)}
        {...props}
      >
        <rect
          x={origin}
          y={origin}
          width={side}
          height={side}
          pathLength={100}
          strokeDasharray="75 25"
          strokeDashoffset={12.5}
          className="motion-safe:animate-[tui-spinner_1.2s_linear_infinite]"
        />
      </svg>
    </>
  );
}

export { Spinner };
