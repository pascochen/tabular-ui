import { Tooltip as TooltipPrimitive } from '@base-ui/react/tooltip';
import type { ComponentProps } from 'react';

import { cn } from '../../../lib/utils';
import { popupSurface } from '../popupSurface';

/**
 * Shared delay and the grouping behaviour for every tooltip beneath it.
 *
 * **Mount this once at the app root.** `Tooltip.Root` takes no delay of its
 * own — Base UI reads it from this provider — so without it every tooltip
 * falls back to the library default and the 300ms decision below silently
 * does not apply. Storybook mounts it in `.storybook/preview.tsx`.
 */
function TooltipProvider({ delay = 300, ...props }: TooltipPrimitive.Provider.Props) {
  return <TooltipPrimitive.Provider data-slot="tooltip-provider" delay={delay} {...props} />;
}

function Tooltip({ ...props }: TooltipPrimitive.Root.Props) {
  return <TooltipPrimitive.Root data-slot="tooltip" {...props} />;
}

function TooltipTrigger({ ...props }: TooltipPrimitive.Trigger.Props) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

function TooltipContent({
  className,
  side = 'top',
  sideOffset = 4,
  align = 'center',
  alignOffset = 0,
  children,
  ...props
}: TooltipPrimitive.Popup.Props &
  Pick<TooltipPrimitive.Positioner.Props, 'align' | 'alignOffset' | 'side' | 'sideOffset'>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        className="isolate z-50"
      >
        <TooltipPrimitive.Popup
          data-slot="tooltip-content"
          className={cn(
            ...popupSurface,
            // NOT an inverted ground. shadcn ships bg-foreground/text-background;
            // §4 names tooltip under "Raised" and the spec wins on rules.
            'inline-flex w-fit max-w-xs items-center',
            // §7.4 --pad-popover for x. No vertical popover token exists, so
            // the primitive step is used explicitly: 11px/16px text at 4px
            // plus the 1px border renders 26px tall.
            'px-[var(--pad-popover)] py-1',
            'text-xs', // §8.1 --text-xs is help text
            'data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0',
            className,
          )}
          {...props}
        >
          {children}
        </TooltipPrimitive.Popup>
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  );
}

/**
 * Props for each part, so product code can wrap a part and pass the rest
 * through. Derived from the parts themselves, so they cannot drift.
 */
export type TooltipProps = ComponentProps<typeof Tooltip>;
export type TooltipContentProps = ComponentProps<typeof TooltipContent>;
export type TooltipProviderProps = ComponentProps<typeof TooltipProvider>;
export type TooltipTriggerProps = ComponentProps<typeof TooltipTrigger>;

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
