import { cva } from 'class-variance-authority';

/**
 * Separate module so index.tsx exports only components — react-refresh
 * disables fast refresh for any file mixing component and non-component
 * exports.
 */
export const tabsListVariants = cva(
  [
    'group/tabs-list inline-flex w-fit items-center',
    'group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col',
  ],
  {
    variants: {
      variant: {
        // A 1px rule the active indicator sits on, so inactive tabs need no
        // ground of their own — §0 rule 7, borders do the work.
        line: [
          'gap-[var(--gap-group)] border-border',
          'group-data-horizontal/tabs:w-full group-data-horizontal/tabs:border-b',
          'group-data-vertical/tabs:border-r',
        ],
        segmented: [
          // 2px inset. Track and tab are both square since 2026-10-16 (§7.7);
          // at 6px and 4px the inset kept their corners concentric.
          'gap-[var(--gap-chip)] rounded-md bg-bg-hover p-[2px]',
          'group-data-horizontal/tabs:h-[var(--h-control)]',
        ],
      },
    },
    defaultVariants: { variant: 'line' },
  },
);
