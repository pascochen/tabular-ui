#!/usr/bin/env node
// Builds Tabular UI's shadcn registry.
//
//   pnpm --filter tabular-ui build:registry
//
// 1. Writes packages/ui/registry.json: one item per component folder, one per shared module in lib/
//    and per helper the components share, `tokens` for the stylesheets, and `all`. Each item's npm
//    dependencies and registry dependencies are read from the imports in its files, so the file is
//    never edited by hand. Re-running it on unchanged sources produces no diff.
// 2. Runs `shadcn build`, which writes one JSON file per item, with the file contents inlined, into
//    apps/storybook/public/r/. Storybook serves that folder at storybook.tabularui.com/r/<name>.json.
//
// Installed files keep the package's own folder layout under the app's components alias
// (`@components/tabular-ui/...`), so the relative imports between them resolve exactly as they do
// here, and no install ever replaces the app's own `lib/utils`. Every file is `registry:file`, which
// shadcn copies byte for byte: its rewrites (imports, `asChild`, RTL, colour classes) are written for
// shadcn's own sources, and these files are already finished and tested.
//
// REGISTRY_URL overrides the base URL in registryDependencies, e.g. to test an install from a local
// server. Default: https://tabularui.com/r.

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as prettier from 'prettier';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'src');
const out = resolve(root, '../../apps/storybook/public/r');
const stage = join(root, '.registry');
const BASE_URL = (process.env.REGISTRY_URL ?? 'https://tabularui.com/r').replace(/\/$/, '');
// shadcn's CLI is run, never installed (tools.md). Pinned: a registry built by a newer CLI could
// change shape between two builds of the same sources.
const SHADCN = 'shadcn@4.21.5';
const TARGET_ROOT = '@components/tabular-ui';

const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const versions = { ...pkg.peerDependencies, ...pkg.dependencies };
// Every app that renders React already has these.
const PROVIDED = new Set(['react', 'react-dom']);

// One line each, for the registry listing and `shadcn view`. A component missing here fails the build.
const descriptions = {
  // Foundational
  Avatar: 'A person’s picture or initials. An animated image plays only when asked.',
  Badge: 'A static label for a state or a count, in one of six tones.',
  Button: 'The action control: default, outline, ghost, danger and inline variants, three sizes.',
  Checkbox: 'A checkbox with checked and indeterminate states.',
  Chip: 'An interactive token for a selection, optionally dismissible.',
  Combobox: 'A filterable Select, with multi-select chips.',
  Dialog: 'A modal dialog with header, body and footer parts.',
  IconButton: 'A square icon-only button. Its label is required and doubles as its tooltip.',
  Input: 'A text field, with numeric and mono variants.',
  Menu: 'A dropdown menu: items, groups, checkbox and radio items, submenus.',
  MessageScroller: 'A message list that keeps its place and scrolls to the latest.',
  Popover: 'A floating panel anchored to a trigger.',
  Select: 'A choice of one option from a list.',
  Spinner: 'The working indicator: a square tracer.',
  Switch: 'An on/off toggle.',
  Tabs: 'Tabbed panels, horizontal or vertical.',
  Textarea: 'A multi-line text field that grows with its text.',
  Tooltip: 'A short label shown on hover and focus.',
  // Product
  AccountMenu: 'The signed-in user’s menu, with the colour mode choice.',
  AgentBlock: 'Agent-authored content, with its authorship rail and label.',
  AgentPlan: 'An agent’s plan and each step’s status. Sits inside an AgentBlock.',
  AgentReasoning: 'An agent’s collapsible reasoning, with a working state. Sits inside an AgentBlock.',
  AppBar: 'The top bar: brand, navigation and actions.',
  AppShell: 'The page frame: sidebar, page header, panels and content width.',
  AttachmentRow: 'A file in a list: type icon, name, size and status.',
  ChannelMessage: 'A member’s message in a multi-person channel, with inline replies.',
  ChatComposer: 'The message box, with send, attach and stop inside it.',
  ChatStarter: 'Suggested prompts for an empty conversation.',
  ChatThread: 'A conversation of user and assistant turns.',
  CodeView: 'Read-only SQL and dbt code.',
  Confirmation:
    'Permission for one action before it runs: what it changes and who it reaches. Sits inside an AgentBlock.',
  ContextSwitcher: 'A menu for switching the current context, with actions.',
  CountBadge: 'A count beside a label or icon.',
  DataTable: 'A sortable, filterable, virtualized table with 28px rows.',
  EmptyState: 'What a screen shows before it has content.',
  Field: 'A label, help text and error, wired to one control.',
  FilterChip: 'An active filter that can be removed.',
  InlineCitation: 'A numbered mark after a figure that opens the source it rests on.',
  LineageTree: 'A nested tree of model dependencies.',
  MetricTile: 'A KPI figure with its label and change.',
  OrgSwitcher: 'Switches between organizations.',
  PresenceStack: 'Who is here, as overlapping avatars with a +N count.',
  ProgressBar: 'The progress of a run, in a tone.',
  ProjectSwitcher: 'Switches between projects.',
  Question: 'One question the agent can’t settle alone, answered in a press. Sits inside an AgentBlock.',
  RunLogRow: 'One pipeline run in a log.',
  Sources: 'What an answer rests on, numbered, and what was not checked.',
  StatusBadge: 'A run or validation status.',
  Tool: 'Each call the agent makes, as one line: what it’s doing, what it did, or what failed and what’s next. Sits inside an AgentBlock.',
  Toolbar: 'A row of controls above a table or view.',
  TruncatedText: 'Text cut to fit, with the full text in a tooltip.',
};

