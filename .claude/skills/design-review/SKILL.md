---
name: design-review
description: Run the Tabular UI design system verification checklist against changed UI code. Use before opening a PR that touches components, styles, or tokens; when the user asks to review UI, check design system compliance, verify tokens, or audit styling; or when finishing any task that added or modified a component.
---

# Design review

Verifies changed UI against `docs/design-system.md` §10. This is the verification step `CLAUDE.md` requires before any UI PR.

**Report findings. Do not fix them unless asked.** A review that silently rewrites code teaches nothing and hides the pattern that caused the problem.

## 1. Scope the diff

```bash
git diff --name-only main...HEAD
```

Review only changed files. If there is no diff, ask what to review rather than scanning the whole repo.

Relevant extensions: `.tsx`, `.ts`, `.css`. Ignore tests and stories for rules 1–6 below, but **do** check that stories exist (§4).

## 2. Automated checks — run these first

```bash
pnpm lint
pnpm build
```

Lint encodes six of the checklist items and runs in milliseconds. If it fails, stop and report — no point reviewing further until it passes.

Then grep for what lint may not yet cover. **Keep the `--include` globs quoted.** Unquoted, zsh expands `*.tsx` itself, fails with "no matches found", and the grep never runs, which prints nothing and looks exactly like a clean result:

```bash
# raw scale names (Tailwind's and the Riso ramps) outside theme.css and palette.css
grep -rnE '\b(blue|red|amber|emerald|violet|teal|pink|lime|cyan|fuchsia|sky|indigo|orange|yellow|green|purple|rose|olive|neutral|slate|gray|zinc|stone|mauve|mist|taupe|ledger|sage|vermilion|ochre|federal|orchid)-[0-9]{2,3}\b' packages/ui/src --include='*.tsx' | grep -v 'styles/theme.css'

# chromatic 900/950 used as background
grep -rnE 'bg-(sage|vermilion|ochre|federal|orchid|teal)-(900|925|950)' packages/ui/src

# font weights above 600
grep -rnE 'font-(bold|extrabold|black)|font-\[?[7-9]00' packages/ui/src

# box-shadow focus rings
grep -rn 'focus.*shadow\|shadow.*focus' packages/ui/src

# raw hex
grep -rnE '#[0-9a-fA-F]{3,8}\b' packages/ui/src --include='*.tsx' --include='*.css' | grep -v 'styles/theme.css'
```

## 3. Read the diff against the spec

For each changed component, check:

**Tokens**
- Semantic layer used before primitives — `--pad-cell-x` not `p-2`, `--color-text-danger` not `text-vermilion-400` (§7.1, §7.4)
- No raw hue referenced in component code (§0 rule 10)
- Property-first token names — `--color-text-danger`, never `--danger-fg`, and never a colour under bare `--text-*` (Tailwind's font-size namespace) (§4)

**Color**
- Color used for state, not hierarchy. Structure, labels, dividers, secondary actions all neutral (§0 rule 1)
- No sixth hue (§0 rule 2)
- Chromatic tints use `{hue}-500/10`, never the 900/950 steps (§0 rule 3)
- Polarity color on variance and delta columns only, not every number (§5)

**Density**
- No component spacing above 32px, radius above 8px, control height above 36px (§7.3, §7.6, §7.7). `--pad-frame-*` (≤64px) appears only in `AppShell`, `EmptyState` and each workspace app's `App.tsx` (§7.3 "Frame tier")
- Table rows 28px default, log rows 24px (§7.6)
- Status badges `--radius-xs`; controls and filter chips `--radius-md` (since 2026-10-15). Badges are not pills (§7.7)

**Type**
- Every numeric element carries `tabular-nums` (§8.6)
- Font weight ≤ 600 (§8.5)
- `--font-display` only at `--text-metric-sm` and above; nothing at 20px or below (§8.2, §8.3)
- No `--tracking-tight` on metric tiers (§8.8)

**Structure**
- No primitive re-implemented inline. A styled `<button>` in a table row is a finding (`CLAUDE.md` §Components)
- Agent-authored content uses `AgentBlock`, not a generic card (`CLAUDE.md`)
- New component registered in `docs/components.md` and exported from `packages/ui/src/index.ts`

## 4. Stories and modes

Every new or changed component needs a story covering **both modes** and, where applicable, **all five semantic roles**. A component with only a light-mode story is incomplete — dark is the canonical target.

```bash
pnpm storybook
```

## 5. Browser checks — only if the change touches focus, overflow, or tokens

```bash
pnpm test:playwright
```

Two things only a real browser sees:
- Focus rings must use `outline`, and must survive inside `overflow: hidden` scroll containers (§4)
- Computed contrast of rendered tokens against the active canvas

## 6. Human checks — flag, never claim

These cannot be automated. **List them as outstanding; do not report them as passed.**

- Do the five `--color-text-{role}` tokens read as equal weight side by side? They share one lightness since Riso Ledger (§2, 2026-10-16), so any role that still dominates does so by chroma
- Light mode: do cards and popups separate from the page by border alone, paper on paper (§3, 2026-10-16)?
- Dark mode: does a menu on `ledger-925` lift off the `ledger-950` page (§3, §4 Elevation)?
- Grayscale test: is every state still distinguishable by icon, label, or position?
- Deuteranopia: do chart series 1 and 4 (federal, orchid), the closest pair, stay separable?
- Sustained reading: does text bloom at the edges after 30 minutes on the dark table view?

## Report format

```
## Design review — <branch>

Automated:  pnpm lint ✅ · pnpm build ✅ · playwright ⚠️ skipped (no focus/overflow changes)

### Findings
1. [§7.4] DataTable.tsx:42 — `p-2` instead of `--pad-cell-x`
   Why it matters: three tables will land on three different paddings.

2. [§8.6] MetricTile.tsx:18 — figure missing `tabular-nums`
   Why it matters: misaligned figure columns are a correctness hazard.

### Outstanding — human verification required
- equal weight of the five role colours; paper-on-paper separation in light; menu lift in dark (§2, §3)
- grayscale distinguishability

### Clean
Token naming · density caps · no raw hues · stories cover both modes
```

Cite the spec section for every finding, and state **why it matters**, not just what is wrong. A finding that says "use `--pad-cell-x`" prevents one instance; one that explains the drift it causes prevents the pattern.

## After the review

If a finding represents a mistake likely to recur, add a line to the **Failure log** in `CLAUDE.md`. That section is the only part of the system that improves over time — a review that finds a novel error and doesn't record it has done half the job.
