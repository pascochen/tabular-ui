import { expect, test } from '@playwright/test';

import { contrastRatio, gotoStory, token } from './helpers';

/**
 * §2, §3 and §4 — the measured contrast of rendered tokens.
 *
 * This needs a browser because the values live in OKLCH and only the browser
 * resolves them to sRGB. The test paints each colour to a canvas and reads the
 * pixel back, so the conversion is the browser's, not a reimplementation.
 *
 * Ratios are the figures in the spec. If one of these fails, either a token
 * moved or the spec is now wrong — both are worth stopping for.
 */

const TOLERANCE = 0.1;

// §4 dark mode, measured on --color-canvas (ledger-950).
const DARK_TEXT: Record<string, number> = {
  interactive: 16.39,
  danger: 6.95,
  warning: 7.24,
  success: 7.84,
  agent: 6.96,
  info: 7.31,
};

// §4 light mode, measured on --color-canvas (ledger-25, a warm white since
// 2026-11-12) — NOT #fff, and not the paper, where each is about 5% lower.
const LIGHT_TEXT: Record<string, number> = {
  interactive: 17.31,
  danger: 7.51,
  warning: 7.08,
  success: 6.55,
  agent: 7.49,
  info: 7.01,
};

// §3 neutral text, both modes.
const NEUTRAL_TEXT: Record<'dark' | 'light', Record<string, number>> = {
  dark: { 'text-primary': 16.39, 'text-body': 15.01, 'text-secondary': 10.15, 'text-tertiary': 7.37 },
  light: { 'text-primary': 17.31, 'text-body': 13.07, 'text-secondary': 6.95, 'text-tertiary': 5.13 },
};

for (const [mode, expected] of [
  ['dark', DARK_TEXT],
  ['light', LIGHT_TEXT],
] as const) {
  test(`role foregrounds hit their measured ratios on canvas — ${mode}`, async ({ page }) => {
    await gotoStory(page, 'design-system-tokens--tokens', mode);
    const canvas = await token(page, '--color-canvas');

    for (const [role, target] of Object.entries(expected)) {
      const fg = await token(page, `--color-text-${role}`);
      const ratio = await contrastRatio(page, fg, canvas);
      // The difference itself: `toBeCloseTo(target, 0)`, which this was, passes
      // anything within 0.5, wide enough for two roles to swap unnoticed.
      expect(
        Math.abs(ratio - target),
        `--color-text-${role} on canvas in ${mode}: expected ~${target}, got ${ratio.toFixed(2)}`,
      ).toBeLessThan(TOLERANCE);
      // §4 — all six clear AA for text.
      expect(ratio, `--color-text-${role} must clear 4.5:1`).toBeGreaterThanOrEqual(4.5);
    }
  });
}

for (const mode of ['dark', 'light'] as const) {
  test(`neutral text ratios hold — ${mode}`, async ({ page }) => {
    await gotoStory(page, 'design-system-tokens--tokens', mode);
    const canvas = await token(page, '--color-canvas');

    for (const [name, target] of Object.entries(NEUTRAL_TEXT[mode])) {
      const fg = await token(page, `--color-${name}`);
      const ratio = await contrastRatio(page, fg, canvas);
      expect(
        Math.abs(ratio - target),
        `--color-${name} in ${mode}: expected ~${target}, got ${ratio.toFixed(2)}`,
      ).toBeLessThan(TOLERANCE);
    }
  });
}

/**
 * §10's explicit trap, in two parts since 2026-11-12. Light mode has two
 * grounds: the canvas, ledger-25, a warm white, and the sunken surface,
 * ledger-50, the paper under AppShell's sidebar (§3). Neither is #fff:
 * measuring on white overstates the canvas figures by about 3% and the paper
 * figures by about 8%. And they are not each other: if the canvas drifts back
 * to the paper the frame is gone, with no error anywhere.
 *
 * The tightest role fails first, so it is the canary: success (ivy-700) since
 * links went to ink (2026-11-09). It was interactive, the same ivy-700, from
 * the Riso Ledger palette (2026-10-16), danger (red-700) before that, and
 * interactive, warning and danger again before the lightness bands. Until
 * 2026-11-12 there was one ground, the paper, and this pinned 6.23 on it.
 */
