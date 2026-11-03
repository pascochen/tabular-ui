# Kasane app: pages spec

Written 3 November 2026, against `main` at `e59504f`. Corrected the same day against `7aef229`, after a review of the demo's code and data; only one line of `apps/demo` changed between the two. It goes with `docs/kasane-app-sidebar-spec.md`. This is the source for the Claude Code build prompt, one section per page.

## Read first

**This reworks `apps/demo`. It isn't a new app.** The demo at demo.tabularui.com already has:
- the shell and URL views (`src/lib/view.ts`), including `?at=end`, which opens the end state
- the store (`src/lib/close-state.ts`)
- the fixed timeline (`src/lib/timeline.ts`)
- the hero decision in the revenue cut-off thread (`HeroThread`), with `useDecisionInView`, which lands the decision on a phone, and `useExceptionLink`, which lands a link to a finding
- Skip to the end and Start over
- `ExceptionCard`, `ExceptionStatus`, `ClosePanel` and `DemoBanner`

Keep all of these and reshape them. Don't rebuild them.

Before writing code, Claude Code reads:
- `CLAUDE.md`
- `docs/design-system.md`
- `docs/components.md`
- `docs/agent-voice.md`
- `apps/demo/README.md`
- `docs/reviews/demo-first-pass-2026-10-30.md`, for what the user tests found
- `kasane-close-demo-plan.md`, if it's available

`kasane-close-demo-plan.md` isn't in the repository. If it isn't pasted into the build prompt, go without it.

**The data comes from the dataset, which lives outside the repo.**
- The copy is authored in the dataset's `onboarding/close-demo.json`.
- Each finding's `claim`, `evidence` and `sources` are written in `apps/demo/scripts/export-fixtures.mjs`, not in `close-demo.json`.
- The script turns both into `apps/demo/data/*.json`. Rebuild with `KASANE_DATA_DIR=/path/to/kasane pnpm --filter tabular-ui-demo export-fixtures`.
- Never hand-edit the generated JSON, and never hand-type a figure. Every figure is a `{token}` the script fills from the data.
- Phase 1 needs the dataset folder on Pascal's Mac.

## Decisions needed before the build

Each decision has a default. The build goes with the default unless Pascal says otherwise.

**D1. Agent names and `docs/agent-voice.md` rule 1.** Rule 1 allows one actor word, "AI". The 2026-10-30 review chose "AI" for a single agent, and noted that two agents named "AI" couldn't be told apart. Four named agents break the rule as written.
- *Default:* widen rule 1 from "AI" to "role word + AI": **Cut-off AI, Payments AI, Approvals AI, Credit AI**.
- "AI" stays the actor and comes last, so every name still says what it is. There's no separator glyph in the name.
- Authorship labels keep their fixed form, role then state: "Cut-off AI · Awaiting your answer" (agent-voice.md, *Fixed strings*). `AgentBlock`'s `authorship` is one string, so the middle dot stays there. The no-middle-dot rule under *Shared rules* doesn't apply to authorship labels.
- The rule change goes into `docs/agent-voice.md` with the date, before any code.

**D2. Daisuke replaces Mei as the visitor.** This changes authored copy in `close-demo.json`, and the claims in `export-fixtures.mjs`.
- *Default:* `visitor` becomes E0010 Daisuke Onodera. Mei moves to the teammates.
- Today `controller` *is* Daisuke, so each `controller` reference gets its own call. Don't remap them all one way:

  | Where | Becomes |
  |---|---|
  | Revenue cut-off's reply: "Logistics confirms it left Tsukuba on 1 Oct. The cut-off review missed it." | Shun Morimoto (General Ledger Accountant, E0019) |
  | Self-approved entry's reply: "Fiona has reversed it in October, and the UK approval rule now blocks self-approval." | Shun |
  | Self-approved entry's `resolution.by` | Shun. Left on Daisuke, the timeline would resolve it in the visitor's name while he does nothing |
  | `agent.setUpBy` | The visitor: the agents are "set up by you" |
  | Close length's reply and resolution | Dropped with the finding (D3) |
  | The `channels` members and `directMessages` | Rebuilt for the new channels and DMs (§2, §6) |

