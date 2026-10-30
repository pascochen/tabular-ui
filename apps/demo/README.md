# Demo: Kasane September close

The public demo at [demo.tabularui.com](https://demo.tabularui.com): a close exceptions workbench for an AI finance tool, laid out as a team chat, built from Tabular UI. It replaces the onboarding journey, which is kept at the tag `demo-part-1`.

**Being built in phases** (`kasane-close-demo-plan.md` §6). Phase 2 is the shell: the sidebar, view switching by URL, and the right panel's place in each view. Phase 4 is `#sep-close` in its landing state: the agent's catch-up, six exception cards and the close panel. Phase 5 is the decision in the Revenue cut-off thread (`src/components/HeroThread/README.md`). Phase 6 is the timeline: once the visitor decides, the teammates reply and resolve in the background, and the run ends at 5 of 6 with an end strip. Phases 0–6 are the demo; the other views still show a placeholder that names the phase that builds them.

**The timeline** (`src/lib/timeline.ts`) is one list in one fixed order, built from `close.json`'s delays, so every run plays the same. `src/lib/timeline-script.ts` plays it one event at a time.
- It pauses while the tab is hidden, and the waiting event starts its gap again on return.
- Under reduced motion it applies everything at once, with no typing indicators.
- Only one timer exists at a time, so none outlives a view.

**Skip to the end** and **Replay** sit in the top nav and work at any point. Skip finishes the decision as "Choose for me" would, unless the visitor already answered, then applies every event left. `?at=end` opens on the end state.

**One store.** `src/lib/close-state.ts` holds each exception's status and replies, the decision log and each check's figure. The panel, the tiles and the sidebar's open count are derived from it.

## Playing it

A visitor plays Mei Tachibana, Head of FP&A at **Kasane Corporation**, a fictional Tokyo printer maker. The people in the channel and the agent are scripted, and every figure they quote comes from the generated data (below).

- **Views by URL, with no router.** `?view=sep-close` (the default, `/`), `?view=open-items`, `?view=rev-check`, `?view=home`, and `?dm=agent|controller|apLead` for a direct message. Every sidebar item is a real link, so it opens in a new tab and Back works. `src/lib/view.ts`.
- **The right panel follows the view**: the close panel in `#sep-close`, the member's profile in a direct message, the selected item in `#open-items`. Home and `#rev-check` have none.
- `DemoBanner`, in the top nav, says all of this in one line; see its README.

## Data

`data/` holds small JSON files, only what the screens read: `pack.json`, `company.json`, `discovery.json` and `findings.json` for the onboarding journey, and `people.json`, `close.json` and `checks.json` for the close demo that replaces it (`kasane-close-demo-plan.md`). They are generated; never edit them by hand.

The close demo's copy is authored in the dataset, in `onboarding/close-demo.json`: the channel's exceptions, replies, the hero question and the proposed entry's wording. Every figure in it is a `{token}` the export script fills from the data, and its people are employee ids, each of whom must attend an interview. The script stops on an unknown token, a person who isn't in the material, an unbalanced entry or an account missing from the chart of accounts. `apps/storybook/tests/close-data.spec.ts` checks the generated files against each other, since CI has no dataset.

The full Kasane dataset is kept outside this repository. To rebuild the fixtures from it:

```bash
KASANE_DATA_DIR=/path/to/kasane pnpm --filter tabular-ui-demo export-fixtures
```

`KASANE_DATA_DIR` is the dataset's root, the folder holding `01_master_data/` through `05_reporting/`, `docs/` and `onboarding/` (`transcripts/`, the org chart and `close-demo.json`). The script also rewrites the story fixtures in `packages/ui/src/fixtures/kasane.ts`, and stops if the data no longer supports a finding. On an unchanged dataset it produces no diff.

## Running it

From the repo root:

```bash
pnpm dev
```

That builds the package, then runs the demo with the package rebuilding on change. `pnpm build:demo` builds it for production; build the package first (`pnpm build:ui`).

## How it uses Tabular UI

Like any app that installs the package: every component comes from `tabular-ui`, never by a path into `packages/ui/src`, and type-checking goes through the package's built declarations. `src/index.css` imports `tabular-ui/styles.css` and adds the `@source` line that lets Tailwind see the package's classes.

`src/components/` holds what only this app needs: `DemoBanner`, `ExceptionCard`, `ClosePanel` and `HeroThread`. `src/shell/` is the sidebar and member avatars, and `src/views/` what each view puts in the shell's slots.
