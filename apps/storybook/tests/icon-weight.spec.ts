import { expect, test } from '@playwright/test';

import { gotoStory } from './helpers';

/**
 * §11.2's state table: a disabled control's icon draws `light`, whatever its
 * size band or variant, danger included. Weight is not an attribute in
 * the DOM, but Phosphor draws each weight as different path data, so a
 * disabled icon must not share its enabled twin's path. Each Disabled story
 * renders an enabled row above a disabled one, in the same order.
 */
for (const { story, selector } of [
  { story: 'foundational-button--disabled', selector: '[data-slot="button"]' },
  { story: 'foundational-iconbutton--disabled', selector: '[data-slot="icon-button"]' },
]) {
  test(`disabled icons draw a different weight from enabled ones — ${story}`, async ({ page }) => {
    await gotoStory(page, story);
    const rows = await page.locator(selector).evaluateAll((buttons) =>
      buttons
        .filter((b) => b.querySelector('svg'))
        .map((b) => ({
          disabled: (b as HTMLButtonElement).disabled,
          path: b.querySelector('svg path')?.getAttribute('d') ?? '',
        })),
    );
    const enabled = rows.filter((r) => !r.disabled);
    const disabled = rows.filter((r) => r.disabled);
    expect(disabled.length).toBeGreaterThan(0);
    expect(disabled.length).toBe(enabled.length);
    disabled.forEach((row, i) => expect(row.path, `icon ${i}`).not.toBe(enabled[i].path));
  });
}