test('light-mode tightest role is measured on the canvas and the paper, not #fff', async ({ page }) => {
  await gotoStory(page, 'design-system-tokens--tokens', 'light');
  const fg = await token(page, '--color-text-success');

  const onCanvas = await contrastRatio(page, fg, await token(page, '--color-canvas'));
  const onSunken = await contrastRatio(page, fg, await token(page, '--color-surface-sunken'));
  const onWhite = await contrastRatio(page, fg, '#fff');

  expect(Math.abs(onCanvas - 6.55), `the canvas figure is 6.55, got ${onCanvas.toFixed(2)}`).toBeLessThan(0.05);
  expect(Math.abs(onSunken - 6.24), `the paper figure is 6.24, got ${onSunken.toFixed(2)}`).toBeLessThan(0.05);
  expect(onSunken, 'still clears AA on the lower ground').toBeGreaterThanOrEqual(4.5);
  // If these ever coincide, the canvas has drifted to white and every
  // light-mode ratio in the spec is now optimistic.
  expect(onWhite - onCanvas, 'canvas must not be #fff').toBeGreaterThan(0.1);
  // And if these do, the page is the paper again and the sidebar is no frame.
  expect(onCanvas - onSunken, 'canvas must not be the paper').toBeGreaterThan(0.1);
});

/**
 * §3, "The page and the frame": dark mode has no frame. No step sits under
 * the canvas, so the sunken surface is the canvas there.
 */
test('the sunken surface is the canvas in dark mode', async ({ page }) => {
  await gotoStory(page, 'design-system-tokens--tokens', 'dark');
  const ratio = await contrastRatio(
    page,
    await token(page, '--color-surface-sunken'),
    await token(page, '--color-canvas'),
  );
  expect(ratio).toBeCloseTo(1, 2);
});

/**
 * §4 — a role's text on its own tint, on every ground a badge sits on.
 *
 * The canvas figures above are the best case. A `StatusBadge` puts role text
 * on the role's tint, and rows add `--color-bg-hover` (DataTable, RunLogRow,
 * AttachmentRow, LineageTree) and `--color-bg-interactive` (a selected
 * LineageTree row); the AppShell sidebar and panel are `--color-surface`, and
 * a menu, select or popover is `--color-surface-raised`, whose highlighted row
 * takes `--color-bg-hover`. That last ground set dark raised to ledger-925
 * (2026-10-16): on ledger-900 agent text on its tint there measured 3.97:1.
 * Light-mode warning shipped at 4.49:1 on its own tint because only the
 * canvas was ever measured. Found 2026-10-08 by the first light-mode axe run.
 *
 * Layers are painted in order on a canvas, so the composite is the
 * browser's, at the 8 bits per channel axe measures.
 */
const BADGE_GROUNDS: Record<string, string[]> = {
  canvas: ['--color-canvas'],
  // §3, 2026-11-12: the frame beside the page, AppShell's pinned sidebar. In
  // light mode it is the paper, a step under the page, so every ratio is
  // lowest on it. Its row states too: anything can be put in a sidebar.
  sunken: ['--color-surface-sunken'],
  'sunken row hover': ['--color-surface-sunken', '--color-bg-hover'],
  'sunken row selected + hover': ['--color-surface-sunken', '--color-bg-interactive', '--color-bg-hover'],
  surface: ['--color-surface'],
  'row hover': ['--color-canvas', '--color-bg-hover'],
  'row selected': ['--color-canvas', '--color-bg-interactive'],
  'row selected + hover': ['--color-canvas', '--color-bg-interactive', '--color-bg-hover'],
  raised: ['--color-surface-raised'],
  'popup row hover': ['--color-surface-raised', '--color-bg-hover'],
};

/**
 * Pairs that are known to fall under 4.5:1 and are awaiting a decision: a
 * token change each, so spec first (CLAUDE.md). Each is asserted to STILL
 * fail, so fixing one turns this test red until its entry is deleted. Never
 * add an entry to get the test green. Remove the pair's cause.
 *
 * Empty since 2026-10-09: the eight pairs found on 2026-10-08 were fixed by
 * the lightness bands in §0 rule 4.
 */
const KNOWN_SHORTFALLS = new Set<string>([]);

async function composite(page: import('@playwright/test').Page, colors: string[]): Promise<string> {
  return page.evaluate((layers) => {
    const c = document.createElement('canvas');
    c.width = c.height = 1;
    const ctx = c.getContext('2d')!;
    for (const layer of layers) {
      ctx.fillStyle = layer;
      ctx.fillRect(0, 0, 1, 1);
    }
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    return `rgb(${r}, ${g}, ${b})`;
  }, colors);
}

/**
 * §4 Control edge. An Input, a Select trigger and an unchecked Checkbox are
 * drawn by their border alone, so it must clear 3:1 (WCAG 1.4.11) wherever one
 * sits, a hovered or selected table row included. Until 2026-11-10 they took
 * `--color-border`: 1.29:1 on paper, and no test measured a border at all.
 */
