import { expect, test } from '@playwright/test';

import { gotoStory } from './helpers';

/**
 * §8.5 — a state that changes weight moves nothing (2026-11-13).
 *
 * The active nav item is set at 600 against 500 at rest. Each text label
 * reserves its 600 width, so moving the active page from one item to another
 * leaves every item where it was. Measured by moving `data-active`, which is
 * what the `active` prop sets and what the styles read.
 */
test('moving the active page moves no nav item', async ({ page }) => {
  await gotoStory(page, 'product-appbar--default');
  const result = await page.evaluate(() => {
    const items = [...document.querySelectorAll<HTMLElement>('[data-slot="app-bar-nav-item"]')];
    const boxes = () => items.map((el) => el.getBoundingClientRect()).map((r) => [r.left, r.width]);
    const weights = () => items.map((el) => getComputedStyle(el).fontWeight);
    for (const el of items) el.removeAttribute('data-active');
    const atRest = { boxes: boxes(), weights: weights() };
    const each = items.map((el) => {
      el.setAttribute('data-active', '');
      const active = { boxes: boxes(), weight: getComputedStyle(el).fontWeight };
      el.removeAttribute('data-active');
      return active;
    });
    // The hidden copy adds no text to what is read or copied.
    const text = items.map((el) => [el.textContent, el.innerText]);
    return { count: items.length, atRest, each, text };
  });

  expect(result.count).toBeGreaterThan(1);
  expect(new Set(result.atRest.weights)).toEqual(new Set(['500']));
  for (const active of result.each) {
    expect(active.weight, 'active is 600').toBe('600');
    expect(active.boxes, 'every item keeps its place and width').toEqual(result.atRest.boxes);
  }
  for (const [content, rendered] of result.text) expect(rendered).toBe(content);
});
