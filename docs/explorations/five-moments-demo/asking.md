# Asking scene: full flow map (2026-11-27)

> **Superseded in part (2026-11-27):** see [`decisions.md`](decisions.md) for the nudge mark (a still ink dot, no pulse), reduced motion (rest frame at once), run timing (whole parts, 5s or less), and, in Waiting, Edit entry.

Method: Full flow mapper (UX + AI library).
Task: the visitor plays the Asking moment.
System: the five-moments demo page (replaces `apps/demo`). The scene is built from `ChatStarter`, `ChatComposer` (with `AttachmentRow`) and `ChatThread` (whose answer is an `AgentBlock`).
Goal: the visitor finds the asking interaction intuitive, smooth and minimal, and can reach each component in Storybook.

How each component behaves comes from its README. Anything marked [assumed] is not.

## Decisions (settled with the owner, 2026-11-27)

These replace the open items in the map below.

1. **A visitor's own question:** they can type and send anything. Off-script text gets an honest scoped reply ("This demo answers the three suggested questions"), and the nudge returns to the first suggestion.
2. **An edited pick:** loose match. If the sent text still contains the picked question (case, spaces and end punctuation ignored), it gets the scripted answer. Anything else gets the scoped reply.
3. **Live suggestions:** all three, each with its own short scripted answer.
4. **The file at the start:** already uploaded, with no badge. The scene opens still, and the nudge goes straight to a suggestion. Step 2 below is cut.
5. **The paperclip and remove:** remove works. The paperclip re-attaches the sample CSV without the OS picker, showing RUNNING with progress, then clearing. Sent with no file, the agent says it has no file to read.
6. **Stop:** the partial answer stays, with "stopped" in the `AgentBlock`'s meta line, so `ChatThread` doesn't change. Replay appears.
7. **Leaving and returning:** the scene resumes where it was. A stream that was running is finished on return. A page reload starts fresh.
8. **Storybook links:** open in a new tab, with ↗ on the label.
9. **End of the scene:** Replay (back to step 1) and "Next: Thinking". The nudge stops. The composer stays live, so a follow-up gets the scoped reply.
10. **Reduced motion (aligned with Thinking, 2026-11-27):** the scene keeps its timed steps, because text arriving isn't motion. Spinners stand still, timers keep counting, and the dot doesn't pulse. Nothing slides or fades. This applies to every moment. Only `navigator.webdriver` jumps to the finished state.

Still assumed, not decided: after a few pulses, the dot stops and stays as a still mark.

## 1. Happy path

| # | Step | Trigger | What the visitor sees | Leads to |
|---|---|---|---|---|
| 1 | Scene opens | Visitor picks Asking in the top bar, or lands on the page [assumed: Asking is the default] | `ChatStarter` (one line and three suggested questions) above an empty `ChatComposer` with one CSV attached and its badge reading RUNNING (as in wireframe A) | 2 |
| 2 | File finishes | The upload completes on its own after a moment [assumed] | The badge drops, as `ChatComposer` requires once a file has uploaded. The nudge dot appears on the first suggestion | 3 |
| 3 | Pick a question | Visitor clicks a suggestion | The question fills the composer and is **not sent** (`ChatStarter` rule). The starter hides while there's a draft. The nudge moves to Send | 4 |
| 4 | Send | Visitor clicks Send or presses Enter | The question appears right-aligned with the file above it. An assistant turn opens with "Working…" and a `Spinner`. Send becomes Stop | 5 |
| 5 | Answer streams | Scripted, on a timer [assumed: about 2–4 s] | The answer grows inside the `AgentBlock` (orchid rail, "AI" label). Stop goes back to Send | 6 |
| 6 | Done | The answer completes | The thread holds the question and the answer. An end control [open: replay, reset, or "Next: Thinking"] | Replay → 1, or the next moment |

Throughout: each component carries a name label linking to its Storybook page [open: always shown or on demand].

## 2. Break paths

### Environment