- **The visitor is the person two findings contradict.** Revenue cut-off and self-approved entry rest on what the controller said in `03_interview_controller_2026-10-13.txt`, and the controller is Daisuke. Their claims move to the second person:
  - "You said the September 2026 cut-off was clean, in the controller interview on 13 Oct."
  - "You said every manual journal has a different approver, enforced group-wide."

  The agents check what you told them during onboarding against the books. That's the story, so say it plainly. The claims change in `export-fixtures.mjs`, which writes them; the period stays a token.
- The hero question stays as written: "September is locked. Where should the ¥42.7m correction go?" Reopening a locked month is a controller's call.

**D3. The two findings that are resolved at landing** (close length, Europe on plan) don't belong to any of the four agents.
- *Default:* drop them. The demo then runs 4 findings, and the progress figure becomes "N of 4", 0 at landing.
- If they're kept instead, they need an owning agent, and none fits.

**D4. What the Tasks count counts.**
- *Default:* contradictions whose status is `open`: 4 at landing. `waiting` isn't counted, because nobody here can settle it.
- The visitor decides one of the four, the revenue cut-off. Teammates settle the other three on the timeline. So the heading is "Open", not "Needs a decision", and the hero's row says whose it is with its "Needs your answer" badge.
- After Skip to the end the count is 0. Three are resolved, and the credit limit is waiting on Legal.
- Gaps (8) and questions (10) are listed in the inbox, uncounted, under their own headings.

**D5. The landing view.**
- *Default:* #revenue, with the hero decision on screen. `/` and `?view=revenue` both open it. Tasks is one click away, with its count in the sidebar.
- Why: in the 2026-11-02 user tests, every tester missed the decision, even with it on the landing screen. The fix put it first and visible at 1280×720, and nobody has retested it. Landing on an inbox of 22 items puts the decision a click further away.
- On a phone, `useDecisionInView` keeps landing the decision clear of the composer, as it does in #sep-close today.
- *If Tasks lands instead:*
  - the hero's row sorts first, with "Needs your answer"
  - under 1024px nothing opens on load, because the panel is `PanelSheet`, a dialog
  - the other channels stay still until the hero is decided (§2, *Timeline*), so a visitor who opens #payables first sees nothing happen

**D6. Which files the binder holds.**
- *Default:* every file cited by a contradiction, a gap or a question, or named in an agent's Reads list: 18 files. A gap's or a question's files are then always in the binder.
- `trial_balance_monthly.csv` and `company_profile.md` aren't in it. Once D3 drops Europe on plan, nothing cites them.
- The exhibit IDs this gives:
  - transcripts: S-1 to S-6
  - documents: S-7 to S-11 (the PNG org chart sorts with the documents)
  - CSVs: S-12 to S-18, with the sales invoices at **S-17**
- *Alternative:* only the four contradictions and the Reads lists: 8 files, with the sales invoices at S-7. There's less to export, but a gap's sources aren't in the binder.

**D7. The period switcher.**
- *Default:* no switcher. The header shows the company name with "October 2026, open" beneath it, static, like the footer.
- Why: tasks aren't filtered by period and threads stay readable, so choosing September would only disable a composer that nobody replies to. A control that changes nothing visible reads as broken.
- The reopen still shows: #close's panel gains a status line, "Locked 8 Oct 2026, business day 6", which reads "Reopened 16 Oct 2026" after "Reopen September".
- *Alternative:* the menu in §8. The hero's `Question` then stays answerable while September is selected, since reopening September is the one change a locked month allows.

## Shared rules for every page

