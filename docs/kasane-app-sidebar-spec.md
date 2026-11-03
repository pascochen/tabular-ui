# Kasane app: sidebar spec

Decided 3 November 2026, corrected the same day after reading the repo, and again after a review of the demo's code and data. The build source for the sidebar. The page-by-page spec is `docs/kasane-app-pages-spec.md`.

The sketches it came from were rough napkin ideas: take the structure and rules from here, not the layout or content from the screenshots.

## Context

- **This reworks the demo that already exists**: `apps/demo` in `github.com/pascochen/tabular-ui`, live at demo.tabularui.com ("Kasane September close"). It is not a new app. Its store, timeline, hero decision, data export and components stay.
- It's a Slack-like workspace for Kasane Corporation's own finance team, with specialised finance agents.
- Success means a portfolio demo: a reviewer with no finance background reaches the main moment (an agent finding, its citation, the source record, a decision) without guidance.
- **Demo user: Daisuke Onodera, Group Controller** (employee E0010). This replaces Mei Tachibana, Head of FP&A.
- Scene: 16 October 2026. September 2026 was locked on 8 October, business day 6. October 2026 is open, with data through 15 October.

## Structure, top to bottom

```
Kasane Corporation
October 2026, open

Search
Tasks                    4
Sources

Channels
# close                  •
# cash
# receivables            •
# payables               •
# revenue                •
# intercompany

Agents
Cut-off AI
Payments AI
Approvals AI
Credit AI

Direct messages
Mei Tachibana
Kenta Ishiguro

Daisuke Onodera
Group Controller
```

This is the sidebar at landing, with #revenue open. The agent names are pending decision D1 in the pages spec.

## Rules

**One home for everything.** The sidebar holds places. A finding is a task, a document is a source, a conversation sits in a channel or a DM.

**Header: company and period.** The top row shows the company name, with the current period beneath it. It's static: the pages spec's D7 drops the period switcher, because nothing in the demo is filtered by period. There's one company, so there's no company switcher either.

**Tasks is the inbox.** A task is something an agent raises for the user: a contradiction, a gap or a question. It is never work the user assigns. The count is the open contradictions: 4 at landing. The visitor decides one of them, the revenue cut-off. Teammates settle the other three once he has, so the count runs down to 0.

**Tasks aren't filtered by period.** All four open findings sit in closed months:
- the revenue cut-off is in September (KJP)
- the self-approved entry is in August (KUK)
- the duplicate payment is in July (KUS)
- the credit problem runs up to September (KUS)

Filtering the inbox to October would empty it. Findings are raised now, in the open month, about closed months.

**Sources opens a binder.** Each source is a tab with a short exhibit ID (S-17). A citation names the exhibit and the record: "S-17, INV-KJP-2609-00363". A transcript is cited by line. Each source has an "Agents read this" switch.

**Channels are areas of the books.** `#close` covers the close and controls, then come `#cash`, `#receivables`, `#payables`, `#revenue` and `#intercompany`. Each channel shows its owner.
- **A dot** marks a channel with an open contradiction. It clears when the finding is resolved or starts waiting.
- **Unread:** a channel with a reply the visitor hasn't seen shows its name in `--color-text-primary`, at regular weight. Semibold already means the open channel (pages spec, §2).

**Agents have their own section, one per planted finding.** Agents use role names, not human names, and the agent icon, never a person's avatar.

**Direct messages are people only.** Daisuke is the user, so he isn't in this list.

**The user row is static.** It shows who the visitor plays, as the demo does today. It isn't a menu, and there's no settings page.

## Period behaviour

- **October 2026 is the open period**, shown beneath the company name.
- **September 2026 was locked on 8 October.** #close's panel says so. If the visitor chooses "Reopen September" in the revenue cut-off decision, it says September is reopened.
- Any answer that uses numbers states its entity, currency and period.
- A period switcher, where September makes the workspace read-only, is D7's alternative in the pages spec.

## Corrections to the first version

- Inline citation, Sources and Confirmation are already built (added 2026-10-28). Nothing in the library blocks this work.
- The planted findings are already in the demo data (`apps/demo/data/close.json`), so the answer key isn't needed to build.
- `#close` gets a dot, because the self-approved entry lives there.
- The citation locator is the record ID, not a row number.
- Kenta Ishiguro is the Accounts Payable Lead.

## Corrections after the code review

- The Tasks count is the open contradictions, not "waiting for a decision": the visitor decides only one of the four.
- The visitor lands on #revenue, not Tasks (pages spec, D5). In the user tests the decision was easy to miss even with it on screen.
- The period switcher is dropped by default (D7), since nothing is filtered by period.
- The example exhibit is S-17, which is where the binder's order puts the sales invoices (D6).
- Open and unread are separate marks. The dot means open; unread is the name's colour.
