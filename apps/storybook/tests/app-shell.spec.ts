import { expect, test, type Page } from '@playwright/test';

import { focusRingStyle, gotoStory, ringOverhang, tabTo } from './helpers';

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
    expect((await box(page, 'app-shell-sidebar')).left).toBe(0);
    expect((await box(page, 'app-shell-top-nav')).left).toBe(240);
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
