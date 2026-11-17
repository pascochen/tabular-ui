# Hero motion: "asked aloud", a motion spec

2026-11-17. An exploration for the hero of tabularui.com (`apps/site`). **Built the same day** as `apps/site/src/hero-sheet.tsx`. Where the build differs from this spec, `docs/site.md` §13, "The hero, as built", says so and wins: the rows and dates are the dataset's, the buttons are right-aligned, and Pause has no pressed state.

One method from the UX + AI library was run: **Motion spec** (trigger, states, what moves, timing, purpose, reduced-motion fallback). The values below are the ones in the prototype, each with the range it was tried in.

- **Prototype:** `docs/explorations/hero-sheet-voice-prototype.html`. Open the file in a browser. It has controls for the hold, the word pace and reduced motion.
- **Art direction (owner):** a spreadsheet, with cells and sheet tabs, because Excel and Google Sheets are what accountants and analysts already know.

## How it got here

Five prototypes were built on the same day, all in `docs/explorations/`.

| Prototype | File | Outcome |
|---|---|---|
| A. The sheet settles | `hero-sheet-prototype.html` | A run that plays once on load. Liked. |
| B. The looping sheet | `hero-sheet-loop-prototype.html` | Three sheets on a loop. Liked. |
| C. The grid idles | `hero-grid-idle-prototype.html` | A background grid. Decoration only. Not taken further. |
| The agent works the sheet | `hero-sheet-replay-prototype.html` | A, B's tabs and a footing column in one Replay run. Not taken further. |
| **Asked aloud** | `hero-sheet-voice-prototype.html` | The owner's sketch, drawn from A and B. **This spec.** |

## Decisions the owner made (2026-11-17)

1. **D6 is reopened.** The hero may move on load.
2. **The hero loops**, with a Pause button at the bottom right of the frame.
3. **The question is asked by voice.** A mic is pressed and a sound wave runs while the question arrives. The reference is the Claude chat box.
4. **The mic stays** although the library has no voice input. Neither `ChatComposer` nor the demo has one, so the hero shows something a visitor will not find in the components. The owner was told and kept it.
5. **At most eight sheet rows.** A visitor decides in a few seconds, and every extra row slows that. *Cut to six the same day:* see decision 15.
6. **Mobile first**, and the frame should not tower over the copy beside it.
7. **The mic looks pressable** and stays inert. It is drawn as a control because the animation presses it.
8. **Pause does not persist.** It lasts for the visit to the page, and the next load plays again.
9. **The card waits 2.5 seconds before Post entry is ringed, on load and in every cycle.** *(A 5.5 second hold when first decided, before the card had buttons. Changed the same day, owner: with the loop running, the 5.5 second wait was the one seen most, and it felt long.)*
10. **The pointer tint stays**: a cell under the pointer takes the neutral tint at once, and it fades over 400ms.
11. **The dashed row outline is accepted**, beside §7.8's dashed-means-placeholder.
12. **The answer leaves as it arrives**: the same fade out as in. A cut was too quick.
13. **It starts on the answer.** On load the hero is the Rest frame, and nothing moves for the first 2.5 seconds. *(5.5 seconds when first decided. Changed the same day, owner: visitors tend to stay about 4 seconds above the fold, so the first motion has to arrive inside that.)* Every later cycle waits the same 2.5 seconds (decision 9). This came from a Quick clarity check (UX + AI library) run on the prototype the same day: a visitor who decides in three seconds was deciding on an empty question bar and a blank band.

14. **The person is shown.** The card carries Post entry and Don't post while it waits, and each cycle ends with the entry posted: "AI · Posted", "posted by you". This is the second fix from the Quick clarity check: the headline promises "what a person approved", and the picture had no person in it.

15. **Six sheet rows: the header and five entries.** The sheet shows the two duplicates and the three entries between them, and nothing else. This is the third fix from the Quick clarity check: the agent's card, the one library component in the frame, now has more of it. It also wins back more than the 36px the buttons added.

16. **A focus ring shows what is about to be pressed.** The mic and Post entry each take the system's focus ring before their press, so the press reads as a choice and not as something that happened by itself.

