import { expect, test, type Page } from '@playwright/test';

import { gotoStory } from './helpers';

/**
 * AccountMenu owns three things a story cannot assert: when the avatar
 * animates (row hover only; never at rest, while open, or under reduced
 * motion), the ring in the avatar's 2px border (hover, open, keyboard focus),
 * and the Theme radio group. Geometry is asserted against the footer band the
 * story renders, which matches AppShell's.
 */

const STORY = 'product-accountmenu--default';

const row = (page: Page) => page.locator('[data-slot="account-menu"]');
const trigger = (page: Page) => row(page).locator('[data-slot="menu-trigger"]');
const ring = (page: Page) => page.locator('[data-slot="account-avatar-ring"]');
const menu = (page: Page) => page.locator('[data-slot="menu-content"]');
const rowAnimated = (page: Page) => row(page).locator('[data-slot="avatar-animated"]');
const headerAnimated = (page: Page) => page.locator('[data-slot="account-menu-header"] [data-slot="avatar-animated"]');
const themeItem = (page: Page, name: 'Dark' | 'Light' | 'System') => page.getByRole('menuitemradio', { name });
const dataTheme = (page: Page) => page.evaluate(() => document.documentElement.getAttribute('data-theme'));

const TRANSPARENT = 'rgba(0, 0, 0, 0)';
const ringColor = (page: Page) => ring(page).evaluate((el) => getComputedStyle(el).outlineColor);

test('row geometry: 32px row, 28px ring, 24px image on the text line, 6px to the name', async ({ page }) => {
  await gotoStory(page, STORY);
  const g = await row(page).evaluate((el) => {
    const band = el.parentElement!.getBoundingClientRect();
    const box = (sel: string) => {
      const r = el.querySelector(sel)!.getBoundingClientRect();
      return { x: r.left - band.left, w: r.width, h: r.height, right: r.right - band.left };
    };
    return {
      row: el.getBoundingClientRect().height,
      ring: box('[data-slot="account-avatar-ring"]'),
      image: box('[data-slot="avatar"]'),
      name: box('[data-slot="menu-trigger"] > span.truncate'),
    };
  });
  expect(g.row).toBe(32);
  expect(g.ring).toMatchObject({ w: 28, h: 28 });
  expect(g.image).toMatchObject({ w: 24, h: 24 });
  // The sidebar's text line: 16px gutter + 1px border + --pad-sidebar-item.
  expect(g.image.x).toBe(25);
  expect(g.name.x - g.ring.right).toBe(6);
});

test('the trigger is the row’s only control: settings live in the menu', async ({ page }) => {
  await gotoStory(page, STORY);
  await expect(row(page).getByRole('button')).toHaveCount(1);
  await expect(row(page).getByRole('button', { name: 'Settings' })).toHaveCount(0);
});

test('the trigger is the avatar and the name, named by the full name', async ({ page }) => {
  await gotoStory(page, STORY);
  await expect(trigger(page)).toHaveAccessibleName('Mei Tachibana, account');
  // The name is a target too.
  await row(page).getByText('Mei', { exact: true }).click();
  await expect(menu(page)).toBeVisible();
});

test('the avatar is still at rest and plays only while a mouse is over the row', async ({ page }) => {
  await gotoStory(page, STORY);
  await expect(rowAnimated(page)).toHaveCount(0);

  // Anywhere on the row counts — here, past the name, off the trigger.
  const w = await row(page).evaluate((el) => el.getBoundingClientRect().width);
  await row(page).hover({ position: { x: w - 4, y: 16 } });
  await expect(rowAnimated(page)).toHaveCount(1);

  await page.mouse.move(600, 100);
  await expect(rowAnimated(page)).toHaveCount(0);
});

test('keyboard focus does not animate the avatar', async ({ page }) => {
  await gotoStory(page, STORY);
  await page.keyboard.press('Tab');
  await expect(trigger(page)).toBeFocused();
  await expect(rowAnimated(page)).toHaveCount(0);
});

test('open: the row avatar stops and the header avatar loops', async ({ page }) => {
  await gotoStory(page, STORY);
  await trigger(page).click();
  await expect(menu(page)).toBeVisible();
  await expect(headerAnimated(page)).toHaveCount(1);
  // The pointer is still over the row, and the row still does not play.
  await expect(rowAnimated(page)).toHaveCount(0);
});

test('the ring: transparent at rest, neutral on hover and while open, focus colour for keyboard', async ({ page }) => {
  await gotoStory(page, STORY);
  expect(await ringColor(page)).toBe(TRANSPARENT);
  // Drawn inside the 2px border, never outside the 28px box (§4 inset ring).
  expect(await ring(page).evaluate((el) => getComputedStyle(el).outlineOffset)).toBe('-2px');

  await trigger(page).hover();
  await expect.poll(() => ringColor(page)).not.toBe(TRANSPARENT);
  const hover = await ringColor(page);

  await trigger(page).click();
  await page.mouse.move(600, 100);
  expect(await ringColor(page)).toBe(hover);

  await page.keyboard.press('Escape');
  await expect(menu(page)).toBeHidden();
  await page.mouse.move(600, 100);
  // Escape returns focus to the trigger by keyboard, so :focus-visible applies.
  const focus = await ringColor(page);
  expect(focus).not.toBe(TRANSPARENT);
  expect(focus).not.toBe(hover);
});

