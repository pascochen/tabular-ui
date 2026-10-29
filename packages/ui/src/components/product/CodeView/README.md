# CodeView

Product. SQL and dbt models.

```tsx
<CodeView language="sql" showLineNumbers highlightLines={[10]}>{model}</CodeView>
```

## Deliberately not syntax-highlighted

This is a design decision, not a missing feature.

A highlighter assigns hues to keywords, strings and numbers — which is **decoration, not state**, and §0 rule 1 forbids exactly that. Worse, it would spend all five hues on syntax, after which a hue means nothing anywhere else in the product. The five are the whole budget.

Legibility comes from `--font-mono`, the size step, the slashed zero (`"zero" 1`, §8.7) and the optional gutter instead.

**`highlightLines` is the one exception, and it is state**: the line an error points at takes a `--color-bg-danger` ground. That is a fact about the run, not about the grammar.

If highlighting is ever added, it needs a palette designed against rule 1 — not a default theme adopted wholesale.

## Type

§8.3 — mono runs one step below the adjacent sans, because it reads visually larger at equal px. In a `--text-base` context that is `--text-sm`.

The gutter is `sticky left-0` so line numbers stay pinned while long lines scroll horizontally, and `aria-hidden`, since line numbers are not content.

## Keyboard

When a long line overflows, the view becomes a focusable region (`tabIndex={0}`, `role="region"`), so a keyboard user can Tab to it and scroll with the arrow keys (WCAG 2.1.1). Its name defaults to the language ("SQL code"); pass `label` to say what the code is. A snippet that fits gets no tab stop. Overflow is measured with a `ResizeObserver`, so resizing the container adds or removes the stop. Until the first measure, the view is a focusable region: on a server-rendered or prerendered page the HTML arrives before React can measure, and a long line must be reachable by keyboard from the start. A snippet that fits loses its stop as soon as the component has hydrated.
