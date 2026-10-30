# Close demo: first pass, 2026-10-30

Two methods from Ileana Marcut's UX + AI method library, run on the Kasane close demo as it is live on demo.tabularui.com (`main` at #65), before the user tests in `kasane-close-demo-plan.md` §7. The library's AI product principles are applied throughout as the standing quality bar.

1. **Variants of one element**, on the agent's display name ("Close agent").
2. **Heuristic critique**, on the demo as a whole.

**Status, 2026-10-30:** the name (variant 1, "AI") and the three severity-3 issues are fixed in #67, carried to `main` by #68. The rest are open.

Everything below was seen in the live site at 1440×900, light mode, walking the plan's 3-minute script: land, open the hero, answer Reopen September, post, watch the teammates, reach the end, then every sidebar item. The findings are hypotheses for the user tests to confirm, not results.

---

## 1. Variants of one element: the agent's name

**The element.** The agent's display name. Today it is "Close agent", and it appears in:
- the sidebar's direct-message row, with an orchid "AI" badge and a robot avatar
- the direct message's page title, and the profile panel's name
- every message header the agent posts
- the live-region announcements ("Close agent proposes: …")

Inside its own `AgentBlock` the agent has no name: the rail and the "AI" label carry authorship.

**The constraint.** `docs/agent-voice.md`, Decided rule 1: "No product or agent name in copy." Outside its block, agent text "carries an actor: 'AI', the person's name, or 'System'." "Close agent" is a name, so it breaks the rule wherever the name appears outside the block: the sidebar row, the message headers, the profile and the announcements.

**Held constant across the variants:** where the name appears, the robot avatar, the orchid rail and label inside the block, and the profile panel's layout. Five variants, each changing one dimension.

| # | Dimension changed | The name | Optimizes for | Tradeoff | Rule 1 |
|---|---|---|---|---|---|
| 1 | **What it is** | **AI** | Matches every authorship label in the product, so the agent has one word everywhere, in and out of its block | Generic. With two agents in one workspace they couldn't be told apart, and a sidebar row reading only "AI" sits thin among full names. The orchid "AI" badge beside it would say it twice, so the badge goes | **Complies**, exactly as written |
| 2 | **Its scope** | **AI · Close** | Uses the label grammar the product already has ("AI · Catch-up", "AI · Awaiting review") to say what it's for | A middle dot in a sidebar row and a message header is unusual. "Close" can read as a verb ("close the AI") | Complies if "Close" reads as the scope, as "Catch-up" does. Worth one line in the rule if adopted |
| 3 | **What it does** | **AI reviewer** | Says its job: it compares what people say with the ledger and raises what disagrees | "Reviewer" implies it approves things, and it can't post or change anything | Needs the rule widened from "AI" to "AI + role word" |
| 4 | **Its relation to you** | **Close assistant** | Familiar from every chat product. Approachable | Implies it acts on your behalf, which it never does (its profile says it never posts an entry). The word most likely to read as a persona | Needs the rule widened. Closest to the naming the rule exists to stop |
| 5 | **Who answers for it** | **Controller's AI** | Ties the agent to the person accountable for it (its profile says it was set up by Daisuke Onodera, Group Controller). Supports trust: someone owns it | Long in a 240px sidebar. Can read as "it works for the controller", not for the channel | Complies with the actor "AI"; the possessive adds an owner, not a name |

**Rejected outright:** any product or brand name ("Tabular AI", "Kasane AI"). Rule 1 bans product names by name.

**Recommendation: variant 1, "AI".** It is the only one the rule allows as written, and it makes the agent one word everywhere, which is the trust story `AgentBlock` exists for. Drop the sidebar's orchid "AI" badge, since the name now says it. If the user tests show "AI" reads as too thin in the sidebar, variant 2, "AI · Close", is the fallback: it stays within the label grammar. The change is one field, `agent.name` in `close-demo.json`.

---

## 2. Heuristic critique: the demo

**Lens.** Nielsen's 10 usability heuristics. This is an AI product, so also the human-AI interaction guidelines the method names:
- make clear what the AI can and can't do
- explain what it did and how sure it is
- let people review, correct, undo or override it
- fail gracefully
- help people judge when to rely on it

Ileana Marcut's 20 AI product principles are the standing bar.

**Severity**, Nielsen's 0–4: how often visitors hit it, how much it hurts, and whether they get past it once learned. 4 is a catastrophe, 3 major, 2 minor, 1 cosmetic.

**Who it's for.** The plan's visitors are designers and engineers judging the components, not finance users (§0, weak point 2). The 3-minute path, the decision and noticing the components, is what matters most.

