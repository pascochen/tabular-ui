/**
 * §4 Elevation: one shadow exists, the overlay sheet. Run after every story
 * in the story tests (preview.tsx), in both modes, it fails any element that
 * paints a shadow layer unless that shadow is the sheet, drawn correctly:
 *
 *   <its own background> 4px 4px 0 -<--border-width>,
 *   <its own border colour> 4px 4px 0 0
 *
 * Comparing against the element's own colours, not the token's, is the point.
 * A shadow colour utility (`shadow-border-strong`) repaints both layers in one
 * colour, and the sheet turns into a solid block with no error. Lint rejects
 * those, and this catches whatever lint cannot see.
 *
 * Tailwind writes every unused slot of its shadow stack as a transparent zero
 * layer, so fully transparent layers are not painted and are skipped.
 */

// Storybook's own chrome in the preview iframe, not the story: its `sb-`
// wrappers and its `storybook-` roots (docs, highlights, a11y filters). The
// story root is the one `storybook-` id that holds story content. Storybook
// 10.6.2 gave the highlights menu, a popover under #storybook-highlights-root
// with no class, a two-layer drop shadow, and every story failed on it.
const isStorybookChrome = (el: Element) =>
  (el.id.startsWith('storybook-') && el.id !== 'storybook-root') || [...el.classList].some((c) => c.startsWith('sb-'));

const describe = (el: Element) => {
  const slot = el.getAttribute('data-slot');
  return slot ? `[data-slot="${slot}"]` : `<${el.tagName.toLowerCase()} class="${el.getAttribute('class') ?? ''}">`;
};

export function assertOneShadow(canvasElement: HTMLElement) {
  // A sweep of an empty page passes everything. Fail instead, so a change in
  // when this runs, or where stories render, cannot turn it into a silent
  // no-op. (The first version looked for #storybook-root, which the story
  // tests never render into: this guard failed all 452, as it should.)
  if (!canvasElement.isConnected || canvasElement.childElementCount === 0) {
    throw new Error('Elevation sweep found nothing rendered in the story canvas; it ran before or after the story.');
  }

  const borderWidth = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--border-width'));
  const offenders: string[] = [];

  // The story's canvas, and everything a story portals to <body>: dialogs,
  // menus, popovers. The sidebar peek renders inside the canvas.
  const scopes = new Set([canvasElement, ...[...document.body.children].filter((el) => !isStorybookChrome(el))]);
  for (const scope of scopes) {
    for (const el of [scope, ...scope.querySelectorAll('*')]) {
      const s = getComputedStyle(el);
      if (s.boxShadow === 'none') continue;
      const layers = s.boxShadow
        .split(/,(?![^(]*\))/)
        .map((layer) => layer.trim())
        .filter((layer) => !/^rgba\(\d+, \d+, \d+, 0\)/.test(layer));
      if (layers.length === 0) continue;

      const isSheet =
        layers.length === 2 &&
        layers[0] === `${s.backgroundColor} 4px 4px 0px ${-borderWidth}px` &&
        layers[1] === `${s.borderTopColor} 4px 4px 0px 0px`;
      if (!isSheet) offenders.push(`${describe(el)}: ${layers.join(', ')}`);
    }
  }

  if (offenders.length > 0) {
    throw new Error(
      `§4 Elevation: only overlays carry a shadow, and only the overlay sheet (shadow-overlay). Found:\n${offenders.join('\n')}`,
    );
  }
}
