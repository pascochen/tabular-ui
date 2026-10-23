import { cn } from '../../../lib/utils';

export type ToolbarProps = React.ComponentProps<'div'> & {
  /** `bare` for a toolbar already inside a bordered container. */
  variant?: 'bordered' | 'bare';
};

/**
 * Toolbar — product.
 *
 * A horizontal band of controls above a table or panel. Renders
 * `role="toolbar"`, which tells assistive technology the controls are a group.
 *
 * Neutral throughout (§0 rule 1): a toolbar is structure. Any hue inside it
 * comes from a control that is genuinely in a state — a selected `FilterChip`,
 * a danger `Button` — never from the band itself.
 */
function Toolbar({ className, variant = 'bordered', children, ...props }: ToolbarProps) {
  return (
    <div
      role="toolbar"
      data-slot="toolbar"
      className={cn(
        'flex items-center gap-[var(--gap-inline)]',
        'min-h-[var(--h-control-lg)] px-[var(--pad-cell-x)] py-[var(--gap-chip)]',
        variant === 'bordered' && 'rounded-md border border-border bg-surface',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/** Pushes everything after it to the trailing edge. */
function ToolbarSpacer({ className, ...props }: React.ComponentProps<'div'>) {
  return <div aria-hidden="true" data-slot="toolbar-spacer" className={cn('ml-auto', className)} {...props} />;
}

/**
 * Vertical rule between control groups. `--color-border-strong`, not
 * `--color-border`: on `--color-surface` the plain border token is invisible
 * in dark mode, where §3 gives both the same value.
 */
function ToolbarSeparator({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      data-slot="toolbar-separator"
      className={cn('h-[var(--size-icon-md)] w-px shrink-0 bg-border-strong', className)}
      {...props}
    />
  );
}

export { Toolbar, ToolbarSpacer, ToolbarSeparator };
