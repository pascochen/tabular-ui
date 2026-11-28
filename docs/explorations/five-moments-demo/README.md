# Five-moments demo: planning

2026-11-27. The owner wants to replace the Kasane demo (`apps/demo`) with a page of the five moments of an agent run: Asking, Thinking, Showing, Waiting and Recording. Each moment is an interactive scene, where the visitor can see how the agent runs. **Nothing is built yet.** These are the planning notes, decided with the owner, and the starting point for the build brief.

Methods from the UX + AI library (Ileana Marcut) were run in this order, with her AI product principles as the standing bar:

1. **Interview me to sharpen an idea**: [`interview.md`](interview.md)
2. **Full flow mapper**, one map per moment: [`asking.md`](asking.md), [`thinking.md`](thinking.md), [`showing.md`](showing.md), [`waiting.md`](waiting.md), [`recording.md`](recording.md)

Still to run: **State inventory**, **Build brief (spec-first)** and **Break into bricks**. Then **Quick clarity check** and **Heuristic critique** on a working draft.

## Read the decisions first

[`decisions.md`](decisions.md) holds the decisions that apply to every moment, and **it overrides the maps where they disagree**. It covers the nudge mark (a still ink dot, never a pulse), reduced motion (the rest frame at once), run timing (whole parts, 5s or less), Edit entry, and the pre-build checks with their results. Three of those decisions reverse ones made earlier in the maps, after the site's own rules were found: `docs/site.md` §6 and the Motion page.

## The page

- **Layout B: one bar of moments across the top**, rather than a rail down the left. The five moments are one run in order, so a bar read left to right is a timeline. A pinned side rail is the product chrome the page is meant to drop. A rail costs every pane about 200px. And on a phone a rail would fold into a bar anyway. The bar is the foundational `Tabs`, horizontal. The active moment's one line from the site sits under the bar.
- **One scene on screen at a time.** The five scenes are independent, so a visitor can jump to any moment, and each scene keeps its state while the page is open.
- **The visitor sets the pace.** A still ink dot marks the next thing to do, and nothing moves until they act. The exception is Thinking: there the agent works on its own after Run, and the visitor's clicks open what it did.
- **Component names are labelled on each scene**, each linking to its Storybook page in a new tab (↗).
- **Interaction over copy.** The words in a scene are kept to the minimum. The agent-voice rules still apply.
- **One story across the scenes, with no scene depending on another:** the duplicate KUS invoice MFL-58821, the failed bank-export read, the reversal proposal and its run log.

## What is still open

- `AttachmentRow`'s "the file name is the link" appears in no scene ([`showing.md`](showing.md), R5).
- Waiting's keyboard path after each new turn passes on reading the code. Confirm it in the built demo.
- Replacing `apps/demo`: its URL, the site's links to it, the Kasane data and `og.png` ([`interview.md`](interview.md), open item 8).
