# DemoBanner

The line under the app bar that tells a visitor where they are: a demo,
played as Kasane's Head of FP&A, on a fictional company's files. "About this
demo" opens a dialog saying what is fictional (the company), what is
scripted (the agent) and what is real (the interface), with links to the
Storybook and the designer's portfolio. "Start over" clears the run.

Journey-local, like `StageTracker`: only the public demo needs it.

## Decisions

| Decision | Why |
|---|---|
| Neutral throughout, `Badge` with no tone | Being a demo is context, not a state of the data (§0 rule 1) |
| Links use `buttonVariants` on a real `<a>` | They navigate. `Button render={<a/>}` would announce them as buttons (failure log) |
| "Built for laptop screens" below 1024px only | The dense layout still works on a phone, but it was drawn for a laptop. Saying so beats a blocked page |
| `py-1` on the band | Wrap clearance on narrow windows, where the line breaks into two rows (§7.4 fallback) |