## What it changes in `docs/site.md`

Each of these is a rule the spec breaks. On 2026-11-17 `docs/site.md` was given the reopened D6 and a dated note at each rule below, all marked "not built". The rules themselves, and the as-built sections, are rewritten when the hero is.

| Where | What it says now | What this needs |
|---|---|---|
| D6 | The hero rests. Nothing plays on load, and Replay plays the run. | The hero plays on load and loops. Replay is replaced by Pause. |
| §6, "Specimens" | Nothing loops. A run is 5 seconds or less, so no pause control is needed. | The hero is the one specimen that loops, and it carries the pause control WCAG 2.2.2 asks for. The other specimens are unchanged. |
| §7, "Motion" | Four motions. None plays on load and none loops. | The hero is named as the exception. |
| D5 | The hero's story is the duplicate payment: question, cited answer, proposed entry. | Same story, shown on the invoice sheet. The proposed journal entry leaves the hero and stays on the Agent block card. |
| §5, data | No figure is typed into `apps/site/src`. | The sheet's rows come from the export (see "Data"). |
| Tests | `playback.spec.ts`, `motion.spec.ts`, `quality.spec.ts` | See "Tests". |

## The spec

### Trigger

Page load, once the hero has hydrated and at least half of it is in the viewport. **The loop begins with the hold, not with a pass**: the hero is the Rest frame, exactly as the HTML shipped it, for the first 2.5 seconds. Then the answer fades out, the first pass plays, and it repeats until it is paused.

It does not start, or it stops at the end of the current pass, when the hero is scrolled out of view or the tab is hidden. That keeps a loop from running where nobody is looking.

### States

| State | The question bar | The sheet | The answer |
|---|---|---|---|
| **Empty** (first frame of a pass) | No question. Mic at rest. | Five entries, no marks, no cursor. | Hidden, its space held. |
| **Listening** | Mic pressed, then ink. Wave running. Words arriving. | Unchanged. | Hidden. |
| **Looking** | Full question. Mic at rest. | Row 2 outlined. Cursor and a neutral highlight on E2. | Hidden. |
| **Found** | Same. | Row 6 outlined. Cursor on E6, which is flagged. E2 keeps its highlight. | Hidden. |
| **Rest** (last frame of a pass) | Same. | Same as Found. | "AI · Awaiting review", the answer, and two buttons: Post entry, Don't post. |
| **Posted** | Same. | Same as Found. | "AI · Posted", "posted by you" at the right, and "Posted as `JE-KUS-2610-00040`." where the buttons were. |

**Rest is the frame that ships in the HTML.** It is what a crawler, a link preview, a visitor without JavaScript and a visitor with reduced motion see.

### What moves

Durations are ranges. The prototype's value is in brackets.

**1. The mic is pressed.** Purpose: continuity. It says where the question came from.
- 0.3s into the pass the mic takes the focus ring: 2px, the ring colour (`ledger-800` in light, one step softer than ink). It is a cut, as a real focus ring is. The mic sits against the frame's edge, so its ring is drawn inside, with an offset of -2px.
- 300–500ms (400) later the mic takes the press tone (`--color-bg-active`) and holds it 120–180ms (150). The ring leaves with the press.
- It then takes the checked treatment, ink ground and paper icon, for as long as the wave runs.
- When listening ends it returns to rest over 120–160ms (140), `ease-out`.
- No pointer is drawn. The control's own press state shows the press.

**2. The sound wave.** Purpose: focus, on the bar where the question is arriving.
- Ten bars, 2px wide and 16px tall, 2px apart, in ink, between the question and the mic. Six bars under 600px.
- Each bar scales on its vertical axis between 0.2 and 1 over 480–640ms (560), `ease-in-out`, alternating. Each has a fixed delay, so the bars are out of step and the pattern is the same every pass.
- The wave is in the layout only while it runs. The question never wraps, so nothing reflows when it comes and goes.
- It runs for the length of the question: about 1.9s.

