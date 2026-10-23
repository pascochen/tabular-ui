import { expect, test, type Locator } from '@playwright/test';

import { gotoStory } from './helpers';

/**
 * Disabled recedes as a whole (controlBase): 50% opacity, no pointer events.
 *
 * controlBase writes that as `disabled:`, which matches the native `:disabled`
 * state only. A Base UI part that is not a native form control, or that stays
 * focusable when disabled, carries `data-disabled` / `aria-disabled` instead,
 * and the fade silently never applies — a disabled Tab shipped at full
 * strength that way. These read the computed style of each disabled control
 * beside an enabled sibling from the same story, in both modes.
 */

const style = (el: Locator) =>
  el.evaluate((node) => {
    const s = getComputedStyle(node);
    return {
      opacity: s.opacity,
      pointerEvents: s.pointerEvents,
      // Recorded so a failure says which state the element carries.
      tag: node.tagName.toLowerCase(),
      disabled: (node as HTMLButtonElement).disabled ?? null,
      dataDisabled: node.hasAttribute('data-disabled'),
      ariaDisabled: node.getAttribute('aria-disabled'),
    };
  });

const faded = { opacity: '0.5', pointerEvents: 'none' };

for (const mode of ['dark', 'light'] as const) {
  test.describe(`Disabled controls — ${mode}`, () => {
    test('a disabled Checkbox recedes, checked or not', async ({ page }) => {
      await gotoStory(page, 'foundational-checkbox--states', mode);
      const box = (name: string) => page.getByRole('checkbox', { name, exact: true });
      for (const name of ['Disabled', 'Disabled, checked']) {
        const s = await style(box(name));
        expect({ opacity: s.opacity, pointerEvents: s.pointerEvents }, `${name}: ${JSON.stringify(s)}`).toEqual(faded);
      }
      expect((await style(box('Unchecked'))).opacity, 'an enabled checkbox does not').toBe('1');
    });

    test('a disabled Select trigger recedes', async ({ page }) => {
      await gotoStory(page, 'foundational-select--states', mode);
      const trigger = (name: string) => page.getByRole('combobox', { name, exact: true });
      const s = await style(trigger('Disabled'));
      expect({ opacity: s.opacity, pointerEvents: s.pointerEvents }, JSON.stringify(s)).toEqual(faded);
      expect((await style(trigger('Invalid'))).opacity, 'an enabled trigger does not').toBe('1');
    });
  });
}
