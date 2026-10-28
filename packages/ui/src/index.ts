/**
 * Public export surface. Everything the app consumes goes through here.
 *
 * Foundational primitives are listed first, then product composites.
 * A component that exists but is not exported here is invisible to the app.
 */

// Utilities
/**
 * `cn` is part of the contract, not an internal detail. Every component here
 * composes class strings, so a consumer building on them composes class
 * strings too — and plain string joining is unsafe against this system's
 * custom `--text-*` scale: tailwind-merge reads an unrecognised `text-*` as a
 * colour and silently drops the one it thinks lost. `src/lib/utils.ts` teaches
 * it the §8.1 sizes; a consumer that cannot reach it reimplements a weaker
 * joiner and inherits the bug this repo already has a failure-log entry for.
 */
export { cn } from './lib/utils';

/**
 * The colour mode. An app calls `useTheme()` once, in its root, and it owns
 * `data-theme` from then on: without it a page renders light, in a
 * dark-first system, with no error.
 */
export { resolveTheme, useTheme } from './lib/theme';
export type { ThemeMode, ThemePreference, UseThemeOptions } from './lib/theme';

// Foundational
export {
  Avatar,
  AvatarFallback,
  AvatarImage,
  type AvatarImageProps,
  type AvatarProps,
  type AvatarFallbackProps,
} from './components/foundational/Avatar';
export { Button, type ButtonProps } from './components/foundational/Button';
export { buttonVariants } from './components/foundational/Button/variants';
export {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxClear,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxSeparator,
  ComboboxTrigger,
  ComboboxValue,
  type ComboboxProps,
  type ComboboxChipProps,
  type ComboboxChipsProps,
  type ComboboxChipsInputProps,
  type ComboboxClearProps,
  type ComboboxCollectionProps,
  type ComboboxContentProps,
  type ComboboxEmptyProps,
  type ComboboxGroupProps,
  type ComboboxInputProps,
  type ComboboxItemProps,
  type ComboboxLabelProps,
  type ComboboxListProps,
  type ComboboxSeparatorProps,
  type ComboboxTriggerProps,
  type ComboboxValueProps,
} from './components/foundational/Combobox';
export { useComboboxFilter } from './components/foundational/Combobox/filter';
export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
  type DialogProps,
  type DialogCloseProps,
  type DialogContentProps,
  type DialogDescriptionProps,
  type DialogFooterProps,
  type DialogHeaderProps,
  type DialogOverlayProps,
  type DialogPortalProps,
  type DialogTitleProps,
  type DialogTriggerProps,
} from './components/foundational/Dialog';
export {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  type TabsProps,
  type TabsContentProps,
  type TabsListProps,
  type TabsTriggerProps,
} from './components/foundational/Tabs';
export { tabsListVariants } from './components/foundational/Tabs/variants';
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
  type MenuProps,
  type MenuCheckboxItemProps,
  type MenuContentProps,
  type MenuGroupProps,
  type MenuItemProps,
  type MenuLabelProps,
  type MenuPortalProps,
  type MenuRadioGroupProps,
  type MenuRadioItemProps,
  type MenuSeparatorProps,
  type MenuShortcutProps,
  type MenuSubProps,
  type MenuSubContentProps,
  type MenuSubTriggerProps,
  type MenuTriggerProps,
} from './components/foundational/Menu';
export {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
  type PopoverProps,
  type PopoverCloseProps,
  type PopoverContentProps,
  type PopoverDescriptionProps,
  type PopoverHeaderProps,
  type PopoverTitleProps,
  type PopoverTriggerProps,
} from './components/foundational/Popover';
export { Badge, type BadgeProps } from './components/foundational/Badge';
export {
  badgeTones,
  badgeVariants,
  type BadgeTone,
  type BadgeVariantOptions,
} from './components/foundational/Badge/variants';
export { Chip, type ChipProps } from './components/foundational/Chip';
export { chipVariants } from './components/foundational/Chip/variants';
export { Checkbox, type CheckboxProps } from './components/foundational/Checkbox';
export { checkboxVariants } from './components/foundational/Checkbox/variants';
export { Switch, type SwitchProps } from './components/foundational/Switch';
export { switchVariants } from './components/foundational/Switch/variants';
export { Input, type InputProps } from './components/foundational/Input';
export { Textarea, type TextareaProps } from './components/foundational/Textarea';
export { inputVariants } from './components/foundational/Input/variants';
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
  type SelectProps,
  type SelectContentProps,
  type SelectGroupProps,
  type SelectItemProps,
  type SelectLabelProps,
  type SelectScrollDownButtonProps,
  type SelectScrollUpButtonProps,
  type SelectSeparatorProps,
  type SelectTriggerProps,
  type SelectValueProps,
} from './components/foundational/Select';
export { IconButton, type IconButtonProps } from './components/foundational/IconButton';
export { iconButtonVariants } from './components/foundational/IconButton/variants';
export {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
  type MessageScrollerProps,
  type MessageScrollerButtonProps,
  type MessageScrollerContentProps,
  type MessageScrollerItemProps,
  type MessageScrollerProviderProps,
  type MessageScrollerViewportProps,
} from './components/foundational/MessageScroller';
export {
  useMessageScroller,
  useMessageScrollerScrollable,
  useMessageScrollerVisibility,
} from './components/foundational/MessageScroller/hooks';
export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  type TooltipProps,
  type TooltipContentProps,
  type TooltipProviderProps,
  type TooltipTriggerProps,
} from './components/foundational/Tooltip';
export { Spinner, type SpinnerProps } from './components/foundational/Spinner';