**3. The question arrives.** Purpose: continuity. The words are what was heard.
- "Question:" and then six words, one at a time, 130–220ms apart (170). Each word is a cut, with no fade.
- Every word is laid out from the first frame and only made visible, so the line's width never changes.
- The first word follows the mic by 300–400ms (350). The wave stops 250–350ms (300) after the last.

**4. The agent looks at E2.** Purpose: focus. A quiet hint at where the agent is reading.
- 300–400ms (350) after the wave stops, three things happen together:
  - A dashed 1px outline is drawn across row 2, left to right, in 160–240ms (200), `ease-out`.
  - The cell cursor, a 2px ink outline, appears on E2. It is a cut.
  - E2 takes the neutral hover tint over 120–160ms (140), `ease-out`.
- It holds 500–800ms (650).

**5. The agent reads down to E6 and flags it.** Purpose: focus, then feedback. Something was found.
- The cursor steps E3, E4, E5, E6, one cell per 70–120ms (90). Each step is a cut, with no tween: a spreadsheet cursor does not glide.
- On arrival the dashed outline is drawn across row 6, as for row 2.
- 160–240ms (200) later E6 takes the danger tint and the danger text colour, at weight 600, over 120–160ms (140), `ease-out`.
- E2 keeps its neutral highlight. The two amounts are the pair.

**6. The answer.** Purpose: feedback. The agent has stopped, and it is the visitor's turn.
- 300–400ms (350) after the flag, the agent's note fades in over 160–240ms (200), `ease-out`, and moves down 4px into place.
- It sits under the sheet in space that is always held, so the frame's height never changes.
- It leaves with the same motion reversed: the same duration and easing, fading out and moving up 4px (owner, 2026-11-17).

**7. The person posts the entry.** Purpose: feedback. It shows the half of the product the headline names: a person approved.
- The card waits 2.5s with its two buttons showing, on load and in every cycle (tried at 1.5–5.5s). This is the Rest frame.
- Then, for 500–700ms (600), Post entry carries the focus ring: 2px, the ring colour, 2px outside the button. It is a cut.
- Then Post entry takes its press tone for 120–180ms (150), as the mic did.
- The label changes to "AI · Posted", "posted by you" appears at the label's right, and the buttons give way to "Posted as `JE-KUS-2610-00040`." All three are cuts, in place, as the Agent block card's own decision is (D1, D2).
- The outcome line takes exactly the buttons' height, so the card does not move.
- Posted holds 1.5–4s (2.5).
- The buttons are drawn as controls and are inert, like the mic. The Agent block card further down the page is where a visitor makes the decision themself.
- Edit entry, the card's third action, is left out to keep the hero quiet.

**8. The restart.** Purpose: none of the three. It is what a loop costs.
- The answer fades out, as in part 6, and the question, the row outlines, the two tints and the cursor fade out with it, over the same 200ms (owner, 2026-11-17, after watching the built page: the cut read as a jump beside the fading card). The frame after is Empty, and by then nothing is left to cut. The flagged figure's weight is part of the fade too, 600 to 400.

### Sequence

**On load.** Nothing moves in the first 2.5 seconds, and the decision is made inside the first 4.

| At | What |
|---|---|
| 0.0s | Rest: the answer, waiting, with its two buttons |
| 2.5s | Focus ring on Post entry |
| 3.1s | Post entry is pressed |
| 3.25s | Posted |
| 5.75s | The answer fades out |
| 5.95s | The first pass begins |

**Each pass after that.** Times are from the start of a pass, measured in the prototype.

| At | What |
|---|---|
| 0.0s | Empty |
| 0.3s | Focus ring on the mic |
| 0.7s | Mic pressed, ring gone |
| 0.85s | Mic ink, wave starts |
| 1.2–2.2s | "Question: Did we pay any invoice twice?" |
| 2.7s | Wave stops, mic at rest |
| 3.0s | Row 2 outlined, cursor and highlight on E2 |
| 3.7–4.1s | Cursor steps to E6, row 6 outlined |
| 4.3s | E6 flagged |
| 4.6s | The answer opens |
| 4.8s | Rest |
| 7.3s | Focus ring on Post entry |
| 7.9s | Post entry is pressed |
| 8.1s | Posted |
| 10.6s | The answer fades out |
| 10.8s | Cut to Empty |

