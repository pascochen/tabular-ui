<picture>
  <source media="(prefers-color-scheme: dark)" srcset="brand/tabular-wordmark-dark.svg">
  <img alt="Tabular" src="brand/tabular-wordmark.svg" width="153" height="26">
</picture>

Dense React components and design tokens for finance and operations data tools: tables, run logs, metric tiles, lineage, and the agent-authored blocks, plans and chat around them.

18 foundational components on Base UI, 32 product components, and one OKLCH token layer for Tailwind CSS v4. Dark-first, five hues, colour only for state.

**[Storybook](https://storybook.tabularui.com)** · **[Demo](https://demo.tabularui.com)**

## Install

Tabular UI installs as source: the shadcn registry copies components into your app, one or all of them.

```bash
pnpm dlx shadcn@latest add https://tabularui.com/r/button.json
pnpm dlx shadcn@latest add https://tabularui.com/r/all.json
```

Setup, the tokens, the colour mode and the tooltip provider included, is in the [package README](packages/ui/README.md). There are no npm releases: the registry is rebuilt from `main` on every deploy.

## License

[MIT](LICENSE) © Pascal Chenier