### Top issues, worst first

**1. Six of the seven sidebar items open a placeholder that says "Built in phase N".** Severity 3.
- **Heuristic:** 4 (Consistency and standards) and 3 (User control and freedom).
- **What happens:**
  - Home says "The close at a glance. Built in phase 9."
  - `# open-items` says "Built in phase 8", and its panel says "Select an item" with nothing to select.
  - `# rev-check` says "Built in phase 10".
  - All three direct messages say "A short scripted history. Built in phase 7."
- **Why it hurts:** The sidebar is the most clickable thing on the page, and the plan's own rule is "Every item works. A dead link is where a 3-minute visitor leaves." Here the visitor gets a dead end, plus internal build vocabulary that tells them they're looking at unfinished work.
- **Fix:** Until a view is built, take it out of the sidebar. Keep `# sep-close`, plus the agent's direct message if its profile gains the does/never/reads lists (issue 8). Failing that, replace each placeholder with a real minimal state. `# open-items` can list `findings.json`'s 18 gaps and follow-ups as plain rows today. Either way, no visitor should read "phase".

**2. The one decision is below the fold, and nothing points to it.** Severity 3.
- **Heuristics:** 1 (Visibility of system status) and 6 (Recognition rather than recall). AI principle 1.
- **What happens:**
  - The question sits at y=1005 in a 900px window, inside the fourth card's thread.
  - The landing screen shows the catch-up and two *resolved* exceptions first.
  - The catch-up's bullets say what happened, not what is waiting on the visitor.
  - The sidebar's "4" says how many are open, not that one is theirs.
- **Why it hurts:** The plan gives the visitor 0:20 to 1:00 to find and answer it. Without a pointer, they read resolved items first, then scroll.
- **Fix:** Make the catch-up's last bullet say what's waiting, as a link to the thread: "1 needs your answer: Revenue cut-off." Optionally, order open exceptions before resolved ones, or the one awaiting the visitor first.

**3. The teammates' replies land inside folded threads, so the background story is almost invisible.** Severity 3.
- **Heuristic:** 1 (Visibility of system status).
- **What happens:**
  - Every teammate reply on Duplicate payment, Self-approved entry and Credit limit arrives in a thread that is closed (`aria-expanded="false"`). The visitor sees "1 reply" become "2 replies" and a badge flip to Resolved, but never what Kenta, Daisuke or Marcus said.
  - "Kenta Ishiguro is typing…" appears above the composer, far from the card it concerns.
  - The Credit limit card, where the run ends, is off screen.
- **Why it hurts:** 2:10–3:00 is meant to show presence, replies and status changing ("Teammates resolve … with presence dots and replies"). As built, the visitor mostly watches the right panel's count move.
- **Fix:**
  - Open a card's thread when a teammate's reply arrives in it. Leave it closed if the visitor closed it by hand.
  - Have the typing line name the card: "Kenta Ishiguro is replying on Duplicate payment…"

**4. The end strip appears below the fold.** Severity 2.
- **Heuristic:** 1 (Visibility of system status).
- **What happens:** The strip renders at y=1180 in a 900px window, after the last card. A visitor still reading the hero thread doesn't see the run end, or the three ways on: Replay, the open items, the AI components.
- **Why it hurts:** It is the demo's exit to the components, the plan's measure of whether visitors notice them (§7, question 3).
- **Fix:** Pin the strip above the composer when it appears, where the typing line is, so it shows wherever the visitor is reading. Or scroll it into view, unless the visitor scrolled in the last few seconds.

**5. After the run, the catch-up contradicts the panel.** Severity 2.
- **Heuristics:** 1 (Visibility of system status) and 4 (Consistency). AI principle 3.
- **What happens:** The catch-up says "6 exceptions found since. 2 resolved." while the panel beside it says 5 of 6. It changes only on Refresh, and nothing says it's out of date.
- **Why it hurts:** The agent's summary looks wrong next to the record. That's the trust the product is about.
- **Fix:** Say it's a snapshot, with what changed since: "As of 14:00 · 3 resolved since · Refresh". Or update the count live and keep Refresh for the time.

**6. The options' consequences are hidden until after choosing.** Severity 2.
- **Heuristic:** 5 (Error prevention). AI principle 1.
- **What happens:** The question shows two labels, Reopen September and Keep September locked. `close.json` carries a description for each, that a reopen reverses the invoice so H1 is right for the 6 Nov release, and that keeping it locked posts nothing and lists the amount for the auditors. `Question` has no slot for them, so they don't show.
- **Why it hurts:** A visitor without accounting knowledge, the plan's audience, picks blind. The confirmation does prevent a wrong post ("Don't post it" asks again), so it costs time, not data.
- **Fix:** Give `Question`'s options an optional one-line description, under each button or as a short list above them. It's a product-component change, and the data is already written. Failing that, put both lines in the basis paragraph.

