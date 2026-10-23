/**
 * Every axe rule a story is excused from, in one place.
 *
 * `preview.tsx` sets `a11y.test` to `'error'`, so any axe violation fails the
 * story test, in CI and locally. A story that cannot pass yet spreads one of
 * these into its `parameters`. Each turns off only the named rule, so every
 * other rule is still enforced on that story. Each says why, and what ends it.
 *
 * To prove a fix, delete the export: every story that used it must then pass.
 * Never add a story to an existing entry without the same reason applying,
 * and never excuse a rule here to get a new story green. Fix the story.
 *
 * axe runs on every story in both modes: vite.config.ts has one Vitest
 * project per mode (since 2026-10-09). An entry here applies in both.
 */

type Rule = 'color-contrast';

const disable = (...ids: Rule[]) => ({
  a11y: { config: { rules: ids.map((id) => ({ id, enabled: false })) } },
});

/**
 * PERMANENT. The Tokens story renders every text token as a sample, including
 * `--color-text-disabled` (fails contrast on purpose: WCAG 1.4.3 exempts
 * disabled controls) and `--color-text-tertiary`, which is scoped to
 * placeholders, icons and aria-hidden marks and is under AA as text.
 */
export const tokenSamples = disable('color-contrast');

/**
 * PERMANENT, by spec. Placeholder text is `--color-text-tertiary`, which §3
 * scopes to placeholders and accepts below AA in light mode (4.12:1 on the
 * canvas): a placeholder is a hint, never a value. Excludes only the
 * placeholder element (`[data-placeholder]`, Base UI's marker on an empty
 * `SelectValue`), so every rule still checks every other element in the
 * story, in both modes. Input's `::placeholder` needs no entry: axe does not
 * measure pseudo-elements.
 */
export const placeholderText = { a11y: { context: { exclude: ['[data-placeholder]'] } } };
