import { afterEach } from 'vitest';

// Setup file for the `storybook (light)` Vitest project (vite.config.ts): every
// story renders in light mode, and axe checks it there. Read by preview.tsx.
(globalThis as { __TUI_STORY_THEME__?: 'dark' | 'light' }).__TUI_STORY_THEME__ = 'light';

// The guard: if the switch ever stops reaching the page, every story in this
// project fails, instead of a whole mode passing unchecked. That happened once
// (2026-10-09), when both projects rendered light and nothing failed.
afterEach(() => {
  const applied = document.documentElement.getAttribute('data-theme');
  if (applied !== 'light') {
    throw new Error(`storybook (light) rendered with data-theme="${applied}". The mode switch is broken.`);
  }
});
