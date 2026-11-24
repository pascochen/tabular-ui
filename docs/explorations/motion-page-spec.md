# Motion: a motion spec for the Foundations page

2026-11-24. The owner asked for a Motion page on tabularui.com, beside Density, about the use of animation on an agentic platform: the site's Play and Replay, the copy button's tick, and the agentic motions that fit the system. **Built the same day** as `apps/site/src/routes/motion.tsx`.

One method from the UX + AI library was run: **Motion spec** (trigger, states, what moves, timing as ranges, purpose, reduced-motion fallback, and a cut of anything that only decorates). Ileana Marcut's AI product principles were the standing bar; the ones this spec leans on are named where they apply.

The interactions were the owner's (Play and Replay, Copy) plus every motion already in the library and the site. Nothing here is invented for the page: each built motion's values are read from its source, and `apps/site/src/motion.ts` names the file and the class each value is in, which `apps/site/tests/motion.spec.ts` checks.

## What the system already rules

- **There are no motion tokens.** `theme.css` has no duration or easing, and a new token needs approval. Values are written in place, as the library's are. This spec does not propose one.
- **`docs/design-system.md` has no motion section.** Each Foundations page maps to one section of it (`docs/site.md` D9), and Motion has none to map to. The page renders from `docs/site.md` §7, §11.5's working indicator, and the components' own classes. A §12 "Motion" in the spec is the follow-up that closes this; it is a rules decision, so it waits for the owner.
- **Colour means state.** Motion never brings a hue. No shadow, no lift, no radius.
- **Nothing plays on load and nothing loops** (`docs/site.md` §6, §7), with two exceptions: the hero (D6, reopened, with Pause) and work in progress, which loops for exactly as long as the work runs.
- **A specimen's run is 5 seconds or less**, so it needs no pause control (WCAG 2.2.2).
- **With reduced motion nothing moves** on any route (`tests/quality.spec.ts`).

## The three jobs

Every motion below has one of three purposes, or it is cut.

| Purpose | Says | Budget |
|---|---|---|
| **Feedback** | Something happened, because you did it | 75–240ms, `ease-out` in, `ease-in` out |
| **Continuity** | Where this came from, or went | 80–200ms |
| **Work in progress** | Something is still happening, that you didn't do | Loops at 1.2s, linear, for as long as the work runs |

Feedback lands inside 250ms or it reads as latency: on 2026-11-16 a link underline drawn in over 120ms was read as a bug. Work in progress is linear because it promises nothing about when it ends.

## The spec

### Feedback

**F1. Copy is ticked** (built, `components/copy-command.tsx`)
- **Trigger:** the clipboard accepts the copy. Not the press: a failed copy shows nothing.
- **States:** copy icon → check, "Copied" → copy icon.
- **What moves:** the check is revealed left to right along its stroke (`clip-path`), 140ms `ease-out` (range tried: 120–180ms). It holds 2s. The copy icon fades back in, 120ms `ease-out`.
- **Purpose:** feedback. The tick is the ledger's mark for "checked".
- **Reduced motion:** both icons swap in place. The button's name and the one announcement carry it.

**F2. Play and Replay take a wash** (built, `runWash` in `lib/styles.ts`)
- **Trigger:** a specimen's run starts, from the button, the pointer or the scroll.
- **States:** at rest → running → ended.
- **What moves:** the press tone, `--color-bg-active`, wipes across the button from the left in 140ms `ease-out`, holds while the run plays, and leaves to the right in 200ms `ease-in`.
- **Purpose:** feedback, and it says a run is under way for as long as it is.
- **Reduced motion:** never shows. The player jumps to the rest frame.

**F3. A link's word takes the ink** (built, `standaloneLink`)
- **Trigger:** hover.
- **What moves:** the underline appears at once; the text darkens from secondary to primary over 240ms `ease-out`.
- **Purpose:** feedback. The line is the first frame, so the hover never reads as late.
- **Reduced motion:** the colour changes in place.

