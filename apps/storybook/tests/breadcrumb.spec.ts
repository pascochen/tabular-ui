import { expect, test } from '@playwright/test';

import { gotoStory } from './helpers';

/**
 * `Breadcrumb` in the page header: the trail leads the title on one line, and
 * the `<h1>` stays the current page. The geometry is the claim its README
 * makes: a crumb is text, with no control padding, so it starts where the
 * title would.
 */

const MODES = ['dark', 'light'] as const;

for (const mode of MODES) {
  test(`${mode}: in the page header, the trail starts on the band's text edge and shares the title's line`, async ({
    page,
  }) => {
    await gotoStory(page, 'product-breadcrumb--in-page-header', mode);
    const band = page.locator('[data-slot="app-shell-page-header"]');
    const link = band.locator('[data-slot="breadcrumb-link"]');
    const title = band.locator('h1 [data-slot="truncated-text"]');

    const geometry = await band.evaluate((el) => {
      const box = (node: Element) => node.getBoundingClientRect();
      const link = el.querySelector('[data-slot="breadcrumb-link"]')!;
      const title = el.querySelector('h1 [data-slot="truncated-text"]')!;
      return {
        textEdge: box(el).left + parseFloat(getComputedStyle(el).paddingLeft),
        link: { left: box(link).left, top: box(link).top, height: box(link).height },
        title: { left: box(title).left, top: box(title).top, height: box(title).height },
        linkSize: getComputedStyle(link).fontSize,
        titleSize: getComputedStyle(title).fontSize,
        linkFamily: getComputedStyle(link).fontFamily,
        titleFamily: getComputedStyle(title).fontFamily,
        sans: getComputedStyle(document.documentElement).getPropertyValue('--font-sans').trim(),
        linkWeight: getComputedStyle(link).fontWeight,
        titleWeight: getComputedStyle(title).fontWeight,
      };
    });

    expect(geometry.link.left).toBe(geometry.textEdge);
    expect(geometry.link.top).toBe(geometry.title.top);
    expect(geometry.link.height).toBe(geometry.title.height);
    expect(geometry.linkSize).toBe(geometry.titleSize);
    // One typeface on the line: behind a trail the title is the sans (§8.3).
    expect(geometry.titleFamily).toBe(geometry.linkFamily);
    expect(geometry.titleFamily.split(',')[0]).toBe(geometry.sans.split(',')[0].replace(/'/g, '"'));
    // The title is the one 600 on the line.
    expect(geometry.linkWeight).toBe('400');
    expect(geometry.titleWeight).toBe('600');
    expect(geometry.title.left).toBeGreaterThan(geometry.link.left);
    await expect(link).toBeVisible();
    await expect(title).toHaveText('Tasks');
  });
}

test('the trail is a named landmark around a list, and the slash is not read', async ({ page }) => {
  await gotoStory(page, 'product-breadcrumb--default');
  const nav = page.getByRole('navigation', { name: 'Breadcrumb' });
  await expect(nav.getByRole('listitem')).toHaveCount(3);
  await expect(nav.getByRole('link')).toHaveText(['Kasane Corporation', 'Month-end close']);
  await expect(nav.locator('[aria-current="page"]')).toHaveText('Tasks');
  for (const slash of await nav.locator('[data-slot="breadcrumb-separator"]').all()) {
    await expect(slash).toHaveAttribute('aria-hidden', 'true');
  }
});

test('in the page header the h1 is the current page, so the trail names none', async ({ page }) => {
  await gotoStory(page, 'product-breadcrumb--in-page-header');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tasks');
  await expect(page.locator('[data-slot="breadcrumb"] [aria-current]')).toHaveCount(0);
});

test('a link underlines on keyboard focus and shows a ring', async ({ page }) => {
  await gotoStory(page, 'product-breadcrumb--default');
  const link = page.getByRole('link', { name: 'Kasane Corporation' });
  await expect(link).toHaveCSS('text-decoration-line', 'none');
  await page.keyboard.press('Tab');
  await expect(link).toBeFocused();
  await expect(link).toHaveCSS('text-decoration-line', 'underline');
  await expect(link).toHaveCSS('outline-style', 'solid');
});

test('a crumb too long for its box ends in an ellipsis and the slashes keep their width', async ({ page }) => {
  await gotoStory(page, 'product-breadcrumb--truncated');
  const cut = await page
    .locator('[data-slot="breadcrumb"] [data-slot="truncated-text"]')
    .evaluateAll((nodes) => nodes.map((node) => node.scrollWidth > node.clientWidth));
  expect(cut).toContain(true);
  const nav = await page.locator('[data-slot="breadcrumb"]').evaluate((el) => ({
    fits: el.scrollWidth <= el.clientWidth,
    slashes: [...el.querySelectorAll('[data-slot="breadcrumb-separator"]')].map((s) => s.getBoundingClientRect().width),
  }));
  expect(nav.fits).toBe(true);
  expect(new Set(nav.slashes).size).toBe(1);
  expect(nav.slashes[0]).toBeGreaterThan(0);
});
