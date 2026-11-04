import { expect, test, type Locator, type Page } from '@playwright/test';

import { gotoStory } from './helpers';

/**
 * §5's split of an unsettled item: `needs-review` waits on the viewer and takes
 * the ochre, `open` doesn't and takes none. `StatusDot` draws the same two as
 * solid and hollow.
 *
 * The dot's assertions read painted pixels. A computed border is not a painted
 * one (failure log, the agent rail), and forced colours replace what paints
 * without always changing what a style reads as.
 */

const MODES = ['dark', 'light'] as const;
const CLIP_MARGIN = 2;

type Rgb = [number, number, number];

/** The pixels at the dot's centre and left edge, and the ground just outside it. */
async function paint(page: Page, dot: Locator): Promise<{ centre: Rgb; edge: Rgb; ground: Rgb }> {
  const box = (await dot.boundingBox())!;
  const png = await page.screenshot({
    clip: {
      x: box.x - CLIP_MARGIN,
      y: box.y - CLIP_MARGIN,
      width: box.width + CLIP_MARGIN * 2,
      height: box.height + CLIP_MARGIN * 2,
    },
  });
  return page.evaluate(
    async ({ base64, margin, size }) => {
      const image = new Image();
      image.src = `data:image/png;base64,${base64}`;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const context = canvas.getContext('2d')!;
      context.drawImage(image, 0, 0);
      const at = (x: number, y: number) => Array.from(context.getImageData(x, y, 1, 1).data.slice(0, 3)) as Rgb;
      const middle = margin + size / 2;
      return { centre: at(middle, middle), edge: at(margin, middle), ground: at(0, 0) };
    },
    { base64: png.toString('base64'), margin: CLIP_MARGIN, size: box.width },
  );
}

/** Summed channel distance. Under 8 is the same colour, allowing for rounding. */
const apart = (a: Rgb, b: Rgb) => a.reduce((sum, value, i) => sum + Math.abs(value - b[i]), 0);

for (const mode of MODES) {
  test(`an open badge draws the neutral tone, and needs-review keeps the warning tone — ${mode}`, async ({ page }) => {
    await gotoStory(page, 'product-statusbadge--all-states', mode);
    const colours = await page.evaluate(() => {
      const read = (status: string) => {
        const s = getComputedStyle(document.querySelector(`[data-status="${status}"]`)!);
        return { text: s.color, ground: s.backgroundColor };
      };
      return { open: read('open'), queued: read('queued'), review: read('needs-review') };
    });
    expect(colours.open).toEqual(colours.queued);
    expect(colours.open.text).not.toEqual(colours.review.text);
    expect(colours.open.ground).not.toEqual(colours.review.ground);
  });

  for (const forced of [false, true]) {
    const named = forced ? `${mode}, forced colours` : mode;

    test(`the needs-review dot paints solid — ${named}`, async ({ page }) => {
      if (forced) await page.emulateMedia({ forcedColors: 'active' });
      await gotoStory(page, 'product-statusdot--kinds', mode);
      const { centre, ground } = await paint(page, page.locator('[data-status="needs-review"]'));
      expect(apart(centre, ground)).toBeGreaterThan(40);
    });

    test(`the open dot paints a ring with no fill — ${named}`, async ({ page }) => {
      if (forced) await page.emulateMedia({ forcedColors: 'active' });
      await gotoStory(page, 'product-statusdot--kinds', mode);
      const { centre, edge, ground } = await paint(page, page.locator('[data-status="open"]'));
      expect(apart(centre, ground)).toBeLessThan(8);
      expect(apart(edge, ground)).toBeGreaterThan(40);
    });
  }

  test(`the open ring is neutral, and both dots are 6px — ${mode}`, async ({ page }) => {
    await gotoStory(page, 'product-statusdot--kinds', mode);
    const dots = await page.evaluate(() => {
      const probe = document.createElement('span');
      probe.style.color = 'var(--tui-text-secondary)';
      document.body.append(probe);
      const secondary = getComputedStyle(probe).color;
      probe.remove();
      const read = (status: string) => {
        const el = document.querySelector(`[data-status="${status}"]`)!;
        const s = getComputedStyle(el);
        const box = el.getBoundingClientRect();
        return { ring: s.borderTopColor, width: box.width, height: box.height };
      };
      return { secondary, open: read('open'), review: read('needs-review') };
    });
    expect(dots.open.ring).toBe(dots.secondary);
    expect([dots.open.width, dots.open.height, dots.review.width, dots.review.height]).toEqual([6, 6, 6, 6]);
  });
}

test('a dot is hidden from assistive technology, and its meaning follows the name as text', async ({ page }) => {
  await gotoStory(page, 'product-statusdot--in-sidebar');
  await expect(page.locator('[data-slot="status-dot"]').first()).toHaveAttribute('aria-hidden', 'true');
  // The hidden text is out of flow, so the browser may put a space before its comma.
  await expect(page.getByRole('link', { name: /^revenue\s*, needs your answer$/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /^payables\s*, open finding$/ })).toBeVisible();
});
