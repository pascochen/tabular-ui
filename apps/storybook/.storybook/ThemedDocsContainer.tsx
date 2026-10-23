import { DocsContainer, type DocsContainerProps } from '@storybook/addon-docs/blocks';
import { useSyncExternalStore, type PropsWithChildren } from 'react';
import { themes } from 'storybook/theming';

/**
 * Docs pages follow the toolbar's mode. Storybook draws a Docs page in its
 * own light theme whatever the mode, so in dark the stories rendered
 * dark-mode text, near white, on a white page: a selected tab's label all
 * but vanished (found in human review, 2026-10-11).
 *
 * The decorator in preview.tsx sets `data-theme` on the root every time a
 * story renders, so the container watches that attribute rather than
 * reaching into Storybook's internals for the global.
 */
const subscribe = (onChange: () => void) => {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  return () => observer.disconnect();
};
const currentMode = () => (document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark');

export function ThemedDocsContainer(props: PropsWithChildren<DocsContainerProps>) {
  const mode = useSyncExternalStore(subscribe, currentMode, () => 'dark');
  return <DocsContainer {...props} theme={mode === 'dark' ? themes.dark : themes.light} />;
}
