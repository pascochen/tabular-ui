import { expect, test, type Page } from '@playwright/test';

import {
  contrastRatio,
  focusRingStyle,
  gotoStory,
  injectAxe,
  ringOverhang,
  rgba,
  tabTo,
  token,
  tokenPx,
} from './helpers';

/**
 * AppShell's behaviour is a function of viewport width, so it is tested here
 * rather than in a story play function: the vitest browser runner has its
 * own fixed viewport and ignores Storybook's viewport globals, and the
 * `iframe.html` fixtures Playwright loads have no viewport wrapper at all —
 * the page size *is* the viewport.
 *
 * 1280px is Tailwind's stock `xl`, the one breakpoint the shell uses. 1440 is
 * the width the shell sketch was drawn at.
 */

const SKETCH = { width: 1440, height: 900 };
const BELOW_FLOOR = { width: 1024, height: 768 };

// A regex, because sr-only is positioned, so Chromium's name has a space before it: "payables , unread".
const navItem = (page: Page, name: RegExp) => page.getByRole('link', { name });
const textOf = (page: Page, name: RegExp) =>
  navItem(page, name).evaluate((el) => {
    const { color, fontWeight } = getComputedStyle(el);
    return { color, fontWeight };
  });

const headerToggle = (page: Page) => page.locator('[data-slot="app-shell-sidebar-header-toggle"]');
const navToggle = (page: Page) => page.locator('[data-slot="app-shell-sidebar-toggle"]');
const dockedSidebar = (page: Page) => page.locator('[data-slot="app-shell-sidebar"]');
const panel = (page: Page) => page.locator('[data-slot="app-shell-panel"]');
const breadcrumb = (page: Page) => page.getByRole('navigation', { name: 'Breadcrumb' });
const chatButton = (page: Page) => page.getByRole('button', { name: 'Chat' });

/**
 * Listens for the next `pointerover` the top-nav toggle receives, and returns
 * a function that waits for it. Await this *before* the action that remounts
 * the toggle, and call the result after.
 *
 * When the toggle mounts under a pointer that has not moved, Chromium fires
 * trusted pointerover/pointerenter at it on a later frame — no pointermove.
 * Opening the peek on that enter made the floor-crossing test fail whenever
 * its first poll landed after the event, and pass when it landed before.
 * Waiting for the event is what makes "the peek did not open" a real
 * assertion rather than a race.
 */
async function toggleOver(page: Page): Promise<() => Promise<void>> {
  await page.evaluate(() => {
    const w = window as Window & { __toggleOver?: Promise<void> };
    w.__toggleOver = new Promise<void>((resolve) => {
      const onOver = (event: Event) => {
        if (!(event.target as Element).closest('[data-slot="app-shell-sidebar-toggle"]')) return;
        document.removeEventListener('pointerover', onOver, true);
        resolve();
      };
      document.addEventListener('pointerover', onOver, true);
    });
  });
  return () => page.evaluate(() => (window as Window & { __toggleOver?: Promise<void> }).__toggleOver);
}

const box = (page: Page, slot: string) =>
  page
    .locator(`[data-slot="${slot}"]`)
    .first()
    .evaluate((el) => {
      const r = el.getBoundingClientRect();
      return { left: r.left, top: r.top, width: r.width, height: r.height, bottom: r.bottom };
    });

