import { Select as SelectPrimitive } from '@base-ui/react/select';
import { CaretDownIcon, CaretUpIcon, CheckIcon } from '@phosphor-icons/react';
import type { VariantProps } from 'class-variance-authority';
import { createContext, useContext, type ComponentProps } from 'react';

import { cn } from '../../../lib/utils';
import { popupLabel, popupList, popupSeparator, popupSurface } from '../popupSurface';
import { selectItemVariants, selectTriggerVariants } from './variants';

type SelectContent = 'text' | 'mono';

/**
 * Carries `content` to the trigger AND the items so a value does not change
 * face between the open list and the closed control.
 *
 * It lives on the ROOT, not on the trigger: `SelectContent` and `SelectItem`
 * are siblings of `SelectTrigger`, not descendants, so a provider on the
 * trigger reaches nothing. `content` describes what the whole control holds
 * anyway, not how one part of it looks.
 */
const SelectContentContext = createContext<SelectContent>('text');

function Select<Value, Multiple extends boolean | undefined = false>({
  content = 'text',
  children,
  ...props
}: SelectProps<Value, Multiple>) {
  return (
    <SelectContentContext.Provider value={content}>
      <SelectPrimitive.Root {...props}>{children}</SelectPrimitive.Root>
    </SelectContentContext.Provider>
  );
}

function SelectGroup({ className, ...props }: SelectPrimitive.Group.Props) {
  return <SelectPrimitive.Group data-slot="select-group" className={cn('scroll-my-1', className)} {...props} />;
}

function SelectValue({ className, ...props }: SelectPrimitive.Value.Props) {
  return (
    <SelectPrimitive.Value
      data-slot="select-value"
      className={cn('flex flex-1 truncate text-left', className)}
      {...props}
    />
  );
}

function SelectTrigger({
  className,
  content,
  size = 'default',
  children,
  ...props
}: SelectPrimitive.Trigger.Props & VariantProps<typeof selectTriggerVariants>) {
  const inherited = useContext(SelectContentContext);
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      className={cn(selectTriggerVariants({ content: content ?? inherited, size }), className)}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon
        render={
          // ≤16px, so `bold` per §11.2. Secondary because the caret is
          // structure, not state (§0 rule 1).
          <CaretDownIcon weight="bold" className="size-[var(--size-icon-sm)] text-text-secondary" aria-hidden="true" />
        }
      />
    </SelectPrimitive.Trigger>
  );
}

function SelectContent({
  className,
  children,
  side = 'bottom',
  sideOffset = 4,
  align = 'center',
  alignOffset = 0,
  alignItemWithTrigger = true,
  ...props
}: SelectPrimitive.Popup.Props &
  Pick<SelectPrimitive.Positioner.Props, 'align' | 'alignOffset' | 'side' | 'sideOffset' | 'alignItemWithTrigger'>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        alignItemWithTrigger={alignItemWithTrigger}
        className="isolate z-50"
      >
        <SelectPrimitive.Popup
          data-slot="select-content"
          data-align-trigger={alignItemWithTrigger}
          className={cn(
            ...popupSurface,
            'relative isolate max-h-(--available-height) w-(--anchor-width) min-w-32',
            'overflow-x-hidden overflow-y-auto',
            popupList,
            'data-[align-trigger=true]:animate-none',
            className,
          )}
          {...props}
        >
          <SelectScrollUpButton />
          <SelectPrimitive.List>{children}</SelectPrimitive.List>
          <SelectScrollDownButton />
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  );
}

function SelectLabel({ className, ...props }: SelectPrimitive.GroupLabel.Props) {
  return <SelectPrimitive.GroupLabel data-slot="select-label" className={cn(...popupLabel, className)} {...props} />;
}

function SelectItem({
  className,
  content,
  children,
  ...props
}: SelectPrimitive.Item.Props & VariantProps<typeof selectItemVariants>) {
  const inherited = useContext(SelectContentContext);
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(selectItemVariants({ content: content ?? inherited }), className)}
      {...props}
    >
      <SelectPrimitive.ItemText className="flex flex-1 shrink-0 truncate">{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator render={<span className="pointer-events-none flex items-center justify-center" />}>
        <CheckIcon weight="bold" aria-hidden="true" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}

function SelectSeparator({ className, ...props }: SelectPrimitive.Separator.Props) {
  return (
    <SelectPrimitive.Separator data-slot="select-separator" className={cn(popupSeparator, className)} {...props} />
  );
}

function SelectScrollUpButton({ className, ...props }: SelectPrimitive.ScrollUpArrow.Props) {
  return (
    <SelectPrimitive.ScrollUpArrow
      data-slot="select-scroll-up-button"
      className={cn(
        'top-0 z-10 flex w-full cursor-default items-center justify-center',
        // A 24px dense row (--h-row-xs), icon centred: on the 4px grid like
        // the rows it scrolls, not the 2px chip gap it borrowed until 2026-10-08.
        'h-[var(--h-row-xs)] bg-surface-raised text-text-secondary',
        '[&_svg]:size-[var(--size-icon-sm)]',
        className,
      )}
      {...props}
    >
      <CaretUpIcon weight="bold" aria-hidden="true" />
    </SelectPrimitive.ScrollUpArrow>
  );
}

function SelectScrollDownButton({ className, ...props }: SelectPrimitive.ScrollDownArrow.Props) {
  return (
    <SelectPrimitive.ScrollDownArrow
      data-slot="select-scroll-down-button"
      className={cn(
        'bottom-0 z-10 flex w-full cursor-default items-center justify-center',
        // A 24px dense row (--h-row-xs), icon centred: on the 4px grid like
        // the rows it scrolls, not the 2px chip gap it borrowed until 2026-10-08.
        'h-[var(--h-row-xs)] bg-surface-raised text-text-secondary',
        '[&_svg]:size-[var(--size-icon-sm)]',
        className,
      )}
      {...props}
    >
      <CaretDownIcon weight="bold" aria-hidden="true" />
    </SelectPrimitive.ScrollDownArrow>
  );
}

/**
 * Props for each part, so product code can wrap a part and pass the rest
 * through (`function ModelSelect(props: SelectProps<string>)`). Derived from
 * the parts themselves, so they cannot drift; the generic root keeps its
 * type parameters.
 */
export type SelectProps<Value, Multiple extends boolean | undefined = false> = SelectPrimitive.Root.Props<
  Value,
  Multiple
> & {
  /** `mono` sets the trigger and items in the code face (§8.3). */
  content?: SelectContent;
};
export type SelectContentProps = ComponentProps<typeof SelectContent>;
export type SelectGroupProps = ComponentProps<typeof SelectGroup>;
export type SelectItemProps = ComponentProps<typeof SelectItem>;
export type SelectLabelProps = ComponentProps<typeof SelectLabel>;
export type SelectScrollDownButtonProps = ComponentProps<typeof SelectScrollDownButton>;
export type SelectScrollUpButtonProps = ComponentProps<typeof SelectScrollUpButton>;
export type SelectSeparatorProps = ComponentProps<typeof SelectSeparator>;
export type SelectTriggerProps = ComponentProps<typeof SelectTrigger>;
export type SelectValueProps = ComponentProps<typeof SelectValue>;

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
