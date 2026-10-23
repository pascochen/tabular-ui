import { expect, test } from '@playwright/test';

import { gotoStory } from './helpers';

/**
 * ChatComposer behaviour a story's play function cannot show without changing
 * the story's final frame (and so its screenshot).
 */

/**
 * Safari fires the Enter that confirms an IME composition after
 * compositionend, with `isComposing` already false; only `keyCode` 229 says
 * an IME handled it. Chromium, which runs these tests, never sends that
 * event, so it is built by hand: what Safari delivers, on the field.
 * Found 2026-10-21: the composer sent half-written Japanese, Chinese and
 * Korean messages in Safari.
 */
test("Safari's IME-confirming Enter does not send", async ({ page }) => {
  await gotoStory(page, 'product-chatcomposer--default');
  // The story types and sends on its own; start once its play function is done.
  await page.waitForFunction(() => {
    const preview = (window as { __STORYBOOK_PREVIEW__?: { currentRender?: { phase?: string } } })
      .__STORYBOOK_PREVIEW__;
    return preview?.currentRender?.phase === 'finished';
  });
  const field = page.getByRole('textbox', { name: 'Message' });
  await field.fill('売上の');

  await field.evaluate((el) => {
    const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
    Object.defineProperty(event, 'keyCode', { value: 229 });
    el.dispatchEvent(event);
  });
  // Sending clears the field, so the text still being there is the proof.
  await expect(field).toHaveValue('売上の');

  // A plain Enter still sends.
  await field.press('Enter');
  await expect(field).toHaveValue('');
});

/**
 * A disabled composer recedes once, to 50%, like every disabled control. Its
 * buttons are disabled too, and their own fade on top of the box's took them
 * to 25%. Measured as the product of every ancestor's opacity, since that is
 * what reaches the screen. Found 2026-10-21.
 */
for (const theme of ['dark', 'light'] as const) {
  test(`a disabled composer fades every part once — ${theme}`, async ({ page }) => {
    await gotoStory(page, 'product-chatcomposer--disabled', theme);
    const parts = await page.evaluate(() => {
      const form = document.querySelector('[data-slot="chat-composer"]')!;
      return Array.from(form.querySelectorAll<HTMLElement>('button, textarea')).map((el) => {
        let opacity = 1;
        for (let n: HTMLElement | null = el; n; n = n.parentElement) opacity *= Number(getComputedStyle(n).opacity);
        return { name: el.getAttribute('aria-label') ?? el.tagName, opacity };
      });
    });
    expect(parts.length).toBeGreaterThan(1);
    for (const part of parts) expect(part.opacity, part.name).toBeCloseTo(0.5, 2);
  });
}

/**
 * ChatStarter: a suggestion cut off by the panel's width shows its full text
 * in a tooltip on hover, and must on keyboard focus too. The tooltip's trigger
 * was the text inside the button, which never takes focus, so a keyboard user
 * saw "Why did fct_gl_entries take fo…" with no way to read the rest. A
 * suggestion that fits gets no tooltip. Found 2026-10-21.
 */
test('a cut-off suggestion shows its full text on keyboard focus', async ({ page }) => {
  const long = 'Why did fct_gl_entries take four times longer than usual on its last scheduled run?';
  await gotoStory(page, 'product-chatstarter--long-question');
  const tooltip = page.locator('[data-slot="tooltip-content"]');

  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: long })).toBeFocused();
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toHaveText(long);

  // Dismissible without moving focus (WCAG 1.4.13).
  await page.keyboard.press('Escape');
  await expect(tooltip).toBeHidden();

  // The next suggestion fits, so nothing opens.
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Which models read order_total?' })).toBeFocused();
  await expect(tooltip).toBeHidden();
});