test.describe('docked — at and above the 1280px floor', () => {
  test.use({ viewport: SKETCH });

  test('the sketch geometry: full-height sidebar, top nav over main and panel', async ({ page }) => {
    await gotoStory(page, 'product-appshell--expanded');
    const sidebar = await box(page, 'app-shell-sidebar');
    const topNav = await box(page, 'app-bar');
    const panelBox = await box(page, 'app-shell-panel');

    expect(sidebar).toMatchObject({ left: 0, top: 0, width: 240, height: SKETCH.height });
    // The top nav starts where the sidebar ends and runs to the edge.
    expect(topNav).toMatchObject({ left: 240, top: 0, width: SKETCH.width - 240 });
    // The panel sits under the top nav, on the trailing edge.
    expect(panelBox.top).toBe(topNav.bottom);
    expect(panelBox.left + panelBox.width).toBe(SKETCH.width);
  });

  test('the sidebar header and the top nav share one rule', async ({ page }) => {
    await gotoStory(page, 'product-appshell--expanded');
    const sidebarHeader = await box(page, 'app-shell-sidebar-header');
    const topNav = await box(page, 'app-bar');
    expect(sidebarHeader.bottom).toBe(topNav.bottom);
    expect(topNav.height).toBe(49);
  });

  test('every sidebar label, trigger, nav item and the account avatar start on one x', async ({ page }) => {
    await gotoStory(page, 'product-appshell--expanded');
    const lefts = await dockedSidebar(page).evaluate((sb) => {
      // The first painted glyph — text or icon — inside each element.
      const firstInk = (el: Element) => {
        const svg = el.querySelector('svg');
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        for (let n = walker.nextNode(); n; n = walker.nextNode()) {
          if (!n.textContent?.trim()) continue;
          const range = document.createRange();
          range.selectNodeContents(n);
          const text = range.getBoundingClientRect().left;
          return Math.round(svg ? Math.min(text, svg.getBoundingClientRect().left) : text);
        }
        return Math.round(svg!.getBoundingClientRect().left);
      };
      const q = (sel: string) => sb.querySelector(sel)!;
      return {
        orgTrigger: firstInk(q('[data-slot="app-shell-sidebar-header"] [data-slot="menu-trigger"]')),
        projectLabel: firstInk(q('[data-slot="context-switcher-label"]')),
        projectTrigger: firstInk(sb.querySelectorAll('[data-slot="menu-trigger"]')[1]),
        // Buttons and button-styled links carry a 1px transparent border
        // inside their padding; a label with padding alone sits 1px short.
        navGroupLabel: firstInk(q('[data-slot="app-shell-nav-group"] > div')),
        navItem: firstInk(q('[data-slot="app-shell-nav"] li')),
        // The image, not its 28px ring: the ring's 2px border sits outside the line.
        accountAvatar: Math.round(q('[data-slot="account-menu"] [data-slot="avatar"]').getBoundingClientRect().left),
      };
    });
    expect(new Set(Object.values(lefts)).size, JSON.stringify(lefts)).toBe(1);
  });

  test('the chrome opens on one line at one gutter, main takes the frame, and the footers share a floor', async ({
    page,
  }) => {
    await gotoStory(page, 'product-appshell--expanded');
    const padding = (slot: string) =>
      page
        .locator(`[data-slot="${slot}"]`)
        .first()
        .evaluate((el) => {
          const cs = getComputedStyle(el);
          return { top: parseFloat(cs.paddingTop), left: parseFloat(cs.paddingLeft) };
        });

    // --pad-page-y: the sidebar was 8px and the panel 12px before the
    // 2026-10-07 audit, so the chrome columns opened on two lines.
    for (const slot of ['app-shell-sidebar-body', 'app-shell-panel-body']) {
      expect((await padding(slot)).top, slot).toBe(16);
    }
    // At the sketch width main is 760px, past the 672px frame threshold, so
    // it takes the frame tier (§7.3): 48px top, and 48px sides on the header
    // and body alike. The floor case is in the "frame tier" block below.
    expect((await padding('app-shell-main-body')).top).toBe(48);
    expect((await padding('app-shell-main-body')).left).toBe(48);
    expect((await padding('app-shell-page-header')).left).toBe(48);
    // --pad-page-x on every shell column, the panel included.
    const gutter = (await padding('app-bar')).left;
    for (const slot of ['app-shell-panel-header', 'app-shell-panel-body', 'app-shell-panel-footer']) {
      expect((await padding(slot)).left, slot).toBe(gutter);
    }

    // Both footers carry the same 12px band padding. The sidebar's is 56px
    // around its 32px row; the panel's holds ChatComposer's two-row box, so
    // it is taller (decided 2026-10-13), and both end at the viewport floor.
    const sidebarFooter = await box(page, 'app-shell-sidebar-footer');
    const panelFooter = await box(page, 'app-shell-panel-footer');
    const composer = await box(page, 'chat-composer');
    expect(sidebarFooter.height).toBe(56);
    expect(panelFooter.height).toBe(composer.height + 24);
    expect(panelFooter.bottom).toBe(sidebarFooter.bottom);
  });

  test('the page header is the page h1, inside <main>, and shares the panel header rule', async ({ page }) => {
    await gotoStory(page, 'product-appshell--expanded');
    const pageHeader = await box(page, 'app-shell-page-header');
    const panelHeader = await box(page, 'app-shell-panel-header');
    expect(pageHeader.height).toBe(49);
    expect(pageHeader.bottom).toBe(panelHeader.bottom);

    const title = page.locator('main h1');
    await expect(title).toHaveText('Analysis');
    const style = await title.evaluate((el) => {
      const cs = getComputedStyle(el);
      return [cs.fontSize, cs.lineHeight, cs.fontWeight];
    });
    expect(style).toEqual(['16px', '24px', '600']);

    // The header stays put: only the body below it scrolls.
    const overflow = await page
      .locator('[data-slot="app-shell-main-body"]')
      .evaluate((el) => getComputedStyle(el).overflowY);
    expect(overflow).toBe('auto');
  });

  test('a long page title truncates with an ellipsis and keeps its actions', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await gotoStory(page, 'product-appshell--long-page-title');
    const span = page.locator('main h1 > span');
    const state = await span.evaluate((el) => ({
      truncated: el.scrollWidth > el.clientWidth,
      overflow: getComputedStyle(el).textOverflow,
    }));
    expect(state).toEqual({ truncated: true, overflow: 'ellipsis' });
    await expect(page.getByRole('button', { name: 'Page actions' })).toBeInViewport();
    expect((await box(page, 'app-shell-page-header')).height).toBe(49);

    // Cut off, so the full title is in a tooltip, below the title (side
    // "bottom"), clear of the top nav above.
    const full = await span.textContent();
    await span.hover();
    const tooltip = page.locator('[data-slot="tooltip-content"]');
    await expect(tooltip).toHaveText(full!);
    // Polled: the popup animates in.
    const titleBottom = (await span.boundingBox())!.y + (await span.boundingBox())!.height;
    await expect.poll(async () => (await tooltip.boundingBox())!.y).toBeGreaterThanOrEqual(titleBottom);
  });

  test('a page title that fits gets no tooltip', async ({ page }) => {
    await gotoStory(page, 'product-appshell--expanded');
    await page.locator('main h1 > span').hover();
    // Wait out the 300ms delay plus margin before asserting absence.
    await page.waitForTimeout(600);
    await expect(page.locator('[data-slot="tooltip-content"]')).toHaveCount(0);
  });

  test('sidebar sections sit --gap-nav-group (24px) apart', async ({ page }) => {
    await gotoStory(page, 'product-appshell--expanded');
    const gap = await page
      .locator('[data-slot="app-shell-nav"]')
      .evaluate((nav) => parseFloat(getComputedStyle(nav).rowGap));
    expect(gap).toBe(24);
  });

  test('figures in prose are tabular, inherited from the root (§8.6)', async ({ page }) => {
    await gotoStory(page, 'product-appshell--expanded');
    const numeric = await page
      .locator('[data-slot="agent-block"]')
      .getByText('¥317m', { exact: false })
      .evaluate((el) => getComputedStyle(el).fontVariantNumeric);
    expect(numeric).toContain('tabular-nums');
  });

  test('collapsing moves the toggle to the top nav, with focus, and grows the breadcrumb', async ({ page }) => {
    await gotoStory(page, 'product-appshell--expanded');
    await expect(navToggle(page)).toHaveCount(0);
    await expect(breadcrumb(page)).not.toContainText('FY2026 H1 close');

    await headerToggle(page).click();
    await expect(dockedSidebar(page)).toBeHidden();
    await expect(navToggle(page)).toBeFocused();
    await expect(navToggle(page)).toHaveAttribute('aria-expanded', 'false');
    await expect(breadcrumb(page)).toContainText('FY2026 H1 close');
    expect((await box(page, 'app-bar')).left).toBe(0);

    // And back: the header toggle takes focus as the top-nav one disappears.
    await page.keyboard.press('Enter');
    await expect(dockedSidebar(page)).toBeVisible();
    await expect(headerToggle(page)).toBeFocused();
    await expect(navToggle(page)).toHaveCount(0);
  });

  test('the Chat button toggles the panel and main takes the width back', async ({ page }) => {
    await gotoStory(page, 'product-appshell--expanded');
    await expect(chatButton(page)).toHaveAttribute('aria-expanded', 'true');
    await expect(chatButton(page)).toHaveAttribute('aria-controls', (await panel(page).getAttribute('id'))!);
    const mainOpen = (await box(page, 'app-shell-main')).width;

    await chatButton(page).click();
    await expect(panel(page)).toHaveCount(0);
    await expect(chatButton(page)).toHaveAttribute('aria-expanded', 'false');
    expect((await box(page, 'app-shell-main')).width).toBe(mainOpen + 440);

    await chatButton(page).click();
    await expect(panel(page)).toBeVisible();
    await expect(panel(page)).toHaveAccessibleName('Chat');
  });

  test('the shell bounds <main>, so the table virtualizes', async ({ page }) => {
    // 2,000 rows in the fixture. An unbounded parent renders all of them
    // with no error (failure log) — the row count is the only symptom.
    await gotoStory(page, 'product-appshell--with-table');
    // [data-row-id]: the virtualizer's spacer rows are <tr> too, and hidden.
    const rows = page.locator('tbody tr[data-row-id]');
    await expect(rows.first()).toBeVisible();
    expect(await rows.count()).toBeLessThan(100);

    // And the page itself never scrolls: only regions do.
    const docOverflow = await page.evaluate(() => document.scrollingElement!.scrollHeight - window.innerHeight);
    expect(docOverflow).toBeLessThanOrEqual(0);
  });

  test('a nav item focus ring is not clipped by the sidebar scroll container', async ({ page }) => {
    await gotoStory(page, 'product-appshell--expanded');
    const item = page.locator('[data-slot="app-shell-nav-item"]').first();
    expect(await tabTo(page, item)).toBe(true);

    const ring = await focusRingStyle(page);
    expect(ring?.outlineStyle).not.toBe('none');
    for (const c of await ringOverhang(page)) {
      expect(c.left, `clipped left by ${c.el}`).toBeLessThanOrEqual(0);
      expect(c.right, `clipped right by ${c.el}`).toBeLessThanOrEqual(0);
      expect(c.top, `clipped top by ${c.el}`).toBeLessThanOrEqual(0);
    }
  });

  test('the skip link is the first tab stop and moves focus to <main>', async ({ page }) => {
    await gotoStory(page, 'product-appshell--expanded');
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Skip to content' });
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();
    await page.keyboard.press('Enter');
    await expect(page.locator('main')).toBeFocused();
  });

  test('every region of the shell sits inside a landmark (axe `region`, whole page)', async ({ page }) => {
    // The story tests scope axe to the story root, where `region` cannot
    // fail: it judges content against the whole page's landmarks. The
    // sidebar header, footer and the project block shipped outside every
    // landmark, and only an axe run on a full app page (the Kasane demo)
    // found it.
    await gotoStory(page, 'product-appshell--expanded');
    await injectAxe(page);
    const targets = await page.evaluate(async () => {
      // Storybook's own hidden screens (preparing, no preview, error) carry
      // links to storybook.js.org ahead of the story. axe counts a link as a
      // skip link only when no other link precedes it, so they made the
      // shell's skip link a violation that no app page has.
      document.querySelectorAll('body > .sb-wrapper').forEach((el) => el.remove());
      const { violations } = await window.axe.run(document, { runOnly: { type: 'rule', values: ['region'] } });
      return violations.flatMap((v) => v.nodes.map((n) => n.target.join(' ')));
    });
    expect(targets).toEqual([]);

    // axe exempts buttons, so the switchers in the story's header and footer
    // pass `region` on their own. A workspace name or the user's identity as
    // plain text, as in the demo, does not. Both bands are in the landmark.
    const sidebar = page.getByRole('region', { name: 'Sidebar' });
    await expect(sidebar.locator('[data-slot="app-shell-sidebar-header"]')).toBeVisible();
    await expect(sidebar.locator('[data-slot="app-shell-sidebar-footer"]')).toBeVisible();
  });
  test('clicking the top-nav toggle pins the sidebar — never an overlay', async ({ page }) => {
    await gotoStory(page, 'product-appshell--collapsed');
    const mainBefore = (await box(page, 'app-shell-main')).width;
    await navToggle(page).click();
    await expect(dockedSidebar(page)).toHaveAttribute('data-state', 'pinned');
    expect(await box(page, 'app-shell-sidebar')).toMatchObject({ left: 0, top: 0, width: 240 });
    // Pinned pushes main; it does not cover it.
    expect((await box(page, 'app-shell-main')).width).toBe(mainBefore - 240);
    await expect(headerToggle(page)).toBeFocused();
  });

  test('hovering the collapsed toggle peeks the sidebar over main', async ({ page }) => {
    await gotoStory(page, 'product-appshell--collapsed');
    const mainBefore = await box(page, 'app-shell-main');
    await navToggle(page).hover();
    await expect(dockedSidebar(page)).toHaveAttribute('data-state', 'peek');
    await expect(dockedSidebar(page)).toBeVisible();

    const peek = await box(page, 'app-shell-sidebar');
    const topNav = await box(page, 'app-bar');
    // An overlay: main keeps its width, and the peek floats below the top
    // nav so the toggle stays reachable to pin.
    expect((await box(page, 'app-shell-main')).width).toBe(mainBefore.width);
    expect(peek.top).toBeGreaterThanOrEqual(topNav.bottom);
    // Peek is transient — the breadcrumb must not reflow under the pointer.
    await expect(breadcrumb(page)).toContainText('FY2026 H1 close');
    await expect(navToggle(page)).toHaveAttribute('aria-expanded', 'false');
  });

  test('the peek survives the pointer crossing into it, and closes when it leaves', async ({ page }) => {
    await gotoStory(page, 'product-appshell--collapsed');
    await navToggle(page).hover();
    await expect(dockedSidebar(page)).toHaveAttribute('data-state', 'peek');

    await page.getByRole('link', { name: 'Questions' }).hover();
    await page.waitForTimeout(500); // past the 300ms close delay
    await expect(dockedSidebar(page)).toHaveAttribute('data-state', 'peek');

    await page.mouse.move(SKETCH.width / 2, SKETCH.height / 2);
    await expect(dockedSidebar(page)).toBeHidden();
  });

  test("clicking the peek's own toggle pins it", async ({ page }) => {
    await gotoStory(page, 'product-appshell--collapsed');
    await navToggle(page).hover();
    await headerToggle(page).click();
    await expect(dockedSidebar(page)).toHaveAttribute('data-state', 'pinned');
    await expect(breadcrumb(page)).not.toContainText('FY2026 H1 close');
  });

  test('clicking the top-nav toggle while peeking pins', async ({ page }) => {
    await gotoStory(page, 'product-appshell--collapsed');
    await navToggle(page).hover();
    await expect(dockedSidebar(page)).toHaveAttribute('data-state', 'peek');
    await navToggle(page).click();
    await expect(dockedSidebar(page)).toHaveAttribute('data-state', 'pinned');
  });

  test('a toggle that reappears under a resting pointer does not peek until it moves', async ({ page }) => {
    await gotoStory(page, 'product-appshell--collapsed');
    // Pin with the mouse, then unpin from the keyboard: the top-nav toggle
    // comes back under the pointer that clicked it.
    await navToggle(page).click();
    await expect(headerToggle(page)).toBeFocused();
    const toggleHovered = await toggleOver(page);
    await page.keyboard.press('Enter');
    await toggleHovered();
    await expect(navToggle(page)).toBeFocused();
    await expect(dockedSidebar(page)).toBeHidden();

    // A real move over it is a hover, and peeks.
    const t = (await navToggle(page).boundingBox())!;
    await page.mouse.move(t.x + t.width / 2 + 2, t.y + t.height / 2);
    await expect(dockedSidebar(page)).toHaveAttribute('data-state', 'peek');
  });

  test('Escape closes a peek', async ({ page }) => {
    await gotoStory(page, 'product-appshell--collapsed');
    await navToggle(page).hover();
    await page.getByRole('link', { name: 'Questions' }).focus();
    await page.keyboard.press('Escape');
    await expect(dockedSidebar(page)).toBeHidden();
  });
});

