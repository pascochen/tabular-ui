import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * Page-level checks every route must pass (docs/site.md §11). Routes are added
 * here as they are built.
 */
const routes = ['/'];

// WCAG 2.2 AA, every level up to it. No rule is disabled: an exception needs
// the owner's approval and a written reason.
const wcagTags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

for (const route of routes) {
  test.describe(route, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(route);
    });

    test('is light, English, and titled', async ({ page }) => {
      const html = page.locator('html');
      await expect(html).toHaveAttribute('data-theme', 'light');
      await expect(html).toHaveAttribute('lang', 'en');
      await expect(page).toHaveTitle(/\S/);
    });

    test('has exactly one h1 and a main landmark', async ({ page }) => {
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('main')).toHaveCount(1);
    });

    test('content is in the HTML before JavaScript runs', async ({ request }) => {
      const body = await (await request.get(route)).text();
      expect(body).toMatch(/<h1[\s>]/);
    });

    test('has no axe violations at WCAG 2.2 AA', async ({ page }) => {
      const { violations } = await new AxeBuilder({ page }).withTags(wcagTags).analyze();
      expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
    });
  });
}
