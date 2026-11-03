import type { ReactNode } from 'react';
import { Button, Dialog, DialogContent } from 'tabular-ui';

/**
 * The right panel where there is no room for it beside main. AppShell's panel
 * pushes main at every width, and it is 440px, so on a phone main measures 0
 * and the panel still runs off the edge. A dialog covers main instead of
 * squeezing it: the channel keeps its width, its scroll and what the visitor
 * has opened or typed. The same content, opened from the page header.
 */
export function PanelSheet({
  label,
  open,
  onOpenChange,
  children,
}: {
  label: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}) {
  return (
    <>
      <Button variant="outline" onClick={() => onOpenChange(true)}>
        {label}
      </Button>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          aria-label={label}
          // top-3: the 24px close button, centred in the panel header's 49px band.
          className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 p-0 sm:max-w-[var(--w-panel)] [&_[data-slot=dialog-close]]:top-3"
          // A link in the panel goes somewhere behind this: a message, a channel.
          onClick={(event) => {
            if ((event.target as Element).closest('a[href]')) onOpenChange(false);
          }}
        >
          {children}
        </DialogContent>
      </Dialog>
    </>
  );
}