A cycle measured 10.9 seconds in the prototype. The card is seen waiting for about 3.1 of them, ring included, and the decision made for 2.5 more.

### Pause

- **Where:** the bottom right of the frame, in the sheet's tab bar. It replaces Replay.
- **What:** a library `Button`, `variant="ghost"` `size="sm"`, with Phosphor's `Pause` and the label "Pause". Pressed, it shows `Play` and the label "Play". It carries `aria-pressed`.
- **Behaviour:** it freezes the pass where it is, the sound wave included, and Play resumes from the same frame. It does not jump to Rest.
- **It stays paused** for the rest of the visit to the page, and is not remembered: the next load plays again (owner, 2026-11-17).
- **It is the hero's alone** (owner, 2026-11-17). It pauses the hero's loop and nothing else. The component specimens keep their Play and Replay buttons exactly as `docs/site.md` §6 and §7 specify them: they still play once, never loop, and take the run wash.
- **Why it exists:** the loop starts on its own and runs past 5 seconds beside other content, which is the case WCAG 2.2.2 covers.

### Reduced motion

- The Rest frame, and nothing else. No pass runs, no wave is drawn and no cursor steps.
- The Pause button is not rendered, because there is nothing to pause.
- This is also the frame before hydration and without JavaScript.

## Layout

**The sheet**
- Rows 1 to 6: the header and five entries, `API-KUS-2607-00007` to `-00011`. The duplicate is rows 2 and 6, so the sheet begins and ends on the finding.
- Column letters above and row numbers at the left, in the sunken neutral. 28px rows. Figures carry `tabular-nums`.
- Two sheet tabs under the answer, named for the two source files. They are labels, not controls: nothing in the pass uses the second file.

**From 600px:** five columns, A to E: Entry, Invoice, Supplier, Date, Amount. Supplier names are one or two words ("Meridian", "Quartex Toner") so none is truncated, and the dates are `2026-12-N`, December (owner, 2026-11-17).

**Under 600px:** columns B, C and E only. The invoice number and the amount are the evidence, so they are never truncated. The column letters skip, as they do in a spreadsheet with hidden columns.

**The page:** one column under 900px, with the copy first. Two columns from 900px, 5 to 7.

**Height, as measured in the prototype**

| Width | Frame | Copy beside it |
|---|---|---|
| 1280px | 415px | about 225px |
| 375px | 456px | stacked above |

The buttons' row added 36px (decision 14) and the two rows cut took back 56px (decision 15). The frame is still a little under twice the copy's height on desktop. Dropping the answer's second sentence saves about 20px there and 40px on a phone.

## What it is made of

The prototype draws everything by hand with copied colour values. The build uses the library, and no new token.

| Part | Built from |
|---|---|
| The agent's note | `AgentBlock`, `authorship="AI · Awaiting review"` |
| Pause | `Button`, with Phosphor `Pause` and `Play` |
| Post entry, Don't post | Drawn as `Button`, `size="sm"`, default and `outline`. Inert, and hidden from assistive technology. |
| The mic | Phosphor `Microphone`, in a box styled as an `IconButton`. It is inert. |
| The sheet | A site-only component in `apps/site/src`. `DataTable` has no column letters, row numbers or cell cursor, and adding them is not this spec's business. |
| E6's flag | `--color-bg-danger` and `--color-text-danger` |
| E2's highlight | The neutral hover overlay |
| The cursor | A 2px outline in `--color-text-primary`, drawn inside the cell |
| The dashed outline | `--color-border-strong`. Dashed means placeholder in §7.8, "Border style". The owner accepted this second use (2026-11-17), and §7.8 needs a line saying so. |

Durations and easings are written in place, as the site's other motions are. There is no motion token.

## Data

- Rows 2 and 6 are real: `kasane.json`'s `duplicatePayment` has both entries, the invoice number and the amount.
- The three rows between them, and every date, are **placeholders typed for the prototype**. `tests/data.spec.ts` fails on a figure typed into `apps/site/src`.
- So `apps/demo/scripts/export-fixtures.mjs` has to export the invoice rows around the duplicate before this is built.

