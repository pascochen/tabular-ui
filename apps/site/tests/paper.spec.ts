import { expect, test, type Page } from '@playwright/test';

/**
 * The hero's paper (docs/site.md D3, item 3). A mask that fails paints nothing and
 * raises no error, and axe can't measure this hero: its contrast rule reports the
 * hero's text as incomplete, not passed. So these read pixels, with the text and the
 * rules hidden, on what a visitor's screen would show.
 */

const hero = 'section[aria-labelledby="hero-title"]';
const lead = '#hero-title + p';

type Box = { x: number; y: number; width: number; height: number };

async function hideEverythingButThePaper(page: Page) {
  await page.addStyleTag({ content: `${hero} > :not(.site-sheet), .site-sheet-rules { visibility: hidden; }` });
}

/** The ground behind the lead: how much it varies, and the lead's contrast on its mean. */
async function groundBehindLead(page: Page) {
  const box = (await page.locator(lead).boundingBox()) as Box;
  const color = await page.locator(lead).evaluate((el) => getComputedStyle(el).color);
  await hideEverythingButThePaper(page);
  const png = await page.screenshot({ clip: box, fullPage: true });
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
 * The hero's marks, each against the mean of the 25px around it. A small mark over
 * 1.05:1 is what made ink specks read as a dirty screen: they scored 1,561 per
 * 100,000 pixels here.
 */
async function marks(page: Page) {
  const box = (await page.locator(hero).boundingBox()) as Box;
  await hideEverythingButThePaper(page);
  const width = Math.min(1200, box.width - 40);
  const clip = { x: box.x + (box.width - width) / 2, y: box.y + 70, width, height: box.height - 140 };
  const png = await page.screenshot({ clip, fullPage: true });
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
        const contrast = (total / ((right - left) * (bottom - top)) + 0.05) / (luminance[y * w + x] + 0.05);
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
      expect(deviation, 'the ground varies, so the mask loaded').toBeGreaterThan(1);
      expect(contrast, 'text-secondary on the paper').toBeGreaterThanOrEqual(6.4);
    });

    // Under 20, not 0: a handful of marks just over the line can differ between
    // machines, and nothing that reads as dirt comes near it (Stronger scored 279).
    test('no mark reads as dirt, and none outweighs the rules', async ({ page }) => {
      await page.goto('/');
      const { strongest, dotsPer100k } = await marks(page);
      expect(dotsPer100k, 'isolated dots per 100,000 pixels').toBeLessThan(20);
      expect(strongest, 'the rules measure 1.137:1').toBeLessThan(1.137);
    });
  });
}

test('the hero itself has no ground, so the canvas token stays paper', async ({ page }) => {
  await page.goto('/');
  const ground = await page.locator(hero).evaluate((el) => {
    const style = getComputedStyle(el);
    return { color: style.backgroundColor, image: style.backgroundImage };
  });
  expect(ground).toEqual({ color: 'rgba(0, 0, 0, 0)', image: 'none' });
});

test('in forced colours, the paper drops with the sheet', async ({ page }) => {
  await page.goto('/');
  await page.emulateMedia({ forcedColors: 'active' });
  await expect(page.locator('.site-sheet')).toBeHidden();
});
