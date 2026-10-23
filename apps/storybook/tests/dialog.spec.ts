import { expect, test, type Page } from '@playwright/test';

import { gotoStory, rgba, token } from './helpers';

/**
 * Dialog — the one foundational component that had no behaviour test.
 *
 * Its README makes two kinds of promise. Behaviour (focus moves in and is
 * trapped, Escape and the backdrop close it, focus returns to the trigger,
 * the page behind is locked) comes from Base UI, and is pinned here so a
 * Base UI upgrade or a careless wrapper cannot drop it silently. The visual
 * contract (the modal radius, the overlay sheet, the strong border, a backdrop scrimmed
 * toward the canvas rather than black, bordered fields that stay visible) is
 * ours, and is checked in both modes against the tokens, never restated px.
 */

const dialog = (page: Page) => page.getByRole('dialog');

async function openDefault(page: Page) {
  await gotoStory(page, 'foundational-dialog--default');
  const trigger = page.getByRole('button', { name: 'Open dialog' });
  await trigger.click();
  await expect(dialog(page)).toBeVisible();
  return trigger;
}

/** True when the focused element is inside the open dialog. */
const focusInDialog = (page: Page) => page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'));

test.describe('Dialog — behaviour', () => {
  test('a modal dialog, named by its title and described by its description', async ({ page }) => {
    await openDefault(page);
    await expect(dialog(page)).toHaveAccessibleName('Re-run pipeline');
    await expect(dialog(page)).toHaveAccessibleDescription(/14 models, roughly 6 minutes/);
  });

  test('focus moves into the dialog on open, and Tab cannot leave it', async ({ page }) => {
    await openDefault(page);
    // Polled, not read once. Focus moves in a frame after the dialog appears,
    // and Base UI's trap works through invisible guard elements on either
    // side: a Tab off the last control lands on a guard, which sends focus
    // back to the first one a moment later. The promise is where focus
    // settles, so that is what is asserted.
    await expect.poll(() => focusInDialog(page), { message: 'focus moves in on open' }).toBe(true);
    // More presses than the dialog has controls (Close, Cancel, Re-run), both
    // ways round: every one must settle inside.
    for (const key of ['Tab', 'Shift+Tab']) {
      for (let i = 0; i < 6; i++) {
        await page.keyboard.press(key);
        await expect.poll(() => focusInDialog(page), { message: `${key} #${i + 1} settles in the dialog` }).toBe(true);
      }
    }
  });

  test('Escape closes it, and focus returns to the trigger', async ({ page }) => {
    await gotoStory(page, 'foundational-dialog--default');
    const trigger = page.getByRole('button', { name: 'Open dialog' });
    await trigger.focus();
    await page.keyboard.press('Enter');
    await expect(dialog(page)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog(page)).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('a click on the backdrop closes it, and focus returns to the trigger', async ({ page }) => {
    const trigger = await openDefault(page);
    const box = (await dialog(page).boundingBox())!;
    // Well outside the panel, on the backdrop.
    await page.mouse.click(Math.max(4, box.x - 40), Math.max(4, box.y - 40));
    await expect(dialog(page)).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('the X is named Close, and both it and Cancel close the dialog', async ({ page }) => {
    const trigger = await openDefault(page);
    await dialog(page).getByRole('button', { name: 'Close', exact: true }).click();
    await expect(dialog(page)).toBeHidden();
    await trigger.click();
    await dialog(page).getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog(page)).toBeHidden();
  });

  test('the page behind cannot scroll while it is open', async ({ page }) => {
    await gotoStory(page, 'foundational-dialog--default');
    // A page taller than the viewport, so there is something to scroll.
    await page.evaluate(() => {
      const spacer = document.createElement('div');
      spacer.style.height = '3000px';
      document.body.appendChild(spacer);
    });
    await page.getByRole('button', { name: 'Open dialog' }).click();
    await expect(dialog(page)).toBeVisible();
    // Measured from where the page sits once the dialog is open: clicking the
    // trigger scrolls it into view first, which is Playwright, not the dialog.
    const atOpen = await page.evaluate(() => window.scrollY);
    await page.mouse.move(640, 600);
    await page.mouse.wheel(0, 800);
    await page.keyboard.press('PageDown');
    await page.waitForTimeout(200);
    expect(await page.evaluate(() => window.scrollY), 'locked while open').toBe(atOpen);

    await page.keyboard.press('Escape');
    await expect(dialog(page)).toBeHidden();
    await page.mouse.wheel(0, 800);
    await expect.poll(() => page.evaluate(() => window.scrollY), { message: 'unlocked after close' }).not.toBe(atOpen);
  });
});

for (const mode of ['dark', 'light'] as const) {
  test(`Dialog — the visual contract holds in ${mode}`, async ({ page }) => {
    await gotoStory(page, 'foundational-dialog--open', mode);
    const panel = dialog(page);
    await expect(panel).toBeVisible();
    const style = await panel.evaluate((el) => {
      const s = getComputedStyle(el);
      return { radius: s.borderTopLeftRadius, shadow: s.boxShadow, border: s.borderTopColor, bg: s.backgroundColor };
    });

    // §7.7: --radius-lg, the modal tier and the ceiling.
    expect(style.radius).toBe(await token(page, '--radius-lg'));
    // §4: an overlay carries the sheet. Its layers are checked in
    // elevation.spec.ts; here, only that it paints.
    expect(style.shadow).toContain('4px 4px 0px');
    // §4: raised surface with the strong border.
    expect(await rgba(page, style.bg)).toEqual(await rgba(page, await token(page, '--color-surface-raised')));
    expect(await rgba(page, style.border)).toEqual(await rgba(page, await token(page, '--color-border-strong')));

    // The backdrop scrims toward the canvas at 80%, never black (§0 rule 9).
    const scrim = await page
      .locator('[data-slot="dialog-overlay"]')
      .evaluate((el) => getComputedStyle(el).backgroundColor);
    const [r, g, b, a] = await rgba(page, scrim);
    const [cr, cg, cb] = await rgba(page, await token(page, '--color-canvas'));
    expect(a, 'scrim alpha').toBeCloseTo(0.8, 1);
    // Within one 8-bit step per channel: the scrim is mixed in oklab, and the
    // round trip lands ledger-950 at rgb(19 25 32) against the canvas's
    // (19 25 33). Black would miss by 19 or more.
    for (const [channel, got, want] of [
      ['r', r, cr],
      ['g', g, cg],
      ['b', b, cb],
    ] as const) {
      expect(Math.abs(got - want), `scrim ${channel} is the canvas colour, not black`).toBeLessThanOrEqual(1);
    }

    // A bordered field inside keeps its border: DialogContent redefines
    // --tui-border to the strong step, or the field's border would be faint
    // on the raised surface (1.60:1 dark, 1.29:1 light; under olive it
    // matched the surface and vanished, §3).
    const field = panel.getByRole('textbox', { name: 'Model name' });
    const fieldBorder = await field.evaluate((el) => getComputedStyle(el).borderTopColor);
    expect(await rgba(page, fieldBorder)).toEqual(await rgba(page, await token(page, '--color-border-strong')));
    expect(await rgba(page, fieldBorder)).not.toEqual(await rgba(page, style.bg));
  });
}