- Every sidebar item is a real link to a built view. A view that isn't built isn't in the sidebar.
- URLs extend the current scheme:
  - `?view=tasks`, `?view=search&q=`, `?view=sources&source=S-17&record=INV-KJP-2609-00363`, `?view=<channel-id>`, `?dm=<member-or-agent-key>`
  - `?at=end` with any of them
  - `/` opens #revenue (D5). The old `?view=sep-close` and `?view=open-items` open the default, as `?view=rev-check` does today.
- Agent output always renders in an `AgentBlock`, with its parts inside: `Tool`, `Sources`, `InlineCitation`, `Question`, `Confirmation`. Agent messages in a channel use `ChannelMessage` with `authorship`.
- Nobody replies to what the visitor types. The existing System note stays.
- **Copy:**
  - Subjectless for system strings, "I" inside an agent's block.
  - No marketing words. No middle-dot separators in new copy, except authorship labels (D1).
  - The user row shows name and title on two lines, replacing the current "·".
- Start over and Skip to the end reset or finish every new piece of state: decisions, task status, unread marks and source switches.
- Under 1024px the right panel is the existing `PanelSheet` dialog. It opens when the visitor asks for it, never on load.

---

## 1. Tasks: build

**Job:** the inbox. Every finding is listed here, with the way to the channel that holds it. It's one click from landing (D5).

**Main area:** one list, grouped under three headings. Every row shows: no "Show more", and no filter chips, since the headings already do that job.
- **Open (4).** The contradictions from `close.json`'s `exceptions`, with the hero first:

  | Finding | Agent | Channel | Entity and period |
  |---|---|---|---|
  | Revenue cut-off | Cut-off AI | #revenue | KJP, Sep 2026 |
  | Duplicate payment | Payments AI | #payables | KUS, Jul 2026 |
  | Self-approved entry | Approvals AI | #close | KUK, Aug 2026 |
  | Credit limit | Credit AI | #receivables | KUS, up to Sep 2026 |

- **Gaps (8)** from `findings.json`'s `gaps`.
- **Questions (10)** from `findings.json`'s `followUps`.

Each contradiction's row shows:
- the title
- the one-line summary
- which agent raised it, as an actor label
- its channel
- its entity and period
- its status, from `ExceptionStatus`

**Status** is `ExceptionStatus`, which maps the store's three states to `StatusBadge`. There's no "decided" state.

| Store | Badge |
|---|---|
| `open` | "Open" (needs review). The hero reads "Needs your answer" while its question waits |
| `waiting` | "Waiting" (queued): the credit limit, once it waits on Legal |
| `resolved` | "Resolved" (passed) |

**Gaps and questions** have only an ID, one sentence and their sources. A row shows the sentence, like `#open-items` today, with its sources as exhibit IDs that link to the binder. A gap linked to a channel (§2) shows the channel. There's no title, summary, agent, entity, period or status, because the data has none. These rows aren't selectable: the sentence is the whole item.

**Right panel:** the selected contradiction, inside the raising agent's `AgentBlock`:
- the claim: what a person said, in the second person where the visitor said it (D2)
- the evidence: what the books show, with `InlineCitation`s
- `Sources`, with the required "not checked" list from the finding's `notChecked`
- the link "Open in #revenue" (or whichever channel holds it)

**Behaviour:**
- Selecting a row updates the URL (`?view=tasks&task=revenue-cut-off`).
- Status comes from the store, so a decision made in #revenue shows here.
- The sidebar count is derived from the store (D4).

**States:**
- At landing: 4 open, with the hero first and "Needs your answer".
- After Skip to the end: 0 open. Three are resolved, and the credit limit is waiting.
- With nothing open: the list stays, each row with its status, and the heading reads "Nothing open."

**Components:** `DataTable` (as `#open-items` uses today), `StatusBadge` through `ExceptionStatus`, `CountBadge`, `AgentBlock`, `Sources`, `InlineCitation`, `EmptyState`.

