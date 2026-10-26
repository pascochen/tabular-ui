import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * Page-level checks every route must pass (docs/site.md §11). Routes are added
 * here as they are built.
 */
const routes = ['/', '/plates'];

// WCAG 2.2 AA, every level up to it. No rule is disabled: an exception needs
// the owner's approval and a written reason.
const wcagTags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

const widths = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'phone', width: 390, height: 844 },
];

for (const route of routes) {
  test.describe(route, () => {
    test('is light, English, and titled', async ({ page }) => {
      await page.goto(route);
      const html = page.locator('html');
      await expect(html).toHaveAttribute('data-theme', 'light');
      await expect(html).toHaveAttribute('lang', 'en');
      await expect(page).toHaveTitle(/\S/);
    });

    test('has one h1, headings in order, and the landmarks', async ({ page }) => {
      await page.goto(route);
      await expect(page.locator('h1')).toHaveCount(1);
      const levels = await page
        .locator('h1, h2, h3, h4, h5, h6')
        .evaluateAll((els) => els.map((el) => Number(el.tagName[1])));
      levels.forEach((level, i) => {
        if (i > 0) expect(level, `heading ${i} skips a level`).toBeLessThanOrEqual(levels[i - 1] + 1);
      });
      await expect(page.locator('header')).toHaveCount(1);
      await expect(page.locator('main')).toHaveCount(1);
      await expect(page.locator('footer')).toHaveCount(1);
      for (const nav of await page.locator('nav').all()) await expect(nav).toHaveAttribute('aria-label', /\S/);
    });

    test('the skip link is the first focusable element and lands on main', async ({ page }) => {
      await page.goto(route);
      await page.keyboard.press('Tab');
      const skip = page.getByRole('link', { name: 'Skip to content' });
      await expect(skip).toBeFocused();
      await expect(skip).toBeInViewport();
      await page.keyboard.press('Enter');
      await expect(page.locator('main')).toBeFocused();
    });

    test('content is in the HTML before JavaScript runs, and the HTML is this page’s own', async ({
      page,
      request,
    }) => {
      const body = await (await request.get(route)).text();
      expect(body).toMatch(/<h1[\s>]/);
      // A host that answers with another route's HTML makes React hydrate over the
      // wrong markup, and the page renders twice with no error.
      const served = body.match(/<title>([^<]*)<\/title>/)?.[1];
      await page.goto(route);
      await expect(page).toHaveTitle(served ?? '');
      await expect(page.locator('a[href="#main"]')).toHaveCount(1);
    });

    test('does not scroll sideways at 320px (1.4.10)', async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 800 });
      await page.goto(route);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBe(0);
    });

    for (const { name, width, height } of widths) {
      test(`has no axe violations at WCAG 2.2 AA, ${name}`, async ({ page }) => {
        await page.setViewportSize({ width, height });
        await page.goto(route);
        const { violations } = await new AxeBuilder({ page }).withTags(wcagTags).analyze();
        expect(violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`)).toEqual([]);
      });
    }
  });
}
