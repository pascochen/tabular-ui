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
 * A link that stands alone, not inside a sentence: the footer, card titles,
 * the jump index, previous and next (owner, 2026-10-27). Ink by default, in
 * the colour its context sets, so a grid of headings doesn't read as a wall of
 * green. On hover it takes the underline: until 2026-11-09 it turned ivy
 * instead, with no underline (1px was judged too heavy at rest), but a link is
 * ink now (§1), so a colour change would change nothing. Nothing around it is running text, so
 * colour alone doesn't have to tell it apart (WCAG 1.4.1). The nav's links are
 * ghost buttons, not this.
 */
export const standaloneLink = `decoration-1 underline-offset-2 hover:underline ${focusRing}`;