test.describe('below the 1280px floor', () => {
  test.use({ viewport: BELOW_FLOOR });

  test('the sidebar starts collapsed, and a click pins it docked', async ({ page }) => {
    await gotoStory(page, 'product-appshell--expanded');
    await expect(dockedSidebar(page)).toBeHidden();
    await expect(breadcrumb(page)).toContainText('FY2026 H1 close');

    await navToggle(page).click();
    await expect(dockedSidebar(page)).toHaveAttribute('data-state', 'pinned');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    const sidebar = await box(page, 'app-shell-sidebar');
    expect(sidebar.left).toBe(0);
    // Docked beside the open panel, it sits at its minimum to keep main its
    // floor (§7.9), and the top nav starts on its rule.
    expect(sidebar.width).toBe(await tokenPx(page, '--w-sidebar-min'));
    expect((await box(page, 'app-shell-top-nav')).left).toBe(sidebar.width);
  });

  test('hover peeks below the floor too', async ({ page }) => {
    await gotoStory(page, 'product-appshell--expanded');
    await navToggle(page).hover();
    await expect(dockedSidebar(page)).toHaveAttribute('data-state', 'peek');
  });

  test('the chat still docks below the floor', async ({ page }) => {
    await gotoStory(page, 'product-appshell--expanded');
    const panelBox = await box(page, 'app-shell-panel');
    expect(panelBox.left + panelBox.width).toBe(BELOW_FLOOR.width);
  });

  test('crossing the floor restores each width class its own pin state', async ({ page }) => {
    await gotoStory(page, 'product-appshell--expanded');
    await navToggle(page).click();
    await expect(dockedSidebar(page)).toHaveAttribute('data-state', 'pinned');

    // Wide: back to the wide preference (pinned, the Expanded default).
    await page.setViewportSize(SKETCH);
    await expect(dockedSidebar(page)).toHaveAttribute('data-state', 'pinned');

    // Narrow again: a pin made below the floor does not outlive the trip.
    // The pointer is still where the first click left it, which is where the
    // top-nav toggle comes back — wait for that hover update to land.
    const toggleHovered = await toggleOver(page);
    await page.setViewportSize(BELOW_FLOOR);
    await toggleHovered();
    await expect(dockedSidebar(page)).toBeHidden();
    await expect(navToggle(page)).toBeVisible();
  });
});

