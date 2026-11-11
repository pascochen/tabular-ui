# The failure log and the rules: proposal, 2026-11-11

**Status, 2026-11-11:** the owner took both decisions the same day, and they are applied. `docs/failure-log.md` holds the 120 entries, unchanged. `CLAUDE.md` holds a digest of 103 lines in eight groups, 22 of them marked as held by a test or lint rule, and is 4,762 words where it was 12,814. Two entries describe a hazard that no longer exists and have no line. The "held" marks were checked by finding the assertion's keyword in each named test, not by running a failing case. Code comments that say "(CLAUDE.md failure log)" were left: the rule they point to is still in that section. The text below is the proposal as written.

**This touches an instruction, not a design rule.** `CLAUDE.md` says of the failure log: "Add to this list whenever a real mistake ships. This is the only section that improves over time — keep it current." Nothing here stops that. The proposal is about where the log lives and what an agent reads at the start of every session.

**Asked of the owner:** two decisions, the second optional.

1. **The log moves to its own file, and `CLAUDE.md` keeps a one-line digest of each live entry.** Recommended.
2. **An entry that a test or a lint rule now holds is marked as held.** Recommended, and it can wait.

A third idea, moving decision history out of the spec, is described and not recommended now.

## What this touches

| Where | What it says today | Effect |
|---|---|---|
| `CLAUDE.md`, "Failure log" | The log is a section of this file, and every entry is kept in full | Decision 1 moves the full text to `docs/failure-log.md`. `CLAUDE.md` keeps the heading, the instruction to add entries, and the digest |
| The PR template and `CONTRIBUTING.md` | "an entry in `CLAUDE.md`'s failure log" | The wording follows the file |
| About 45 mentions in 30 files | Code comments and READMEs that say "(failure log)" | They still name the right thing. The few that say `CLAUDE.md` by name are updated |
| `.claude/skills/new-component` and `design-review` | Read the log as part of their checks | Pointed at the new file |
| `ci-scope.mjs` | `CLAUDE.md` and `docs/*.md` are docs-only | Unchanged. The new file is docs-only too |

No rule, token, component or test changes. No entry is deleted or reworded.

## Measured

| | Words |
|---|---|
| `CLAUDE.md`, whole file | 12,814 |
| Its rules: summary, non-negotiables, structure, naming, components, preferences, capabilities | 2,452 |
| Its failure log | 10,362, which is 80% of the file |
| `docs/design-system.md` | 31,754 |
| `tools.md` | 7,853 |

The log has 120 entries. The median entry is 83 words, the longest 218, and 9 run past 150. 57 carry a "found" date: 37 from October 2026 and 20 from November so far.

By a keyword count, which is rough:

