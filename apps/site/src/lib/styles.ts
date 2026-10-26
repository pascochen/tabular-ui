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
