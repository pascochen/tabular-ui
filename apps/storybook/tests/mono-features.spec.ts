import { expect, test } from '@playwright/test';

import { gotoStory } from './helpers';

/**
 * §8.7 — `--font-mono` carries the slashed zero wherever it renders.
 *
 * Checked on the element that owns each text node, because that is where the
 * glyph is drawn. Setting the feature on an ancestor proves nothing:
 * Preflight resets `font-feature-settings` on `code`, `kbd`, `samp` and `pre`
 * to its own default, so CodeView's root computed `"zero"` while every line
 * inside its `<pre>` computed `normal` (found 2026-10-16). The current family
 * draws a dotted zero by default, so no screenshot shows the loss; it would
 * show only after a change to a family that needs the feature.
 *
 * Mono is detected by the first family in the `--font-mono` stack, so the
 * test follows a family change without editing.
 */
const stories = [
  'product-codeview--with-line-numbers',
  'product-datatable--default',
  'product-runlogrow--with-detail',
  'product-lineagetree--default',
  'product-attachmentrow--default',
  'product-agentblock--awaiting-review',
];

for (const id of stories) {
  test(`mono text carries the slashed zero: ${id}`, async ({ page }) => {
    await gotoStory(page, id);

    const nodes = await page.evaluate(() => {
      const stack = getComputedStyle(document.documentElement).getPropertyValue('--font-mono');
      const family = stack
        .split(',')[0]
        .trim()
        .replace(/^['"]|['"]$/g, '');
      const out: { tag: string; text: string; features: string }[] = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        const el = n.parentElement;
        if (!el || !n.textContent?.trim()) continue;
        const s = getComputedStyle(el);
        if (!s.fontFamily.replace(/['"]/g, '').startsWith(family)) continue;
        out.push({
          tag: el.tagName.toLowerCase(),
          text: n.textContent.trim().slice(0, 30),
          features: s.fontFeatureSettings,
        });
      }
      return { family, out };
    });

    expect(nodes.family, '--font-mono must resolve on :root').not.toBe('');
    expect(nodes.out.length, `expected mono text in ${id}`).toBeGreaterThan(0);
    for (const n of nodes.out) {
      expect(n.features, `<${n.tag}> "${n.text}" must carry 'zero'`).toMatch(/"zero"(?! 0)/);
    }
  });
}