- **32 entries name a test or a lint rule that now holds them.** The other 88 are prose only.
- **45 are about tests and CI,** 23 about Tailwind and CSS traps, 14 about tokens, colour and type, 9 about Base UI and shadcn, 9 about process and docs, and the rest don't sort cleanly.
- **10 name a font, palette or app that has since been replaced** (Inter, Archivo, Tailwind's ramps, `apps/journey`). Most carry a note saying so.

## The problem

**The file that states the rules is four-fifths case history.** `CLAUDE.md` is loaded at the start of every agent session, and reloaded when it changes: during the session that wrote this review, it arrived three times. The ten non-negotiable rules are about 400 words of it. An agent, or a person, looking for "may I add a token?" has to find it in a document that is mostly the story of a fake clock and a DNS outage.

**Reading the log has not stopped repeats.** Two entries added on 2026-11-10 are repeats of earlier ones: a focus ring without `outline-solid`, and `truncate` on a flex element. Both first entries were in the file, in full, in every session that wrote the repeating code. The second entry's own conclusion is that "a logged mistake stays fixed only where a test or a gate holds it".

**Entries are written for the day they happened, not for lookup.** Each one tells what shipped, how it was found and what was done. The reusable part, the rule, is usually its last sentence. Nothing groups entries, so the three about a transparent border counting as geometry sit 30 entries apart.

**The log only grows.** It gained 20 entries in the first eleven days of November. At that rate the file doubles in about four months.

## Decision 1: the log moves, and a digest stays

`docs/failure-log.md` takes every entry, unchanged and in order, with the note about pre-2026-10-23 paths.

`CLAUDE.md` keeps the section, and under it one line per live entry: the rule, in the imperative, grouped by topic. Each line is what an agent needs before it writes code. The story is one file away for when a line is not enough.

**What a digest line looks like.** Four entries as they are now total 301 words: the focus ring that never painted, `truncate` on a flex heading, the label one pixel out of line with a `Button`, and the `Switch` inset. As digest lines, with the last two merged because they are one rule:

> **Tailwind and CSS traps**
>
> - `outline-none` beside an `outline-[length:…]` utility paints no ring. Add `outline-solid` under the same variant, whatever the variant is (`focus-visible:`, `focus-within:`, `data-[…]:`).
> - `truncate` does nothing on a `display: flex` element. Put it on a block child.
> - A transparent border is still geometry. A label that must line up with a `Button`'s text needs the border as well as the padding, and a 2px inset beside a 1px border is 3px.

That is 69 words for the four.

**What it would come to.** At about 25 words a line, 120 lines are 3,000 words. `CLAUDE.md` would be about 5,500 words, down from 12,814, and the rules would be nearly half of it where they are a fifth today.

**Adding an entry stays one step, in two places.** A mistake ships: write the entry in `docs/failure-log.md`, and add or sharpen its line in the digest. The PR template's checkbox says both.

**The cost, and the risk.**

- The full stories stop being in front of every session. Some of their value is in the detail: the numbers, the wrong first diagnosis. A digest line carries the rule and loses that. An agent that needs it has to open the file, and may not.
- Writing 120 good lines is real work, and a bad line is worse than a long entry: it reads as a rule and may state it too broadly. I would write them in one pass and you would review them as a diff.
- Two files can drift. The digest could keep a line whose entry was corrected.

## Decision 2: mark what a gate holds

In the digest, a line whose mistake a test or lint rule now catches says so, with the test's name: "(held by `switch.spec.ts`)". Those lines can be shorter, because the gate does the remembering, and a reader can tell at a glance which rules rest on memory alone.

The keyword count says about 32 entries are held today. The real figure needs each entry read against the tests, which I have not done.

This can wait: it is a second pass over the same lines.

## Not recommended now: moving history out of the spec

`docs/design-system.md` has the same mix. It holds 229 dates and about 68 paragraphs that open with "decided", "changed" or "corrected", beside the rules those decisions produced. A reader who wants the current rule for the switch reads three weeks of its history to get there.

I would leave it. The history in the spec is doing a job the failure log's is not: it is what stops a settled question being reopened without the side-by-side, and this review leaned on it for every item. Splitting it would also touch nearly every section of a 1,700-line file at once. If decision 1 works, the same pattern, a rule up front and its history a link away, could be tried on one section later.

## What I checked, and did not

The word counts are exact. The topic and "held by a gate" counts are from keyword matches over the entries, not from reading each one, so treat them as rough. The four digest lines are examples I wrote for this proposal: the other 116 are not written. I did not measure how many tokens the file costs a session, only its words, and I have no measure of whether a shorter file is followed better, only the two repeats as evidence that the long one was not enough.

## If approved

1. Create `docs/failure-log.md` with every entry, unchanged.
2. Write the digest in `CLAUDE.md`, grouped by topic, one line per live entry. A superseded entry keeps its place in the log and gets no digest line.
3. Update the PR template, `CONTRIBUTING.md`, the two skills, and the mentions that name `CLAUDE.md`.
4. Decision 2, if taken: read each entry against the tests and mark the held ones.
5. Nothing renders differently, so no screenshots. The change is Markdown and is docs-only for CI.
