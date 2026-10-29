# Demo: Kasane onboarding

The public demo at [demo.tabularui.com](https://demo.tabularui.com): a five-step onboarding journey for an AI finance tool, on one route with a step state machine (no router), built from Tabular UI.

1. **Upload**: dashed dropzone (§7.8: dashed = awaiting content). Accepts `.txt` `.md` `.jpg` `.jpeg` `.png` `.csv`, 5 MB per file.
2. **Files selected**: same frame, border goes solid; per-file validation status via `runStatuses` (`passed` / `needs-review` / `queued`).
3. **Pre-flight dialog**: what was detected, computed from the actual files (the flagged CSV really lacks a header row; the app read it).
4. **Reading**: simulated long run: stage tracker, overall progress, time remaining, per-file `RunLogRow`s. Cancellable, and says you can leave.
5. **Recap**: counts found and run summary, "Open modeling".

## Playing it

A visitor plays Mei Tachibana, Head of FP&A at **Kasane Corporation**, a fictional Tokyo printer maker, and needs no files of their own:

- **"Use Kasane's files"** loads the company's 20-file pack. The pack's contents are not in this repository: each file is a stand-in built from `data/pack.json`, carrying the real file's name and size, and a spreadsheet's first line. Stand-ins go through the same validation as a dropped file: the bank export really has no header row, and the check really reads its first line.
- **The agent is scripted, not simulated at random.** `data/findings.json` lists the contradictions, gaps and follow-ups in the material, with evidence computed from the data, and the files each one rests on. The recap counts a finding only when all its files were read, so cancelling halfway shrinks the counts, and a visitor's own files give none.
- **Deep links:** `?step=files|preflight|reading|recap|discovery` opens the journey at that point with Kasane's files already validated. The URL follows the journey, so any screen can be shared.
- The run is shortened to under a minute and says so, and "Skip to results" ends it.
- `DemoBanner` says all of this in one line; see its README.

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

`src/components/` holds two components only this app needs: `StageTracker`, placed here deliberately (promote it into Tabular UI when a second screen needs it), and `DemoBanner`.
