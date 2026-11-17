import { addons } from 'storybook/manager-api';
import { themes } from 'storybook/theming';

/* Storybook's own chrome (sidebar, toolbar, addon panels) in its stock dark
   theme. The canvas already opens dark (preview.tsx, `initialGlobals`), and a
   light frame around a dark canvas glares. This is Storybook's theme, not
   ours: the manager is outside the token layer, and the toolbar's mode
   switch changes the canvas only. */
addons.setConfig({
  theme: themes.dark,
});
