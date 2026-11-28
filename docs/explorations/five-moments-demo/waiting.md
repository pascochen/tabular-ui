# Waiting scene: full flow map, with recommendations (2026-11-27)

> **Superseded in part (2026-11-27):** see [`decisions.md`](decisions.md) for the nudge mark (a still ink dot, no pulse), reduced motion (rest frame at once), run timing (whole parts, 5s or less), and, in Waiting, Edit entry.

Method: Full flow mapper (UX + AI library).
Task: the visitor plays the Waiting moment.
System: the five-moments demo page. Agent turns in a `ChatThread` above a `ChatComposer`, using the three ways an agent stops for a person: `Question` (a fact or a choice), an `AgentBlock` proposal (a change to the books, to review), and `Confirmation` (permission for one action outside the conversation).
Goal: the visitor finds it intuitive that the run stops until they decide. It succeeds when they see three things: each kind of wait asks for exactly what it needs, nothing runs until a person presses, and every decision is recorded with who made it.

Recommendations (**R**) to approve or change. Settled decisions from Asking, Thinking and Showing carry over. The data follows the components' own stories (the duplicate KUS invoice) [assumed].

## Recommended decisions

**Approved as written by the owner, 2026-11-27.** The three flags in the coherence check stay open.

| # | Decision | Recommendation | Why |
|---|---|---|---|
| R1 | Which waits | **All three, in the order an agent meets them:** Question → proposal → Confirmation | The site puts all three in Waiting. Each is a different kind of stop, and the difference is what the visitor should leave with |
| R2 | First frame | The question already sent. The agent's turn says the duplicate was found and asks `Question`'s Described story: "September is locked. Where should the correction go?", with *Reopen September* and *Keep September locked*, each with its consequence line, plus Skip and Choose for me. Label: "AI · Awaiting your answer" | The scene opens on a stop, which is the moment itself. No Run, because the run is already paused |
| R3 | Where the nudge goes | **On the question as a whole, never on one option.** Then on the proposal's actions, then on the confirmation's | A dot on one option would choose for the visitor. The nudge says "the agent is waiting on you", not "pick this" |
| R4 | Branches | The answer changes what follows, honestly. **Reopen** or **Choose for me** (the agent picks Reopen and says why) → a proposal to post the reversal. **Keep locked** or **Skip** (the agent keeps it locked, posts nothing, and says so) → no proposal. Both paths end at the Confirmation | A proposal that posts after "Keep September locked" would ignore the visitor's answer. Two paths, one end |
| R5 | The resume between waits | After each answer, the next agent turn shows "Working…" for about 1s, then the next wait | The visitor sees the run stop, then resume because they answered. Under reduced motion, the same timing with a still spinner (Asking decision 10) |
| R6 | The proposal | `AgentBlock` "AI · Awaiting review", meta "proposed 14:22", holding the reversal as a two-line entry in a `DataTable` (debit and credit, $48,216.40, balanced, so the totals rule draws), with **Don't post** and **Post entry**. **No Edit entry** in the demo | Editing an entry is a form of its own. A button that leads nowhere would be a dead end. Flagged below, because "open to edit" is what makes it a proposal and not a Confirmation |
| R7 | The confirmation | "Send a recovery request to the supplier?", What changes: "Nothing in the books. One email goes out.", Who it reaches: "MFL's accounts team, by email. No one else." Buttons: **Don't send**, **Send request** | `changes` and `reaches` are required. The buttons name what happens, never "Confirm" |
| R8 | Outcomes and labels | Each wait's controls are replaced by its outcome, and the block's label changes: "Answered by you: Reopen September." / "Posted once, by you." / "Sent once, by you. The next send asks again." With the "Not posted" and "Not sent" forms for stopping | The record of who decided is the trust point. These are the components' own copy forms |
| R9 | Honesty about the demo | Show Confirmation and the proposal, though the library's agent "changes nothing" today and no conversation shows them yet | The demo shows the component library, and those components' stories already document them for when the agent can act. Nothing leaves the page |
| R10 | Typing instead of answering | The composer stays live (Showing R7). A message sent while a wait is open gets the scoped reply, and the wait stays open | The visitor can't answer a structured question in free text by accident and lose the wait |
| R11 | End | Once the Confirmation is decided: Replay (back to the Question, so the other branch can be tried) and "Next: Recording" | As in Asking decision 9. Replay is how a visitor tries the other path |

## 1. Happy path (the Reopen branch)

