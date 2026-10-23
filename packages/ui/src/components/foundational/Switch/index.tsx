import { Switch as SwitchPrimitive } from '@base-ui/react/switch';
import type { VariantProps } from 'class-variance-authority';

import { cn } from '../../../lib/utils';
import { switchThumbVariants, switchVariants } from './variants';

export type SwitchProps = SwitchPrimitive.Root.Props & VariantProps<typeof switchVariants>;

/**
 * Switch — foundational.
 *
 * Use for a setting that takes effect the moment it is flipped. For a staged
 * choice that applies on submit, and for selecting rows, use `Checkbox`.
 *
 * The label is the caller's job. A switch with no label has no accessible
 * name, and "on/off" is rarely enough on its own.
 */
function Switch({ className, size = 'default', ...props }: SwitchProps) {
  return (
    <SwitchPrimitive.Root data-slot="switch" className={cn(switchVariants({ size }), className)} {...props}>
      <SwitchPrimitive.Thumb data-slot="switch-thumb" className={cn(switchThumbVariants({ size }))} />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
