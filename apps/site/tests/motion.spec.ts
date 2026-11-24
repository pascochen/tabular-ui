import { readFileSync } from 'node:fs';

import { expect, test, type Locator, type Page } from '@playwright/test';

import { motions, playerSource } from '../src/motion';

/**
 * The site's four small motions (docs/site.md §7, "Motion"): the link whose
 * word takes the ink, the copy command's tick, the wash on Play and Replay,
 * and the page turn. Each is checked twice: that it runs, and that with
 * reduced motion it does not. quality.spec.ts checks that nothing animates
 * under reduced motion on a page at rest; these press the thing first.
 *
 * What a link looks like at rest and on hover is in pages.spec.ts
 * ("standalone links"). This file is about what moves.
 */

/** The page is prerendered, so wait for React before pressing anything. */
async function open(page: Page, path: string) {
  await page.goto(path);
  await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true');
}

/** One computed style of an element or of its `::before`. */
const computed = (target: Locator, property: string, pseudo?: '::before') =>
  target.evaluate((el, [name, part]) => getComputedStyle(el, part).getPropertyValue(name!), [
    property,
    pseudo,
  ] as const);

/**
 * The names of the page's `@keyframes`. A computed `animation-name` is only
 * the name an element asks for: it reads the same when no such keyframes
 * exist, and then nothing moves. Removing `site-tick` from the stylesheet left
 * the copy test green until it asked this too.
 */
const keyframes = (page: Page) =>
  page.evaluate(() =>
    [...document.styleSheets]
      .flatMap((sheet) => [...sheet.cssRules])
      .filter((rule) => rule instanceof CSSKeyframesRule)
      .map((rule) => rule.name),
  );

/** The clipboard accepts every write: the tick shows only after it has (copy-command.tsx). */
async function acceptCopies(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: () => Promise.resolve() },
    });
  });
}

const footerLink = (page: Page) => page.getByRole('contentinfo').getByRole('link', { name: 'Vocabulary' });
const copyButton = (page: Page) => page.getByRole('main').getByRole('button', { name: /^(Copy command|Copied)$/ });
const playButton = (page: Page) => page.locator('[data-pair-play] button');

/** The wash's layer at rest: scaled to nothing across, so it paints nothing. */
const AT_REST = '0 1';
/**
 * The run's state and the layer's size, read together: "playing:1" is the wash
 * at full size while the run is under way. Read apart, a wash that never came
 * in still passed: the way out starts from full size, so a poll for "full"
 * found it there once the run had ended. Chromium writes `scale: 1 1` back as "1".
 */
const wash = (button: Locator) =>
  button.evaluate((el) => `${el.dataset.run ?? 'never'}:${getComputedStyle(el, '::before').scale}`);
const HELD = /^playing:1( 1)?$/;

test.describe('the word takes the ink', () => {
  test('a standalone link moves its colour alone, over 240ms', async ({ page }) => {
    await open(page, '/');
    const link = footerLink(page);
    // `color` only: `transition-colors` would fade the focus ring's outline in too.
    expect(await computed(link, 'transition-property')).toBe('color');
    expect(await computed(link, 'transition-duration')).toBe('0.24s');
  });

  test('a card’s title, which only takes the underline, has no transition', async ({ page }) => {
    await open(page, '/');
    const title = page.locator('#chat-starter').getByRole('link', { name: 'Chat starter' });
    expect(await computed(title, 'transition-duration')).toBe('0s');
  });

  test.describe('with reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });
    test('the colour changes in place', async ({ page }) => {
      await open(page, '/');
      expect(await computed(footerLink(page), 'transition-duration')).toBe('0s');
    });
  });
});

test.describe('copy is ticked', () => {
  test('the check is wiped in after a copy, and the copy icon fades back', async ({ page }) => {
    await acceptCopies(page);
    await open(page, '/components/agent-block');
    const button = copyButton(page);
    const icon = button.locator('svg');
    expect(await keyframes(page)).toEqual(expect.arrayContaining(['site-tick', 'site-fade-in']));
    // Still on load (D6): the copy icon fades in only after a copy.
    await expect(button).toHaveAccessibleName('Copy command');
    expect(await computed(icon, 'animation-name')).toBe('none');

    await button.click();
    await expect(button).toHaveAccessibleName('Copied');
    // One icon at a time, so IconButton still sets its weight.
    await expect(icon).toHaveCount(1);
    expect(await computed(icon, 'animation-name')).toBe('site-tick');
    expect(await computed(icon, 'animation-duration')).toBe('0.14s');

    // Two seconds later the copy icon is back, faded in.
    await expect(button).toHaveAccessibleName('Copy command');
    await expect(icon).toHaveCount(1);
    expect(await computed(icon, 'animation-name')).toBe('site-fade-in');
  });

  test.describe('with reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });
    test('the icons swap in place', async ({ page }) => {
      await acceptCopies(page);
      await open(page, '/components/agent-block');
      const button = copyButton(page);
      await button.click();
      await expect(button).toHaveAccessibleName('Copied');
      expect(await computed(button.locator('svg'), 'animation-name')).toBe('none');
      await expect(button).toHaveAccessibleName('Copy command');
      expect(await computed(button.locator('svg'), 'animation-name')).toBe('none');
    });
  });
});

