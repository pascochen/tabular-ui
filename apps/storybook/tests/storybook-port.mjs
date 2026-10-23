/**
 * The port Playwright's Storybook runs on for this checkout.
 *
 * `STORYBOOK_PORT` wins when set. Otherwise the port is derived from the
 * checkout's absolute path, so each worktree under `.claude/worktrees/` gets
 * its own port and stays on it across runs. A fixed default let one
 * worktree's run silently reuse another checkout's Storybook. See `tools.md`.
 *
 * 7100–7999 avoids 6006 (`pnpm storybook`), 7000 (macOS AirPlay Receiver)
 * and every port Chromium refuses to load (6566, 6665–6669, 6679, 6697).
 *
 * Plain `.mjs` so `node tests/storybook-port.mjs` can print it.
 */
import { fileURLToPath } from 'node:url';

const RANGE_START = 7100;
const RANGE_SIZE = 900;

export const checkoutRoot = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '');

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
export function storybookPort() {
  const fromEnv = process.env.STORYBOOK_PORT;
  if (fromEnv) {
    if (!/^\d+$/.test(fromEnv)) {
      throw new Error(`STORYBOOK_PORT must be a port number, got "${fromEnv}"`);
    }
    return fromEnv;
  }
  return String(RANGE_START + (hash(checkoutRoot) % RANGE_SIZE));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  console.log(storybookPort());
}
