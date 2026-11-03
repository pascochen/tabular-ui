import { chromium, expect, test } from '@playwright/test';

import { routes } from './routes';

/**
 * The double rule on the site (docs/site.md D11). It says a total adds up, so it
 * only means something while it's rare: one use, under a total that really foots,
 * and never as a divider.
 */

const page_ = '/components/lineage-tree';

test('Lineage tree’s bridge closes on the actual, with the rule under the figure', async ({ page }) => {
  await page.goto(page_);
  const table = page.getByRole('region', { name: 'The same figures, in a Data table' });
  await expect(table.getByRole('rowheader', { name: 'Actual' })).toBeVisible();

  const figure = table.locator('tfoot span', { hasText: '2,192,778,193' }).first();
  await expect(figure).toHaveCSS('border-bottom-style', 'double');
  await expect(figure).toHaveCSS('border-bottom-width', '3px');
  await expect(table.getByRole('cell', { name: '2,192,778,193 adds up' })).toBeVisible();
  await expect(table.getByText('Difference')).toHaveCount(0);
});

test('the rule is in the page before any JavaScript runs', async ({ request }) => {
  const html = await (await request.get(page_)).text();
  expect(html).toContain('<tfoot');
  expect(html).toContain('border-double');
});

for (const route of routes) {
  const expected = route === page_ ? 'the one double rule' : 'no double rule';
  test(`${route}: ${expected}, and section rules stay 1px`, async ({ page }) => {
    await page.goto(route);
    const found = await page.evaluate(() => {
      const sides = ['Top', 'Right', 'Bottom', 'Left'] as const;
      const doubles = [...document.querySelectorAll('body *')].filter((el) => {
        const style = getComputedStyle(el);
        return sides.some((side) => style[`border${side}Style`] === 'double');
      });
      return {
        doubles: doubles.length,
        sectionRules: [...document.querySelectorAll('main section')]
          .map((el) => getComputedStyle(el))
          .filter((style) => style.borderTopWidth !== '0px')
          .map((style) => `${style.borderTopStyle} ${style.borderTopWidth}`),
      };
    });
    expect(found.doubles).toBe(route === page_ ? 1 : 0);
    expect(new Set(found.sectionRules.filter((rule) => rule !== 'solid 1px'))).toEqual(new Set());
  });
}

/**
 * Two separate lines at real device pixel ratios (D11, item 4). Emulated
 * `deviceScaleFactor` draws a `double` soft, so this launches with
 * --force-device-scale-factor, and reads a column of pixels down through the rule
 * at the cell's left, where no glyph reaches.
 */
for (const scale of [1, 1.5, 2]) {
  test(`two separate lines on whole pixels at ${scale}x`, async ({ baseURL }) => {
    const browser = await chromium.launch({ args: [`--force-device-scale-factor=${scale}`, '--window-size=1440,900'] });
    try {
      const context = await browser.newContext({
        baseURL,
        viewport: null,
        // Off, or Playwright's device profile overrides the real ratio.
        deviceScaleFactor: undefined,
        isMobile: undefined,
        hasTouch: undefined,
        screen: undefined,
      });
      const page = await context.newPage();
      await page.goto(page_);
      expect(await page.evaluate(() => devicePixelRatio)).toBeCloseTo(scale, 5);

      const png = await page.locator('tfoot span', { hasText: '2,192,778,193' }).first().screenshot();
      const painted = await page.evaluate(async (base64) => {
        const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
        const bitmap = await createImageBitmap(new Blob([bytes], { type: 'image/png' }));
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const context2d = canvas.getContext('2d')!;
        context2d.drawImage(bitmap, 0, 0);
        const { data } = context2d.getImageData(2, 0, 1, bitmap.height);
        return Array.from({ length: bitmap.height }, (_, y) => data[y * 4]);
      }, png.toString('base64'));

      const paper = painted[0];
      const ink = Math.min(...painted);
      const runs: number[] = [];
      let soft = 0;
      let inRun = false;
      for (const value of painted) {
        const isInk = Math.abs(value - ink) <= 2;
        if (!isInk && Math.abs(value - paper) > 2) soft++;
        if (isInk && !inRun) runs.push(0);
        if (isInk) runs[runs.length - 1]++;
        inRun = isInk;
      }
      expect(runs, 'two lines of ink').toHaveLength(2);
      expect(soft, 'no pixel between ink and paper').toBe(0);
      expect(paper - ink, 'ink on paper').toBeGreaterThan(150);
    } finally {
      await browser.close();
    }
  });
}
