# Showing scene: full flow map, with recommendations (2026-11-27)

> **Superseded in part (2026-11-27):** see [`decisions.md`](decisions.md) for the nudge mark (a still ink dot, no pulse), reduced motion (rest frame at once), run timing (whole parts, 5s or less), and, in Waiting, Edit entry.

Method: Full flow mapper (UX + AI library).
Task: the visitor plays the Showing moment.
System: the five-moments demo page. A settled `AgentBlock` answer holding `InlineCitation`, a `LineageTree` and `Sources` (made of `AttachmentRow`s), in a `ChatThread` above a `ChatComposer`.
Goal: the visitor finds it intuitive to check what an answer rests on, down to the entry. It succeeds when they see three things: each figure names its source in its own line, the answer lists what it read and what it didn't check, and a figure opens down to the entries behind it.

The owner asked for recommendations, not a decision-by-decision interview. Each **R** below is a recommended decision, to approve or change. Settled decisions carried over from Asking and Thinking are noted. Data marked [assumed] follows the components' own README examples (the duplicate-invoice story).

## Recommended decisions

**Approved as written by the owner, 2026-11-27.** The `AttachmentRow` flag in the coherence check stays open.

| # | Decision | Recommendation | Why |
|---|---|---|---|
| R1 | First frame | **The answer is already there, at rest.** The question as a user turn and the settled answer: "Yes. KUS paid supplier invoice MFL-58821 twice, $48,216.40 each" with citation mark 1, a folded lineage, and Sources under it. No Run | Thinking shows the work in progress. Showing is what's left once the run is over, so the scene starts where Thinking ends |
| R2 | What to click, in order | Nudge: **citation mark 1 → the lineage's caret → down to the entry → stop**. Sources gets no nudge: it's read, not clicked | Matches the moment's line: "What an answer rests on, down to the entry." Fixed order that waits, as Thinking decision 4 |
| R3 | The lineage | A three-level `LineageTree`, folded (`defaultExpanded={[]}`): the overpaid amount → the two payments (API-KUS-2607-00007, …00011) → invoice MFL-58821 in `supplier_invoices_fy2026_h1.csv` [assumed]. **No `status` on the nodes** | A green PASSED on every node would be colour without a state (§0 rule 1). `status` is optional, so leaving it off is allowed |
| R4 | Selecting a node | Selecting tints the node (`--color-bg-interactive`). It does nothing else. The nudge's last stop is the leaf entry, and selecting it ends the path | The tree's caret and name are separate intents, by design. Selection marks "the entry you reached" without inventing a destination |
| R5 | Links (file names, locator) | **No `href` in the demo.** File names and the locator render as plain, selectable text | Every link has to lead somewhere true. The demo has no file viewer, and the lineage already goes down to the entry. Cost: `AttachmentRow`'s "the name is the link" isn't shown here, though its "you can still select and copy it" is |
| R6 | What wasn't checked | Two lines: "Invoices after September: the supplier file covers H1." and "`bank_export_kjp_2026-09.csv`: it has no header row." | `notChecked` is required by the component. The second line carries Thinking's failed read into the answer, so the two scenes tell one story without depending on each other |
| R7 | The scene's frame | **Keep the composer**, idle and usable, as in the other moments. A question typed here gets the scoped reply (Asking decision 1) | One frame across the five moments, so the visitor sees only what changed between them. Revisit in the consistency audit |
| R8 | End of the scene | Once the leaf is selected: Replay (folds the tree, closes any popover, clears the selection) and "Next: Waiting". The nudge stops | Same as Asking decision 9 |

## 1. Happy path

| # | Step | Trigger | What the visitor sees | Leads to |
|---|---|---|---|---|
| 1 | Scene opens | Picks Showing in the top bar | The settled answer (R1). The lineage folded at its root. Sources below: two numbered files and two not-checked lines. The nudge is on citation mark 1 | 2 |
| 2 | Open the citation | Clicks or taps mark 1, or presses Enter or Space | A `Popover` with the figure, `supplier_invoices_fy2026_h1.csv` in mono, and the locator "API-KUS-2607-00007 and API-KUS-2607-00011". The nudge moves to the lineage's caret | 3 |
| 3 | Close it | Escape, a click outside, or the next click | The popover closes. Focus goes back to the mark (component behaviour) | 4 |
| 4 | Trace the figure | Clicks the root's caret | The payments appear, indented 12px. The nudge moves to the next caret | 5 |
| 5 | Down to the entry | Clicks the payment's caret | The invoice entry appears at the third level. The nudge is on its name | 6 |
| 6 | Select the entry | Clicks the entry's name | The node tints and is announced as current (R4) | 7 |
| 7 | Done | Selection made | Replay and "Next: Waiting" (R8). The nudge stops | Replay → 1, or the next moment |

