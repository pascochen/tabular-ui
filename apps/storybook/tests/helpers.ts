import type { Page, Locator } from '@playwright/test';

/** Storybook story URL. Stories are the fixtures — see playwright.config.ts. */
export const story = (id: string, theme: 'dark' | 'light' = 'dark') => `/iframe.html?id=${id}&globals=theme:${theme}`;

/**
 * Navigates and waits for the theme to actually be applied.
 *
 * `page.goto` resolves on `load`, but Storybook's decorator sets
 * `data-theme` when the story renders — later. Reading tokens in that gap
 * returns the `:root` (light) values, which made every dark-mode assertion
 * silently compare against light figures. Worse, a token read before the
 * switch and one read after could be mixed in a single assertion.
 */
export async function gotoStory(page: Page, id: string, theme: 'dark' | 'light' = 'dark') {
  await page.goto(story(id, theme));
  // 20s, not 10: the first page of a run waits on a cold dev server. With two
  // workers that measured ~8s on main on 2026-10-15, and ~11s once
  // ChatComposer's graph grew by AttachmentRow, so 10s failed the first test
  // in each worker every cold run. Later pages take well under a second. It
  // only waits for the story to render; it asserts nothing, so a longer wait
  // hides no failure. Inside Playwright's 30s test timeout.
  await page.waitForFunction((t) => document.documentElement.getAttribute('data-theme') === t, theme, {
    timeout: 20_000,
  });
}

/**
 * Presses Tab until `target` is focused, so the ring is driven by real
 * keyboard focus. `element.focus()` does not reliably match `:focus-visible`,
 * which is the whole thing under test.
 */
export async function tabTo(page: Page, target: Locator, max = 40): Promise<boolean> {
  const handle = await target.elementHandle();
  if (!handle) return false;
  for (let i = 0; i < max; i++) {
    await page.keyboard.press('Tab');
    const isActive = await page.evaluate((el) => document.activeElement === el, handle);
    if (isActive) return true;
  }
  return false;
}

export type Overhang = { el: string; left: number; right: number; top: number; bottom: number };

/**
 * For the focused element, how far its focus ring extends past each clipping
 * ancestor. Positive means clipped.
 *
 * Ring geometry is read from the element's own computed outline, so this
 * measures what is actually painted rather than what the tokens intend.
 */
export async function ringOverhang(page: Page): Promise<Overhang[]> {
  return page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el) return [];
    el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    const s = getComputedStyle(el);
    const w = parseFloat(s.outlineWidth) || 0;
    const off = parseFloat(s.outlineOffset) || 0;
    const r = el.getBoundingClientRect();
    const ring = { l: r.left - off - w, r: r.right + off + w, t: r.top - off - w, b: r.bottom + off + w };
    const out: Overhang[] = [];
    let n = el.parentElement;
    while (n && n !== document.body) {
      const cs = getComputedStyle(n);
      if (/hidden|auto|scroll|clip/.test(cs.overflowX + cs.overflowY)) {
        const c = n.getBoundingClientRect();
        out.push({
          el: (n.className || n.tagName).toString().slice(0, 40),
          left: +(c.left - ring.l).toFixed(2),
          right: +(ring.r - c.right).toFixed(2),
          top: +(c.top - ring.t).toFixed(2),
          bottom: +(ring.b - c.bottom).toFixed(2),
        });
      }
      n = n.parentElement;
    }
    return out;
  });
}

/** How the focused element draws its ring. */
export async function focusRingStyle(page: Page) {
  return page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el) return null;
    const s = getComputedStyle(el);
    return {
      outlineStyle: s.outlineStyle,
      outlineWidth: s.outlineWidth,
      outlineOffset: s.outlineOffset,
      outlineColor: s.outlineColor,
      boxShadow: s.boxShadow,
      tag: el.tagName.toLowerCase(),
      slot: el.getAttribute('data-slot'),
    };
  });
}

/**
 * Resolves any CSS colour to sRGB by painting it, so the browser performs the
 * OKLCH conversion rather than the test reimplementing it.
 */
export async function contrastRatio(page: Page, fg: string, bg: string): Promise<number> {
  return page.evaluate(
    ([fgColor, bgColor]) => {
      const toRgb = (color: string): [number, number, number] => {
        const c = document.createElement('canvas');
        c.width = c.height = 1;
        const ctx = c.getContext('2d')!;
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, 1, 1);
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 1, 1);
        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
        return [r, g, b];
      };
      const lum = (rgb: [number, number, number]) => {
        const [r, g, b] = rgb.map((v) => {
          const s = v / 255;
          return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };
      const a = lum(toRgb(fgColor));
      const b = lum(toRgb(bgColor));
      const [hi, lo] = a > b ? [a, b] : [b, a];
      return (hi + 0.05) / (lo + 0.05);
    },
    [fg, bg],
  );
}

/** Reads a custom property off the document root. */
export async function token(page: Page, name: string): Promise<string> {
  return page.evaluate((n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim(), name);
}

/**
 * A CSS colour as [r, g, b, a], resolved by painting it, so two colours
 * written in different spaces (`oklch` tokens, `rgb()` computed styles,
 * `oklab` alpha tints) compare equal when they paint the same.
 */
export const rgba = (page: Page, color: string) =>
  page.evaluate((c) => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = c;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    return [r, g, b, +(a / 255).toFixed(2)];
  }, color);
