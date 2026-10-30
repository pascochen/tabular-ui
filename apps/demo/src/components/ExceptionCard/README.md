# ExceptionCard

One close exception, as the agent posted it in `#sep-close`: its title and status, one sentence with the figure and its meaning, numbered citations, and its sources behind a disclosure. Replies follow inline.

App-local, as the plan puts it (`kasane-close-demo-plan.md` §3). It composes `ChannelMessage`, `StatusBadge`, `Sources` and `InlineCitation`, and moves into Tabular UI when a second screen needs it.

## Decisions

| Decision | Why |
|---|---|
| A message by the agent, so `authorship` is set | `ChannelMessage` then puts the body in an `AgentBlock`: the agent found these exceptions, and the rail and label say so (§5) |
| Status is a `StatusBadge`: `needs-review` labelled "Open", `passed` labelled "Resolved" | §5's mapping, in its one place. The icon and the word carry the state in grayscale too |
| The title is an `<h2>` with the exception's id | Under the page's `<h1>`, with no level skipped. The close panel's exception list links to it |
| Citations stay on the line of the sentence's last word | Wrapped onto a line of their own, the marks read as citing nothing |
| Sources fold behind the replies' disclosure recipe | Two disclosures in one message read alike. Folded, six cards stay scannable |
| `Sources` with the exception's `notChecked` | `docs/agent-voice.md` principle 4. The lines are authored in `close-demo.json`, and `[]` says every part was checked |
| The thread opens by itself when a teammate replies in it after landing | So the reply is read, not just counted (`docs/reviews/demo-first-pass-2026-10-30.md`, issue 3). It's derived, not synced: the visitor's own open or close wins from then on |
