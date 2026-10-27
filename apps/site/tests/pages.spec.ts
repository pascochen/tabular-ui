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
      // Every nav has a name, from aria-label or from visible text it points at (aria-labelledby).
      for (const nav of await page.locator('nav').all()) await expect(nav).toHaveAccessibleName(/\S/);
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
  // On Home since 2026-10-26 (owner): the overview, reached from the hero.
  test('is on Home, reached from the hero', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#components').getByRole('heading', { level: 2 })).toHaveText('15 components');
    await expect(page.getByRole('link', { name: 'Browse components' })).toHaveAttribute('href', '/#components');
  });
});

test.describe('Components in the nav', () => {
  // Owner, 2026-10-27: Components opens the run at its first component, and
  // previous and next walk it. Vercel answers /components with a 307 there;
  // the test server serves files only, so the redirect is checked in vercel.json.
  test('opens the first component, and /components redirects to it', async ({ page }) => {
    await page.goto('/');
    const nav = page.getByRole('navigation', { name: 'Main' });
    await expect(nav.getByRole('link', { name: 'Components' })).toHaveAttribute('href', '/components/chat-starter');
    const vercel = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8')) as {
      redirects: { source: string; destination: string; permanent: boolean }[];
    };
    expect(vercel.redirects).toContainEqual({
      source: '/components',
      destination: '/components/chat-starter',
      permanent: false,
    });
    await page.goto('/components/chat-starter');
    await expect(nav.getByRole('link', { name: 'Components' })).toHaveAttribute('aria-current', 'page');
  });

  test('is followed by Get started, and the footer uses the nav’s names', async ({ page }) => {
    await page.goto('/');
    const nav = page.getByRole('navigation', { name: 'Main' });
    await expect(nav.getByRole('listitem')).toHaveText([
      'Components',
      'Get started',
      'Vocabulary',
      'Foundations',
      /Storybook/,
      /GitHub/,
      /Demo/,
    ]);
    const guide = page.getByRole('contentinfo').getByRole('list', { name: 'Guide' });
    await expect(guide.getByRole('link')).toHaveText(['Components', 'Get started', 'Principles', 'Vocabulary']);
    // Principles is in the footer only since 2026-10-27; it keeps its own page.
    await expect(guide.getByRole('link', { name: 'Principles' })).toHaveAttribute('href', '/principles');
    for (const name of ['Components', 'Get started', 'Vocabulary']) {
      // One name, one place: the footer goes where the nav does.
      await expect(guide.getByRole('link', { name })).toHaveAttribute(
        'href',
        (await nav.getByRole('link', { name }).getAttribute('href'))!,
      );
    }
  });
});

