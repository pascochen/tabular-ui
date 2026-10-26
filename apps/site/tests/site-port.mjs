/**
 * The port Playwright serves the site's build on for this checkout.
 *
 * `SITE_PORT` wins when set. Otherwise the port is derived from the checkout's
 * absolute path, as apps/storybook/tests/storybook-port.mjs does for Storybook:
 * a fixed port let one worktree's run silently test another checkout's server
 * (CLAUDE.md failure log, 2026-10-08).
 *
 * 8100–8999 stays clear of Storybook's 7100–7999 range and of every port
 * Chromium refuses to load.
 */
import { fileURLToPath } from 'node:url';

const RANGE_START = 8100;
const RANGE_SIZE = 900;

const checkoutRoot = fileURLToPath(new URL('../../..', import.meta.url)).replace(/\/$/, '');

/** FNV-1a, 32-bit. Stable across Node versions, unlike anything seeded. */
function hash(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

/** @returns {string} */
export function sitePort() {
  const fromEnv = process.env.SITE_PORT;
  if (fromEnv) {
    if (!/^\d+$/.test(fromEnv)) {
      throw new Error(`SITE_PORT must be a port number, got "${fromEnv}"`);
    }
    return fromEnv;
  }
  return String(RANGE_START + (hash(checkoutRoot) % RANGE_SIZE));
}
