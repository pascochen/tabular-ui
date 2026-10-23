import { expect, test, type Page } from '@playwright/test';

import { gotoStory } from './helpers';

/**
 * OrgSwitcher is `ContextSwitcher` without `actions`: no submenu, the check at
 * the current row's trailing edge. This pins that layout, the keyboard path,
 * the switcher's spaced density and elevation, and a tooltip only for names
 * that are really truncated. Copy confirmation lives in project-switcher.spec.ts,
 * the switcher that still has a copy action.
 */

const trigger = (page: Page) => page.locator('[data-slot="menu-trigger"]');
const menu = (page: Page) => page.locator('[data-slot="menu-content"]');
const submenu = (page: Page) => page.locator('[data-slot="menu-sub-content"]');
const currentRow = (page: Page) => page.getByRole('menuitem', { name: /, current$/ });
const item = (page: Page, name: string) => page.getByRole('menuitem', { name, exact: true });

test('keyboard: Up/Down reach every row, no row opens a submenu, Esc returns focus', async ({ page }) => {
  await gotoStory(page, 'product-orgswitcher--default');
  await trigger(page).focus();
  await page.keyboard.press('Enter');
  await expect(menu(page)).toBeVisible();
  // Opening from the keyboard highlights the first item — the current org.
  await expect(currentRow(page)).toBeFocused();
  await expect(page.locator('[data-slot="menu-sub-trigger"]')).toHaveCount(0);

  // Right is the submenu key; with none, it moves nothing.
  await page.keyboard.press('ArrowRight');
  await expect(submenu(page)).toHaveCount(0);
  await expect(currentRow(page)).toBeFocused();

  await page.keyboard.press('ArrowDown');
  await expect(item(page, 'Kasane Americas, Inc.')).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await expect(item(page, 'Create Workspace')).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(menu(page)).toBeHidden();
  await expect(trigger(page)).toBeFocused();
});

test('wording: the Workspaces label and the Create Workspace row', async ({ page }) => {
  await gotoStory(page, 'product-orgswitcher--default');
  await trigger(page).click();
  await expect(menu(page).locator('[data-slot="menu-label"]')).toHaveText('Workspaces');
  await expect(item(page, 'Create Workspace')).toBeVisible();
});

test('picking the current org closes the menu and switches nothing', async ({ page }) => {
  await gotoStory(page, 'product-orgswitcher--default');
  await trigger(page).click();
  await currentRow(page).click();
  await expect(menu(page)).toBeHidden();
  await expect(trigger(page)).toHaveText('Kasane Corporation');
});

test('the check sits at the current row’s trailing edge; names and the plus start together', async ({ page }) => {
  await gotoStory(page, 'product-orgswitcher--default');
  await trigger(page).click();
  const g = await menu(page).evaluate((root) => {
    // Measure the text itself, not its element: "Create Workspace" is a bare
    // text node inside the item, and the item's own box starts at the padding.
    const names = ['Kasane Corporation', 'Kasane Americas, Inc.', 'Kasane Europe GmbH'];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const lefts: number[] = [];
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (!names.includes(n.textContent ?? '')) continue;
      const range = document.createRange();
      range.selectNodeContents(n);
      lefts.push(Math.round(range.getBoundingClientRect().left));
    }
    const rows = [...root.querySelectorAll('[role="menuitem"]')];
    const current = rows.find((r) => r.getAttribute('aria-label')?.endsWith(', current'))!;
    const create = rows.at(-1)!;
    const rowBox = current.getBoundingClientRect();
    const padRight = parseFloat(getComputedStyle(current).paddingRight);
    return {
      lefts,
      plusLeft: Math.round(create.querySelector('svg')!.getBoundingClientRect().left),
      checkRight: Math.round(current.querySelector('svg')!.getBoundingClientRect().right),
      rowContentRight: Math.round(rowBox.right - padRight),
      currentSvgs: current.querySelectorAll('svg').length,
    };
  });
  expect(g.lefts).toHaveLength(3);
  expect(new Set([...g.lefts, g.plusLeft]).size).toBe(1);
  // One mark only: the check, where the chevron used to be.
  expect(g.currentSvgs).toBe(1);
  expect(g.checkRight).toBe(g.rowContentRight);
});