test.describe('a component page', () => {
  // Decision first (owner, 2026-10-27): when to use it and when not, before the
  // pair, and the README's own example under the install command.
  for (const route of componentPages) {
    test(`${route}: says when to use it and when not, then shows its usage`, async ({ page }) => {
      await page.goto(route);
      const use = page.getByRole('list', { name: 'Use it when', exact: true });
      const avoid = page.getByRole('list', { name: 'Don’t use it when', exact: true });
      await expect(use.getByRole('listitem')).toHaveCount(2);
      await expect(avoid.getByRole('listitem')).toHaveCount(2);
      // The lists come before the pair.
      const top = (l: typeof use) => l.evaluate((el) => el.getBoundingClientRect().top);
      const pairTop = await page.locator('#pair-title ~ figure').evaluate((el) => el.getBoundingClientRect().top);
      expect(await top(use)).toBeLessThan(pairTop);
      const usage = page.locator('pre').last();
      await expect(usage).toContainText("from 'tabular-ui';");
      // Each name is imported once. Chat starter's first import line listed
      // ChatComposerHandle twice: its generic matched the JSX-tag pattern.
      const imported = (await usage.innerText())
        .split('\n')
        .filter((line) => line.startsWith('import {'))
        .flatMap((line) => line.replace(/^import \{ | \} from .*$/g, '').split(', '))
        .map((name) => name.replace(/^type /, ''));
      expect(imported.length).toBe(new Set(imported).size);
    });
  }

  // Owner, 2026-10-27: each principle sits on the pages of the components
  // that carry it, with its check. A component that carries none shows nothing.
  test('shows the principles it carries, with their checks', async ({ page }) => {
    await page.goto('/components/agent-block');
    const rules = page.getByRole('region', { name: 'The rules it follows' });
    await expect(rules.getByRole('listitem')).toHaveCount(2);
    await expect(rules).toContainText('An agent stops before anything that posts to the ledger.');
    await expect(rules).toContainText('Check: Nothing reaches the books until a person presses Post.');
    await expect(rules.getByRole('link', { name: 'All 3 principles' })).toHaveAttribute('href', '/principles');

    await page.goto('/components/lineage-tree');
    await expect(page.getByRole('region', { name: 'The rule it follows' }).getByRole('listitem')).toHaveCount(1);

    await page.goto('/components/chat-starter');
    await expect(page.getByRole('heading', { name: /rules? it follows/ })).toHaveCount(0);
  });

  test('reads its usage from the component’s README', async ({ page }) => {
    await page.goto('/components/run-log-row');
    const readme = readFileSync(
      new URL('../../../packages/ui/src/components/product/RunLogRow/README.md', import.meta.url),
      'utf8',
    );
    const example = readme
      .match(/```tsx\n([\s\S]*?)```/)![1]
      .trim()
      .split('\n')[0];
    await expect(page.locator('pre').last()).toContainText(example);
    await expect(page.locator('pre').last()).toContainText("import { RunLogRow } from 'tabular-ui';");
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
  // The page shows the eleven steps every ramp shares (owner, 2026-10-27).
  // Ledger's extra step, 925, the dark raised surface, stays in the palette,
  // theme.css and the spec, but not on this showcase page: on a shared
  // 12-column grid it had also pushed ledger's 950 out of line.
  test('line up step by step, and leave ledger-925 off the page', async ({ page }) => {
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
    await expect(page.locator('main')).not.toContainText('925');
    // The ramp's name is capitalised; its note in brackets is not.
    // (getByText reads the DOM, not the rendered case, so check the computed style.)
    await expect(ramps.getByText('(the neutral)')).toHaveCSS('text-transform', 'none');
  });
});

test.describe('the Foundations pages', () => {
  // Owner, 2026-10-27 (option A of a navigation critique): the section's name,
  // then its three pages at reading size, then the page's title. The links had
  // sat under the lead at 13px beside a 64px title, and most visitors missed them.
  for (const [route, current] of [
    ['/foundations/color', 'Color'],
    ['/foundations/typography', 'Typography'],
    ['/foundations/density', 'Density'],
  ] as const) {
    test(`${route}: names the section, and its pages come before the title, at 16px`, async ({ page }) => {
      await page.goto(route);
      const nav = page.getByRole('navigation', { name: 'Foundations' });
      await expect(nav.getByRole('link')).toHaveText(['Color', 'Typography', 'Density']);
      await expect(nav.getByRole('link', { name: current })).toHaveAttribute('aria-current', 'page');
      await expect(nav.locator('[aria-current]')).toHaveCount(1);
      for (const link of await nav.getByRole('link').all()) {
        await expect(link).toHaveCSS('font-size', '16px');
        expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(36);
      }
      const top = async (l: ReturnType<typeof page.locator>) => (await l.boundingBox())!.y;
      const h1 = page.getByRole('heading', { level: 1 });
      await expect(h1).toHaveText(current);
      expect(await top(page.getByText('Foundations', { exact: true }).first())).toBeLessThan(await top(nav));
      expect(await top(nav)).toBeLessThan(await top(h1));
    });
  }

  test('/foundations redirects to Color', async () => {
    // Vercel answers it with a 307; the test server serves files only.
    const vercel = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8')) as {
      redirects: { source: string; destination: string; permanent: boolean }[];
    };
    expect(vercel.redirects).toContainEqual({
      source: '/foundations',
      destination: '/foundations/color',
      permanent: false,
    });
  });
});

test.describe('standalone links', () => {
  // Owner, 2026-10-27: a link that stands alone (footer, card title, jump
  // index) is ink at rest and turns the sage of a text link on hover, with no
  // underline. A link inside a sentence stays sage and underlined. The nav's
  // links are ghost buttons, not standalone links.
  test('are ink at rest, and sage with no underline on hover', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true');
    const sage = await page.locator('#components p a[href*="storybook"]').evaluate((el) => getComputedStyle(el).color);
    const links = [
      page.locator('#chat-starter').getByRole('link', { name: 'Chat starter' }),
      page.getByRole('navigation', { name: 'Components by moment' }).getByRole('link', { name: 'Agent plan' }),
      page.getByRole('contentinfo').getByRole('link', { name: 'Vocabulary' }),
    ];
    for (const link of links) {
      const style = () =>
        link.evaluate((el) => {
          const s = getComputedStyle(el);
          return { color: s.color, line: s.textDecorationLine };
        });
      await page.mouse.move(0, 0);
      const rest = await style();
      expect(rest.color).not.toBe(sage);
      expect(rest.line).toBe('none');
      await link.hover();
      await expect.poll(style).toEqual({ color: sage, line: 'none' });
    }
  });

  test('Home has no All / Built / To build filter', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#components').getByRole('tablist')).toHaveCount(0);
    await expect(page.locator('#components').getByRole('heading', { level: 4 })).toHaveCount(15);
  });
});
