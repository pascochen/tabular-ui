import { expect, test, type Page } from '@playwright/test';

import { gotoStory } from './helpers';

/**
 * ProjectSwitcher is `ContextSwitcher` with the `block` trigger and a
 * submenu. The menu's density and keyboard are covered by
 * `org-switcher.spec.ts` (same component); this pins what `block` and the
 * submenu add — copy confirmation, the leading check — and: plain text at rest, the fill on hover and while open,
 * the caret at the far edge, keyboard-only focus ring, and label alignment.
 */

const STORY = 'product-projectswitcher--default';

const trigger = (page: Page) => page.locator('[data-slot="menu-trigger"]');
const label = (page: Page) => page.locator('[data-slot="context-switcher-label"]');
const menu = (page: Page) => page.locator('[data-slot="menu-content"]');
const currentRow = (page: Page) => page.getByRole('menuitem', { name: /, current$/ });
const item = (page: Page, name: string) => page.getByRole('menuitem', { name, exact: true });

test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

const TRANSPARENT = 'rgba(0, 0, 0, 0)';

/** The hover/press overlay is the trigger's `::after`, not its own background. */
const overlay = (page: Page) => trigger(page).evaluate((el) => getComputedStyle(el, '::after').backgroundColor);

test('at rest it reads as plain text: no fill, no visible border, no overlay', async ({ page }) => {
  await gotoStory(page, STORY);
  const s = await trigger(page).evaluate((el) => {
    const cs = getComputedStyle(el);
    return { bg: cs.backgroundColor, border: cs.borderTopColor, userSelect: cs.userSelect };
  });
  expect(s.bg).toBe(TRANSPARENT);
  expect(s.border).toBe(TRANSPARENT);
  expect(s.userSelect).toBe('none');
  expect(await overlay(page)).toBe(TRANSPARENT);
});

test('full width, with the caret at the far edge rather than beside the name', async ({ page }) => {
  await gotoStory(page, STORY);
  const g = await trigger(page).evaluate((el) => {
    // The container's content box — the band has its own gutter and border.
    const p = el.parentElement!;
    const ps = getComputedStyle(p);
    const parentW = p.clientWidth - parseFloat(ps.paddingLeft) - parseFloat(ps.paddingRight);
    const t = el.getBoundingClientRect();
    const caret = el.querySelector('svg')!.getBoundingClientRect();
    const range = document.createRange();
    range.selectNodeContents(el.querySelector('span')!);
    const text = range.getBoundingClientRect();
    const pad = parseFloat(getComputedStyle(el).paddingRight) + parseFloat(getComputedStyle(el).borderRightWidth);
    return {
      parentW,
      w: t.width,
      right: t.right,
      caretRight: caret.right,
      caretLeft: caret.left,
      textRight: text.right,
      pad,
    };
  });
  expect(g.w).toBe(g.parentW);
  expect(g.caretRight).toBeCloseTo(g.right - g.pad, 0);
  // The gap between a short name and the caret is the free width, not a fixed 8px.
  expect(g.caretLeft - g.textRight).toBeGreaterThan(8);
});

test('hover fills and darkens; the fill stays while the menu is open', async ({ page }) => {
  await gotoStory(page, STORY);
  const rest = await trigger(page).evaluate((el) => getComputedStyle(el).color);

  await trigger(page).hover();
  await expect.poll(() => overlay(page)).not.toBe(TRANSPARENT);
  const hoverFill = await overlay(page);
  await expect.poll(() => trigger(page).evaluate((el) => getComputedStyle(el).color)).not.toBe(rest);

  await trigger(page).click();
  await expect(trigger(page)).toHaveAttribute('aria-expanded', 'true');
  await item(page, 'FY2026 6+6 forecast').hover();
  // Pointer is off the trigger, so this is the open state, not :hover.
  expect(await overlay(page)).toBe(hoverFill);

  await page.keyboard.press('Escape');
  await page.mouse.move(600, 600);
  await expect.poll(() => overlay(page)).toBe(TRANSPARENT);
});

