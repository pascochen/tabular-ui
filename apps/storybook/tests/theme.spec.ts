import { expect, test, type Page } from '@playwright/test';

import { gotoStory, story } from './helpers';

/**
 * `useTheme`, through the Lib/useTheme story. The hook is the one place an
 * app sets `data-theme`, so these pin what it promises: it starts in the
 * given mode, a choice applies at once, System follows the OS live, and a
 * remembered choice survives a reload.
 */

const STORY = 'lib-usetheme--default';
/** The chosen option's label, without the trigger's caret glyph. */
const shown = (page: Page) => page.getByRole('combobox', { name: 'Theme' }).locator('[data-slot="select-value"]');
const applied = (page: Page) => page.evaluate(() => document.documentElement.getAttribute('data-theme'));

/**
 * Waits for the story to render, i.e. for its decorator to set `data-theme`.
 * This test cannot use `gotoStory` (its URL carries `args`), so it waits here,
 * for the same reason and as long: a cold dev server took ~8–11s to render the
 * first page of a run on 2026-10-15, and `expect.poll`'s default 5s failed this
 * test whenever it ran early in a cold run. It asserts no value, so the long
 * wait hides no failure; the `applied` checks after it keep the 5s default.
 */
const rendered = (page: Page) =>
  page.waitForFunction(() => document.documentElement.hasAttribute('data-theme'), undefined, { timeout: 20_000 });

async function choose(page: Page, label: 'System' | 'Dark' | 'Light') {
  await page.getByRole('combobox', { name: 'Theme' }).click();
  await page.getByRole('option', { name: label }).click();
}

for (const mode of ['dark', 'light'] as const) {
  test(`starts in the mode it is given (${mode})`, async ({ page }) => {
    await gotoStory(page, STORY, mode);
    expect(await applied(page)).toBe(mode);
    await expect(page.getByTestId('mode-in-effect')).toHaveText(`The page is in ${mode} mode.`);
  });
}

test('a choice applies at once', async ({ page }) => {
  await gotoStory(page, STORY, 'dark');
  await choose(page, 'Light');
  await expect.poll(() => applied(page)).toBe('light');
  await expect(shown(page)).toHaveText('Light');
  await choose(page, 'Dark');
  await expect.poll(() => applied(page)).toBe('dark');
});

test('System follows the OS setting, and keeps following it', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await gotoStory(page, STORY, 'dark');
  await choose(page, 'System');
  await expect.poll(() => applied(page), { message: 'OS light' }).toBe('light');
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect.poll(() => applied(page), { message: 'OS switched to dark' }).toBe('dark');
});

test('a remembered choice survives a reload', async ({ page }) => {
  const url = `${story(STORY, 'dark')}&args=storageKey:tui-theme-test`;
  await page.goto(url);
  await rendered(page);
  await expect.poll(() => applied(page)).toBe('dark');
  await choose(page, 'Light');
  await expect.poll(() => applied(page)).toBe('light');
  expect(await page.evaluate(() => localStorage.getItem('tui-theme-test'))).toBe('light');

  // The toolbar still says dark; the user's choice wins over the default.
  await page.reload();
  await rendered(page);
  await expect.poll(() => applied(page)).toBe('light');
  await expect(shown(page)).toHaveText('Light');
});