/**
 * §7.3 "Frame tier" and §7.9 --w-content. The frame keys off <main>'s own
 * width (an @container), so these pin both sides of the 672px threshold and
 * the centred column on a wide monitor.
 */
test.describe('frame tier', () => {
  const mainGeometry = (page: Page) =>
    page.evaluate(() => {
      const q = (slot: string) => document.querySelector(`[data-slot="${slot}"]`)!;
      const pad = (el: Element) => {
        const cs = getComputedStyle(el);
        return { top: parseFloat(cs.paddingTop), left: parseFloat(cs.paddingLeft), right: parseFloat(cs.paddingRight) };
      };
      return {
        mainWidth: q('app-shell-main').getBoundingClientRect().width,
        body: pad(q('app-shell-main-body')),
        header: pad(q('app-shell-page-header')),
      };
    });

  test.describe('at the floor, both sides open', () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    test('main is 600px, under the threshold: the narrow gutter and inset, unchanged', async ({ page }) => {
      await gotoStory(page, 'product-appshell--expanded');
      const g = await mainGeometry(page);
      expect(g.mainWidth).toBe(600);
      expect(g.body).toMatchObject({ top: 16, left: 24 });
      expect(g.header.left).toBe(24);
    });
  });

  test.describe('on a wide monitor', () => {
    test.use({ viewport: { width: 2400, height: 900 } });

    test('header and body centre one --w-content column, 1184px of content', async ({ page }) => {
      await gotoStory(page, 'product-appshell--expanded');
      const g = await mainGeometry(page);
      expect(g.mainWidth).toBeGreaterThan(1280);
      // Centring padding: half the overflow, plus the 48px frame gutter.
      const side = (g.mainWidth - 1280) / 2 + 48;
      for (const box of [g.body, g.header]) {
        expect(box.left).toBeCloseTo(side, 1);
        expect(box.right).toBeCloseTo(side, 1);
      }
      expect(g.mainWidth - g.body.left - g.body.right).toBeCloseTo(1184, 1);
      expect(g.body.top).toBe(48);
    });

    test('a table page opts out: contentWidth="full" keeps the frame gutter, drops the cap', async ({ page }) => {
      await gotoStory(page, 'product-appshell--with-table');
      const g = await mainGeometry(page);
      expect(g.mainWidth).toBeGreaterThan(1280);
      // Header and body together, so the title stays on the grid's x.
      for (const box of [g.body, g.header]) expect(box).toMatchObject({ left: 48, right: 48 });
      expect(g.body.top).toBe(48);
    });
  });
});

