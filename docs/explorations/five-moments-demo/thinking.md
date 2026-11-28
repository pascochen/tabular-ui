# Thinking scene: full flow map (2026-11-27)

> **Superseded in part (2026-11-27):** see [`decisions.md`](decisions.md) for the nudge mark (a still ink dot, no pulse), reduced motion (rest frame at once), run timing (whole parts, 5s or less), and, in Waiting, Edit entry.

Method: Full flow mapper (UX + AI library).
Task: the visitor plays the Thinking moment.
System: the five-moments demo page. The scene is one `AgentBlock` turn holding `AgentReasoning`, `ToolGroup`/`Tool` and `AgentPlan`, in a `ChatThread` above a `ChatComposer`.
Goal: the visitor finds it intuitive to watch the agent work and to open what it did. It succeeds when they see three things: the working-out stays folded until they open it, an action says it's done only after it ran, and a failure says what happens next.

How each component behaves comes from its README. The site's decision lines are quoted in places. Anything marked [assumed] is not settled. What carries over from the Asking decisions is noted.

## Decisions (settled with the owner, 2026-11-27)

These replace the open items in the map below.

1. **First frame:** the question is already sent, as a user turn, and the agent's block hasn't started. The nudge is on a single Run control. Step 1's "question in the composer, Send" is replaced.
2. **Pacing:** after Run, the agent works through reasoning, reads, answer and plan on its own. The visitor's clicks open what it did.
3. **Reduced motion:** the same steps on the same timing, with nothing moving. Spinners stand still, the elapsed figures keep counting, the dot doesn't pulse, nothing slides or fades.
4. **Nudge order:** fixed, and it waits. The reasoning first, until it's opened, then the reads, then it stops. If the visitor opens the reads first, the dot goes to whatever is still unopened.
5. **Failure:** one scripted failed read (the bank export with no header row), its error and next step in view, and the summary "Read 1 of 2 files".
6. **Plan buttons:** hidden (`showActions={false}`). The plan reads as steps for a person.
7. **Stop during a read:** `Tool` gets a fourth status in the library, `stopped`: "Stopped reading …", neutral, no spinner, and the line stays where it was. Its README, stories and tests change with it.

Checks resolved from the code:

- **`ToolGroup`'s line is always a `Button`** (it always has a toggle), so focus never drops when the reads settle.
- **`AgentReasoning` opened before any text arrives** renders an empty region 8px below the line. The script starts the reasoning text on the first tick, so it's never seen empty.

## 1. Happy path

