import { Input as InputPrimitive } from '@base-ui/react/input';
import type { VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';

import { cn } from '../../../lib/utils';
import { inputVariants } from './variants';

export type InputProps = Omit<ComponentProps<'input'>, 'size'> & VariantProps<typeof inputVariants>;

/**
 * Input — foundational.
 *
 * Behavior comes from Base UI; our work is the token layer.
 *
 * `content` is the prop that matters: it declares what the field holds, and
 * the system applies the typography that implies. `numeric` gets tabular
 * figures and right alignment, `mono` gets the identifier face with a slashed
 * zero. §8.6 calls misaligned figure columns a correctness hazard, not an
 * aesthetic one, so this is structural rather than left to each call site.
 *
 * A label is the caller's responsibility — pair with a `<label htmlFor>` or
 * wrap in `Field` when that lands. An input with only a placeholder has no
 * accessible name once the user starts typing.
 */
function Input({ className, content, size, type, ...props }: InputProps) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      // Numeric fields get tabular figures from the `content` variant; declare
      // the intent to the browser too so mobile keyboards and spinners match.
      inputMode={content === 'numeric' ? (props.inputMode ?? 'decimal') : props.inputMode}
      className={cn(inputVariants({ content, size }), className)}
      {...props}
    />
  );
}

export { Input };
