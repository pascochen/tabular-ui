/**
 * The library's focus ring, as controlBase draws it on every control (§4):
 * an outline, never a box-shadow, with outline-solid so `outline-none` can't
 * leave it unpainted (docs/failure-log.md).
 */
export const focusRing = [
  'outline-none focus-visible:outline-ring focus-visible:outline-solid',
  'focus-visible:outline-[length:var(--ring-width)] focus-visible:outline-offset-[length:var(--ring-offset)]',
].join(' ');

/** A link in running text: ink, always underlined, which is its only mark (§1, 2026-11-09). */
export const textLink = `text-text-interactive underline underline-offset-2 ${focusRing}`;

/**
 * A title that is a link: a card's title on Home. It keeps its heading's ink,
 * and on hover it takes the underline, at once. Nothing around it is running
 * text, so colour alone doesn't have to tell it apart (WCAG 1.4.1).
 */
export const titleLink = `decoration-1 underline-offset-2 hover:underline ${focusRing}`;

/**
 * A link that stands alone, not inside a sentence: the footer, the jump index,
 * a component page's list, the links under a section (owner, 2026-10-27).
 *
 * The word takes the ink (owner, 2026-11-16; docs/site.md §7, "Motion"): it
 * rests at `--color-text-secondary`, as the nav's links do, and on hover the
 * underline appears at once while the text darkens to `--color-text-primary`
 * over 240ms. The line is the first frame, so the hover never reads as late;
 * the ink is what settles. Both are neutral steps: no hue arrives. With
 * reduced motion the colour changes in place. `transition-[color]`, not
 * `transition-colors`, which would fade the focus ring's outline too.
 *
 * Until then it rested at `--color-text-body` and hover changed no colour
 * (2026-11-09; before that it turned ivy, with no underline). The nav's links
 * are ghost buttons, not this.
 */
export const standaloneLink = `${titleLink} text-text-secondary hover:text-text-primary motion-safe:transition-[color] motion-safe:duration-[240ms] motion-safe:ease-out`;

/**
 * The wash on Play and Replay (docs/site.md §7, "Motion", owner 2026-11-16):
 * the sibling of the copy command's tick. When a run starts, the press tone
 * (`--color-bg-active`, the one neutral overlay) wipes in from the left in
 * 140ms, holds while the specimen plays, and leaves to the right in 200ms when
 * it ends. The button's `data-run` drives it (`run` from usePlayback).
 *
 * A layer of the site's, on the button's `::before`, behind its label: the
 * library's Button is unchanged. Decoration only. The plate shows the run and
 * the live region says when it ends, so forced colours, which drop the wash,
 * lose nothing. With reduced motion there is no run to hold through, and the
 * wash never shows.
 */
export const runWash = [
  "relative isolate overflow-hidden before:absolute before:inset-0 before:-z-10 before:origin-left before:scale-x-0 before:bg-bg-active before:content-['']",
  'motion-safe:data-[run=playing]:before:animate-[site-wash-in_140ms_ease-out_forwards]',
  'motion-safe:data-[run=ended]:before:animate-[site-wash-out_200ms_ease-in_forwards]',
].join(' ');

/**
 * A bordered panel's ground and edge (docs/site.md D3, decided 2026-11-16): the
 * paper, `--color-surface-sunken`, on the warm white page, with a
 * `--color-border` edge. Cards, specimen frames, the nav and every other panel
 * take it. Like AppShell's sidebar (design-system.md §3, "A sunken region"), it
 * redefines the page grounds for its subtree, on the `--tui-*` layer, so a
 * component inside that states `bg-canvas` or `bg-surface` doesn't paint a
 * patch of the page. A dark plate inside sets its own (`data-theme="dark"`).
 */
export const panel =
  'border border-border bg-surface-sunken [--tui-canvas:var(--tui-surface-sunken)] [--tui-surface:var(--tui-surface-sunken)]';
