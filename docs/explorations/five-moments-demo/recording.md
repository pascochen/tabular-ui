# Recording scene: full flow map, with recommendations (2026-11-27)

> **Approved as written by the owner, 2026-11-27** ("follow your recommendations"). [`decisions.md`](decisions.md) applies: a still ink dot, the rest frame under reduced motion, whole parts, runs of 5s or less.

Method: Full flow mapper (UX + AI library).
Task: the visitor plays the Recording moment.
System: the five-moments demo page. A run log of `RunLogRow`s, each carrying a `StatusBadge`, under the agent's proposal in a `ChatThread` above a `ChatComposer`.
Goal: the visitor finds it intuitive to see where a run stands and what it did. It succeeds when they see three things: a failed step opens its error in place without losing their spot, each step's state is legible without colour, and a decision they make is written to the record as it happens.

## Recommended decisions (approved)

| # | Decision | Recommendation | Why |
|---|---|---|---|
| R1 | First frame | The agent's proposal, waiting ("AI · Awaiting review", the same proposal as Waiting, with Edit entry), and **the run's log beneath it**: `read supplier_invoices_fy2026_h1.csv` passed, `read supplier_payments_fy2026_h1.csv` passed, `read bank_export_kjp_2026-09.csv` failed (closed), `propose reversal MFL-58821` proposed (agent rail) [assumed: names and figures]. No Run control | The site's Agent block card already puts the run log row under the proposal (`docs/site.md` D1, D2). The log is the record of a real run: the reads from Thinking, the failure from Thinking and Showing, the proposal from Waiting |
| R2 | The visitor's acts, in order | Nudge: **the failed row → Post entry → stop.** Opening the failure is `RunLogRow`'s decision. Posting makes the record grow live, which is `StatusBadge`'s | Two acts, each showing one component's decision. There's no fake Run control: the record grows because the visitor decided something (`Confirmation`'s "nothing runs until a person presses") |
| R3 | The failed row's detail | Opens in place, in mono: "Couldn't read the columns in `bank_export_kjp_2026-09.csv`: it has no header row." | Tool's failure, recorded. The same fact in Thinking, Showing and Recording, so the scenes tell one story without depending on each other |
| R4 | What Post writes | Post entry (as on the site): the label becomes "AI · Posted" and the meta "posted by you". A new row `post reversal MFL-58821` arrives **running**, and about 1s later it becomes **passed**. The check is drawn in (StatusBadge's "A pass is ticked", seen live) | The tick happens only on a change seen live (StatusBadge README), so the scene has to show the change. Under 5s (rule 3) |
| R5 | Don't post | As on the site: "AI · Not posted", "declined by you", and a **skipped** row naming the invoice: nothing reached the books | The record is written either way. Skipped is neutral, with no hue for a decision not to act |
| R6 | Where the log sits | In the thread, under the agent's turn, as on the site. The composer stays, idle (Showing R7) | One frame across all five moments |
| R7 | Summary line | None. The badges say where each step stands | Minimal. A "4 of 5 passed" line would repeat the badges, and its figures could disagree with them |
| R8 | Announcement | One live announcement when Post's row lands ("Posted. Run log updated."), held and then emptied (the failure-log rule on live regions). The failed row's opening is announced by `aria-expanded` | One change, one announcement |
| R9 | End | Once Post or Don't post has written its row: Replay (back to the first frame) and **"Start again: Asking"**, since this is the last moment | Replay, as in the other moments. The way back closes the loop through the bar |

## 1. Happy path

| # | Step | Trigger | What the visitor sees | Leads to |
|---|---|---|---|---|
| 1 | Scene opens | Picks Recording in the top bar | R1's waiting proposal and four log rows. The failed row has the danger ground and its `XCircle`. The proposed row has the agent rail. The still ink dot is beside the failed row | 2 |
| 2 | Open the failure | Clicks the failed row, or presses Enter on it | The error opens in place under the row (R3). The rows below move down, and the reader's spot stays. The dot moves to Post entry | 3 |
| 3 | Post | Clicks *Post entry* | The block's label becomes "AI · Posted", meta "posted by you", and the actions go. A new row arrives **running** | 4 |
| 4 | The record settles | Scripted, about 1s | The row becomes **passed**, and its check is drawn in. One announcement (R8) | 5 |
| 5 | Done | The row is written | Replay and "Start again: Asking" (R9). The dot stops | Replay → 1, or Asking |

Throughout: name labels on `RunLogRow` and `StatusBadge` (and `AgentBlock` on the proposal), each opening Storybook in a new tab.

## 2. Break paths

### Environment

| What goes wrong | What the visitor sees | Recovery or exit |
|---|---|---|
| Reduced motion | The running step and the drawn check | The rest frame (rule 2). The new row arrives passed, the mark swaps with no drawing (the badge already does this under reduced motion), and the `Spinner` stands still |
| Phone width | Badge, name, time and duration in a 24px row | [check] How `RunLogRow` truncates a long mono name at 375px, and that a truncated name can be read without a tooltip (none opens on touch) |
| Touch only | 24px rows | Meets WCAG 2.5.8's 24px minimum. Only the failed row is a control |
| Keyboard only | Tab order | Only an expandable row is a control, so Tab goes from the failed row to the proposal's actions. After Post, focus moves to the control that replaces the pressed one, as on the site, and is never dropped |
| Screen reader | Status changes | `aria-expanded` on the failed row. One announcement for the new row (R8). Each badge's label carries its state, so no state is colour alone |
| Grayscale or deuteranopia | Passed, failed, proposed and skipped | Each badge has its own icon (CheckCircle, XCircle, PencilSimpleLine, MinusCircle). Forbidden here: `hideIcon` in a run log (StatusBadge README) |
| Copying the log | The clipboard | An expandable row copies like a plain one, and its error comes with it (`identifier-copy.spec.ts`) |
| Deep link, reload, automated browser | — | Step 1. Under `navigator.webdriver`, the new row arrives passed |

### Input

| What goes wrong | What the visitor sees | Recovery or exit |
|---|---|---|
| Clicks a passed row | Nothing happens: a row without `detail` isn't a control, and nothing marks it as one | — |
| Posts before opening the failure | The dot skips the failure and goes to whatever is still undone (Thinking decision 4's rule) | The failure can still be opened afterwards |
| Clicks Edit entry first | The site's edit: period and memo become fields, the amount stays read-only, and Done returns to the waiting proposal | Back to step 3 |
| Clicks Don't post | R5: "Not posted", and a skipped row | Step 5 |
| Double-clicks Post | One row written. The first press removes the actions | — |
| Types in the composer | The scoped reply (Asking decision 1) | Replay clears it |

### Person

| What goes wrong | What the visitor sees | Recovery or exit |
|---|---|---|
| Does nothing | A readable record at rest: three states, one failure, one proposal | It reads on its own for a skimming visitor |
| Leaves during step 4, then returns | Asking decision 7: resumed, so the row is passed. The tick isn't seen, because it was drawn while they were away | Replay shows it |
| Expects a retry on the failed row | None, by design (`Tool`: "nothing here can re-run a call") | The error says what failed. The agent's next step is in Thinking |

## 3. Coherence check

- **It reaches the goal:** yes. The visitor opens a failure in place, reads each state by icon and label, and watches their decision get written to the record.
- **Every step leads somewhere:** yes. Step 5's "Start again: Asking" closes the loop.
- **Dead ends:** none. Passed rows aren't controls, and nothing makes them look like one.
- **Overlap with Waiting:** both scenes show the same proposal with Post entry. That's on purpose, and it's the site's own pairing (the Agent block card). In Waiting the subject is the stop. Here it's the record that follows. If it reads as repetition in the consistency audit, Recording could open with the proposal already posted, and the act becomes opening the failure only, which loses the live tick.
- **Checks before building:**
  - `RunLogRow` at 375px with a long name;
  - that the new row's running → passed change happens on a mounted badge, so the tick is drawn (a row that mounts already passed is still).
- **Data:** `docs/site.md` notes that Run log row's stories use dbt model names, not Kasane data. The demo's rows come from what the agent read. If the site's specimen moves to the same steps, the two can share the data.