// Product
export { AccountMenu, type AccountMenuProps, type AccountUser } from './components/product/AccountMenu';
export {
  AppBar,
  AppBarNav,
  AppBarNavItem,
  type AppBarProps,
  type AppBarNavProps,
  type AppBarNavItemProps,
} from './components/product/AppBar';
export {
  AppShell,
  AppShellNav,
  AppShellNavGroup,
  AppShellNavItem,
  AppShellPageHeader,
  AppShellPanelBody,
  AppShellPanelFooter,
  AppShellPanelHeader,
  AppShellSidebarToggle,
  type AppShellProps,
  type AppShellNavProps,
  type AppShellNavGroupProps,
  type AppShellNavItemProps,
  type AppShellPageHeaderProps,
  type AppShellPanelBodyProps,
  type AppShellPanelFooterProps,
  type AppShellPanelHeaderProps,
  type AppShellSidebarToggleProps,
} from './components/product/AppShell';
export { useAppShell, type AppShellContentWidth, type AppShellState } from './components/product/AppShell/context';
export { AttachmentRow, type AttachmentRowProps } from './components/product/AttachmentRow';
export { fileTypeIcons, fallbackFileIcon, fileExtension } from './components/product/AttachmentRow/fileTypes';
export { CountBadge, type CountBadgeProps } from './components/product/CountBadge';
export { AgentBlock, type AgentBlockProps } from './components/product/AgentBlock';
export {
  AgentReasoning,
  type AgentReasoningProps,
  type AgentReasoningStatus,
} from './components/product/AgentReasoning';
export {
  AgentPlan,
  type AgentPlanProps,
  type AgentPlanStatus,
  type AgentPlanStep,
} from './components/product/AgentPlan';
export { Confirmation, type ConfirmationProps } from './components/product/Confirmation';
export {
  ChatThread,
  type ChatThreadProps,
  type ChatTurn,
  type ChatUserTurn,
  type ChatAssistantTurn,
} from './components/product/ChatThread';
export { ChatComposer, type ChatComposerHandle, type ChatComposerProps } from './components/product/ChatComposer';
export { ChatStarter, type ChatStarterProps } from './components/product/ChatStarter';
export { InlineCitation, type InlineCitationProps } from './components/product/InlineCitation';
export { Sources, type Source, type SourcesProps } from './components/product/Sources';
export { CodeView, type CodeViewProps } from './components/product/CodeView';
export {
  ContextSwitcher,
  ContextSwitcherLabel,
  type ContextAction,
  type ContextItem,
  type ContextSwitcherProps,
} from './components/product/ContextSwitcher';
export { DataTable, type DataTableProps } from './components/product/DataTable';
export { EmptyState, type EmptyStateProps } from './components/product/EmptyState';
export { Field, type FieldControlProps, type FieldProps } from './components/product/Field';
export { OrgSwitcher, type OrgSwitcherProps, type Org } from './components/product/OrgSwitcher';
export { ProjectSwitcher, type ProjectSwitcherProps, type Project } from './components/product/ProjectSwitcher';
export { FilterChip, type FilterChipProps } from './components/product/FilterChip';
export { LineageTree, type LineageTreeProps, type LineageNode } from './components/product/LineageTree';
export { ProgressBar, type ProgressBarProps, type ProgressBarTone } from './components/product/ProgressBar';
export { MetricTile, type MetricTileProps } from './components/product/MetricTile';
export { RunLogRow, type RunLogRowProps } from './components/product/RunLogRow';
export { StatusBadge, type StatusBadgeProps } from './components/product/StatusBadge';
export { TruncatedText, type TruncatedTextProps } from './components/product/TruncatedText';
export { Toolbar, ToolbarSpacer, ToolbarSeparator, type ToolbarProps } from './components/product/Toolbar';
export { runStatuses, runStatusRowTreatment, type RunStatus } from './components/product/StatusBadge/statuses';