test.describe('Play and Replay take a wash', () => {
  test('Play: it wipes in, holds for the run, and leaves when the run ends', async ({ page }) => {
    await open(page, '/components/agent-plan');
    const play = playButton(page);
    // Never run: no state, and the layer paints nothing.
    await expect(play).not.toHaveAttribute('data-run');
    expect(await computed(play, 'scale', '::before')).toBe(AT_REST);

    await play.click();
    await expect(play).toHaveAttribute('data-run', 'playing');
    expect(await computed(play, 'animation-name', '::before')).toBe('site-wash-in');
    // It arrives, and holds: full size while the run is under way.
    await expect.poll(() => wash(play)).toMatch(HELD);

    // A run is 5 seconds or less (§6).
    await expect(play).toHaveAttribute('data-run', 'ended', { timeout: 7000 });
    expect(await computed(play, 'animation-name', '::before')).toBe('site-wash-out');
    // Gone to the right, where the button's own edge clips it.
    await expect.poll(() => computed(play, 'translate', '::before')).toBe('100%');
    expect(await computed(play, 'overflow-x')).toBe('hidden');
  });

  test('the wash is the press tone, under the label', async ({ page }) => {
    await open(page, '/components/agent-plan');
    const play = playButton(page);
    // The one neutral overlay, at its pressed step: ink at 10% (design-system.md §4).
    const tone = await computed(play, 'background-color', '::before');
    expect(tone).toMatch(/\/ 0\.1\)$/);
    // Below the label, and `isolate` keeps it above the button's own ground.
    expect(Number(await computed(play, 'z-index', '::before'))).toBeLessThan(0);
    expect(await computed(play, 'isolation')).toBe('isolate');
  });

  // Until 2026-11-17 this was the hero's Replay. The hero loops now, with Pause (D6).
  test('Replay: a card’s takes it too', async ({ page }) => {
    await open(page, '/');
    const replay = page.getByRole('button', { name: 'Replay Agent plan' });
    await expect(replay).not.toHaveAttribute('data-run');
    await replay.click();
    await expect(replay).toHaveAttribute('data-run', 'playing');
    await expect.poll(() => wash(replay)).toMatch(HELD);
    await expect(replay).toHaveAttribute('data-run', 'ended', { timeout: 7000 });
  });

  test.describe('with reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });
    test('there is no run to hold through, and the wash never shows', async ({ page }) => {
      await open(page, '/components/agent-plan');
      const play = playButton(page);
      await play.click();
      // The player jumps to rest and says so: that is the press's answer here.
      await expect(page.locator('[data-pair-play] [role="status"]')).toHaveText('Agent plan played.');
      await expect(play).not.toHaveAttribute('data-run');
      expect(await computed(play, 'animation-name', '::before')).toBe('none');
      expect(await computed(play, 'scale', '::before')).toBe(AT_REST);
    });
  });
});

test.describe('the page turns', () => {
  /**
   * Whether leaving this page for `href` ran a view transition. `pageswap`
   * fires on the old page as it is replaced, and carries the transition when
   * there is one. The answer crosses the navigation in sessionStorage.
   */
  async function turned(page: Page, name: string, href: string) {
    await page.evaluate(() => {
      sessionStorage.removeItem('turn');
      window.addEventListener('pageswap', (event) => {
        sessionStorage.setItem('turn', String(Boolean((event as PageSwapEvent).viewTransition)));
      });
    });
    await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name, exact: true }).click();
    await page.waitForURL(`**${href}`);
    return page.evaluate(() => sessionStorage.getItem('turn'));
  }

  test('a link between two pages runs a view transition', async ({ page }) => {
    await open(page, '/');
    expect(await turned(page, 'Vocabulary', '/vocabulary')).toBe('true');
  });

  test('the nav and the footer are named, so they hold while the page changes', async ({ page }) => {
    await open(page, '/');
    expect(await computed(page.locator('header').first(), 'view-transition-name')).toBe('site-nav');
    expect(await computed(page.getByRole('contentinfo'), 'view-transition-name')).toBe('site-footer');
  });

  test.describe('with reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });
    test('navigation is the hard cut', async ({ page }) => {
      await open(page, '/');
      expect(await turned(page, 'Vocabulary', '/vocabulary')).toBe('false');
    });
  });
});

/**
 * The Motion page (/foundations/motion, docs/explorations/motion-page-spec.md).
 * Its Timing list is typed, because there is no motion token to read: so each
 * entry names the file and the text that set its value, and this reads them.
 * A duration changed in a component fails here until the list says the same.
 */
test.describe('the Motion page', () => {
  test('every timing it lists is still written where it says', () => {
    const root = new URL('../../../', import.meta.url);
    for (const { file, text } of [...motions.map((m) => m.source), playerSource]) {
      const source = readFileSync(new URL(file, root), 'utf8');
      for (const t of text) expect(source, `${file} no longer has "${t}"`).toContain(t);
    }
  });

  test('its Timing list has a row for each', async ({ page }) => {
    await open(page, '/foundations/motion');
    const list = page.getByRole('list', { name: 'Every motion' });
    await expect(list.getByRole('listitem')).toHaveText(motions.map((m) => new RegExp(`^${m.name}`)));
  });
});
