import { useLayoutEffect, useRef, type ComponentProps, type CSSProperties } from 'react';

import { cn } from '../../../lib/utils';
import { controlBase } from '../controlBase';

export type TextareaProps = Omit<ComponentProps<'textarea'>, 'rows'> & {
  /** Lines shown when empty. The field never gets shorter. Default 3. */
  minRows?: number;
  /** Lines it grows to before it scrolls. Omit to let it grow with its text. */
  maxRows?: number;
  /**
   * `default` is a field in its own right, the same box as `Input`.
   * `borderless` is a field inside a container that draws the box: no border,
   * no padding, and no focus ring or disabled fade of its own. The container
   * must draw all four, or the field has no visible focus (§4). `ChatComposer`
   * is the worked example.
   */
  variant?: 'default' | 'borderless';
};

/** Marks which edges hide text, for the scroll cue. Same attributes Base UI sets on Combobox's list. */
function markOverflow(el: HTMLTextAreaElement) {
  el.toggleAttribute('data-overflow-y-start', el.scrollTop > 0);
  el.toggleAttribute('data-overflow-y-end', Math.ceil(el.scrollTop + el.clientHeight) < el.scrollHeight);
}

/**
 * Textarea — foundational. Added 2026-10-13 (approved).
 *
 * A native `<textarea>`: Base UI has no textarea part, and the browser's is
 * already complete. Our work is the token layer, matched to `Input` so a
 * one-line textarea and an input are the same box.
 *
 * It grows with its text (`field-sizing: content`) between `minRows` and
 * `maxRows`, then scrolls. Heights derive from the control height rather than
 * restating it: the vertical padding is whatever puts one line at exactly
 * `--h-control`, so N lines are `--h-control` plus N−1 line-heights.
 *
 * A label is the caller's responsibility, as for `Input`: wrap in `Field` or
 * pair with a `<label htmlFor>`.
 */
function Textarea({
  className,
  minRows = 3,
  maxRows,
  variant = 'default',
  style,
  onScroll,
  onInput,
  ref,
  ...props
}: TextareaProps) {
  const own = useRef<HTMLTextAreaElement>(null);
  const borderless = variant === 'borderless';

  // A value set from outside (cleared after sending, a restored draft) fires
  // no input event, so re-measure whenever it changes.
  useLayoutEffect(() => {
    if (own.current) markOverflow(own.current);
  }, [props.value]);

  return (
    <textarea
      data-slot="textarea"
      data-variant={variant}
      ref={(el) => {
        own.current = el;
        if (typeof ref === 'function') ref(el);
        else if (ref) ref.current = el;
      }}
      // Where field-sizing is unsupported, `rows` keeps the field at its
      // minimum and it scrolls instead of growing.
      rows={minRows}
      onScroll={(event) => {
        markOverflow(event.currentTarget);
        onScroll?.(event);
      }}
      onInput={(event) => {
        markOverflow(event.currentTarget);
        onInput?.(event);
      }}
      className={cn(
        ...controlBase,
        'block w-full min-w-0 resize-none field-sizing-content [scrollbar-width:thin]',
        'bg-transparent font-sans text-base text-text-body',
        'placeholder:text-text-tertiary',
        'disabled:cursor-not-allowed',
        borderless
          ? [
              // The container draws the box, the ring and the disabled fade.
              'rounded-none border-0 p-0 focus-visible:outline-none disabled:opacity-100',
              'min-h-[calc(var(--textarea-min-rows)*1lh)]',
              maxRows !== undefined && 'max-h-[calc(var(--textarea-max-rows)*1lh)]',
              // Scroll cue (§4): the line at a hiding edge fades out, so
              // overflow reads as "more" instead of a line cut through its
              // glyphs. A mask, as on Combobox's list: there is no border
              // here for it to fade too.
              'data-[overflow-y-start]:mask-t-from-[calc(100%-1lh)]',
              'data-[overflow-y-end]:mask-b-from-[calc(100%-1lh)]',
            ]
          : [
              // Same ground, border and states as Input (§0 rule 7, §3, §5).
              'border border-border aria-invalid:border-border-danger',
              // One line plus this padding plus the 1px borders is --h-control.
              'px-[var(--pad-control-x)] py-[calc((var(--h-control)-1lh-2px)/2)]',
              'min-h-[calc(var(--h-control)+(var(--textarea-min-rows)-1)*1lh)]',
              maxRows !== undefined && 'max-h-[calc(var(--h-control)+(var(--textarea-max-rows)-1)*1lh)]',
            ],
        className,
      )}
      style={
        {
          '--textarea-min-rows': minRows,
          ...(maxRows !== undefined && { '--textarea-max-rows': maxRows }),
          ...style,
        } as CSSProperties
      }
      {...props}
    />
  );
}

export { Textarea };