| # | Step | Trigger | What the visitor sees | Leads to |
|---|---|---|---|---|
| 1 | Scene opens | Picks Thinking in the top bar | The question "Did we pay any invoice twice?" filled in the composer with the CSV attached. The nudge is on Send. [assumed: the visitor's one act starts the agent] | 2 |
| 2 | Send | Clicks Send or presses Enter | The user turn, then an `AgentBlock` with `AgentReasoning` folded: "Thinking…" and a spinner, becoming "Thinking · 0:04" after 3s. Send becomes Stop. The nudge moves to the reasoning line, which never opens by itself | 3 |
| 3 | Open the reasoning | Clicks "Thinking…" | The working-out appears under it as it arrives. When it ends, the line becomes "Thought for 4s" | 4 |
| 4 | The agent reads | Scripted, continuing on its own [assumed] | A `ToolGroup` line under the reasoning, "Reading `supplier_invoices_fy2026_h1.csv`" with a spinner, then the second call. The second call fails, and its error and next step show in place, always visible: "Couldn't read the columns in `bank_export_kjp_2026-09.csv`: it has no header row." / "I'll take both payments as the invoice file records them." The summary settles to "Read 1 of 2 files". The nudge moves to the group line [assumed: a scripted failure, since it's the decision Tool exists for] | 5 |
| 5 | Open the reads | Clicks the group line, then a call | Each call as its own line. The successful one opens to what it read (`detail`) | 6 |
| 6 | Answer and plan | Scripted | A short answer in the block, then `AgentPlan`: the title, "Drafting step 2…" as each step arrives, then all steps. Stop goes back to Send | 7 |
| 7 | Done | The plan is ready | The whole turn settled. Replay and "Next: Showing" (carried over from Asking decision 9). The nudge stops | Replay → 1, or the next moment |

Throughout: name labels on `AgentBlock`, `AgentReasoning`, `ToolGroup` and `AgentPlan`, each linking to Storybook in a new tab (Asking decision 8).

## 2. Break paths

### Environment

| What goes wrong | What the visitor sees | Recovery or exit |
|---|---|---|
| Reduced motion is on | `ScriptedConversation`'s rule (show the finished state at once) would skip the whole moment: the in-progress states *are* Thinking | **Decision needed.** Keep the timed sequence, since a state change isn't motion, with still spinners (the components already do this) and no dot pulse. Or show the finished turn at once |
| Phone width | Tool lines with long file names wrap. The plan's steps wrap | The components wrap with the caret and spinner held to the first line (Tool README). The labels need a place that doesn't cover the lines |
| Keyboard only | The nudge moves while the visitor is somewhere else | The nudged trigger is reachable by Tab. A trigger keeps focus when it opens. [check] Whether the group line changes from text to a button when the calls settle. If it does, focus there would drop |
| Screen reader | A run makes many changes | Live regions already handle it: "Thinking" and then "Thought for 4s", each failure as it lands, and the group summary at the end, each held 7s. The plan is `aria-busy` while drafting. The nudge needs a text equivalent at each move |
| Browser tab hidden mid-run | Timers throttle, so the run stalls | It continues when the tab returns. The elapsed figures count from `startedAt`, so they stay true |
| Deep link or reload mid-run | Lands on `#thinking` | The scene opens at step 1 |
| Automated browser | Timers make captures flaky | The finished state under `navigator.webdriver` |

### Input

| What goes wrong | What the visitor sees | Recovery or exit |
|---|---|---|
| Clicks Stop mid-run | The turn stops partway through | Marked "stopped" in the block's meta line (Asking decision 6). **Gap:** `Tool` has only `running`, `done` and `failed`. A call that was running when stopped would spin forever, or claim it read the file. Needs a decision: drop the unfinished call, or give `Tool` a stopped state |
| Opens the reasoning before any text has arrived | An empty open region under "Thinking…" | [check] What `AgentReasoning` renders open with no text yet. If nothing, the first words appear a moment later in place |
| Clicks Run plan or Edit | The agent can't change anything (agent-voice, *Vague and out-of-scope requests*) | **Decision needed.** Use `showActions={false}`, as conversations do, so the plan reads as steps for a person. Or keep the buttons and script what they do |
| Edits the question before Send, or types another | The scripted run belongs to one question | Asking decisions 1–2 carry over: a loose match runs the scene, and anything else gets the scoped reply |
| Removes the file before Send | The reads have nothing to read | Asking decision 5 carries over: the agent says it has no file to read |
| Types during the run | Typing works, nothing sends (`busy`) | After the run, a follow-up gets the scoped reply |
| Scrolls up during the run | Following stops. "Scroll to latest" appears (`MessageScroller`) | Clicking it returns them to the latest |

### Person

| What goes wrong | What the visitor sees | Recovery or exit |
|---|---|---|
| Sends, then just watches | The run finishes with everything folded. They never see the reasoning or the reads | By design, the folds don't open by themselves. The nudge stays on the first unopened fold after the run ends, so the next step is still marked |
| The nudge can only point at one thing, and several things are open to click during the run | The dot jumps ahead of them | **Decision needed.** The dot follows a fixed order (reasoning, reads), or it marks only the newest thing to open |
| Leaves mid-run and returns | Asking decision 7: it resumes, and a running stream is finished on return | They find a settled turn. Replay shows it again |
| Wants to see one step again | Only the whole scene replays | Replay. Per-step replay isn't offered [assumed] |
| Skims without interacting (recruiter) | The first frame is a question and a Send button, which says little about Thinking | **Decision needed.** Open on that frame, or on a settled turn with a "Run it" nudge |
| Run length | Too short and the states blur. Too long and they wait | [assumed] About 10–12s in all, each state long enough to read (the 3s elapsed figure appears at least once) |

## 3. Coherence check

- **It reaches the goal:** yes. The visitor sees reasoning folded and opened, reads running and then done, one failure with its next step, and a plan drafting into place.
- **Every step leads somewhere:** yes, and step 7 uses Asking's end controls.
- **Dead ends:**
  - a stopped run with a call still running (gap in `Tool`);
  - Run plan and Edit, which have nothing true to do (decision);
  - opening the reasoning before its text arrives (check).
- **Missing decision points:**
  - what starts the run (step 1);
  - whether the run continues on its own after one act, or waits between stages. Steps 4 and 6 assume it continues, which is how the real agent works, and the visitor's acts are opening what it did;
  - reduced motion;
  - the nudge's order;
  - the first frame;
  - whether the failure is scripted in.
- **Tension with "it waits for them to act":** in this moment the agent acts by itself after Send. That is the honest behaviour of an agent and the point of the moment. The visitor's acts here are opening the work, not advancing it.
- **Overlap with Asking:** step 1 repeats Asking's last act (Send). It's acceptable, because the scenes are independent, but it's the reason to consider opening on a different frame.
- **The order inside the block follows `ChatThread`:** reasoning, then the tool calls above the answer, then the plan. The map matches it.