const modules = {
  'lib/utils.ts': ['utils', 'cn(): joins class names and resolves Tailwind conflicts, aware of the type scale.'],
  'lib/theme.ts': ['theme-mode', 'useTheme(): sets data-theme on the page, follows the OS if asked, remembers it.'],
  'lib/motion.ts': ['motion', 'useReducedMotion(): whether the user asked for less motion.'],
  'lib/elapsed.ts': ['elapsed', 'Counts and formats the time a working state has run.'],
  'components/foundational/controlBase.ts': [
    'control-base',
    'The classes every control shares: focus ring, disabled fade.',
  ],
  'components/foundational/popupSurface.ts': [
    'popup-surface',
    'The surface every popup shares: ground, border, shadow, row inset.',
  ],
  'components/foundational/dangerVariant.ts': [
    'danger-variant',
    'Reads the danger variant and its retired spelling, destructive.',
  ],
  'components/product/workingLabel.tsx': ['working-label', 'The label a working state shows, with its elapsed time.'],
  'components/product/announcement.ts': [
    'announcement',
    'useAnnouncement(): says a change once in a live region, then clears it.',
  ],
};

const kebab = (name) => name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
const posix = (p) => p.split('\\').join('/');
const rel = (abs) => posix(relative(root, abs));
const isStory = (f) => /\.stories\.tsx$/.test(f) || /\.mdx$/.test(f);
const isCode = (f) => /\.(ts|tsx)$/.test(f) && !isStory(f);

// ---------------------------------------------------------------------------
// Items and the files each owns
// ---------------------------------------------------------------------------

const items = [];
const owner = new Map(); // absolute file path -> item name

function addItem(item, files) {
  for (const f of files) owner.set(f, item.name);
  items.push({ ...item, absFiles: files });
}

// A component folder: everything but its stories, README and story fixtures.
function componentFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) continue; // fixtures/ holds story assets only
    if (isCode(entry.name)) files.push(join(dir, entry.name));
  }
  return files.sort();
}

for (const [layer, type] of [
  ['foundational', 'registry:ui'],
  ['product', 'registry:component'],
]) {
  const layerDir = join(src, 'components', layer);
  for (const entry of readdirSync(layerDir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (!entry.isDirectory()) continue;
    const description = descriptions[entry.name];
    if (!description)
      throw new Error(`No registry description for ${layer}/${entry.name}: add one to scripts/build-registry.mjs`);
    addItem(
      { name: kebab(entry.name), type, title: entry.name, description, categories: [layer] },
      componentFiles(join(layerDir, entry.name)),
    );
  }
}

for (const [file, [name, description]] of Object.entries(modules)) {
  const abs = join(src, file);
  if (!existsSync(abs)) throw new Error(`Registry module ${file} no longer exists`);
  addItem({ name, type: 'registry:lib', title: name, description, categories: ['lib'] }, [abs]);
}

// Every shared module must be listed above, or a component's dependency would point at nothing.
for (const dir of [join(src, 'lib'), join(src, 'components/foundational'), join(src, 'components/product')]) {
  for (const f of readdirSync(dir)) {
    const abs = join(dir, f);
    if (isCode(f) && !owner.has(abs)) throw new Error(`${rel(abs)} belongs to no registry item: add it to modules`);
  }
}

// ---------------------------------------------------------------------------
// Dependencies, from imports
// ---------------------------------------------------------------------------

const IMPORT = /(?:^|\n)\s*(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|(?:^|\n)\s*import\s*['"]([^'"]+)['"]/g;

function resolveRelative(fromFile, spec) {
  const base = resolve(dirname(fromFile), spec);
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, join(base, 'index.ts'), join(base, 'index.tsx')]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  throw new Error(`${rel(fromFile)} imports ${spec}, which resolves to no file`);
}

const packageName = (spec) => (spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0]);

