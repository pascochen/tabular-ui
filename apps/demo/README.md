# Demo: the Kasane app

The public demo at [demo.tabularui.com](https://demo.tabularui.com): a finance workspace for an AI finance tool, laid out as a team chat, built from Tabular UI. It replaces the onboarding journey, which is kept at the tag `demo-part-1`.

**Being reworked** into a workspace with Tasks, six channels, four specialist agents, Sources and Search, one step per PR. Step 1 is the data: the four findings, the agents, the channels, the visitor swap and the documents. Step 2 is the shell: every view kind in the URL, the sidebar in its final order, and the header and footer on two lines. Step 3 is Tasks, which absorbs `#open-items`. Step 4 is the six channels, which replace `#sep-close`. Step 5 is the four agents. Step 6 is Sources. Step 7 is Search. The sidebar holds only built views, so each step adds its items.

**Being built in phases** (`kasane-close-demo-plan.md` §6). Phase 2 is the shell: the sidebar, view switching by URL, and the right panel's place in each view. Phase 4 is `#sep-close` in its landing state: six exception cards, the decision first, and the close panel. Phase 5 is the decision in the Revenue booked early thread (`src/components/HeroThread/README.md`). Phase 6 is the timeline: once the visitor decides, the teammates reply and resolve in the background, and the run ends at 3 of 4. Phases 0–6 are the demo. Only built views are reachable, and old URLs (`?view=sep-close`, `?view=open-items`, `?view=rev-check`) open New chat, the landing page. Replies now land in the channel that holds the finding, and the sidebar marks that channel unread. Each direct message opens on an empty state with the member's profile.

**The timeline** (`src/lib/timeline.ts`) is one list in one fixed order, built from `close.json`'s delays, so every run plays the same. `src/lib/timeline-script.ts` plays it one event at a time.
- It pauses while the tab is hidden, and the waiting event starts its gap again on return.
- Under reduced motion it applies everything at once, with no typing indicators.
- Only one timer exists at a time, so none outlives a view.

**Skip to the end** and **Start over** sit at the foot of the sidebar and work at any point. Skip finishes the decision as "Choose for me" would, unless the visitor already answered, then applies every event left. `?at=end` opens on the end state.

**One store.** `src/lib/close-state.ts` holds each exception's status and replies, the decision log and each check's figure. The panel, the tiles and the sidebar's open count are derived from it.

## Playing it

A visitor plays Daisuke Onodera, Group Controller at **Kasane Corporation**, a fictional Tokyo printer maker. The people in the channel and the agents are scripted, and every figure they quote comes from the generated data (below). Each finding states the rule its check applies, then what the books show.

- **Views by URL, with no router.** `/` is New chat, where the visitor lands (since 2026-11-12; `#revenue` until then). `?view=revenue` and the other five channels, `?view=tasks` with `&task=` for a selected finding, and `?dm=fpaHead|apLead` for a direct message, or `?dm=cutoff-ai|payments-ai|approvals-ai|credit-ai` for an agent. `?view=sources` with `&source=sales-invoices&item=revenue-cut-off` for a finding's records in a file. `?view=search` with `&q=` for a query. Every sidebar item is a real link, so it opens in a new tab and Back works. `src/lib/view.ts`.
- **The right panel follows the view**: the close panel in `#close`, a channel's details in the others, the member's profile in a direct message, the selected finding in Tasks.
- **Each agent is a specialist** (`src/views/AgentView.tsx`): its run as one `AgentBlock`, the files it read folded behind "Read N files", its finding with a link to the task, and two suggested questions. A post that matches a question gets that scripted answer, with its sources and what wasn't checked. Anything else gets the System note. The profile says what it checks, what it reads, what it never does and who set it up.
- **Sources** (`src/views/Sources.tsx`): every file the findings rest on, so a reviewer can check a finding against its record. Each has a trimmed extract with an honest count. A finding's `Sources` row opens the file with its records selected and scrolled to, and browsing to the same file selects nothing. A file says which findings use it, as the way back. Turning "Agents read this" off marks the file "Not read" in every agent's profile, and adds a line to the "not checked" list of every finding that rests on it. No figure changes, because the findings are already made, and Start over turns every switch back on. Since 2026-11-12 (`docs/reviews/sources-2026-11-12.md`): opened from a finding, the file shows that finding over its records, in the agent's `AgentBlock`: what the books show, the rule and what wasn't checked. Under it the page says how much of what's shown the finding rests on and what the extract leaves out, so a claim about the whole file doesn't read as proved by a short extract, and the button to the thread is the primary "Answer in #revenue" while the visitor owes an answer. The landing scroll moves only as far as it takes to show the first selected record, so the finding stays in view. Beside the switch, a line says who reads the file and which findings rest on it, and once it's off, what can't be rechecked. The list names each file's reader and says "Off" for a file that's switched off (`src/lib/source-facts.ts`).
- **Search** (`src/views/Search.tsx`, `src/lib/search.ts`) matches case-insensitively anywhere in the text: tasks by title and summary, sources by file name, what they cover and anything in their extract, messages by body, people by name and title. Results group under those four, with a `FilterChip` per group, and each links to its view. A hit inside a finding's records opens that file with them selected. There's no AI answer and no ranking beyond the groups. Messages are read from the store, so a reply that hasn't landed isn't found.
- **Two sidebar marks, one each.** A `StatusDot` marks a channel holding an open finding, in step with the Tasks count: solid ochre if it waits on the visitor, a hollow ring if it doesn't (§5). Unread is a channel with a reply the visitor hasn't seen: its name steps up to `--color-text-primary` at the nav's resting weight, and opening it clears the mark. Everything posted before landing counts as read, and Skip leaves what it applied unread, because nobody has seen it.
- **Tasks is the inbox** (`src/views/Tasks.tsx`): the four findings, with every row showing. Its count is the open findings: 4 at landing, 0 at the end, with the credit limit waiting on Legal. Since 2026-11-12 it says whose move each finding is (`docs/reviews/tasks-2026-11-12.md`). The heading counts every unsettled state, so the end reads "Nothing open. 1 waiting." Each row has a line for what happens next or how it ended: the question while it waits on the visitor, what the agent is reading, the proposal to confirm, the last reply, what it waits on, or who resolved it and when. An open finding nobody has replied to has no such line, because the data names no owner. The row also counts what the agent didn't check. The status has a word for each step of the decision (`taskStep` in `src/lib/close-state.ts`), where "Open" used to cover the agent reading, the check rerunning and a skipped question. The panel leads with the status and the outcome, shows the question and what each option does, and its button is the primary "Answer in #revenue" while the visitor owes an answer. The decision itself stays in the thread. Rows keep the data's order, so none moves as it resolves. With no `&task=` the panel shows the first finding. With one that matches no finding it selects no row and says so. A finding's row folds its agent, channel, entity and period into one cell, because five columns don't fit the 552px main keeps at 1280 beside the panel.
- **Nobody replies to what the visitor writes.** The first post gets a one-line note from System that says so, and each post scrolls the channel to its foot, where it lands. The note is derived from the post, so Start over clears it.
- **Under 1024px the panel is a dialog** (`src/shell/PanelSheet.tsx`), opened from a button in the page header, or by selecting a row whose detail it shows. Never on load. `AppShell`'s panel pushes main at every width and is 440px, so at 375px main measured 0 and the decision couldn't be seen. Beside the panel, main is 583px at 1023px and narrower than a 375px phone from 815px. A dialog covers main instead, so the channel keeps its width, its scroll and anything typed. 1024px and wider are unchanged. This is enough to follow the story on a phone, not a phone layout: pinning the sidebar at 375px still leaves main 135px, and the proposed entry's table scrolls inside its card.
- **The four agents are role word + "AI"**: Revenue AI (Cut-off AI until 2026-11-12), Payments AI, Approvals AI and Credit AI, in every message header, as `docs/agent-voice.md` rule 1 allows since 2026-11-03. The word was "AI" alone while there was one agent (`docs/reviews/demo-first-pass-2026-10-30.md`).
- **About this demo** says what is fictional, scripted and real. It sits at the foot of the sidebar, and in the top nav while the sidebar is collapsed. The top nav shows only then; see `DemoActions`'s README.

## Data

`data/` holds small JSON files, only what the screens read: `company.json`, `people.json`, `close.json`, `checks.json` and `documents.json`. They are generated; never edit them by hand.

`documents.json` holds the 9 files a finding rests on or an agent reads, text files then tables, each alphabetical. Each has a `slug`, its `file` name, what it's `about`, its `size`, and a trimmed extract with the counts of what was left out: `text` or `table`, never both. A document knows nothing about the findings: a finding's `refs` in `close.json` say which lines or rows it rests on. Full files stay out, for repo size.

The copy is authored in the dataset, in `demo/close-demo.json`: the agents and their suggested answers, the channels, each finding's replies and the document lines its rule rests on, the hero question and the proposed entry's wording. Each finding's `rule`, `evidence` and `sources` are written in `scripts/export-fixtures.mjs`. Every figure is a `{token}` the export script fills from the data, and its people are employee ids. The script stops on an unknown token, a person who isn't in the employee list, an unbalanced entry, an account missing from the chart of accounts, or a line range that doesn't exist or no longer holds the words it's cited for. `apps/storybook/tests/close-data.spec.ts` checks the generated files against each other, since CI has no dataset.

The full Kasane dataset is kept outside this repository. To rebuild the fixtures from it:

```bash
KASANE_DATA_DIR=/path/to/kasane pnpm --filter tabular-ui-demo export-fixtures
```

`KASANE_DATA_DIR` is the dataset's root, the folder holding `01_master_data/` through `05_reporting/`, `docs/` and `demo/` (`close-demo.json`). The script also rewrites the story fixtures in `packages/ui/src/fixtures/kasane.ts` and the site's `apps/site/data/kasane.json`, and stops if the data no longer supports a finding. On an unchanged dataset it produces no diff.

## Running it

From the repo root:

```bash
pnpm dev
```

That builds the package, then runs the demo with the package rebuilding on change. `pnpm build:demo` builds it for production; build the package first (`pnpm build:ui`).

`public/og.png`, the social image, is a screenshot of that build. Nothing fails when it goes stale, so run `node apps/demo/scripts/og-image.mjs` after a build whenever the landing screen, the sidebar or the data changes.

## How it uses Tabular UI

Like any app that installs the package: every component comes from `tabular-ui`, never by a path into `packages/ui/src`, and type-checking goes through the package's built declarations. `src/index.css` imports `tabular-ui/styles.css` and adds the `@source` line that lets Tailwind see the package's classes.

`src/components/` holds what only this app needs: `DemoActions`, `ExceptionCard`, `ClosePanel` and `HeroThread`. `src/shell/` is the sidebar and member avatars, and `src/views/` what each view puts in the shell's slots.
