import { beforeAll } from 'vitest';

// Setup file for both story projects (vite.config.ts). Collects garbage before
// each story file runs, which frees the iframe of the file before it.
//
// Playwright launches Chromium with --disable-dev-shm-usage, so Chrome backs
// its shared memory with deleted files in /tmp, on the runner's root disk. A
// removed iframe's shared memory is released only when the renderer next runs
// a major GC, and on CI's two cores each project runs every story file in one
// page. Late in a run no GC came for ~50s, Chrome held 11 GB in deleted files,
// the disk filled, and the last story files failed to load or hung (run
// 38056871458, 2026-10-10). One GC per file keeps that flat.
//
// The flag that exposes gc() is set in vite.config.ts. If it ever stops
// reaching the browser, every story fails here rather than the disk quietly
// filling again.
beforeAll(() => {
  const gc = (globalThis as { gc?: () => void }).gc;
  if (typeof gc !== 'function') {
    throw new Error('gc() is not exposed. vite.config.ts must launch Chromium with --js-flags=--expose-gc.');
  }
  gc();
});
