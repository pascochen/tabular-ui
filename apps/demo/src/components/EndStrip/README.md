# EndStrip

Where the scripted run ends, after the last teammate's reply: how many exceptions are resolved, what's still open and why, then Replay, the open items, or the components in Storybook.

App-local. Neutral, and not an `AgentBlock`, because the demo says this, not the agent. It's a `section` named "End of the demo", so it can be found from the landmarks list.

## Decisions

| Decision | Why |
|---|---|
| The sentence is derived from the state, not authored | After a Skip on the question, the cut-off is still open too. A line written ahead of time would be false |
| Links to Storybook, as the About dialog does | tabularui.com's component pages cover its 15 components, and none of the close demo's. The plan's open decision 4 is the owner's |
| Replay is a `Button`, the links are `<a>` with `buttonVariants` | Replay acts on the page. The others navigate (failure log, `AppBar`) |
