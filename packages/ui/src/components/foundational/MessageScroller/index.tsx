import { ArrowDownIcon } from '@phosphor-icons/react';
import { MessageScroller as MessageScrollerPrimitive } from '@shadcn/react/message-scroller';

import { useReducedMotion } from '../../../lib/motion';
import { cn } from '../../../lib/utils';
import { IconButton } from '../IconButton';

/*
 * MessageScroller — foundational #16 (approved 2026-10-12).
 *
 * Vendored from shadcn/ui's Base UI registry source
 * (apps/v4/registry/bases/base/ui/message-scroller.tsx, shadcn-ui/ui@30a58d4)
 * and retokenized. The behaviour — anchoring, follow-output, prepend
 * preservation, scroll commands, visibility — is `@shadcn/react`'s headless
 * primitive. Our work is the token layer, as with every foundational part.
 *
 * Not installed with `shadcn add`: the source carries a `cn-*` class
 * (tools.md, "Read shadcn components"), the CLI would also have written a
 * second Button and pulled the `cn` package (which does not know our type
 * scale), and ui.shadcn.com is unreachable from cloud sessions. The docs'
 * own "Manual" route: add the package, copy the source.
 *
 * Changes from the registry source:
 * - `cn` from our `lib/utils`, relative imports.
 * - `cn-message-scroller-content`'s gap (`gap-6` in style-mira) is
 *   `--gap-group`, the spacing the chat fixture already used between turns.
 * - shadcn-only utilities dropped (`scroll-fade-b`, `scrollbar-thin`,
 *   `scrollbar-gutter-stable`, `contain-content`, from shadcn/tailwind.css,
 *   which we do not load). `scrollbar-thin` and `contain-content` became
 *   plain CSS properties; the stable gutter is dropped (see the viewport).
 *   No edge fade: the scroll button is the "more below" cue.
 * - The viewport is focusable (role="region", tabIndex 0), so it takes the
 *   system ring, inset: it is its own scroll edge (§4).
 * - The button is our `IconButton` (outline, sm), with Phosphor's arrow and
 *   a real `aria-label` instead of an sr-only span.
 * - Under reduced motion the button jumps instead of smooth-scrolling, and
 *   its show/hide transition is off. The primitive does neither.
 * - The frame and the viewport take their parent's background (`bg-inherit`).
 *   See the viewport.
 */

export type MessageScrollerProviderProps = React.ComponentProps<typeof MessageScrollerPrimitive.Provider>;

/** Headless root. Owns scroll state and behaviour; renders no DOM. */
function MessageScrollerProvider(props: MessageScrollerProviderProps) {
  return <MessageScrollerPrimitive.Provider {...props} />;
}

export type MessageScrollerProps = React.ComponentProps<typeof MessageScrollerPrimitive.Root>;

/** The frame. Fills its parent, so the parent needs a bounded height. */
function MessageScroller({ className, ...props }: MessageScrollerProps) {
  return (
    <MessageScrollerPrimitive.Root
      data-slot="message-scroller"
      className={cn(
        // bg-inherit carries the parent's ground down to the viewport.
        'group/message-scroller relative flex size-full min-h-0 flex-col overflow-hidden bg-inherit',
        className,
      )}
      {...props}
      // Not data-slot, which a consumer may rename (ChatThread does): the
      // button finds its viewport through these two.
      data-message-scroller-frame=""
    />
  );
}

export type MessageScrollerViewportProps = React.ComponentProps<typeof MessageScrollerPrimitive.Viewport>;

/** The scrolling element. A labelled region ("Messages" unless named). */
function MessageScrollerViewport({ className, ...props }: MessageScrollerViewportProps) {
  return (
    <MessageScrollerPrimitive.Viewport
      data-slot="message-scroller-viewport"
      className={cn(
        'size-full min-h-0 min-w-0 overflow-y-auto overscroll-contain',
        // Opaque, in its parent's ground, so Chromium can scroll the transcript
        // as one layer. Transparent, it repaints during a smooth scroll, and on
        // 1x screens with subpixel text (Windows, Linux) a fringe pixel a
        // mid-scroll frame drew can stay where the scroll lands, in dark mode.
        // Transparent, it also lost subpixel text beside an animation (the
        // spinner in a working agent turn); opaque, it keeps it.
        // `inherit` reads the parent element, not the nearest painted one: a
        // transparent parent makes it transparent again, as before.
        'bg-inherit',
        // No scrollbar-gutter: stable (shadcn's default). Where scrollbars are
        // always visible it reserved ~10px on the right only, so rows stopped
        // short of the composer's edge below. AppShellPanelBody reserves none.
        '[contain:content] [scrollbar-width:thin]',
        // Hidden until the opening position is applied, so a thread that
        // opens at its last turn does not flash its first one.
        'data-[pending-scroll]:invisible',
        // §4: a focusable scroll container draws its ring inside itself.
        'outline-none focus-visible:outline-solid focus-visible:outline-ring',
        'focus-visible:outline-[length:var(--ring-width)] focus-visible:outline-offset-[-2px]',
        className,
      )}
      {...props}
      data-message-scroller-viewport=""
    />
  );
}

