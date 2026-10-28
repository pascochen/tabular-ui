/**
 * Writes public/og.png, the site's one social image (docs/site.md §12): the
 * wordmark file, unchanged, centred on paper at 1200×630. The brand rule
 * (docs/design-system.md §1, "Brand assets") says to use the mark as a file
 * and derive nothing from it, so it's placed whole and only scaled.
 *
 * Paper is `ledger-50`, read from docs/palette.json, the generated palette:
 * no colour is typed here. Run it when the wordmark or the palette changes:
 *
 *   node apps/site/scripts/og-image.mjs
 */
import { readFileSync } from 'node:fs';

import { chromium } from '@playwright/test';

const root = new URL('../../../', import.meta.url);
const wordmark = readFileSync(new URL('apps/site/public/tabular-wordmark.svg', root), 'utf8');
const paper = JSON.parse(readFileSync(new URL('docs/palette.json', root), 'utf8')).paper50;
const out = new URL('apps/site/public/og.png', root);

// The mark at 640px wide, about half the image, so it reads at a feed's
// thumbnail size; centred, so a square crop keeps it whole.
const html = `<!doctype html>
<html><body style="margin:0;width:1200px;height:630px;display:grid;place-items:center;background:${paper}">
<img src="data:image/svg+xml;base64,${Buffer.from(wordmark).toString('base64')}" width="640" alt="">
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html);
await page.screenshot({ path: out.pathname });
await browser.close();
console.log(`Wrote ${out.pathname}`);
