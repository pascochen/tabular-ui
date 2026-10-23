import type { Preview } from '@storybook/react-vite';
import './tailwind.css';
import './docs.css';
import { TooltipProvider } from '../../../packages/ui/src/components/foundational/Tooltip';
import { assertOneShadow } from './elevation-sweep';
import { ThemedDocsContainer } from './ThemedDocsContainer';

/* Light/dark toggle driven by [data-theme] on the root — the same switch
   that drives the Tabular UI token layer and the shadcn dark: variant. Dark is
   the canonical mode (design-system.md §0). */
/** Set by `.storybook/story-theme.{dark,light}.ts`, only in the story tests. */
const storyTestTheme = () => (globalThis as { __TUI_STORY_THEME__?: 'dark' | 'light' }).__TUI_STORY_THEME__;

const preview: Preview = {
  // A Docs page per component: every story plus a props table generated from
  // the component's TypeScript types and JSDoc, so its API can be read without
  // opening the source. The README carries the why; this carries the what.
  tags: ['autodocs'],
  globalTypes: {
    theme: {
      description: 'Color mode',
      toolbar: {
        title: 'Theme',
        icon: 'mirror',
        items: ['dark', 'light'],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: 'dark',
  },
  decorators: [
    (Story, context) => {
      // The story tests run every story once per mode: each Vitest project's
      // setup file names its mode (vite.config.ts), and it wins over the
      // toolbar. Outside the tests the global is unset and the toolbar rules.
      const theme = storyTestTheme() ?? (context.globals.theme as string) ?? 'dark';
      document.documentElement.setAttribute('data-theme', theme);
      // Tooltip.Root reads its delay from this provider, so stories without
      // it would silently use Base UI's default instead of our 300ms.
      return (
        <TooltipProvider>
          <Story />
        </TooltipProvider>
      );
    },
  ],
  // §4 Elevation, in the story tests only: every story, both modes, paints no
  // shadow but the overlay sheet. Not in the Storybook UI, where a failing
  // sweep would only add noise to a story someone is editing.
  afterEach: ({ canvasElement }) => {
    if (storyTestTheme()) assertOneShadow(canvasElement);
  },
  parameters: {
    // The product targets laptop through wide monitor; tablet and phone are
    // out of scope, so the stock phone presets are replaced rather than
    // extended. `split` sits below the 1280px floor on purpose — it is a
    // small laptop or a half-screen window, where AppShell's sidebar
    // collapses. Select one per story with
    // `globals: { viewport: { value: 'laptop' } }` — Storybook 9+ ignores the
    // old `parameters.viewport.defaultViewport`.
    viewport: {
      options: {
        split: { name: 'Split window 1024', styles: { width: '1024px', height: '768px' }, type: 'desktop' },
        laptop: { name: 'Laptop 1280', styles: { width: '1280px', height: '800px' }, type: 'desktop' },
        laptopLg: { name: 'Laptop 1440', styles: { width: '1440px', height: '900px' }, type: 'desktop' },
        desktop: { name: 'Desktop 1920', styles: { width: '1920px', height: '1080px' }, type: 'desktop' },
        wide: { name: 'Wide 2560', styles: { width: '2560px', height: '1440px' }, type: 'desktop' },
      },
    },

    // Docs pages follow the toolbar's mode; see ThemedDocsContainer.
    docs: { container: ThemedDocsContainer },

    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    a11y: {
      // 'error': any axe violation fails the story test, locally and in CI.
      // It was 'todo' until 2026-10-08, which showed violations in the panel
      // and failed nothing; 41 of 170 stories had shipped with one. A story
      // that cannot pass yet takes a named exception from a11y-exceptions.ts,
      // which turns off one rule and says why. Never lower this to get a
      // story green.
      test: 'error',
    },
  },
};

export default preview;
