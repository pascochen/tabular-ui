import { cloneElement, isValidElement } from 'react';

import { cn } from '../../../lib/utils';
import { Chip } from '../../foundational/Chip';
import { Popover, PopoverContent, PopoverDescription, PopoverTitle, PopoverTrigger } from '../../foundational/Popover';
import type { Source } from '../Sources';

export type InlineCitationProps = {
  /** The source's figure in the answer's `Sources` list: its position, from 1. */
  number: number;
  /** The same object passed to `Sources`. */
  source: Source;
  /** Where in the source, e.g. "Rows 412 and 419". Says what the figure rests on, not just which file. */
  locator?: string;
  className?: string;
};

/**
 * InlineCitation — product. Composes `Chip` and `Popover`.
 *
 * Each figure names what it rests on, in the line where it appears. The mark
 * is the source's number in `Sources`; pressing it opens the source's name
 * (a link when it has an `href`) and where in it the figure comes from.
 *
 * **A Popover, never a Tooltip.** Base UI's tooltip is visual only, so a
 * source shown there would reach no screen reader (CLAUDE.md, failure log).
 * The popover's content is real DOM, focusable, and its link can be followed.
 *
 * **A `Chip`, because it is an interactive marker** (§7.7): border, transparent
 * ground, hover. Neutral, because a citation is not state (§0 rule 1). It sits
 * in a line of text, so the chip loses its vertical padding to stay inside a
 * `--text-sm` or `--text-base` line box.
 */
function InlineCitation({ number, source, locator, className }: InlineCitationProps) {
  const nameClassName = 'font-mono text-xs';
  return (
    <>
      {/*
        Its own no-break space, so the mark never wraps onto a line without
        the words it supports. A caller's ordinary space would let it.
      */}
      {'\u00A0'}
      <Popover>
        <PopoverTrigger
          data-slot="inline-citation"
          // Label in name (WCAG 2.5.3): the name holds the visible figure, and
          // says what it is, which a bare "1" doesn't.
          aria-label={`Source ${number}: ${source.name}`}
          render={
            <Chip
              size="sm"
              className={cn(
                // A 16px square for one or two digits: no taller than a --text-sm
                // line (16px), so a cited line keeps its height, and 2px each
                // side, so a figure doesn't sit in a wide box. No token names an
                // inline mark's size; the primitive steps are the fallback (§7.4).
                'h-4 min-w-4 justify-center px-0.5 py-0 align-baseline tabular-nums',
                className,
              )}
            />
          }
        >
          {number}
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto max-w-[var(--w-panel)]">
          <PopoverTitle className="flex items-baseline gap-[var(--gap-inline)] text-sm font-normal">
            <span className="shrink-0 tabular-nums text-text-secondary">{number}</span>
            {isValidElement(source.render) ? (
              cloneElement(
                source.render,
                { className: cn(nameClassName, linkClassName, 'min-w-0 break-all', source.render.props.className) },
                source.name,
              )
            ) : source.href ? (
              <a href={source.href} className={cn(nameClassName, linkClassName, 'min-w-0 break-all')}>
                {source.name}
              </a>
            ) : (
              <span className={cn(nameClassName, 'min-w-0 break-all text-text-body')}>{source.name}</span>
            )}
          </PopoverTitle>
          {locator ? <PopoverDescription className="tabular-nums">{locator}</PopoverDescription> : null}
        </PopoverContent>
      </Popover>
    </>
  );
}

// AttachmentRow's link: the interactive role, underlined on hover, offset ring.
const linkClassName = cn(
  'text-text-interactive hover:underline',
  'rounded-xs outline-none focus-visible:outline-ring',
  'focus-visible:outline-solid focus-visible:outline-[length:var(--ring-width)]',
  'focus-visible:outline-offset-[var(--ring-offset)]',
);

export { InlineCitation };
