# TruncatedText

Product. Composes `Tooltip`.

One line of text that truncates with an ellipsis and shows the full text in a tooltip, **only when it is actually cut off**. `CLAUDE.md` makes `Tooltip` non-optional for truncated text: a clipped name, model or title can't be read otherwise. And repeating a label that already fits is noise.

```tsx
<TruncatedText>{org.name}</TruncatedText>
<TruncatedText side="inline-end" className="font-mono text-xs">{model}</TruncatedText>
```

Used by `ContextSwitcher` (trigger and menu rows) and `AppShellPageHeader` (the page title).

## Props

| Prop | Type | Default | Notes |
|---|---|---|---|
| `children` | `string` | — | The text. A string because the tooltip repeats it; rich content would render twice and drift |
| `side` | `Tooltip` side | `top` | Pick the side that covers nothing the user is scanning (see below) |
| `sideOffset` | `number` | `4` | px. Raise it when the tooltip anchors to text inset inside a larger box, as `ContextSwitcher`'s rows do |
| `showOnControlFocus` | `boolean` | `false` | Also open while the control the text sits in has **keyboard** focus. For a label inside a `Button`: the text never takes focus itself, so without it a keyboard user never sees what was cut off. Escape closes it. Used by `ChatStarter` |
| `className` | `string` | — | Type, colour, flex sizing. The component brings only `min-w-0 truncate` |

## Mechanisms worth knowing

**Measured, not guessed.** It compares `scrollWidth` with `clientWidth` after layout, again whenever the box resizes (`ResizeObserver`: a sidebar collapsing, a panel opening), and again when the text changes. A tooltip that guessed from a character count would fire on wide glyphs and miss narrow ones.

**The full text stays in the DOM.** Assistive technology reads it whole from the `<span>`. Base UI's tooltip is visual only, with no `role` and no `aria-describedby` (see `Tooltip/README.md`), so the tooltip must never hold anything the DOM doesn't already have. Here it can't: it repeats `children`.

**Never interactive.** `disableHoverablePopup` plus `pointer-events-none`. There is nothing in the tooltip to reach, and a hoverable popup sitting over a list would catch the pointer and keep the row beneath it from highlighting.

**It needs a bounded parent.** Inside a flex row, the span carries `min-w-0` so it can shrink below its text width. The row itself still needs a width limit, or nothing ever truncates. A parent with `shrink-0` (as `Button` has) needs `shrink` back, which is the `OrgSwitcher` entry in the failure log.

**It is its own element because a flex container can't show an ellipsis.** `text-overflow` applies to block containers only. Put `truncate` on a `display: flex` heading and it clips with no "…" (failure log). Keep the flex on the parent for centring and let this span truncate.

**Choosing a side.** Open the tooltip where it covers nothing the user is reading. Beside a menu, `inline-end` covers no neighbouring row. On a trigger whose inline-end is a caret or a toggle, use `bottom`. On the current row of a menu whose submenu opens inline-end, use `top`. For a page title in a band, `bottom` keeps it off the top nav.
