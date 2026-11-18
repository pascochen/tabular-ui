import { expect, test } from '@playwright/test';

import { gotoStory, tokenPx } from './helpers';

/**
 * `AgentCard`'s geometry and its one rule about colour.
 *
 * The finding row is a `ghost` link with a 1px transparent border of its own,
 * so its title lines up with the tile only if the row's padding gives that
 * pixel back (failure log: a transparent border is still geometry). Asserted
 * exactly, against the token, in both modes.
 */

const MODES = ['dark', 'light'] as const;

for (const mode of MODES) {
  test(`a finding's title starts where the tile does, and its status ends where the card's inset does · ${mode}`, async ({
    page,
  }) => {
    await gotoStory(page, 'product-agentcard--with-finding', mode);
    const inset = (await tokenPx(page, '--pad-card')) + (await tokenPx(page, '--border-width'));

    const card = (await page.locator('[data-slot="agent-card"]').boundingBox())!;
    const tile = (await page.locator('[data-slot="agent-card-tile"]').boundingBox())!;
    const row = page.locator('[data-slot="agent-card-finding"]');
    const title = (await row.locator('span').first().boundingBox())!;
    const status = (await row.locator('[data-status]').boundingBox())!;

    expect(tile.x - card.x).toBe(inset);
    expect(title.x - card.x).toBe(inset);
    expect(card.x + card.width - (status.x + status.width)).toBe(inset);
  });

  test(`the tile is neutral: its glyph is the primary text colour, on no ground · ${mode}`, async ({ page }) => {
    await gotoStory(page, 'product-agentcard--default', mode);
    const tile = page.locator('[data-slot="agent-card-tile"]');
    const { color, ground, primary } = await tile.evaluate((el) => {
      const probe = document.createElement('span');
      probe.style.color = 'var(--color-text-primary)';
      el.append(probe);
      const primary = getComputedStyle(probe).color;
      probe.remove();
      return { color: getComputedStyle(el).color, ground: getComputedStyle(el).backgroundColor, primary };
    });
    expect(color).toBe(primary);
    expect(ground).toBe('rgba(0, 0, 0, 0)');
  });
}

test('a card with no finding draws no footer', async ({ page }) => {
  await gotoStory(page, 'product-agentcard--default');
  await expect(page.locator('[data-slot="agent-card"]')).toBeVisible();
  await expect(page.locator('[data-slot="agent-card-findings"]')).toHaveCount(0);
});

test('in a narrow card the title truncates and the status keeps its width', async ({ page }) => {
  await gotoStory(page, 'product-agentcard--narrow');
  const row = page.locator('[data-slot="agent-card-finding"]');
  const title = row.locator('span').first();
  expect(await title.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
  const status = row.locator('[data-status]');
  expect(await status.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
  const card = (await page.locator('[data-slot="agent-card"]').boundingBox())!;
  const box = (await status.boundingBox())!;
  expect(box.x + box.width).toBeLessThanOrEqual(card.x + card.width);
});
