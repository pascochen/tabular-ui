# Site motion: brainstorm and three motion specs

2026-11-16. An exploration for tabularui.com (`apps/site`). The three specs at the end were built the same day (`docs/site.md` §7, "Motion"), with two changes noted under each. The other seven concepts are not built.

Two methods from the UX + AI library were run: **Divergent concepts** (ten ideas, conventional to strange, each on its own axis, unranked) and **Motion spec** (trigger, states, what moves, timing, purpose, reduced-motion fallback) on three of them.

## What the site already rules

These are the fences every idea has to stand inside. All are from `docs/site.md` unless noted.

- **The hero rests** (D6). Nothing plays on load. Replay plays the run when asked.
- **A run is 5 seconds or less and never loops** (§6).
- **With reduced motion, no element animates**, on every route. `tests/quality.spec.ts` holds it.
- **Nothing is fixed or sticky.** The nav scrolls away (D8).
- **The prerendered HTML is the rest state.** Anything that hides until script reveals it is visible, or missing, on the server (failure log).
- **Colour means state.** Motion can't bring a hue with it. There are no shadows and every rectangle is square, so "lift on hover" has nothing to lift with.
- **The wordmark is a brand file, used unchanged.** It isn't animated.
- **The double rule is for a total that sums.** Nothing else draws one, so it can't be a flourish.
- **There are no motion tokens.** `theme.css` has no duration or easing token. The library writes `duration-100` (Dialog) and `duration-200` (MessageScroller) in place. A motion token would be a new token, which needs approval.
- **`Button` has no transition today.** Hover and press are the one neutral overlay, applied at once. Changing that is a change to a foundational component, which needs approval.

## The art direction, as motion

Riso Ledger is print and bookkeeping: paper, ink, ruled lines, figures in columns, a square tracer for work in progress. That suggests a small vocabulary:

- **A rule is drawn**, as a pen draws one.
- **Ink lands in register**, in passes, not on a curve.
- **A figure is ticked** once it's checked.
- **A page is turned.**
- **Nothing drifts.** A ledger at rest is still.

## Ten concepts

Ordered from conventional to strange. Each differs on a named axis. The last three break a convention of web motion. They're unvalidated and unranked.

### 1. The arrow steps out

- **Axis:** affordance, where a click goes.
- **Where:** every `ExternalMark` (↗): "Open the demo" in the hero and closing band, Storybook and GitHub in the nav, the footer's Live and About columns.
- **Pitch:** on hover or focus the ↗ moves 2px up and right, so a link that leaves the site says so before the click.
- **Who it's for:** a visitor deciding whether a link opens a new tab.
- **Main risk:** it's the most common link animation on the web, and touch never sees it.

### 2. The underline is ruled in

- **Axis:** drawing a line.
- **Where:** `standaloneLink`: footer links, card titles, the jump index, previous and next.
- **Pitch:** the hover underline settles up into place under the word in about 120ms, where today it appears at once.
- **Who it's for:** anyone scanning the footer or a grid of card titles with a mouse.
- **Main risk:** in forced colours the resting underline would show all the time, so those links would look different from today's.

### 3. Copy is ticked

- **Axis:** confirmation of an act.
- **Where:** `CopyCommand`, the install command on each component page.
- **Pitch:** after a copy, the check is drawn left to right like a pen tick, then gives way to the copy icon two seconds later.
- **Who it's for:** a developer copying the install command, who wants to know it worked without reading a label.
- **Main risk:** the icon stays Phosphor's, so the "drawn" tick is a wipe over a finished glyph, and at 16px it may read as a plain fade.

### 4. The page turns

- **Axis:** continuity between pages.
- **Where:** every navigation. The site's links are real page loads.
- **Pitch:** the nav and footer hold still while the content between them crossfades in about 150ms, so the pages read as leaves of one book.
- **Who it's for:** a visitor moving between Components, Foundations and Vocabulary.
- **Main risk:** cross-document view transitions aren't in every browser, and they meet the deferred hydration in `lib/defer-hydration.ts`, which nobody has tested together.

### 5. Authorship arrives first

- **Axis:** order, what the eye meets first.
- **Where:** the hero specimen and the Agent block card, during Replay only.
- **Pitch:** when the proposal arrives in a run, its orchid rail is drawn top to bottom before the text appears, so "the agent wrote this" lands before what it wrote.
- **Who it's for:** a first-time visitor learning what the orchid rail means.
- **Main risk:** the rail belongs to `AgentBlock`, so drawing it means either a library change or a site-side overlay that can drift from the real rail.