**F4. A switch's thumb travels** (built, `Switch`)
- **Trigger:** a press or Space.
- **What moves:** the thumb, 150ms, `cubic-bezier(0.4, 0, 0.2, 1)` (Tailwind's default).
- **Purpose:** feedback, and continuity: the thumb is seen to go from off to on.
- **Reduced motion:** the thumb arrives.

**F5. A disclosure's caret turns** (built, `AgentReasoning`, `Tool`, `ChannelMessage`, `LineageTree`, `RunLogRow`)
- **Trigger:** opening or closing a fold.
- **What moves:** the caret, 90°, 150ms, Tailwind's default curve. The fold itself does not animate its height: the rows below move once.
- **Purpose:** feedback.
- **Reduced motion:** the caret turns at once. **Fixed with this page:** `LineageTree` and `RunLogRow` were the two carets without `motion-reduce:transition-none`.

### Continuity

**C1. The page turns** (built, `@view-transition` in `index.css`)
- The old page leaves in 80ms, linear; the new arrives over 150ms, `ease-out`; the nav and footer hold. A browser without cross-document view transitions cuts. **Reduced motion:** the cut.

**C2. A popup fades** (built, `popupSurface`, `Dialog`, `Tooltip`)
- Menu, Select, Combobox, Popover and Dialog fade in and out in 100ms, `ease`. A tooltip fades in over 150ms after its delay. Nothing slides or scales.
- **Reduced motion:** the fade still runs. It is opacity, not movement, and it is under the 250ms budget. This is what the code does today; it is written down here because nothing else says so.

**C3. Scroll to latest** (built, `MessageScroller`)
- The button appears with a 200ms fade and a scale from 95%. Pressed, the thread scrolls smoothly to the newest turn.
- **Reduced motion:** the button appears, and the scroll jumps.

**C4. A progress bar fills** (built, `ProgressBar`)
- The fill slides to its new value, 150ms. Indeterminate work pulses, 1.4s `ease-in-out`, for as long as it runs.
- **Reduced motion:** the fill arrives; the indeterminate bar holds still and its label says it's working.

### An agent at work

These are the motions that make an agent's work legible: it is working, how long it has worked, what it is doing, and when it is waiting for you (principles 4, "show your work", and 20, "clarify when the AI is involved").

**A1. The square tracer** (built, `Spinner`, §11.5)
- **Trigger:** the agent starts work. **States:** working → done, failed or stopped.
- **What moves:** the gap travels clockwise round a square, 1.2s a lap, linear, looping until the work ends. One mark for every working state: the turn before its first token, reasoning while it streams, a plan step being drafted, `running`, `AI working`.
- **Purpose:** work in progress. It promises nothing about how long.
- **Reduced motion:** the still frame, a notch at the top right, for as long as the work runs.

**A2. The elapsed figure** (built, `WorkingLabel`, §11.5)
- **Trigger:** work has run 3 seconds. "Thinking…" becomes "Thinking · 0:03", ticking each second, `tabular-nums`, so it never changes width under ten minutes.
- **Purpose:** work in progress. People trust a result more when they can see the time that went into it.
- **Reduced motion:** it keeps ticking. A changing number is not movement, and it is the only sign the work is still going. It is never announced.

**A3. Work arrives a piece at a time** (built, `ChatThread`, `AgentPlan`, `ToolGroup`, `RunLogRow`)
- Steps, reads and text arrive as the agent produces them, and each lands in place: no per-token fade, no typewriter, no slide. The motion is the work itself.
- **Purpose:** show your work, as it happens.
- **On the site:** the specimens replay this at 900ms a step, in 5 seconds or less.
- **Reduced motion:** the site shows the finished state. In the product the pieces still arrive, since that is data, not animation.

**A4. Waiting for you** (built, `Confirmation`, `Question`, `AgentBlock`'s "Awaiting review")
- **Nothing moves while the agent waits.** A pulsing button would hurry a decision about money. The label says it is waiting, and the decision lands in place: "Posted by you".
- **Purpose:** keep people in control (principle 2). Stillness is the signal.

## Not built: candidates for the owner

Each is consistent with the rules above, and each needs a decision, because it adds behaviour to a library component.

| Candidate | Trigger → states | What moves | Purpose | Reduced motion |
|---|---|---|---|---|
| **A changed value is marked, then settles** | The agent writes a cell or a figure the user can see | The cell takes the neutral hover tint at once, which fades over 400ms (the hero's pointer tint) | Focus: where the change landed. The authorship stays in the agent rail and the activity log, so nothing is lost when it fades. | The tint shows for 2s and goes at once |
| **The undo window** | An agent action is applied with a grace period | A 2px `ProgressBar` drains over the window, linear; Undo beside it | Recovery (principle 5): how long is left to take it back | The remaining seconds as a figure, no bar |
| **Stopped holds still** | The user presses Stop | The tracer stops on its still frame and the label reads "Stopped" at once | Control (principle 2): the stop is instant, so it is believed | Same |
| **Authorship arrives first** | An agent turn begins | The rail and the "AI" label appear in the first frame; the content follows | Clarify the AI is involved (principle 20) before anything is read | Same: it is order, not movement |

## More of the same family: the tick, the wash, the rule

Asked the same day (owner): more motions like Copy is ticked and Play takes a wash. Each below reuses one of the site's two built gestures, or the ledger's third, and adds no new timing:

- **The tick**: a mark drawn along its stroke, left to right, 140ms `ease-out`. It says *done, and checked*.
- **The wash**: the press tone, `--color-bg-active`, wiping across a surface from the left in 140ms `ease-out`, leaving to the right in 200ms `ease-in`. It says *this took*, or *this is under way*.
- **The rule**: a 1px line drawn left to right, 200ms `ease-out`, as a pen rules a ledger. It says *this is settled*.

None needs a token. A library keyframe is written beside the component that uses it, as `Spinner`'s is. Where today's code was checked, it is named.

### Recommended first

**M1. The tracer becomes a tick** (`StatusBadge`, and `RunLogRow` through it). **Built 2026-11-24.**
- **Trigger:** work the agent was doing ends in `passed` (or a read ends `done`).
- **States:** square tracer → check circle. Today the mark is swapped in one frame (`statuses.ts`: `passed` is `CheckCircleIcon`).
- **What moves:** the passed mark is drawn left to right, 140ms `ease-out` (120–180ms), the copy tick's own reveal. *As built:* the circle is revealed with its check, because Phosphor draws them as one glyph; splitting them would take a second icon. A failure gets no tick: its mark lands in place. `Tool` was dropped: a finished call shows no mark at all, so there is nothing to tick.
- **Purpose:** feedback for work you didn't do. The moment it finished is the moment worth seeing, and a list of reads that tick through one by one reads as checked, not just loaded.
- **Reduced motion:** the mark swaps in place, as now.
- **Note:** only on a change seen live. A page that loads with a passed row draws it still, or a list of fifty passed runs would tick on every load.

**M2. Copied cells take a wash** (`DataTable`). **Built 2026-11-24.**
- **Trigger:** Cmd-C on a selection in a table. Today nothing visible happens; the copy succeeds silently (`copyWithPlainSign`).
- **States:** selected → copied → selected.
- **What moves:** the wash crosses the copied cells as one band, in 140ms, holds 400ms, leaves in 200ms, linear: each cell's share of the band starts when the band reaches it. The selection stays visible through it.
- **Purpose:** feedback for an action that is otherwise invisible, and the one people repeat most in a finance tool: figures go from the table to a spreadsheet all day.
- **Reduced motion:** the press tone shows on the cells for 600ms, then goes, with no travel.
- **Also:** a polite "Copied" announcement, once, as the copy command's.

**M3. The total is ruled** (`DataTable`'s totals row, §7.8). **Built 2026-11-24 in the library; not on the site** (D11 keeps the site to one double rule).
- **Trigger:** the rows on display come to sum to the stated total, after a filter is cleared, a row is posted or the agent corrects one. The double rule already appears only then; today it appears in one frame.
- **What moves:** the double rule is drawn left to right in 200ms `ease-out`. *As built:* both lines together, revealed by one cover in the cell's ground, so the rule's geometry and its check are untouched. The 40ms offset between the lines was dropped with it.
- **Purpose:** feedback, and the one motion in the system that says *it balances*. It is the ledger's own gesture.
- **Reduced motion:** the rule appears.
- **Never on load,** and never drawn out again when the sum stops holding: the rule is removed at once, because a total that no longer sums must not linger.

**M4. Copy is ticked, in the library** (`ContextSwitcher`'s copy action). **Built 2026-11-24.**
- **Trigger, states, timing:** the site's tick and fade-back, 140ms and 120ms. The library's "Copied" holds 1.5s (`COPIED_MS`), not the site's 2s; that was left as decided. The label and the announcement are unchanged.
- **Purpose:** feedback, and one copy gesture across the site and the product. Today they differ.
- **Reduced motion:** the icon swaps in place.

### Worth building next

**M5. Run plan takes a wash** (`AgentPlan`)
- **Trigger:** Run plan is pressed. **States:** ready → running → done or stopped.
- **What moves:** the wash crosses the button in 140ms and holds for as long as the plan runs, then leaves in 200ms. Exactly Play's.
- **Purpose:** feedback that the press took, and that the run it started is still under way, on the control that started it.
- **Reduced motion:** the button's label carries it ("Running"), with no wash.

**M6. The row you landed on takes a wash** (`InlineCitation` → `Sources`, a link into a `DataTable` or `LineageTree` row)
- **Trigger:** following a citation, a jump link or a lineage parent to a row.
- **What moves:** the row takes the press tone at once, holds 1s, and fades over 400ms (the hero's pointer tint). The scroll itself is the one the page already does.
- **Purpose:** focus. After a jump the eye lands on a page of identical rows; this says which one.
- **Reduced motion:** the tone shows for 1.4s and goes at once.
- **Joins** "A changed value is marked, then settles" above: the same tint, for a row the agent changed.

**M7. Declined is struck through** (`Confirmation`, `AgentBlock`'s proposal)
- **Trigger:** Don't post. **States:** proposed entry → not posted.
- **What moves:** one 1px rule is drawn through the proposed amount, left to right, 200ms `ease-out`. The amount stays legible under it.
- **Purpose:** continuity. A ledger corrects by striking, never by erasing, so the reader can still see what was proposed and turned down.
- **Reduced motion:** the strike appears.

**M8. A checkbox is ticked** (`Checkbox`, foundational: needs approval)
- **Trigger:** checked, by a press or Space. **What moves:** the check drawn along its stroke, 100ms `ease-out`, faster than the others because rows are checked in runs. Select-all ticks every box at once, with no stagger.
- **Purpose:** feedback, and the same gesture as every other tick.
- **Reduced motion:** the check appears.

### Considered for this family, and cut

- **The Send button takes a wash.** The message landing in the thread already answers the press, a frame later.
- **A shake on an error.** It is an overshoot, and the error's text already says what happened and what to do.
- **A count that bumps** when a `CountBadge` changes. A figure that jumps reads as a different figure for a frame.
- **A heart or a thumbs-up burst** on feedback to the agent. Celebration, and no such control exists.

## Cut

Each was considered as a popular agentic motion and fails a rule.

- **Figures that count up or roll.** On the way they show amounts the books never held. In a finance tool that is a false statement, however brief.
- **A shimmer on "Thinking…".** A second loop beside the tracer, saying nothing new, and a gradient sweep is a hue arriving with motion.
- **A typewriter over text that has already arrived.** It delays the reader to perform a stream that isn't happening.
- **Spring, bounce, overshoot.** A value that overshoots says it went past where it is.
- **Celebration on approval.** Posting an entry is bookkeeping, and the approval isn't the outcome.
- **A pulsing or glowing agent.** Orchid in motion claims a state, and the system has one shadow.
- **Scroll-linked reveals and parallax.** A ledger at rest is still, and what hides until script reveals it is missing from the server HTML.

## The page

*As revised the same day (owner):* the switch, the caret, the copied-ID card (M4) and the "An agent at work" section were removed from the page. They were not essential, and the agent components are shown elsewhere on the site. Their motions stay in the Timing list.

`/foundations/motion`, the fourth Foundations link, after Density.

1. **Head:** the lead, and a key of the three jobs: Feedback, Continuity, Work in progress.
2. **Feedback:** the live Copy, and a Play that drives a progress bar and wears the wash.
3. **Ticked and washed:** a run whose passes are ticked (M1), and table cells to copy (M2).
4. **What never moves:** the cut list, as rules.
5. **Timing:** every built motion, its duration and curve, its purpose and its reduced-motion behaviour, from `src/motion.ts`.

## Conclusion

- The Motion page documents 13 motions that already ship, with values read from source and held by a test.
- Three jobs, one budget: feedback 75–240ms, continuity 80–200ms, work in progress loops at 1.2s.
- Waiting is shown by stillness, never by pulsing.
- Two product carets turned under reduced motion; fixed.
- Popups fade under reduced motion. Written down, not changed.
- Four agentic candidates and a §12 for `docs/design-system.md` wait for the owner.
