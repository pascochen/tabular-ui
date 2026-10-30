# ClosePanel

The right panel of `#sep-close`: the record. How far the close is, each check's figure, each exception's status, and the decisions so far.

App-local (`kasane-close-demo-plan.md` §3).

## Decisions

| Decision | Why |
|---|---|
| Stores nothing | Every line is derived from the close state (`lib/close-state.ts`), so the panel can't disagree with the channel |
| `ProgressBar` in `info` | The close is work in progress. A hue must be true of the run (ProgressBar README) |
| Checks are `MetricTile size="sm"`, two to a row, with the check's meaning as the caption | Readable without accounting knowledge: the figure, then what it counts. The figure takes no hue (§5: polarity is for deltas) |
| Each exception is a link to its message | A list that only shows status is a dead end; this one takes you to the evidence |
| The decision log is a plain list of time and text | `RunLogRow` sets its name in mono, for identifiers; a decision is a sentence |
| Section headings at §8.1's micro-label tier | As `AppShell`'s sidebar section labels. They're `<h3>`s under the panel's `<h2>` |
