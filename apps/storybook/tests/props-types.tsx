/* eslint-disable react-refresh/only-export-components -- a type-check fixture: never bundled or rendered, so fast refresh doesn't apply. */

/**
 * Compile-time checks for the compound components' props types (readiness
 * review: wrapping a part was awkward because none was exported). Nothing
 * here runs. `tsc -b` type-checks it through tsconfig.tooling.json, so the
 * build fails if a type goes missing from the package, or a generic root
 * loses its type parameters.
 */
import type * as tui from '../../../packages/ui/src';
import { Dialog, DialogContent, MenuItem, Select, Tabs, TabsTrigger } from '../../../packages/ui/src';

/** Every part of the nine compound components has a props type on the package. */
export type EveryPartHasAPropsType = [
  tui.SelectProps<string>,
  tui.SelectContentProps,
  tui.SelectGroupProps,
  tui.SelectItemProps,
  tui.SelectLabelProps,
  tui.SelectScrollDownButtonProps,
  tui.SelectScrollUpButtonProps,
  tui.SelectSeparatorProps,
  tui.SelectTriggerProps,
  tui.SelectValueProps,
  tui.DialogProps,
  tui.DialogCloseProps,
  tui.DialogContentProps,
  tui.DialogDescriptionProps,
  tui.DialogFooterProps,
  tui.DialogHeaderProps,
  tui.DialogOverlayProps,
  tui.DialogPortalProps,
  tui.DialogTitleProps,
  tui.DialogTriggerProps,
  tui.MenuProps,
  tui.MenuCheckboxItemProps,
  tui.MenuContentProps,
  tui.MenuGroupProps,
  tui.MenuItemProps,
  tui.MenuLabelProps,
  tui.MenuPortalProps,
  tui.MenuRadioGroupProps,
  tui.MenuRadioItemProps,
  tui.MenuSeparatorProps,
  tui.MenuShortcutProps,
  tui.MenuSubProps,
  tui.MenuSubContentProps,
  tui.MenuSubTriggerProps,
  tui.MenuTriggerProps,
  tui.PopoverProps,
  tui.PopoverCloseProps,
  tui.PopoverContentProps,
  tui.PopoverDescriptionProps,
  tui.PopoverHeaderProps,
  tui.PopoverTitleProps,
  tui.PopoverTriggerProps,
  tui.TabsProps,
  tui.TabsContentProps,
  tui.TabsListProps,
  tui.TabsTriggerProps,
  tui.TooltipProps,
  tui.TooltipContentProps,
  tui.TooltipProviderProps,
  tui.TooltipTriggerProps,
  tui.MessageScrollerProps,
  tui.MessageScrollerButtonProps,
  tui.MessageScrollerContentProps,
  tui.MessageScrollerItemProps,
  tui.MessageScrollerProviderProps,
  tui.MessageScrollerViewportProps,
  tui.ComboboxProps<string>,
  tui.ComboboxChipProps,
  tui.ComboboxChipsProps,
  tui.ComboboxChipsInputProps,
  tui.ComboboxClearProps,
  tui.ComboboxCollectionProps,
  tui.ComboboxContentProps,
  tui.ComboboxEmptyProps,
  tui.ComboboxGroupProps,
  tui.ComboboxInputProps,
  tui.ComboboxItemProps,
  tui.ComboboxLabelProps,
  tui.ComboboxListProps,
  tui.ComboboxSeparatorProps,
  tui.ComboboxTriggerProps,
  tui.ComboboxValueProps,
  tui.AvatarProps,
  tui.AvatarImageProps,
  tui.AvatarFallbackProps,
];

/** The generic roots keep their value type: a model name is a string, not `unknown`. */
export const onModel: tui.SelectProps<string>['onValueChange'] = (value) => {
  const model: string | null = value;
  void model;
};
// @ts-expect-error a number is not a model name
export const notAModel: tui.SelectProps<string>['value'] = 42;
export const manyModels: tui.SelectProps<string, true>['value'] = ['fct_gl_entries', 'dim_accounts'];

/** What the types are for: a product wrapper that fixes a prop and passes the rest through. */
export function ModelSelect(props: Omit<tui.SelectProps<string>, 'content'>) {
  return <Select {...props} content="mono" />;
}

export function DangerItem(props: Omit<tui.MenuItemProps, 'variant'>) {
  return <MenuItem {...props} variant="danger" />;
}

export function ConfirmDialog({ children, ...props }: tui.DialogProps & Pick<tui.DialogContentProps, 'children'>) {
  return (
    <Dialog {...props}>
      <DialogContent>{children}</DialogContent>
    </Dialog>
  );
}

export function RunTabs({ tabs, ...props }: tui.TabsProps & { tabs: tui.TabsTriggerProps[] }) {
  return (
    <Tabs {...props}>
      {tabs.map((tab) => (
        <TabsTrigger key={String(tab.value)} {...tab} />
      ))}
    </Tabs>
  );
}

/** Menu keeps its payload type parameter. */
export const menuWithPayload: tui.MenuProps<{ runId: string }> = {};
