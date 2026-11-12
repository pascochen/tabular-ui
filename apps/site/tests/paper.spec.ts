import { expect, test, type Page } from '@playwright/test';

import { routes } from './routes';

/**
 * The page's paper and the closing band's ink (docs/site.md D3). A tile or a mask
 * that fails paints nothing and raises no error, and axe can't see a background
 * image at all: it measures text against the body's colour. So these read pixels,
 * with the text and the rules hidden, on what a visitor's screen would show. The
 * hero stands for the page: it has no ground of its own, so what's behind its lead
 * is the paper.
 */

const hero = 'section[aria-labelledby="hero-title"]';
const lead = '#hero-title + p';
const band = '.site-ink';

type Box = { x: number; y: number; width: number; height: number };

async function hideEverythingButThePaper(page: Page) {
  await page.addStyleTag({ content: `${hero} > :not(.site-sheet), .site-sheet-rules { visibility: hidden; }` });
}

/** The ground behind the lead: how much it varies, and the lead's contrast on its mean. */
async function groundBehindLead(page: Page) {
  const box = (await page.locator(lead).boundingBox()) as Box;
  const color = await page.locator(lead).evaluate((el) => getComputedStyle(el).color);
  await hideEverythingButThePaper(page);
  return groundIn(page, await page.screenshot({ clip: box, fullPage: true }), color);
}

/** How much a picture of the ground varies, and a text colour's contrast on its mean. */
function groundIn(page: Page, png: Buffer, color: string) {
  return page.evaluate(
    async ({ base64, color }) => {
      const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      const bitmap = await createImageBitmap(new Blob([bytes], { type: 'image/png' }));
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const context = canvas.getContext('2d', { willReadFrequently: true })!;
      context.drawImage(bitmap, 0, 0);
      const { data } = context.getImageData(0, 0, bitmap.width, bitmap.height);

      const pixels = data.length / 4;
      const sum = [0, 0, 0];
      let luma = 0;
      let lumaSquared = 0;
      for (let i = 0; i < data.length; i += 4) {
        const value = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
        luma += value;
        lumaSquared += value * value;
        for (const channel of [0, 1, 2]) sum[channel] += data[i + channel];
      }

      const linear = (v: number) => {
        const s = v / 255;
        return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      };
      const luminance = ([r, g, b]: number[]) => 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);

      // The canvas resolves the computed colour, whatever colour space it's in.
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);
      const text = luminance([...context.getImageData(0, 0, 1, 1).data].slice(0, 3));
      const ground = luminance(sum.map((total) => total / pixels));

      return {
        deviation: Math.sqrt(Math.max(0, lumaSquared / pixels - (luma / pixels) ** 2)),
        contrast: (Math.max(text, ground) + 0.05) / (Math.min(text, ground) + 0.05),
      };
    },
    { base64: png.toString('base64'), color },
  );
}

/**
 * The paper's marks, each against the mean of the 25px around it. A small mark over
 * 1.05:1 is what made ink specks read as a dirty screen: they scored 1,561 per
 * 100,000 pixels here. Both directions count: paper's marks are darker than their
 * ground and ink's are lighter, so a ratio that looks only one way under-reads one
 * of them.
 */
async function marks(page: Page) {
  const box = (await page.locator(hero).boundingBox()) as Box;
  await hideEverythingButThePaper(page);
  const width = Math.min(1200, box.width - 40);
  const clip = { x: box.x + (box.width - width) / 2, y: box.y + 70, width, height: box.height - 140 };
  return marksIn(page, await page.screenshot({ clip, fullPage: true }));
}

