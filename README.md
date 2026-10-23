<picture>
  <source media="(prefers-color-scheme: dark)" srcset="brand/tabular-wordmark-dark.svg">
  <img alt="Tabular" src="brand/tabular-wordmark.svg" width="153" height="26">
</picture>

Dense React components and design tokens for finance and operations data tools: tables, run logs, metric tiles, lineage, and the agent-authored blocks, plans and chat around them.

18 foundational components on Base UI, 26 product components, and one OKLCH token layer for Tailwind CSS v4. Dark-first, five hues, colour only for state.

**[Storybook](https://storybook.tabularui.com)** · **[Demo](https://demo.tabularui.com)**

## Install

From npm:

```bash
pnpm add tabular-ui @phosphor-icons/react
```

Then, in the app's main stylesheet, in place of `@import 'tailwindcss'`:

```css
@import 'tabular-ui/styles.css';
@source '../node_modules/tabular-ui/dist';
```

Or copy the source into the app with the shadcn registry, one component or all of them:

```bash
pnpm dlx shadcn@latest add https://tabularui.com/r/button.json
pnpm dlx shadcn@latest add https://tabularui.com/r/all.json
```

Setup for both, the colour mode and the tooltip provider included, is in the [package README](packages/ui/README.md).

## License

[MIT](LICENSE) © Pascal Chenier