for (const mode of ['light', 'dark'] as const) {
  test(`a control's edge clears 3:1 on every ground — ${mode}`, async ({ page }) => {
    await gotoStory(page, 'foundational-checkbox--states', mode);
    const edge = await token(page, '--color-border-control');
    for (const [ground, layers] of Object.entries(BADGE_GROUNDS)) {
      const colors = await Promise.all(layers.map((l) => token(page, l)));
      const ratio = await contrastRatio(page, edge, await composite(page, colors));
      expect.soft(ratio, `${mode} · ${ground}: ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(3);
    }
    // The token is only worth its gate if the control uses it.
    const drawn = await page
      .getByRole('checkbox', { name: 'Unchecked' })
      .evaluate((el) => getComputedStyle(el).borderTopColor);
    expect(await contrastRatio(page, drawn, edge)).toBeCloseTo(1, 2);
  });
}

/**
 * §4 Control edge: an invalid control's edge is solid `--color-text-danger`.
 * Until 2026-11-10 it was the `--color-border-danger` tint, 1.27:1 on paper:
 * the field in error had the faintest border on the form.
 */
for (const mode of ['light', 'dark'] as const) {
  test(`an invalid field's edge is firmer than a valid one's — ${mode}`, async ({ page }) => {
    await gotoStory(page, 'foundational-input--states', mode);
    const canvas = await token(page, '--color-canvas');
    const edgeOf = (name: string) =>
      page.getByRole('textbox', { name }).evaluate((el) => getComputedStyle(el).borderTopColor);
    const invalid = await contrastRatio(page, await edgeOf('Invalid'), canvas);
    const valid = await contrastRatio(page, await edgeOf('With value'), canvas);
    expect(invalid, `invalid ${invalid.toFixed(2)}, valid ${valid.toFixed(2)}`).toBeGreaterThan(valid);
    expect(invalid).toBeGreaterThanOrEqual(3);
  });
}

for (const mode of ['light', 'dark'] as const) {
  test(`role text clears 4.5:1 on its own tint, on every row state — ${mode}`, async ({ page }) => {
    await gotoStory(page, 'design-system-tokens--tokens', mode);

    for (const role of ['interactive', 'danger', 'warning', 'success', 'agent', 'info']) {
      const fg = await token(page, `--color-text-${role}`);
      const tint = await token(page, `--color-bg-${role}`);
      for (const [ground, layers] of Object.entries(BADGE_GROUNDS)) {
        const colors = await Promise.all(layers.map((l) => token(page, l)));
        const ratio = await contrastRatio(page, fg, await composite(page, [...colors, tint]));
        const key = `${mode} ${role} · ${ground}`;
        if (KNOWN_SHORTFALLS.has(key)) {
          expect
            .soft(ratio, `${key} is listed as a known shortfall but now passes (${ratio.toFixed(2)}): delete its entry`)
            .toBeLessThan(4.5);
        } else {
          expect.soft(ratio, `${key}: ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(4.5);
        }
      }
    }
  });
}

/**
 * §4 — every solid fill must carry its on-colour at 4.5:1, in both modes:
 * fills differ by mode since the Riso Ledger palette (700 light, 600 dark;
 * the interactive fill is ink, inverted in dark). Dark ivy-600 (success)
 * under paper is the tightest pair, 4.59:1, and warning takes ink, not
 * paper, in both modes.
 */
test('fill and on-colour pairs clear 4.5:1', async ({ page }) => {
  for (const mode of ['dark', 'light'] as const) {
    await gotoStory(page, 'design-system-tokens--tokens', mode);

    for (const role of ['interactive', 'danger', 'warning', 'success', 'agent', 'info']) {
      const fill = await token(page, `--color-fill-${role}`);
      const on = await token(page, `--color-on-${role}`);
      const ratio = await contrastRatio(page, on, fill);
      expect(ratio, `${mode} --color-on-${role} on --color-fill-${role}: ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(
        4.5,
      );
    }
  }
});

/**
 * §6 — the chart ramp is capped at seven, and graphical objects need 3:1.
 * Series 6 was lime and was removed rather than darkened; an eighth token
 * reappearing means someone re-added a hue.
 */
test('chart ramp is seven series, each clearing 3:1', async ({ page }) => {
  for (const mode of ['dark', 'light'] as const) {
    await gotoStory(page, 'design-system-tokens--tokens', mode);
    const canvas = await token(page, '--color-canvas');

    for (let i = 1; i <= 7; i++) {
      const c = await token(page, `--color-chart-${i}`);
      expect(c, `--color-chart-${i} must exist in ${mode}`).not.toBe('');
      const ratio = await contrastRatio(page, c, canvas);
      expect(ratio, `--color-chart-${i} in ${mode}: ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(3);
    }

    expect(await token(page, '--color-chart-8'), 'ramp is capped at seven (§6)').toBe('');
  }
});
