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

Every component is also in a shadcn registry, for apps that want the source in their own repository:

```bash
pnpm dlx shadcn@latest add https://tabularui.com/r/button.json
pnpm dlx shadcn@latest add https://tabularui.com/r/all.json   # everything
```

Files land in one folder under the app's components alias, `components/tabular-ui/`, in the package's own layout, and the app's own `lib/utils` is never replaced. `all` adds an index, so imports read `@/components/tabular-ui`. Then add the tokens after Tailwind in the app's main stylesheet:

```css
@import 'tailwindcss';
@import './components/tabular-ui/tokens.css';
```

`tokens.css` defines shadcn's variable names (`--background`, `--primary` and the rest) mapped onto Tabular UI's tokens, and switches dark mode on `data-theme` rather than a `.dark` class. In a project set up with `shadcn init`, delete the `:root`, `.dark`, `@theme inline` and `@custom-variant dark` blocks the init wrote, so there is one definition of each. `useTheme()` and `TooltipProvider` are needed as above.

## License

MIT © Pascal Chenier
