import { useRef, useState, type ComponentProps, type ReactNode } from 'react';

import { cn } from '../../../lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../foundational/Tooltip';
import { cutElement } from './cutText';

/**
 * One tooltip for the whole table, opened by whichever `TextCell` asked, and only
 * if that cell has cut something. Measured when it would open, so a table that
 * cuts nothing does no work for it. Never interactive, as `TruncatedText` isn't:
 * it repeats text that is in the DOM, and over a list it would catch the pointer.
 */
function CutTextTooltip({ children }: { children: ReactNode }) {
  const [text, setText] = useState('');
  const actions = useRef<NonNullable<ComponentProps<typeof Tooltip>['actionsRef']>['current']>(null);
  return (
    <Tooltip
      actionsRef={actions}
      disableHoverablePopup
      onOpenChange={(open, details) => {
        if (!open) return;
        const full = details.trigger && cutElement(details.trigger)?.textContent?.trim();
        if (full) {
          setText(full);
          return;
        }
        // Moving from a cut cell to one that fits asks this tooltip to open on the
        // new cell. Cancelling that alone leaves it open on the old one.
        details.cancel();
        actions.current?.close();
      }}
    >
      {children}
      <TooltipContent align="start" className="pointer-events-none">
        {text}
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * A cell that can cut its text. The `<td>` is the tooltip's trigger, so no element
 * joins the row: a `<div>` or `flex` element in a cell breaks a copied row into
 * lines, and `TruncatedText`'s inline `<span>` measures 0 here and never opens. The
 * ring is inset, because the cell clips (§4).
 */
function TextCell({ className, ...props }: ComponentProps<'td'>) {
  return (
    <TooltipTrigger
      render={
        <td
          data-text-cell=""
          className={cn(
            'focus-visible:outline-solid focus-visible:outline-[length:var(--ring-width)]',
            'focus-visible:outline-offset-[-2px] focus-visible:outline-ring',
            className,
          )}
          {...props}
        />
      }
    />
  );
}

export { CutTextTooltip, TextCell };