| What goes wrong | What the visitor sees | Recovery or exit |
|---|---|---|
| Reduced motion is on | Without a fallback, a pulsing dot and a streaming answer | The dot holds still and stays visible. The answer streams on its usual timing with nothing moving: no pulse, slide or fade (decision 10). The nudge needs a second cue beside the colour (shape or a short label), since colour is never used alone |
| Phone width (375px) | Labels and the scene compete for room. Truncated suggestions have no tooltip on touch | The scene stacks at full width, labels move below or into a list, and suggestions get a width where the whole question fits |
| Touch only | Labels or hints that show on hover never show | Nothing essential on hover. Labels can be tapped |
| Keyboard only | The visitor can't see what the dot points at | The nudged control is the next Tab stop. Enter sends. Focus returns to the field after Send or Stop (component behaviour) |
| Screen reader | The dot is visual only | The nudge has a text equivalent ("Next: pick a question"). The thread's `aria-busy` announces the finished turn, not every step |
| Browser tab hidden mid-stream | Timers are throttled, so the stream stalls | The answer finishes when the tab returns. Nothing is lost |
| Deep link or reload | Lands on `/…#asking` or reloads mid-stream | The scene opens at step 1. Test the link loaded from another URL (failure log) |
| Automated browser (screenshots, tests) | Timers make captures flaky | Show the finished state at once under `navigator.webdriver`, as `ScriptedConversation` does |

### Input

| What goes wrong | What the visitor sees | Recovery or exit |
|---|---|---|
| Types their own question instead of picking one | A scripted scene has no answer for it | **Decision needed.** Either the agent replies that the demo answers only the suggested questions (honest, and it shows out-of-scope handling), or the field is read-only until a pick (prevents the error, but a field you can't type in feels broken) |
| Edits a picked question before sending (adds a period, a name) | The scripted answer may no longer match | **Decision needed.** Answer the question that was picked, or treat any edit as typed text (row above) |
| Picks a second or third suggestion | If only one answer is scripted, the other two are dead ends | Script an answer for each suggestion, or show only one suggestion as live [decision] |
| Clears the draft | The starter comes back (component behaviour) | Back to step 3 |
| Sends blank text | Prevented: Send stays disabled until there's text | — |
| Clicks Send while the file is still RUNNING | Prevented: nothing sends while a file is queued or running. The visitor may not know why | The nudge never points at Send before the file is done. The badge says why |
| Removes the attached file | The answer was written from that file | **Decision needed.** Hide remove in this scene, or let it go and the answer says there's no file to read |
| Clicks the paperclip | The OS file picker opens on a demo page, which is surprising | **Decision needed.** Paperclip inert with a tooltip, hidden, or it attaches a sample file |
| Double-clicks a suggestion or Send | Could send twice | Send acts once. A second click while busy does nothing |

### Person

| What goes wrong | What the visitor sees | Recovery or exit |
|---|---|---|
| Does nothing | The scene waits, by design | The dot keeps nudging. [assumed] It stops pulsing after a few cycles and stays as a still mark, so it doesn't nag |
| Clicks Stop mid-stream | A partial answer | **Gap:** `ChatThread` has no "stopped" mark on a turn. Mark it as stopped, and the end control (replay) appears |
| Switches to another moment mid-scene, then comes back | Resumes or restarts | **Decision needed.** The scenes are independent, so a restart is simplest and the scene is short. Resuming keeps progress (error-handling principle) |
| Clicks a component's Storybook link mid-scene | Leaves the page and loses the scene | Open Storybook in a new tab [decision], so the scene stays where it was |
| Wants to see it again | — | A replay control at step 6 and after Stop |
| Skims without interacting (recruiter) | The first frame has to say something on its own | Step 1's frame already shows the starter, the composer and the labels |

## 3. Coherence check

- **Reaches the goal:** yes. Steps 1–6 end with an answered question, and the labels reach Storybook.
- **Every step leads somewhere:** yes, except step 6, whose exit is undefined (open item 3 from the interview).
- **Dead ends:**
  - typed or edited questions with no answer (decision);
  - unscripted suggestions (decision);
  - a stopped turn with no stopped state and no replay (gap in `ChatThread`);
  - the paperclip and file removal, which lead nowhere in a scripted scene (decision).
- **Missing decision points:**
  - whether the visitor may type at all;
  - how many suggestions are live;
  - resume or restart on return;
  - Storybook in a new tab;
  - the end-of-scene control.
- **A step that runs without the visitor:** step 2, where the file finishes on its own. It conflicts with "waits for them to act". Either keep it, as the system working and not the agent, or start the scene with the file already uploaded and drop the RUNNING beat. [decision]
- **Two clicks to ask (pick, then Send):** this is the component's real behaviour, and worth showing. It works only if the nudge moves to Send at step 3. Without that move, the visitor thinks the click did nothing.
