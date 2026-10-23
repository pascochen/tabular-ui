import { Checkbox as CheckboxPrimitive } from '@base-ui/react/checkbox';
import { CheckIcon, MinusIcon } from '@phosphor-icons/react';
import type { VariantProps } from 'class-variance-authority';

import { cn } from '../../../lib/utils';
import { checkboxVariants } from './variants';

export type CheckboxProps = CheckboxPrimitive.Root.Props & VariantProps<typeof checkboxVariants>;

/**
 * Checkbox — foundational.
 *
 * Use for staged choices that take effect on submit, and for selecting rows.
 * For a setting that applies the moment it is flipped, use `Switch`.
 *
 * The label is the caller's job — wrap in a `<label>` or pair with
 * `<label htmlFor>`. A checkbox with no label has no accessible name.
 */
function Checkbox({ className, size = 'default', ...props }: CheckboxProps) {
  return (
    <CheckboxPrimitive.Root data-slot="checkbox" className={cn(checkboxVariants({ size }), className)} {...props}>
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current"
        // Base UI keeps the indicator mounted while indeterminate so the mark
        // can swap without the box flashing empty.
        render={(indicatorProps, state) => (
          <span {...indicatorProps}>
            {state.indeterminate ? (
              <MinusIcon weight="bold" aria-hidden="true" />
            ) : (
              <CheckIcon weight="bold" aria-hidden="true" />
            )}
          </span>
        )}
      />
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
