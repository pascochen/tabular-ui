import { expect, test } from '@playwright/test';

import { gotoStory } from './helpers';

/**
 * §1 "Identity colour": a person's fallback takes one of four tint grounds by
 * their position in the member list, and anything that isn't a known person
 * stays neutral. The story's first row is five people, then one avatar with
 * no `identity`.
 */
for (const theme of ['dark', 'light'] as const) {
  test(`identity grounds: four, repeating after the fourth, and none without a person (${theme})`, async ({ page }) => {
    await gotoStory(page, 'foundational-avatar--identity', theme);
    const row = await page.locator('[data-slot="avatar-fallback"]').evaluateAll((els) =>
      els.slice(0, 6).map((el) => {
        const style = getComputedStyle(el);
        return {
          slot: el.getAttribute('data-identity'),
          letter: el.textContent,
          ground: style.backgroundColor,
          text: style.color,
        };
      }),
    );

    expect(row.map((a) => a.slot)).toEqual(['1', '2', '3', '4', '1', null]);
    // One letter each, never two.
    for (const a of row) expect(a.letter).toHaveLength(1);

    const people = row.slice(0, 4);
    const neutral = row[5];
    // Four different grounds and four different letters, none of them the neutral one.
    expect(new Set(people.map((a) => a.ground)).size).toBe(4);
    expect(new Set(people.map((a) => a.text)).size).toBe(4);
    for (const a of people) {
      expect(a.ground).not.toBe(neutral.ground);
      expect(a.text).not.toBe(neutral.text);
    }
    // The fifth person starts again on the first ground.
    expect(row[4].ground).toBe(row[0].ground);
    expect(row[4].text).toBe(row[0].text);
  });
}
