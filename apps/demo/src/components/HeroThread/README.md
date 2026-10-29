# HeroThread

The visitor's one decision, in the Revenue cut-off thread (`kasane-close-demo-plan.md` §2, 0:20 to 2:10). After Daisuke's reply, the thread holds, in order:

1. **The question** (`Question`, in an `AgentBlock` labelled "AI · Awaiting your answer"): reopen September or keep it locked, with the line it rests on. The policy says revenue belongs to the month of delivery, and it doesn't say whether a locked month is reopened.
2. **The proposal**, once answered (`AgentBlock` labelled "AI · Awaiting confirmation"):
   - a `Tool` line, "Reading the delivery note…" then "Read…"
   - the reason
   - for a reopen, the reversal's five lines in a `DataTable`
   - a `Confirmation` saying what changes and who it reaches
3. **The rerun**, after a reopen is posted: the revenue cut-off check posting as "System", a `RunLogRow` from running to passed, and the check's new figure, ¥0.

The state lives in `lib/close-state.ts` (`hero.rounds`), and the agent's timed steps in `lib/hero-script.ts`. `App` runs those, so a step still lands while the visitor is in another view. `Announcer.tsx` says each change in a live region in the top nav.

## What each answer does

| Answer | Then | Resolves | The cut-off tile |
|---|---|---|---|
| Reopen September | Proposal with the reversal; posting reruns the check (2s) | After the rerun | ¥0, "Tied out" |
| Keep September locked | Proposal to list it for the auditors; no entry, no rerun | On posting | ¥42.7m, "Listed for the auditors' review" |
| Choose for me | As Reopen, with "Chosen by AI" and the reason (`close-demo.json`, `hero.delegate`) | As Reopen | As Reopen |
| Skip | Nothing; it stays open | — | Unchanged |
| "Don't post it" on a proposal | The agent asks again, in a new round | — | Unchanged |

`apps/storybook/tests/close-state.spec.ts` checks each row.

## Decisions

| Decision | Why |
|---|---|
| Nothing is resolved until it ran | A reopen resolves after the check reruns, not when it's posted: "Done" only once the action ran (`docs/agent-voice.md`, principle 3) |
| A stop asks again rather than ending | The decision is the demo. One decline shouldn't strand the visitor |
| Skip is final until Replay | Skip is a real answer, and Question answers once. Replay arrives in Phase 6 |
| The rerun posts as "System" with a neutral badge | A deterministic check, not the agent (`docs/agent-voice.md`, rule 1) |
| The rerun row has no timestamp | The reply's header already gives the time |
| Fixed widths for the code and figure columns | The account names never truncate at the thread's width |
