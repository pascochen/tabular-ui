# DemoBanner

The line in the top nav that tells a visitor where they are: a demo, played
as Kasane's Head of FP&A, in a channel whose people and agent are scripted.
"About this demo" opens a dialog saying what is fictional (the company), what
is scripted (the people and the agent) and what is real (the interface), with
links to the Storybook and the designer's portfolio. It sits inside `AppBar`,
not above the shell, so `AppShell` keeps the full viewport height. The line
truncates, with its full text in a tooltip.

Beside the line: **Skip to the end** (disabled at the end, not hidden, so the bar doesn't shift under the pointer) and **Replay**, which start over from landing from any point.

App-local: only the public demo needs it.

## Decisions

| Decision | Why |
|---|---|
| Neutral throughout, `Badge` with no tone | Being a demo is context, not a state of the data (§0 rule 1) |
| Links use `buttonVariants` on a real `<a>` | They navigate. `Button render={<a/>}` would announce them as buttons (failure log) |
