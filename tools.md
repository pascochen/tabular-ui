# tools.md

Source of truth for AI coding assistants working in this repository. Tool and dependency facts live here.

The repository is a pnpm workspace: `packages/ui` is the `tabular-ui` package (components and tokens), `apps/storybook` serves its stories, specs and shadcn registry, and `apps/demo` is the Kasane demo built on the package. Paths below are from the repo root. **Design system rules live in `CLAUDE.md` and `docs/design-system.md` — this file does not restate them.**

## How AI assistants should use this file

- Read this file before adding dependencies, changing package scripts, editing build config, or modifying deployment/test setup.
- Prefer the tools already listed here. Ask before replacing them or introducing alternatives.
- Match all commands to the package manager in this file.
- If this file disagrees with `package.json`, lockfiles, or config files, inspect the repo and update `tools.md` after the decision is clear.

## Assistant target

- **Primary assistant:** Claude / Claude Code
- **Context pattern:** `CLAUDE.md` (project + design system rules), `tools.md` (stack facts), optional MCP servers

## Package manager

- **Use:** pnpm
- **Install dependencies:** `pnpm install`
- **Add dependency:** `pnpm add <package>`
- **Run scripts:** `pnpm <script>`
- **Expected lockfile:** `pnpm-lock.yaml` — and only this one

**Never run `npm` or `yarn` in this repo.** A second lockfile makes installs non-reproducible and the failure surfaces days later. If you see `package-lock.json` or `yarn.lock`, stop and report it.

---

## Core stack

### Frontend / app framework

- **Tool:** Vite + React
- **Dependencies:** `vite`, `react`, `react-dom`

- Keep shared UI in reusable React components.
- Avoid framework-specific APIs that would not work in Vite.
- Use Vite environment variable conventions (`import.meta.env`, `VITE_` prefix).

### UI primitives

- **Tool:** shadcn/ui on **Base UI**
- **Dependencies:** `@base-ui/react`, shadcn component source (vendored into the repo)