**Replaces:** `#open-items`, which is absorbed here and removed.

## 2. Channels: build

**Job:** the conversation around each area of the books. Findings are posted here and decided in their threads.

**Channel contents:**

| Channel | Holds | Proposed members |
|---|---|---|
| #close | Self-approved entry (open). The close panel moves here | Daisuke, Shun, Mei, Approvals AI |
| #cash | Nothing open; the `cash-forecast` gap is linked | Daisuke, Mei |
| #receivables | Credit limit (open) | Daisuke, Yui Matsuda, Marcus Bell, Credit AI |
| #payables | Duplicate payment (open) | Daisuke, Kenta Ishiguro, Payments AI |
| #revenue | **Revenue cut-off, the hero** (open). The landing view (D5) | Daisuke, Shun, Nanami Okabe, Mei, Cut-off AI |
| #intercompany | Nothing open; the `transfer-price-policy` gap is linked | Daisuke, Mei |

The owners come from the dataset's `docs/08_finance_team.md`. The member lists above are proposals, taken from the job titles in `people.json`. Each channel's topic, owner and members are authored in `close-demo.json` (build step 1). The wireframes' "[Channel topic]" and owner placeholders stand for them.

**Main area:**
- Each finding is an agent message (`ChannelMessage` with `authorship`, "Cut-off AI" and so on), with an `ExceptionCard` body and replies underneath.
- The **#revenue** thread keeps `HeroThread` as built: the tool line reading the delivery note, then the `Question` with its two options, then the proposed entry. `useDecisionInView` and `useExceptionLink` move with it.
- **Timeline.** It still starts only once the hero is decided (`useTimeline` waits on `decided(state)`), so until then the other channels hold only their findings. Its replies now post across channels. When a teammate replies in #payables while the visitor is in #revenue, the sidebar marks #payables unread.

**Sidebar marks.** Two signals, one mark each:
- **A dot** marks a channel holding an `open` contradiction. It clears when that finding is resolved or starts waiting, in step with the Tasks count.
- **Unread:** a channel with a reply the visitor hasn't seen shows its name in `--color-text-primary` instead of `--color-text-secondary`, at regular weight, with ", unread" for screen readers. Opening the channel clears it. Everything posted before landing counts as read.
- Unread isn't semibold, because `AppShellNavItem` already draws the active item semibold in `--color-text-primary`, and a bold unread name would look selected.
- `AppShellNavItem` has no unread state today. Adding one is a product-component change: write it in its README and stories. It needs no new token.

**Right panel:**
- On `#close`: the existing `ClosePanel`, plus the status line from D7.
- On other channels: details, meaning the topic, owner and members (`PresenceStack`) and the tasks this channel holds.

**Quiet channels:** #cash and #intercompany show their topic, an `EmptyState` ("Nothing open in #cash"), and the linked gap as a task row.

**Composer:** `ChatComposer`. Under D7's alternative, it's disabled while September is selected, with "September is locked."

**Removes:** `#sep-close`, whose findings are split across the channels above. `#rev-check` and Home were planned but are dropped.

## 3. Agents: build

**Job:** show that each agent is a specialist with a narrow scope: what it checks, what it reads and what it never does.

Each agent opens as a direct-message view (`?dm=cutoff-ai` and so on).

**Right panel, the profile:** the current agent profile, split per agent.
- **Checks:** one line on what this agent does.
- **Reads:** its sources, each linked to its exhibit in the binder. A source switched off in Sources shows here as "Not read: turned off in Sources".
- **Never:** the shared list from `close.json`: posts an entry, changes a locked period, messages anyone outside the channel.
- **Set up by:** you.

Proposed scopes, taken from each finding's `sources`:

