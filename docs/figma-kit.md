# The Figma kit

A Figma file that documents the foundations and the 18 foundational components, laid out like Figma's UI3 community kit. Built 2026-11-17 and 2026-11-18.

File: https://www.figma.com/design/z8Zq3RqzEQ0vcDrZgfRaHx

**Code is the source and Figma follows it.** Nothing in the kit changes a token, a component or a doc here. Where the kit and the code disagree, the code is right and the kit is out of date.

## What it holds

- **Pages:** Cover, Overview, Typography, Color, Elevation, Grid, Icons, Cursors, one page per foundational component, and ❖ Document Components (the kit's own labels, redlines and frames). No product components.
- **Variables:** three collections.
  - `Primitives`: the seven ramps from `docs/palette.json`, plus one primitive per tint (`ivy/500-a8` is `ivy-500` at 8%), a few multiples of `--spacing`, and `transparent`.
  - `Semantic`: every `--color-*` role, in modes Dark then Light, each an alias of a primitive. Named as the CSS names it: `--color-text-danger` is `color/text/danger`.
  - `Size`: every `--pad-*`, `--gap-*`, `--h-*`, `--radius-*`, `--border-width*`, `--ring-*`, `--size-icon-*` and `--w-*`. `--pad-cell-x` is `pad/cell-x`.
  - Each variable's web code syntax is its `var(--…)` name.
- **Styles:** one text style per §8.1 step and weight in use, and `shadow/overlay`.
- **Components:** named as the code names them, with the code's prop names and values as properties (`variant=ghost`, `size=sm`). Compound components publish their parts (`Menu/Item`, `Select/Trigger`, `Tabs/Tab`).

Each component page has the component set on the left and a 1280px guidelines frame on the right. Every section shows its specimens in a Light and a Dark context, and each page ends with a Do and a Don't taken from a rule in the component's README or in `docs/design-system.md`.

## Keeping it in step

When a token changes:

1. Run `node packages/ui/scripts/export-figma-tokens.mjs tokens.json`. It reads `theme.css` and `docs/palette.json` and writes the variable set: primitives, tints, the alias of each role in each mode, and the numbers. It fails on any colour that is not a palette step.
2. Update the variables in the file from that JSON. Components are bound to variables, so they follow.

When a component changes, measure it in Storybook (computed height, padding, gap, border, type) and rebuild its variants from those numbers. States come from the tokens, not from measurement: hover and press are an overlay fill over the ground, focus is the 2px ring 1px clear of the control, disabled is 50% opacity.

## What Figma does not carry

- **Tabular figures.** They cannot be set by script. Switch them on by hand, under Type details, on each Golos Text and Source Serif 4 text style.
- **The patched digits.** `figures.css` gives Golos Text's tabular digits one width (§8.3). Figma draws the unpatched widths, so a figure column can drift by a pixel or two.
- **Heights that grow with the text.** A control height here is the px inside its `max()` (§7.6).
- **Motion and blur.** The spinner's lap, a popup's slide, Combobox's fading edge and the dialog scrim's blur.
- **Names with a dot.** Figma refuses a dot in a variable name, so `spacing/1.5` is `spacing/1_5`.
- **A few CSS-order cases.** A popup row that is both highlighted and selected, and a checkbox that is both checked and invalid, are left out.

## Things that cost time once

- `controlBase` clips a control's ground to its padding box, so a fill sits 1px inside the border. The kit draws it as a `ground` layer inset 1px.
- A stroke that takes its 1px in layout and draws nothing (`border-transparent`) is bound to the `transparent` primitive. A paint's own opacity does not reach instances, and a hidden paint drops out of layout.
- Setting an instance-swap property to its own default resets the nested icon and loses its colour. Pass it only for a real swap.
- A disabled control draws its icon at the light weight, and `IconButton` at `lg` draws regular. Those variants hold their own icon and are not wired to the swap property.
