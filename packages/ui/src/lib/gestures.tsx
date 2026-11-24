/**
 * The ledger's three gestures (docs/explorations/motion-page-spec.md, "More of
 * the same family"), as keyframes the components that use them render.
 *
 * - **The tick**: a mark drawn left to right along its stroke. Done, and checked.
 * - **The wash**: the press tone wiping across a surface. This took.
 * - **The rule**: a line drawn left to right, as a pen rules a ledger. Settled.
 *
 * No token: the library writes motion values in place, and a duration or
 * easing token would need a spec section first. The keyframes travel with the
 * import graph, as `Spinner`'s do: React hoists one `<style>` to `<head>`
 * however many components render it, so a consuming app needs no stylesheet of
 * ours for them.
 *
 * Every gesture is behind `motion-safe:` or a `matchMedia` check at its call
 * site. Under reduced motion the end state arrives at once.
 */

const keyframes = [
  // The tick: revealed from the left, so a check is drawn the way a pen draws it.
  '@keyframes tui-tick { from { clip-path: inset(0 100% 0 0); } to { clip-path: inset(0); } }',
  // A mark returning after a tick fades back rather than being drawn again.
  '@keyframes tui-fade-in { from { opacity: 0; } to { opacity: 1; } }',
  // The wash, in and out. `scale`, not `transform`, so a resting `scale-x-0` utility composes.
  '@keyframes tui-wash-in { from { scale: 0 1; } to { scale: 1 1; } }',
  '@keyframes tui-wash-out { from { scale: 1 1; } to { scale: 0 1; } }',
  // The rule: a cover over a drawn line shrinks toward its right end, so the line appears left to right.
  '@keyframes tui-unrule { from { scale: 1 1; } to { scale: 0 1; } }',
].join(' ');

/** Renders the gestures' keyframes once per document. Put it beside the element that animates. */
export function GestureKeyframes() {
  return (
    <style href="tui-gestures" precedence="default">
      {keyframes}
    </style>
  );
}

/** The tick on a mark that has just mounted: 140ms, the site's copy tick. */
export const tickIn = 'motion-safe:animate-[tui-tick_140ms_ease-out]';

/** A mark coming back after a tick: 120ms. */
export const fadeBack = 'motion-safe:animate-[tui-fade-in_120ms_ease-out]';

/** The wash's timing (§ "Copied cells take a wash"): in, held, out. */
export const WASH_IN_MS = 140;
export const WASH_HOLD_MS = 400;
export const WASH_OUT_MS = 200;
/** Under reduced motion the tone shows this long, with no travel, then goes. */
export const WASH_STILL_MS = 600;
