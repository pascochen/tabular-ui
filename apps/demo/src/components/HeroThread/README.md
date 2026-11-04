# HeroThread

The visitor's one decision, in the Revenue cut-off thread (`kasane-close-demo-plan.md` §2, 0:20 to 2:10). After Shun's reply, the thread holds, in order:

1. **The question** (`Question`, in an `AgentBlock` labelled "Cut-off AI · Awaiting your answer"): reopen September or keep it locked, with the line it rests on. The policy says revenue belongs to the month of delivery, and it doesn't say whether a locked month is reopened.
2. **The proposal**, once answered (`AgentBlock` labelled "Cut-off AI · Awaiting confirmation"):
   - a `Tool` line, "Reading the delivery date on…" then "Read…". It reads the invoice's delivery date, because the material holds no delivery note, and the finding's "not checked" list says so
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
| Choose for me | As Reopen, with "Chosen by Cut-off AI" and the reason, which says the choice is the agent's and not the policy's (`close-demo.json`, `hero.delegate`) | As Reopen | As Reopen |
| Skip | Nothing; it stays open, and the run ends at 2 of 4 | — | Unchanged |
| "Don't post it" on a proposal | The agent asks again, in a new round | — | Unchanged |

`apps/storybook/tests/close-state.spec.ts` checks each row.

## Decisions

| Decision | Why |
|---|---|
| Nothing is resolved until it ran | A reopen resolves after the check reruns, not when it's posted: "Done" only once the action ran (`docs/agent-voice.md`, principle 3) |
| A stop asks again rather than ending | The decision is the demo. One decline shouldn't strand the visitor |
| Skip is final until Start over | Skip is a real answer, and Question answers once. Start over is at the foot of the sidebar |
| The rerun posts as "System" with a neutral badge | A deterministic check, not the agent (`docs/agent-voice.md`, rule 1) |
| The rerun row has no timestamp | The reply's header already gives the time |
| On a phone, the channel opens scrolled to the whole decision | At 375×812 the second answer lands under the composer, and testers missed these answers. It scrolls by the least that clears it, once on opening, and never a page already scrolled (`lib/decision-in-view.ts`). The cost: the top of the Revenue cut-off card is off screen on landing |
| No decision scroll while a pinned sidebar squeezes main | At 135px the question runs thousands of pixels tall, and a scroll measured there left the page at the channel's foot when the sidebar collapsed. On that path the page stays at its top, as it did before the scroll |
| The channel lands a link to an exception itself | The browser looks for the fragment before React has rendered the message, so a link opened fresh stayed at the top of the channel, at any width (`useExceptionLink`) |
| Nothing in the entry's table truncates | A cut cell has no way to read the rest. The account name wraps, and each figure holds its width. Fixed widths for the code and figures give the name the rest of the row: 166px at 1280, with no name over two lines. At 375 the table scrolls inside its card, 306px in 213px |