test('spaced density: 36px rows 4px apart, a 28px label row, 6px row corners', async ({ page }) => {
  await gotoStory(page, 'product-orgswitcher--default');
  await trigger(page).click();
  const rows = menu(page).getByRole('menuitem');
  // evaluateAll does not wait: settle on all four rows first.
  await expect(rows).toHaveCount(4);
  const boxes = await rows.evaluateAll((els) => els.map((el) => el.getBoundingClientRect().toJSON()));
  // Rounded: the popup slides in on a transform, so mid-animation boxes come
  // back a few millionths off (35.99999). The gaps below are differences of
  // boxes under the same transform, so they hold.
  for (const b of boxes) expect(Math.round(b.height)).toBe(36);
  for (let i = 1; i < 3; i++) expect(boxes[i].y - (boxes[i - 1].y + boxes[i - 1].height)).toBeCloseTo(4, 1);

  const labelH = await menu(page)
    .locator('[data-slot="menu-label"]')
    .evaluate((el) => el.getBoundingClientRect().height);
  expect(Math.round(labelH)).toBe(28);

  const s = await rows.first().evaluate((el) => {
    const cs = getComputedStyle(el);
    return { radius: cs.borderTopLeftRadius, prop: cs.transitionProperty, duration: cs.transitionDuration };
  });
  expect(s.radius).toBe('0px'); // --radius-md, square since 2026-10-16 (§7.7)
  expect(s.prop).toContain('background-color');
  expect(s.duration).toBe('0.075s');
});

test('elevation: step and border alone, no shadow in either mode (§4)', async ({ page }) => {
  // Tailwind composes box-shadow from several layers; an unset one computes
  // as a transparent zero shadow rather than disappearing, so count only the
  // layers that paint.
  const painted = () =>
    menu(page).evaluate((el) => {
      const shadow = getComputedStyle(el).boxShadow;
      if (shadow === 'none') return 0;
      return shadow.split(/,(?![^(]*\))/).filter((l) => !l.trim().startsWith('rgba(0, 0, 0, 0)')).length;
    });

  // Spaced menus had a light-mode shadow-md until 2026-10-19. A popup is
  // raised, not an overlay: only Dialog and the sidebar peek carry one.
  for (const mode of ['light', 'dark'] as const) {
    await gotoStory(page, 'product-orgswitcher--default', mode);
    await trigger(page).click();
    await expect(menu(page)).toBeVisible();
    expect(await painted(), mode).toBe(0);
  }
});

test('picking another org switches and closes the menu', async ({ page }) => {
  await gotoStory(page, 'product-orgswitcher--default');
  await trigger(page).click();
  await item(page, 'Kasane Americas, Inc.').click();
  await expect(menu(page)).toBeHidden();
  await expect(trigger(page)).toHaveText('Kasane Americas, Inc.');

  await trigger(page).click();
  await expect(currentRow(page)).toHaveAccessibleName('Kasane Americas, Inc., current');
});

test('the trigger truncates inside its 240px band', async ({ page }) => {
  await gotoStory(page, 'product-orgswitcher--long-names');
  const width = await trigger(page).evaluate((el) => el.getBoundingClientRect().width);
  expect(width).toBeLessThanOrEqual(240);
});

test('only a truncated name gets a tooltip', async ({ page }) => {
  await gotoStory(page, 'product-orgswitcher--long-names');
  await trigger(page).click();

  const long = 'Kasane (Shanghai) Trading Co., Ltd. (卡萨内（上海）贸易有限公司)';
  await page.getByText(long, { exact: true }).hover();
  await expect(page.locator('[data-slot="tooltip-content"]')).toHaveText(long);

  // Rows' tooltips sit inline-end, beside the menu, so the next row is still reachable,
  // exactly Tooltip's 4px clear of its edge. Exact, not `>=`: the offset is built from
  // the popup's tokens, and a `>=` passed while a stale literal shrank the gap to 2px.
  // Polled, both boxes together: the popup slides in from 8px inboard.
  await expect
    .poll(async () => {
      const m = (await menu(page).boundingBox())!;
      const t = (await page.locator('[data-slot="tooltip-content"]').boundingBox())!;
      return Math.round(t.x - (m.x + m.width));
    })
    .toBe(4);

  await item(page, 'Kasane UK Ltd').hover();
  await expect(item(page, 'Kasane UK Ltd')).toHaveAttribute('data-highlighted', '');
  // Wait out the 300ms delay plus margin before asserting absence.
  await page.waitForTimeout(600);
  await expect(page.locator('[data-slot="tooltip-content"]')).toHaveCount(0);
});
