# Demo: the Kasane app

The public demo at [demo.tabularui.com](https://demo.tabularui.com): a finance workspace for an AI finance tool, laid out as a team chat, built from Tabular UI. It replaces the onboarding journey, which is kept at the tag `demo-part-1`.

**Being reworked** into a workspace with Tasks, six channels, four specialist agents, a Sources binder and Search, one step per PR. Step 1 is the data: the four findings, the agents, the channels, the visitor swap and the binder's `sources.json`. Step 2 is the shell: every view kind in the URL, the sidebar in its final order, and the header and footer on two lines. Step 3 is Tasks, which absorbs `#open-items`. Step 4 is the six channels, which replace `#sep-close`. Step 5 is the four agents. Step 6 is the Sources binder. Step 7 is Search. The sidebar holds only built views, so each step adds its items.

**Being built in phases** (`kasane-close-demo-plan.md` §6). Phase 2 is the shell: the sidebar, view switching by URL, and the right panel's place in each view. Phase 4 is `#sep-close` in its landing state: six exception cards, the decision first, and the close panel. Phase 5 is the decision in the Revenue cut-off thread (`src/components/HeroThread/README.md`). Phase 6 is the timeline: once the visitor decides, the teammates reply and resolve in the background, and the run ends at 3 of 4. Phases 0–6 are the demo. Only built views are reachable, and old URLs (`?view=sep-close`, `?view=open-items`, `?view=rev-check`) open `#revenue`. Replies now land in the channel that holds the finding, and the sidebar marks that channel unread. Each direct message opens on an empty state with the member's profile.

**The timeline** (`src/lib/timeline.ts`) is one list in one fixed order, built from `close.json`'s delays, so every run plays the same. `src/lib/timeline-script.ts` plays it one event at a time.
- It pauses while the tab is hidden, and the waiting event starts its gap again on return.
- Under reduced motion it applies everything at once, with no typing indicators.
- Only one timer exists at a time, so none outlives a view.

**Skip to the end** and **Start over** sit in the top nav and work at any point. Skip finishes the decision as "Choose for me" would, unless the visitor already answered, then applies every event left. `?at=end` opens on the end state.

**One store.** `src/lib/close-state.ts` holds each exception's status and replies, the decision log and each check's figure. The panel, the tiles and the sidebar's open count are derived from it.

## Playing it

A visitor plays Daisuke Onodera, Group Controller at **Kasane Corporation**, a fictional Tokyo printer maker. The people in the channel and the agents are scripted, and every figure they quote comes from the generated data (below). Two of the findings contradict what the visitor said in the controller interview, and the agents say so in the second person.

- **Views by URL, with no router.** `?view=revenue` (the default, `/`) and the other five channels, `?view=tasks` with `&task=` for a selected finding, and `?dm=fpaHead|apLead` for a direct message, or `?dm=cutoff-ai|payments-ai|approvals-ai|credit-ai` for an agent. `?view=sources` with `&source=S-17&record=INV-KJP-2609-00363` for a citation's record. `?view=search` with `&q=` for a query. Every sidebar item is a real link, so it opens in a new tab and Back works. `src/lib/view.ts`.
- **The right panel follows the view**: the close panel in `#close`, a channel's details in the others, the member's profile in a direct message, the selected finding in Tasks.
- **Each agent is a specialist** (`src/views/AgentView.tsx`): its run as one `AgentBlock`, the files it read folded behind "Read N files", its finding with a link to the task, and two suggested questions. A post that matches a question gets that scripted answer, with its sources and what wasn't checked. Anything else gets the System note. The profile says what it checks, what it reads, what it never does and who set it up.
- **Sources is the binder** (`src/views/Sources.tsx`): every file the findings rest on, so a reviewer can follow a citation to the record. Each has an exhibit ID and a trimmed excerpt with an honest count, and a citation's locator links to its record. Turning "Agents read this" off marks the source "Not read" in every agent's profile, and adds a line to the "not checked" list of every finding that cites it. No figure changes, because the findings are already made, and Start over turns every switch back on.
- **Search** (`src/views/Search.tsx`, `src/lib/search.ts`) matches case-insensitively anywhere in the text: tasks by title and summary, sources by ID, name and cited records, messages by body, people by name and title. Results group under those four, with a `FilterChip` per group, and each links to its view. There's no AI answer and no ranking beyond the groups. Messages are read from the store, so a reply that hasn't landed isn't found.
- **Two sidebar marks, one each.** A `StatusDot` marks a channel holding an open contradiction, in step with the Tasks count: solid ochre if it waits on the visitor, a hollow ring if it doesn't (§5). Unread is a channel with a reply the visitor hasn't seen: its name steps up to `--color-text-primary` at the nav's resting weight, and opening it clears the mark. Everything posted before landing counts as read, and Skip leaves what it applied unread, because nobody has seen it.
- **Tasks is the inbox** (`src/views/Tasks.tsx`): the four findings, the 8 gaps and the 10 questions, under three headings, with every row showing. Its count is the open contradictions: 4 at landing, 0 at the end, with the credit limit waiting on Legal. A finding's row folds its agent, channel, entity and period into one cell, because five columns don't fit the 552px main keeps at 1280 beside the panel.
- **Nobody replies to what the visitor writes.** The first post gets a one-line note from System that says so, and each post scrolls the channel to its foot, where it lands. The note is derived from the post, so Start over clears it.
- **Under 1024px the panel is a dialog** (`src/shell/PanelSheet.tsx`), opened from a button in the page header, or by selecting a row whose detail it shows. Never on load. `AppShell`'s panel pushes main at every width and is 440px, so at 375px main measured 0 and the decision couldn't be seen. Beside the panel, main is 583px at 1023px and narrower than a 375px phone from 815px. A dialog covers main instead, so the channel keeps its width, its scroll and anything typed. 1024px and wider are unchanged. This is enough to follow the story on a phone, not a phone layout: pinning the sidebar at 375px still leaves main 135px, and the proposed entry's table scrolls inside its card.
- **The four agents are role word + "AI"**: Cut-off AI, Payments AI, Approvals AI and Credit AI, in every message header, as `docs/agent-voice.md` rule 1 allows since 2026-11-03. The word was "AI" alone while there was one agent (`docs/reviews/demo-first-pass-2026-10-30.md`).
- `DemoBanner`, in the top nav, says all of this in one line; see its README.

## Data

`data/` holds small JSON files, only what the screens read: `pack.json`, `company.json`, `discovery.json` and `findings.json` from the onboarding journey, and `people.json`, `close.json`, `checks.json` and `sources.json` for the workspace. They are generated; never edit them by hand.

`sources.json` is the binder: the 18 files a finding, gap or question cites, or an agent reads, each with an exhibit ID in a fixed order (transcripts, then documents, then CSVs, each alphabetical) and a trimmed excerpt with an honest count. Full files stay out, for repo size.

The copy is authored in the dataset, in `onboarding/close-demo.json`: the agents and their suggested answers, the channels, each finding's replies and the line range it rests on, the hero question and the proposed entry's wording. Each finding's `claim`, `evidence` and `sources` are written in `scripts/export-fixtures.mjs`. Every figure is a `{token}` the export script fills from the data, and its people are employee ids, each of whom must attend an interview. The script stops on an unknown token, a person who isn't in the material, an unbalanced entry, an account missing from the chart of accounts, or a line range that doesn't exist or no longer holds the words it's cited for. `apps/storybook/tests/close-data.spec.ts` checks the generated files against each other, since CI has no dataset.

The full Kasane dataset is kept outside this repository. To rebuild the fixtures from it:

```bash
KASANE_DATA_DIR=/path/to/kasane pnpm --filter tabular-ui-demo export-fixtures
```

`KASANE_DATA_DIR` is the dataset's root, the folder holding `01_master_data/` through `05_reporting/`, `docs/` and `onboarding/` (`transcripts/`, the org chart and `close-demo.json`). The script also rewrites the story fixtures in `packages/ui/src/fixtures/kasane.ts` and the site's `apps/site/data/kasane.json`, and stops if the data no longer supports a finding. On an unchanged dataset it produces no diff.

## Running it

From the repo root:

```bash
pnpm dev
```

That builds the package, then runs the demo with the package rebuilding on change. `pnpm build:demo` builds it for production; build the package first (`pnpm build:ui`).

## How it uses Tabular UI

Like any app that installs the package: every component comes from `tabular-ui`, never by a path into `packages/ui/src`, and type-checking goes through the package's built declarations. `src/index.css` imports `tabular-ui/styles.css` and adds the `@source` line that lets Tailwind see the package's classes.

`src/components/` holds what only this app needs: `DemoBanner`, `ExceptionCard`, `ClosePanel` and `HeroThread`. `src/shell/` is the sidebar and member avatars, and `src/views/` what each view puts in the shell's slots.
