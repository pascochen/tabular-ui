/**
 * Each component page's usage snippet: the first tsx example in the component's
 * own README, read at build time, as Getting started reads packages/ui/README.md
 * (docs/site.md §4). The page and the README can't disagree, and the site types
 * no figure of its own. All ten examples were type-checked against the package
 * when this was added (2026-10-27).
 *
 * The README examples leave their imports out, so one is built from the names
 * the example uses: hooks from react, *Icon glyphs from Phosphor, and every
 * other component, and any *Handle type, from tabular-ui.
 */
const readmes = import.meta.glob<string>('../../../packages/ui/src/components/product/*/README.md', {
  query: '?raw',
  import: 'default',
  eager: true,
});

/** The README's folder for a registry name: `chat-starter` is ChatStarter. */
function folder(name: string): string {
  return name.replace(/(^|-)([a-z])/g, (_, __, letter: string) => letter.toUpperCase());
}

function importsFor(code: string): string {
  const unique = (found: Iterable<string>) => [...new Set(found)].sort();
  const hooks = unique(code.match(/\buse(?:Ref|State|Effect|Memo|Callback)\b/g) ?? []);
  const tags = unique([...code.matchAll(/<([A-Z]\w*)/g)].map((m) => m[1]));
  const icons = tags.filter((t) => t.endsWith('Icon'));
  const ui = tags.filter((t) => !t.endsWith('Icon'));
  const types = unique(code.match(/\b[A-Z]\w*Handle\b/g) ?? []).map((t) => `type ${t}`);
  return [
    hooks.length ? `import { ${hooks.join(', ')} } from 'react';` : null,
    icons.length ? `import { ${icons.join(', ')} } from '@phosphor-icons/react';` : null,
    `import { ${[...ui, ...types].join(', ')} } from 'tabular-ui';`,
  ]
    .filter(Boolean)
    .join('\n');
}

/** The usage snippet for a built component. A README without a tsx example fails the build. */
export function usage(name: string): string {
  const path = `../../../packages/ui/src/components/product/${folder(name)}/README.md`;
  const readme = readmes[path];
  if (!readme) throw new Error(`No README for ${name} at packages/ui/src/components/product/${folder(name)}`);
  const code = readme.match(/```tsx\n([\s\S]*?)```/)?.[1]?.trimEnd();
  if (!code) throw new Error(`${folder(name)}/README.md has no tsx example for its page's usage snippet`);
  return `${importsFor(code)}\n\n${code}`;
}
