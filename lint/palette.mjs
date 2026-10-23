/**
 * Every colour scale name in play, in one place, for the lint rules that ban
 * raw scale names (eslint.config.js, lint/stylelint-tui.mjs).
 *
 * Before this, each rule held its own copy, and so did theme.css's strip
 * list. When Tailwind 4.2 added mauve, mist and taupe, none of the copies
 * named them: the scales shipped as live utilities, and `bg-mauve-400` in a
 * component passed every gate (CLAUDE.md failure log). theme.css is CSS and
 * can't import this, so tests/palette.spec.ts checks that this list matches
 * Tailwind's own palette, that theme.css strips all of it, and that
 * palette.css defines exactly the Riso ramps below.
 * A Tailwind update that adds a scale fails that test on its Dependabot PR.
 */

/**
 * The Riso Ledger ramps (2026-10-16), generated into src/styles/palette.css
 * by scripts/generate-palette.mjs. The only colour scales that exist.
 */
export const RAMPS = ['ledger', 'sage', 'vermilion', 'ochre', 'federal', 'orchid', 'teal'];

/** The five hues the UI uses (CLAUDE.md, §1). */
export const UI_HUES = ['sage', 'vermilion', 'ochre', 'federal', 'orchid'];

/** The one neutral ramp. */
export const NEUTRAL = 'ledger';

/** Ramps that exist for the chart tokens only, never for UI state (§6). */
export const CHART_ONLY = ['teal'];

/** Tailwind's chromatic scales, in its order. */
export const CHROMATIC = [
  'red',
  'orange',
  'amber',
  'yellow',
  'lime',
  'green',
  'emerald',
  'teal',
  'cyan',
  'sky',
  'blue',
  'indigo',
  'violet',
  'purple',
  'fuchsia',
  'pink',
  'rose',
];

/** Tailwind's grey scales, in its order. */
export const GREYS = ['slate', 'gray', 'zinc', 'neutral', 'stone', 'mauve', 'olive', 'mist', 'taupe'];

/** Every scale Tailwind ships. */
export const ALL_SCALES = [...CHROMATIC, ...GREYS];

/** The scales theme.css must strip (`--color-<scale>-*: initial`): all of Tailwind's, since 2026-10-16. */
export const STRIPPED = ALL_SCALES;

/**
 * Every scale name banned as a raw `<scale>-<step>` outside theme.css and
 * palette.css: Tailwind's, and the Riso ramps. A component reaches colour
 * through the semantic tokens, never a ramp (CLAUDE.md rule 10).
 */
export const BANNED_SCALES = [...new Set([...ALL_SCALES, ...RAMPS])];

/** Chromatic scales whose 900/950 steps must never be a background (§0 rule 3). */
export const CHROMATIC_SCALES = [...new Set([...CHROMATIC, ...RAMPS.filter((ramp) => ramp !== NEUTRAL)])];

/** Every step name. 925 exists in ledger only. */
export const STEPS = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '925', '950'];

/** `a|b|c`, for building a regular expression from a list. */
export const alternation = (names) => names.join('|');
