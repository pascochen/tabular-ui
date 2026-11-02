import { cva } from 'class-variance-authority';

import { controlBase, controlOverlay } from '../controlBase';

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
        // Each item draws all four sides (`tabVariants`), and every one after
        // the first pulls back over its neighbour, so two borders read as one
        // line. The list does this rather than the item because it holds for
        // any direct child: a trigger here, an <li> around a link elsewhere.
        bordered: [
          '[&>*+*]:-ml-px',
          'group-data-vertical/tabs:items-stretch',
          'group-data-vertical/tabs:[&>*+*]:ml-0 group-data-vertical/tabs:[&>*+*]:-mt-px',
        ],
      },
    },
    defaultVariants: { variant: 'line' },
  },
);

/**
 * The bordered tab's appearance (docs/site.md D12), on its own so that a real
 * link can wear it: `TabsTrigger` renders a <button>, which is wrong for a nav
 * that changes the page, and does nothing before hydration. Same reasoning as
 * `buttonVariants` on AppBar's links. Pass the result through `cn()`: it
 * resolves the ring offset below against controlBase's.
 *
 * `line` and `segmented` don't use this. Their triggers are styled in
 * index.tsx, against the list's `data-variant`.
 */
export const tabVariants = cva(
  [
    ...controlBase,
    ...controlOverlay,
    'relative inline-flex select-none items-center justify-center whitespace-nowrap',
    'gap-[var(--gap-control-icon)] px-[var(--pad-control-x)]',
    'border border-border font-semibold text-text-body',
    '[&_svg]:pointer-events-none [&_svg]:shrink-0',

    // Inset by the ring and the item's own border, so the ring clears the line
    // it shares with its neighbour. At -2px the next item's border, painted
    // later, covers the ring's outer pixel.
    'focus-visible:outline-offset-[calc((var(--ring-width)+var(--border-width))*-1)]',

    // Selected is ink. Base UI marks a tab with data-active, and a link says
    // so with aria-current; bracketed, as the shorthand has zero specificity.
    // The overlay composites over the fill, so it takes the inverse pair (§4),
    // as a primary button does. On the --tui-* layer: `@theme inline` inlines
    // the --color-* name (§9).
    'data-[active]:bg-fill-interactive data-[active]:text-on-interactive',
    'data-[active]:[--tui-bg-hover:var(--tui-bg-hover-inverse)] data-[active]:[--tui-bg-active:var(--tui-bg-active-inverse)]',
    'aria-[current=page]:bg-fill-interactive aria-[current=page]:text-on-interactive',
    'aria-[current=page]:[--tui-bg-hover:var(--tui-bg-hover-inverse)] aria-[current=page]:[--tui-bg-active:var(--tui-bg-active-inverse)]',

    // An inset ring sits on the item's own ground. --color-ring on the ink fill
    // is 1.80:1 in light and 1.29:1 in dark, under the 3:1 a focus indicator
    // needs, and Tab lands on the selected tab first. --color-on-interactive is
    // 16.39:1 in both (owner, 2026-11-02). No other control has an on-* ring:
    // every other ring is outside the fill.
    'data-[active]:focus-visible:outline-on-interactive aria-[current=page]:focus-visible:outline-on-interactive',

    // Forced colours remove the fill, and every item keeps the same border, so
    // the selected one needs a mark of its own. 2px: §7.8's active tab width.
    'forced-colors:data-[active]:underline forced-colors:data-[active]:decoration-[length:var(--border-width-2)] forced-colors:data-[active]:underline-offset-4',
    'forced-colors:aria-[current=page]:underline forced-colors:aria-[current=page]:decoration-[length:var(--border-width-2)] forced-colors:aria-[current=page]:underline-offset-4',
  ],
  {
    variants: {
      size: {
        default: 'h-[var(--h-control)] text-base [&_svg]:size-[var(--size-icon-sm)]',
        // Reading size, for a strip beside display type, where 13px goes
        // unnoticed (docs/site.md §3). --text-lg takes its §8 tracking.
        lg: 'h-[var(--h-control-lg)] text-lg tracking-[var(--tracking-tight)] [&_svg]:size-[var(--size-icon-md)]',
      },
    },
    defaultVariants: { size: 'default' },
  },
);
