import { readFileSync } from 'node:fs';

import { expect, test, type Page } from '@playwright/test';

import { canonicalUrl, siteOrigin, socialImage } from '../src/lib/meta';
import { componentPages, routes } from './routes';

/**
 * Step 5b's checks (docs/site.md §11 and §12): metadata, the sitemap, robots
 * and the social image, then the page-level accessibility checks the axe run
 * in pages.spec.ts doesn't cover, and the internal link check.
 */

const pagesOnly = routes.filter((route) => route !== '/404');

/** Every redirect Vercel answers (vercel.json): the test server serves files only. */
const redirects = (
  JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8')) as {
    redirects: { source: string; destination: string }[];
  }
).redirects;

async function open(page: Page, route: string) {
  await page.goto(route);
  await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true');
}

const meta = (page: Page, attr: 'name' | 'property', key: string) =>
  page.locator(`meta[${attr}="${key}"]`).getAttribute('content');

test.describe('metadata', () => {
  for (const route of pagesOnly) {
    test(`${route}: canonical URL, description and social tags`, async ({ page }) => {
      await page.goto(route);
      const canonical = page.locator('link[rel="canonical"]');
      await expect(canonical).toHaveCount(1);
      await expect(canonical).toHaveAttribute('href', canonicalUrl(route));
      // Long enough to say something, short enough not to be cut in a result.
      expect(await meta(page, 'name', 'description')).toMatch(/^.{40,160}$/);
      expect(await meta(page, 'property', 'og:url')).toBe(canonicalUrl(route));
      expect(await meta(page, 'property', 'og:title')).toBe(await page.title());
      expect(await meta(page, 'property', 'og:description')).toBe(await meta(page, 'name', 'description'));
      expect(await meta(page, 'property', 'og:image')).toBe(`${siteOrigin}${socialImage.path}`);
      expect(await meta(page, 'name', 'twitter:card')).toBe('summary_large_image');
    });
  }

  test('a page served with a trailing slash names the one without as canonical', async ({ page }) => {
    await page.goto('/principles/');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${siteOrigin}/principles`);
  });

  test('the 404 has no canonical URL or social tags, and asks not to be indexed', async ({ page }) => {
    await page.goto('/no-such-page');
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
    await expect(page.locator('meta[property^="og:"]')).toHaveCount(0);
    expect(await meta(page, 'name', 'robots')).toBe('noindex');
  });

  test('every page has its own title and description', async ({ page }) => {
    const titles = new Set<string>();
    const descriptions = new Set<string>();
    for (const route of pagesOnly) {
      await page.goto(route);
      titles.add(await page.title());
      descriptions.add((await meta(page, 'name', 'description'))!);
    }
    expect(titles.size).toBe(pagesOnly.length);
    expect(descriptions.size).toBe(pagesOnly.length);
  });

  test('Home’s description is the hero’s lead', async ({ page }) => {
    await page.goto('/');
    expect(await meta(page, 'name', 'description')).toBe(await page.locator('#hero-title + p').textContent());
  });
});

test.describe('sitemap, robots and the social image', () => {
  test('the sitemap lists every page once, at its canonical URL, and not the 404', async ({ request }) => {
    const response = await request.get('/sitemap.xml');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('xml');
    const locs = [...(await response.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    expect(locs.toSorted()).toEqual(pagesOnly.map(canonicalUrl).toSorted());
  });

  test('robots.txt allows everything and points at the sitemap', async ({ request }) => {
    const text = await (await request.get('/robots.txt')).text();
    expect(text).toMatch(/^User-agent: \*$/m);
    expect(text).toMatch(/^Allow: \/$/m);
    expect(text).toMatch(new RegExp(`^Sitemap: ${siteOrigin}/sitemap.xml$`, 'm'));
  });

  test('the social image is a 1200×630 PNG', async ({ request }) => {
    const response = await request.get(socialImage.path);
    expect(response.headers()['content-type']).toBe('image/png');
    const png = await response.body();
    // The IHDR chunk: width and height as 32-bit integers at bytes 16 and 20.
    expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([socialImage.width, socialImage.height]);
  });
});

test.describe('fonts', () => {
  // §12: preload only the faces the first screen uses, the sans body and the
  // serif heading. A preload whose URL isn't the one the stylesheet asks for
  // downloads the face twice; this checks each preloaded file is fetched once.
  test('the sans and the serif are preloaded, and each is fetched once', async ({ page }) => {
    const fetched: string[] = [];
    page.on('request', (r) => {
      if (r.url().endsWith('.woff2')) fetched.push(new URL(r.url()).pathname);
    });
    await open(page, '/');
    await page.waitForLoadState('networkidle');
    const preloads = await page
      .locator('link[rel="preload"][as="font"]')
      .evaluateAll((links) => links.map((l) => new URL((l as HTMLLinkElement).href).pathname));
    expect(preloads).toHaveLength(2);
    expect(preloads[0]).toMatch(/\/source-sans-3-latin-wght-normal-[\w-]+\.woff2$/);
    expect(preloads[1]).toMatch(/\/source-serif-4-latin-opsz-normal-[\w-]+\.woff2$/);
    for (const href of preloads)
      expect(
        fetched.filter((f) => f === href),
        href,
      ).toHaveLength(1);
  });
});

test.describe('navigation', () => {
  // §11 asked for focus to move to the new page's <h1> after a client-side
  // route change. The site has none: every link is a plain <a>, so each one
  // loads a whole document, and the browser resets focus and announces the new
  // title itself. React Router's <Link> renders data-discover; none may appear.
  for (const route of routes) {
    test(`${route}: no client-side links`, async ({ page }) => {
      await page.goto(route);
      await expect(page.locator('a[data-discover]')).toHaveCount(0);
    });
  }

  test('following a link loads a new document', async ({ page }) => {
    await open(page, '/');
    await page.evaluate(() => ((window as { marker?: number }).marker = 1));
    await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Vocabulary' }).click();
    await expect(page).toHaveURL(/\/vocabulary$/);
    expect(await page.evaluate(() => (window as { marker?: number }).marker)).toBeUndefined();
  });
});

test.describe('links', () => {
  // Every internal link and its fragment resolve: a page the build has (or a
  // redirect Vercel answers) and an element with that id on it.
  test('every internal link goes to a page that exists, and every # to an element on it', async ({ page }) => {
    const targets = new Map<string, Set<string>>();
    for (const route of routes) {
      await page.goto(route);
      for (const href of await page.locator('a[href]').evaluateAll((as) => as.map((a) => a.getAttribute('href')!))) {
        if (/^[a-z]+:/.test(href)) continue;
        const url = new URL(href, `http://site${route}`);
        const path = url.pathname;
        if (!targets.has(path)) targets.set(path, new Set());
        if (url.hash) targets.get(path)!.add(url.hash.slice(1));
      }
    }
    for (const [path, ids] of targets) {
      const redirect = redirects.find((r) => r.source === path);
      const target = redirect ? new URL(redirect.destination, 'http://site') : null;
      const resolved = target ? target.pathname : path;
      if (target?.hash) ids.add(target.hash.slice(1));
      const response = await page.goto(resolved);
      expect(response?.status(), `${path} → ${resolved}`).toBe(200);
      for (const id of ids) await expect(page.locator(`[id="${id}"]`), `${resolved}#${id}`).toHaveCount(1);
    }
  });

  // §11: no two links share a name but go to different places, and ↗ marks
  // exactly the links to another site, hidden from assistive technology.
  //
  // One exception, approved by the owner on 2026-10-27 (after PR #31): on
  // Home, a built component's name in the jump index goes to its card
  // (`/#agent-plan`), and the same name as the card's title goes to its page. Both lead to the same
  // component, the jump index's label ("Components by moment") gives the first
  // its context (2.4.4), and the card it lands on holds the second.
  const jumpToCard = (route: string, name: string, hrefs: string[]) =>
    route === '/' &&
    hrefs.length === 2 &&
    hrefs.some((h) => h.endsWith(`/#${slug(name)}`)) &&
    hrefs.some((h) => h.endsWith(`/components/${slug(name)}`));
  const slug = (name: string) => name.toLowerCase().replace(/\s+/g, '-');
  for (const route of routes) {
    test(`${route}: one name, one destination; ↗ on every external link and no other`, async ({ page }) => {
      await page.goto(route);
      const links = await page.locator('a[href]').evaluateAll((as) =>
        as
          .filter((a) => a.getClientRects().length > 0 || a.closest('[role="menu"]'))
          .map((a) => {
            const hidden = [...a.querySelectorAll('[aria-hidden="true"]')].map((el) => el.textContent ?? '');
            let name = a.getAttribute('aria-label') ?? a.textContent ?? '';
            for (const h of hidden) name = name.replace(h, '');
            const img = a.querySelector('img');
            if (!name.trim() && img) name = img.alt;
            return {
              name: name.replace(/\s+/g, ' ').trim(),
              href: new URL(a.getAttribute('href')!, location.href).href.replace(/\/$/, ''),
              external: new URL(a.getAttribute('href')!, location.href).origin !== location.origin,
              arrow: hidden.some((h) => h.includes('↗')),
            };
          }),
      );
      const byName = new Map<string, Set<string>>();
      for (const link of links) {
        if (!byName.has(link.name)) byName.set(link.name, new Set());
        byName.get(link.name)!.add(link.href);
        expect(link.arrow, `${link.name} (${link.href})`).toBe(link.external);
      }
      for (const [name, hrefs] of byName) {
        if (jumpToCard(route, name, [...hrefs])) continue;
        expect([...hrefs], `"${name}"`).toHaveLength(1);
      }
    });
  }
});

