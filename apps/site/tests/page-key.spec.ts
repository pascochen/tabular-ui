import { expect, test, type Page } from '@playwright/test';

/**
 * PROTOTYPE: the keyed page heads (docs/reviews/inner-page-heads-2026-11-05.md).
 * Each claim the review measured by hand, as a test: the plate starts at the
 * title, the key shows from `lg` only, its name column reaches the plate's
 * right edge, every name it gives is real, and the head stays still but for Vocabulary's
 * working badge, which spins as the product's does. Geometry is asserted exactly, after the fonts load,
 * because a box measured mid-swap is a different box (failure log, Tabs).
 */

const keyed = {
  '/foundations/color': 'What each color marks',
  '/foundations/typography': 'What each family is for',
  '/foundations/density': 'The three caps',
  '/foundations/motion': 'What motion is for',
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

      // Vocabulary's working badge spins, as it does in the product (owner, 2026-11-14), and so does
      // Motion's tracer, the one mark that loops (2026-11-24). Nothing else in a head moves.
      const spinners = route === '/vocabulary' || route === '/foundations/motion' ? 1 : 0;

      test(`${state}: nothing in the head moves but a working badge's spinner`, async ({ page }) => {
        await hold(page, route, state);
        // A spinner's lap starts on mount; give a late one time to begin before counting.
        await page.waitForTimeout(300);
        await expect(head(page).locator('[data-slot="spinner"]')).toHaveCount(spinners);
        const running = await head(page).evaluate((el) =>
          el
            .getAnimations({ subtree: true })
            .filter((a) => a.playState === 'running')
            .map((a) => {
              const target = (a.effect as KeyframeEffect | null)?.target;
              return target?.closest('[data-slot="spinner"]') ? 'spinner' : 'other';
            }),
        );
        expect(running.filter((r) => r === 'other')).toEqual([]);
        expect(running.length > 0).toBe(spinners > 0);
      });

      test(`${state}: under reduced motion the head is still`, async ({ page }) => {
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await hold(page, route, state);
        await page.waitForTimeout(300);
        const running = await head(page).evaluate(
          (el) => el.getAnimations({ subtree: true }).filter((a) => a.playState === 'running').length,
        );
        expect(running).toBe(0);
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
        // Measured, not parsed: the token is a formula since 2026-11-10 (design-system.md §7.6).
        (() => {
          const probe = document.createElement('div');
          probe.style.cssText = 'position:absolute;visibility:hidden;width:0;height:var(--h-row-sm)';
          document.body.append(probe);
          const height = probe.getBoundingClientRect().height;
          probe.remove();
          return height;
        })(),
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
            // A timing names a motion the Timing section lists.
            if (route === '/foundations/motion')
              return !document.getElementById('timing-title')?.closest('section')?.textContent?.includes(name);
            return root.getPropertyValue(`--color-fill-${name}`).trim() === '';
          });
        },
        { names, route },
      );
      expect(unresolved).toEqual([]);
    });
  });
}

test("Vocabulary's working badge is the real badge, spinner and all", async ({ page }) => {
  await hold(page, '/vocabulary', 'hydrated');
  const inHead = head(page).locator('[data-status="agent-working"]');
  // The same badge in the Statuses list below the head.
  const real = page.locator('main > section').nth(3).locator('[data-status="agent-working"]');
  await expect(real).toHaveCount(1);
  // The whole badge, mark included: the head once drew the robot where the product draws the Spinner.
  expect(await inHead.evaluate((el) => el.outerHTML)).toBe(await real.evaluate((el) => el.outerHTML));
  await expect(inHead.locator('svg')).toHaveCount(1);
});
