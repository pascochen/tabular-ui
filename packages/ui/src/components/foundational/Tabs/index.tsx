import { Tabs as TabsPrimitive } from '@base-ui/react/tabs';
import { IconContext } from '@phosphor-icons/react';
import type { VariantProps } from 'class-variance-authority';
import { useContext, type ComponentProps } from 'react';

import { cn } from '../../../lib/utils';
import { controlBase } from '../controlBase';
import { tabsListVariants } from './variants';

/**
 * Tabs — foundational.
 *
 * `line` is the default: §7.8 reserves the 2px border width for exactly three
 * things, and "active tab indicator" is one of them. `segmented` stays
 * available for switching view modes, where the tabs read as a control rather
 * than as navigation.
 */
function Tabs({ className, orientation = 'horizontal', ...props }: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      // Base UI needs the prop, not just the attribute: it sets the arrow
      // keys and aria-orientation from it. Without it a vertical strip was
      // laid out vertically and driven by Left/Right.
      orientation={orientation}
      data-orientation={orientation}
      className={cn('group/tabs flex gap-[var(--gap-group)] data-horizontal:flex-col', className)}
      {...props}
    />
  );
}

function TabsList({
  className,
  variant = 'line',
  ...props
}: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  );
}

/**
 * §11.2's state table, applied here so call sites cannot drift: a disabled
 * tab's icon draws `light`, the selected tab's `fill` (solid vs outline is
 * the state signal, a shape change rather than a stroke change), and every
 * other tab's `bold`, the ≤16px floor. Disabled wins when both apply. An
 * explicit `weight` on the icon still wins over all three.
 */
const iconWeight = ({ active, disabled }: TabsPrimitive.Tab.State) => (disabled ? 'light' : active ? 'fill' : 'bold');

/**
 * The tab's state lives in Base UI, so the icon weight is set from its
 * `render` callback, which receives that state. TabsTrigger owns `render`
 * for this reason; nothing in the codebase passed its own.
 */
function TabsTrigger({ className, ...props }: Omit<TabsPrimitive.Tab.Props, 'render'>) {
  const iconContext = useContext(IconContext);
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      render={({ children, ...triggerProps }, state) => (
        <button {...triggerProps}>
          <IconContext.Provider value={{ ...iconContext, weight: iconWeight(state) }}>{children}</IconContext.Provider>
        </button>
      )}
      className={cn(
        ...controlBase,
        'relative inline-flex select-none items-center justify-center whitespace-nowrap',
        'gap-[var(--gap-control-icon)] px-[var(--pad-control-x)]',
        'h-[var(--h-control)] text-base font-medium',
        // Inactive is secondary; active is the strongest text step. Colour is
        // not doing the work alone here — the indicator carries it too.
        // Base UI marks the active tab with data-active, NOT data-selected
        // (which is what Select items use). Wrong attribute = dead rule.
        // The BRACKETED data-[active] form matters too: Tailwind's data-active
        // shorthand compiles inside :where(), which has zero specificity, so it
        // ties with this base colour and loses on source order.
        'text-text-secondary hover:text-text-body',
        'data-[active]:text-text-primary',
        '[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-[var(--size-icon-sm)]',

        // §7.8 — the 2px active indicator. Interactive role, because §1 puts
        // "active nav item" there. Rendered on ::after so it overlaps the
        // list's 1px rule rather than displacing it.
        "after:pointer-events-none after:absolute after:bg-fill-interactive after:opacity-0 after:content-['']",
        'group-data-[variant=line]/tabs-list:data-[active]:after:opacity-100',
        'group-data-horizontal/tabs:after:inset-x-0 group-data-horizontal/tabs:after:-bottom-px',
        'group-data-horizontal/tabs:after:h-[var(--border-width-2)]',
        'group-data-vertical/tabs:after:inset-y-0 group-data-vertical/tabs:after:-right-px',
        'group-data-vertical/tabs:after:w-[var(--border-width-2)]',
        'group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start',

        // Segmented: the active tab lifts onto a surface instead.
        'group-data-[variant=segmented]/tabs-list:h-full',
        'group-data-[variant=segmented]/tabs-list:rounded-sm',
        'group-data-[variant=segmented]/tabs-list:data-[active]:bg-surface-raised',
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn('flex-1 text-base outline-none', className)}
      {...props}
    />
  );
}

/**
 * Props for each part, so product code can wrap a part and pass the rest
 * through. Derived from the parts themselves, so they cannot drift.
 */
export type TabsProps = ComponentProps<typeof Tabs>;
export type TabsContentProps = ComponentProps<typeof TabsContent>;
export type TabsListProps = ComponentProps<typeof TabsList>;
export type TabsTriggerProps = ComponentProps<typeof TabsTrigger>;

export { Tabs, TabsContent, TabsList, TabsTrigger };