## Accessibility

- **2.2.2 Pause, Stop, Hide:** met by the Pause button.
- **Reduced motion:** nothing animates, which `tests/quality.spec.ts` already checks on every route.
- **Screen readers:** the Rest frame's content is always in the accessibility tree: the question, the table and the agent's note. The pass changes only what is painted. The wave, the cursor and the outlines are `aria-hidden`.
- **No live region.** A loop that announced each pass would never stop talking.
- **Post entry and Don't post are not controls** in the hero, for the same reason as the mic. A visitor who wants to decide does it on the Agent block card.
- **The two focus rings are drawn, not real.** Keyboard focus is never on the mic or on Post entry, so a sighted keyboard user sees a ring where their focus is not. The rings are short (0.4s and 0.6s) and Pause stops them, but this is the first thing for the accessibility pass to judge.
- **The mic is not a control.** It looks like one (owner, 2026-11-17), but it can't be focused and has no role, because pressing it does nothing. It takes no hover or press state from the pointer.
- **Forced colours:** the tints go, so the cursor's outline and the dashed rows carry the finding. The wave's bars are backgrounds and disappear, which loses nothing: it is decoration.
- **Focus:** Pause is the only thing in the frame that takes focus.

## Tests

- **`playback.spec.ts`:** the hero no longer has Replay. Its checks become: the server HTML is the Rest frame, a pass runs after hydration, Pause freezes it and Play resumes it.
- **`motion.spec.ts`:** one check that the pass runs, and one that with reduced motion it doesn't and the Pause button is absent.
- **`quality.spec.ts`:** "nothing animating under reduced motion" already covers the hero.
- **A fake clock** stops before the pass begins, not during it (failure log).
- **The visual baseline** is the Rest frame, with its buttons, taken with the loop paused.

## To check before building

- **The restart.** Everything now fades out together (part 8). The change from the full answer to an empty bar is the rewind D6 was written to avoid. It needs a real look over several cycles on the built page. If it reads as a jump, the fallback is to play once and rest, with Replay, which is prototype A's behaviour.
- **Layout shift.** The frame's height must be the same in every state at every width. The prototype holds it at 375px and 1280px.
- **The cursor at the sheet's edge.** E2 and E6 are in the last column, and E6 is in the last row. An outline drawn outside the cell is clipped there, which the prototype did until it was fixed. Draw it inside.
- **Hydration.** `lib/defer-hydration.ts` delays the hero. The loop starts from the hold (decision 13), so hydration changes nothing on screen. Check that the opening 2.5s is counted from when the hero is in view, not from when the script loads.
- **Lighthouse.** Compare the built page with today's in one session, with the versions recorded (failure log).

## Questions, answered

All five were answered by the owner on 2026-11-17, and are recorded under "Decisions the owner made", items 7 to 11.

| Question | Answer |
|---|---|
| Should the mic look pressable when a visitor can't press it? | Yes |
| Does Pause persist across pages? | No |
| Is 5.5 seconds the right hold? | Yes, then changed to 2.5 (decision 9) |
| Keep or cut the pointer tint? | Keep |
| The dashed row outline, beside §7.8's meaning for dashed | Accepted |

## Conclusion

- The hero plays the duplicate-payment story on a spreadsheet: a mic is pressed, the question is heard, the agent looks at E2, flags E6 and stops with its answer.
- On load the hero is already the answer, waiting, with Post entry and Don't post. Nothing moves for 2.5 seconds, the entry is posted "by you" by 3.25, and the loop begins: a pass reaches the answer in 4.8 seconds, waits 2.5, posts, and repeats every 10.9. A Pause button at the bottom right freezes it.
- With reduced motion, without JavaScript and in the HTML, the hero is the Rest frame: the finding, already made.
- It is mobile first: three columns under 600px, and the evidence is never truncated.
- It breaks D6, §6's no-loop rule and §7's "none plays on load". Those sections change first.
- It needs the invoice rows exported, a site-only sheet component, and no new token or dependency.
- The mic shows a voice input the library does not have. The owner kept it.
- The one thing to judge on the built page is the loop's restart.