**7. "Choose for me" is offered on a question the agent says the policy doesn't settle.** Severity 2.
- **Heuristics:** the human-AI guideline on helping people judge when to rely on the AI. AI principles 3 and 13.
- **What happens:** The agent states the basis: the policy puts revenue in the month of delivery, and doesn't say whether a locked month is reopened. Then "Choose for me" picks Reopen.
- **Why it hurts:** Its reason ("H1 is published on 6 Nov") is a preference, but the line reads as if the policy decided it. The visitor can't tell the agent's judgement from the rule.
- **Fix:** Have the delegated outcome say it's a judgement: "Chosen by AI: Reopen September. The policy doesn't decide this; I chose it so H1 is right for the 6 Nov release." Or let `Question` drop "Choose for me" where the answer is a policy call. Today it always renders.

**8. Nothing on screen says what the agent can and can't do.** Severity 2.
- **Heuristic:** 10 (Help and documentation). The human-AI guideline on making clear what the AI can and can't do. AI principles 1 and 12.
- **What happens:** The agent's profile shows "Close agent · AI · Set up by Daisuke Onodera" and nothing else. `close.json` already lists what it does (compares what people say with the ledger, reruns a check when a decision changes its input, drafts entries for a person to post), what it never does (posts an entry, changes a locked period, messages anyone outside the channel) and the seven files it reads.
- **Why it hurts:** The plan's story is that the agent proposes and people decide. Visitors judging an AI interface look for exactly this boundary, and it's one click away and empty.
- **Fix:** Show the three lists in the profile panel now, as plain lists. It's a small piece of the plan's Phase 7.

**9. The composer accepts a message and nothing answers.** Severity 1.
- **Heuristic:** 1 (Visibility of system status). AI principle 1.
- **What happens:** "Message #sep-close" posts the visitor's text as Mei, and nobody replies. That matches the plan, but nothing says so.
- **Why it hurts:** A visitor who asks the agent a question waits for an answer that isn't coming.
- **Fix:** After the first post, a one-line note from System: "The people here are scripted, so nobody will reply. Your message stays in the channel." Or say it in the placeholder.

**10. An account name truncates with no way to read it.** Severity 1.
- **Heuristic:** 6 (Recognition rather than recall).
- **What happens:** At the pane's width, the proposal table shows "Output consumption tax / VAT pay…". `DataTable` truncates its cells and offers no tooltip. `CLAUDE.md` says truncated cells are unreadable without one.
- **Fix:** Set the Name column to wrap (`meta.truncate: false`), since five rows can afford two lines. Separately, worth a look in `DataTable`: render truncating cells through `TruncatedText`.

### Review, correct, undo, override

These are the guideline the method asks to be judged, and AI principles 2 and 5.

- **The visitor can review and override:**
  - Every proposal waits for a `Confirmation` that says what changes and who it reaches.
  - "Don't post it" asks again.
  - A reopen is resolved only after the check reruns.
- **Missing:** an undo after posting. In the demo, Replay is the only way back. For a product, a posted reversal needs its own reversal.
- **The agent shows its work:** a `Tool` line for the delivery note, the entry's lines, debits equal to credits, and the reason.
- **Confidence:** not stated. The basis line partly serves.

---

## Conclusion

- **The name:** use "AI" (variant 1), the only name `docs/agent-voice.md` rule 1 allows as written, and drop the duplicate sidebar badge. "AI · Close" is the fallback if testers find "AI" too thin.
- **Before the user tests,** fix the three severity-3 issues. As built, they would mask what the tests measure:
  - hide or fill the "Built in phase N" views (issue 1)
  - point the catch-up at the decision (issue 2)
  - open threads when teammates reply (issue 3)
- **The four severity-2 issues** (4 to 7) are each one small change in the demo, or one optional prop on `Question`.
- **Issue 8** is a cheap piece of Phase 7 that answers the question an AI-literate visitor asks first: what can this agent do?
- **What holds up:**
  - The decision has a clear basis, a reviewable proposal, a confirmation naming the change, and nothing is resolved before it ran.
  - The payoff lands in seconds, in the thread and in the panel.
- **Not covered by this pass:** dark mode, keyboard-only use, screen readers end to end, and widths below 1280. The accessibility quick pass method is the next lens for those.
