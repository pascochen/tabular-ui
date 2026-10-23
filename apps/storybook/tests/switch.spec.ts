import { expect, test, type Locator } from '@playwright/test';

import { gotoStory } from './helpers';

/**
 * The thumb sits 2px inside the track on every side, off and on, at both
 * sizes. The track's 1px transparent border counts in its box, so the
 * padding is 1px. At 2px the thumb sat 3px from the left edge and 1px from
 * the right when on, while top and bottom still measured 2px (found
 * 2026-10-20). Exact, not `>=`: a gap that shrinks must fail.
 *
 * Menu's switch indicator reuses `switchVariants`, so it is measured too.
 */

const INSET = 2;

type Gaps = { left: number; right: number; top: number; bottom: number };

async function gaps(track: Locator, thumb: Locator): Promise<Gaps> {
  const a = await track.boundingBox();
  const b = await thumb.boundingBox();
  if (!a || !b) throw new Error('switch not rendered');
  return {
    left: b.x - a.x,
    right: a.x + a.width - (b.x + b.width),
    top: b.y - a.y,
    bottom: a.y + a.height - (b.y + b.height),
  };
}

/** The thumb has finished its transition when two reads agree. */
async function settledGaps(track: Locator, thumb: Locator) {
  let last = await gaps(track, thumb);
  await expect
    .poll(async () => {
      const next = await gaps(track, thumb);
      const same = JSON.stringify(next) === JSON.stringify(last);
      last = next;
      return same;
    })
    .toBe(true);
  return last;
}

for (const label of ['Small, off', 'Small, on', 'Default, off', 'Default, on']) {
  test(`${label}: thumb inset is ${INSET}px on the three closed sides`, async ({ page }) => {
    await gotoStory(page, 'foundational-switch--sizes');
    const track = page.getByRole('switch', { name: label });
    const g = await settledGaps(track, track.locator('[data-slot="switch-thumb"]'));
    const on = label.endsWith('on');
    expect(g.top).toBe(INSET);
    expect(g.bottom).toBe(INSET);
    expect(on ? g.right : g.left).toBe(INSET);
  });
}

test(`Menu switch indicator: thumb inset is ${INSET}px, off and on`, async ({ page }) => {
  await gotoStory(page, 'foundational-menu--switch-item');
  await page.getByRole('button', { name: 'Display' }).click();
  for (const [name, on] of [
    ['Compact rows', true],
    ['Wrap long values', false],
  ] as const) {
    // The indicator is the item's aria-hidden child; its thumb is a plain span.
    const track = page.getByRole('menuitemcheckbox', { name }).locator(':scope > [aria-hidden="true"]');
    const g = await settledGaps(track, track.locator('span'));
    expect(g.top).toBe(INSET);
    expect(g.bottom).toBe(INSET);
    expect(on ? g.right : g.left).toBe(INSET);
  }
});

/**
 * Square since 2026-10-23 (§7.7): track and thumb on their tier tokens, both
 * 0px. Until then they were `--radius-full`, and nothing measured it. Menu's
 * indicator shares the variants, so it is held to the same shape.
 */
async function radii(track: Locator, thumb: Locator) {
  return {
    track: await track.evaluate((el) => getComputedStyle(el).borderRadius),
    thumb: await thumb.evaluate((el) => getComputedStyle(el).borderRadius),
  };
}

test('Switch: track and thumb are square, at both sizes', async ({ page }) => {
  await gotoStory(page, 'foundational-switch--sizes');
  for (const label of ['Small, off', 'Default, on']) {
    const track = page.getByRole('switch', { name: label });
    expect(await radii(track, track.locator('[data-slot="switch-thumb"]'))).toEqual({ track: '0px', thumb: '0px' });
  }
});

test('Menu switch indicator: track and thumb are square', async ({ page }) => {
  await gotoStory(page, 'foundational-menu--switch-item');
  await page.getByRole('button', { name: 'Display' }).click();
  const track = page.getByRole('menuitemcheckbox', { name: 'Compact rows' }).locator(':scope > [aria-hidden="true"]');
  expect(await radii(track, track.locator('span'))).toEqual({ track: '0px', thumb: '0px' });
});
