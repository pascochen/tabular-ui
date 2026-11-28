# Five-moments demo: decisions across every moment (2026-11-27)

These override anything in the per-moment flow maps that says otherwise.

## Settled with the owner, 2026-11-27

1. **The nudge mark: a still ink dot.** A small solid dot in the ink of the primary action, beside the next control. It's not `StatusDot`'s ochre, which means "waits on you", and it adds no hue. It appears in place after the visitor's last click and **never loops or pulses**. Hidden text names the next step for screen readers ("Next: pick a question"). This replaces every "pulsing dot" in the maps, and Asking's assumption that the pulse stops after a few cycles.
   *Why:* the site's Motion page says "Waiting doesn't pulse" and "nothing loops but work in progress" (`apps/site/src/routes/motion.tsx`).
2. **Reduced motion: the site's rule.** Each scene shows its rest frame at once, and Replay jumps to it. This replaces Asking decision 10 and Thinking decision 3 (keep the timed steps), both approved earlier today.
   *Why:* `docs/site.md` §6 ("Reduced motion: the rest frame only. Replay jumps to the rest frame."), which `tests/quality.spec.ts` checks on every route.
3. **Run timing: whole parts, 5s or less.** Each part arrives whole, as one step of the run: the reasoning line, each read, the answer, each plan step. Nothing appears letter by letter. Every scene's run is 5s or less (Thinking's 10–12s assumption is gone). Waiting's "Working…" between waits still fits.
   *Why:* §6 ("A run is 5 seconds or less and never loops") and the Motion page ("Text that has arrived is shown. No typewriter over a reply that is already here.").

## Settled from the site's own decisions (no new call needed)

4. **Edit entry (Waiting R6 flag): put it back, as the site already decided it (2026-10-26, owner).** Edit entry turns the entry's period and memo into `Field` and `Input`, with Done and Cancel. Done returns to the proposal, still waiting for Post. The amount stays read-only, with a line saying why: it's the duplicate's, from the data. Focus goes to the period field on Edit, and back to Edit entry on Done or Cancel. Source: `docs/site.md` (the Agent block card) and `Proposal` in `apps/site/src/specimens.tsx`. The site's proposal also writes a `RunLogRow` under it on Post or Don't post (`passed` or `skipped`), which hands Waiting on to Recording.
5. **What the demo claims (Waiting R9 flag): there's no conflict.** The site already shows Post entry live on the Agent block card and Send summary live on the Confirmation card, both approved by the owner on 2026-10-28. "The agent changes nothing" governs conversation copy and Thinking's wording ("reads", not "actions"). It doesn't stop the library's waits from being shown. The demo matches the site.

## Pre-build checks, run 2026-11-27

Storybook (port 6006) and the site's dev server (5174), driven by one-off Playwright scripts in Chromium at 375×812 (not kept), plus reading the code.

| # | Check | Result |
|---|---|---|
| 1 | The clipboard with a citation mark (Showing) | **Pass.** The real clipboard, after copying the `InlineCitation` Default story's paragraph: "Yes. Invoice MFL-58821 was entered twice and paid twice, $48,216.40 each time. ". The mark is `select-none`, so its "1" stays out. Only a trailing no-break space comes along (the mark's own space), which does no harm |
| 2 | The citation popover at 375px | **Pass.** 296px wide, from 5 to 301 of 375. The story's page scrolls sideways, but that's the story's fixed-width wrapper, not the popover |
| 3 | The proposal entry at 375px (Waiting, Recording) | **Pass, and the DataTable is gone.** The site's proposal, which the demo now reuses (decision 4), shows the entry as two lines of text (memo, then amount and period), not a `DataTable`. Waiting R6's "two-line entry in a DataTable" is replaced by it. At 375px nothing overflows: Don't post and Edit entry share a line, and Post entry wraps under them. Edit entry fits, and focus lands on Period |
| 4 | `RunLogRow` at 375px with the demo's names | **Fail: a library bug, not a demo one.** The name column gets about 140px. `read supplier_invoices_fy2026_h1.csv` needs 238px, and `read bank_export_kjp_2026-09.csv` needs 211px. Both truncate with no title and no tooltip, so on a phone the full name can't be read at all. It breaks the failure-log rule "Truncated text needs a way to be read, and a tooltip never opens on touch." The failed row's name can be read in its opened detail. Passed rows have no way |
| 5 | Waiting's keyboard path after a new turn | **Pass in the code; confirm in the built demo.** The outcome takes focus. The next agent turn is appended after it in DOM order, so it's the next Tab stop. `ChatThread`'s scroller (`autoScroll`) follows new content while the reader is at the bottom. To confirm once built: focus landing on the outcome doesn't fight the auto-scroll in a short scene |
| 6 | Whether Don't post still leads to the recovery request | **Yes (owner, 2026-11-27), as recommended.** The duplicate payment left the account whether or not the reversal is posted, so asking for the money back stands on its own. It's a separate action with its own permission. The agent's turn says the entry wasn't posted. Both branches keep reaching the Confirmation, so every visitor sees all three waits |
| 7 | The check mark is drawn on Post's new row (Recording) | **Pass, with one build rule.** `useTickOnPass` draws the check only when the same mounted badge goes from a working status (`running`) to `passed`. Build rule: the posting row mounts `running` with a stable `key` and then changes to `passed`. Never mount it already passed. Under reduced motion `tickIn` is `motion-safe`, so the mark swaps, as the rest-frame rule needs |

## Still open

- **Showing:** `AttachmentRow`'s "the file name is the link" is shown in no scene (Showing R5).

## Settled since the checks

- **Truncation (check 4): fixed in the library, 2026-11-27.** `RunLogRow` in pascochen/tabular-ui#227: a cut name shows in a tooltip on hover and keyboard focus, and the row opens in place to the full name (`LongNames` story, `run-log-row.spec.ts`). The seven other components that truncated with no tooltip in pascochen/tabular-ui#228: `AttachmentRow` opens in place as `RunLogRow` does, `LineageTree` opens a line under the row with the full name, `AgentCard`'s finding takes a tooltip and its link opens the finding on touch, `AccountMenu`'s header wraps, `Select` and `Combobox` wrap an option too long for the list, and `FilterChip` never cut. The demo uses `AttachmentRow` and `LineageTree`, so it inherits both fixes.
- **Check 6: Don't post still leads to the recovery request.** The owner approved the recommendation, 2026-11-27.
