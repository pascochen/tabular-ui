import { Button as ButtonPrimitive } from '@base-ui/react/button';
import type { VariantProps } from 'class-variance-authority';
import { cloneElement, isValidElement, type ReactElement } from 'react';

import { cn } from '../../../lib/utils';
import { dangerVariant } from '../dangerVariant';
import { Tooltip, TooltipContent, TooltipTrigger } from '../Tooltip';
import { iconButtonVariants, iconWeightForSize } from './variants';

type IconWeight = (typeof iconWeightForSize)[keyof typeof iconWeightForSize] | 'light';

export type IconButtonProps = Omit<ButtonPrimitive.Props, 'children'> &
  VariantProps<typeof iconButtonVariants> & {
    /**
     * Required. An icon-only control has no accessible name of its own, so
     * without this a screen reader announces "button" and nothing else. The
     * label goes on the button, never on the icon — the icon is decorative
     * once the button is named.
     */
    'aria-label': string;
    /** A single Phosphor icon. */
    children: ReactElement;
    /**
     * Tooltip text. Defaults to `aria-label`, so a correctly labelled button
     * is explained to sighted users for free. Pass `false` to opt out — only
     * when the control already sits inside its own tooltip or menu.
     */
    tooltip?: React.ReactNode | false;
  };

/**
 * IconButton — foundational.
 *
 * Separate from `Button` rather than a size on it: it has no label, so it is
 * square with no horizontal padding, its icon is sized by the grid instead of
 * by adjacent type, and `aria-label` is mandatory rather than optional. Those
 * are different contracts, and folding them into one component is how the
 * label silently goes missing.
 *
 * Defaults to `ghost` — icon-only buttons are mostly toolbar and table-row
 * actions, where a fill or border on every row is noise.
 *
 * `inline` (a tree's expand caret) drops the size variant: the caller sizes
 * the box and the icon, because the context sets the grid, not --h-control.
 */
function IconButton({
  className,
  variant: variantProp = 'ghost',
  size = 'default',
  children,
  tooltip,
  ...props
}: IconButtonProps) {
  const variant = dangerVariant('IconButton', variantProp);
  // §11.2, in its order. The state treatment wins first: disabled is
  // `light`, recessive alongside controlBase's whole-control fade. Then the
  // size band, which is not intuitive — 14px and 16px take `bold` while 20px
  // takes `regular`. Applied here so call sites cannot drift; an explicit
  // `weight` on the icon still wins.
  const icon =
    isValidElement<{ weight?: IconWeight }>(children) && children.props.weight === undefined
      ? cloneElement(children, {
          weight: props.disabled ? 'light' : iconWeightForSize[size ?? 'default'],
        })
      : children;

  const button = (
    <ButtonPrimitive
      data-slot="icon-button"
      className={cn(iconButtonVariants({ variant, size: variant === 'inline' ? null : size }), className)}
      {...props}
    >
      {icon}
    </ButtonPrimitive>
  );

  // aria-label is already mandatory, so the tooltip text is free and always
  // correct. Wrapping by default means no icon button can ship explained to
  // screen readers but opaque to everyone else.
  if (tooltip === false) return button;

  return (
    <Tooltip>
      <TooltipTrigger render={button} />
      <TooltipContent>{tooltip ?? props['aria-label']}</TooltipContent>
    </Tooltip>
  );
}

export { IconButton };
