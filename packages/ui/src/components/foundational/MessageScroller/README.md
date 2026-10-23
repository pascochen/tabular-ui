# MessageScroller

Foundational, #16 (approved 2026-10-12). The scroll container for a conversation. It owns scroll behaviour and nothing else: no messages, no AI state, no transport.

```tsx
<MessageScrollerProvider autoScroll defaultScrollPosition="last-anchor">
  <MessageScroller>
    <MessageScrollerViewport>
      <MessageScrollerContent aria-busy={streaming || undefined}>
        {turns.map((turn) => (
          <MessageScrollerItem key={turn.id} messageId={turn.id} scrollAnchor={turn.role === 'user'}>
            …
          </MessageScrollerItem>
        ))}
      </MessageScrollerContent>
    </MessageScrollerViewport>
    <MessageScrollerButton />
  </MessageScroller>
</MessageScrollerProvider>
```

For the chat panel, reach for `ChatThread`, which composes this. Use the parts directly only for a different kind of transcript.

## Where it comes from

shadcn/ui's chat components (June 2026), Base UI registry source, retokenized. The behaviour is the headless `@shadcn/react/message-scroller` (MIT, no dependencies of its own); this file is the token layer. There is no Base UI inside it: the Base UI and Radix variants differ only in which `Button` the scroll control renders.

**Not installed with `shadcn add`.** Four reasons:
- The source carries a `cn-*` class, which tools.md says means author it rather than install it.
- The CLI would write a second `Button` into `src/components/ui/`.
- It would also pull in the `cn` package, which doesn't know our type scale (failure log, `text-metric`).
- `ui.shadcn.com` is unreachable from cloud sessions.

The docs' own "Manual" route was used instead: `pnpm add @shadcn/react`, then copy the source. The package is in `optimizeDeps.include`.

## Parts

| Part | What it is |
|---|---|
| `MessageScrollerProvider` | Headless root: `autoScroll`, `defaultScrollPosition` (`start` / `end` / `last-anchor`), `scrollPreviousItemPeek` (64px), `scrollEdgeThreshold`, `scrollMargin`. |
| `MessageScroller` | The frame. Fills its parent, so **the parent needs a bounded height**, like `DataTable`'s (failure log). |
| `MessageScrollerViewport` | The scrolling element. `role="region"`, `aria-label="Messages"` unless named, `tabIndex={0}`. |
| `MessageScrollerContent` | `role="log"`, `aria-relevant="additions"`. `--gap-group` (12px) between rows. Pass `aria-busy` while a turn streams. |
| `MessageScrollerItem` | One row. `messageId` makes it addressable; `scrollAnchor` marks where a turn starts. |
| `MessageScrollerButton` | "Scroll to latest" (or `direction="start"`). `IconButton`, outline, 24px, on the raised ground, `--pad-panel` from the edge. Faded, `inert` and out of the tab order when there is nowhere to go. Pressed from the keyboard, it hands focus to the viewport first (a pointer click leaves focus alone): the primitive blurs it, and it then goes inert, which would drop focus to `<body>`. It finds the viewport through `data-message-scroller-frame` and `data-message-scroller-viewport`, not `data-slot`, which a consumer may rename. |

Hooks are in `hooks.ts`: `useMessageScroller` (`scrollToMessage`, `scrollToEnd`, `scrollToStart`), `useMessageScrollerScrollable` (`{ start, end }`), `useMessageScrollerVisibility` (`{ currentAnchorId, visibleMessageIds }`).

## What changed from shadcn's source

| shadcn | Here | Why |
|---|---|---|
| `cn` from the `cn` package | `cn` from `lib/utils` | Ours knows the §8.1 type scale. |
| `cn-message-scroller-content` (`gap-6`, 24px in mira) | `--gap-group` (12px) | The spacing the chat panel already used between turns. |
| `scroll-fade-b` edge fade | none | The button is the "more below" cue. §4 asks for a scroll cue on capped popup lists; a transcript has the button instead. |
| `scrollbar-gutter-stable` | none | Reserved ~10px on the right only where scrollbars always show, so rows stopped short of the composer. `AppShellPanelBody` reserves none. |
| `scrollbar-thin`, `contain-content` | `[scrollbar-width:thin]`, `[contain:content]` | Those utilities live in `shadcn/tailwind.css`, which we do not load. |
| no focus style on the viewport | system ring, `outline-offset: -2px` | It is focusable and is its own scroll edge (§4). |
| shadcn `Button`, `secondary`, `icon-sm`, sr-only label | `IconButton`, `outline`, `sm`, `aria-label` | Our primitive; `aria-label` doubles as its tooltip. |
| smooth scroll always | instant under reduced motion; show/hide transition off | The primitive ignores the setting. |
| transparent frame and viewport | `bg-inherit` on both | An opaque scroller lands a smooth scroll on the same pixels every time. |

## Things to know

- **It takes its parent's ground.** The frame and the viewport are `bg-inherit`, so the viewport is opaque in whatever colour it sits on. Then Chromium can scroll the transcript as one layer. Transparent, it repaints during a smooth scroll, and on 1x Windows and Linux screens in dark mode one subpixel fringe pixel of a glyph could stay where a mid-scroll frame drew it after "Scroll to latest". Put `MessageScroller` directly inside the element that paints the ground (`ChatThread` sits in the panel's `bg-surface`). A transparent wrapper in between passes on `transparent`, and both problems below can come back.
- **Opaque also keeps text sharp next to an animation.** Transparent, the agent's turn beside `ChatThread`'s spinning "Working…" icon fell back to grayscale anti-aliasing, while the rest of the panel kept subpixel text. Opaque, the whole transcript draws the same way. That moved the In panel screenshots of `ChatComposer` and `ChatStarter` (2026-10-16).
- **`content-visibility: auto` on every row.** Rows far off screen skip painting. It also clips painting to the row's box, so a focusable control flush with a row's edge needs an inset ring.
- **`last-anchor` falls back to `end`** when the last anchored row already fits on screen (shadcn's documented behaviour; the OpensAtLastAnchor story shows it).
- **No virtualization.** shadcn rates it fine into the low thousands of rows. Past that, its docs show `@tanstack/react-virtual` (already a dependency) with the viewport as the scroll element.
