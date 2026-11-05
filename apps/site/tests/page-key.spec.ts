import { expect, test, type Page } from '@playwright/test';

/**
 * PROTOTYPE: the keyed page heads (docs/reviews/inner-page-heads-2026-11-05.md).
 * Each claim the review measured by hand, as a test: the plate starts at the
 * title, the key shows from `lg` only, its name column reaches the plate's
 * right edge, every name it gives is real, and the head stays still, Vocabulary's
 * working badge included. Geometry is asserted exactly, after the fonts load,
 * because a box measured mid-swap is a different box (failure log, Tabs).
 */

const keyed = {
  '/foundations/color': 'What each color marks',
  '/foundations/typography': 'What each family is for',
  '/foundations/density': 'The three caps',
  '/vocabulary': 'One word per state',
} as const;

type Route = keyof typeof keyed;
const states = ['before hydration', 'hydrated'] as const;

async function hold(page: Page, route: string, state: (typeof states)[number]) {
  if (state === 'before hydration') {
    await page.route(/\.js$/, (r) => r.abort());
    await page.goto(route);
    await expect(page.locator('html')).not.toHaveAttribute('data-hydrated');
  } else {
    await page.goto(route);
    await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true');
  }
  await page.evaluate(() => document.fonts.ready);
}

const head = (page: Page) => page.locator('main > section').first();
const key = (page: Page, route: Route) => head(page).getByRole('list', { name: keyed[route] });
/** The plate's outer frame: SpecimenFrame's border box, two levels above the list. */
const frame = (page: Page, route: Route) => key(page, route).locator('xpath=../..');

for (const route of Object.keys(keyed) as Route[]) {
  test.describe(`${route}'s key`, () => {
    for (const state of states) {
      test(`${state}: the plate's top is the title's top, at 1280px`, async ({ page }) => {
        await hold(page, route, state);
        const plate = await frame(page, route).boundingBox();
        const title = await head(page).locator('h1').boundingBox();
        expect(plate!.y).toBe(title!.y);
      });

      test(`${state}: the key shows from 1024px and not below`, async ({ page }) => {
        await page.setViewportSize({ width: 1024, height: 800 });
        await hold(page, route, state);
        await expect(key(page, route)).toBeVisible();
        await page.setViewportSize({ width: 1023, height: 800 });
        await expect(key(page, route)).toBeHidden();
        await page.setViewportSize({ width: 390, height: 844 });
        await expect(key(page, route)).toBeHidden();
      });

      test(`${state}: the head runs no animation, without reduced motion`, async ({ page }) => {
        await hold(page, route, state);
        // A spinner's lap starts on mount; give a late one time to begin before asserting none did.
        await page.waitForTimeout(300);
        const running = await head(page).evaluate(
          (el) => el.getAnimations({ subtree: true }).filter((a) => a.playState === 'running').length,
        );
        expect(running).toBe(0);
        await expect(head(page).locator('[data-slot="spinner"]')).toHaveCount(0);
      });
    }

    test('the name column reaches the plate, and rows are ruled at the row height', async ({ page }) => {
      await hold(page, route, 'hydrated');
      const rows = await key(page, route).evaluate((ul) => {
        const right = ul.getBoundingClientRect().right;
        return [...ul.children].map((li, i) => ({
          i,
          nameRight: li.lastElementChild!.getBoundingClientRect().right,
          right,
          height: li.getBoundingClientRect().height,
          rule: getComputedStyle(li).borderTopWidth,
        }));
      });
      const rowHeight = await page.evaluate(() =>
        parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--h-row-sm')),
      );
      for (const row of rows) {
        // The name's box ends at the list's edge, and its text is set to that edge.
        expect(row.nameRight, `row ${row.i}`).toBe(row.right);
        expect(row.height, `row ${row.i}`).toBeGreaterThanOrEqual(rowHeight);
        expect(row.rule, `row ${row.i}`).toBe(row.i === 0 ? '0px' : '1px');
      }
      await expect(key(page, route).locator('li > code').first()).toHaveCSS('text-align', 'right');
    });

    test('every name the key gives is real', async ({ page }) => {
      await hold(page, route, 'hydrated');
      const names = await key(page, route).locator('li > code').allTextContents();
      expect(names.length).toBeGreaterThan(0);
      const unresolved = await page.evaluate(
        ({ names, route }) => {
          const root = getComputedStyle(document.documentElement);
          return names.filter((name) => {
            // A token resolves on the root; a role names a fill token; a status names a badge on the page.
            if (name.startsWith('--')) return root.getPropertyValue(name).trim() === '';
            if (route === '/vocabulary') return !document.querySelector(`main [data-status="${name}"]`);
            return root.getPropertyValue(`--color-fill-${name}`).trim() === '';
          });
        },
        { names, route },
      );
      expect(unresolved).toEqual([]);
    });
  });
}

test("Vocabulary's still badge is the real badge, standing still", async ({ page }) => {
  await hold(page, '/vocabulary', 'hydrated');
  const still = head(page).locator('[data-status="agent-working"]');
  // The real one, in the Statuses list below the head.
  const real = page.locator('main > section').nth(3).locator('[data-status="agent-working"]');
  await expect(real).toHaveCount(1);
  // textContent, not innerText: innerText applies the badge's uppercase.
  await expect(still).toHaveText((await real.textContent())!);
  const [a, b] = await Promise.all([still.boundingBox(), real.boundingBox()]);
  expect([a!.width, a!.height]).toEqual([b!.width, b!.height]);
  for (const prop of ['background-color', 'color', 'font-size', 'font-weight', 'text-transform']) {
    await expect(still).toHaveCSS(prop, await real.evaluate((el, p) => getComputedStyle(el).getPropertyValue(p), prop));
  }
  // It keeps a mark: a still icon where the spinner would be, hidden from assistive technology as the spinner is.
  await expect(still.locator('svg[aria-hidden="true"]')).toHaveCount(1);
});
