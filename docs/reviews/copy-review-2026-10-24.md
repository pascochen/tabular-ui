# Copy review, 2026-10-24

Written as a report only. The fixes came after, by approval: see Status.

Sources, in order of precedence: `docs/agent-voice.md`, owner decisions in component READMEs, the tabular-ui-copywriter guide ("the guide"), and the Microcopy pass method. Tone follows `agent-voice.md`, not Microcopy pass's "warmer".

Scope: component defaults, `statuses.ts`, fixed strings, stories, the Kasane fixtures, the demo (`apps/demo/src`), registry descriptions, READMEs and `docs/`. The inventory has 1,485 strings, each with file:line, slot, audience and text. It was saved outside the repo, in this session's scratchpad, and can be added on request.

## Status

Updated 2026-10-26, after the owner settled conflicts C1–C3 and approved the foundational change for finding 11.

- **Applied 2026-10-24 (PR #3):** 1, 2, 3, 5, 8, 9, 10, 12, 14, 15, 16, 17, 18, 19, 20, 21.
- **Applied 2026-10-26:** 6, 7, 11 and 13, with C1–C3 settled in `docs/agent-voice.md` as recommended below. Plans in a conversation leave out Run plan and Edit, using `AgentPlan`'s new `showActions={false}`. C2 has one addition: a component's own stories may still show a planned action, if their description says so. Otherwise `AgentPlan`'s and `AgentBlock`'s stories couldn't document their buttons.
- **Settled 2026-10-26:** 4, with Option B. The story keeps its copy, and its description says exporting is planned, not built.
- **Already applied on main:** 23, as "AI working" (PR #4).
- **Not started:** the other Polish findings.

## Summary

| Severity | Count |
|---|---|
| Blocker | 7 |
| Fix | 14 |
| Polish | 17 |

Most strings are good. The three patterns behind most issues:

1. **Stories show the agent doing things it can't do today.** It finishes work ("Done… has rebuilt") and offers to change models ("I can add…"). It also gets "Run plan" and "Accept" buttons. `agent-voice.md` says the agent changes nothing. All 7 Blockers come from this.
2. **Controls that don't name their object.** Repeated "Remove" and "Download" buttons, and bare "Send", "Stop", "Delete", "Apply", "Accept", "Reject".
3. **Errors and empty states without a next step.** "An environment is required", "not an accepted file type", "could not be loaded for this link". Some also use jargon: "execute", "committing", "payload".

## Findings

Option A is the one to ship. ⚑ marks an option that changes what the string promises.

### Blocker

| # | Severity | File:line | Slot | Audience | Original | Option A (ship) | Option B | Why | Rule |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Blocker | `packages/ui/src/components/product/ChatThread/ChatThread.stories.tsx:295` | agent message | End user | Done. `dim_accounts` passes all six tests, and `fct_ap_aging` has rebuilt. | I can't change `dim_accounts`. A dedupe keyed on (`account_id`, `valid_from`) would drop the 412 duplicates. ⚑ | I can't re-run models. Dedupe `dim_accounts` on (`account_id`, `valid_from`), then re-run `fct_ap_aging`. ⚑ | Claims a fix and a rebuild that can't happen. A keeps the agent's finding, B hands the user the steps. | agent-voice, *Vague and out-of-scope requests*; principle 3 |
| 2 | Blocker | `packages/ui/src/components/product/AgentReasoning/AgentReasoning.stories.tsx:90` | agent message | End user | `fct_revenue` now sums `net_amount`, and tax has its own column. The monthly totals still match the ledger. | `fct_revenue` should sum `net_amount`, with tax in its own column. I haven't checked the totals against the ledger. ⚑ | I can't change `fct_revenue`. Summing `net_amount` would put tax in its own column. ⚑ | States a change as done, and a reconciliation nobody ran. A also says what wasn't checked. | agent-voice principle 3, principle 4 |
| 3 | Blocker | `packages/ui/src/components/product/ProgressBar/ProgressBar.stories.tsx:30` | progress label | End user | AI rewriting model | AI reading attached files ⚑ | AI checking fct_revenue ⚑ | The agent can't rewrite models. Both options show work it does today. | agent-voice, *Vague and out-of-scope requests* |
| 4 | Blocker | `packages/ui/src/components/product/AttachmentRow/AttachmentRow.stories.tsx:96` | agent message | End user | Exported the unmatched entries so you can review them before the next run. | I read the file you attached. {count} entries have no match in `fct_gl_entries`. ⚑ | Keep the copy and mark the story as a planned feature. | Exporting isn't something the agent does today. A changes the story's scenario. See open question 2. | agent-voice, *Vague and out-of-scope requests* |
| 5 | Blocker | `packages/ui/src/components/foundational/Dialog/Dialog.stories.tsx:56-63` | confirmation dialog | End user | Delete fct_gl_entries? / This cannot be undone. 3 downstream models depend on it and will fail on their next run. / Cancel · Delete | Delete fct_gl_entries? / You can't undo this. 3 downstream models will fail on their next run. Type fct_gl_entries to confirm. / Keep model · Delete model | Same body. Buttons: Don't delete · Delete fct_gl_entries | A one-click gate in front of an irreversible delete. The story needs an `Input` for the typed name. | Guide, Layer 4 §3 *High-stakes gates* |
| 6 | Blocker | `packages/ui/src/components/product/AgentPlan/index.tsx:105`, shown in `ChatThread.stories.tsx` (ScriptedConversation) and `AgentPlan.stories.tsx` | button | End user | Run plan | Keep "Run plan" in the component. In stories, open the reply with "I can't change models. A rebuild takes these steps:" and hide the plan's actions. ⚑ | Keep the stories as they are, and add plans to the capabilities listed in `agent-voice.md`. | The button offers to run changes the agent can't make. See conflict C2. | agent-voice, *Vague and out-of-scope requests*; conflict C2 |
| 7 | Blocker | `packages/ui/src/components/product/AgentBlock/AgentBlock.stories.tsx:22` | agent message | End user | …overlapping the prior window. I can add a dedupe step keyed on (account_id, valid_from). | …overlapping the prior window. A dedupe step keyed on (account_id, valid_from) would remove them. ⚑ | …overlapping the prior window. I can't change models. A dedupe keyed on (account_id, valid_from) fixes it. ⚑ | "I can add" promises a change. `agent-voice.md` uses this sentence as its model, so see conflict C1. | agent-voice, *Vague and out-of-scope requests*; conflict C1 |

### Fix

| # | Severity | File:line | Slot | Audience | Original | Option A (ship) | Option B | Why | Rule |
|---|---|---|---|---|---|---|---|---|---|
| 8 | Fix | `packages/ui/src/components/product/ChatComposer/index.tsx:325` | aria-label | End user | Send | Send message | Send question | Names the object. A matches the guide's Prompt Input default. | Guide, *AI Elements: Prompt Input* |
| 9 | Fix | `packages/ui/src/components/product/ChatComposer/index.tsx:311` | aria-label | End user | Stop | Stop responding | Stop answer | "Stop" alone doesn't say what stops. | Guide, *AI Elements: Prompt Input* |
| 10 | Fix | `packages/ui/src/components/foundational/Chip/index.tsx:69`, via `FilterChip` | aria-label default | End user | Remove | In `FilterChip`, default to "Remove {field} filter". | Make `dismissLabel` required on `FilterChip`. | A filter bar of chips reads "Remove, Remove, Remove". `FilterChip/README.md:23` calls the label required, but the type leaves it optional. A needs no foundational change. | Guide, Layer 4 §6; Chip README |
| 11 | Fix | `packages/ui/src/components/foundational/Combobox/index.tsx:315` | aria-label | End user | Remove | Remove {item} | Remove {item} from selection | Each multi-select chip has the same name, and callers can't change it. Foundational change: needs your OK. | Guide, Layer 4 §6 |
| 12 | Fix | `packages/ui/src/components/product/AttachmentRow/AttachmentRow.stories.tsx:23, 26, 104, 136` | aria-label | End user | Download · Remove | Download {name} · Remove {name} | Download {name} ({size}) · Remove {name} | Repeated row actions need unique names. Follows ChatComposer's "Remove {file name}". | Guide, Layer 4 §6 |
| 13 | Fix | `packages/ui/src/components/product/AgentBlock/AgentBlock.stories.tsx:59, 61`; `AgentBlock/README.md:6` | buttons | End user | Reject · Accept | Don't add it · Add dedupe step | Dismiss fix · Use this fix | Bare buttons don't say what happens. Even named, they offer a change: see C2 and C3. | Guide, *Voice: Know who's talking*; conflict C3 |
| 14 | Fix | `packages/ui/src/components/product/Toolbar/Toolbar.stories.tsx:94` | button | End user | Delete | Delete 3 models | Delete selected | Says what and how many will go. | Guide, Layer 4 §3 |
| 15 | Fix | `packages/ui/src/components/foundational/Select/Select.stories.tsx:183` | error | End user | An environment is required | Choose an environment. | Choose an environment to continue. | Says what to do, not what's wrong. | Guide, *UI clichés* ("Invalid" row) |
| 16 | Fix | `packages/ui/src/components/product/EmptyState/EmptyState.stories.tsx:70` | empty state | End user | Scheduled runs will appear here as they execute. | Scheduled runs show here when they start. | Runs show here once a schedule starts one. | "Execute" is jargon. | Guide, *Jargon in end-user strings* |
| 17 | Fix | `apps/demo/src/screens/PreflightDialog.tsx:49` | dialog title | End user | Check the material before committing | Check your files before the run | Check the files before you start | "Committing" can read as a git commit or a payment. | Guide, *Voice: Plain words* |
| 18 | Fix | `apps/demo/src/App.tsx:100` | error | End user | {name} — not an accepted file type | {name} — isn't a supported type. Use .txt, .md, .csv, .jpg or .png. | {name} — can't be read. Use .txt, .md, .csv, .jpg or .png. | Gives the fix. B could suggest a damaged file. | Guide, *AI Elements: Prompt Input* (file errors) |
| 19 | Fix | `apps/demo/src/App.tsx:207` | error | End user | Kasane's files — could not be loaded for this link | Kasane's files — couldn't load from this link. Use Kasane's files to try again. | Kasane's files — couldn't load from this link. Reload the page to try again. | No next step. A points to the button already on that screen. | agent-voice, *Errors state fact*; guide, *UI clichés* |
| 20 | Fix | `packages/ui/src/components/product/DataTable/DataTable.stories.tsx:184` | count | End user | {n} models | 1 model / {n} models | Models: {n} | Prints "1 models". | Guide, *Mechanics* (plurals) |
| 21 | Fix | `apps/demo/src/screens/ReadingScreen.tsx:120`; `RecapScreen.tsx:51`; `DiscoverySummaryScreen.tsx:61` | count | End user | {n} of {total} files read · Cancelled after {n} of {total} files · I read {n} of {total} files | Use "file" when {total} is 1: "0 of 1 file read". | Files read: {n} of {total} | A one-file upload prints "of 1 files". | Guide, *Mechanics* (plurals) |

### Polish

| # | Severity | File:line | Slot | Audience | Original | Option A (ship) | Option B | Why | Rule |
|---|---|---|---|---|---|---|---|---|---|
| 22 | Polish | `packages/ui/src/components/product/StatusBadge/statuses.ts:53-62` | status | End user | queued, running, passed, failed, stale, needs review, agent working, proposed, skipped | Queued, Running, Passed… (sentence case) | Keep lowercase | `Badge` uppercases them, so no one sees the difference. The source should still follow the rule. See C4. | agent-voice, *Fixed strings*; conflict C4 |
| 23 | Polish | `packages/ui/src/components/product/StatusBadge/statuses.ts:60` | status | End user | agent working | AI working | Working | The authorship labels say "AI". One word for one thing. | agent-voice, *Vocabulary* |
| 24 | Polish | `packages/ui/src/components/product/OrgSwitcher/index.tsx:35` | button | End user | Create Workspace | Create workspace | Keep title case | Matches "Create project" in `ProjectSwitcher`. The owner asked for title case: see C5. | Conflict C5 |
| 25 | Polish | Placeholders in `Input`, `Combobox`, `DataTable`, `Toolbar`, `Popover` and `Field` stories | placeholder | End user | Search models… · Filter models… · Filter rows… · Add a model… · Value… · Select… | Drop the "…": "Search models" | Keep the "…" as a placeholder convention | The guide keeps "…" for work in progress. `ChatComposer`'s default has none. | Guide, *Mechanics* |
| 26 | Polish | `packages/ui/src/components/product/Field/Field.stories.tsx:62` | placeholder | End user | Select… | Choose a materialization | Choose one | Select stories say "Choose a…". One verb per thing. | agent-voice, *Vocabulary* |
| 27 | Polish | `packages/ui/src/components/foundational/Popover/Popover.stories.tsx:71` | button | End user | Apply | Apply filter | Add filter | Names the object. B repeats the popover's title. | Guide, *Voice: Know who's talking* |
| 28 | Polish | `packages/ui/src/components/foundational/Input/Input.stories.tsx:129` | error | End user | Opening balance cannot be negative | Opening balance can't be negative. Enter 0 or more. | Enter 0 or more. | Adds what's expected. Uses a contraction. | Guide, *UI clichés*; *Mechanics* |
| 29 | Polish | `packages/ui/src/components/foundational/Textarea/Textarea.stories.tsx:55` | error | End user | A note is required to approve a failed run. | Add a note to approve a failed run. | Approving a failed run needs a note. | Leads with the action. | Guide, *Voice: Plain words* |
| 30 | Polish | `packages/ui/src/components/foundational/Dialog/Dialog.stories.tsx:34` | dialog body | End user | …14 models, roughly 6 minutes. | …14 models, about 6 minutes. | It re-runs 14 models in about 6 minutes. | Plainer word. B is shorter, but drops whether fct_gl_entries is counted in the 14. ⚑ | Guide, *Jargon* table |
| 31 | Polish | `packages/ui/src/components/foundational/Tabs/Tabs.stories.tsx:94` | tab panel | End user | Raw payload. | Raw JSON. | The response as JSON. | "Payload" is jargon. | Guide, *Jargon in end-user strings* |
| 32 | Polish | `apps/demo/src/screens/RecapScreen.tsx:47, 51`; `DiscoverySummaryScreen.tsx:59, 60`; `components/DemoBanner/index.tsx:78` | title, body | End user | Run cancelled · Cancelled after… · summarise · colour | Run canceled · Canceled after… · summarize · color | Run stopped · Stopped after… · sum them up · color | British spelling in end-user strings. | Guide, *Mechanics* (American spelling) |
| 33 | Polish | `apps/demo/src/screens/ReadingScreen.tsx:102` | body | End user | This demo runs in this tab, so a reload starts it again, and it is shortened to under a minute. | This demo runs in this tab, so a reload restarts it. It's shortened to under a minute. | Here it runs in this tab. A reload restarts it. | 24 words, two ideas. | agent-voice principle 5; guide, *Voice: Short sentences* |
| 34 | Polish | `packages/ui/src/components/foundational/MessageScroller/index.tsx:165` | aria-label | End user | Scroll to latest · Scroll to start | Scroll to latest message · Scroll to first message | Keep as is | Names the object. Foundational change: needs your OK. | Guide, *AI Elements: Conversation* |
| 35 | Polish | `apps/demo/src/screens/PreflightDialog.tsx:109`; `UploadScreen.tsx:172` | button | End user | Start modeling | Start run | Read files | The dialog body, Cancel run and Start a new run all call it a "run". | agent-voice, *Vocabulary* ("a run is a run") |
| 36 | Polish | `apps/demo/src/App.tsx:163` | error | End user | could not be loaded. Check the connection and try again | couldn't load. Check your connection and try again. | couldn't load. Try again when you're online. | Contraction. "Your" connection. | Guide, *Mechanics* |
| 37 | Polish | `docs/design-system.md:335, 415, 510, 646, 806, 1010, 1034, 1369`; READMEs: `Tooltip:61`, `AppShell:169`, `ContextSwitcher:100`, `CountBadge:42`, `DataTable:24`, `ProgressBar:16`, `Toolbar:29`, `TruncatedText:5`; `docs/components.md:79` | doc | Engineer | actually · genuinely · simply · load-bearing | Cut the word | Replace "load-bearing" with "required" | Filler. The sentences read the same without it. | Guide, *Words to cut* |
| 38 | Polish | `packages/ui/scripts/build-registry.mjs:84` | registry description | Engineer | Switches between organizations. | Switches between workspaces. | Switches between organizations, labelled "Workspaces". | The component's menu says "Workspaces". | agent-voice, *Vocabulary* |

## Conflicts

**C1. "I can add…" as the model sentence.** *Settled 2026-10-26 as recommended.*
- `docs/agent-voice.md:149`: "I can add a dedupe step keyed on (account_id, valid_from)." (also `:40`, `:69`)
- `docs/agent-voice.md:94`: "It doesn't change anything."
- Recommendation: until the agent can change models, rewrite the example as "A dedupe step keyed on (account_id, valid_from) would remove them." It keeps principle 3's point without promising an action.

**C2. Action buttons the agent can't carry out.** *Settled 2026-10-26 as recommended.*
- `docs/agent-voice.md:135`: "Action button | Verb first, two words at most where possible | Run plan · Edit · Accept · Reject"
- `docs/agent-voice.md:94`: "It doesn't change anything."
- Recommendation: keep the components, since the library ships ahead of the product. Add one line to `agent-voice.md`: stories and demos show these actions only for capabilities that exist.

**C3. Accept / Reject.** *Settled 2026-10-26 as recommended.*
- `docs/agent-voice.md:135` approves "Accept · Reject". `AgentPlan/README.md:39` cites "`AgentBlock`'s Reject / Accept pair".
- Guide, *Voice*: "Avoid bare 'OK', 'Submit', 'Confirm', 'Approve' or 'Yes'." Layer 4 §3: "Not 'OK' / 'Cancel', 'Yes' / 'No' or 'Approve' / 'Reject'."
- Neither README marks the pair as an owner decision.
- Recommendation: name the action on each proposal ("Add dedupe step" / "Don't add it"). This still fits agent-voice's "verb first, two words at most where possible".

**C4. Lowercase status labels.**
- `packages/ui/src/components/product/StatusBadge/statuses.ts:58`: `label: 'needs review'`
- `docs/agent-voice.md:138`: "Sentence case everywhere, titles and labels included; components apply any uppercase themselves."
- The guide agrees with agent-voice.
- Recommendation: sentence case in the source. It's invisible today because `Badge` uppercases it, so this is low risk. Owner decides.

**C5. "Create Workspace" in title case.**
- `packages/ui/src/components/product/OrgSwitcher/index.tsx:34`: "Title case by request (2026-10-08), unlike the sentence-case rows elsewhere."
- `docs/agent-voice.md:138`: "Sentence case everywhere…". The guide agrees.
- Recommendation: "Create workspace", to match "Create project" in the same menu pattern. This reverses an owner request, so the owner decides.

**C6. "Awaiting review" vs "Needs your review".**
- Occurrences: `docs/agent-voice.md:16-17, 40, 65-66, 136`; `docs/design-system.md:422`; `packages/ui/src/components/product/AgentBlock/index.tsx:6` (doc comment); `AgentBlock/AgentBlock.stories.tsx:49-50, 54`; `AgentBlock/README.md:6`; `packages/ui/README.md:50`. The only end-user string is the story at `:54`.
- Guide, *AI Elements: Tool*: "Needs your approval". It prefers naming who acts.
- Recommendation: keep "Awaiting review". In a shared workspace, the viewer may not be the reviewer. Then "your" is wrong. See open question 4.

**C7. Spelling in docs.**
- The docs use British spelling throughout: 192 hits for colour, behaviour, centre and similar words in `docs/`, the READMEs and `CONTRIBUTING.md`. That includes the registry description `packages/ui/scripts/build-registry.mjs:65`, "with the colour mode choice", which shadcn users see.
- Guide, *Mechanics*: "American spelling."
- Recommendation: use American spelling in end-user strings (finding 32). Keep British in engineer docs, which are consistent today. Make an exception for registry descriptions, since they ship to other people's apps: write "color" there.

## Open questions

1. **Confidence.** No component shows confidence. Should the guide's Sure / Likely / Unsure scale be added, or does agent-voice's "state the basis" replace a label?
2. **Can the agent create files** (exports, summaries)? If yes, finding 4 becomes OK.
3. **Will proposals and plans become runnable?** If yes, findings 6, 7 and 13 change once they do.
4. **Who reviews agent proposals?** If it's always the viewer, "Needs your review" works (C6).

## Already good

- Repeated controls named per row: "Remove {file name}" (ChatComposer, demo upload), "Re-run {model}", "Actions for {model}", "Expand/Collapse {name}", "Select {model}".
- `ChatStarter`'s description promises only today's scope: "Nothing here changes your data."
- `ChatComposer`'s placeholder names the scope: "Ask about models, runs or figures".
- Fixed strings follow agent-voice's forms: "Thinking…", "Working…", "Thought for 4s", "Drafting step {n}…". The live region drops the "…".
- Scope stated, not a feeling: "I read {n} of {total} files. Anything that rests on the others is left out."
- `CountBadge` shows "99+" and announces the true count.
- Plurals handled in `RecapScreen` ("evidence sheet"/"sheets") and `UploadScreen` ("file needs"/"files need"). No "(s)" anywhere.
- "Toggle sidebar" keeps one name and puts the state in `aria-expanded`, on purpose.
- Errors that name the thing: "A model named fct_gl_entries already exists."
- External links say "(opens in a new tab)".
- No exclamation marks, "Oops", "we" or banned marketing words in any end-user string.
