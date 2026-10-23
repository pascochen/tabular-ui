import { Menu as MenuPrimitive } from '@base-ui/react/menu';
import { CaretRightIcon, CheckIcon, CircleIcon } from '@phosphor-icons/react';
import { createContext, useContext, type ComponentProps } from 'react';

import { cn } from '../../../lib/utils';
import { dangerVariant } from '../dangerVariant';
import { popupItem, popupLabel, popupList, popupSeparator, popupSpaced, popupSurface } from '../popupSurface';
import { switchThumbVariants, switchVariants } from '../Switch/variants';

/**
 * Menu — foundational.
 *
 * Named `Menu`, per `CLAUDE.md`'s inventory. shadcn files it under
 * `dropdown-menu`, but the primitive underneath is Base UI's `menu` and the
 * same component serves row actions, toolbar overflow and sort menus.
 *
 * Use for actions. For picking a value that stays visible, use `Select`.
 */
const Menu = MenuPrimitive.Root;
const MenuPortal = MenuPrimitive.Portal;
const MenuSub = MenuPrimitive.SubmenuRoot;

/**
 * `default` is the table rhythm: 28px rows, flush. `spaced` is for a menu
 * picked from the shell — 36px rows 4px apart, no shadow (§4). See
 * `popupSpaced`.
 *
 * Set once, on `MenuContent`; every part inside reads it from here,
 * submenus included. The provider sits on the content, which wraps the
 * items, so it reaches all of them; a provider on a sibling part such as the
 * trigger would reach none (failure log).
 */
export type MenuDensity = 'default' | 'spaced';
const MenuDensityContext = createContext<MenuDensity>('default');
const useSpaced = () => useContext(MenuDensityContext) === 'spaced';

function MenuTrigger({ ...props }: MenuPrimitive.Trigger.Props) {
  return <MenuPrimitive.Trigger data-slot="menu-trigger" {...props} />;
}

function MenuContent({
  className,
  align = 'start',
  alignOffset = 0,
  side = 'bottom',
  sideOffset = 4,
  density = 'default',
  ...props
}: MenuPrimitive.Popup.Props &
  Pick<MenuPrimitive.Positioner.Props, 'align' | 'alignOffset' | 'side' | 'sideOffset'> & {
    density?: MenuDensity;
  }) {
  return (
    <MenuDensityContext.Provider value={density}>
      <MenuPrimitive.Portal>
        <MenuPrimitive.Positioner
          align={align}
          alignOffset={alignOffset}
          side={side}
          sideOffset={sideOffset}
          className="isolate z-50"
        >
          <MenuPrimitive.Popup
            data-slot="menu-content"
            className={cn(
              ...popupSurface,
              'max-h-(--available-height) min-w-40 overflow-x-hidden overflow-y-auto',
              popupList,
              density === 'spaced' && popupSpaced.stack,
              className,
            )}
            {...props}
          />
        </MenuPrimitive.Positioner>
      </MenuPrimitive.Portal>
    </MenuDensityContext.Provider>
  );
}

function MenuGroup({ className, ...props }: MenuPrimitive.Group.Props) {
  const spaced = useSpaced();
  return <MenuPrimitive.Group className={cn(spaced && popupSpaced.stack, className)} {...props} />;
}

function MenuRadioGroup({ className, ...props }: MenuPrimitive.RadioGroup.Props) {
  const spaced = useSpaced();
  return <MenuPrimitive.RadioGroup className={cn(spaced && popupSpaced.stack, className)} {...props} />;
}

function MenuLabel({ className, ...props }: MenuPrimitive.GroupLabel.Props) {
  const spaced = useSpaced();
  return (
    <MenuPrimitive.GroupLabel
      data-slot="menu-label"
      className={cn(...popupLabel, spaced && popupSpaced.label, className)}
      {...props}
    />
  );
}

function MenuItem({
  className,
  variant: variantProp = 'default',
  ...props
}: MenuPrimitive.Item.Props & {
  /** `destructive` is the deprecated spelling of `danger` (renamed 2026-10-10), still honoured. */
  variant?: 'default' | 'danger' | 'destructive';
}) {
  const spaced = useSpaced();
  const variant = dangerVariant('MenuItem', variantProp);
  return (
    <MenuPrimitive.Item
      data-slot="menu-item"
      data-variant={variant}
      className={cn(
        ...popupItem,
        'text-base',
        spaced && popupSpaced.item,
        // Danger is the one item that carries a hue, and it stays a text
        // colour rather than a fill — a red row in every menu would compete
        // with genuine failure state in the data (§0 rule 1).
        variant === 'danger' && 'text-text-danger data-[highlighted]:bg-bg-danger',
        className,
      )}
      {...props}
    />
  );
}

function MenuSubTrigger({ className, children, ...props }: MenuPrimitive.SubmenuTrigger.Props) {
  const spaced = useSpaced();
  return (
    <MenuPrimitive.SubmenuTrigger
      data-slot="menu-sub-trigger"
      className={cn(...popupItem, 'text-base data-[popup-open]:bg-bg-hover', spaced && popupSpaced.item, className)}
      {...props}
    >
      {children}
      <CaretRightIcon weight="bold" aria-hidden="true" className="ml-auto text-text-secondary" />
    </MenuPrimitive.SubmenuTrigger>
  );
}

