import { expect, test } from '@playwright/test';

import { contrastRatio, focusRingStyle, gotoStory, rgba, ringOverhang, tabTo, token } from './helpers';

/**
 * §4 — focus rings must survive `overflow: hidden` on scrolling containers.
 *
 * The subtlety this guards, and the reason it needs a browser: `outline` is
 * clipped by an ancestor's overflow exactly as `box-shadow` is. What actually
 * protects a ring is cell padding giving it room, or a negative
 * `outline-offset` drawing it inside the element. Neither is visible to a
 * static check, and neither survives a careless layout change.
 *
 * Verified by hand 2026-08-03 on these same surfaces; encoded here so the
 * fourth dense surface cannot regress silently.
 */

test.describe('focus rings survive scroll containers', () => {
  test('checkbox in a DataTable first column', async ({ page }) => {
    await gotoStory(page, 'product-datatable--with-selection-and-filter');
    const checkbox = page.locator('tbody tr[data-row-id] [data-slot="checkbox"]').first();
    await expect(checkbox).toBeVisible();

    expect(await tabTo(page, checkbox)).toBe(true);

    const ring = await focusRingStyle(page);
    expect(ring?.outlineStyle, 'ring must be an outline').not.toBe('none');
    expect(parseFloat(ring?.outlineWidth ?? '0')).toBeGreaterThan(0);
    // §4 — box-shadow rings are the thing the rule exists to prevent.
    expect(ring?.boxShadow, 'ring must not be box-shadow based').toBe('none');

    for (const c of await ringOverhang(page)) {
      expect(c.left, `clipped left by ${c.el}`).toBeLessThanOrEqual(0);
      expect(c.right, `clipped right by ${c.el}`).toBeLessThanOrEqual(0);
      expect(c.top, `clipped top by ${c.el}`).toBeLessThanOrEqual(0);
      expect(c.bottom, `clipped bottom by ${c.el}`).toBeLessThanOrEqual(0);
    }
  });

  test('sticky sort button uses an inset ring', async ({ page }) => {
    await gotoStory(page, 'product-datatable--default');
    const sortButton = page.locator('thead th button').first();
    await expect(sortButton).toBeVisible();

    expect(await tabTo(page, sortButton)).toBe(true);

    const ring = await focusRingStyle(page);
    expect(ring?.boxShadow).toBe('none');
    // A sticky header sits flush against the scroll container, so the ring has
    // to be drawn inside the element. This is the rule from §4 as an assertion.
    expect(parseFloat(ring?.outlineOffset ?? '0')).toBeLessThan(0);

    for (const c of await ringOverhang(page)) {
      expect(Math.max(c.left, c.right, c.top, c.bottom), `clipped by ${c.el}`).toBeLessThanOrEqual(0);
    }
  });

  test('chip in a horizontally scrolling row', async ({ page }) => {
    await gotoStory(page, 'foundational-chip--filter-bar');
    // Force the container to scroll, which is when a chip meets an edge.
    await page.evaluate(() => {
      const bar = document.querySelector('[data-slot="chip"]')?.parentElement as HTMLElement;
      if (bar) {
        bar.style.overflowX = 'auto';
        bar.style.maxWidth = '160px';
        bar.style.flexWrap = 'nowrap';
      }
    });
    const chip = page.locator('[data-slot="chip"]').first();
    await expect(chip).toBeVisible();

    expect(await tabTo(page, chip)).toBe(true);
    expect((await focusRingStyle(page))?.boxShadow).toBe('none');

    for (const c of await ringOverhang(page)) {
      expect(Math.max(c.left, c.right, c.top, c.bottom), `clipped by ${c.el}`).toBeLessThanOrEqual(0);
    }
  });

  test('run log row uses an inset ring', async ({ page }) => {
    await gotoStory(page, 'product-runlogrow--with-detail');
    const row = page.locator('[data-slot="run-log-row"] button').first();
    await expect(row).toBeVisible();

    expect(await tabTo(page, row)).toBe(true);
    const ring = await focusRingStyle(page);
    expect(ring?.boxShadow).toBe('none');
    expect(parseFloat(ring?.outlineOffset ?? '0')).toBeLessThan(0);
  });
});

/**
 * The ring has to be visible, not merely present. Both halves of that were
 * broken at once and neither was detectable statically: `outline-none` poisoned
 * --tw-outline-style so `outline-style` resolved to `none` while width, offset
 * and colour were all correct, and shadcn's base `outline-ring/50` wildcard
 * halved the colour's alpha on top of that.
 */
