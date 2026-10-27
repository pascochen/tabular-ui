import { readFileSync } from 'node:fs';

import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * Page-level checks every route must pass (docs/site.md §11). Routes are added
 * here as they are built.
 */
const componentPages = [
  'chat-starter',
  'chat-composer',
  'agent-reasoning',
  'agent-plan',
  'lineage-tree',
  'attachment-row',
  'agent-block',
  'chat-thread',
  'run-log-row',
  'status-badge',
].map((name) => `/components/${name}`);

const routes = [
  '/',
  '/principles',
  ...componentPages,
  '/vocabulary',
  '/foundations/color',
  '/foundations/typography',
  '/foundations/density',
  '/getting-started',
  '/404',
];

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

test.describe('a path with no page', () => {
  test('answers 404 with the 404 page, rendered once', async ({ page, request }) => {
    const response = await request.get('/no-such-page');
    expect(response.status()).toBe(404);
    expect(await response.text()).toContain('Page not found');
    await page.goto('/no-such-page');
    await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true');
    await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible();
    await expect(page.locator('a[href="#main"]')).toHaveCount(1);
  });
});

test.describe('getting started', () => {
  test('shows the README’s own commands', async ({ page }) => {
    await page.goto('/getting-started');
    await expect(page.getByText('pnpm add tabular-ui @phosphor-icons/react')).toBeVisible();
    await expect(page.getByText("@import './components/tabular-ui/tokens.css';")).toBeVisible();
  });
});

test.describe('component pages', () => {
  for (const route of componentPages) {
    // A pair whose two plates read the same shows no change at all. The lineage
    // pair shipped that way once: LineageTree expands everything when
    // defaultExpanded is omitted, so its "before" was already open.
    test(`${route}: the before and after plates differ`, async ({ page }) => {
      await page.goto(route);
      await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true');
      const plates = page.locator('#pair-title ~ figure [data-theme="dark"]');
      await expect(plates).toHaveCount(2);
      const [before, after] = await plates.allInnerTexts();
      expect(before).not.toBe(after);
    });
  }
});

test.describe('the component grid', () => {
  // On Home since 2026-10-26 (owner). Vercel answers /components with a 308 to
  // it; the test server serves files only, so the redirect is checked in vercel.json.
  test('is on Home, and /components redirects there', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#components').getByRole('heading', { level: 2 })).toHaveText('15 components');
    const vercel = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8')) as {
      redirects: { source: string; destination: string; permanent: boolean }[];
    };
    expect(vercel.redirects).toContainEqual({ source: '/components', destination: '/#components', permanent: true });
  });
});

test.describe('the wordmark', () => {
  // It's a brand mark, used unchanged (CLAUDE.md, "Brand assets"). As a ghost
  // button it took the button's hover overlay, a grey wash over the mark
  // (owner, 2026-10-26). Hover now paints nothing.
  test('paints nothing over the mark on hover', async ({ page }) => {
    await page.goto('/');
    const home = page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Tabular UI' });
    await home.hover();
    const painted = await home.evaluate((el) => {
      const after = getComputedStyle(el, '::after');
      return {
        background: getComputedStyle(el).backgroundColor,
        after: after.content === 'none' ? 'none' : after.backgroundColor,
        image: getComputedStyle(el.querySelector('img')!).opacity,
      };
    });
    expect(painted).toEqual({ background: 'rgba(0, 0, 0, 0)', after: 'none', image: '1' });
  });
});

test.describe('the demo, while it is not ready', () => {
  // Owner, 2026-10-26: every demo action reads "Demo (soon)" and is disabled,
  // and no page links to demo.tabularui.com.
  test('is a disabled "Demo (soon)" in the nav, the hero and the closing band, and a link nowhere', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true');
    const soon = page.getByRole('button', { name: 'Demo (soon)' });
    await expect(soon).toHaveCount(3);
    for (const button of await soon.all()) await expect(button).toBeDisabled();
    await expect(page.locator('a[href*="demo.tabularui.com"]')).toHaveCount(0);
    await expect(page.getByRole('contentinfo').getByText('Demo (soon)')).toBeVisible();
  });
});

test.describe('the Color page’s ramps', () => {
  // Ledger has a twelfth step, 925, the dark raised surface. On a shared
  // 12-column grid it pushed ledger's 950 a column right of every other
  // ramp's (owner, 2026-10-27). 925 now sits apart, labelled.
  test('line up step by step, with ledger-925 set apart and labelled', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/foundations/color');
    const ramps = page.locator('#ramps-title').locator('xpath=ancestor::section[1]');
    const x = (ramp: string, step: string) =>
      ramps
        .locator('li', { has: page.locator('p', { hasText: new RegExp(`^${ramp}`, 'i') }) })
        .locator('li', { has: page.locator(`code:text-is("${step}")`) })
        .first()
        .evaluate((el) => Math.round(el.getBoundingClientRect().left));
    for (const step of ['50', '500', '900', '950']) expect(await x('ledger', step)).toBe(await x('sage', step));
    const extra = ramps.getByRole('list', { name: 'ledger’s extra step' });
    await expect(extra.locator('code')).toHaveText('925');
    await expect(extra).toContainText('Dark raised surface');
    expect(await x('ledger', '925')).toBeGreaterThan(await x('ledger', '950'));
    // The ramp's name is capitalised; its note in brackets is not.
    // (getByText reads the DOM, not the rendered case, so check the computed style.)
    await expect(ramps.getByText('(the neutral, with one extra step)')).toHaveCSS('text-transform', 'none');
  });
});