test.describe('nav items with people and counts', () => {
  test.use({ viewport: SKETCH });

  test('a trailing badge keeps its width and the edge while a long name truncates', async ({ page }) => {
    await gotoStory(page, 'product-appshell--people-and-counts');
    const rows = await dockedSidebar(page).evaluate((sb) =>
      [...sb.querySelectorAll<HTMLElement>('[data-slot="app-shell-nav-item"]')].map((a) => {
        const label = a.querySelector<HTMLElement>('span.truncate')!;
        const badge = a.querySelector<HTMLElement>('[data-slot="badge"]');
        const avatar = a.querySelector<HTMLElement>('[data-slot="avatar"]');
        const r = a.getBoundingClientRect();
        return {
          name: label.textContent,
          truncated: label.scrollWidth > label.clientWidth,
          labelRight: label.getBoundingClientRect().right,
          badgeLeft: badge?.getBoundingClientRect().left,
          badgeRight: badge?.getBoundingClientRect().right,
          avatar: avatar ? avatar.getBoundingClientRect().width : null,
          weight: avatar?.getAttribute('weight') ?? null,
          right: r.right,
          paddingRight: parseFloat(getComputedStyle(a).paddingRight),
          borderRight: parseFloat(getComputedStyle(a).borderRightWidth),
        };
      }),
    );
    const longName = rows.find((r) => r.name?.startsWith('Anna-Lena'))!;
    expect(longName.truncated).toBe(true);
    for (const r of rows.filter((x) => x.badgeRight !== undefined)) {
      // The badge ends at the item's content edge and the label stops before it.
      expect(r.badgeRight).toBeCloseTo(r.right - r.paddingRight - r.borderRight, 0);
      expect(r.labelRight).toBeLessThanOrEqual(r.badgeLeft!);
    }
    // A person's avatar is the 24px size, and receives no Phosphor weight.
    for (const r of rows.filter((x) => x.avatar !== null)) {
      expect(r.avatar).toBe(24);
      expect(r.weight).toBeNull();
    }
  });
});

test('a nav item is named by its label: no avatar initials, no count run into it', async ({ page }) => {
  await page.setViewportSize(SKETCH);
  await gotoStory(page, 'product-appshell--people-and-counts');
  const sidebar = dockedSidebar(page);
  // Chrome puts a space at the hidden span's edge; a screen reader doesn't voice it.
  await expect(sidebar.getByRole('link', { name: /^sep-close ?, 4 open$/ })).toBeVisible();
  await expect(sidebar.getByRole('link', { name: 'Daisuke Onodera', exact: true })).toBeVisible();
  await expect(sidebar.getByRole('link', { name: 'Close agent AI', exact: true })).toBeVisible();
});

test.describe('an unread nav item', () => {
  test('is the primary text at the resting weight, and says so to assistive technology', async ({ page }) => {
    await page.setViewportSize(SKETCH);
    await gotoStory(page, 'product-appshell--unread');
    const primary = await page.evaluate(() => {
      const probe = document.createElement('span');
      probe.className = 'text-text-primary';
      document.body.append(probe);
      const { color } = getComputedStyle(probe);
      probe.remove();
      return color;
    });
    await expect(navItem(page, /^payables\s*, unread$/)).toBeVisible();
    const unread = await textOf(page, /^payables/);
    const read = await textOf(page, /^cash$/);
    const active = await textOf(page, /^revenue$/);
    expect(unread.color).toBe(primary);
    expect(read.color).not.toBe(primary);
    expect(unread.fontWeight).toBe(read.fontWeight);
    // Semibold is what active draws, so a bold unread name would look selected.
    expect(active.fontWeight).toBe('600');
    expect(unread.fontWeight).not.toBe(active.fontWeight);
  });
});

/**
 * §3, "The page and the frame" (2026-11-12). In light mode the page is a warm
 * white and the pinned sidebar sits on the paper, a step under it. The step is
 * 1.05:1, so a region that lost its ground would look almost right: nothing
 * else would catch it.
 */
test.describe('grounds — the page and the frame', () => {
  test.use({ viewport: SKETCH });

  const ground = (page: Page, slot: string) =>
    page
      .locator(`[data-slot="${slot}"]`)
      .first()
      .evaluate((el) => getComputedStyle(el).backgroundColor);
  /** What a ground token paints for something placed inside a region. */
  const groundInside = (page: Page, slot: string, name: string) =>
    page
      .locator(`[data-slot="${slot}"]`)
      .first()
      .evaluate((el, tokenName) => {
        const probe = el.appendChild(document.createElement('div'));
        probe.style.backgroundColor = `var(${tokenName})`;
        const color = getComputedStyle(probe).backgroundColor;
        probe.remove();
        return color;
      }, name);
  const same = async (page: Page, a: string, b: string, what: string) =>
    expect(await contrastRatio(page, a, b), what).toBeCloseTo(1, 2);

  test('light: the sidebar is on the paper, and the top nav, main and panel on the page', async ({ page }) => {
    await gotoStory(page, 'product-appshell--expanded', 'light');
    const canvas = await token(page, '--color-canvas');
    const sunken = await token(page, '--color-surface-sunken');
    expect(await contrastRatio(page, canvas, sunken), 'the two grounds differ').toBeGreaterThan(1.03);

    await same(page, await ground(page, 'app-shell-sidebar'), sunken, 'sidebar');
    await same(page, await ground(page, 'app-shell'), canvas, 'the shell, which main shows through to');
    await same(page, await ground(page, 'app-bar'), canvas, 'top nav');
    await same(page, await ground(page, 'app-shell-panel'), canvas, 'panel');
  });

  test('light: the sidebar is the ground for what it holds, and its popups are on the page', async ({ page }) => {
    await gotoStory(page, 'product-appshell--expanded', 'light');
    const canvas = await token(page, '--color-canvas');
    const sunken = await token(page, '--color-surface-sunken');
    // A component that states bg-canvas or bg-surface inside the sidebar
    // paints the frame, not a patch of the page.
    await same(page, await groundInside(page, 'app-shell-sidebar', '--tui-canvas'), sunken, 'canvas in the sidebar');
    await same(page, await groundInside(page, 'app-shell-sidebar', '--tui-surface'), sunken, 'surface in the sidebar');
    // Raised is left alone: a popup is lighter than the frame it opens over.
    await same(page, await groundInside(page, 'app-shell-sidebar', '--tui-surface-raised'), canvas, 'raised');
  });

  test('light: the peek is an overlay on the raised surface, not a sunken region', async ({ page }) => {
    await gotoStory(page, 'product-appshell--collapsed', 'light');
    await navToggle(page).hover();
    await expect(dockedSidebar(page)).toHaveAttribute('data-state', 'peek');
    const raised = await token(page, '--color-surface-raised');
    await same(page, await ground(page, 'app-shell-sidebar'), raised, 'peek');
    await same(page, await groundInside(page, 'app-shell-sidebar', '--tui-canvas'), raised, 'canvas in the peek');
  });

  test('dark: there is no frame, and every region is the canvas', async ({ page }) => {
    await gotoStory(page, 'product-appshell--expanded', 'dark');
    const canvas = await token(page, '--color-canvas');
    for (const slot of ['app-shell-sidebar', 'app-shell', 'app-bar', 'app-shell-panel'])
      await same(page, await ground(page, slot), canvas, slot);
  });
});