test('the focus ring paints for keyboard focus only', async ({ page }) => {
  await gotoStory(page, STORY);
  const outline = () => trigger(page).evaluate((el) => getComputedStyle(el).outlineStyle);

  await page.keyboard.press('Tab');
  await expect(trigger(page)).toBeFocused();
  expect(await outline()).toBe('solid');

  // Pointer focus paints no ring: open with the mouse, then close by clicking
  // the trigger again — a toggle, so no outside-press timing is involved.
  await page.keyboard.press('Shift+Tab');
  await trigger(page).click();
  await expect(menu(page)).toBeVisible();
  expect(await outline()).toBe('none');
  await trigger(page).click();
  await expect(menu(page)).toBeHidden();
  expect(await outline()).toBe('none');
});

test('the section label’s text starts on the trigger’s text', async ({ page }) => {
  await gotoStory(page, STORY);
  const textLeft = (el: Element) => {
    const range = document.createRange();
    range.selectNodeContents(el);
    return Math.round(range.getBoundingClientRect().left);
  };
  const labelLeft = await label(page).evaluate(textLeft);
  const nameLeft = await trigger(page).locator('span').first().evaluate(textLeft);
  expect(labelLeft).toBe(nameLeft);
});

test('named by its label and its value', async ({ page }) => {
  await gotoStory(page, STORY);
  await expect(trigger(page)).toHaveAccessibleName('Project FY2026 H1 close');
});

test('the menu drops out of the trigger at its width', async ({ page }) => {
  await gotoStory(page, STORY);
  await trigger(page).click();
  const t = await trigger(page).boundingBox();
  const m = await menu(page).boundingBox();
  expect(m!.width).toBeCloseTo(t!.width, 0);
  expect(m!.x).toBeCloseTo(t!.x, 0);
});

test('the current project’s submenu: edit, pin, copy ID, delete — and pin toggles', async ({ page }) => {
  await gotoStory(page, STORY);
  await trigger(page).focus();
  await page.keyboard.press('Enter');
  await expect(currentRow(page)).toBeFocused();
  await page.keyboard.press('ArrowRight');

  const sub = page.locator('[data-slot="menu-sub-content"] [role="menuitem"]');
  await expect(sub).toHaveText(['Edit project', 'Pin project', 'Copy project ID', 'Delete project']);
  await expect(item(page, 'Delete project')).toHaveAttribute('data-variant', 'danger');

  await item(page, 'Pin project').click();
  await trigger(page).click();
  await currentRow(page).hover();
  await expect(item(page, 'Unpin project')).toBeVisible();
});

test('copy writes the id, reads "Copied" for ~1.5s, and announces it', async ({ page }) => {
  await gotoStory(page, STORY);
  await trigger(page).click();
  await currentRow(page).hover();
  await item(page, 'Copy project ID').click();

  await expect(item(page, 'Copied')).toBeVisible();
  await expect(page.locator('[data-slot="menu-sub-content"]')).toBeVisible();
  await expect(page.getByRole('status')).toHaveText('Project ID copied');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('prj_01J8Q4');

  await expect(item(page, 'Copy project ID')).toBeVisible({ timeout: 2500 });
  await expect(page.getByRole('status')).toHaveText('');
});

test('with a submenu, the check leads and the chevron trails', async ({ page }) => {
  await gotoStory(page, STORY);
  await trigger(page).click();
  const g = await currentRow(page).evaluate((el) => {
    const cs = getComputedStyle(el);
    const box = el.getBoundingClientRect();
    const [check, chevron] = [...el.querySelectorAll('svg')].map((s) => s.getBoundingClientRect());
    return {
      count: el.querySelectorAll('svg').length,
      checkInset: check.left - box.left,
      chevronInset: box.right - chevron.right,
      padLeft: parseFloat(cs.paddingLeft),
      padRight: parseFloat(cs.paddingRight),
    };
  });
  expect(g.count).toBe(2);
  // The check centres in the 14px leading slot; a 14px icon fills it.
  expect(g.checkInset).toBeCloseTo(g.padLeft, 0);
  expect(g.chevronInset).toBeCloseTo(g.padRight, 0);
});
