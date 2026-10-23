/**
 * The scroller's hooks, re-exported from the headless primitive. Separate
 * module so index.tsx exports only components (react-refresh), as
 * Button/variants.ts is. They read `MessageScrollerProvider`, so they work in
 * any component inside it, including controls outside the frame.
 *
 * - `useMessageScroller()`: `scrollToMessage(id)`, `scrollToEnd()`, `scrollToStart()`.
 * - `useMessageScrollerScrollable()`: `{ start, end }`, which edges can still scroll.
 * - `useMessageScrollerVisibility()`: `{ currentAnchorId, visibleMessageIds }`.
 */
export {
  useMessageScroller,
  useMessageScrollerScrollable,
  useMessageScrollerVisibility,
} from '@shadcn/react/message-scroller';
