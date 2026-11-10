import { expect, test, type Page } from '@playwright/test';

import { gotoStory, tokenPx } from './helpers';

/**
 * §7.5: what happens when a user raises their browser's font size.
 *
 * Type is rem and geometry is px, so text grows inside a grid that holds.
 * Until 2026-11-10 nothing said where that stops. Measured on the demo:
 * avatar initials were wider than their avatars from 150%, and near 200% a
 * 32px control held a 40px line, so nav rows collided and text was taller
 * than its box in 40 places. Since then a height yields to its own line of
 * text (§7.6) and an avatar is sized in rem.
 *
 * A root font size stands in for the browser setting: both change what 1rem is.
 */

const HEIGHTS = ['--h-row-xs', '--h-row-sm', '--h-control-sm', '--h-control', '--h-control-lg'] as const;

async function setTextSize(page: Page, percent: number) {
  await page.evaluate((p) => {
    document.documentElement.style.fontSize = `${p}%`;
  }, percent);
  // Two frames: the style applies, then ResizeObservers that follow it run.
  await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));
}

for (const [percent, expected] of [
  [100, [24, 28, 24, 32, 36]],
  [125, [24, 28, 24, 32, 36]],
  [150, [28, 28, 28, 34, 36]],
  [200, [36, 36, 36, 44, 44]],
] as const) {
  test(`heights at ${percent}% text are §7.6's`, async ({ page }) => {
    await gotoStory(page, 'foundational-button--sizes');
    await setTextSize(page, percent);
    const measured = await Promise.all(HEIGHTS.map((name) => tokenPx(page, name)));
    expect(Object.fromEntries(HEIGHTS.map((name, i) => [name, measured[i]]))).toEqual(
      Object.fromEntries(HEIGHTS.map((name, i) => [name, expected[i]])),
    );
  });
}

/**
 * Text whose rendered height or, in an avatar, width is more than the control,
 * row, badge or avatar that holds it. Horizontal truncation is not counted:
 * an ellipsis is the design, and `TruncatedText` gives the rest.
 */
const spills = (page: Page) =>
  page.evaluate(() => {
    const found: string[] = [];
    for (const el of document.querySelectorAll('#storybook-root *')) {
      if (!(el instanceof HTMLElement) || el.offsetParent === null || el.closest('.sr-only')) continue;
      if (![...el.childNodes].some((n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim())) continue;
      const box = el.closest(
        'button, a, input, td, [data-slot="avatar"], [data-slot="badge"], [data-slot="run-log-row"] > *',
      );
      if (!box) continue;
      const range = document.createRange();
      range.selectNodeContents(el);
      const text = range.getBoundingClientRect();
      const held = box.getBoundingClientRect();
      const label = `"${el.textContent?.trim().slice(0, 24)}" in <${box.tagName.toLowerCase()}>`;
      if (text.height > held.height + 1) found.push(`${label}: ${text.height.toFixed(0)}px tall in ${held.height}px`);
      if (box.matches('[data-slot="avatar"]') && text.width > held.width + 1)
        found.push(`${label}: ${text.width.toFixed(0)}px wide in ${held.width}px`);
    }
    return found;
  });

const STORIES = [
  'foundational-button--sizes',
  'foundational-input--states',
  'foundational-avatar--sizes',
  'product-presencestack--default',
  'product-runlogrow--run-log',
  'product-datatable--default',
  'product-appshell--expanded',
];

for (const story of STORIES) {
  test(`no text is taller than its box, or wider than its avatar, at 150% and 200% — ${story}`, async ({ page }) => {
    await gotoStory(page, story);
    // The method must be quiet at the default size, or a hit below means nothing.
    expect(await spills(page), 'at 100%').toEqual([]);
    for (const percent of [150, 200]) {
      await setTextSize(page, percent);
      expect(await spills(page), `at ${percent}%`).toEqual([]);
    }
  });
}

test('an avatar grows with its initials', async ({ page }) => {
  await gotoStory(page, 'foundational-avatar--sizes');
  const sizes = () =>
    page
      .locator('[data-slot="avatar"]')
      .evaluateAll((els) => [...new Set(els.map((el) => el.getBoundingClientRect().width))].sort((a, b) => a - b));
  expect(await sizes()).toEqual([24, 32]);
  await setTextSize(page, 200);
  expect(await sizes()).toEqual([48, 64]);
});

/**
 * The virtualizer needs a number, and it was a literal 28. With taller rows it
 * would lay 50,000 rows out as 28px each: the scroll height would be too short
 * and the last rows out of reach. It reads the token from the page now.
 */
test("a windowed table's scroll height follows the row at 200% text", async ({ page }) => {
  await gotoStory(page, 'product-datatable--virtualized');
  const body = () =>
    page.locator('tbody:has(tr[data-row-id])').evaluate((el) => ({
      height: el.getBoundingClientRect().height,
      rows: [...new Set([...el.querySelectorAll('tr[data-row-id]')].map((tr) => tr.getBoundingClientRect().height))],
    }));

  const before = await body();
  expect(before.rows).toEqual([28]);
  expect(before.height).toBe(50_000 * 28);

  await setTextSize(page, 200);
  const row = await tokenPx(page, '--h-row-sm');
  expect(row).toBe(36);
  await expect
    .poll(async () => (await body()).height, { message: 'the body is every row at the new height' })
    .toBe(50_000 * row);
  expect((await body()).rows).toEqual([row]);
});