- **Base UI, not Radix.** shadcn ships both; the Radix docs path is legacy for this project.
- Install with `pnpm dlx shadcn@latest add <component>`. The `shadcn` package is **not** a dependency (removed 2026-10-09): it is a CLI, and it was installed only to supply one stylesheet, `shadcn/tailwind.css`, which brought 26 of 44 audit findings, the one critical among them. The Base UI state variants that stylesheet defined (`data-open:`, `data-checked:`, …) are copied verbatim into `packages/ui/src/styles/shadcn.css`. Run `add` from `packages/ui`, where `components.json` is. If it writes an `@import 'shadcn/tailwind.css'`, delete it. It also writes `@/lib/utils` imports (from `components.json`'s aliases): rewrite them as relative paths. Library code never imports through `@/` (lint enforces it, since 2026-10-09): Storybook compiles the sources directly, and the shadcn registry installs them in the package's own folder layout, where only relative imports resolve. `packages/ui/tsconfig.json` keeps the `@/*` path only because the shadcn CLI refuses to run without it.
- **`@shadcn/react`** (added 2026-10-12): shadcn's headless package, a direct dependency for `MessageScroller`'s behaviour (`@shadcn/react/message-scroller`, in `optimizeDeps.include`). It has no dependencies of its own and contains no Base UI. **Never add the `cn` package.** Since September 2026 shadcn's registry components import `cn` from it, and `add` installs it. Rewrite the import to `packages/ui/src/lib/utils`, whose `cn` is taught the §8.1 type scale (failure log, `text-metric`).
- **Three `components.json` fields are irreversible after `init`:** `style`, `tailwind.baseColor`, `tailwind.cssVariables`. Changing any of them later means deleting and reinstalling every component. `baseColor` is `neutral` and `cssVariables` is `true`; `style` is `base-mira` (decided in scaffold Task 2a, 2026-08-02). Never change these three to resolve a problem — raise it instead.
- Pull from `https://ui.shadcn.com/docs/components/base/*`. **Never** `/docs/components/radix/*`.
- shadcn vendors source into the repo — you own and edit it. Do not wrap components to override styles; edit them.
- Before adding a shadcn component, check `docs/components.md` — it may already be installed and tokenized.

#### `llms.txt` — use for orientation only, never for component URLs

`https://ui.shadcn.com/llms.txt` is a useful map of what shadcn offers. **Every component link in it points at the bare path** (`/docs/components/button`), which is neither the Base UI path this project requires nor an explicit Radix path. Following those links lands on whichever variant shadcn currently treats as default.

Rule: read `llms.txt` to find out *that* a component exists. To read its API, rewrite the URL to `/docs/components/base/<name>` yourself. If a page you land on does not say Base UI, you are on the wrong page — stop and correct the URL rather than reading on.

#### Read shadcn components; do not assume `add` will work

shadcn has moved component geometry **out of the `.tsx` and into a per-style
stylesheet**. A modern component is mostly `cn-<name>-*` class names whose padding,
widths and radii live in `apps/v4/registry/styles/style-mira.css`.

Tabular UI predates that shift: every one of its components carries its own geometry inline
via tokens (`h-[var(--h-control)]`, `px-[var(--pad-control-x)]`), and there are **zero
`cn-*` classes in `packages/ui/src/`**. Its only shadcn surface is `src/styles/shadcn.css`, which
aliases 61 variables onto Tabular UI names.

So before running `add`, check whether the component's source emits `cn-*` classes:

- **It does not** — self-contained, older style. `pnpm dlx shadcn@latest add <name>` is
  fine; retokenize as usual.
- **It does** — the `.tsx` alone gives you undefined classes, and taking the stylesheet
  imports geometry for shadcn's entire catalogue, written against `bg-card` and
  `ring-ring/30`. That becomes a second source of truth for geometry alongside
  `theme.css`. **Read the source and author the component instead.**

`AttachmentRow` is the worked example: shadcn's `Attachment` is nine parts whose
`style-mira.css` rules break three of our caps at once (`rounded-lg`, a 40px media well,
and a `focus-within:ring-1 ring-ring/30` box-shadow ring). One technique from it was
worth keeping and is documented in that component's README; the shape was not.

**Fetching the source.** `ui.shadcn.com` is unreachable from Claude Code web sessions
(egress-blocked), and so are `api.github.com`, `cdn.jsdelivr.net` and `unpkg.com`.
`raw.githubusercontent.com` and plain `git clone` both work, so the reliable route is a
shallow clone of `shadcn-ui/ui`. Do not hand an agent a list of file URLs — a filename
search for a component misses `style-mira.css`, which is usually the file that decides
the answer.
#### The shadcn skill — ask before installing

`https://ui.shadcn.com/docs/skills` documents an installable Claude Code skill (`pnpm dlx skills add shadcn/ui`). It activates on `components.json`, runs `shadcn info --json`, and injects the project's real framework, aliases, icon library, installed components, and **configured base library** into the assistant's context.

That last field is why it is worth considering here: it replaces the guess that produced the Radix-path mistake in the `CLAUDE.md` failure log with a read of actual config.

**It is not installed, and installing it requires asking.** It writes into the repo and changes the behaviour of every future agent session, so it falls under the dependency rule below.

**If it is installed, one conflict is guaranteed.** The skill teaches shadcn's own theming convention — `--background`, `--foreground`, `--muted-foreground`. This project does not use those names; it maps them to ours in the `theme.css` compatibility layer (see `scaffold-prompt.md` Task 4). An agent with the skill loaded has two sources describing what a colour token is called.

**Precedence, when they disagree:** `docs/design-system.md` and `packages/ui/src/styles/theme.css` win on token names and values, always. The skill wins on CLI mechanics, install commands, and component APIs. The skill never authorises renaming one of our tokens or writing a shadcn variable name into a component — that is what the mapping layer exists to prevent.

### Styling and tokens

- **Tool:** Tailwind CSS v4 (OKLCH, `@theme`)
- **Dependencies:** `tailwindcss`, `@tailwindcss/vite`
- **Colour mode:** `useTheme()` (`packages/ui/src/lib/theme.ts`, exported) is the one place an app sets `data-theme` on `<html>`. Call it once in the app's root. Without it a page renders light, since `:root` is the light mode, with no error. It defaults to `dark`, can follow the OS (`'system'`, live), and remembers the user's choice in `localStorage` (`storageKey`, `null` to not remember). Ship the same mode in the app's `index.html` `data-theme`, or the page changes mode on load. Its setter is what `AccountMenu`'s `onThemeChange` takes. Pinned by `apps/storybook/tests/theme.spec.ts`.
- **Token file:** `packages/ui/src/styles/theme.css` — generated once, never regenerated; changed only by transcribing an approved spec section and logging it in the header (`CLAUDE.md`)
- **Palette generator:** `packages/ui/scripts/generate-palette.mjs` (added 2026-10-16) computes the Riso Ledger ramps in OKLCH and writes `docs/palette.md`, `docs/palette.json` and `packages/ui/src/styles/palette.css` (the `--color-{ramp}-{step}` primitives theme.css points at). Run it with `pnpm --filter tabular-ui palette`; never edit those three files by hand. `apps/storybook/tests/palette.spec.ts` fails if `palette.css` and `palette.json` disagree. **Dependency:** `culori` (dev, pinned exactly, 4.0.2 since #92), for the colour maths and WCAG contrast. `docs/reference/tui-palette-main.json` is the pre-Riso palette (commit ab4a681), read only for the old-vs-new comparison.
- **Contrast check:** `pnpm --filter tabular-ui contrast` (`packages/ui/scripts/check-contrast.mjs`) resolves every `--tui-*` colour in `theme.css` through `palette.css` and checks WCAG contrast on every ground it sits on (canvas, surface, raised, the row states, its own tint), in both modes: 4.5:1 for text and on-colours, 3:1 for the ring, fills and chart series; the two borders are reported, not gated. It fails on a colour that is not a palette reference, in any `--tui-*` token, and on a token one mode declares and the other does not (until 2026-10-21 it read only the tokens it gated, so ten per mode went unchecked). No browser, under a second. `apps/storybook/tests/contrast.spec.ts` measures the key pairs in a real browser. Not part of CI; run it after any colour change.

Styling rules are **not** in this file. See `CLAUDE.md` for the non-negotiables and `docs/design-system.md` for measured values. Do not duplicate them here; two always-loaded files with overlapping rules will drift and contradict.

### Icons

- **Dependencies:** `@phosphor-icons/react` (MIT, direct dependency)
- `components.json` carries `"iconLibrary": "phosphor"`, so `shadcn add` vendors Phosphor imports directly — no hand-rewriting per component.
- `shadcn add` writes the imports but does **not** install the package. It is a direct dependency for that reason; do not prune it as unused.
- **Never install `lucide` or `hugeicons`.** They are excluded from the stack. If a vendored component arrives with either import, that is a misconfigured `iconLibrary` — fix the config, do not hand-patch the component.
- Rules, weight mapping and size tokens: `docs/design-system.md` §11.

### Fonts

- **Dependencies:** `@fontsource-variable/source-sans-3` (body), `@fontsource-variable/source-serif-4` (headings and the metric tier) and `@fontsource-variable/source-code-pro` (mono), all installed and self-hosted. They replaced `@fontsource-variable/archivo` and `@fontsource-variable/jetbrains-mono` on 2026-10-16, and both were uninstalled. Archivo had replaced Inter and Inter Tight on 2026-10-08.
- **Import Source Serif 4 from `opsz.css` and `opsz-italic.css`, never the package default.** The default entry point ships wght-only files, which silently turns `font-optical-sizing` into a no-op with no error at any stage. Source Sans 3 and Source Code Pro import `wght.css` and `wght-italic.css`. The italic files are separate in every family, and without them the browser slants the roman. All six imports are in `packages/ui/src/index.css`.
- **Family names carry a `Variable` suffix.** `@fontsource-variable/*` registers e.g. `"Source Code Pro Variable"`. A font stack naming only the plain form falls through to the system fallback and renders the wrong face silently. `apps/storybook/tests/density.spec.ts` asserts each family loads under that name.
- `font-optical-sizing: auto` stays enabled, and drives Source Serif 4's `opsz` axis: the text cut for headings, the display cut for the metric tier. See `docs/design-system.md` §8.4.
- If subsetting, verify the `tnum` and `zero` OpenType features survive. Subsetters strip unused features by default and both are mandatory.

### Linting — the primary design system gate

- **Tools:** ESLint, Stylelint
- **Dependencies:** `eslint`, `stylelint`, project rule sets

This is the highest-value verification for this codebase. Most of the design system checklist is statically analyzable and runs in milliseconds with zero flake. Rules enforce:

- No raw hex or raw scale names outside `theme.css` and the generated `palette.css`: neither Tailwind's (`blue-400`) nor the Riso ramps (`sage-700`, `ledger-925`), including the alpha slash form (`bg-vermilion-500/10`). **The scale names come from one list, `lint/palette.mjs`**, shared by both lint configs. `apps/storybook/tests/palette.spec.ts` checks it against Tailwind's own palette, checks that `theme.css` strips every Tailwind scale (all of them since the Riso Ledger palette, 2026-10-16), that `palette.css` defines exactly the Riso ramps with the generated values and loads after `theme.css`, and that the design-review skill's grep names every banned scale. When Tailwind adds a scale, that test fails on the update's PR. Add the scale to `palette.mjs`, then add it to `theme.css`'s strip list by transcribing the spec (§9).
- No 900/950 chromatic steps in any background property
- No `font-weight` above 600
- No softened corner (§7.7, since 2026-10-22): no bare `rounded`, no bracketed radius but a tier token, `inherit` or 0, no non-zero inline `borderRadius`, and no non-zero `border-radius` length in CSS but 9999px
- No component spacing above 32px, radius above 8px, control height above 36px; frame spacing (`--pad-frame-*`) capped at 64px and allowed only in `AppShell`, `EmptyState` and each workspace app's `App.tsx`
- `tabular-nums` required on numeric cell classes
- No `box-shadow`-based focus rings — `outline` only
- No color token declared under bare `--text-*` in `@theme` — that is Tailwind's font-size namespace, colors are `--color-text-*`
- The same caps on **bracketed** values: `p-[40px]`, `h-[48px]`, `rounded-[12px]`, `font-[700]` (added 2026-10-08; until then they walked past every cap)
- No raw colour function (`rgb()`, `oklch()`, …) inside a colour utility, and no `bg-white` / `text-black`.
- One shadow (§4 *Elevation*, since 2026-10-19): no shadow utility but `shadow-overlay` and `shadow-none`, in any of the four namespaces (`shadow-*`, `inset-shadow-*`, `drop-shadow-*`, `text-shadow-*`), named, bracketed or as a colour (`shadow-border-strong` repaints both layers of the overlay sheet and turns it solid). Also no `[box-shadow:…]` and no `boxShadow` / `textShadow` in an inline style. The story tests back this up at runtime: `apps/storybook/.storybook/elevation-sweep.ts` runs after every story in both modes and fails any painted shadow that isn't the sheet, drawn in the element's own surface and border colours.
- In component code (not stories): no literal colour, spacing, or weight above 600 in an inline `style`
- Outside `packages/ui/src/components/foundational/`: no `<button>` element. Use `Button` / `IconButton`, with `variant="inline"` for a control inside another component's structure (a sort header, a tree row). No exemptions remain. Also caught since 2026-10-12: the tag reached through a variable (a PascalCase binding holding `'button'`, rendered as `<Row>`) and `createElement('button')`.
- On `Badge`, `ProgressBar`, `StatusBadge` and `CountBadge`, no tone name in `role` (`role="danger"`): the colour prop is `tone` since 2026-10-09, and `role` is the ARIA attribute.

The last rule guards the only failure in this list that produces no error at any stage: a color under `--text-*` compiles cleanly and emits a font-size utility. See `docs/design-system.md` §4.

**Run `pnpm lint` before any other verification.** It is faster and catches more design system violations than the test suite. **It fails on any warning** (`--max-warnings 0`, both linters, since 2026-10-09): a warning nobody acts on teaches everyone to ignore the next one. A warning that is correct and unfixable gets a line-level disable with the reason beside it, as `DataTable` does for React Compiler and TanStack Table.

### Formatting

- **Tool:** Prettier (`.prettierrc.json`: single quotes, semicolons, 120 columns, trailing commas), added 2026-10-11.
- **Scope:** code and config only (`.ts`, `.tsx`, `.js`, `.mjs`, `.json`, `.yml`). `.prettierignore` leaves out Markdown (prose is written by hand, and Prettier would rewrite the spec's tables), CSS (Stylelint's job; `theme.css` is edited only by transcribing an approved spec section), HTML, the lockfile, screenshots and generated output.
- **Pre-commit hook:** `pnpm install` runs `prepare`, which has husky point git at `.husky/`. The hook runs lint-staged, which formats only the staged files. If lint-staged isn't installed, the hook says so and lets the commit through.
- **CI:** `pnpm lint` ends with `prettier --check .`, so anything the hook didn't see fails there. `pnpm format` formats everything.
- **`.git-blame-ignore-revs`** lists the reformat commit, so blame looks past it to who last changed a line's meaning. GitHub's blame view reads it on its own. For local `git blame`, run `git config blame.ignoreRevsFile .git-blame-ignore-revs` once per clone. It isn't set by default, because Git refuses to blame at all on a branch where the file doesn't exist yet. Add any future mass reformat to the file, by its full commit ID.
- **No Tailwind class-sorting plugin.** Reordering a class string changes which class wins in `cn()`, so it can change what renders. Don't add one.

### Testing and verification

- **Tools:** Playwright + Vitest
- **Dependencies:** `@playwright/test`, `vitest`

- Vitest for unit and component logic.
- Playwright for the two things that only exist in a real browser: **focus ring clipping** inside `overflow: hidden` scroll containers, and **computed contrast** of rendered tokens via `getComputedStyle`. Neither is visible to jsdom.
- Prefer one focused Playwright check over broad brittle coverage.
- `pnpm test` runs axe on every story, and **a violation fails the test** (`a11y.test: 'error'` in `apps/storybook/.storybook/preview.tsx`, since 2026-10-08). A story that cannot pass yet takes a named exception from `packages/ui/src/fixtures/a11y-exceptions.ts` (story data, beside the stories that use it), which turns off one rule on that story and records why. Never lower the mode to get a story green. **Every story runs twice, once per mode** (since 2026-10-09): `apps/storybook/vite.config.ts` has a `storybook (dark)` and a `storybook (light)` Vitest project, each with a setup file (`.storybook/story-theme.{dark,light}.ts`) that names its mode for the preview decorator and fails every story whose page did not render in it. Not Vite's `define`: it is shared across Vitest projects, so with it both projects rendered light and the dark pass silently checked nothing. When changing this, prove it by removing an exemption and checking that only the mode it applies to fails. **Each project also pre-bundles dependencies into its own folder** (`node_modules/.cache/storybook/sb-vitest-{dark,light}`, set by a small `enforce: 'post'` plugin, because Storybook's test plugin overrides `cacheDir` with one folder hashed from the Storybook config). That is a precaution. It was credited with fixing CI failures where the last story files failed to import, which came back unchanged. **Every story file starts with a garbage collection** (`.storybook/story-gc.ts`, since 2026-10-10), and Chromium launches with `--js-flags=--expose-gc` so it can. Playwright's default `--disable-dev-shm-usage` makes Chrome back its shared memory with deleted files in `/tmp`, on the runner's root disk. On CI's two cores each project runs every story file in one page. A removed iframe's share was freed only on a major GC, so Chrome held 11 GB, the disk filled, and the last files failed to load or hung (run 38056871458). `df` sees that space and `du` does not, and it is freed when the browsers close, so no log ever says "No space left on device". If `gc()` is not exposed, every story fails. Do not remove the call to speed the suite up without measuring the disk on CI.
- The specs, the Storybook config and the Vite and Playwright configs are type-checked by `apps/storybook/tsconfig.json`, and the stories by `packages/ui/tsconfig.json`, where they live: `pnpm typecheck` runs both, and CI runs it.
- Keep selectors user-facing: role, label, text, accessible name.

#### Story tests that stop making progress

Vitest times out a test or a hook from inside the page. A story that locks the page's main thread stops those timers too, and a file whose import never settles is never timed at all. Either way the run waits forever, with nothing in the log saying why. That happened on CI on #37 and #40 (2026-10-10): the Story tests step sat for 28 minutes until the job's 30-minute limit cancelled it. The cause was the runner's disk filling with Chromium's shared memory, fixed by #44 (see the story-test bullet above); the files it landed on, LineageTree among them, were simply the last to load. This watchdog stays as the guard for whatever freezes next.

**`apps/storybook/.storybook/story-progress-watchdog.ts`** is a Vitest reporter, registered in `apps/storybook/vite.config.ts`, that watches for silence. Every file queued, loaded and finished, and every story started and finished, counts as progress. After **180 seconds** with none, it prints each unfinished file, whether it loaded, and the last story it reported, then fails the run with exit code 1. A frozen page cannot report the story that froze it, so **suspect the story after the last one reported**. 180s covers the longest quiet stretch of a healthy run: CI's start, about 70s of cold dependency pre-bundling.

It replaced a per-file load timer (#39), which a story freezing *after* its file loaded walked straight past (#40). Throwing from a setup file inside the page doesn't work either: Vitest logs it as an unhandled error and keeps waiting.

- **When it fires:** the message names the file and the story. Re-run once; if it fires again, investigate that story rather than retry.
- **`--reporter` on the command line replaces the configured list, watchdog included.** `pnpm test` keeps it.
- **Proving a change to it:** add scratch story files for both shapes, one whose module never resolves (`await new Promise(() => {})` at the top level) and one whose second story's `play` never yields (`for (;;) {}`). Lower the limit and check that the run ends naming both files in both projects: "still loading" for the first, "loaded; last story reported" for the second. Delete both afterwards.

#### Storybook port — one per checkout, derived from its path

Playwright drives Storybook at `http://localhost:<port>` and, if nothing answers there, boots it with `pnpm exec storybook dev -p <port> --ci`. Off CI it **reuses any server already on that port**, and it cannot tell which checkout that server is serving. With several worktrees under `.claude/worktrees/`, a shared port lets a run test another branch's code, and nothing reports it. Failing tests are the safe outcome here. The dangerous one is a passing run against code that is not yours.

So the port is not shared. `apps/storybook/tests/storybook-port.mjs` derives it from the checkout's absolute path (FNV-1a into 7100–7999), so every worktree gets its own and keeps it across runs. The range avoids 6006, which `pnpm storybook` and `.claude/launch.json` use, as well as 7000 (macOS AirPlay) and every port Chromium refuses to load. To print this checkout's port:

```bash
node apps/storybook/tests/storybook-port.mjs
```

`STORYBOOK_PORT` overrides the derived port, e.g. to reuse a Storybook you already have open on 6006 in this same checkout:

```bash
STORYBOOK_PORT=6006 pnpm test:playwright
```

Two checkouts can still hash to the same port (about a 2% chance with seven), and an override can point at someone else's server. Before trusting a green run on a port that was already in use, check who holds it: `lsof -a -p "$(lsof -tiTCP:<port> -sTCP:LISTEN)" -d cwd` prints the serving process's checkout. CI is unaffected: there `reuseExistingServer` is off and every run boots its own Storybook.

#### Claude Code cloud sessions

A cloud session starts on a fresh VM from a fresh clone: no `node_modules`, and a Chromium in `/opt/pw-browsers` that does not match the pinned Playwright (on 2026-10-12, revision 1194 = Chromium 141, against 1.63's 1243 = Chrome 153). Playwright can launch the old build, but a green run on it says nothing about CI's browser, so it is not used.

- **`.claude/hooks/session-start.sh`** runs on startup and resume (registered in `.claude/settings.json`): `pnpm install --frozen-lockfile`, then `pnpm --filter tabular-ui-storybook exec playwright install chromium`, which installs whatever revision the branch pins. It exits at once unless `CLAUDE_CODE_REMOTE=true`, so it never runs on a laptop. About 30s on a new VM, about 3s on resume.
- **The environment must allow `cdn.playwright.dev`** (environment settings → Network access → Custom, default list kept). It redirects to `storage.googleapis.com`, which the default list already allows. Without it the browser download gets a 403 from the proxy and no story test can run.
- **The container's `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` does not stop `pretest`.** Playwright reads it only on postinstall; an explicit `playwright install` ignores it.
- **A hook, not the environment's setup script.** A setup script's result is snapshotted for up to seven days, so after a Playwright update it would serve a stale browser.
- **A session with more than one repository loads no repo hooks.** Run the two commands by hand there.
- On the cloud VM's 4 cores, a full `pnpm test` peaked at 336 MB of Chrome shared memory in `/tmp` (see the story-test bullet above), against 11 GB on CI's two cores before #44.

### Component development

- **Tool:** Storybook
- **Dependencies:** `storybook`, `@storybook/react-vite`

- Every component ships a `[Name].stories.tsx` co-located with its source.
- Autodocs is on globally (`tags: ['autodocs']` in `preview.tsx`): each component gets a Docs page with a props table generated from its types and JSDoc. Write prop JSDoc for the reader of that table.
- Stories are the input to visual regression. Cover both modes and all five semantic roles.

### Visual regression

- **Tool:** Playwright `toHaveScreenshot()`, `apps/storybook/tests/visual.spec.ts` (decided 2026-10-08: no new dependency, no external service). Tagged `@visual`; `pnpm test:visual`.
- Every story, dark and light, at 1280×800, full page. Story ids come from Storybook's `/index.json`, so a new story is covered with no test change.
- Runs under `apps/storybook/playwright.visual.config.ts` against a **static** Storybook build served by `vite preview`, not the dev server. On the dev server CI took ~5s a screenshot and timed out at 20 minutes: GitHub's private-repo runners have two cores, so Playwright runs one worker. Static, a one-worker run takes under a minute locally. Waits are explicit (fonts ready, images complete), never `networkidle`, which idles 500ms per story.
- Runs as a PR gate (CI step "Visual regression (screenshots)"), not as an assistant verification step. Do not invoke it after an edit.
- **Baselines are Linux-only** and the spec skips elsewhere. Never commit a `-darwin` screenshot (they are gitignored). Regenerate with the `visual-baselines.yml` workflow: label a PR `update-visual-baselines`, or run it from the Actions tab on a branch. It refuses `main`.
- **CI never writes a baseline** (`updateSnapshots: 'none'` under `CI`). With Playwright's default, a missing baseline is written on the first attempt and passes on the retry, so an unreviewed story would go green.
- **Declared visual changes** (2026-10-20). A PR lists the story files it expects to change under a "Visual changes" heading in its description (CONTRIBUTING.md, "Visual changes"). `apps/storybook/scripts/visual-gate.mjs` wraps `pnpm test:visual` in CI and reads Playwright's JSON report (`apps/storybook/visual-results/results.json`). When every change is in a declared file, Verify passes and the `Visual changes` job in `ci.yml` commits the screenshots Verify rendered, then creates a `Verify` check run on that commit itself (GitHub Actions app, so it satisfies branch protection) instead of a second full run. That job holds the only write token and installs nothing. Its commit is checked to touch nothing but `apps/storybook/tests/visual.spec.ts-snapshots/*.png`.
  - Accepted images are the run's own renders: a changed screenshot is rendered twice (CI's one retry) and both must be byte-identical. A new story has no image under `updateSnapshots: 'none'`, so the gate renders those tests again with `--update-snapshots=missing --repeat-each=2 --workers=1` (Playwright turns retries off while writing baselines): the first repeat writes, the second must match.
  - The PR comment (`<!-- tui-visual-changes -->`) carries a state line listing files that changed undeclared on that PR. Verify reads it, and a later declaration of such a file is refused. **Agents: declare before the first push, from what the change is meant to do. Never add or widen a declaration because a run showed a change**; that file is the owner's label.
  - Declarations come from the event payload, so a re-run reads the body as it was at the push. Dependabot and fork PRs skip the sorting and fail as before.
- **Matching is exact** (`threshold: 0`). Playwright's default per-pixel tolerance of 0.2 is wider than this palette's own steps: an olive-800 border on the olive-950 canvas (the palette before Riso Ledger) sat inside it, and a 6px → 4px radius change on `CodeView` passed. Three runs gave 342 byte-identical screenshots, so there is nothing to tolerate. Do not loosen it to quiet a flaky story: find what is nondeterministic in the story.
- `TUI_VISUAL_ANY_OS=1` runs the spec on macOS, for debugging the spec only.

### CI minutes

Verify takes about 25–27 minutes and is capped at 45 (raised from 30 on 2026-10-20, when 22 declared story files ran out of time in the visual step, which renders every changed screenshot again on retry). While the repository is private, its minutes count against the owner's GitHub plan; once public, standard runners are free. If the plan's minutes run out, GitHub stops starting jobs: every check fails in 2–3 seconds with no steps, and the job's annotation names billing or a spending limit. **That is billing, not code**: read the annotation before diagnosing.

- **Docs-only PRs skip verification.** The `Scope` step in `ci.yml` diffs the PR's merge commit against `main`. If every changed file is `.md`, every later step is skipped and Verify passes in about a minute. `.mdx` is not docs (Storybook loads it). Pushes to `main` and any PR whose file list can't be read run in full. If a test, build or story ever starts reading a `.md` file, remove the skip.
- **Every re-run is another full run.** Re-run a failed Verify only when the failure is understood. Avoid multi-job experiments on CI unless the question can't be answered locally.

### Branch protection

Not configured yet: set it in Settings → Branches once the repository is on GitHub. The rules the workflows assume:

- **Required check: `Verify`, pinned to GitHub Actions** (app 15368), so no other app can satisfy it by posting a check with that name. **If the CI job is ever renamed, update the rule in the same PR**, or nothing can merge.
- **Up to date with `main` before merging.** When `main` moves, "Update branch" and Verify runs again on the combination.
- **Pull requests only:** no direct pushes, no force pushes, no deleting the branch, admins included: a rule an admin can skip gets skipped.
- **No approving review required** while there is one contributor (GitHub doesn't let you approve your own PR). Raise it, and add `CODEOWNERS`, when there's a second.
- **Docs-only PRs still pass**: their skipped Verify reports success, which satisfies the rule.
- **A `Verify` check can come from a job other than `verify`.** The `Visual changes` job creates one on the commit it pushes, which is the verified commit plus that run's screenshots (see "Visual regression"). The up-to-date rule still forces a real run whenever `main` moves.

### Package and releases

- **Build:** `pnpm build:ui`. Vite's library mode writes one ES module per source file to `packages/ui/dist` (dependencies and peer dependencies stay imports, unminified so the class strings Tailwind scans stay whole), `tsc -p tsconfig.build.json` writes the declarations beside them, and the CSS is copied as source: it is Tailwind input, compiled by the consuming app. Stories and `src/fixtures/` are never in `dist`.
- **Peer dependencies:** React 19, `@phosphor-icons/react` (a second copy would break the `IconContext` `Button` sets icon weight through) and Tailwind CSS 4.
- **What a consuming app adds:** `@import 'tabular-ui/styles.css'` in place of its own `@import 'tailwindcss'`, and an `@source` line pointing at `node_modules/tabular-ui/dist`. `packages/ui/README.md` documents it, and `apps/demo/src/index.css` is the working example.
- **Versions and changelog: Changesets** (`@changesets/cli`, root dev dependency; config in `.changeset/`). `pnpm changeset` records a change, `pnpm version-packages` turns pending changesets into a version and `packages/ui/CHANGELOG.md`, and `pnpm release` builds and publishes. Only `tabular-ui` is versioned; the apps are private. Publishing needs the owner's npm login: an agent never publishes.

### shadcn registry

- **Build:** `pnpm build:registry` runs `packages/ui/scripts/build-registry.mjs`, which writes `packages/ui/registry.json` from the component folders and their imports (never edit it by hand), then runs `shadcn build` (pinned in the script, run through `pnpm dlx`, never installed) into `apps/storybook/public/r/`. That folder is gitignored and rebuilt by `pnpm build`.
- **Items:** one per component, one per shared module (`utils`, `theme-mode`, `motion`, `elapsed`, `control-base`, `popup-surface`, `danger-variant`, `working-label`), `tokens` (the stylesheets, with a `tokens.css` that leaves out `@import 'tailwindcss'`), and `all`. Every component depends on `tokens`.
- **Installed layout:** every file is `registry:file` with a target under `@components/tabular-ui/`, mirroring `packages/ui/src`. shadcn copies a `registry:file` byte for byte, so the relative imports between files resolve as they do here, and an install never replaces the app's own `lib/utils`. Verified 2026-10-23 by installing `all` into a fresh Vite app from a local server: 71 files, byte-identical, and the app built and rendered.
- **URLs:** `registryDependencies` use `https://tabularui.com/r/<name>.json`, served by a rewrite on the owner's site to `storybook.tabularui.com/r/`. `REGISTRY_URL` overrides the base, e.g. for a local test.

### Platform / delivery

- **Hosting:** Vercel, two projects from this repository: `apps/storybook` at `storybook.tabularui.com` (Storybook and the registry under `/r`), and `apps/demo` at `demo.tabularui.com`. `tabularui.com` itself is the owner's private site, which rewrites `/r/*` to Storybook.
- Do not add deployment-specific dependencies.
- Prefer portable scripts and environment variable names.

---

## Commands

| Command | Purpose |
|---|---|
| `pnpm dev` | The demo, with the package rebuilding on change |
| `pnpm storybook` | Storybook dev server |
| `pnpm build` | The package, the registry, Storybook, then the demo |
| `pnpm build:ui` | The package only |
| `pnpm build:registry` | `registry.json` and the registry JSON in `apps/storybook/public/r` |
| `pnpm lint` | ESLint + Stylelint + Prettier, failing on any warning. **Run this first.** |
| `pnpm typecheck` | Builds the package, then type-checks every workspace package (the demo checks against the built declarations) |
| `pnpm test` | Every story in headless Chromium, both modes, with axe |
| `pnpm test:watch` | The story tests in watch mode |
| `pnpm test:playwright` | Playwright browser checks, on this checkout's own Storybook port (see above) |
| `pnpm test:visual` | Screenshot comparison (Linux only; CI) |
| `pnpm changeset` | Record a change to the package for the next release |
| `pnpm --filter tabular-ui palette` | Regenerate the palette |
| `pnpm --filter tabular-ui contrast` | Check every colour token's contrast |
| `KASANE_DATA_DIR=… pnpm --filter tabular-ui-demo export-fixtures` | Rebuild the demo's and the stories' Kasane fixtures from the full dataset |

Note: there is no `test:ui`. It was ambiguous between Vitest UI mode and "test the UI" — use `pnpm test:watch` or `pnpm storybook` explicitly.

---

## Dependency rules

- Do not add a new UI library, state library, test runner, or deployment tool without checking existing config first.
- **Never add Radix packages.** We are on Base UI. If a shadcn component pulls Radix as a transitive dependency, that is the wrong variant — reinstall from the Base UI docs path.
- If a needed package is missing, explain why before adding it.
- Keep generated files, lockfiles, and config changes scoped to the requested task.
- Never commit secrets, `.env` values, access tokens, API keys, or local machine paths.

### Dependency updates

**Security alerts and automatic security-fix PRs are on** (repo settings, since 2026-10-22). Until then nothing flagged a known advisory: Vitest sat under one for two months. A security-fix PR is reviewed like any other.

**Third-party actions are pinned to a commit SHA**, with the version in a comment (`pnpm/action-setup@<sha> # v6.0.10`), because a tag can be moved and the workflows that use them hold a write token. Dependabot keeps SHA pins current. GitHub's own `actions/*` stay on tags.

`.github/dependabot.yml` (added 2026-10-10) opens update PRs every Monday: npm (pnpm's lockfile) and GitHub Actions, at most 5 open at once. It waits **7 days** after a release before proposing it, because broken and compromised releases are usually pulled within days.

- **Packages that must move together share a group**, so one PR updates all of them: Base UI, React, Storybook (with its addons and lint plugin), Vitest (with its browser and coverage helpers), Playwright, Tailwind, lint tooling, and everything else. The review found two Vitest helpers pinned apart from Vitest; a group keeps that from recurring.
- **Groups take minor and patch updates only.** A major update arrives as its own PR and is reviewed alone.
- **The workspace moves together.** `packages/ui`, `apps/storybook` and `apps/demo` resolve through one lockfile, and their dependencies use `^` ranges. A major update to a package more than one of them lists needs each `package.json` raised in the same PR.

Reviewing one:

- **It merges on the Verify its PR page shows**, like any other PR. Branch protection blocks the merge until Verify passes and the branch is up to date (see "Branch protection").
- **If Visual regression fails, a dependency changed how something renders.** Fonts, Tailwind and Base UI are the likely ones. Open the diff report: an unintended change is a regression to fix or the update to decline, not a baseline to approve. If it is intended, the `update-visual-baselines` label works as on any PR.
- **A Base UI update** is the one to read closely. The foundational behaviour tests (`apps/storybook/tests/tabs.spec.ts`, `dialog.spec.ts`, the menu and switcher specs) are what pin its behaviour. If it adds an entry point a component uses, add it to `optimizeDeps.include` in `apps/storybook/vite.config.ts`, as `tabular-ui > <entry>` (see the failure log).
- **Never fix one by hand-editing the lockfile.** Comment `@dependabot rebase` or `@dependabot recreate` on the PR instead. To skip a version, comment `@dependabot ignore this minor version` (or `major`, or `dependency`).

---

## Verification order

1. `pnpm lint` — fastest, catches the most design system violations
2. `pnpm test` — component and logic regressions
3. `pnpm test:playwright` — only for UI changes touching focus, overflow, or token rendering
4. Visual and human checks from `docs/design-system.md` §10 — irreducibly manual, do not claim these were done

If verification cannot run locally, state what was skipped and why. **Do not report a task complete on the basis of a suite you did not run.**

---

## Reference from other agent files

```md
Before changing tools, dependencies, scripts, tests, UI libraries, or deployment
settings, read ./tools.md. Use it as the canonical map of the project stack and
commands. Design system rules are in CLAUDE.md and docs/design-system.md.
```
