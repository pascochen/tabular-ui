# ClosePanel

The right panel of `#close`: the record, for the findings in every channel. How far the close is, each check's figure, each exception's status, and the decisions so far.

App-local (`kasane-close-demo-plan.md` §3).

## Decisions

| Decision | Why |
|---|---|
| Stores nothing | Every line is derived from the close state (`lib/close-state.ts`), so the panel can't disagree with the channel |
| A status line above the progress, "Locked 8 Oct 2026, business day 6", then "Reopened 16 Oct 2026" | There's no period switcher (pages spec, D7), so this is where the lock and the reopen show. It reads "Reopened" only once the reversal is posted: proposing one reopens nothing (`docs/agent-voice.md`, principle 3) |
| `ProgressBar` in `info` | The close is work in progress. A hue must be true of the run (ProgressBar README) |
| Checks are `MetricTile size="sm"`, two to a row, with the check's meaning as the caption | Readable without accounting knowledge: the figure, then what it counts. The figure takes no hue (§5: polarity is for deltas) |
| Each exception is a link to its message, in whichever channel holds it (`ExceptionLink`) | A list that only shows status is a dead end; this one takes you to the evidence. Under 1024px, where the panel is a dialog over the channel (`shell/PanelSheet.tsx`), following one closes the dialog |
| The channel's topic, owner and members follow the record | Every channel shows its owner (sidebar spec). Other channels' panels hold the same three, in `ChannelDetails` |
| The decision log is a plain list of time and text | `RunLogRow` sets its name in mono, for identifiers; a decision is a sentence |
| Section headings at §8.1's micro-label tier | As `AppShell`'s sidebar section labels. They're `<h3>`s under the panel's `<h2>` |
