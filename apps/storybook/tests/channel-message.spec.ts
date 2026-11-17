import { expect, test } from '@playwright/test';

import { gotoStory } from './helpers';

/**
 * The thread's rule drops from the centre of the replies toggle's caret. It
 * was drawn at the toggle's left edge, half a caret left of the centre, so
 * the caret and the rule read as two unrelated marks (found 2026-11-17).
 * Exact: the offset is half the caret less half the rule, never a guess.
 */
test('the replies rule sits under the caret’s centre', async ({ page }) => {
  await gotoStory(page, 'product-channelmessage--thread-with-agent-reply');

  const replies = page.locator('[data-slot="channel-message-replies"]');
  const caret = page.locator('[data-slot="channel-message"] button[aria-expanded="true"] svg');
  await expect(replies).toBeVisible();

  const { caretCentre, ruleCentre, ruleWidth } = await page.evaluate(() => {
    const list = document.querySelector('[data-slot="channel-message-replies"]')!;
    const svg = document.querySelector('[data-slot="channel-message"] button[aria-expanded="true"] svg')!;
    const c = svg.getBoundingClientRect();
    const width = parseFloat(getComputedStyle(list).borderLeftWidth);
    return {
      caretCentre: c.left + c.width / 2,
      ruleCentre: list.getBoundingClientRect().left + width / 2,
      ruleWidth: width,
    };
  });

  await expect(caret).toHaveCount(1);
  expect(ruleWidth).toBe(1);
  expect(ruleCentre).toBe(caretCentre);
});
