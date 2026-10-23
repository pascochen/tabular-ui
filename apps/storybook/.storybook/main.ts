import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  // Stories live beside their components in packages/ui (one folder per
  // component); this app only configures and serves them.
  stories: ['../../../packages/ui/src/**/*.mdx', '../../../packages/ui/src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  // public/ is served as-is: public/r/ holds the shadcn registry JSON that
  // packages/ui's build:registry writes, at storybook.tabularui.com/r/<name>.json.
  staticDirs: ['../public'],
  addons: [
    '@chromatic-com/storybook',
    '@storybook/addon-vitest',
    '@storybook/addon-a11y',
    '@storybook/addon-docs',
    '@storybook/addon-mcp',
  ],
  framework: '@storybook/react-vite',
};
export default config;
