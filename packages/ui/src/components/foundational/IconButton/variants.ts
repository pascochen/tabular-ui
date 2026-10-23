import { cva } from 'class-variance-authority';

import { controlBase, controlGrounds, pressableBase } from '../controlBase';

/**
 * Square by construction — no horizontal padding, so the icon centres on both
 * axes. This is the "different padding" that CLAUDE.md gives as the reason
 * IconButton is a component and not a Button size.
 *
 * The icon takes an explicit --size-icon-* token rather than Phosphor's 1em
 * default: with no label beside it, the icon is standalone and sized by the
 * grid, not by adjacent text (§11.3).
 */
export const iconButtonVariants = cva([...controlBase, ...pressableBase, 'group/icon-button'], {
  variants: {
    variant: controlGrounds,
    size: {
      sm: 'size-[var(--h-control-sm)] [&_svg]:size-[var(--size-icon-sm)]',
      default: 'size-[var(--h-control)] [&_svg]:size-[var(--size-icon-md)]',
      lg: 'size-[var(--h-control-lg)] [&_svg]:size-[var(--size-icon-lg)]',
    },
  },
  defaultVariants: {
    // Icon-only buttons are overwhelmingly toolbar and row actions, where a
    // fill or border on every row is noise. The quiet case is the common one,
    // so it is the default.
    variant: 'ghost',
    size: 'default',
  },
});

/**
 * §11.2 weight by icon size. sm and default render at 14px and 16px, which sit
 * at or below the 16px legibility floor and take `bold`. lg renders at 20px,
 * above the floor, where weight matches the control's own type weight (500 →
 * `regular`). A 20px regular stroke and a 14px bold stroke read at equivalent
 * visual weight — that is the optical correction working, not an inconsistency.
 */
export const iconWeightForSize = {
  sm: 'bold',
  default: 'bold',
  lg: 'regular',
} as const;
