/**
 * The library's focus ring, as controlBase draws it on every control (§4):
 * an outline, never a box-shadow, with outline-solid so `outline-none` can't
 * leave it unpainted (CLAUDE.md failure log).
 */
export const focusRing = [
  'outline-none focus-visible:outline-ring focus-visible:outline-solid',
  'focus-visible:outline-[length:var(--ring-width)] focus-visible:outline-offset-[length:var(--ring-offset)]',
].join(' ');

/** A link in running text: sage, always underlined, so it isn't told apart by colour alone. */
export const textLink = `text-text-interactive underline underline-offset-2 ${focusRing}`;

/**
 * A link that stands alone, not inside a sentence: the nav, the footer, card
 * titles, the jump index, previous and next (owner, 2026-10-27). Ink by
 * default, in the colour its context sets, so a grid of headings doesn't read
 * as a wall of green; on hover, sage with a thin underline. Nothing around it
 * is running text, so colour alone doesn't have to tell it apart (WCAG 1.4.1).
 */
export const standaloneLink = `decoration-1 underline-offset-4 hover:text-text-interactive hover:underline ${focusRing}`;
