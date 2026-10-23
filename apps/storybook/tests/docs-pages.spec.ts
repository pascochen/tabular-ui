import { expect, test, type Page } from '@playwright/test';

import { contrastRatio } from './helpers';

/**
 * Docs pages follow the toolbar's mode (.storybook/ThemedDocsContainer.tsx).
 * Until 2026-10-11 Storybook drew every Docs page white, so in dark mode the
 * stories' near-white text sat on white: found in human review, on the Tabs
 * page, where the selected tab's label all but vanished. The story view and
 * the screenshots were fine, so nothing caught it.
 *
 * Contrast is measured against the first opaque ground behind the text, which
 * is what a reader actually sees, not against a token.
 */

/** The text colour of `selector`, and the first opaque background behind it. */
const textAndGround = (page: Page, selector: string) =>
  page
    .locator(selector)
    .first()
    .evaluate((el) => {
      let ground = 'rgb(255, 255, 255)';
      for (let n: Element | null = el; n; n = n.parentElement) {
        const c = getComputedStyle(n).backgroundColor;
        if (c !== 'rgba(0, 0, 0, 0)' && !/[,/]\s*0\)$/.test(c)) {
          ground = c;
          break;
        }
      }
      return { text: getComputedStyle(el).color, ground };
    });

for (const mode of ['dark', 'light'] as const) {
  test(`a Docs page is readable in ${mode}: the stories and the page's own text`, async ({ page }) => {
    await page.goto(`/iframe.html?viewMode=docs&id=foundational-tabs--docs&globals=theme:${mode}`);
    await page.waitForSelector('[data-slot="tabs-trigger"][data-active]');
    await expect.poll(() => page.evaluate(() => document.documentElement.getAttribute('data-theme'))).toBe(mode);

    const tab = await textAndGround(page, '[data-slot="tabs-trigger"][data-active]');
    const title = await textAndGround(page, '.sbdocs-title');
    expect(await contrastRatio(page, tab.text, tab.ground), 'selected tab label').toBeGreaterThanOrEqual(4.5);
    expect(await contrastRatio(page, title.text, title.ground), 'page title').toBeGreaterThanOrEqual(4.5);
  });
}
