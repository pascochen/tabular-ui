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
  interactive: 7.84,
  danger: 6.95,
  warning: 7.24,
  success: 7.84,
  agent: 6.96,
  info: 7.31,
};

// §4 light mode, measured on --color-canvas (ledger-50, paper) — NOT #fff.
const LIGHT_TEXT: Record<string, number> = {
  interactive: 6.23,
  danger: 7.15,
  warning: 6.74,
  success: 6.23,
  agent: 7.13,
  info: 6.75,
};

// §3 neutral text, both modes.
const NEUTRAL_TEXT: Record<'dark' | 'light', Record<string, number>> = {
  dark: { 'text-primary': 16.39, 'text-body': 15.01, 'text-secondary': 10.15, 'text-tertiary': 7.37 },
  light: { 'text-primary': 16.39, 'text-body': 12.38, 'text-secondary': 6.64, 'text-tertiary': 4.89 },
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
      expect(
        ratio,
        `--color-text-${role} on canvas in ${mode}: expected ~${target}, got ${ratio.toFixed(2)}`,
      ).toBeCloseTo(target, -Math.log10(TOLERANCE) - 1);
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
      expect(ratio, `--color-${name} in ${mode}: expected ~${target}, got ${ratio.toFixed(2)}`).toBeCloseTo(target, 0);
    }
  });
}

/**
 * §10's explicit trap. Light-mode figures must be measured against the
 * ledger-50 paper canvas, not #fff — measuring against white overstates every
 * light ratio by roughly 8%. The tightest role fails first, so it is the
 * canary: interactive (sage-700) since the Riso Ledger palette (2026-10-16).
 * Before that it was danger (red-700), and interactive, warning and danger
 * again before the lightness bands.
 */
test('light-mode tightest role is measured against the canvas, not #fff', async ({ page }) => {
  await gotoStory(page, 'design-system-tokens--tokens', 'light');
  const fg = await token(page, '--color-text-interactive');

  const onCanvas = await contrastRatio(page, fg, await token(page, '--color-canvas'));
  const onWhite = await contrastRatio(page, fg, '#fff');

  expect(onCanvas, 'must be the 6.23 canvas figure').toBeCloseTo(6.23, 1);
  expect(onCanvas, 'still clears AA').toBeGreaterThanOrEqual(4.5);
  // If these ever coincide, the canvas has drifted to white and every
  // light-mode ratio in the spec is now optimistic.
  expect(onWhite - onCanvas, 'canvas must not be #fff').toBeGreaterThan(0.1);
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
 * the interactive fill is ink, inverted in dark). Dark sage-600 (success)
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
