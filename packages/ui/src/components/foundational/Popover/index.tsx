import { Popover as PopoverPrimitive } from '@base-ui/react/popover';
import type { ComponentProps } from 'react';

import { cn } from '../../../lib/utils';
import { popupSurface } from '../popupSurface';

/**
 * Popover — foundational.
 *
 * A raised container for content the user can interact with: a filter panel,
 * a small form, a detail card. Unlike `Tooltip` it can be focused and clicked
 * into, and unlike `Menu` its content is arbitrary rather than a list of
 * actions.
 *
 * Reach for it over `Tooltip` whenever the content matters: Base UI's tooltip
 * is visual only and its text is never announced. A Popover's content is real
 * DOM inside the accessibility tree.
 */
const Popover = PopoverPrimitive.Root;

function PopoverTrigger({ ...props }: PopoverPrimitive.Trigger.Props) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

function PopoverContent({
  className,
  align = 'center',
  alignOffset = 0,
  side = 'bottom',
  sideOffset = 4,
  ...props
}: PopoverPrimitive.Popup.Props &
  Pick<PopoverPrimitive.Positioner.Props, 'align' | 'alignOffset' | 'side' | 'sideOffset'>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        className="isolate z-50"
      >
        <PopoverPrimitive.Popup
          data-slot="popover-content"
          className={cn(
            ...popupSurface,
            // §7.4 --pad-popover. Width is a default, not a rule: a filter
            // panel and a detail card want different measures.
            'flex w-72 flex-col gap-[var(--gap-field)] p-[var(--pad-popover)] text-base',
            className,
          )}
          {...props}
        />
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  );
}

function PopoverHeader({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div data-slot="popover-header" className={cn('flex flex-col gap-[var(--gap-bonded)]', className)} {...props} />
  );
}

function PopoverTitle({ className, ...props }: PopoverPrimitive.Title.Props) {
  return (
    <PopoverPrimitive.Title
      data-slot="popover-title"
      className={cn('text-md font-medium text-text-primary', className)}
      {...props}
    />
  );
}

function PopoverDescription({ className, ...props }: PopoverPrimitive.Description.Props) {
  return (
    <PopoverPrimitive.Description
      data-slot="popover-description"
      className={cn('text-sm text-text-secondary', className)}
      {...props}
    />
  );
}

function PopoverClose({ ...props }: PopoverPrimitive.Close.Props) {
  return <PopoverPrimitive.Close data-slot="popover-close" {...props} />;
}

/**
 * Props for each part, so product code can wrap a part and pass the rest
 * through (`function ModelSelect(props: SelectProps<string>)`). Derived from
 * the parts themselves, so they cannot drift; the generic root keeps its
 * type parameters.
 */
export type PopoverProps<Payload = unknown> = PopoverPrimitive.Root.Props<Payload>;
export type PopoverCloseProps = ComponentProps<typeof PopoverClose>;
export type PopoverContentProps = ComponentProps<typeof PopoverContent>;
export type PopoverDescriptionProps = ComponentProps<typeof PopoverDescription>;
export type PopoverHeaderProps = ComponentProps<typeof PopoverHeader>;
export type PopoverTitleProps = ComponentProps<typeof PopoverTitle>;
export type PopoverTriggerProps = ComponentProps<typeof PopoverTrigger>;

export { Popover, PopoverClose, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger };
