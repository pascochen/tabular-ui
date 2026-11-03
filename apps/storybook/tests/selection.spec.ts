import { expect, test, type Locator, type Page } from '@playwright/test';

import { gotoStory, rgba } from './helpers';

/**
 * §4 "Text selection". The computed `::selection` style is only half of it, so
 * these read the pixel the browser paints: a sheet of known ground, its text
 * selected, sampled at the top left of the highlight, above the glyphs.
 */

const STORY = 'foundational-button--variants';
const TOLERANCE = 2;

/** Adds a block of text on the canvas, inside `theme` if given, and selects it. */
async function selectedSample(page: Page, theme?: 'dark' | 'light') {
  await page.evaluate((scope) => {
    const sheet = document.createElement('div');
    sheet.dataset.testid = 'sheet';
    if (scope) sheet.dataset.theme = scope;
    // --tui-*, because only that layer rescopes under a nested theme (§9).
    sheet.style.cssText = 'position:fixed;inset:0 auto auto 0;z-index:9999;padding:8px;background:var(--tui-canvas)';
    const sample = document.createElement('p');
    sample.dataset.testid = 'sample';
    sample.style.cssText = 'margin:0;font-size:32px;line-height:48px;color:var(--tui-text-danger)';
    sample.textContent = '41,415.80';
    sheet.append(sample);
    document.body.append(sheet);
    getSelection()!.selectAllChildren(sample);
  }, theme);
  return page.getByTestId('sample');
}

/** A value read on the sample itself, so a nested theme applies to it. */
const onSample = (sample: Locator, name: string) =>
  sample.evaluate((el, n) => getComputedStyle(el).getPropertyValue(n).trim(), name);

/** One pixel of an element's screenshot, decoded by the browser. */
async function pixel(page: Page, sample: Locator, x: number, y: number) {
  const png = (await sample.screenshot()).toString('base64');
  return page.evaluate(
    async ([data, px, py]) => {
      const image = new Image();
      image.src = `data:image/png;base64,${data}`;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(image, 0, 0);
      return [...ctx.getImageData(px as number, py as number, 1, 1).data].slice(0, 3);
    },
    [png, x, y] as const,
  );
}

/** A translucent colour over an opaque one, as the browser composites it. */
async function over(page: Page, top: string, ground: string) {
  const [gr, gg, gb] = await rgba(page, ground);
  const [tr, tg, tb, ta] = await rgba(page, top);
  return [tr, tg, tb].map((t, i) => t * ta + [gr, gg, gb][i] * (1 - ta));
}

async function expectSelection(page: Page, sample: Locator) {
  const style = await sample.evaluate((el) => {
    const s = getComputedStyle(el, '::selection');
    return { background: s.backgroundColor, color: s.color };
  });
  expect(await rgba(page, style.background)).toEqual(await rgba(page, await onSample(sample, '--tui-bg-selection')));
  expect(await rgba(page, style.color)).toEqual(await rgba(page, await onSample(sample, '--tui-text-primary')));

  const painted = await pixel(page, sample, 1, 1);
  const expected = await over(
    page,
    await onSample(sample, '--tui-bg-selection'),
    await onSample(sample, '--tui-canvas'),
  );
  painted.forEach((channel, i) => expect(Math.abs(channel - expected[i])).toBeLessThanOrEqual(TOLERANCE));
}

for (const mode of ['dark', 'light'] as const) {
  test(`selected text paints the ivy highlight and primary text (${mode})`, async ({ page }) => {
    await gotoStory(page, STORY, mode);
    await expectSelection(page, await selectedSample(page));
  });

  test(`a filled button's label cannot be selected (${mode})`, async ({ page }) => {
    await gotoStory(page, STORY, mode);
    const filled = page.getByRole('button', { name: /./ }).first();
    expect(await filled.evaluate((el) => getComputedStyle(el).userSelect)).toBe('none');
  });
}

test('a nested dark band takes the dark values on a light page', async ({ page }) => {
  await gotoStory(page, STORY, 'light');
  const sample = await selectedSample(page, 'dark');
  await expectSelection(page, sample);
  const dark = await rgba(page, await onSample(sample, '--tui-text-primary'));
  const light = await rgba(
    page,
    await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--tui-text-primary').trim()),
  );
  expect(dark).not.toEqual(light);
});
