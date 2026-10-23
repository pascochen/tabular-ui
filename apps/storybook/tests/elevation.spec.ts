import { expect, test, type Locator, type Page } from '@playwright/test';

import { gotoStory, rgba, token } from './helpers';

/**
 * §4 Elevation: the overlay sheet. Dialog and the sidebar peek, the only two
 * overlays, each carry `--shadow-overlay`: a sheet of the overlay's own
 * surface 4px down and right, edged in its own 1px strong rule.
 *
 * Each layer is checked against the tokens AND against the element's own
 * colours. The second is what catches a shadow colour utility, which repaints
 * both layers in one colour and turns the sheet solid.
 *
 * The story tests sweep every story for any other shadow
 * (.storybook/elevation-sweep.ts); popups having none is asserted there and
 * in org-switcher.spec.ts.
 */

test.use({ viewport: { width: 1440, height: 900 } });

type Layer = { color: string; x: string; y: string; blur: string; spread: string };

/** The painted layers of an element's box-shadow, Tailwind's transparent slots skipped. */
async function sheet(locator: Locator) {
  return locator.evaluate((el) => {
    const s = getComputedStyle(el);
    const layers = s.boxShadow
      .split(/,(?![^(]*\))/)
      .map((l) => l.trim())
      .filter((l) => !/^rgba\(\d+, \d+, \d+, 0\)/.test(l))
      .map((l) => {
        const [, color, x, y, blur, spread] = /^(.*\)|[a-z]+) (\S+) (\S+) (\S+) (\S+)$/.exec(l) ?? [];
        return { color, x, y, blur, spread };
      });
    return { layers, background: s.backgroundColor, border: s.borderTopColor };
  });
}

async function expectSheet(page: Page, locator: Locator) {
  const { layers, background, border } = await sheet(locator);
  const borderWidth = await token(page, '--border-width');
  expect(layers, 'two painted layers: the sheet and its rule').toHaveLength(2);
  const [paper, rule] = layers as [Layer, Layer];

  // The sheet's paper: inset one rule, so the rule below shows as a line.
  expect([paper.x, paper.y, paper.blur, paper.spread]).toEqual(['4px', '4px', '0px', `-${borderWidth}`]);
  expect(paper.color, 'the sheet is the overlay’s own surface').toBe(background);
  expect(await rgba(page, paper.color)).toEqual(await rgba(page, await token(page, '--color-surface-raised')));

  // The sheet's rule: the overlay's own border.
  expect([rule.x, rule.y, rule.blur, rule.spread]).toEqual(['4px', '4px', '0px', '0px']);
  expect(rule.color, 'the sheet’s rule is the overlay’s own border').toBe(border);
  expect(await rgba(page, rule.color)).toEqual(await rgba(page, await token(page, '--color-border-strong')));
}

for (const mode of ['dark', 'light'] as const) {
  test(`Dialog carries the overlay sheet in ${mode}`, async ({ page }) => {
    await gotoStory(page, 'foundational-dialog--open', mode);
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expectSheet(page, dialog);
  });

  test(`the sidebar peek carries the overlay sheet in ${mode}`, async ({ page }) => {
    await gotoStory(page, 'product-appshell--collapsed', mode);
    await page.locator('[data-slot="app-shell-sidebar-toggle"]').hover();
    const peek = page.locator('[data-slot="app-shell-sidebar"]');
    await expect(peek).toHaveAttribute('data-state', 'peek');
    await expectSheet(page, peek);

    // §4 "Room": the 8px margin leaves the sheet 4px clear of the window.
    const bottom = await peek.evaluate((el) => window.innerHeight - el.getBoundingClientRect().bottom);
    expect(bottom - 4, 'sheet clear of the window edge').toBe(4);
  });
}