for (const item of items) {
  const npm = new Set();
  const registry = new Set(['tokens']);
  for (const file of item.absFiles) {
    for (const m of readFileSync(file, 'utf8').matchAll(IMPORT)) {
      const spec = m[1] ?? m[2];
      if (spec.startsWith('.')) {
        const target = owner.get(resolveRelative(file, spec));
        if (!target) throw new Error(`${rel(file)} imports ${spec}, which belongs to no registry item`);
        if (target !== item.name) registry.add(target);
      } else {
        const name = packageName(spec);
        if (PROVIDED.has(name)) continue;
        if (!versions[name]) throw new Error(`${rel(file)} imports ${name}, which package.json does not list`);
        npm.add(`${name}@${versions[name]}`);
      }
    }
  }
  item.dependencies = [...npm].sort();
  item.registryDependencies = [...registry].sort();
}

// ---------------------------------------------------------------------------
// tokens: the stylesheets, for an app that already imports Tailwind
// ---------------------------------------------------------------------------

// src/index.css starts with `@import 'tailwindcss'`, which an app with Tailwind already has, and a
// second copy duplicates the whole framework. tokens.css is the same file without that line.
mkdirSync(stage, { recursive: true });
const indexCss = readFileSync(join(src, 'index.css'), 'utf8');
const tailwindImport = "@import 'tailwindcss';\n";
if (!indexCss.startsWith(tailwindImport))
  throw new Error(`src/index.css no longer starts with ${tailwindImport.trim()}`);
writeFileSync(
  join(stage, 'tokens.css'),
  `/* Tabular UI tokens, fonts and Base UI state variants. GENERATED by scripts/build-registry.mjs from
   src/index.css, without its @import 'tailwindcss': import this AFTER Tailwind in the app's own
   stylesheet. */\n${indexCss.slice(tailwindImport.length)}`,
);
const styleFiles = ['theme.css', 'palette.css', 'shadcn.css'].map((f) => join(src, 'styles', f));
const cssDeps = [...indexCss.matchAll(/@import '([^.'][^']*)'/g)].map((m) => packageName(m[1]));
items.unshift({
  name: 'tokens',
  type: 'registry:item',
  title: 'Tokens',
  description: 'The Riso Ledger token layer, fonts and Base UI state variants, for Tailwind CSS v4.',
  categories: ['tokens'],
  absFiles: [join(stage, 'tokens.css'), ...styleFiles],
  dependencies: [...new Set(cssDeps.filter((d) => d !== 'tailwindcss'))].map((d) => `${d}@${versions[d]}`).sort(),
  registryDependencies: [],
});

// all: every item, plus the package's barrel, so `@/components/tabular-ui` imports like the package.
items.push({
  name: 'all',
  type: 'registry:item',
  title: 'All of Tabular UI',
  description: 'Every component, the tokens and the shared modules, with an index to import them from.',
  categories: ['all'],
  absFiles: [join(src, 'index.ts')],
  dependencies: [],
  registryDependencies: items.map((i) => i.name).sort(),
});

// ---------------------------------------------------------------------------
// registry.json
// ---------------------------------------------------------------------------

const target = (abs) =>
  abs.startsWith(stage)
    ? `${TARGET_ROOT}/${posix(relative(stage, abs))}`
    : `${TARGET_ROOT}/${posix(relative(src, abs))}`;

const registry = {
  $schema: 'https://ui.shadcn.com/schema/registry.json',
  name: 'tabular-ui',
  homepage: 'https://tabularui.com',
  items: items.map(({ absFiles, registryDependencies, dependencies, ...item }) => ({
    ...item,
    author: 'Pascal Chenier',
    ...(dependencies.length ? { dependencies } : {}),
    ...(registryDependencies.length
      ? { registryDependencies: registryDependencies.map((name) => `${BASE_URL}/${name}.json`) }
      : {}),
    files: absFiles.map((abs) => ({ path: rel(abs), type: 'registry:file', target: target(abs) })),
  })),
};

// Formatted as Prettier would, so `pnpm lint` passes on a fresh build.
const registryPath = join(root, 'registry.json');
const prettierConfig = (await prettier.resolveConfig(registryPath)) ?? {};
writeFileSync(
  registryPath,
  await prettier.format(JSON.stringify(registry), { ...prettierConfig, filepath: registryPath }),
);
console.log(`registry.json: ${registry.items.length} items, base URL ${BASE_URL}`);

// ---------------------------------------------------------------------------
// shadcn build
// ---------------------------------------------------------------------------

mkdirSync(out, { recursive: true });
execFileSync('pnpm', ['dlx', SHADCN, 'build', 'registry.json', '--output', relative(root, out)], {
  cwd: root,
  stdio: 'inherit',
});
const built = readdirSync(out).filter((f) => f.endsWith('.json'));
console.log(`Wrote ${built.length} files to ${posix(relative(resolve(root, '../..'), out))}/`);