/** Takes its parent `MenuContent`'s density. */
function MenuSubContent({ className, ...props }: MenuPrimitive.Popup.Props) {
  const spaced = useSpaced();
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner className="isolate z-50" sideOffset={4}>
        <MenuPrimitive.Popup
          data-slot="menu-sub-content"
          className={cn(...popupSurface, 'min-w-40', popupList, spaced && popupSpaced.stack, className)}
          {...props}
        />
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  );
}

/**
 * `indicator="check"` (default) is a leading check, for choosing among items
 * — columns to show. `indicator="switch"` is a trailing switch, for a setting
 * that takes effect the moment it flips — dark mode — the same split
 * `Switch` and `Checkbox` draw outside menus.
 *
 * The switch is the indicator, not a `Switch`: it is the item that is
 * checkable (`role="menuitemcheckbox"`, `aria-checked`), so a real switch
 * inside it would be a second, nested control. It reuses `switchVariants`
 * so the two cannot drift, and is kept mounted so its track shows when off.
 */
function MenuCheckboxItem({
  className,
  children,
  indicator = 'check',
  ...props
}: MenuPrimitive.CheckboxItem.Props & { indicator?: 'check' | 'switch' }) {
  const spaced = useSpaced();
  if (indicator === 'switch') {
    return (
      <MenuPrimitive.CheckboxItem
        data-slot="menu-checkbox-item"
        data-indicator="switch"
        // Stays open: the point of a switch is seeing it flip.
        closeOnClick={false}
        className={cn(...popupItem, 'text-base', spaced && popupSpaced.item, className)}
        {...props}
      >
        {children}
        <MenuPrimitive.CheckboxItemIndicator
          keepMounted
          aria-hidden="true"
          className={cn(switchVariants(), 'pointer-events-none ml-auto')}
        >
          <span className={switchThumbVariants()} />
        </MenuPrimitive.CheckboxItemIndicator>
      </MenuPrimitive.CheckboxItem>
    );
  }
  return (
    <MenuPrimitive.CheckboxItem
      data-slot="menu-checkbox-item"
      className={cn(...popupItem, 'text-base', spaced && popupSpaced.item, className)}
      {...props}
    >
      <span className="flex w-[var(--size-icon-sm)] shrink-0 items-center justify-center">
        <MenuPrimitive.CheckboxItemIndicator>
          <CheckIcon weight="bold" aria-hidden="true" />
        </MenuPrimitive.CheckboxItemIndicator>
      </span>
      {children}
    </MenuPrimitive.CheckboxItem>
  );
}

function MenuRadioItem({ className, children, ...props }: MenuPrimitive.RadioItem.Props) {
  const spaced = useSpaced();
  return (
    <MenuPrimitive.RadioItem
      data-slot="menu-radio-item"
      className={cn(...popupItem, 'text-base', spaced && popupSpaced.item, className)}
      {...props}
    >
      <span className="flex w-[var(--size-icon-sm)] shrink-0 items-center justify-center">
        <MenuPrimitive.RadioItemIndicator>
          <CircleIcon weight="fill" aria-hidden="true" className="size-2!" />
        </MenuPrimitive.RadioItemIndicator>
      </span>
      {children}
    </MenuPrimitive.RadioItem>
  );
}

function MenuSeparator({ className, ...props }: MenuPrimitive.Separator.Props) {
  const spaced = useSpaced();
  return (
    <MenuPrimitive.Separator
      data-slot="menu-separator"
      className={cn(popupSeparator, spaced && popupSpaced.separator, className)}
      {...props}
    />
  );
}

/** A keyboard hint. Mono, one step below the item's sans (§8.3). */
function MenuShortcut({ className, ...props }: ComponentProps<'span'>) {
  return (
    <span
      data-slot="menu-shortcut"
      className={cn('ml-auto pl-[var(--gap-group)] font-mono text-sm text-text-secondary', className)}
      {...props}
    />
  );
}

/**
 * Props for each part, so product code can wrap a part and pass the rest
 * through (`function ModelSelect(props: SelectProps<string>)`). Derived from
 * the parts themselves, so they cannot drift; the generic root keeps its
 * type parameters.
 */
export type MenuProps<Payload = unknown> = MenuPrimitive.Root.Props<Payload>;
export type MenuCheckboxItemProps = ComponentProps<typeof MenuCheckboxItem>;
export type MenuContentProps = ComponentProps<typeof MenuContent>;
export type MenuGroupProps = ComponentProps<typeof MenuGroup>;
export type MenuItemProps = ComponentProps<typeof MenuItem>;
export type MenuLabelProps = ComponentProps<typeof MenuLabel>;
export type MenuPortalProps = ComponentProps<typeof MenuPortal>;
export type MenuRadioGroupProps = ComponentProps<typeof MenuRadioGroup>;
export type MenuRadioItemProps = ComponentProps<typeof MenuRadioItem>;
export type MenuSeparatorProps = ComponentProps<typeof MenuSeparator>;
export type MenuShortcutProps = ComponentProps<typeof MenuShortcut>;
export type MenuSubProps = ComponentProps<typeof MenuSub>;
export type MenuSubContentProps = ComponentProps<typeof MenuSubContent>;
export type MenuSubTriggerProps = ComponentProps<typeof MenuSubTrigger>;
export type MenuTriggerProps = ComponentProps<typeof MenuTrigger>;

export {
  Menu,
  MenuCheckboxItem,
  MenuContent,
  MenuGroup,
  MenuItem,
  MenuLabel,
  MenuPortal,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuShortcut,
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
  MenuTrigger,
};
