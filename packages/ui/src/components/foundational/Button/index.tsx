import { Button as ButtonPrimitive } from '@base-ui/react/button';
import { IconContext } from '@phosphor-icons/react';
import type { VariantProps } from 'class-variance-authority';
import { Children, isValidElement, useContext } from 'react';

import { cn } from '../../../lib/utils';
import { dangerVariant } from '../dangerVariant';
import { buttonVariants } from './variants';

export type ButtonProps = ButtonPrimitive.Props & VariantProps<typeof buttonVariants>;

/**
 * §7.4 optical correction. Phosphor's glyphs sit ~1px inboard of their box,
 * so an edge that leads or trails with an icon takes 6px instead of
 * --pad-control-x's 8px, or that side reads loose against a text edge that
 * starts flush.
 *
 * This is deliberately NOT a CSS :has() rule. `svg:last-child` counts element
 * children only, so in `<Button><Icon/>Label</Button>` the icon matches BOTH
 * :first-child and :last-child — the trailing text node is invisible to the
 * selector — and a leading-icon button loses padding on its text side too.
 * React can see the text node; CSS cannot.
 */
function edgeIcons(children: React.ReactNode) {
  if (typeof children === 'function') return { leading: false, trailing: false };
  const items = Children.toArray(children);
  if (items.length < 2) return { leading: false, trailing: false };
  return {
    leading: isValidElement(items[0]),
    trailing: isValidElement(items[items.length - 1]),
  };
}

/**
 * Button — foundational.
 *
 * Behavior comes from Base UI; our work is the token layer. Do not inline a
 * styled <button> anywhere in the app. If a context needs a button that looks
 * different, add a variant here.
 *
 * Icon-only buttons are NOT a size on this component — they are `IconButton`,
 * which has its own padding and a mandatory aria-label.
 */
function Button({ className, variant: variantProp = 'default', size = 'default', children, ...props }: ButtonProps) {
  const variant = dangerVariant('Button', variantProp);
  // `inline` takes its size from the context (controlBase), so no size
  // variant and no optical edge padding: there is no padding to correct.
  const inline = variant === 'inline';
  const { leading, trailing } = inline ? { leading: false, trailing: false } : edgeIcons(children);
  // §11.2: a labelled button's icon is 1em — 13px at --text-base, 12px at
  // --text-sm — which is under the 16px legibility floor at every size, so
  // it takes `bold`. Disabled, the state treatment wins: `light`, recessive
  // alongside controlBase's whole-control fade (§11.2 — disabled also beats
  // danger's `bold`). Phosphor's default is `regular`, which drew a 0.8px
  // stroke beside 1.4px label stems. Set through IconContext rather than
  // cloneElement (IconButton's way) because a Button's icon sits among
  // text and fragments; the parent context is spread so size and colour
  // defaults survive, and an explicit `weight` on the icon still wins.
  const iconContext = useContext(IconContext);
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(
        buttonVariants({ variant, size: inline ? null : size }),
        leading && 'pl-1.5',
        trailing && 'pr-1.5',
        className,
      )}
      {...props}
    >
      <IconContext.Provider value={{ ...iconContext, weight: props.disabled ? 'light' : 'bold' }}>
        {children}
      </IconContext.Provider>
    </ButtonPrimitive>
  );
}

export { Button };