| Agent | Checks | Reads |
|---|---|---|
| Cut-off AI | Revenue lands in the month of delivery | `sales_invoices_2026-09.csv`, `close_calendar.md`, `accounting_policies.md`, the controller interview |
| Payments AI | Nothing is paid twice | `supplier_invoices_fy2026_h1.csv`, the AR and AP interview |
| Approvals AI | Every manual entry has a different approver | `manual_journal_entries_fy2026_h1.csv`, the controller interview |
| Credit AI | Customers stay within their credit limit | `ar_aging_monthly.csv`, the AR and AP interview |

**Main area:** the agent's run as one `AgentBlock`.
- A `ToolGroup` summary, for example "Read 2 files", that folds out to one `Tool` line per source.
- Its finding in short form, with a link to the task.
- Under that, `ChatStarter` with two suggested questions. That's 8 scripted answers in all, authored in `close-demo.json`. Each has every figure as a token, its own `Sources`, and its "not checked" list, which `Sources` requires (agent-voice.md, principle 4). Anything typed freely gets the existing System note.

**Components:** `AgentBlock`, `Tool`/`ToolGroup`, `ChatThread`, `ChatStarter`, `ChatComposer`, `Sources`, `InlineCitation`.

## 4. Sources: build

**Job:** the binder. Every file the findings rest on, so a reviewer can follow a citation to the record.

**Data:**
- The export script writes `sources.json`, holding the files D6 names, deduplicated.
- Each source gets an exhibit ID (S-1, S-2, …) in a fixed order: transcripts first, then documents (the PNG sorts with them), then CSVs, each alphabetical. The same dataset always produces the same IDs. D6 lists them.
- Each source records:
  - its name and kind (CSV, transcript, document, image)
  - the entity and period it covers
  - its total rows or lines
  - its cited records
- It also carries an excerpt. Repo size and the "trimmed fixtures only" rule rule out full files.
  - **CSV:** the cited record plus up to 10 rows either side. When a finding cites several records that aren't next to each other, like the credit limit's months of Great Lakes balances, the excerpt is the file's rows for that customer instead, and the count says so.
  - **Transcript:** the cited lines plus up to 5 either side. The claims are paraphrases, so `close-demo.json` gives each finding's line range in its transcript, and the export script stops if a range doesn't exist, as its other `must()` checks do.
  - **A file with no cited record** (one in a Reads list, or one only a gap or question names): its first 21 rows, or its first section, with the same honest count. `close-demo.json` can name the section a Reads file is read for, such as the revenue section of `accounting_policies.md`.
  - **Image:** no excerpt. It shows the `EmptyState`.

**Main area:** the binder, two columns at 1024px and wider.
- **Tabs:** one row per source, with the ID, name and kind. It's a list of links, not the `Tabs` component, since there are too many for one row.
- **The open source:**
  - A header with the ID, name, what it covers and the "Agents read this" `Switch`.
  - A CSV excerpt renders in `DataTable`, with the cited record's row highlighted. The highlight is state, so it uses the state treatment, not a new hue.
  - A transcript renders as text, with the quoted lines marked.
  - Above every excerpt is an honest count, such as "Showing 21 of 4,310 rows".

**Citations:**
- `InlineCitation`'s popover shows the file name, then the exhibit ID and the record in `locator`: "S-17, INV-KJP-2609-00363".
- It links to `?view=sources&source=S-17&record=INV-KJP-2609-00363`. Opening that URL selects the tab and scrolls to the record.
- That link needs a new prop. `Source.href` is one link per file, and `InlineCitation` takes the same `Source` object as its `Sources` row, so the object can't carry one citation's record. Adding the prop is a product-component change: write it in the component's README and stories, and add no token.

**"Agents read this":** each source's switch is on by default. Turning it off:
- removes the source from every agent's Reads list, where it shows as "Not read: turned off in Sources"
- adds a line to the "not checked" list of every finding that cites it: "S-17 is turned off, so this can't be rechecked."
- leaves no figure changed, because the findings are already made

