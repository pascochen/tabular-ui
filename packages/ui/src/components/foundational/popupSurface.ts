/**
 * Shared treatment for everything that floats above the page: Tooltip, Select,
 * Menu, Popover — and Dialog's drawer-like relatives when they land.
 *
 * Extracted once there were four consumers. Every one of them arrived from
 * shadcn carrying `bg-popover`, `shadow-md` and `ring-1 ring-foreground/10`,
 * and every one of them had to be converted the same way, which is exactly the
 * kind of repetition that drifts.
 *
 * §4 elevation: depth is a background STEP plus a 1px border, not a shadow.
 * Shadows barely register on a `ledger-950` canvas, and light mode is paper
 * on paper, so a raised surface is `--color-surface-raised` over
 * `--color-border-strong`, with no shadow in either mode. Only overlays
 * (Dialog, the sidebar peek) carry one, `--shadow-overlay`.
 */
export const popupSurface = [
  'z-50 origin-(--transform-origin)',
  'rounded-md border border-border-strong bg-surface-raised text-text-body', // §7.7 md: dropdown, popover
  'outline-none duration-100',

  // A bordered control dropped into a popup — an Input in a filter panel, a
  // Select in a form — takes the strong border. --color-border on the raised
  // surface is only 1.60:1 in dark mode (ledger-800 on ledger-925) and
  // 1.29:1 in light (paper on paper). Under olive the two were the SAME value
  // in dark mode, and the border vanished outright (CLAUDE.md failure log).
  //
  // Rather than every call site remembering, the popup redefines the token for
  // its own subtree: on this ground, the visible boundary IS border-strong.
  // Descendants using `border-border` adapt with no changes, and this carries
  // to Dialog and anything else built on this surface.
  //
  // It overrides --tui-border, NOT --color-border. §9's `@theme inline`
  // INLINES the reference: `border-border` compiles to
  // `border-color: var(--tui-border)`, so overriding the --color-* name is a
  // no-op. Contextual overrides always target the --tui-* layer.
  '[--tui-border:var(--tui-border-strong)]',

  // Directional motion, which also substitutes for the arrows we do not render.
  'data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2',
  'data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2',
  'data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2',
  'data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0',
];

/**
 * The inset between a popup's border and its row stack — Menu, Select and
 * Combobox lists. §7.4 --pad-popup-list (4px): the border and the rows are
 * two distinct objects, so not the 2px bonded step these borrowed until
 * 2026-10-08 (`--gap-chip`), which left the group label stuck to the edge.
 */
export const popupList = 'p-[var(--pad-popup-list)]';

/**
 * A divider between groups of rows. Same 4px either side as the list inset,
 * so a separator reads as a boundary of the same kind as the popup's edge.
 *
 * --color-border on --color-surface-raised is 1.60:1 in dark mode and 1.29:1
 * in light (§3), too faint for a line that has to read as a boundary.
 * Dividers inside a popup take --color-border-strong.
 */
export const popupSeparator = 'pointer-events-none my-[var(--pad-popup-list)] h-px bg-border-strong';

/**
 * How far a popup row's content sits inside the popup's outer edge, in px:
 * the row's --pad-cell-x, the list's --pad-popup-list and the --border-width
 * border. For positioning props that only take a number, such as the
 * sideOffset of a tooltip beside a row.
 *
 * Read from the live tokens, never restated: a hand-written `8 + 2 + 1` went
 * stale when --pad-popup-list replaced the 2px inset, and nothing failed
 * (failure log). It reads the DOM, so call it when the popup is positioned
 * (inside an offset function), not during render.
 */
export function popupRowInset(): number {
  const tokens = getComputedStyle(document.documentElement);
  return ['--pad-cell-x', '--pad-popup-list', '--border-width'].reduce(
    (sum, name) => sum + parseFloat(tokens.getPropertyValue(name)),
    0,
  );
}

/**
 * A selectable row inside a popup — Menu items and Select items alike.
 *
 * 28px (`--h-row-sm`) so a popup over a table shares the table's rhythm. A
 * popup is transient and does not compete for permanent screen space, so it
 * can afford the larger pointer target.
 *
 * Highlighted (pointer or keyboard) takes the same neutral `--color-bg-hover`
 * overlay every control uses. SELECTED state is not here: only Select has one,
 * and it takes `--color-bg-interactive` because selection is the interactive
 * role (§4).
 */
export const popupItem = [
  'relative flex w-full cursor-default select-none items-center',
  'h-[var(--h-row-sm)] gap-[var(--gap-control-icon)]',
  'rounded-xs px-[var(--pad-cell-x)] outline-none',
  'data-[highlighted]:bg-bg-hover',
  'data-disabled:pointer-events-none data-disabled:opacity-50',
  '[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-[var(--size-icon-sm)]',
];

/**
 * Spaced density: Menu's opt-in `density="spaced"`, for a menu picked from
 * the shell rather than scanned over a table — the sidebar's context
 * switchers and account menu. Measured from Ferndesk's workspace switcher
 * (2026-10-08). Every other popup keeps the table rhythm above.
 *
 * Applied on top of the base parts, never instead of them:
 *
 * - `stack` — on the popup and its groups: rows 4px apart. `gap-1` is a
 *   primitive fallback; no row-gap token exists, by decision (§10).
 * - `item` — 36px (`--h-control-lg`, the cap), an 8px icon gap, square corners (§7.7),
 *   and a 75ms hover fade that reduced motion removes.
 * - `label` — 6px under the line instead of 2px: a 28px label row. Weight
 *   500 and `--color-text-secondary`: a label is read, and tertiary is only
 *   for text nobody reads (§3).
 * - `separator` — `--color-border-strong` at 50%, softer than the popup's
 *   border. Not `--color-border`, which is the raised step's own colour in
 *   dark mode (failure log).
 */
export const popupSpaced = {
  stack: 'flex flex-col gap-1',
  item: 'h-[var(--h-control-lg)] gap-[var(--gap-inline)] rounded-md transition-colors duration-75 motion-reduce:transition-none',
  label: 'pb-1.5 font-medium text-text-secondary',
  separator: 'bg-border-strong/50',
};

/**
 * A group heading inside a popup. §8.1's micro-label tier, paired with
 * `--tracking-wide` as §8.8 scopes it.
 *
 * A 24px row (--h-row-xs): 8px above the 14px line, 2px below. Weighted
 * toward the top so the label sits closer to its own rows than to the edge
 * or the group above, and 24 so the rows after it stay on the 4px grid
 * (§7.4). Primitives by the fallback rule: this is the one place they live.
 */
export const popupLabel = [
  'px-[var(--pad-cell-x)] pt-2 pb-0.5',
  'text-2xs uppercase tracking-[var(--tracking-wide)] text-text-secondary',
];