### 6. The grid plays under the pointer

- **Axis:** who starts it.
- **Where:** Home's component grid.
- **Pitch:** a card's specimen plays its run once when the pointer moves over it, as a pair's after plate already does on a component page.
- **Who it's for:** a visitor browsing the grid who hasn't opened a component page yet.
- **Main risk:** fifteen cards that each move under a passing mouse could turn a still page into a busy one, and touch gets nothing.

### 7. The ink lands in register

- **Axis:** material.
- **Where:** the closing band (`site-ink`).
- **Pitch:** when the pointer first enters the band, the paper's tooth shifts a few pixels in three hard steps and stops, like a second pass landing on the first.
- **Who it's for:** nobody in particular: it's atmosphere for the one dark band.
- **Main risk:** it only decorates. Motion spec's own rule would cut it.

### 8. Steps, not curves (breaks: web motion is smooth)

- **Axis:** timing character.
- **Where:** site-wide, as a rule for everything above.
- **Pitch:** every site transition moves in two to four discrete steps with `steps()`, because print is made in passes and a ledger has no in-between.
- **Who it's for:** the owner, as an art-direction rule that makes small motions recognisably Tabular's.
- **Main risk:** on a 120Hz screen a stepped 120ms move can read as a dropped frame, not as a choice.

### 9. A mark that stays (breaks: animation is transient)

- **Axis:** persistence.
- **Where:** `CopyCommand`, and a visited component card.
- **Pitch:** nothing animates; what the visitor did leaves a still tick that stays for the visit, as an auditor ticks a figure once it's checked.
- **Who it's for:** a developer installing several components, or a visitor working through the component grid.
- **Main risk:** a tick is a claim about state. "Copied" isn't "installed", and a mark nobody can clear is a guess the page keeps making.

### 10. Still until asked (breaks: motion is on by default)

- **Axis:** who decides.
- **Where:** one control in the footer, "Motion: off".
- **Pitch:** the whole site ships still for everyone, and the visitor turns motion on, which is the site's own claim: the system waits and a person decides.
- **Who it's for:** visitors who dislike motion but have never set the system preference.
- **Main risk:** almost nobody finds a footer control, so the motion that was built goes unseen.

### What the brainstorm says about each place you named

- **Buttons:** 1 is the only idea that fits without touching `Button`. A press animation would be a foundational change.
- **Hero image:** 5 is the one idea, and it runs only inside Replay. D6 rules out anything on load.
- **Footer:** 2 and 1 land there. Nothing in the footer changes state, so there's little else for motion to say. 10 would give it a control.
- **Banner (the closing band):** 7, which is decoration. A count-up on its two figures was considered and left out: a figure that passes through wrong values on its way to the right one is the wrong habit for a finance tool.

## Motion specs

Three concepts were specified: 2, 3 and 4. They were chosen because each can be built in `apps/site` alone, with no new token, no change to a foundational component and no dependency. That is a reason to spec them first, not a ranking of the ideas.

Durations are ranges, as the method asks. The library's own values (100ms and 200ms) bound them.

### Spec A. The underline is ruled in (concept 2)

- **Trigger:** pointer hover or keyboard focus on a `standaloneLink`.
- **States:** rest (no visible underline) to hovered (1px underline, 2px under the text), and back.
- **What moves:**
  - The underline is always present and transparent at rest: `underline decoration-1 decoration-transparent underline-offset-4`.
  - On hover its colour goes to the text's colour and its offset goes from 4px to 2px.
- **Duration and easing:**
  - In: 100–140ms, `ease-out`, on `text-decoration-color` and `text-underline-offset`.
  - Out: 60–100ms, `ease-out`. Leaving is faster than arriving.
- **Sequence:** none. Both properties move together, with no stagger across a list of links.
- **Purpose:** feedback. The link answers the pointer. The 2px rise gives the line a direction, so it reads as ruled in and not switched on.
- **Cut:** a left-to-right draw. It needs a background image, which forced colours drop, and the failure log already records that mistake.
- **Reduced-motion fallback:** the transition is under `motion-safe:`. The underline appears at once at 2px, which is today's behaviour exactly.
- **As built:** `text-decoration-line` stays `none` at rest and turns on at hover, so forced colours show no resting underline and the existing test holds. The cost is the way out: the line is off at once, so there is no leaving transition.
- **To check before building:**
  - In forced colours `text-decoration-color` is overridden, so the underline shows at rest. Either accept it or put the resting underline under `motion-safe:` too.
  - The focus ring is unchanged.

