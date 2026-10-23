import { expect, test, type Page } from '@playwright/test';

import { gotoStory } from './helpers';

/**
 * Menu's `density` is set once on `MenuContent` and read by every part
 * through context. This pins that each part actually gets it — items, radio
 * items, labels, separators and a submenu — and that the default stays on the
 * 28px table rhythm, since every Select, Combobox and row menu depends on it.
 */

const trigger = (page: Page) => page.locator('[data-slot="menu-trigger"]');
const menu = (page: Page) => page.locator('[data-slot="menu-content"]');
const rows = (page: Page) => menu(page).locator('[role^="menuitem"]');

const heights = (page: Page) =>
  rows(page).evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().height)));

test('default: 28px rows, flush', async ({ page }) => {
  await gotoStory(page, 'foundational-menu--default');
  await trigger(page).click();
  await expect(rows(page)).toHaveCount(3);
  expect(new Set(await heights(page))).toEqual(new Set([28]));
});

test('spaced: every row is 36px — items, radio items and the submenu trigger', async ({ page }) => {
  await gotoStory(page, 'foundational-menu--spaced');
  await trigger(page).click();
  // Re-run, Edit model, Name, Status, More.
  await expect(rows(page)).toHaveCount(5);
  expect(new Set(await heights(page))).toEqual(new Set([36]));
});

test('spaced: rows 4px apart inside groups, 28px labels, a half-strength separator', async ({ page }) => {
  await gotoStory(page, 'foundational-menu--spaced');
  await trigger(page).click();
  await expect(rows(page)).toHaveCount(5);

  const g = await menu(page).evaluate((root) => {
    const box = (el: Element) => el.getBoundingClientRect();
    const items = [...root.querySelectorAll('[role^="menuitem"]')];
    const labels = [...root.querySelectorAll('[data-slot="menu-label"]')];
    const sep = root.querySelector('[data-slot="menu-separator"]')!;
    return {
      gaps: [box(items[1]).top - box(items[0]).bottom, box(items[3]).top - box(items[2]).bottom],
      labels: labels.map((l) => Math.round(box(l).height)),
      sepColor: getComputedStyle(sep).backgroundColor,
    };
  });
  for (const gap of g.gaps) expect(gap).toBeCloseTo(4, 1);
  expect(g.labels).toEqual([28, 28]);
  // Alpha below 1: softer than the popup's own --color-border-strong edge.
  expect(g.sepColor).toMatch(/\/ 0\.5\)|, 0\.5\)$/);
});

test('spaced: a submenu takes its parent’s density', async ({ page }) => {
  await gotoStory(page, 'foundational-menu--spaced');
  await trigger(page).click();
  await menu(page).getByRole('menuitem', { name: 'More' }).hover();
  const sub = page.locator('[data-slot="menu-sub-content"]');
  await expect(sub).toBeVisible();
  const h = await sub
    .locator('[role="menuitem"]')
    .evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().height)));
  expect(h).toEqual([36, 36]);
});
