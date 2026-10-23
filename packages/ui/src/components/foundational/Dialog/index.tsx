import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { XIcon } from '@phosphor-icons/react';
import type { ComponentProps } from 'react';

import { cn } from '../../../lib/utils';
import { IconButton } from '../IconButton';

/**
 * Dialog — foundational.
 *
 * Focus trapping, scroll locking and the Escape contract come from Base UI.
 *
 * §4 puts modals a tier above popups: an overlay is `--color-surface-raised`
 * plus `--color-border-strong` **plus `--shadow-overlay`**, a second sheet of
 * its own surface 4px down and right, edged in its own 1px rule. No blur and
 * no black. Popups have no shadow at all. The sidebar peek is the only other
 * overlay.
 */
const Dialog = DialogPrimitive.Root;
const DialogPortal = DialogPrimitive.Portal;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogClose = DialogPrimitive.Close;

function DialogOverlay({ className, ...props }: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      className={cn(
        'fixed inset-0 isolate z-50 duration-100',
        // Scrims toward --color-canvas, not #000. Compositing 80% black over a
        // a ledger-950 canvas lands at near pure black, which is the halation
        // risk §0 rule 9 exists to prevent — here against a bright dialog edge.
        'bg-[color-mix(in_oklab,var(--color-canvas)_80%,transparent)]',
        'supports-backdrop-filter:backdrop-blur-xs',
        'data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0',
        className,
      )}
      {...props}
    />
  );
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: DialogPrimitive.Popup.Props & { showCloseButton?: boolean }) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={cn(
          'fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] sm:max-w-sm',
          '-translate-x-1/2 -translate-y-1/2 outline-none duration-100',
          'gap-[var(--gap-group)] p-[var(--pad-panel)] text-base',
          // §7.7 — modal and drawer are --radius-lg (0px since 2026-10-16).
          // The vendored source shipped rounded-xl, which is above it.
          'rounded-lg border border-border-strong bg-surface-raised text-text-body',
          // §4 overlay: the sheet. Never with a shadow-{colour} utility,
          // which repaints both layers and turns the sheet solid.
          'shadow-overlay',
          // Same as popups: --color-border is too faint on the raised surface
          // (1.60:1 dark, 1.29:1 light), so a bordered control dropped into a
          // dialog takes the strong border. Overrides the --tui-* layer,
          // because `@theme inline` inlines the reference (§9).
          '[--tui-border:var(--tui-border-strong)]',
          'data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0',
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton ? (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            render={
              <IconButton
                aria-label="Close"
                size="sm"
                tooltip={false}
                className="absolute top-[var(--pad-badge-x)] right-[var(--pad-badge-x)]"
              >
                <XIcon />
              </IconButton>
            }
          />
        ) : null}
      </DialogPrimitive.Popup>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-header"
      className={cn('flex flex-col gap-[var(--gap-bonded)] pr-[var(--h-control-sm)]', className)}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div data-slot="dialog-footer" className={cn('flex justify-end gap-[var(--gap-inline)]', className)} {...props} />
  );
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn('text-md font-medium text-text-primary', className)}
      {...props}
    />
  );
}

function DialogDescription({ className, ...props }: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn('text-sm text-text-secondary', className)}
      {...props}
    />
  );
}

/**
 * Props for each part, so product code can wrap a part and pass the rest
 * through (`function ModelSelect(props: SelectProps<string>)`). Derived from
 * the parts themselves, so they cannot drift; the generic root keeps its
 * type parameters.
 */
export type DialogProps<Payload = unknown> = DialogPrimitive.Root.Props<Payload>;
export type DialogCloseProps = ComponentProps<typeof DialogClose>;
export type DialogContentProps = ComponentProps<typeof DialogContent>;
export type DialogDescriptionProps = ComponentProps<typeof DialogDescription>;
export type DialogFooterProps = ComponentProps<typeof DialogFooter>;
export type DialogHeaderProps = ComponentProps<typeof DialogHeader>;
export type DialogOverlayProps = ComponentProps<typeof DialogOverlay>;
export type DialogPortalProps = ComponentProps<typeof DialogPortal>;
export type DialogTitleProps = ComponentProps<typeof DialogTitle>;
export type DialogTriggerProps = ComponentProps<typeof DialogTrigger>;

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
