/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
import path from 'node:path';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';

import { StoryProgressWatchdog } from './.storybook/story-progress-watchdog.ts';
const dirname = import.meta.dirname;

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Pre-bundle these rather than let Vite discover them mid-session and force
  // a page reload. Phosphor is one barrel with ~3,000 exports (§11.4); the
  // Base UI entry points are listed because discovery during a browser-mode
  // test run reloads the page underneath in-flight tests, which showed up as
  // the newest story file failing on first run and passing on retry.
  // Add an entry here whenever a component adopts a new Base UI part.
  // `tabular-ui > x` resolves x from packages/ui, which depends on it: this
  // app does not, and a bare name that fails to resolve is skipped with only
  // a warning, so the reloads come back.
  optimizeDeps: {
    include: [
      '@phosphor-icons/react',
      'tabular-ui > @base-ui/react',
      'tabular-ui > @tanstack/react-table',
      'tabular-ui > @tanstack/react-virtual',
      'tabular-ui > @base-ui/react/avatar',
      'tabular-ui > @base-ui/react/button',
      'tabular-ui > @base-ui/react/menu',
      'tabular-ui > @base-ui/react/merge-props',
      'tabular-ui > @base-ui/react/popover',
      'tabular-ui > @base-ui/react/checkbox',
      'tabular-ui > @base-ui/react/dialog',
      'tabular-ui > @base-ui/react/input',
      'tabular-ui > @base-ui/react/select',
      'tabular-ui > @base-ui/react/switch',
      'tabular-ui > @base-ui/react/tabs',
      'tabular-ui > @base-ui/react/tooltip',
      'tabular-ui > @base-ui/react/use-render',
      // MessageScroller's headless behaviour (foundational, 2026-10-12).
      'tabular-ui > @shadcn/react/message-scroller',
      // The themed Docs container (.storybook/ThemedDocsContainer.tsx) loads
      // in every story test through preview.tsx; discovered mid-run, they
      // reloaded the pages under the tests and ~50 story files failed to load.
      '@storybook/addon-docs/blocks',
      'storybook/theming',
    ],
  },
  // Every story runs twice, once per mode, each with axe set to fail. Light
  // and dark are not mirrors (§0 rule 4), so passing in one says nothing about
  // the other: until 2026-10-09 only dark ran, and light-mode warning badges
  // shipped at 4.49:1 with every check green.
  test: {
    // Vitest's own defaults (it adds github-actions in CI only when this list
    // is unset), plus a watchdog that fails the run when it stops making
    // progress, naming the last story started, rather than leaving CI to hit
    // its 30-minute limit. Three minutes of silence covers CI's start, about
    // 70s of cold pre-bundling. A `--reporter` flag on the command line
    // replaces this list, watchdog included.
    reporters: [
      'default',
      ...(process.env.GITHUB_ACTIONS === 'true' ? ['github-actions' as const] : []),
      new StoryProgressWatchdog(180_000),
    ],
    projects: (['dark', 'light'] as const).map((theme) => ({
      extends: true,
      plugins: [
        // Runs the stories in the Storybook config as tests.
        // https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
        storybookTest({ configDir: path.join(dirname, '.storybook') }),
        // Each project pre-bundles dependencies into its own folder. The
        // Storybook plugin puts them under a folder hashed from the Storybook
        // config, the same for both projects, and two servers optimizing into
        // one folder at once can replace it under each other. A precaution:
        // it was credited with fixing CI's "Failed to fetch dynamically
        // imported module" / "Cannot connect to the iframe" failures, which
        // came back unchanged. Their real cause was the disk filling up (see
        // .storybook/story-gc.ts). `enforce: 'post'` so this runs after the
        // Storybook plugin's own config hook and its cacheDir wins.
        {
          name: 'tui:story-cache-per-mode',
          enforce: 'post' as const,
          config: () => ({ cacheDir: path.join(dirname, `node_modules/.cache/storybook/sb-vitest-${theme}`) }),
        },
      ],
      test: {
        name: `storybook (${theme})`,
        // Names this project's mode for the preview decorator. A setup file,
        // not `define`: Vite's define is shared across the projects, so with
        // it both ran light and the dark pass silently checked nothing
        // (found 2026-10-09 by removing an exemption and watching *both*
        // modes fail). Each setup file also fails every story whose page is not in its mode.
        setupFiles: [
          path.join(dirname, `.storybook/story-theme.${theme}.ts`),
          path.join(dirname, '.storybook/story-gc.ts'),
        ],
        browser: {
          enabled: true,
          headless: true,
          // --expose-gc lets .storybook/story-gc.ts collect the previous
          // file's iframe. Without it, CI's disk filled up (see that file).
          provider: playwright({ launchOptions: { args: ['--js-flags=--expose-gc'] } }),
          instances: [{ browser: 'chromium' }],
        },
      },
    })),
  },
});
