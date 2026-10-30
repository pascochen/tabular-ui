# EndStrip

Where the scripted run ends, after the last teammate's reply: how many exceptions are resolved, what's still open and why, then Replay, the open items, or the AI components on tabularui.com.

App-local. Neutral, and not an `AgentBlock`, because the demo says this, not the agent. It's a `section` named "End of the demo", so it can be found from the landmarks list.

## Decisions

| Decision | Why |
|---|---|
| The sentence is derived from the state, not authored | After a Skip on the question, the cut-off is still open too. A line written ahead of time would be false |
| "Browse the AI components" goes to tabularui.com's Chat starter page | The owner's decision (2026-10-30, the plan's open decision 4): the site's component pages, starting where an agent run starts. The About dialog has the same link, and Storybook beside it. Both URLs live in `lib/links.ts` |
| Replay is a `Button`, the links are `<a>` with `buttonVariants` | Replay acts on the page. The others navigate (failure log, `AppBar`) |