Throughout: name labels on `InlineCitation`, `LineageTree`, `Sources` and `AttachmentRow`, each opening Storybook in a new tab (Asking decision 8).

## 2. Break paths

### Environment

| What goes wrong | What the visitor sees | Recovery or exit |
|---|---|---|
| Reduced motion is on | Popover transitions, the caret's rotation, the dot's pulse | The rule for every moment (Asking decision 10): nothing slides or fades. The caret already turns off its transition (`motion-reduce:transition-none`). [check] `Popover`'s open animation under reduced motion |
| Phone width | The popover can be up to `--w-panel` wide. The tree's mono names are long | [check] The popover stays inside 375px (Base UI collision handling). Tree names truncate in mono, and a truncated name needs a way to be read that doesn't rely on a tooltip on touch |
| Touch only | Nothing in the scene uses hover. The citation opens on a tap | No change. Tree rows are 24px, which meets WCAG 2.5.8's 24px minimum |
| Keyboard only | Tab order: the mark, then each caret and each name in the tree | Enter opens the popover and Escape returns focus to the mark. The caret and the name are separate tab stops (component behaviour) |
| Screen reader | The mark is named "Source 1: supplier_invoices_fy2026_h1.csv". The tree announces its nesting through lists | Component behaviour. The nudge needs a text equivalent at each move |
| Deep link or reload | Lands on `#showing` | The scene opens at step 1 |
| Automated browser | — | Nothing is timed here. The same frame every time |

### Input

| What goes wrong | What the visitor sees | Recovery or exit |
|---|---|---|
| Copies the answer's sentence | The clipboard may read "…$48,216.40 each1": the chip's figure joined to the amount | **[check]** `InlineCitation` isn't `select-none`. Failure log: "In anything people copy, test the clipboard." Test it, and if the figure leaks, fix the component, not the demo |
| Copies a file name or an entry id | Plain text, selectable (R5) | Works. The tree copies a node's name and meta (`identifier-copy.spec.ts`) |
| Clicks a file name in Sources | Nothing happens (no `href`, R5) | The name looks like text, not a link, so nothing invites the click |
| Opens the tree in another order, or clicks a name before its caret | The node is selected but still folded | The nudge goes to whatever is still unopened on the path (Thinking decision 4's rule) |
| Opens the popover and then clicks a caret | The popover closes, and the caret acts | Base UI closes on an outside press. One click does both |
| Types in the composer | The scoped reply (R7, Asking decision 1) | That reply appears below the answer. Replay clears it |

### Person

| What goes wrong | What the visitor sees | Recovery or exit |
|---|---|---|
| Does nothing | A complete answer, at rest | It reads on its own: the first frame already shows the mark, the tree and Sources. That's the best still frame of the five for someone skimming |
| Reads Sources and stops | They've seen "what wasn't checked", which is the trust point | Fine. The nudge stays on the next unopened item |
| Leaves and returns | Asking decision 7: it resumes, with the popover closed and the tree as they left it | — |
| Expects the citation to jump to its row in Sources | It doesn't, by design (`InlineCitation` README) | The popover names the same file and number the row has, so the pairing is visible without a jump |

## 3. Coherence check

- **It reaches the goal:** yes. The visitor opens a citation, reads Sources and what wasn't checked, and traces a figure to its entry.
- **Every step leads somewhere:** yes. Step 7 uses Asking's end controls.
- **Dead ends:** none, as long as R5 holds. If links are ever given an `href`, each one needs a destination in the scene.
- **Checks before building:**
  - the clipboard with a citation mark in a copied sentence;
  - the `Popover` animation under reduced motion;
  - the popover's width at 375px.
- **Possible orphan:** `AttachmentRow` appears both here, inside Sources, and in Asking's composer. The site lists it under Showing. Label it in both scenes, or only where its decision ("the file name is the link") can be seen, which, with R5, is neither. **Flag:** R5 means `AttachmentRow`'s own decision line is shown in no scene. If that matters, its link needs a true destination somewhere.
- **No time-based steps:** Showing is the one moment with no run. Every change is the visitor's.