/**
 * §7.9 "Resizing the sidebar and the panel". Every limit is read from its
 * token, never restated (failure log). The handle is a WAI-ARIA window
 * splitter, so every key it promises is pressed here.
 */
test.describe('resizing — §7.9', () => {
  const sidebarHandle = (page: Page) => page.locator('[data-slot="app-shell-sidebar-resize"]');
  const panelHandle = (page: Page) => page.locator('[data-slot="app-shell-panel-resize"]');

  async function limits(page: Page) {
    const px = (name: string) => tokenPx(page, name);
    return {
      sidebar: { min: await px('--w-sidebar-min'), def: await px('--w-sidebar'), max: await px('--w-sidebar-max') },
      panel: { min: await px('--w-panel-min'), def: await px('--w-panel'), max: await px('--w-panel-max') },
      mainMin: await px('--w-main-min'),
    };
  }

  const widths = async (page: Page) => ({
    sidebar: (await box(page, 'app-shell-sidebar')).width,
    panel: (await box(page, 'app-shell-panel')).width,
    main: (await box(page, 'app-shell-main')).width,
  });

  const valueOf = async (handle: ReturnType<typeof sidebarHandle>) => ({
    now: Number(await handle.getAttribute('aria-valuenow')),
    min: Number(await handle.getAttribute('aria-valuemin')),
    max: Number(await handle.getAttribute('aria-valuemax')),
  });

  /** A real drag: press on the strip, move in steps, release. */
  async function drag(page: Page, handle: ReturnType<typeof sidebarHandle>, dx: number) {
    const b = (await handle.boundingBox())!;
    const x = b.x + b.width / 2;
    const y = b.y + b.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + dx, y, { steps: 8 });
    await page.mouse.up();
  }

  test.describe('at the sketch width', () => {
    test.use({ viewport: SKETCH });

    test('each handle is its rule plus 7px to the right, full height, and the separator its region names', async ({
      page,
    }) => {
      await gotoStory(page, 'product-appshell--resizable');
      const sidebar = await box(page, 'app-shell-sidebar');
      const panelBox = await box(page, 'app-shell-panel');
      const s = (await sidebarHandle(page).boundingBox())!;
      const p = (await panelHandle(page).boundingBox())!;
      // The sidebar's rule is its last pixel column; the panel's its first.
      expect(s).toMatchObject({ x: sidebar.left + sidebar.width - 1, width: 8, y: 0, height: SKETCH.height });
      expect(p).toMatchObject({ x: panelBox.left, width: 8, y: panelBox.top, height: panelBox.height });

      for (const [handle, region] of [
        [sidebarHandle(page), page.getByRole('region', { name: 'Sidebar' })],
        [panelHandle(page), page.getByRole('complementary', { name: 'Chat' })],
      ] as const) {
        await expect(handle).toHaveAttribute('role', 'separator');
        await expect(handle).toHaveAttribute('aria-orientation', 'vertical');
        await expect(handle).toHaveAttribute('tabindex', '0');
        await expect(handle).toHaveAttribute('aria-controls', (await region.getAttribute('id'))!);
      }
      // Nothing covers the strip, the top nav included: the topmost element
      // at every pixel of it, top band and body, is the handle.
      for (const [handle, b] of [
        [sidebarHandle(page), s],
        [panelHandle(page), p],
      ] as const) {
        const slot = await handle.getAttribute('data-slot');
        for (const y of [b.y + 10, b.y + b.height / 2])
          for (let x = b.x; x < b.x + b.width; x++)
            expect(
              await page.evaluate(
                ([px, py]) => document.elementFromPoint(px, py)?.getAttribute('data-slot'),
                [x + 0.5, y],
              ),
              `${slot} at ${x},${y}`,
            ).toBe(slot);
      }
      await expect(page.getByRole('separator', { name: 'Resize sidebar' })).toHaveCount(1);
      await expect(page.getByRole('separator', { name: 'Resize panel' })).toHaveCount(1);
    });

    test('dragging the sidebar rule right widens it, and main gives the width', async ({ page }) => {
      await gotoStory(page, 'product-appshell--resizable');
      const l = await limits(page);
      const before = await widths(page);
      expect(before.sidebar).toBe(l.sidebar.def);
      await drag(page, sidebarHandle(page), 60);
      const after = await widths(page);
      expect(after.sidebar).toBe(l.sidebar.def + 60);
      expect(after.main).toBe(before.main - 60);
      expect(after.panel).toBe(before.panel);
      expect((await valueOf(sidebarHandle(page))).now).toBe(l.sidebar.def + 60);
    });

    test('dragging the panel rule left widens the panel', async ({ page }) => {
      await gotoStory(page, 'product-appshell--resizable');
      const l = await limits(page);
      const before = await widths(page);
      await drag(page, panelHandle(page), -60);
      const after = await widths(page);
      expect(after.panel).toBe(l.panel.def + 60);
      expect(after.main).toBe(before.main - 60);
      expect(after.sidebar).toBe(before.sidebar);
    });

    test('a drag stops at each limit, and main never drops under its floor', async ({ page }) => {
      await gotoStory(page, 'product-appshell--resizable');
      const l = await limits(page);
      await drag(page, sidebarHandle(page), -400);
      expect((await widths(page)).sidebar).toBe(l.sidebar.min);
      await drag(page, sidebarHandle(page), 600);
      expect((await widths(page)).sidebar).toBe(l.sidebar.max);
      // At 1440 the panel's ceiling is main's floor, not --w-panel-max.
      await drag(page, panelHandle(page), -800);
      const w = await widths(page);
      expect(w.panel).toBe(Math.min(l.panel.max, SKETCH.width - w.sidebar - l.mainMin));
      expect(w.main).toBe(l.mainMin);
      await drag(page, panelHandle(page), 800);
      expect((await widths(page)).panel).toBe(l.panel.min);
    });

    test('a drag holds the resize cursor on the page, selects no text, and lands back where it was', async ({
      page,
    }) => {
      await gotoStory(page, 'product-appshell--resizable');
      const b = (await sidebarHandle(page).boundingBox())!;
      await page.mouse.move(b.x + 4, 300);
      await page.mouse.down();
      // Well past the strip, across main's text.
      await page.mouse.move(b.x + 400, 400, { steps: 8 });
      expect(await page.evaluate(() => getComputedStyle(document.body).cursor)).toBe('col-resize');
      expect(await page.evaluate(() => getComputedStyle(document.body).userSelect)).toBe('none');
      await expect(sidebarHandle(page)).toHaveAttribute('data-dragging', '');
      await page.mouse.up();
      await expect(sidebarHandle(page)).not.toHaveAttribute('data-dragging');
      expect(await page.evaluate(() => String(getSelection()))).toBe('');
      expect(await page.evaluate(() => document.body.style.cursor)).toBe('');
    });

    test('every key of the window splitter, on the sidebar', async ({ page }) => {
      await gotoStory(page, 'product-appshell--resizable');
      const l = await limits(page);
      const handle = sidebarHandle(page);
      expect(await tabTo(page, handle)).toBe(true);
      const now = async () => (await valueOf(handle)).now;

      await page.keyboard.press('ArrowRight');
      expect(await now()).toBe(l.sidebar.def + 16);
      await page.keyboard.press('ArrowLeft');
      await page.keyboard.press('ArrowLeft');
      expect(await now()).toBe(l.sidebar.def - 16);
      await page.keyboard.press('Home');
      expect(await now()).toBe(l.sidebar.min);
      // Up and Down are optional on a vertical splitter, and do nothing here.
      await page.keyboard.press('ArrowUp');
      await page.keyboard.press('ArrowDown');
      expect(await now()).toBe(l.sidebar.min);
      await page.keyboard.press('End');
      expect(await now()).toBe((await valueOf(handle)).max);
      expect(await now()).toBe(l.sidebar.max);
      await page.keyboard.press('Enter');
      expect(await now()).toBe(l.sidebar.def);
      expect((await widths(page)).sidebar).toBe(l.sidebar.def);
      await expect(handle).toBeFocused();
    });

    test('every key of the window splitter, on the panel: left widens it', async ({ page }) => {
      await gotoStory(page, 'product-appshell--resizable');
      const l = await limits(page);
      const handle = panelHandle(page);
      expect(await tabTo(page, handle)).toBe(true);
      const now = async () => (await valueOf(handle)).now;

      await page.keyboard.press('ArrowLeft');
      expect(await now()).toBe(l.panel.def + 16);
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowRight');
      expect(await now()).toBe(l.panel.def - 16);
      await page.keyboard.press('Home');
      expect(await now()).toBe(l.panel.min);
      await page.keyboard.press('End');
      const { max } = await valueOf(handle);
      expect(await now()).toBe(max);
      expect(max).toBe(Math.min(l.panel.max, SKETCH.width - l.sidebar.def - l.mainMin));
      await page.keyboard.press('Enter');
      expect(await now()).toBe(l.panel.def);
      expect((await widths(page)).panel).toBe(l.panel.def);
    });

    test('a double-click returns a side to its default', async ({ page }) => {
      await gotoStory(page, 'product-appshell--resizable');
      const l = await limits(page);
      await drag(page, sidebarHandle(page), 80);
      expect((await widths(page)).sidebar).toBe(l.sidebar.def + 80);
      await sidebarHandle(page).dblclick();
      expect((await widths(page)).sidebar).toBe(l.sidebar.def);
    });

    test('widths survive a reload under the story key, and the story key alone holds them', async ({ page }) => {
      await gotoStory(page, 'product-appshell--resizable');
      const l = await limits(page);
      await drag(page, sidebarHandle(page), 40);
      await drag(page, panelHandle(page), -40);
      expect(JSON.parse((await page.evaluate(() => localStorage.getItem('tui-app-shell-widths-story')))!)).toEqual({
        sidebar: l.sidebar.def + 40,
        panel: l.panel.def + 40,
      });
      await page.reload();
      await gotoStory(page, 'product-appshell--resizable');
      expect(await widths(page)).toMatchObject({ sidebar: l.sidebar.def + 40, panel: l.panel.def + 40 });
      // Another shell, with its own key, keeps the defaults.
      await gotoStory(page, 'product-appshell--expanded');
      expect(await widths(page)).toMatchObject({ sidebar: l.sidebar.def, panel: l.panel.def });
    });

    test('widthStorageKey={null} remembers nothing', async ({ page }) => {
      await gotoStory(page, 'product-appshell--expanded');
      const l = await limits(page);
      await drag(page, sidebarHandle(page), 40);
      expect((await widths(page)).sidebar).toBe(l.sidebar.def + 40);
      expect(await page.evaluate(() => localStorage.length)).toBe(0);
      await page.reload();
      await gotoStory(page, 'product-appshell--expanded');
      expect((await widths(page)).sidebar).toBe(l.sidebar.def);
    });

    test('no handle on the collapsed sidebar, the peek, or a closed panel', async ({ page }) => {
      await gotoStory(page, 'product-appshell--collapsed');
      await expect(sidebarHandle(page)).toHaveCount(0);
      await navToggle(page).hover();
      await expect(dockedSidebar(page)).toHaveAttribute('data-state', 'peek');
      await expect(sidebarHandle(page)).toHaveCount(0);
      await expect(panelHandle(page)).toHaveCount(1);

      await gotoStory(page, 'product-appshell--chat-closed');
      await expect(panelHandle(page)).toHaveCount(0);
      await expect(sidebarHandle(page)).toHaveCount(1);
    });

    test('the peek shows at the width the person set', async ({ page }) => {
      await gotoStory(page, 'product-appshell--resizable');
      const l = await limits(page);
      await drag(page, sidebarHandle(page), 50);
      await headerToggle(page).click();
      await navToggle(page).hover();
      await expect(dockedSidebar(page)).toHaveAttribute('data-state', 'peek');
      expect((await box(page, 'app-shell-sidebar')).width).toBe(l.sidebar.def + 50);
    });

    for (const theme of ['dark', 'light'] as const) {
      test(`${theme}: focus is an outline inside the strip, and hover and drag take the neutral overlay`, async ({
        page,
      }) => {
        await gotoStory(page, 'product-appshell--resizable', theme);
        const handle = sidebarHandle(page);
        expect(await tabTo(page, handle)).toBe(true);
        const ring = (await focusRingStyle(page))!;
        const ringWidth = `${await tokenPx(page, '--ring-width')}px`;
        expect(ring).toMatchObject({ outlineStyle: 'solid', outlineWidth: ringWidth, boxShadow: 'none' });
        expect(ring.outlineOffset).toBe(`-${ringWidth}`);
        expect(await rgba(page, ring.outlineColor)).toEqual(await rgba(page, await token(page, '--color-ring')));

        const bg = () => handle.evaluate((el) => getComputedStyle(el).backgroundColor);
        await page.keyboard.press('Tab'); // off the handle, so focus doesn't colour what follows
        const b = (await handle.boundingBox())!;
        await page.mouse.move(b.x + 4, 300);
        await expect
          .poll(async () => rgba(page, await bg()))
          .toEqual(await rgba(page, await token(page, '--color-bg-hover')));
        await page.mouse.down();
        await page.mouse.move(b.x + 24, 300, { steps: 4 });
        await expect
          .poll(async () => rgba(page, await bg()))
          .toEqual(await rgba(page, await token(page, '--color-bg-active')));
        await page.mouse.up();
      });
    }
  });

  test.describe('at the 1280px floor', () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    test('neither side can grow until the other shrinks, and main keeps its floor', async ({ page }) => {
      await gotoStory(page, 'product-appshell--at-floor');
      const l = await limits(page);
      expect(await valueOf(sidebarHandle(page))).toEqual({
        now: l.sidebar.def,
        min: l.sidebar.min,
        max: l.sidebar.def,
      });
      expect(await valueOf(panelHandle(page))).toEqual({ now: l.panel.def, min: l.panel.min, max: l.panel.def });
      await drag(page, sidebarHandle(page), 80);
      await drag(page, panelHandle(page), -80);
      expect(await widths(page)).toEqual({ sidebar: l.sidebar.def, panel: l.panel.def, main: l.mainMin });

      // Trade: the sidebar gives up width, and the panel can take it.
      expect(await tabTo(page, sidebarHandle(page))).toBe(true);
      await page.keyboard.press('Home');
      const freed = l.sidebar.def - l.sidebar.min;
      expect((await valueOf(panelHandle(page))).max).toBe(l.panel.def + freed);
      expect(await tabTo(page, panelHandle(page))).toBe(true);
      await page.keyboard.press('End');
      expect(await widths(page)).toEqual({ sidebar: l.sidebar.min, panel: l.panel.def + freed, main: l.mainMin });
      // And the sidebar now can't grow back.
      expect((await valueOf(sidebarHandle(page))).max).toBe(l.sidebar.min);
    });

    test('both sides at their minimums', async ({ page }) => {
      await gotoStory(page, 'product-appshell--resized-to-minimums');
      const l = await limits(page);
      expect(await widths(page)).toEqual({
        sidebar: l.sidebar.min,
        panel: l.panel.min,
        main: 1280 - l.sidebar.min - l.panel.min,
      });
    });

    test('stored widths wider than the window: the sidebar yields first, and both come back', async ({ page }) => {
      await gotoStory(page, 'product-appshell--resized-to-maximums');
      const l = await limits(page);
      expect(await widths(page)).toEqual({
        sidebar: l.sidebar.min,
        panel: 1280 - l.sidebar.min - l.mainMin,
        main: l.mainMin,
      });
      await page.setViewportSize({ width: 2560, height: 1440 });
      await expect.poll(async () => (await widths(page)).sidebar).toBe(l.sidebar.max);
      expect((await widths(page)).panel).toBe(l.panel.max);
      // Opening the window back out rewrote nothing: the stored values stand.
      expect(
        JSON.parse((await page.evaluate(() => localStorage.getItem('tui-app-shell-widths-story-maximums')))!),
      ).toEqual({ sidebar: Number.MAX_SAFE_INTEGER, panel: Number.MAX_SAFE_INTEGER });
    });
  });

  test.describe('below the floor', () => {
    test.use({ viewport: BELOW_FLOOR });

    test('pinned beside the panel, both sides sit at their minimums and their handles cannot widen', async ({
      page,
    }) => {
      await gotoStory(page, 'product-appshell--expanded');
      const l = await limits(page);
      await navToggle(page).click();
      await expect(dockedSidebar(page)).toHaveAttribute('data-state', 'pinned');
      expect(await widths(page)).toEqual({
        sidebar: l.sidebar.min,
        panel: l.panel.min,
        main: BELOW_FLOOR.width - l.sidebar.min - l.panel.min,
      });
      expect(await valueOf(sidebarHandle(page))).toEqual({
        now: l.sidebar.min,
        min: l.sidebar.min,
        max: l.sidebar.min,
      });
      expect(await valueOf(panelHandle(page))).toEqual({ now: l.panel.min, min: l.panel.min, max: l.panel.min });
    });

    test('collapsed, the panel leaves main its floor', async ({ page }) => {
      await gotoStory(page, 'product-appshell--expanded');
      const l = await limits(page);
      await expect(dockedSidebar(page)).toBeHidden();
      const panelWidth = (await box(page, 'app-shell-panel')).width;
      expect(panelWidth).toBe(Math.min(l.panel.def, BELOW_FLOOR.width - l.mainMin));
      expect((await box(page, 'app-shell-main')).width).toBe(BELOW_FLOOR.width - panelWidth);
    });
  });
});