Start over turns every switch back on.

**Components:** `AttachmentRow` for tab rows if it fits, `DataTable`, `Switch`, `Field`, `InlineCitation`, `EmptyState` (for a source with no excerpt).

## 5. Search: build last, cut if time runs short

**Job:** find anything in the workspace by its record ID or a name. This is also the reviewer's second way to reach the evidence.

**Behaviour:**
- Client-side matching over the fixtures. It's case-insensitive, and matches anywhere in the text.
- It covers tasks (title and summary), sources (ID, name and cited records), messages (body text) and people (name and title).
- Results are grouped as Tasks, Sources, Messages and People, with a `FilterChip` for each group.
- Each result links to its view.
- There's no AI answer and no ranking beyond the groups.

**States:**
- With no query: three suggested searches from the data, for example "MFL-58821", "Great Lakes" and "cut-off".
- With no results: "Nothing matches 'xyz'."

**Components:** `Input`, `FilterChip`, `EmptyState`, `TruncatedText`.

## 6. Direct messages: keep as built

Mei Tachibana and Kenta Ishiguro each open on the existing empty state, with the member's profile in the right panel. Mei's replaces Daisuke's, now that he's the visitor. Nothing else is new here.

## 7. The user row: no page

The footer stays static, as now: it shows who the visitor plays, Daisuke Onodera, Group Controller, on two lines. It isn't a menu, and there's no settings page or `AccountMenu`, which would need working handlers for profile, billing and sign-out that the demo can't honour.

## 8. Header: build, with the sidebar

- Replace the static `SidebarHeader` with the company name, plus "October 2026, open" beneath it in `--color-text-secondary`. There's no chevron and no menu (D7).
- After "Reopen September", #close's panel status reads "Reopened 16 Oct 2026" (D7).

**Under D7's alternative**, the header gets the switcher instead:
- The chevron opens a `Menu` with two periods: October 2026 (open) and September 2026 (locked 8 Oct).
- Choosing September makes the workspace read-only: composers are disabled with "September is locked." Tasks and threads stay readable, and the hero's `Question` stays answerable.
- A "Reopen September" decision in #revenue changes the September item to "September 2026, reopened".
- Start over resets the period to October.

---

## Build order

1. **Data.** Settle D1 to D7. Update `close-demo.json`:
   - the visitor swap, with each `controller` reference as D2's table sets it
   - the four agents and their scopes
   - the channel for each finding, and each channel's topic, owner and members
   - the gaps linked to #cash and #intercompany
   - each finding's transcript line range (§4)
   - the 8 scripted starter answers, each with its sources and "not checked" list

   Then extend `export-fixtures.mjs`: the second-person claims (D2), `sources.json` and the new fields. Update `apps/storybook/tests/close-data.spec.ts`, and `close-state.spec.ts`, which asserts 2 of 6 resolved at landing and a log of the two dropped findings.
2. **Sidebar, header and views.** Add the new view kinds to `view.ts`, keep `?at=end`, and point `/` at #revenue. Sidebar order follows the sidebar spec.
3. **Tasks.**
4. **Channels.** Split `#sep-close`, move `HeroThread` to #revenue with `useDecisionInView` and `useExceptionLink`, make #revenue the landing view, and post the timeline across channels with unread marks.
5. **Agents.** The four agent views.
6. **Sources.** The binder, switches and exhibit citations.
7. **Search,** if there's time.

Each step ends with the `docs/design-system.md` §10 verification checklist, `pnpm lint`, `pnpm test` and `pnpm test:playwright`, and is its own PR.

## Out of scope

- Live LLM answers. Every agent line is scripted from the data.
- A settings or profile page.
- Home and `#rev-check`.
- An entity switcher, and a period switcher unless D7's alternative is chosen.
- A phone layout beyond the existing panel dialog.
- New tokens, a sixth hue or new foundational components. Anything that seems to need one stops and asks.