test('the focus ring actually paints, at full strength', async ({ page }) => {
  await gotoStory(page, 'foundational-button--variants');
  await page.keyboard.press('Tab');

  const ring = await focusRingStyle(page);
  expect(ring?.outlineStyle, 'outline-style must not resolve to none').toBe('solid');
  expect(parseFloat(ring?.outlineWidth ?? '0')).toBeGreaterThan(0);

  const canvas = await token(page, '--color-canvas');
  const ratio = await contrastRatio(page, ring!.outlineColor, canvas);
  // WCAG 2.4.11 wants 3:1 for the focus indicator against adjacent colour.
  expect(ratio, `ring colour on canvas: ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(3);
});

/**
 * §4 — the ring has its own value per mode: a step softer than the ink
 * accent, ledger-800 in light (9.10:1) and ledger-200 in dark (12.68:1),
 * since 2026-10-22. It was the accent itself, ledger-950 / ledger-50, from
 * 2026-10-16; sage, and emerald before that. Exact, so a ring that drifts to
 * another token fails here.
 */
for (const [theme, step, minRatio] of [
  ['light', '--color-ledger-800', 9],
  ['dark', '--color-ledger-200', 12],
] as const) {
  test(`the ring is ${step.replace('--color-', '')} in ${theme} mode`, async ({ page }) => {
    await gotoStory(page, 'foundational-button--variants', theme);
    await page.keyboard.press('Tab');
    const ring = await focusRingStyle(page);
    expect(await rgba(page, ring!.outlineColor)).toEqual(await rgba(page, await token(page, step)));
    const ratio = await contrastRatio(page, ring!.outlineColor, await token(page, '--color-canvas'));
    expect(ratio, `ring on canvas: ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(minRatio);
  });
}

/**
 * The lint gate rejects `focus:ring-*` in source, but a vendored component or
 * a stray `@apply` could still ship one. This catches it in the rendered
 * output, which is the only place it actually matters.
 *
 * One test per story, not one test looping over all of them. Looped, seven
 * cold Storybook navigations shared a single 30s budget — 27.8s on CI by
 * August, over it once the story graph grew — so the check timed out without
 * ever finding a ring. Split, each story gets its own budget, they run in
 * parallel, and a failure names the story.
 */
const boxShadowRingStories = [
  'foundational-button--variants',
  'foundational-iconbutton--variants',
  'foundational-input--sizes',
  'foundational-checkbox--states',
  'foundational-switch--states',
  'foundational-chip--states',
  'foundational-tabs--default',
];

for (const id of boxShadowRingStories) {
  test(`no rendered control draws its focus ring with box-shadow — ${id}`, async ({ page }) => {
    await gotoStory(page, id);
    const offenders = await page.evaluate(() => {
      const bad: string[] = [];
      for (const el of Array.from(document.querySelectorAll<HTMLElement>('button, input, [role="tab"], [data-slot]'))) {
        el.focus();
        const s = getComputedStyle(el);
        if (s.boxShadow !== 'none' && /inset|0px 0px 0px/.test(s.boxShadow)) {
          bad.push(`${el.dataset.slot ?? el.tagName}: ${s.boxShadow}`);
        }
      }
      return bad;
    });
    expect(offenders).toEqual([]);
  });
}

test.describe('chat panel focus', () => {
  // Found 2026-10-21: in a short panel, Tab scrolled the second suggestion
  // flush with the empty thread's bottom edge, and the overflow cut its ring off.
  for (const theme of ['dark', 'light'] as const) {
    test(`every suggestion keeps its whole ring in a short panel — ${theme}`, async ({ page }) => {
      await gotoStory(page, 'product-chatstarter--short-panel', theme);
      const suggestions = page.locator('[data-slot="chat-thread"] button');
      const count = await suggestions.count();
      expect(count).toBeGreaterThan(1);
      for (let i = 0; i < count; i++) {
        expect(await tabTo(page, suggestions.nth(i))).toBe(true);
        for (const c of await ringOverhang(page)) {
          expect(
            Math.max(c.left, c.right, c.top, c.bottom),
            `suggestion ${i + 1} clipped by ${c.el}`,
          ).toBeLessThanOrEqual(0);
        }
      }
    });
  }

  // Found 2026-10-21: the button goes inert when the scroll lands, and a
  // focused element that turns inert drops focus to <body>.
  test('scroll to latest hands focus to the transcript', async ({ page }) => {
    await gotoStory(page, 'product-chatthread--long-thread');
    const viewport = page.locator('[data-slot="message-scroller-viewport"]');
    const button = page.getByRole('button', { name: 'Scroll to latest' });
    // The thread opens at its last turn and starts listening after that, so a
    // scroll that lands too early is missed. Each attempt moves away from the
    // top first, so it always fires a scroll event.
    await expect(async () => {
      await viewport.evaluate(async (el) => {
        el.scrollTop = 40;
        await new Promise(requestAnimationFrame);
        el.scrollTop = 0;
      });
      await expect(button).toHaveAttribute('data-active', 'true', { timeout: 500 });
    }).toPass();
    await button.focus();
    await page.keyboard.press('Enter');
    await expect(button).toHaveAttribute('data-active', 'false');
    await expect(viewport).toBeFocused();
  });

  // A pointer user doesn't need focus moved, and a ring round the transcript
  // after a click would read as a selection (it showed in the Long story's screenshot).
  test('a click on scroll to latest leaves focus alone', async ({ page }) => {
    await gotoStory(page, 'product-chatthread--long-thread');
    const viewport = page.locator('[data-slot="message-scroller-viewport"]');
    const button = page.getByRole('button', { name: 'Scroll to latest' });
    await expect(async () => {
      await viewport.evaluate(async (el) => {
        el.scrollTop = 40;
        await new Promise(requestAnimationFrame);
        el.scrollTop = 0;
      });
      await expect(button).toHaveAttribute('data-active', 'true', { timeout: 500 });
    }).toPass();
    await button.click();
    await expect(button).toHaveAttribute('data-active', 'false');
    await expect(viewport).not.toBeFocused();
  });
});
