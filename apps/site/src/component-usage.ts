import publicSurface from '../../../packages/ui/src/index.ts?raw';
import registry from '../../../packages/ui/registry.json';

/**
 * Each component page's usage snippet and install command: the first tsx
 * example in the component's own README, read at build time, as Getting
 * started reads packages/ui/README.md (docs/site.md §4). The page and the
 * README can't disagree, and the site types no figure of its own.
 *
 * The shadcn registry is the only way in (owner, 2026-10-28), and an item has
 * no index, so the README examples leave their imports out and one is built
 * per module the example uses, at the path the registry writes it to:
 * `@/components/tabular-ui/components/product/Sources`. Hooks come from react
 * and *Icon glyphs from Phosphor. The install command adds every item those
 * modules belong to, so the snippet compiles after the one command above it.
 */
const readmes = import.meta.glob<string>('../../../packages/ui/src/components/product/*/README.md', {
  query: '?raw',
  import: 'default',
  eager: true,
});

/** Where the registry puts the package's files in an app (packages/ui/README.md, "Install"). */
const installRoot = '@/components/tabular-ui';

/** Every name src/index.ts exports, and the module it comes from: `Sources` → `components/product/Sources`. */
const moduleOf = new Map<string, string>();
for (const [, names, from] of publicSurface.matchAll(/export(?: type)? \{([^}]*)\} from '\.\/([^']+)';/g)) {
  for (const name of names.split(',').map((n) => n.trim().replace(/^type /, ''))) {
    if (name) moduleOf.set(name, from);
  }
}

/** The registry item that owns a module's file. */
function itemOf(module: string): string {
  const candidates = [`${module}.ts`, `${module}.tsx`, `${module}/index.tsx`, `${module}/index.ts`].map(
    (f) => `src/${f}`,
  );
  const item = registry.items.find((i) => i.files.some((f) => candidates.includes(f.path)));
  if (!item) throw new Error(`No registry item ships ${module}`);
  return item.name;
}

/** The README's folder for a registry name: `chat-starter` is ChatStarter. */
function folder(name: string): string {
  return name.replace(/(^|-)([a-z])/g, (_, __, letter: string) => letter.toUpperCase());
}

function example(name: string): string {
  const path = `../../../packages/ui/src/components/product/${folder(name)}/README.md`;
  const readme = readmes[path];
  if (!readme) throw new Error(`No README for ${name} at packages/ui/src/components/product/${folder(name)}`);
  const code = readme.match(/```tsx\n([\s\S]*?)```/)?.[1]?.trimEnd();
  if (!code) throw new Error(`${folder(name)}/README.md has no tsx example for its page's usage snippet`);
  return code;
}

/** The names an example uses from the library, each with its module. */
function libraryNames(code: string) {
  const unique = (found: Iterable<string>) => [...new Set(found)].sort();
  const handles = unique(code.match(/\b[A-Z]\w*Handle\b/g) ?? []);
  // `<Name` also matches a generic, `useRef<ChatComposerHandle>`: handles are types, imported once, as types.
  const tags = unique([...code.matchAll(/<([A-Z]\w*)/g)].map((m) => m[1])).filter(
    (t) => !handles.includes(t) && !t.endsWith('Icon'),
  );
  return [...tags.map((name) => ({ name, type: false })), ...handles.map((name) => ({ name, type: true }))].map((n) => {
    const module = moduleOf.get(n.name);
    if (!module) throw new Error(`The usage example uses ${n.name}, which src/index.ts doesn't export`);
    return { ...n, module };
  });
}

function importsFor(code: string): string {
  const hooks = [...new Set(code.match(/\buse(?:Ref|State|Effect|Memo|Callback)\b/g) ?? [])].sort();
  const icons = [...new Set([...code.matchAll(/<([A-Z]\w*Icon)\b/g)].map((m) => m[1]))].sort();
  const byModule = new Map<string, string[]>();
  for (const n of libraryNames(code)) {
    byModule.set(n.module, [...(byModule.get(n.module) ?? []), n.type ? `type ${n.name}` : n.name]);
  }
  return [
    hooks.length ? `import { ${hooks.join(', ')} } from 'react';` : null,
    icons.length ? `import { ${icons.join(', ')} } from '@phosphor-icons/react';` : null,
    ...[...byModule]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([module, names]) => `import { ${names.join(', ')} } from '${installRoot}/${module}';`),
  ]
    .filter(Boolean)
    .join('\n');
}

/** The usage snippet for a built component. A README without a tsx example fails the build. */
export function usage(name: string): string {
  const code = example(name);
  return `${importsFor(code)}\n\n${code}`;
}

/**
 * The install command for a built component: its own item first, then every
 * other item its usage snippet imports from. The registry brings each item's
 * own dependencies, so these are only the ones the example adds.
 */
export function install(name: string): string {
  const items = [name, ...new Set(libraryNames(example(name)).map((n) => itemOf(n.module)))].filter(
    (item, i, all) => all.indexOf(item) === i,
  );
  return `pnpm dlx shadcn@latest add ${items.map((item) => `https://tabularui.com/r/${item}.json`).join(' ')}`;
}
