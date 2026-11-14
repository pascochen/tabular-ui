// DIAGNOSTIC BRANCH ONLY. Never merge. Reads the two pixels where ChatComposer's
// In panel story differs between runs, across repeated loads, with and without
// the caret hidden from the start of the page. Fails on purpose at the end so
// the baselines workflow commits nothing.
import { createHash } from 'node:crypto';
import { inflateSync } from 'node:zlib';
import { expect, test } from '@playwright/test';

import { gotoStory, storyFinished } from './helpers';

test.use({ viewport: { width: 1280, height: 800 } });

function onePixel(png: Buffer): string {
  let off = 8;
  const idat: Buffer[] = [];
  let colorType = 0;
  while (off < png.length) {
    const len = png.readUInt32BE(off);
    const type = png.toString('ascii', off + 4, off + 8);
    const data = png.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') colorType = data[9];
    if (type === 'IDAT') idat.push(data);
    off += 12 + len;
  }
  const raw = inflateSync(Buffer.concat(idat));
  const n = colorType === 6 ? 4 : 3;
  return Array.from(raw.subarray(1, 1 + n))
    .map((v) => v.toString(16).padStart(2, '0'))
    .join('');
}

const N = 15;
const id = 'product-chatcomposer--in-panel';

for (const variant of ['control', 'caret-hidden-from-start'] as const) {
  for (const theme of ['dark', 'light'] as const) {
    test(`${variant} · ${theme}`, async ({ page }) => {
      test.setTimeout(N * 20_000);
      if (variant === 'caret-hidden-from-start') {
        await page.addInitScript(() => {
          const sheet = new CSSStyleSheet();
          sheet.replaceSync('*, *::before, *::after { caret-color: transparent !important; }');
          document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
        });
      }
      const tally = new Map<string, number>();
      for (let i = 0; i < N; i++) {
        await gotoStory(page, id, theme);
        await storyFinished(page);
        await page.evaluate(() => document.fonts.ready);
        await page.mouse.move(0, 0);
        const full = await page.screenshot({ fullPage: true, animations: 'disabled', caret: 'hide' });
        const a = onePixel(
          await page.screenshot({
            clip: { x: 295, y: 419, width: 1, height: 1 },
            animations: 'disabled',
            caret: 'hide',
          }),
        );
        const b = onePixel(
          await page.screenshot({
            clip: { x: 295, y: 425, width: 1, height: 1 },
            animations: 'disabled',
            caret: 'hide',
          }),
        );
        const key = `${a}/${b} full=${createHash('sha1').update(full).digest('hex').slice(0, 10)}`;
        tally.set(key, (tally.get(key) ?? 0) + 1);
      }
      console.log(`DIAG ${variant} ${theme}: ${JSON.stringify(Object.fromEntries(tally))}`);
    });
  }
}

test('diagnostic never commits', () => {
  expect(true, 'diagnostic branch: fail so the workflow commits nothing').toBe(false);
});