/** A colour token resolved by the browser, in the form `getComputedStyle` reports. */
const resolvedColor = (page: Page, name: string) =>
  page.evaluate((n) => {
    const probe = document.createElement('span');
    probe.style.color = `var(${n})`;
    document.body.append(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  }, name);

const nameColor = (page: Page) =>
  trigger(page).evaluate((el) => getComputedStyle(el.querySelector('span.truncate')!).color);

for (const theme of ['dark', 'light'] as const) {
  test(`${theme}: the name takes the nav rows' text steps — secondary at rest, body on hover and while open`, async ({
    page,
  }) => {
    await gotoStory(page, STORY, theme);
    const secondary = await resolvedColor(page, '--color-text-secondary');
    const body = await resolvedColor(page, '--color-text-body');
    expect(secondary).not.toBe(body);

    expect(await nameColor(page)).toBe(secondary);

    await trigger(page).hover();
    await expect.poll(() => nameColor(page)).toBe(body);

    await trigger(page).click();
    await expect(menu(page)).toBeVisible();
    await page.mouse.move(600, 100);
    expect(await nameColor(page)).toBe(body);
  });
}

test('Theme is a radio group: picking flips data-theme and keeps the menu open', async ({ page }) => {
  await gotoStory(page, STORY, 'dark');
  await trigger(page).click();
  await expect(themeItem(page, 'Dark')).toHaveAttribute('aria-checked', 'true');
  await expect(themeItem(page, 'Light')).toHaveAttribute('aria-checked', 'false');

  await themeItem(page, 'Light').click();
  await expect(themeItem(page, 'Light')).toHaveAttribute('aria-checked', 'true');
  await expect(menu(page)).toBeVisible();
  expect(await dataTheme(page)).toBe('light');

  await themeItem(page, 'Dark').click();
  expect(await dataTheme(page)).toBe('dark');
});

test('System follows the OS setting, and keeps following it', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await gotoStory(page, STORY, 'dark');
  await trigger(page).click();
  await themeItem(page, 'System').click();
  await expect(themeItem(page, 'System')).toHaveAttribute('aria-checked', 'true');
  await expect(themeItem(page, 'Dark')).toHaveAttribute('aria-checked', 'false');
  await expect.poll(() => dataTheme(page), { message: 'OS light' }).toBe('light');
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect.poll(() => dataTheme(page), { message: 'OS switched to dark' }).toBe('dark');
  // Still System: the OS changed the mode, not the user's choice.
  await expect(themeItem(page, 'System')).toHaveAttribute('aria-checked', 'true');
});

test('the Theme group is labelled, and its rows start on the other rows’ text', async ({ page }) => {
  await gotoStory(page, STORY);
  await trigger(page).click();
  await expect(menu(page).getByRole('group', { name: 'Theme' })).toBeVisible();

  const lefts = await menu(page).evaluate((root) => {
    const names = ['Your profile', 'Dark', 'Light', 'System', 'Workspace settings', 'Sign out'];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const out: number[] = [];
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (!names.includes(n.textContent?.trim() ?? '')) continue;
      const range = document.createRange();
      range.selectNodeContents(n);
      out.push(Math.round(range.getBoundingClientRect().left));
    }
    return out;
  });
  expect(lefts).toHaveLength(6);
  expect(new Set(lefts).size).toBe(1);
});

test('the menu: header, profile, theme, workspace settings, billing, homepage, sign out', async ({ page }) => {
  await gotoStory(page, STORY);
  await trigger(page).click();
  await expect(page.locator('[data-slot="account-menu-header"]')).toContainText('Mei Tachibana');
  await expect(page.locator('[data-slot="account-menu-header"]')).toContainText('mei.tachibana@kasane.example');
  await expect(menu(page).locator('[role^="menuitem"]')).toHaveText([
    'Your profile',
    'Dark',
    'Light',
    'System',
    'Workspace settings',
    'Subscription and billing',
    'Homepage',
    'Sign out',
  ]);
});

test('spaced density: 36px rows, as in the switchers', async ({ page }) => {
  await gotoStory(page, STORY);
  await trigger(page).click();
  const items = menu(page).locator('[role^="menuitem"]');
  await expect(items).toHaveCount(8);
  const h = await items.evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().height)));
  expect(new Set(h)).toEqual(new Set([36]));
});

/*
 * `page.emulateMedia`, not `test.use({ reducedMotion })`: the fixture form does
 * not reach the page from a nested describe (see reduced-motion.spec.ts), and
 * the assertion would pass against an avatar that was never gated.
 */
test('under reduced motion, neither avatar ever animates', async ({ page }) => {
  await gotoStory(page, STORY);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);

  await row(page).hover();
  await trigger(page).click();
  await expect(menu(page)).toBeVisible();
  await expect(page.locator('[data-slot="avatar-animated"]')).toHaveCount(0);
});
