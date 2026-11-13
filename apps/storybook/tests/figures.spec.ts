import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

import { expect, test } from '@playwright/test';

import { gotoStory } from './helpers';

/**
 * §8.3 — the sans's tabular figures are one width.
 *
 * Golos Text's `tnum` swaps in its `.tf` digits, but they are not one width: at
 * 400, `000000` measured 119.05px at 32px and `222222` 111.38px, so a right-
 * aligned column of amounts drifted by up to 3.2px at 12px (2026-11-13).
 * `packages/ui/src/styles/figures.css` replaces the ten digits with a patched cut
 * in which every `.tf` digit has `zero.tf`'s advance. Nothing errors when that
 * file is missing, misordered or stale: the package's own digits render, a
 * little uneven.
 *
 * The family is read from `--font-sans`, so the test follows a family change.
 * The weights are §8.5's three.
 */
const uiRoot = new URL('../../../packages/ui/', import.meta.url);

test('figures.css was generated from the installed Golos Text file', () => {
  const css = readFileSync(new URL('src/styles/figures.css', uiRoot), 'utf8');
  const source = css.match(/Source: @fontsource-variable\/golos-text@[\d.]+, (\S+)/)?.[1];
  const recorded = css.match(/Source sha256: ([0-9a-f]{64})/)?.[1];
  expect(source, 'figures.css names its source file').toBeTruthy();
  const file = new URL(`node_modules/@fontsource-variable/golos-text/files/${source}`, uiRoot);
  const actual = createHash('sha256').update(readFileSync(file)).digest('hex');
  expect(actual, 'the package sans changed: run packages/ui/scripts/tabular-figures.py').toBe(recorded);
});

test('every tabular digit in the sans is one width, at 400, 500 and 600', async ({ page }) => {
  await gotoStory(page, 'product-datatable--default');
  const result = await page.evaluate(async () => {
    const family = getComputedStyle(document.documentElement).getPropertyValue('--font-sans').split(',')[0].trim();
    const weights = [400, 500, 600];
    for (const w of weights) await document.fonts.load(`${w} 32px ${family}`, '0123456789');
    const width = (text: string, weight: number, px: number, numeric: string) => {
      const s = document.createElement('span');
      s.textContent = text;
      s.style.cssText = `position:absolute;white-space:pre;font:${weight} ${px}px ${family};font-variant-numeric:${numeric}`;
      document.body.appendChild(s);
      const w = s.getBoundingClientRect().width;
      s.remove();
      return w;
    };
    return {
      family,
      digits: weights.map((w) => ({
        weight: w,
        widths: [...'0123456789'].map((d) => width(d.repeat(6), w, 32, 'tabular-nums lining-nums')),
      })),
      // Proportional figures stay the font's own: a `1` is narrower than a `0`.
      proportional: [width('111111', 400, 32, 'normal'), width('000000', 400, 32, 'normal')],
      amounts: ['1,111,147.00', '2,358,569.89', '5,238,965.32', '7,410,074.10'].map((t) =>
        width(t, 400, 12, 'tabular-nums lining-nums'),
      ),
    };
  });

  expect(result.family.replace(/['"]/g, '')).toBe('Golos Text Variable');
  for (const { weight, widths } of result.digits) {
    for (const w of widths) expect(w, `a digit at ${weight}`).toBeCloseTo(widths[0], 2);
  }
  // Tabular `0` is 0.620em at 400: the patch takes the widest digit, it never narrows one.
  expect(result.digits[0].widths[0]).toBeCloseTo(6 * 0.62 * 32, 0);
  expect(result.proportional[0], 'proportional figures are unpatched').toBeLessThan(result.proportional[1] - 10);
  for (const w of result.amounts) expect(w, 'amounts of equal length share a width').toBeCloseTo(result.amounts[0], 2);
});