test.describe('accessibility beyond axe', () => {
  test.describe('with reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });
    for (const route of routes) {
      test(`${route}: nothing animates`, async ({ page }) => {
        await open(page, route);
        // Give anything that would start on load or on scroll a chance to.
        await page.mouse.wheel(0, 4000);
        await page.waitForTimeout(500);
        const running = await page.evaluate(
          () => document.getAnimations().filter((a) => a.playState === 'running').length,
        );
        expect(running).toBe(0);
      });
    }
  });

  // 2.4.11: nothing fixed or sticky can cover a focused element. The nav
  // scrolls away (D8); the skip link is fixed, but shows only while it has
  // focus itself, above the page. From 1024px a component page's list of
  // components is sticky (owner, 2026-10-28): it sits in its own column, so it
  // can't cover anything beside it.
  for (const route of routes) {
    const isComponent = componentPages.includes(route);
    test(`${route}: nothing fixed or sticky but the skip link${isComponent ? ' and the component list' : ''} (2.4.11)`, async ({
      page,
    }) => {
      await open(page, route);
      const pinned = await page.evaluate(() =>
        [...document.querySelectorAll('body *')]
          .filter((el) => ['fixed', 'sticky'].includes(getComputedStyle(el).position))
          .map((el) =>
            el.getAttribute('aria-labelledby') === 'component-list-title'
              ? 'Component list'
              : el.textContent?.trim().slice(0, 40),
          ),
      );
      expect(pinned).toEqual(isComponent ? ['Skip to content', 'Component list'] : ['Skip to content']);
      if (isComponent) {
        const list = (await page.locator('nav[aria-labelledby="component-list-title"]').boundingBox())!;
        const column = (await page.locator('nav[aria-labelledby="component-list-title"] + div').boundingBox())!;
        expect(list.x + list.width).toBeLessThan(column.x);
      }
    });
  }

  // D4: in forced colours, backgrounds are replaced by the system's, so an edge
  // a ground drew is gone. Every plate's frame, and every site control or link
  // with a ground of its own (a filled or tinted button), must keep a border.
  // Ghost and inline controls have no ground at rest: they read as text there.
  // Inside a plate are the library's components, whose own tests cover them
  // (an expanded failed RunLogRow loses its tint here, and keeps its words).
  for (const route of ['/', '/components/agent-block', '/foundations/color', '/vocabulary']) {
    test(`${route}: in forced colours, every plate and filled control keeps a visible edge`, async ({ page }) => {
      await open(page, route);
      const marked = await page.evaluate(() => {
        let n = 0;
        for (const el of document.querySelectorAll('[data-plate], button, a')) {
          const target = el.matches('[data-plate]') ? el.parentElement! : el;
          const bg = getComputedStyle(target).backgroundColor;
          const filled = !/rgba\(0, 0, 0, 0\)|transparent/.test(bg);
          const site = el.matches('[data-plate]') || !el.closest('[data-plate]');
          if (site && (el.matches('[data-plate]') || filled) && target.getClientRects().length > 0) {
            target.setAttribute('data-edge-check', '');
            n++;
          }
        }
        return n;
      });
      expect(marked).toBeGreaterThan(0);
      await page.emulateMedia({ forcedColors: 'active' });
      expect(await page.evaluate(() => matchMedia('(forced-colors: active)').matches)).toBe(true);
      const edgeless = await page.locator('[data-edge-check]').evaluateAll((els) =>
        els
          .filter((el) => {
            const s = getComputedStyle(el);
            return !(['Top', 'Right', 'Bottom', 'Left'] as const).some(
              (side) =>
                s.getPropertyValue(`border-${side.toLowerCase()}-style`) !== 'none' &&
                parseFloat(s.getPropertyValue(`border-${side.toLowerCase()}-width`)) > 0,
            );
          })
          .map((el) => el.outerHTML.slice(0, 100)),
      );
      expect(edgeless).toEqual([]);
    });
  }

  // On the Foundations pages the colours are the content: the mode panels and
  // the ramps opt out of forced colours, so a sample still shows its colour.
  test('in forced colours, Color still paints its samples', async ({ page }) => {
    await open(page, '/foundations/color');
    await page.emulateMedia({ forcedColors: 'active' });
    // The interactive fill is ink on the light panel's paper: forced colours
    // would paint both the system's canvas.
    const fill = page.locator('p.bg-fill-interactive').first();
    const [swatch, panel] = await fill.evaluate((el) => [
      getComputedStyle(el).backgroundColor,
      getComputedStyle(el.closest('[data-theme], .bg-canvas')!).backgroundColor,
    ]);
    expect(swatch).not.toBe(panel);
    const ramps = page.locator('li > span[aria-hidden="true"][style]');
    expect(await ramps.count()).toBeGreaterThan(0);
    for (const value of await ramps.evaluateAll((els) => els.map((el) => getComputedStyle(el).forcedColorAdjust)))
      expect(value).toBe('none');
  });
});