function marksIn(page: Page, png: Buffer) {
  return page.evaluate(async (base64) => {
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const bitmap = await createImageBitmap(new Blob([bytes], { type: 'image/png' }));
    const canvas = document.createElement('canvas');
    const w = (canvas.width = bitmap.width);
    const h = (canvas.height = bitmap.height);
    const context = canvas.getContext('2d', { willReadFrequently: true })!;
    context.drawImage(bitmap, 0, 0);
    const { data } = context.getImageData(0, 0, w, h);

    const linear = (v: number) => {
      const s = v / 255;
      return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    };
    const luminance = new Float64Array(w * h);
    for (let p = 0; p < w * h; p++) {
      luminance[p] = 0.2126 * linear(data[p * 4]) + 0.7152 * linear(data[p * 4 + 1]) + 0.0722 * linear(data[p * 4 + 2]);
    }
    const area = new Float64Array((w + 1) * (h + 1));
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        area[(y + 1) * (w + 1) + x + 1] =
          luminance[y * w + x] + area[y * (w + 1) + x + 1] + area[(y + 1) * (w + 1) + x] - area[y * (w + 1) + x];
      }
    }

    const reach = 12;
    const marked = new Uint8Array(w * h);
    let strongest = 1;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const [left, right] = [Math.max(0, x - reach), Math.min(w, x + reach + 1)];
        const [top, bottom] = [Math.max(0, y - reach), Math.min(h, y + reach + 1)];
        const total =
          area[bottom * (w + 1) + right] -
          area[top * (w + 1) + right] -
          area[bottom * (w + 1) + left] +
          area[top * (w + 1) + left];
        const around = total / ((right - left) * (bottom - top));
        const here = luminance[y * w + x];
        const contrast = (Math.max(around, here) + 0.05) / (Math.min(around, here) + 0.05);
        strongest = Math.max(strongest, contrast);
        if (contrast > 1.05) marked[y * w + x] = 1;
      }
    }

    let dots = 0;
    const seen = new Uint8Array(w * h);
    for (let start = 0; start < w * h; start++) {
      if (!marked[start] || seen[start]) continue;
      let size = 0;
      const stack = [start];
      seen[start] = 1;
      while (stack.length) {
        const p = stack.pop()!;
        size++;
        const x = p % w;
        const neighbours = [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, p - w, p + w];
        for (const n of neighbours) {
          if (n < 0 || n >= w * h || seen[n] || !marked[n]) continue;
          seen[n] = 1;
          stack.push(n);
        }
      }
      if (size <= 12) dots++;
    }
    return { strongest, dotsPer100k: (dots * 100_000) / (w * h) };
  }, png.toString('base64'));
}

for (const { width, height, scale } of [
  { width: 1440, height: 900, scale: 1 },
  { width: 1440, height: 900, scale: 2 },
  { width: 390, height: 844, scale: 3 },
]) {
  test.describe(`at ${width}px and ${scale}x`, () => {
    test.use({ viewport: { width, height }, deviceScaleFactor: scale });

    test('the paper paints, and the lead keeps its contrast', async ({ page }) => {
      await page.goto('/');
      const { deviation, contrast } = await groundBehindLead(page);
      expect(deviation, 'the ground varies, so the tile loaded').toBeGreaterThan(1);
      expect(contrast, 'text-secondary on the paper: 6.64:1 on the plain ground').toBeGreaterThanOrEqual(6.55);
    });

    // Under 20, not 0: a handful of marks just over the line can differ between
    // machines, and nothing that reads as dirt comes near it (the same tile as a
    // lossy WebP scored 70 to 120, from the encoder's own marks). 1.06 is the 1.05
    // line with room for a machine's rounding: the tile measures 1.049 to 1.053.
    test('no mark reads as dirt', async ({ page }) => {
      await page.goto('/');
      const { strongest, dotsPer100k } = await marks(page);
      expect(dotsPer100k, 'isolated dots per 100,000 pixels').toBeLessThan(20);
      expect(strongest, 'the mark D3 calls dirt is over 1.05:1').toBeLessThan(1.06);
    });
  });
}

/**
 * A picture of the band with its text hidden, and the lead's colour. The ink tiles
 * evenly, so the whole band stands for the ground behind the lead.
 */
async function theBand(page: Page) {
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  const color = await page.locator(`${band} p`).evaluate((el) => getComputedStyle(el).color);
  await page.addStyleTag({ content: `${band} > * { visibility: hidden; }` });
  return { color, png: await page.locator(band).screenshot() };
}

for (const { width, height, scale } of [
  { width: 1440, height: 900, scale: 1 },
  { width: 1440, height: 900, scale: 2 },
  { width: 390, height: 844, scale: 3 },
]) {
  test.describe(`the closing band at ${width}px and ${scale}x`, () => {
    test.use({ viewport: { width, height }, deviceScaleFactor: scale });

    test('the ink paints, and the lead keeps its contrast', async ({ page }) => {
      const { color, png } = await theBand(page);
      const { deviation, contrast } = await groundIn(page, png, color);
      expect(deviation, 'the ground varies, so the mask loaded').toBeGreaterThan(0.2);
      expect(contrast, 'text-secondary on the ink').toBeGreaterThanOrEqual(9.8);
    });

    // 1.06: 1.05, which the hero's paper measured until 2026-11-12, with room for a
    // machine's rounding. --tui-border-strong
    // scored 1.08 and 1,654 dots at 1x. --color-border-strong, which stays at its
    // light value in this band, scored 1.25.
    test('no mark reads as dirt, and none passes the strength it was chosen at', async ({ page }) => {
      const { png } = await theBand(page);
      const { strongest, dotsPer100k } = await marksIn(page, png);
      expect(dotsPer100k, 'isolated dots per 100,000 pixels').toBeLessThan(20);
      expect(strongest, 'the band was chosen at 1.05:1').toBeLessThan(1.06);
    });
  });
}

