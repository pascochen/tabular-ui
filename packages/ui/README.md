# tabular-ui

Dense React components and design tokens for finance and operations data tools: tables, run logs, metric tiles, lineage, and the agent-authored blocks, plans and chat around them. Built on Base UI and Tailwind CSS v4.

[Storybook](https://storybook.tabularui.com) · [Demo](https://demo.tabularui.com) · [Source](https://github.com/pascochen/tabular-ui)

## Install

```bash
pnpm add tabular-ui @phosphor-icons/react
```

Peer dependencies: React 19, `@phosphor-icons/react` 2, and Tailwind CSS 4.1 or later, set up in the app (for Vite, `@tailwindcss/vite`).

## Set up the stylesheet

Tabular UI ships its CSS as Tailwind source, compiled by the app's own Tailwind. In the app's main stylesheet, replace `@import 'tailwindcss';` with these two lines:

```css
@import 'tabular-ui/styles.css';
@source '../node_modules/tabular-ui/dist';
```

- **`@import 'tabular-ui/styles.css'`** brings Tailwind itself, the fonts, the token layer and Base UI's state variants, in the order they need. Don't import `tailwindcss` again: a second copy duplicates the whole framework.
- **`@source`** is what lets Tailwind see the classes the components use. Tailwind scans the app's own files and skips `node_modules`, so without this line every utility a component uses and the app does not is missing from the build, and nothing errors. The path is relative to the stylesheet: from `src/index.css` it is `../node_modules/tabular-ui/dist`. Count one `../` per folder between the stylesheet and the folder holding `node_modules`.

`tabular-ui/theme.css` and `tabular-ui/palette.css` are also exported, for reading the token values. `styles.css` already includes both.

## Set up the app root

```tsx
import { TooltipProvider, useTheme } from 'tabular-ui';

function App() {
  useTheme(); // sets data-theme on <html>: dark by default, remembered, can follow the OS
  return <TooltipProvider>{/* the app */}</TooltipProvider>;
}
```

- **`useTheme()`**, called once at the root, owns the colour mode. Without it the page renders in light mode in a dark-first system, with no error. Put the same mode in `index.html` (`<html data-theme="dark">`) so the page does not switch on load.
- **`TooltipProvider`**: `IconButton` labels itself with a tooltip, so one provider must sit above every icon-only control.

## Use

```tsx
import { Button, StatusBadge, AgentBlock } from 'tabular-ui';

<Button>Run models</Button>
<StatusBadge status="failed" />
<AgentBlock authorship="AI · Awaiting review">Two models changed since the last run.</AgentBlock>
```

Every component, its props and its states are in [Storybook](https://storybook.tabularui.com). The components are client components; in a Next.js App Router project, render them from a file marked `'use client'`.

## Or copy the source with shadcn

Every component is also in a shadcn registry, for apps that want the source in their own repository. The app must already be a shadcn project: Tailwind 4, the `@/` alias and a `components.json` from `shadcn init`, as in [shadcn's installation guide](https://ui.shadcn.com/docs/installation).

```bash
pnpm dlx shadcn@latest add https://tabularui.com/r/button.json
pnpm dlx shadcn@latest add https://tabularui.com/r/all.json   # everything
```

Files land in one folder under the app's components alias, `components/tabular-ui/`, in the package's own layout, and the app's own `lib/utils` is never replaced. `all` adds an index, so imports read `@/components/tabular-ui`. A single item has no index, so import it from its own folder:

```tsx
import { AgentBlock } from '@/components/tabular-ui/components/product/AgentBlock';
```

Then add the tokens after Tailwind in the app's main stylesheet:

```css
@import 'tailwindcss';
@import './components/tabular-ui/tokens.css';
```

`tokens.css` defines shadcn's variable names (`--background`, `--primary` and the rest) mapped onto Tabular UI's tokens, and switches dark mode on `data-theme` rather than a `.dark` class. It also brings the fonts, `tw-animate-css`, Base UI's state variants and a base layer. `shadcn init` wrote its own copy of each of these into the same stylesheet, so delete what it wrote:

- **The `:root`, `.dark`, `@theme inline` and `@custom-variant dark` blocks**, so there is one definition of each.
- **The `@layer base` block.** Its `* { @apply border-border outline-ring/50 }` halves the focus ring's alpha on every control. `tokens.css` sets the same rule at full strength, along with the page's ground and font.
- **`@import 'shadcn/tailwind.css'`.** Its Base UI state variants are already in `tokens.css`, and Tabular UI left out the rest of that stylesheet on purpose: it accounted for 26 of the 44 findings in the repository's 2026-10-09 audit.
- **The init's font import** (`@fontsource-variable/geist` with the nova preset). Nothing uses it: `tokens.css` loads Source Sans 3, Source Serif 4 and Source Code Pro.
- **Its `@import 'tw-animate-css'`.** `tokens.css` already imports it.

`useTheme()` and `TooltipProvider` are needed as above. Without `all`, they come from their own items:

```bash
pnpm dlx shadcn@latest add https://tabularui.com/r/theme-mode.json   # useTheme, from @/components/tabular-ui/lib/theme
pnpm dlx shadcn@latest add https://tabularui.com/r/tooltip.json      # TooltipProvider, from @/components/tabular-ui/components/foundational/Tooltip
```

## License

MIT © Pascal Chenier
