import { useEffect, useLayoutEffect, useRef, useState, type ComponentProps } from 'react';

import { cn } from '../../../lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../foundational/Tooltip';

type TooltipContentProps = ComponentProps<typeof TooltipContent>;

export type TruncatedTextProps = {
  /**
   * The text. A plain string, because the tooltip repeats it: rich content
   * would have to be rendered twice, and the copy would drift from the
   * original.
   */
  children: string;
  /** Where the tooltip opens. Tooltip's default, `top`, unless given. */
  side?: TooltipContentProps['side'];
  /** Distance from the text to the tooltip, in px. Tooltip's 4px unless given. */
  sideOffset?: TooltipContentProps['sideOffset'];
  /**
   * Also show the tooltip while the control the text sits in has keyboard
   * focus. For a label inside a `Button`: the text never takes focus itself,
   * so without this a keyboard user never sees what was cut off. Escape
   * closes it.
   */
  showOnControlFocus?: boolean;
  className?: string;
};

/**
 * TruncatedText — product. Composes `Tooltip`.
 *
 * One line of text that truncates with an ellipsis, and shows the full text
 * in a tooltip **only when it is actually cut off**. An untruncated label
 * repeated in a tooltip is noise.
 *
 * The full text stays in the DOM, so assistive technology reads it whole and
 * the tooltip carries nothing that exists only there (Base UI's tooltip is
 * visual only; see `Tooltip/README.md`).
 *
 * Renders a `<span>`. Inside a flex parent it needs room to shrink: it
 * carries `min-w-0`, and the parent needs a bounded width. `truncate` on a
 * flex container itself clips with no ellipsis, which is why this is an
 * element of its own.
 */
function TruncatedText({ children, side, sideOffset, showOnControlFocus = false, className }: TruncatedTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [truncated, setTruncated] = useState(false);
  const [hoverOpen, setHoverOpen] = useState(false);
  const [focusOpen, setFocusOpen] = useState(false);

  // Re-measure when the box resizes (a sidebar collapsing, a panel opening)
  // and when the text changes inside a box that keeps its size.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setTruncated(el.scrollWidth > el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [children]);

  // Keyboard focus on the surrounding control opens it, pointer focus does
  // not: a click already shows the hover tooltip, or doesn't need one.
  useEffect(() => {
    const control = showOnControlFocus ? ref.current?.closest<HTMLElement>('button, a[href], [tabindex]') : null;
    if (!control) return;
    const onFocus = () => setFocusOpen(control.matches(':focus-visible'));
    const onBlur = () => setFocusOpen(false);
    control.addEventListener('focus', onFocus);
    control.addEventListener('blur', onBlur);
    return () => {
      control.removeEventListener('focus', onFocus);
      control.removeEventListener('blur', onBlur);
    };
  }, [showOnControlFocus]);

  // Controlled only when asked, so every other use keeps Base UI's own state.
  const controlled = showOnControlFocus
    ? {
        open: truncated && (hoverOpen || focusOpen),
        onOpenChange: (open: boolean) => {
          setHoverOpen(open);
          if (!open) setFocusOpen(false);
        },
      }
    : {};

  // Never interactive. The tooltip only repeats text that is already in the
  // DOM, so there is nothing in it to reach. A hoverable popup (Base UI's
  // default) would catch a pointer moving across it, and where the tooltip
  // sits over a list, keep the row beneath from highlighting.
  return (
    <Tooltip disabled={!truncated} disableHoverablePopup {...controlled}>
      <TooltipTrigger
        render={<span ref={ref} data-slot="truncated-text" className={cn('min-w-0 truncate', className)} />}
      >
        {children}
      </TooltipTrigger>
      <TooltipContent side={side} sideOffset={sideOffset} className="pointer-events-none">
        {children}
      </TooltipContent>
    </Tooltip>
  );
}

export { TruncatedText };
