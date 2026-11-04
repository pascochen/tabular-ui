# Main after D11: open items, 2026-11-04

A read of the PRs merged after #92, through their descriptions, targeted diffs and CI, not every line of the Kasane build. Each item was re-checked against `main` at `0e7d0c6` (#124). It lists what those PRs left open, so that it isn't only in a session that gets archived.

Nothing here is a decision. An item marked "not recorded" may have been done without leaving a trace in the repository. Strike an item when it's done, or move it to the spec.

## In flight

- **Truncated text cells,** on `claude/distracted-jennings-a596ee`: no PR yet. Whether to keep its arrow keys was reported as the owner's call.

## Checks only the owner can do

- **VoiceOver.** Steps 17 to 19 in `docs/site-voiceover.md`, for the double rule, are not recorded as run. Nor is row 5 of the script, from #121.
- **§10's human checks for `StatusDot` and `open`** (#118). Grayscale and colour blindness weren't done. §10's grayscale line still says "all nine run states" and is dated 2026-08-03. `open` has been added since, and #98 changed the proposal's mark.
- **The D11 screenshots.** The owner's review of the 16 from #91 is not recorded.
- **The paper grain** (#104). It was chosen on a 2× screen and hasn't been checked on a 1× monitor.
- **Guesses not tested with users.** Whether the hollow ring reads as "not waiting on me" (#118), and About at the bottom left, with the "You're…" line inside a dialog (#120).

## Measurements

- **Lighthouse.** No score is recorded since the bridge table (#92) and the paper grain (#104). #92's numbers predate its rebase, and the route chunk grew about 2 KB gzipped after them (85,137 to 87,319 bytes). Use the method in `apps/site/README.md`, and measure production too.
- **Safari and Firefox.** The Playwright specs for the site and Storybook run in Chromium only. The double rule's two lines, forced colours and the paper grain are unmeasured in other browsers. #104 did render the grain in a macOS `WKWebView`, but not in Safari itself. Adding browsers to CI is a tooling change that needs the owner's approval.

## Owner's decisions

- **"Incomplete",** the word for a stated total that isn't a number. It shipped in `DataTable` with #91, and no decision on the wording is recorded.
- **The demo's theme.** `apps/demo/index.html` fixes `data-theme="light"`, and the system is dark-first. #110 and #112 report checks "in dark", while #118 says the demo only runs light, so those checks probably saw light mode. Either record light-only as a decision, or add dark.
- **The demo in the nav.** Still undecided in `docs/site.md` §4 (#121).
- **"You decide."** on the closing band. The demo gives the visitor one decision, so it could read as more (#121).
- **The README paragraph for the pencil mark** (#98) was a draft for the owner to approve.

## Small fixes

- **§5 against §7.7.** §5 gives "Needs review" `--color-border-warning`, and #118 says §7.7 and `Badge` draw no border. The CSS wins on values, so the doc needs correcting.
- **`tabVariants`** returns a raw string, the trap #117 fixed in `buttonVariants`. Every caller uses `cn()` today, so nothing is broken, but an app that copies it could hit this. It's a foundational change, so it needs the owner's approval. The other exported cvas have the same shape and weren't checked for conflicting classes.
- **`persona`** is unused in the demo's code, and is still in `apps/demo/data/company.json` and written by `apps/demo/scripts/export-fixtures.mjs`.
- **The orphan branch `pr-assets/closing-band-2026-11-04`.** Move its commit to a tag before deleting it: #121's screenshots link to the branch by name, so deleting it first breaks them. #123's failure-log entry notes that a tag on an orphan commit hasn't been tried.

## To watch

- **#118's unconfirmed flake.** Its first full Playwright run had 7 failures in `account-menu` and `app-shell`, put down to load without confirming it. They passed alone and at 2 workers.
- **Failed CI runs on the Kasane PR branches.** Several show as failed with no jobs listed, and the cause wasn't found. Their later commits on `main` passed.