| # | Step | Trigger | What the visitor sees | Leads to |
|---|---|---|---|---|
| 1 | Scene opens | Picks Waiting in the top bar | R2's waiting Question. The nudge on the question as a whole | 2 |
| 2 | Answer | Clicks *Reopen September* | Every control locks. "Answered by you: Reopen September." replaces them, and focus moves to it. The label leaves "Awaiting your answer" | 3 |
| 3 | The run resumes | Scripted, about 1s (R5) | A new agent turn: "Working…", then the proposal (R6), labelled "AI · Awaiting review". The nudge moves to its actions | 4 |
| 4 | Post | Clicks *Post entry* | The actions lock, then "Posted once, by you." The label becomes "AI · Posted" | 5 |
| 5 | The run resumes | Scripted, about 1s | A new turn with the Confirmation (R7), labelled "AI · Awaiting confirmation". The nudge moves to it | 6 |
| 6 | Send | Clicks *Send request* | "Sent once, by you. The next send asks again." The label becomes "AI · Sent" | 7 |
| 7 | Done | Last wait decided | Replay and "Next: Recording". The nudge stops | Replay → 1, or the next moment |

**The Keep-locked branch:** step 2 with *Keep September locked*, or Skip → the agent's turn says it posts nothing and lists the amount for review → straight to step 5. **Choose for me:** "I chose Reopen September: …" (its reason), then step 3.

Throughout: name labels on `Question`, `AgentBlock` and `Confirmation` (and `DataTable` inside the proposal), each opening Storybook in a new tab.

## 2. Break paths

### Environment

| What goes wrong | What the visitor sees | Recovery or exit |
|---|---|---|
| Reduced motion | The 1s "Working…" between waits | The same timing, with a still spinner. Nothing slides in. The new turn appears in place |
| Phone width | The described options at about 215px of thread | Built in: under 320px each consequence line goes under its button (`DescribedNarrow`). The proposal's `DataTable` needs a check at 375px [check] |
| Keyboard only | After a press, focus moves to the outcome. Then a new turn appears below | The next wait is the next Tab stop after the outcome. [check] That a keyboard user isn't left above a wait they can't see: the thread scrolls the new turn into view, as `MessageScroller` does for new turns |
| Screen reader | A new turn in the log | The thread is `role="log"`, so the new turn is announced. Each outcome takes focus, so the decision is read back |
| Deep link or reload | Lands on `#waiting` | Step 1 |
| Automated browser | The 1s resumes | Under `navigator.webdriver`, each resume is instant |

### Input

| What goes wrong | What the visitor sees | Recovery or exit |
|---|---|---|
| Double-clicks an option or a button | Nothing more happens | Built in: the first press locks every control (`focusableWhenDisabled`) |
| Types an answer in the composer instead | The scoped reply. The wait stays open | R10 |
| Clicks Skip | "Skipped by you. I'll keep September locked and list the amount for review." → the no-proposal path | R4 |
| Clicks Choose for me | The agent's choice and its reason, then the proposal | R4 |
| Clicks Don't post | "Not posted. The entry stays here." The label "AI · Not posted". The run still reaches the Confirmation: the recovery request doesn't depend on the posting ([`decisions.md`](decisions.md), check 6, approved) | Step 5 |
| Clicks Don't send | "Not sent. The request stays here." The label "AI · Not sent" | Step 7 |

### Person

| What goes wrong | What the visitor sees | Recovery or exit |
|---|---|---|
| Does nothing | The run waits, indefinitely | By design: "No countdown or auto-run." The nudge keeps marking the wait |
| Wants to try the other branch | — | Replay (R11) |
| Expects "Always allow" | Not offered | By design: each permission covers one run, and the outcome says so ("The next send asks again.") |
| Leaves mid-resume and returns | Asking decision 7: resumed, the "Working…" finished | The next wait is there |
| Skims without interacting | A paused agent with a clear question and two consequences | It reads on its own: "Awaiting your answer" is in the label |

## 3. Coherence check

- **It reaches the goal:** yes, on both branches. Every path ends at step 7, and every decision leaves an outcome naming who made it.
- **Dead ends:** none, as long as Edit entry stays out (R6).
- **Flags:**
  1. **Edit entry (R6).** Leaving it out means the proposal and the Confirmation differ only in their buttons. Yet "open to edit" is what the library says separates them. If that difference matters to the visitor, Edit entry needs a minimal real edit (the rebooking date, say), and that's a new piece to design.
  2. **The nudge mark.** In this scene the agent really is waiting on the viewer, which is what `StatusDot`'s solid ochre already means (§5). If the demo's nudge also uses that mark, demo guidance and product state become the same signal. Decide the nudge mark (the interview's open item 2) before building. Waiting is where it matters most.
  3. **What the demo claims (R9).** The demo shows the agent posting and sending, which the library's conversations don't do yet. If the site's copy says the agent only reads, the two disagree. Check `docs/site.md` before building.
- **Checks before building:**
  - the `DataTable` entry at 375px;
  - the keyboard path after each new turn;
  - whether Don't post should still lead to the recovery request (yes: [`decisions.md`](decisions.md), check 6).