- **Replaced the same day.** People who tried the built version read the empty first frames as a latency bug. Two more rounds followed, Variants of one element and then Constraint reframe on an ink story, and the owner chose "the word takes the ink": the underline appears at once, and the link's text darkens from secondary to primary over 240ms. The lesson: a hover shows something complete in its first frame, and motion only refines it. `docs/site.md` §7, "Motion", has the built rule.

### Spec B. Copy is ticked (concept 3)

- **Trigger:** the clipboard accepts the command (the existing `copied` state turns true), and the 2-second timer that turns it back.
- **States:** copy icon, to check, to copy icon.
- **What moves:**
  - Both icons sit in the same 16px box in a site-side wrapper inside the `IconButton`. The button's size, label and weight are untouched.
  - To check: the copy icon's opacity goes to 0, then the check is revealed left to right with `clip-path: inset(0 100% 0 0)` to `inset(0)`.
  - Back: the check's opacity goes to 0 as the copy icon's goes to 1.
- **Duration and easing:**
  - Copy icon out: 60–80ms, `linear`.
  - Check wipe: 120–160ms, `ease-out`, starting when the copy icon is gone.
  - Return: 100–140ms crossfade, `ease-out`.
- **Sequence:** out, then wipe. The whole change is under 250ms, so it never delays a second copy.
- **Purpose:** feedback. The copy happened. The wipe follows the stroke of a tick, which is the ledger's mark for "checked".
- **Unchanged:** `aria-label` ("Copied"), the `role="status"` announcement, and the rule that nothing shows unless the clipboard accepted the text.
- **Reduced-motion fallback:** the icons swap at once, as they do today.
- **As built:** one icon is in the DOM at a time, so `IconButton` still sets its weight. The copy icon leaves at once, with no fade out, and the check's wipe starts straight away.
- **To check before building:**
  - Two icons in the DOM at once: the hidden one needs `aria-hidden` and must not be the one a screenshot records.
  - The server HTML shows the copy icon only.

### Spec C. The page turns (concept 4)

- **Trigger:** a same-origin navigation between two pages of the site.
- **States:** old page to new page.
- **What moves:**
  - `main` crossfades: the old content fades out and the new fades in. No slide, no scale.
  - The nav and the footer don't animate. Each takes a `view-transition-name`, and its transition group is set to `animation: none`.
- **Duration and easing:**
  - Old `main` out: 60–100ms, `linear`.
  - New `main` in: 120–180ms, `ease-out`.
  - The total stays under 200ms: a navigation that feels slower than a hard cut is a loss.
- **Sequence:** out and in overlap, as a crossfade. Nothing staggers.
- **Purpose:** continuity. The frame holds and the content changes, so a visitor sees they're in the same place on a new page.
- **How:** CSS only, in `src/index.css`: `@view-transition { navigation: auto; }`, with the names and the two keyframe overrides. No script and no dependency.
- **Reduced-motion fallback:** the whole rule sits inside `@media (prefers-reduced-motion: no-preference)`. With reduced motion, and in a browser without cross-document view transitions, navigation is the hard cut it is today.
- **To check before building:**
  - A navigation that starts scrolled down, where the nav is off screen on the old page and on screen on the new one.
  - The deferred hydration in `lib/defer-hydration.ts`, and the playback tests that wait for it.
  - The reduced-motion test in `tests/quality.spec.ts` on every route.
  - Fragment links inside a page, which should not transition.

## Conclusion

- The site's rules leave room for motion in three kinds of place: hover feedback, the answer to an act, and the change between pages. They rule out load animation, scroll reveals, loops and anything pinned.
- Three ideas can be built in the site alone: the ruled-in underline, the ticked copy and the page turn. Each has a spec above and falls back to today's behaviour under reduced motion.
- The arrow step (1) is as cheap as those three and needs no spec beyond "2px, 100ms, `motion-safe`".
- Authorship first (5) and the grid playing on hover (6) are the ideas with most to say about the product. Both need a decision first: 5 touches `AgentBlock`, and 6 changes how still Home is.
- The ink in register (7) is decoration and would be cut by the method's own rule.
- Steps, not curves (8) is a rule about all the others. It needs a side-by-side on a real screen before anything is built to it.
- Buttons get no press animation without a change to the foundational `Button`, and a shared duration would be a new token. Both need approval.
- `docs/design-system.md` §11.5 cites `docs/explorations/working-indicator-brainstorm.md`. That file isn't in the repository: this document is the first in the folder.