test('the closing band keeps the canvas as its ground, under the ink', async ({ page }) => {
  await page.goto('/');
  const { theme, ground, canvas, isolation, inkLayer } = await page.locator(band).evaluate((el) => {
    const probe = document.createElement('div');
    probe.style.backgroundColor = 'var(--tui-canvas)';
    el.append(probe);
    const canvas = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return {
      theme: el.getAttribute('data-theme'),
      ground: getComputedStyle(el).backgroundColor,
      canvas,
      isolation: getComputedStyle(el).isolation,
      inkLayer: getComputedStyle(el, '::before').zIndex,
    };
  });
  expect(theme).toBe('dark');
  expect(ground).toBe(canvas);
  expect(isolation).toBe('isolate');
  expect(inkLayer).toBe('-1');
});

test('the hero itself has no ground, so the canvas token stays paper', async ({ page }) => {
  await page.goto('/');
  const ground = await page.locator(hero).evaluate((el) => {
    const style = getComputedStyle(el);
    return { color: style.backgroundColor, image: style.backgroundImage };
  });
  expect(ground).toEqual({ color: 'rgba(0, 0, 0, 0)', image: 'none' });
});

test('in forced colours, the paper drops, and the sheet and the ink with it', async ({ page }) => {
  await page.goto('/');
  await page.emulateMedia({ forcedColors: 'active' });
  await expect(page.locator('.site-sheet')).toBeHidden();
  const ink = await page.locator(band).evaluate((el) => getComputedStyle(el, '::before').display);
  expect(ink).toBe('none');
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundImage)).toBe('none');
});

/**
 * The tile is baked on the page ground by scripts/paper-tile.mjs, so its colour is
 * a copy of the token's. If the palette's paper moves and the script isn't run, the
 * tile keeps the old colour and every flat panel shows as a patch. Within 1 level
 * in 255: WebP moves the mean by about 0.2.
 */
for (const scale of [1, 2]) {
  test.describe(`the tile at ${scale}x`, () => {
    test.use({ deviceScaleFactor: scale });

    test('is the file for this density, on the page ground', async ({ page }) => {
      const loaded = page.waitForResponse((response) => /paper-\dx[^/]*\.webp$/.test(response.url()));
      await page.goto('/');
      const response = await loaded;
      expect(response.status()).toBe(200);
      expect(response.url()).toContain(`paper-${scale}x`);

      const { mean, ground, side } = await page.evaluate(async (url) => {
        const image = new Image();
        image.src = url;
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext('2d', { willReadFrequently: true })!;
        context.drawImage(image, 0, 0);
        const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
        const sum = [0, 0, 0];
        for (let i = 0; i < data.length; i += 4) for (const channel of [0, 1, 2]) sum[channel] += data[i + channel];
        // The canvas resolves the computed colour, whatever colour space it's in.
        context.fillStyle = getComputedStyle(document.body).backgroundColor;
        context.fillRect(0, 0, 1, 1);
        return {
          mean: sum.map((total) => total / (data.length / 4)),
          ground: [...context.getImageData(0, 0, 1, 1).data].slice(0, 3),
          side: image.naturalWidth / parseFloat(getComputedStyle(document.body).backgroundSize),
        };
      }, response.url());
      for (const channel of [0, 1, 2]) expect(Math.abs(mean[channel] - ground[channel])).toBeLessThan(1);
      expect(side, 'one image pixel per device pixel').toBe(scale);
    });
  });
}

/**
 * The paper is never behind data. A bordered box with no ground of its own would
 * show it, and nothing would fail, so this looks for one on every route. Boxes
 * over 40px tall: a control or a tag is shorter, and may sit on the paper. Dark
 * plates and the closing band are checked through their own ground, which is
 * opaque, so anything inside them is skipped.
 */
for (const route of routes) {
  test(`${route}: every bordered panel states its ground`, async ({ page }) => {
    await page.goto(route);
    const bare = await page.evaluate(() => {
      const found: string[] = [];
      for (const el of document.querySelectorAll('header *, main *, footer *')) {
        if (el.closest('[data-theme="dark"]')) continue;
        const style = getComputedStyle(el);
        const bordered = (['Top', 'Right', 'Bottom', 'Left'] as const).every(
          (side) => parseFloat(style[`border${side}Width`]) > 0,
        );
        if (!bordered || el.getBoundingClientRect().height <= 40) continue;
        let ground = 'rgba(0, 0, 0, 0)';
        for (let node: Element | null = el; node && node !== document.body; node = node.parentElement) {
          ground = getComputedStyle(node).backgroundColor;
          if (ground !== 'rgba(0, 0, 0, 0)') break;
        }
        if (ground === 'rgba(0, 0, 0, 0)') found.push(`<${el.tagName.toLowerCase()} class="${el.className}">`);
      }
      return found;
    });
    expect(bare).toEqual([]);
  });
}
