# tabular-ui

Dense React components and design tokens for finance and operations data tools: tables, run logs, metric tiles, lineage, and the agent-authored blocks, plans and chat around them. Built on Base UI and Tailwind CSS v4.

[Storybook](https://storybook.tabularui.com) · [Demo](https://demo.tabularui.com) · [Source](https://github.com/pascochen/tabular-ui)

## Install

Tabular UI installs as source: a shadcn registry copies each component into your app, where you own it. The registry is rebuilt from `main` on every deploy of [tabularui.com](https://tabularui.com). Version 0.1.0 on npm is an early snapshot and isn't updated.

The app must already be a shadcn project: React 19, Tailwind CSS 4.1 or later, the `@/` alias and a `components.json` from `shadcn init`, as in [shadcn's installation guide](https://ui.shadcn.com/docs/installation).

```bash
pnpm dlx shadcn@latest add https://tabularui.com/r/all.json      # everything
pnpm dlx shadcn@latest add https://tabularui.com/r/button.json   # or one component and what it needs
```

Files land in one folder under the app's components alias, `components/tabular-ui/`, in the package's own layout, and the app's own `lib/utils` is never replaced. Each item brings the items and npm packages it imports.

## Set up the stylesheet

Add the tokens after Tailwind in the app's main stylesheet:

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

The init installed the `shadcn` and Geist packages only for those imports, so remove them too. Keep `tw-animate-css`, which `tokens.css` uses:

```bash
pnpm remove shadcn @fontsource-variable/geist
```

## Set up the app root

```tsx
import { TooltipProvider, useTheme } from '@/components/tabular-ui';

function App() {
  useTheme(); // sets data-theme on <html>: dark by default, remembered, can follow the OS
  return <TooltipProvider>{/* the app */}</TooltipProvider>;
}
```

- **`useTheme()`**, called once at the root, owns the colour mode. Without it the page renders in light mode in a dark-first system, with no error. Put the same mode in `index.html` (`<html data-theme="dark">`) so the page does not switch on load.
- **`TooltipProvider`**: `IconButton` labels itself with a tooltip, so one provider must sit above every icon-only control.

`all` brings both. Without it, they come from their own items:

```bash
pnpm dlx shadcn@latest add https://tabularui.com/r/theme-mode.json   # useTheme, from @/components/tabular-ui/lib/theme
pnpm dlx shadcn@latest add https://tabularui.com/r/tooltip.json      # TooltipProvider, from @/components/tabular-ui/components/foundational/Tooltip
```

## Use

`all` adds an index, so imports read `@/components/tabular-ui`:

```tsx
import { AgentBlock, Button, StatusBadge } from '@/components/tabular-ui';

<Button>Run models</Button>
<StatusBadge status="failed" />
<AgentBlock authorship="AI · Awaiting review">Two models changed since the last run.</AgentBlock>
```

A single item has no index, so import it from its own folder:

```tsx
import { AgentBlock } from '@/components/tabular-ui/components/product/AgentBlock';
```

Every component, its props and its states are in [Storybook](https://storybook.tabularui.com). The components are client components; in a Next.js App Router project, render them from a file marked `'use client'`.

## License

MIT © Pascal Chenier
