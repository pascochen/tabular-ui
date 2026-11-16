import { expect, test, type Page } from '@playwright/test';

import { routes } from './routes';

/**
 * The page's ground, the hero specimen's paper and the closing band's ink
 * (docs/site.md D3). A tile or a mask that fails paints nothing and raises no
 * error, and axe can't see a background image at all: it measures text against
 * the element's colour. So these read pixels, with the text hidden, on what a
 * visitor's screen would show. The hero section has no ground of its own, so
 * what's behind its lead is the page. Since 2026-11-16 the page is plain and
 * the paper tile covers the hero specimen's frame alone; the hero's ruled sheet
 * is gone.
 */

const hero = 'section[aria-labelledby="hero-title"]';
const lead = '#hero-title + p';
const band = '.site-ink';
const grain = '.site-grain';

type Box = { x: number; y: number; width: number; height: number };

/** The ground behind the lead: how much it varies, and the lead's contrast on its mean. */
async function groundBehindLead(page: Page) {
  const box = (await page.locator(lead).boundingBox()) as Box;
  const color = await page.locator(lead).evaluate((el) => getComputedStyle(el).color);
  await page.addStyleTag({ content: `${hero} > * { visibility: hidden; }` });
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
 * The marks of a paper or an ink, each against the mean of the 25px around it. A
 * small mark over 1.05:1 is what made ink specks read as a dirty screen: they
 * scored 1,561 per 100,000 pixels. Both directions count: paper's marks are darker
 * than their ground and ink's are lighter, so a ratio that looks only one way
 * under-reads one of them.
 */
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

/** A colour token, resolved by the browser, as the computed colour of a probe. */
function resolved(page: Page, token: string, property: 'background-color' | 'border-color' = 'background-color') {
  return page.evaluate(
    ([token, property]) => {
      const probe = document.createElement('div');
      probe.style.setProperty(property, `var(${token})`);
      if (property === 'border-color') probe.style.borderStyle = 'solid';
      document.body.append(probe);
      const style = getComputedStyle(probe);
      const value = property === 'border-color' ? style.borderTopColor : style.backgroundColor;
      probe.remove();
      return value;
    },
    [token, property] as const,
  );
}

/**
 * The hero specimen's paper, with everything in it hidden: the frame's inside,
 * clear of its 1px edge, and the lead's colour, which is text-secondary, the
 * colour of the specimen's quieter text.
 */
async function thePaper(page: Page) {
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  const color = await page.locator(lead).evaluate((el) => getComputedStyle(el).color);
  const box = (await page.locator(grain).boundingBox()) as Box;
  await page.addStyleTag({ content: `${grain} * { visibility: hidden; }` });
  const clip = { x: box.x + 4, y: box.y + 4, width: box.width - 8, height: box.height - 8 };
  return { color, png: await page.screenshot({ clip, fullPage: true }) };
}

for (const { width, height, scale } of [
  { width: 1440, height: 900, scale: 1 },
  { width: 1440, height: 900, scale: 2 },
  { width: 390, height: 844, scale: 3 },
]) {
  test.describe(`at ${width}px and ${scale}x`, () => {
    test.use({ viewport: { width, height }, deviceScaleFactor: scale });

    // Plain since 2026-11-16: no tile, no rules. text-secondary measures 6.95:1 on
    // the canvas (design-system.md §3).
    test('the page is the plain canvas, and the lead keeps its contrast', async ({ page }) => {
      await page.goto('/');
      const canvas = await resolved(page, '--color-canvas');
      const { deviation, contrast } = await groundBehindLead(page);
      expect(deviation, 'the ground is flat').toBeLessThan(0.5);
      expect(contrast, 'text-secondary on the canvas').toBeGreaterThanOrEqual(6.95);
      const body = await page.evaluate(() => {
        const style = getComputedStyle(document.body);
        return { image: style.backgroundImage, color: style.backgroundColor };
      });
      expect(body).toEqual({ image: 'none', color: canvas });
    });

    // The paper's tooth runs under the specimen's text. text-secondary is about
    // 5% lower on the paper than on the canvas (§3), and the tile's mean is the
    // paper, so it holds what the plain paper does.
    test('the hero specimen’s paper paints, and its text keeps its contrast', async ({ page }) => {
      const { color, png } = await thePaper(page);
      const { deviation, contrast } = await groundIn(page, png, color);
      expect(deviation, 'the ground varies, so the tile loaded').toBeGreaterThan(1);
      expect(contrast, 'text-secondary on the paper').toBeGreaterThanOrEqual(6.55);
    });

    // Under 20, not 0: a handful of marks just over the line can differ between
    // machines, and nothing that reads as dirt comes near it (the same tile as a
    // lossy WebP scored 70 to 120, from the encoder's own marks). 1.06 is the 1.05
    // line with room for a machine's rounding.
    test('no mark on the hero specimen’s paper reads as dirt', async ({ page }) => {
      const { png } = await thePaper(page);
      const { strongest, dotsPer100k } = await marksIn(page, png);
      expect(dotsPer100k, 'isolated dots per 100,000 pixels').toBeLessThan(20);
      expect(strongest, 'the mark D3 calls dirt is over 1.05:1').toBeLessThan(1.06);
    });
  });
}

/**
 * The tile is baked on the panel ground by scripts/paper-tile.mjs, so its colour
 * is a copy of the token's. If the palette's paper moves and the script isn't
 * run, the tile keeps the old colour and the hero's frame shows a patch around
 * every component that states its ground. Within 1 level in 255: WebP moves the
 * mean by about 0.2.
 */
for (const scale of [1, 2]) {
  test.describe(`the tile at ${scale}x`, () => {
    test.use({ deviceScaleFactor: scale });

    test('is the file for this density, on the panel ground', async ({ page }) => {
      const loaded = page.waitForResponse((response) => /paper-\dx[^/]*\.webp$/.test(response.url()));
      await page.goto('/');
      const response = await loaded;
      expect(response.status()).toBe(200);
      expect(response.url()).toContain(`paper-${scale}x`);

      const { mean, ground, side } = await page.evaluate(
        async ([url, grain]) => {
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
          const frame = getComputedStyle(document.querySelector(grain)!);
          context.fillStyle = frame.backgroundColor;
          context.fillRect(0, 0, 1, 1);
          return {
            mean: sum.map((total) => total / (data.length / 4)),
            ground: [...context.getImageData(0, 0, 1, 1).data].slice(0, 3),
            side: image.naturalWidth / parseFloat(frame.backgroundSize),
          };
        },
        [response.url(), grain] as const,
      );
      for (const channel of [0, 1, 2]) expect(Math.abs(mean[channel] - ground[channel])).toBeLessThan(1);
      expect(side, 'one image pixel per device pixel').toBe(scale);
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

test('the hero itself has no ground, so the page shows through it', async ({ page }) => {
  await page.goto('/');
  const ground = await page.locator(hero).evaluate((el) => {
    const style = getComputedStyle(el);
    return { color: style.backgroundColor, image: style.backgroundImage };
  });
  expect(ground).toEqual({ color: 'rgba(0, 0, 0, 0)', image: 'none' });
});

test('in forced colours, the ink and the paper drop', async ({ page }) => {
  await page.goto('/');
  await page.emulateMedia({ forcedColors: 'active' });
  const ink = await page.locator(band).evaluate((el) => getComputedStyle(el, '::before').display);
  expect(ink).toBe('none');
  expect(await page.locator(grain).evaluate((el) => getComputedStyle(el).backgroundImage)).toBe('none');
});

/**
 * Every specimen frame on Home is a panel: the paper, with a --color-border edge
 * (owner, 2026-11-16; it was the canvas with --color-border-strong). The paper
 * tile sits on the hero's alone.
 */
test('Home’s specimen frames are the paper with the lighter edge, and only the hero’s has the tile', async ({
  page,
}) => {
  await page.goto('/');
  const paper = await resolved(page, '--color-surface-sunken');
  const edge = await resolved(page, '--color-border', 'border-color');
  const frames = await page.locator('[data-plate]').evaluateAll((plates) =>
    plates.map((plate) => {
      const style = getComputedStyle(plate.parentElement!);
      return { ground: style.backgroundColor, edge: style.borderTopColor, tiled: style.backgroundImage !== 'none' };
    }),
  );
  expect(frames.length).toBeGreaterThan(15);
  for (const frame of frames) expect({ ground: frame.ground, edge: frame.edge }).toEqual({ ground: paper, edge });
  expect(frames.filter((f) => f.tiled)).toHaveLength(1);
  expect(await page.locator(`${hero} ${grain} [data-plate]`).count()).toBe(1);
});

/**
 * Every bordered panel states its own ground, the paper (`panel` in
 * lib/styles.ts) or, for a mode sample, the canvas. A bordered box with no ground
 * would show the page, and nothing would fail, so this looks for one on every
 * route. Boxes
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