export type MessageScrollerContentProps = React.ComponentProps<typeof MessageScrollerPrimitive.Content>;

/**
 * The transcript, `role="log"`. Every direct child is a
 * `MessageScrollerItem`. Pass `aria-busy` while a turn streams.
 */
function MessageScrollerContent({ className, ...props }: MessageScrollerContentProps) {
  return (
    <MessageScrollerPrimitive.Content
      data-slot="message-scroller-content"
      className={cn('flex h-max min-h-full flex-col gap-[var(--gap-group)]', className)}
      {...props}
    />
  );
}

export type MessageScrollerItemProps = React.ComponentProps<typeof MessageScrollerPrimitive.Item>;

/**
 * One row: a message, a marker, a "load earlier" row. `messageId` makes it
 * addressable; `scrollAnchor` marks the start of a turn.
 *
 * `content-visibility: auto` lets the browser skip painting rows far off
 * screen. It also clips painting to the row's box, so a focusable control
 * flush with a row's edge needs an inset ring.
 */
function MessageScrollerItem({ className, scrollAnchor = false, ...props }: MessageScrollerItemProps) {
  return (
    <MessageScrollerPrimitive.Item
      data-slot="message-scroller-item"
      scrollAnchor={scrollAnchor}
      className={cn('min-w-0 shrink-0 [contain-intrinsic-size:auto_10rem] [content-visibility:auto]', className)}
      {...props}
    />
  );
}

export type MessageScrollerButtonProps = Omit<
  React.ComponentProps<typeof MessageScrollerPrimitive.Button>,
  'render' | 'children'
> & {
  /** Defaults to "Scroll to latest" (end) or "Scroll to start". Also the tooltip. */
  'aria-label'?: string;
};

/**
 * Jump to the latest message (or the first). Shown only while there is
 * something to scroll to; otherwise faded out, `inert` and out of the tab
 * order (the primitive's `data-active="false"`). Pressed from the keyboard,
 * it moves focus to the viewport before it goes inert.
 */
function MessageScrollerButton({
  direction = 'end',
  behavior,
  className,
  onClick,
  'aria-label': ariaLabel,
  ...props
}: MessageScrollerButtonProps) {
  const reduced = useReducedMotion();
  const label = ariaLabel ?? (direction === 'end' ? 'Scroll to latest' : 'Scroll to start');
  return (
    <MessageScrollerPrimitive.Button
      direction={direction}
      behavior={behavior ?? (reduced ? 'auto' : 'smooth')}
      {...props}
      onClick={(event) => {
        onClick?.(event);
        // The primitive blurs the button, and it goes inert once there is
        // nothing left to scroll to: either way focus drops to <body>, with no
        // ring, and a screen reader loses its place. Hand focus to the
        // viewport, where the user arrived. Only from the keyboard (or assistive
        // technology): their click has `detail` 0, a pointer's counts clicks.
        // A pointer user doesn't need focus moved, and a ring appearing round
        // the transcript after a click would read as a selection.
        const button = event.currentTarget;
        if (event.detail !== 0 || !button.contains(document.activeElement)) return;
        button
          .closest('[data-message-scroller-frame]')
          ?.querySelector<HTMLElement>('[data-message-scroller-viewport]')
          ?.focus({ preventScroll: true });
      }}
      render={
        <IconButton
          aria-label={label}
          variant="outline"
          size="sm"
          data-slot="message-scroller-button"
          data-direction={direction}
          className={cn(
            // Centred, --pad-panel from the frame's edge. The raised ground
            // keeps it legible over the rows it floats on (§4 elevation).
            'absolute left-1/2 -translate-x-1/2 border-border-strong bg-surface-raised',
            'data-[direction=end]:bottom-[var(--pad-panel)] data-[direction=start]:top-[var(--pad-panel)]',
            'data-[direction=start]:[&_svg]:rotate-180',
            'transition-[translate,scale,opacity] duration-200 motion-reduce:transition-none',
            'data-[active=false]:pointer-events-none data-[active=false]:scale-95 data-[active=false]:opacity-0',
            className,
          )}
        >
          <ArrowDownIcon />
        </IconButton>
      }
    />
  );
}

export {
  MessageScrollerProvider,
  MessageScroller,
  MessageScrollerViewport,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerButton,
};
