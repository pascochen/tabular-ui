# Tabular UI — Token Specification

**Target:** Tailwind CSS v4 (`@theme` / OKLCH)
**Product:** Agentic ERP finance & ops data pipeline platform
**Scope:** dense dashboards, admin panels, analytics, data pipeline inspection
**Modes:** dark-first, light mode fully specified
**Neutral scale:** `ledger`, the Riso Ledger neutral: warm paper at the light end, blue-black ink at the dark end (replaced Tailwind `olive` 2026-10-16, see §3)
**Colour source:** `packages/ui/scripts/generate-palette.mjs` generates every colour into `packages/ui/src/styles/palette.css`, with the values, RISO anchors and gamut report in `docs/palette.md`. Never type a colour value by hand.

This document is the source of truth. Every number in it was measured, not estimated. Contrast ratios are WCAG 2.1, computed from the generated OKLCH values in `packages/ui/src/styles/palette.css`; `node scripts/check-contrast.mjs` recomputes every one from `theme.css`.

---

## 0. Rules that must not be broken

These matter more than any individual token value. A generator that gets the values right and these rules wrong produces a worse system than the reverse.

1. **Color means state, never hierarchy.** Sidebar icons, table headers, section labels, secondary and tertiary buttons, dividers, empty states: all neutral. A hue appears only when something is true about the data, the run, or the user's focus. In a dense interface every colored pixel that isn't communicating state is stealing attention from one that is.

2. **Five hues. No sixth.** Do not add a hue for a new feature. If a new state needs distinction, express it with the existing five plus shape, weight, iconography, or a neutral tint. The five are the Riso Ledger ramps `sage`, `vermilion`, `ochre`, `federal` and `orchid` (§1). The palette's seventh ramp, `teal`, exists for the chart tokens only (§6) and never marks UI state.

3. **Never use the 900 or 950 step of a chromatic scale as a background.** Under Tailwind's ramps those steps drifted in lightness by hue, so a `red-950` chip and a `blue-950` chip did not sit at the same visual depth. The Riso ramps share one lightness curve, but a dark chromatic slab still reads as a hole in the page. Use alpha over the canvas instead: `{hue}-500 / 10%`. This guarantees consistent depth and keeps the UI quiet. `ledger` is the neutral and exempt: its 900–950 steps are surfaces.

4. **Dark and light are not mirrors.** Foregrounds are chosen by OKLCH lightness, never by inverting the other mode's step index. Every Riso ramp shares one lightness curve (§2), so the choice is one step per mode for every role: dark mode **step 400 (L 73)**, light mode **step 700 (L 46)**. Each was checked so every role's text clears 4.5:1 on its own tint over a hovered and a selected row, and over a highlighted popup row, not only on the canvas (§4). Solid fills are not foregrounds and sit at their own steps (§4). *(History: from 2026-10-09 to 2026-10-16 this rule set lightness bands, dark L 66–71 and light L 43–51, because Tailwind's ramps put a step at a different lightness in each hue; dark warning, `amber-500` at L 76.9, was the recorded exception. Before 2026-10-09 it read as step ranges.)*

5. **No component spacing above 32px. No radius above 8px. No control height above 36px.** Generous spacing is how dense products silently become sparse. The cap is the design. The one exception is the **page frame**, the space around a page's content rather than between its parts. It has its own tier, `--pad-frame-*`, capped at 64px and used only by shell components. See §7.3 "Frame tier".

6. **All numeric output uses `tabular-nums`.** Non-negotiable in a financial tool. Columns of figures that don't align are a correctness hazard, not an aesthetic one.

7. **Borders do the work whitespace does elsewhere.** 1px `--color-border` separators, not 16px of padding. This is the core density mechanism.

8. **ledger-950 as canvas, never `#000`.** Pure black with light text measures 21:1 and causes halation — glowing text edges after sustained reading. These users are in the product for multi-hour sessions.

9. **Reach for the semantic layer first.** When generating a component, use the role token (`--pad-cell-x`, `--gap-bonded`) before the primitive scale (`p-2`). The failure mode in generated UI is not wrong values, it is inconsistent ones. See §7.1.

10. **Type in rem, spacing and geometry in px.** Deliberate, and explained in §7.5. Do not "correct" it to rem everywhere.

**Figma is exploratory. `packages/ui/src/styles/theme.css` and `docs/design-system.md` are authoritative.** Sync flows code → Figma, never the reverse. A color picked by eye in Figma must never replace a measured OKLCH value.

---

## 1. The Five

Five hues, six roles. The interactive role is split (decided 2026-10-16): its solid parts, the primary action and the focus ring, are `ledger` ink, and its marks, links, selected text and the selection tint, are `sage`, the same green as success.

| Role | Ramp | RISO anchor | Applies to |
|---|---|---|---|
| **Interactive** | `ledger` (fill, ring) · `sage` (text, tint) | Midnight, 296 U · Green, 354 U | Primary action, focus ring, checked controls, active tab · links, selected row in a single-selection list |
| **Danger** | `vermilion` | Crimson, 485 U | Failed run, validation error, destructive action, negative variance, reconciliation mismatch |
| **Warning** | `ochre` | Sunflower, 116 U | Stale data, degraded run, needs review, unverified figure, approaching threshold |
| **Success** | `sage` | Green, 354 U | Passed test, verified figure, deployed, positive variance, numbers match |
| **Agent** | `orchid` | Orchid, 2592 U | Agent-authored content, generated dbt code, agent questions, agent activity, pending human review |
| **Info** | `federal` | Federal Blue's hue, Medium Blue's chroma | "Running" state, work in progress, informational notices |

Beside them: `ledger`, the one neutral (§3), and `teal`, for chart series only (§6).

**Palette change, 2026-10-16 (user decision): Riso Ledger.** The Tailwind ramps were replaced: `olive` → `ledger`, `emerald` → `sage`, `red` → `vermilion`, `amber` → `ochre`, `sky` → `federal`, `violet` → `orchid`. Two reasons. 30 of the 55 old accent colours sat outside sRGB, so an sRGB screen clipped them to something other than what was specified. And every Tailwind ramp had its own lightness curve, which is the problem §2's lightness bands existed to work around. The Riso ramps are generated in OKLCH from one shared lightness curve and a chroma curve per ramp, each anchored to a RISO spot ink and kept inside sRGB. A step number now means the same contrast in every hue. Values, anchors and the gamut report are in `docs/palette.md`. *(The previous change, 2026-10-08, moved the accent from `blue` to `emerald` and the neutral to `olive`, and brought `sky` back as info. Its reasoning is in Appendix A.)*

### Why these ramps

**The accent is ink — decided 2026-10-16, after review in Storybook.** The primary action, the focus ring, checked controls and the active-tab indicator are `ledger`: ink on paper in light mode, paper on ink in dark (16.39:1 either way), as a riso print puts its strongest ink on the one thing to press. The focus ring is a step softer, `ledger-800` / `ledger-200`, since 2026-10-22 (§4). They were `sage` until the same day; the owner preferred the ink accent of the `experiment/riso` art direction. A primary button and a success badge no longer share a hue.

**Links and selection stay `sage`, shared with success.** `--color-text-interactive`, `--color-bg-interactive` and `--color-border-interactive` keep the green. A ledger link would be the body-text colour, and a ledger selection tint measured 1.04:1 against the hover tint, so a selected row would look hovered. Interactive and success stay separate tokens; today only the text, tint and border values coincide. Where success and selection meet, **shape carries the difference**: a selected row is a full-width tint, a success state is an 18px badge with an icon.

**The active nav item takes no hue — corrected 2026-10-22 (owner).** It is marked by weight and shape: its label steps up from `--color-text-secondary` to `--color-text-primary` at `--font-semibold`, its icon switches to Phosphor's `fill` weight (§11.2), and it carries `aria-current="page"`. That is how `AppShellNavItem` and `AppBarNavItem` have always drawn it. Until this date the table above listed "active nav item" under sage, which no component did. A sidebar is navigation, and colour means state (§0 rule 1): which page you are on is your place, not something true about the data.

**Running is info, not interactive.** With interactive on a green, a "running" spinner would read as "passed" in a run log, the one screen where that confusion is unaffordable. That is why `info` exists.

**`vermilion` for danger.** The ledger's red rule and seal, at hue 28°: warm enough to read as alarm, not as decoration.

**`ochre` for warning.** Sunflower ink is vivid only when light, so the ramp's chroma peaks early and its dark steps turn ochre and brown. That is what makes it usable as light-mode text (`ochre-700`, 6.74:1 on paper).

**`federal` for info.** RISO Federal Blue's hue (264°) with Medium Blue's chroma, because Federal Blue's own chroma reads greyed-out on screen.

**`orchid` for agent.** Moved off violet so agent does not read as a second blue next to info: 54° apart on the hue wheel.

**`teal` for charts only.** Hue 201°, filling the gap between `sage` and `federal`. It is not a sixth UI hue (§0 rule 2), and lint rejects it, like every ramp name, in component code.

### Colour-vision limits of this palette

Measured as OKLab distance ×100 after Machado (2009) simulation at full severity, with culori 4.0.1 (`filterDeficiency*`), old and new pairs by the same method. Below ~10 is hard to tell apart. *(Appendix A's table used a different tool; its figures are not comparable with these.)*

| Pair | Old: typical / protan / deutan / tritan | Riso: typical / protan / deutan / tritan |
|---|---|---|
| danger vs success, dark text | 34.0 / 12.3 / 12.0 / 42.1 | 25.7 / 11.7 / **2.4** / 30.6 |
| danger vs success, light text | 30.1 / 28.8 / 10.1 / 38.0 | 24.0 / 14.3 / **3.5** / 27.6 |
| danger vs success, dark fills | 31.1 / 36.0 / 14.6 / 38.4 | 27.0 / 15.3 / **3.7** / 31.0 |
| danger vs warning, light text | 9.9 / 25.1 / 16.1 / 10.8 | 11.9 / 12.1 / **7.3** / **9.8** |
| danger vs warning, dark text | 16.7 / 20.7 / 17.5 / **6.7** | 12.7 / 11.1 / **8.9** / **4.8** |
| warning vs success, light text | 20.7 / **8.2** / 13.7 / 28.5 | 12.8 / **4.8** / **8.6** / 18.3 |
| warning vs success, dark text | 26.9 / 13.6 / 29.5 / 42.1 | 17.6 / **9.4** / 11.1 / 26.3 |
| info vs success, light text | 12.4 / 12.1 / 11.7 / **2.5** | 19.3 / 17.1 / 15.4 / **4.7** |
| info vs success, dark text | 20.6 / 19.8 / 19.0 / **3.9** | 21.1 / 18.5 / 16.5 / **5.3** |
| info vs agent, light text | 22.5 / 18.9 / 14.1 / 23.0 | 12.1 / **5.6** / **3.0** / 14.6 |
| info vs agent, dark text | 16.7 / **2.7** / 11.8 / 20.7 | 11.9 / **5.0** / **3.2** / 14.7 |

**This is the palette's main cost (measured 2026-10-16).** For deuteranopes, danger and success become nearly the same colour in every pairing, 2.4–3.7 where Tailwind's measured 10–15, and info and agent fall to about 3. Gain and loss, destructive and primary, converge. Info versus success improves, and so does tritan separation for the blues. **Every hue-coded state carries an icon or label as well**, which is what §10's grayscale check enforces; with this palette it is the only thing a deuteranope reads for gain versus loss. Separating the pair again means changing the generator (lightness or hue), not a token.

### Why Agent earns a hue

Agent-authored versus human-verified is the most important distinction in this product — it is the entire trust story. The alternative was expressing it non-chromatically (dashed left rail, tinted neutral ground) and saving a hue.

Reusing the interactive hue for agent state fails because focus rings are everywhere: a form with a focused input would read as agent activity. The hue is worth spending.

**Discipline required:** `orchid` marks *authorship and agent activity only*. It never means "good," "new," or "important." If orchid starts appearing on things the agent didn't produce, the system has failed.

### Explicitly excluded from UI

Every Tailwind colour scale, chromatic and grey, is stripped (§9). The only colour scales that exist are the seven Riso ramps in `palette.css`; of those, `teal` is chart-only (§6) and `ledger` is the only neutral. Component code names none of them: it reaches colour through the semantic tokens (§4), and lint rejects a ramp name in a component.

### Brand assets are outside these rules — decided 2026-10-22 (owner)

The Tabular wordmark and favicon are brand marks, and they stay exactly as drawn. They take their colours from this palette: orchid-500, sage-700, a dark teal close to teal-900, and ledger-50 paper. But they are not UI, so none of the colour rules in §0 and here apply to them. Their orchid is not the agent role, and their green is not success. They may appear wherever the brand does, the product's app bar included.

What keeps the exception from leaking into the UI:

- **They are files, used unchanged.** An `<img>`, a favicon `<link>` or a static asset, never SVG markup pasted into a component and never recoloured. Their hex values then never reach component code, where lint would rightly reject them, and no one is tempted to copy one into a token.
- **Nothing is derived from them.** No token, state colour or UI surface takes a colour from the marks. The palette is the source; the marks are one use of it.
- **The rules apply to everything around them.** A mark in the app bar does not license orchid or green elsewhere in that bar.

The source files are kept outside the repo, in the owner's art direction folder, and the demo carries the favicon set in `apps/demo/public/`.

---

## 2. One lightness curve — read this before choosing accent tokens

Tailwind's 400 step was not perceptually equal across hues: on its darkest neutral it ran from 6.28:1 (indigo) to 12.76:1 (lime), nearly a 2× spread, so a uniform `{hue}-400` made amber shout and violet whisper. The fix was to choose each role's step by lightness band (Appendix A).

**The Riso ramps remove the problem at the source.** Every ramp is generated on one lightness curve:

| Step | 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| OKLCH L | 97.5% | 94.5% | 89% | 82% | 73% | 62.5% | 53% | 46% | 38.5% | 30.5% | 21% |

`ledger` alone has a twelfth step, **925** (L 25.75%, the midpoint of 900 and 950), for dark-mode raised surfaces (§3).

So one step serves every role: **400 in dark mode, 700 in light mode** (§0 rule 4).

| Role | Dark text | On `ledger-950` | Light text | On `ledger-50` |
|---|---|---|---|---|
| interactive (text), success | `sage-400` | 7.84:1 | `sage-700` | 6.23:1 |
| danger | `vermilion-400` | 6.95:1 | `vermilion-700` | 7.15:1 |
| warning | `ochre-400` | 7.24:1 | `ochre-700` | 6.74:1 |
| agent | `orchid-400` | 6.96:1 | `orchid-700` | 7.13:1 |
| info | `federal-400` | 7.31:1 | `federal-700` | 6.75:1 |

The five sit within about 0.9:1 of each other in each mode, against 6.77–9.17:1 in dark mode before. What spread remains is chroma, not lightness: sage and federal read slightly stronger than vermilion and orchid at the same L. **Dark warning is no longer an exception**: `amber-500` sat about 6 L above its band; `ochre-400` sits on the shared curve with the other four.

**What each step guarantees** (from `docs/palette.md`, for every ramp):

| Step | On paper (`ledger-50`) | On ink (`ledger-950`) | Use for |
|---|---|---|---|
| 400 | | at least 6.9:1 | Dark-mode text |
| 500 | at least 3:1 | at least 4.5:1 | Icons, borders, large text; tints at 8–10% |
| 600 | at least 4.5:1 | | Chart series in light mode; dark-mode fills |
| 700 | at least 6:1 | | Light-mode text and fills |

Dark text sits at L 73, above the old 66–71 band. The 500 step (L 62.5) would sit nearer it, but measures 4.58–5.33:1 on the canvas and 3.52–4.06:1 on a role's tint over a hovered row; 400 holds 4.66:1 or more on every ground §4 lists.

---

## 3. Neutral foundation

**The neutral ramp is `ledger`** (adopted 2026-10-16, replacing Tailwind `olive`). It runs warm at the light end (paper, hue 85°) and cool at the dark end (RISO Midnight ink, hue 254°), with chroma near zero in the middle so the hue change never shows as a muddy grey-green. It is low-chroma enough to stay neutral in role: §0 rule 1 treats every ledger token as "no hue". Values are in `docs/palette.md`; every ratio below is measured from them.

### Dark mode (canonical)

| Token | Step | On canvas | On raised (`ledger-925`) |
|---|---|---|---|
| `--color-canvas` | `ledger-950` | — | |
| `--color-surface` | `ledger-950` | 1.00:1, the canvas | |
| `--color-surface-raised` | `ledger-925` | 1.13:1 | — |
| `--color-border` | `ledger-800` | 1.80:1 | 1.60:1 |
| `--color-border-strong` | `ledger-700` | 2.47:1 | 2.19:1 |
| `--color-text-primary` | `ledger-50` | **16.39:1** | 14.53:1 |
| `--color-text-body` | `ledger-100` | **15.01:1** | 13.31:1 |
| `--color-text-secondary` | `ledger-300` | **10.15:1** | 8.99:1 |
| `--color-text-tertiary` | `ledger-400` | **7.37:1** | 6.53:1 |

**Canvas and surface share `ledger-950`.** The shared curve has no step between 950 (L 21) and 900 (L 30.5) for a surface, so panels, the sidebar and cards sit on the page itself and separate by `--color-border`, like the ruled pages of a ledger.

**Raised layers sit on `ledger-925`, the ramp's one extra step — decided 2026-10-16.** The draft put them on `ledger-900`. There, role text on its own tint over a highlighted menu row measured 3.97–4.45:1 (agent lowest), under AA, and `Select` lists put a `StatusBadge` in exactly that place. A raised surface flat on 950 would have passed but left menus no lift over the content they cover, and shadows barely register on a dark canvas. The generator makes 925 the midpoint of 900 and 950 in lightness and chroma; on it the same case measures 4.66:1 or more.

### Light mode

| Token | Step | On canvas (`ledger-50`) |
|---|---|---|
| `--color-canvas` | `ledger-50` | — |
| `--color-surface` | `ledger-50` | the canvas |
| `--color-surface-raised` | `ledger-50` | the canvas |
| `--color-border` | `ledger-200` | 1.29:1 |
| `--color-border-strong` | `ledger-300` | 1.62:1 |
| `--color-text-primary` | `ledger-950` | **16.39:1** |
| `--color-text-body` | `ledger-900` | **12.38:1** |
| `--color-text-secondary` | `ledger-700` | **6.64:1** |
| `--color-text-tertiary` | `ledger-600` | **4.89:1** |

**Paper on paper — decided 2026-10-16.** Canvas, surface and raised are all `ledger-50`. A card or a popup separates from the page by its border, not by a white fill or a shadow. *(Overlays add the sheet, §4.)* No `#fff` remains in the theme: text on a fill is paper too (§4). So there is one column of ratios, measured on paper, and measuring on white instead overstates them by about 8% (`sage-700` is 6.72:1 on white, 6.23:1 on paper).

**Secondary and tertiary moved a step darker than olive's.** On the shared curve, step 500 is 3.3:1 on paper, too low for text, so tertiary is `ledger-600` and secondary `ledger-700`. Primary and body take the ink end of the ramp, `ledger-950` and `ledger-900`.

### Both modes

`--color-text-tertiary` is restricted, absolutely, to **placeholder text, disabled labels, and non-text marks** (icons, which need 3:1 under WCAG 1.4.11; `aria-hidden` line numbers). Never text the user reads. Metadata is read: timestamps, durations, captions, help text, shortcut hints, group labels and empty-state messages are all `--color-text-secondary` (decided 2026-10-08; see §10). Tertiary now clears 4.5:1 on the canvas in both modes, but in light mode it falls to 3.97:1 on a selected, hovered row, which is why the restriction stands.

`ledger-400` is 2.22:1 on paper. In light mode it is decorative only (dividers, icon outlines, disabled text) and never text.

---

## 4. Accent token map

### Naming pattern — property first, always, under `--color-*`

```
--color-{property}-{role}
```

Property first, not role first. `--color-text-danger`, never `--color-danger-fg`. This groups in autocomplete — typing `--color-text-` surfaces every text color, neutral and semantic together — and it matches Tailwind and CDS convention. The density tokens in §7.4 follow the same ordering, without the `--color-` prefix.

**Why the `--color-` prefix is mandatory and not decoration.** In Tailwind v4, `--text-*` inside `@theme` is the reserved namespace for **font-size**. Declaring `--color-text-danger: <a color>` there emits a font-size utility named `text-danger`, and `class="text-danger"` would silently set a font size rather than a color — with no error at build time. Colors must live under `--color-*`; §8.1 owns `--text-*` for the type scale. These two sections previously collided and this prefix is the resolution.

Roles: `interactive` · `danger` · `warning` · `success` · `agent` · `info`

```
--color-text-{role}     text, icons, chart strokes
--color-fill-{role}     solid badge / button background
--color-on-{role}       text color on top of --color-fill-{role}
--color-bg-{role}       subtle tint background   (alpha)
--color-border-{role}   tint border              (alpha)
```

Neutral tokens share the same namespace deliberately: `--color-text-primary`, `--color-text-secondary`, `--color-text-danger` all group under `--color-text-`. Same for `--color-border` and `--color-border-danger`.

**The generated utility names double the property word. This is expected, not a mistake.**

| Token | Utility | Reads |
|---|---|---|
| `--color-text-danger` | `text-text-danger` | doubled |
| `--color-fill-danger` | `bg-fill-danger` | clean |
| `--color-on-danger` | `text-on-danger` | clean |
| `--color-bg-danger` | `bg-bg-danger` | doubled |
| `--color-border-danger` | `border-border-danger` | doubled |

Three of the five properties double. The alternative — dropping the property word to get `text-danger` and `bg-danger` — is role-first naming, which is rejected below and which breaks the autocomplete grouping this convention exists for. The doubled form is verbose but unambiguous and greppable: a lint rule can match `text-text-` with no false positives, which the short form cannot. **Do not "fix" the doubling.**

Rejected patterns, for the avoidance of doubt: `--color-danger-fg` (role first), `--dangerText` (camelCase), `--color-7` (meaningless), `--red-text` (hue name instead of role — breaks the moment a hue changes), and any color token declared under bare `--text-*` (collides with the font-size namespace — see above).

### Dark mode

Text ratios are against the canvas, `ledger-950`, and the raised surface, `ledger-925`. `--color-on-*` ratios are against their own fill.

| Role | `--color-text-` | on canvas | on raised | `--color-fill-` | `--color-on-` | on fill | `--color-bg-` | `--color-border-` |
|---|---|---|---|---|---|---|---|---|
| interactive | `sage-400` | 7.84:1 | 6.95:1 | `ledger-50` | `ledger-950` | 16.39:1 | `sage-500 / 10%` | `sage-500 / 25%` |
| danger | `vermilion-400` | 6.95:1 | 6.16:1 | `vermilion-600` | `ledger-50` | 5.36:1 | `vermilion-500 / 10%` | `vermilion-500 / 25%` |
| warning | `ochre-400` | 7.24:1 | 6.42:1 | `ochre-400` | `ledger-950` | 7.24:1 | `ochre-500 / 10%` | `ochre-500 / 25%` |
| success | `sage-400` | 7.84:1 | 6.95:1 | `sage-600` | `ledger-50` | 4.59:1 | `sage-500 / 10%` | `sage-500 / 25%` |
| agent | `orchid-400` | 6.96:1 | 6.17:1 | `orchid-600` | `ledger-50` | 5.30:1 | `orchid-500 / 10%` | `orchid-500 / 25%` |
| info | `federal-400` | 7.31:1 | 6.48:1 | `federal-600` | `ledger-50` | 4.97:1 | `federal-500 / 10%` | `federal-500 / 25%` |

**Solid-fill rule, dark.** The interactive fill is paper, `ledger-50`, with ink text (16.39:1): the accent is ink in light mode and its inverse here (§1). The role fills are step **600**, not 700. A 700 fill is 2.3–2.6:1 against the canvas, under the 3:1 a solid control needs to read as a shape; a 600 fill is 3.06–3.57:1 (2.71–3.16:1 on a raised surface), with paper text on it at 4.59–5.36:1. Sage (success), the tightest, clears AA by 0.09. Warning is the only fill that takes ink: `ochre-400` under `ledger-950` measures 7.24:1, and paper on it fails. Text on every other fill is paper, `ledger-50`, never `#fff`.

### Light mode

**Ratios are against the paper canvas, `ledger-50`, not `#fff`** (§3). Light mode is paper on paper, so this one column covers every surface.

| Role | `--color-text-` | on canvas | worst ground | `--color-fill-` | `--color-on-` | on fill | `--color-bg-` | `--color-border-` |
|---|---|---|---|---|---|---|---|---|
| interactive | `sage-700` | 6.23:1 | 4.71:1 | `ledger-950` | `ledger-50` | 16.39:1 | `sage-500 / 8%` | `sage-500 / 20%` |
| danger | `vermilion-700` | 7.15:1 | 5.35:1 | `vermilion-700` | `ledger-50` | 7.15:1 | `vermilion-500 / 8%` | `vermilion-500 / 20%` |
| warning | `ochre-700` | 6.74:1 | 5.00:1 | `ochre-500` | `ledger-950` | 4.89:1 | `ochre-500 / 10%` | `ochre-500 / 25%` |
| success | `sage-700` | 6.23:1 | 4.71:1 | `sage-700` | `ledger-50` | 6.23:1 | `sage-500 / 8%` | `sage-500 / 20%` |
| agent | `orchid-700` | 7.13:1 | 5.37:1 | `orchid-700` | `ledger-50` | 7.13:1 | `orchid-500 / 8%` | `orchid-500 / 20%` |
| info | `federal-700` | 6.75:1 | 5.12:1 | `federal-700` | `ledger-50` | 6.75:1 | `federal-500 / 8%` | `federal-500 / 20%` |

"Worst ground" is the role's text on its own tint over a selected, hovered row. All six clear 4.5:1 everywhere. **Interactive and success (`sage-700`) are the tightest roles, at 6.23:1 on the canvas and 4.71:1 at worst.** The interactive fill is ink, `ledger-950`, under paper (16.39:1). For the other roles but warning, text and fill share step 700: paper on a 700 fill clears 6.23:1, and the 600 steps (4.59–5.36:1 on paper) fall under 4.5:1 on a role's tint over a hovered row.

**Light warning fill is `ochre-500`, not `-400` — decided 2026-10-16.** `ochre-400` takes ink at 7.24:1, but against paper the fill itself is 2.26:1, under the 3:1 a fill needs (`packages/ui/scripts/check-contrast.mjs` fails it). `ochre-500` is 3.35:1 against paper, with ink on it at 4.89:1. The cost is a browner, less sunny fill. Paper on `ochre-500` is 3.35:1 and fails, so warning takes ink in both modes. *(Tailwind's `amber-500` fill measured 2.06:1 against the olive canvas; nothing checked it.)*

**Canvas is the best case.** Role text also sits on its own tint (every `StatusBadge`), on hovered rows, on a selected row, on `--color-surface`, on `--color-surface-raised`, and on a highlighted popup row. `apps/storybook/tests/contrast.spec.ts` measures all six roles on each of those grounds in a browser, in both modes, and `packages/ui/scripts/check-contrast.mjs` measures every text and on-colour token on all of them. The lowest pair anywhere is dark agent text on its tint over a highlighted popup row, 4.66:1. Pairs measured under 4.5:1 and not yet decided would be listed in the test as known shortfalls; there are none. See §10.

**Superseded decisions.** The light-mode notes that stood here (warning `amber-800`, danger `red-700`, emerald text at 800, decided 2026-10-08 and 2026-10-09) are in Appendix A, verbatim.

### Interaction states — one overlay, not five

Hover, press and disabled are **not** role-specific. A per-role hover token (`--color-fill-danger-hover` and four siblings) doubles the accent map for no expressive gain and guarantees the five drift apart. Instead: a single neutral alpha overlay that composites correctly over the canvas, over a surface, and over any solid fill.

```
                              Dark                 Light
--color-bg-hover              ledger-50 / 6%       ledger-950 / 6%
--color-bg-active             ledger-50 / 10%      ledger-950 / 10%
--color-bg-hover-inverse      ledger-950 / 6%      ledger-50 / 6%
--color-bg-active-inverse     ledger-950 / 10%     ledger-50 / 10%
--color-text-disabled         ledger-600           ledger-400
```

Measured, composited over the canvas: dark hover is 1.16:1 against `ledger-950`, light hover 1.12:1 against paper. Both sit just above the canvas, which is what a hover should do: register without reading as a new elevation layer. *(Under olive both were 1.13:1. The overlay colours are paper and ink now, not `#fff` and `olive-950`.)*

6% and 10% rather than 4% and 8%: at 4% the dark-mode hover is 1.07:1 against canvas and effectively invisible on a 28px row seen in peripheral vision. **Verified 2026-08-02 on 28px rows over canvas, over `--color-surface`, and over a solid `--color-fill-interactive` button: the 6% overlay is visible in all three.** Locked — this was flagged as the value most likely to need adjustment in situ, and it did not. Re-checking it on the Riso palette is outstanding (§10).

**Disabled text is dim on purpose** — `ledger-600` is 3.35:1 on dark, `ledger-400` is 2.22:1 on light. WCAG 1.4.3 exempts inactive controls, and a disabled control that reads at full strength is a worse defect than a low-contrast one. Dark disabled text now clears 3:1, but it still reads inactive beside tertiary at 7.37:1 and secondary at 10.15:1. Never use `--color-text-disabled` for anything the user is expected to read.

**Three states deliberately have no new token:**

| State | Use | Why not a token |
|---|---|---|
| Selected row | `--color-bg-interactive` | Selection *is* the interactive role. A separate `--color-bg-selected` at a near-identical alpha is a duplicate by another name. Rows picked with a checkbox (`DataTable`) take no tint: the checkbox marks them, and the row keeps its status tint (2026-10-22). |
| Hover border on a chip | `--color-border-strong` | Already exists at exactly the right step in both modes. |
| Focus | `--color-ring` | See below. Focus is an outline, not a background. |

**Hover on a solid fill composites, it does not swap.** A filled control does not move to another step on hover; it takes the overlay on top. One mechanism for every role, and it stays correct if a hue is ever changed.

**The inverse overlay — added 2026-10-16, with the ink accent.** The overlay is ink in light mode and paper in dark, which is exactly the primary fill's colour in each mode, so on a primary button it changed nothing (ΔE 0.00; a sage fill had moved 1.78 light, 2.82 dark). `--color-bg-hover-inverse` and `--color-bg-active-inverse` are the other mode's overlay, at the same 6% and 10%: paper over the ink button in light mode, ink over the paper button in dark. The button moves ΔE 4.19 in light and 2.80 in dark, the same as a hovered row in the other mode, and its label stays at 12.5:1 or more when pressed. Only the primary ground uses them: `controlGrounds.default` points `--tui-bg-hover` and `--tui-bg-active` at the inverse values on the element, so the shared overlay utility picks them up (§9, contextual overrides target the `--tui-*` layer). It is not a per-role hover token: one pair, for a fill at the overlay's own end of the ramp.

**Accepted: a dark role fill's text dips under AA on hover — decided 2026-10-16.** The overlay sits above the label as well as the fill, and in dark mode it lightens the fill under paper text. Paper on a hovered 600 fill measures 4.17:1 (sage), 4.42:1 (federal), 4.76:1 (orchid) and 4.86:1 (vermilion), so sage and federal fall under 4.5:1. No control hovers on those fills today (the primary button is ink, above); if one ever does, the resting pair clears and a hover is a passing state, and the alternative, a 700 fill, fails 3:1 against the canvas. In light mode the ink overlay darkens fills, which raises paper text; ink on a hovered `ochre-500` fill dips to 4.47:1, but nothing hovers on the warning fill today (only `ProgressBar` uses it). `packages/ui/scripts/check-contrast.mjs` reports these figures and does not gate them.

### Focus ring

```css
--ring-width: 2px;
--ring-offset: 1px;
--color-ring: var(--tui-ring);   /* ledger-200 dark / ledger-800 light */
```

**The ring has its own token per mode** (decided 2026-10-14, after review in Storybook). **Since 2026-10-22 it is a step softer than the accent: `ledger-800` in light, 9.10:1 on paper, and `ledger-200` in dark, 12.68:1 on the canvas and 11.24:1 on a raised surface**, against the 3:1 a focus indicator needs. Decided by the owner after a side-by-side in Storybook of four steps per mode (light 950, 800, 700, 600; dark 50, 200, 300, 400), both modes, on a primary, an outline and a ghost button, checkboxes and an input. The §10 human check had found full-strength ink heavy in both modes, though the 2px width read right; the gentlest step was chosen, so the ring stays in the ink family.

*History:* from 2026-10-16 the ring was the accent itself, `ledger-950` / `ledger-50` (16.39:1). It was `sage-700` / `sage-400` that morning, and `emerald-700` / `emerald-500` before. Under emerald, `emerald-800` also read heavy as a 2px line.

**A gain: the ring now parts from the primary button.** At full ink, ring and fill were one colour (1.00:1), separated only by the 1px `--ring-offset` gap. The softer step sits 1.80:1 against the ink fill in light mode and 1.29:1 against the paper fill in dark, so a focused primary button reads as a button with a ring, not a heavier button.

Use `outline` with `outline-offset`, not `box-shadow`.

**But be precise about why, because the obvious reading is wrong: `outline` is clipped by `overflow: hidden` too.** An ancestor's overflow establishes a clipping region for descendant painting, and that applies to outlines exactly as it does to shadows. Swapping one for the other does not, on its own, save a ring.

Two things actually protect it, and a control needs at least one:

1. **Room.** `--pad-cell-x` is what gives a ring space to paint inside a cell. Measured 2026-08-03 in `DataTable`: a `Checkbox` in the first column clears its scroll container by 5px, an `IconButton` in the last by 20px. That margin is thin, and it is the padding — not the outline — providing it.
2. **A negative `outline-offset`,** which draws the ring *inside* the element where nothing can clip it. This is the real advantage `outline` holds over `box-shadow`, which has no equally simple equivalent.

**Any control sitting within ~3px of a scroll container's edge needs an inset ring**, regardless of which mechanism draws it. `DataTable`'s sticky sort buttons, `RunLogRow` and `LineageTree` all use `outline-offset: -2px` for exactly this reason.

### Elevation

**Three tiers, and only the top one carries a shadow.** Shadows barely register on a `ledger-950` canvas, and light mode is paper on paper (§3), so depth is a background step plus a 1px border:

- Inline panel → `--color-surface` + `--color-border`. In both modes the surface is the canvas, so the border alone separates it.
- Raised (dropdown, tooltip, menu, popover) → `--color-surface-raised` + `--color-border-strong`. In dark mode that is `ledger-925`, a step above the page (§3). No shadow in either mode, spaced menus included.
- Overlay (modal, the sidebar peek) → `--color-surface-raised` + `--color-border-strong` + `--shadow-overlay`.

**`--shadow-overlay` is a second sheet, not a shadow — decided 2026-10-19, after a side-by-side in Storybook.** It draws a sheet of the overlay's own surface 4px down and to the right, edged in the same 1px `--color-border-strong` rule as the overlay itself:

```css
--shadow-overlay:
  4px 4px 0 calc(var(--border-width) * -1) var(--tui-surface-raised), /* the sheet's paper, inset one rule */
  4px 4px 0 0 var(--tui-border-strong);                              /* the sheet's rule */
```

No blur, no black, no new colour. The overlay reads as the top sheet of a small stack, which is how a ledger shows that one page lies over another.

**Why no blur.** Riso Ledger is spot ink on paper (§1), and a riso print cannot make a soft shadow. Blur is a model of light, the one such effect the system had. It also rounds its own corners: a 12px blur softens each corner of the shadow by about 6px, bringing back the radius §7.7 removed. The shadow it replaces (`0 4px 12px rgb(0 0 0 / 0.4)`, unchanged since before Riso Ledger) measured worse than it looked in review. In light mode its darkest band was 2.10:1 on paper, heavier than the overlay's own border (1.62:1), so the blur, not the rule, was the box's strongest edge. In dark mode it peaked at 1.07:1 and was gone within 4px: it did nothing. One value was too heavy in one mode and invisible in the other, which is what rule 4 exists to stop.

**Why 4px, not 2px.** 2px is this system's *bonded* step, for two things that read as one (§7.4), and §7.3 floors the gap between two distinct objects at 4px. An overlay and the page under it are two objects. At 2px a solid offset fuses with the 1px border into a 3px edge on two sides: it reads as a heavier border, a bevel like an old raised button, not as a sheet. What makes an offset read as a sheet is the step it leaves at the top-right and bottom-left corners, and at 2px that step is nearly invisible. That is worse on a 1x monitor, where 2px is two device pixels. 2px is also the weight §7.8 reserves for the agent rail, the focus ring and the active tab, so a 2px edge would read as one of those.

**Why a ruled sheet, not a solid offset.** Every line in this system is a 1px rule. A solid 4px offset in `--color-border-strong` makes a 5px band with the border, which on the sidebar peek (240 × 835px at 1440 × 900) is a 2.47:1 stripe down the full height in dark mode: the heaviest permanent line on the screen. The ruled sheet keeps the 4px separation, and every line stays 1px. Measured on canvas, which is what the sheet's rule sits on: the rule is 2.47:1 in dark mode and 1.62:1 in light, the same as the overlay's own border, so neither line outweighs the other. The sheet's paper is `ledger-925` in dark mode, 1.13:1, the raised step itself. In light it is paper on paper and does not show; the rule alone draws it.

**What it depends on.**

- *The overlay's surface.* The sheet is painted in `--color-surface-raised`. An overlay on any other surface would carry a sheet that doesn't match it. Every overlay is on the raised surface today. One token holds both values, so they move together.
- *No shadow colour utility.* Tailwind wraps each layer's colour in `var(--tw-shadow-color, …)`. A shadow colour utility on the same element (`shadow-border-strong`, `shadow-canvas`) repaints **both** layers in one colour, and the sheet collapses into a solid 4px block with no error. Lint rejects shadow colour utilities.
- *tailwind-merge knows it.* Untaught, tailwind-merge reads `shadow-overlay` as a shadow colour, so `cn()` with any other shadow colour kept only that one and the sheet vanished. `packages/ui/src/lib/utils.ts` lists it as a shadow, as it lists the §8.1 type scale. A shadow token added here goes there too.
- *Room.* The sheet needs 4px clear below and to the right. An ancestor's `overflow` clips it, exactly as it clips a focus ring (above). Dialog renders in a portal. The peek's 8px margin leaves 4px between the sheet and the window edge.
- *Forced colours.* Windows' forced-colours mode removes `box-shadow`. The 1px border stays, so an overlay keeps its edge and loses only the stack.

**Never on a control.** In neo-brutalist UI an offset shadow means "pressable", and buttons sink into it on press. Here it means "this layer is above the page" and nothing else. One shadow exists: Tailwind's stock shadow scales are stripped (§9), and lint rejects every shadow utility except `shadow-overlay` and `shadow-none`.

### Scroll cue — a popup list that hides rows must say so

A capped list cannot promise a partial row at its edge. 24px group labels and separators make the rhythm uneven, so some cut will land flush on a row boundary, and macOS overlay scrollbars show nothing at rest. `Combobox`'s Grouped list looked complete with two models out of view.

- **Select** uses Base UI's `ScrollUpArrow` / `ScrollDownArrow`: 24px (`--h-row-xs`) strips on `--color-surface-raised`.
- **Combobox** has no such parts (checked against Base UI 1.8.0, 2026-10-08). Its list **masks** whichever edge still hides rows, over the same 24px. The cue sits at the same depth as Select's.

**A mask, never a painted gradient.** A gradient overlay needs a colour, which has to match the ground in both modes and goes wrong when the ground changes. A `mask-image` fades the rows themselves to transparent, so the popup's own surface shows through. There is no colour to pick, and no hue. It adds no elevation layer and no shadow, so the rules above stand. The masked list also takes `scroll-padding` equal to the fade depth: keyboard navigation then stops a highlighted row clear of the faded band, not under it. Asserted in `apps/storybook/tests/combobox.spec.ts`.

---

## 5. Semantic aliases for pipeline & financial state

Map product concepts onto the six roles. Do not introduce new hues here.

### Run / pipeline state

| State | Role | Treatment |
|---|---|---|
| Queued | neutral | neutral `StatusBadge` (`--color-text-secondary`), no hue |
| Running | info | `--color-text-info` + `Spinner` (§11.5) — not interactive, which is sage and would read as passed (§1) |
| Passed / verified | success | `--color-text-success` |
| Failed | danger | `--color-text-danger` + `--color-bg-danger` row tint |
| Degraded / stale | warning | `--color-text-warning` |
| Needs review | warning | `--color-text-warning` + `--color-border-warning` |
| AI working | agent | `--color-text-agent` + `Spinner` (§11.5) |
| Agent proposed | agent | `--color-bg-agent` ground + 2px left rail in solid `--color-text-agent`, the rail `AgentBlock` draws (below) |
| Skipped / disabled | neutral | neutral `StatusBadge` (`--color-text-secondary`); a *disabled control* takes `--color-text-disabled` |

**"AI working", not "agent working" — decided 2026-10-25 (owner).** `docs/agent-voice.md` gives the agent role one word, "AI". Since `running` and this state share the `Spinner` (§11.5), the label is the badge's only non-colour authorship signal, so it keeps the actor and names it the same way. The status key stays `agent-working`.

### Financial polarity

| Concept | Role |
|---|---|
| Positive variance, gain, in-balance | success |
| Negative variance, loss, out-of-balance | danger |
| Zero / immaterial | neutral (never a hue) |
| Unverified figure | warning |
| Agent-derived figure, not yet human-confirmed | agent |

**Do not use polarity color on every number.** Apply it to variance and delta columns only. A table where every figure is green or red is unreadable, and it destroys the signal on the rows that actually need attention.

### Agent authorship treatment

Combine hue with a non-color signal so the distinction survives color-blind users and grayscale printing:

- 2px left rail on the block, in solid `--color-text-agent`
- Explicit text label in `--color-text-agent` — "Generated by AI" / "AI · Awaiting review"

The block is otherwise neutral: a 1px `--color-border` box with no ground of its own, so orchid covers the rail and the label and nothing else. The rail is solid because it now carries the hue alone: the `--color-border-agent` tint it used before measured 1.3:1 against the surface in both modes once the ground was gone, under WCAG 1.4.11's 3:1 for a required graphical signal. `--color-text-agent` measures 6.96:1 on the dark surface (which is the canvas step since 2026-10-16) and 7.13:1 in light mode. `--color-fill-agent` was the other candidate; it failed on the dark surface under violet (2.87:1) and clears only barely as `orchid-600` (3.09:1).

**Changed 2026-10-14.** The treatment had two more parts, a `--color-bg-agent` ground and a `--color-text-agent` icon in the header. Next to the emerald accent, a violet field behind every agent turn read as decoration rather than a signal. Moving the agent role to emerald was rejected for the reason in §1, "Why Agent earns a hue": the interactive hue is everywhere, so focus rings, success and primary actions would all read as agent activity. The hue stays; its area shrinks. The rail and the label carry the distinction on their own in grayscale and under deuteranopia. The icon repeated what the label says. `--color-bg-agent` stays in use for agent badges and the agent-proposed row tint above, where a mark is small enough that a tint is still a signal.

**Agent-proposed rows take the same rail — decided 2026-10-21 (owner), after a side-by-side in Storybook.** Until then the run-state table above gave them a `--color-border-agent` rail, the tint this section had already rejected for the block: 1.39:1 against the tinted row in dark mode and 1.24:1 in light. Solid `--color-text-agent` measures 6.21:1 dark and 6.52:1 light on the tinted row, and 5.23:1 at worst when the row is hovered, so "agent" reads the same on a row as on a block. The rail is 2px of the row's own width, so the row gives up 2px of left padding and its content stays in line with its neighbours. In a table the first cell draws it: a separated-borders table paints no border on a `<tr>`, which is why `DataTable` had shown no rail at all. Both live in `runStatusRowTreatment`.

---

## 6. Chart ramp

Governed separately from UI state colour. Seven series, one step per mode: **600 in light, 400 in dark**, on the same shared lightness curve as the UI (§2). The tokens reference the generated ramps (`--tui-chart-1: var(--color-federal-600)`); lint keeps the ramp names out of components, so a chart reaches its colours only through `--color-chart-*`.

| # | Ramp | Hue | Light, `-600` on paper | Dark, `-400` on canvas | Dark, on raised |
|---|---|---|---|---|---|
| 1 | `federal` | 264.0 | 4.97:1 | 7.31:1 | 6.48:1 |
| 2 | `ochre` | 78.5 | 4.97:1 | 7.24:1 | 6.42:1 |
| 3 | `teal` | 201.2 | 4.68:1 | 7.70:1 | 6.83:1 |
| 4 | `orchid` | 318.4 | 5.30:1 | 6.96:1 | 6.17:1 |
| 5 | `ledger` | neutral | 4.89:1 | 7.37:1 | 6.53:1 |
| 6 | `vermilion` | 28.2 | 5.36:1 | 6.95:1 | 6.16:1 |
| 7 | `sage` | 153.6 | 4.59:1 | 7.84:1 | 6.95:1 |

Every series clears the 3:1 graphical minimum with room to spare, 4.59:1 at worst; the old ramp's most fragile series was 3.09:1.

**Polarity guard — decided 2026-10-16.** Series 6 and 7 are `vermilion` and `sage`, the danger and success hues. **A chart that shows gain and loss, or sits beside figures that do, uses series 1–5 only.** Most charts carry two or three series and never reach 6. Until 2026-10-16 the ramp excluded red and emerald outright (Appendix A); with seven Riso ramps, a seven-series cap needs them, so they go last. shadcn's chart aliases cover series 1–5 only.

**The ramp is capped at seven series — decided 2026-08-02.** An eighth series is a signal that the chart needs grouping rather than another colour.

**Cautions:**

- **One lightness for every series.** In grayscale or print the seven are indistinguishable, and so are series that converge under colour-vision deficiency. Under deuteranopia the closest pair among series 1–5 is 1 and 4 (`federal`, `orchid`): 3.4 in light, 3.2 in dark (OKLab ×100, §1's method). Use direct labels or distinct dash patterns, never hue alone.
- Series 5 is the neutral. It reads as "other" or a baseline; do not give it the series the chart is about.
- Ochre and orchid double as warning and agent. Acceptable inside a plot frame because the context is unambiguous, but avoid ochre as series 2 on a chart that also renders threshold-breach markers.

**Sequential and diverging ramps** for heatmaps and variance matrices: build from a single ramp's own steps (`federal-100` → `federal-900`), or `vermilion` ↔ `sage` through `ledger` at matching steps. Never build a sequential ramp by walking the categorical list.

---

## 7. Density primitives

### 7.1 Three layers, three naming schemes

One naming scheme cannot serve all three audiences. Do not collapse these.

| Layer | Who reads it | Named by | Source |
|---|---|---|---|
| **Primitive** | Engineers writing component CSS | Multiplier — `p-2`, `gap-3` | Generated by Tailwind from `--spacing` |
| **Spec** | Humans and agents reading this document | Multiplier **and** px, always both | This document |
| **Semantic** | Agents generating components | Role — `--pad-cell-x` | Declared in `@theme` |

**Agents should reach for the semantic layer first.** The failure mode in generated UI is not wrong values, it is inconsistent ones — three tables in three files each landing on a different plausible padding. Role tokens make consistency the default rather than something caught in review.

### 7.2 Primitive layer — do not declare it

Tailwind v4 derives every spacing utility from a single base. Set it and stop:

```css
@theme {
  --spacing: 4px;
}
```

`p-2` resolves to `calc(var(--spacing) * 2)` = 8px. Every multiple and arbitrary value works without declaration. Do **not** hand-declare `--space-1` … `--space-8` — you would lose the dynamic scale and gain nothing.

### 7.3 Permitted values

Never write a multiplier in this document without its pixel value beside it. A reader — human or model — should never have to hold the base in working memory.

| Utility | px | Use |
|---|---|---|
| `p-0` | 0 | Reset only |
| `p-0.5` | 2px | Badge padding, icon-to-label gap **inside a badge or chip**, chip gaps, bonded text pairs |
| `p-1` | 4px | Floor for anything separating two **distinct** objects |
| `p-1.5` | 6px | Table cell vertical padding |
| `p-2` | 8px | Table cell horizontal padding, control padding, field gaps |
| `p-2.5` | 10px | Rare — optical correction only |
| `p-3` | 12px | Card padding, control group gaps, tree indent |
| `p-4` | 16px | Section gaps, page gutters |
| `p-5` | 20px | Rare |
| `p-6` | 24px | Rare |
| `p-8` | 32px | **Hard ceiling** for component spacing. Page frame only: see "Frame tier" below |

**`p-px` (1px) is not a spacing value.** 1px of padding is imperceptible. Legitimate 1px cases are borders (`--border-width`) and hairline gaps between segmented items; optical nudges belong to `translate` or `line-height`. Do not use it as spacing.

**One sanctioned `p-px` — decided 2026-10-22 (owner).** It may complete an inset together with a control's own 1px transparent border, so the two add up to a measured step. `Switch`'s track is the case: `p-px` plus its border make the thumb's 2px inset (#104), and `apps/storybook/tests/switch.spec.ts` asserts every gap at exactly 2px. That is geometry inside one control, not space between two objects. Dropping the border to use `p-[2px]` alone would lose the box `controlBase` gives every control. Any other `p-px` is still spacing, and still not allowed.

**Why 2px exists.** It is the most load-bearing token in the low range. Proximity is how you signal that two elements are one unit; if 4px is the floor, "bonded" and "adjacent" look identical and every relationship reads as equally loose. Concretely: a status badge at `--text-2xs` (10px text, 14px line-height) with 2px vertical padding is 18px tall and sits comfortably in a 28px row. At 4px it is 22px, leaves 3px of clearance, and forces the row to 32px — costing four rows per viewport.

The 2px step is only justified at 13px type with 28px rows. If the product moves to a looser density, drop it and revisit the row height and base size together — those three decisions stand or fall as a set.

#### Frame tier — the one tier above 32px

The 32px ceiling guards **component spacing**: cell padding, card padding, field and group gaps. That spacing repeats with the data. Add 4px to a cell and you pay it on every row of a 50,000-row ledger. That is how a dense product silently becomes sparse, and the cap stays absolute for it.

**Page frame spacing** costs something different. It is the air around a page's content: the side gutter of the content column, the space above the first section, the space around an empty state. It is paid once per page, however much data the page holds.

| | Component spacing | Frame spacing |
|---|---|---|
| Examples | `--pad-cell-x`, `--pad-card`, `--gap-field` | `--pad-frame-x`, `--pad-frame-top`, `--pad-frame-empty` |
| Cost grows with | the data: every row, card and field | nothing: once per page |
| Cost of +16px | ~0.57 of a 28px row, on *every* row | ~0.57 of a 28px row, once |
| Drift risk | high: written in every component | low: written in a handful of shell files |
| Ceiling | **32px** | **64px** |

The original rule (2026-08-02) capped both at 32px and gave no measurement for that number. The first comparison with a reference product (Ferndesk, measured 2026-10-08) showed it under-spacing at the frame: 16–24px against 48px on the sides, 16px against 72px on top. Component spacing matched to within 4px. The tier was split then.

**Rules for the frame tier:**

1. **Only shells use it.** In `packages/ui/src/`, that means `AppShell` and `EmptyState`. In a workspace app, it means the app's top-level layout, `apps/*/src/App.tsx`, which is that app's shell: `apps/demo` builds its own `<main>` there instead of using `AppShell`. Screens, dialogs and components, in `packages/ui/src/` or in an app, never use it. A frame token in a table, card or form is component spacing smuggled past the cap. The lint gate rejects it outside those files. An app that keeps its layout somewhere else adds that file to the allowlist in `eslint.config.js`, which is a visible change for review, rather than moving frame air into a screen.
2. **Through tokens only.** Frame values are `--pad-frame-*` tokens, never a raw value or a utility multiplier. `p-12` and `pt-18` stay rejected everywhere. Page air should be one decision, held in one place.
3. **64px hard ceiling.** It covers the reference product's empty-state air (64px) and its side gutter (48px). Its 72px top padding is not adopted: our title sits in a header band, so part of that space already exists (see below). Its hero and empty-chat layouts (112px) are not adopted either, because this product has no hero page. Set 2026-10-08, tighter than the 72px first drafted.
4. **Width is the real cost, not height.** At the 1280px floor with the sidebar and panel both open, `<main>` gets 600px, and a 48px side gutter takes 64px more of it than today's `--pad-content-x` (24px). A frame token that pays off on a wide monitor has to be checked at the floor before it ships.

**The tokens:**

```
--pad-frame-x       48px   main's side gutter, page header and body alike
--pad-frame-top     48px   main body's top inset, below the page header band
--pad-frame-empty   64px   vertical air in EmptyState size="page"
```

Our page title sits inside a header band (§7.4 `--pad-band-y`). The reference's 72px sits *above* its title, and ours sits *below* the band. That is why `--pad-frame-top` is 48px rather than 72px. Re-measure it against a real page.

**When the frame is on.** `<main>` is a size container, and `--pad-frame-x` and `--pad-frame-top` apply only while it is at least **672px** wide. That is Tailwind's stock `@2xl` container size (42rem). It is stock for the same reason `AppShell`'s 1280px breakpoint is: a custom breakpoint would be a new token. The gutter and the top inset switch together, so a page never gets the frame's sides without its top. Main's bottom inset stays `--pad-page-y`.

Below 672px, main keeps `--pad-content-x` (24px) and `--pad-page-y` (16px) exactly as before. That threshold is rule 4 above in practice:

| Viewport | Sidebar | Panel | `<main>` | Frame | Content width |
|---|---|---|---|---|---|
| 1280 (floor) | open | open | 600px | off | 552px, unchanged |
| 1280 | open | closed | 1040px | on | 944px (was 992) |
| 1440 (sketch) | open | open | 760px | on | 664px (was 712) |
| 2174 | open | closed | 1934px | on | 1184px, centred in `--w-content` (§7.9) |

`EmptyState` takes `--pad-frame-empty` only at `size="page"`, an empty state that stands in for a whole page. `default` and `sm` sit inside panels, drop zones and cards, and keep 16px.

Amended 2026-10-08. Tokens declared the same day.

### 7.4 Semantic layer — role tokens

What agents should use. One correct answer per context, no judgment required.

```css
/* Padding */
--pad-cell-x:        8px    /* table cell horizontal */
--pad-cell-y:        6px    /* table cell vertical */
--pad-control-x:     8px    /* input, button, select */
--pad-badge-x:       6px
--pad-badge-y:       2px
--pad-chip-x:        6px
--pad-chip-y:        2px
--pad-sidebar-item:  8px
--pad-card:          12px
--pad-panel:         12px
--pad-popover:       8px
--pad-popup-list:    4px    /* popup edge or separator to its row stack */
--pad-page-x:        16px   /* shell column gutter — top nav, sidebar, panel */
--pad-page-y:        16px   /* first content below a shell header band */
--pad-content-x:     24px   /* <main>'s side gutter */
--pad-band-y:        8px    /* header band, around its --h-control child */

/* Gaps */
--gap-bonded:        2px    /* title to its timestamp — ONE unit */
--gap-icon-label:    2px    /* icon to its label inside a badge or chip */
--gap-control-icon:  6px    /* icon to its label inside a control */
--gap-chip:          2px    /* between chips in a filter group */
--gap-inline:        8px    /* between distinct inline controls */
--gap-field:         8px    /* between form fields */
--gap-group:         12px   /* between control groups */
--gap-tree-indent:   12px   /* per level in a lineage tree */
--gap-section:       32px   /* between page sections */
--gap-nav-group:     24px   /* between groups in a sidebar nav */
```

**Two icon-to-label gaps, and the difference is not cosmetic.** `--gap-icon-label` (2px) is for a **badge or chip** — an 18px atomic object at `--text-2xs`, where the icon and label are one indivisible mark. `--gap-control-icon` (6px) is for a **control** — a button, select, or tab, where the icon reads as a word in a phrase.

The rule that decides it: **the gap must exceed the font's word space.** At `--text-base` Source Sans 3's space measures 2.60px. A 2px gap therefore binds the icon to the first word more tightly than the words bind to each other, inverting the proximity hierarchy — the eye reads "＋New · model" instead of "＋ New model". 6px is ~2.3× the word space at 13px and ~2.5× at 12px, which reads as bonded-but-distinct at both control type sizes.

The gap tracks the **type**, not the control height, which is why one value serves all three button sizes: `--text-sm` and `--text-base` differ by only 0.2px of word space.

Measured and corrected 2026-08-02, after the 2px badge value was wrongly applied to `Button`. Re-measured 2026-10-08 for the switch to Archivo (§8.3): Inter's space was 3.46px, so Archivo's tighter word space (2.72px) widened the margin and both values stood. Re-measured 2026-10-16 for Source Sans 3: 2.60px at 13px and 2.40px at 12px, tighter again, and both values stand.

**`--pad-page-y` is not `--pad-page-x` reused.** Every shell region — sidebar body, `<main>`, chat panel body — starts its first content one `--pad-page-y` below the shared header rule, so the three columns open on one line. Before this token, `<main>` borrowed `--pad-page-x` for its vertical padding, the sidebar used a bare `py-2` (8px) and the panel `--pad-panel` (12px): three insets under one rule, and the sidebar read cramped. **Exception since 2026-10-08:** while the frame tier is on (§7.3), main opens `--pad-frame-top` below the rule. The sidebar and the panel keep `--pad-page-y`, so the three columns no longer open on one line at those widths. That is deliberate: the chrome columns are navigation and want to start high, while main is the page and gets the air. It equals `--pad-page-x` today; they are separate because they answer different questions — the side gutter is set by line alignment with the top nav, the top inset by how much air the eye needs under a header. Added 2026-10-07 from the shell design audit.

**`--pad-content-x` is wider than `--pad-page-x`, on purpose.** `--pad-page-x` is the gutter of the shell's *chrome* columns. The name predates the distinction, and tokens are never renamed. It is 16px so the sidebar, top nav and panel edges line up. `<main>` is where reading happens, and it takes 24px for two reasons. It gives the content air against the sidebar rule. And it puts the first glyph of main's text at 24px from main's edge, the same x as the top nav's breadcrumb text: the nav's 16px gutter plus a ghost button's 8px padding. The breadcrumb text sits 1px further in because of `Button`'s transparent border, which is below what the eye resolves across a rule. Cost: 16px of main's width, so at the 1280px floor with both sides open, content gets 552px instead of 568. Added 2026-10-07 from the shell design audit. **Since 2026-10-08 it is the narrow gutter only.** Once main is 672px or wider, `--pad-frame-x` (48px) takes over (§7.3), and main's text no longer shares the breadcrumb's x. On a wide monitor the column also centres in `--w-content`, which would break that alignment anyway.

**`--pad-band-y` is a padding, not a band height.** A header band (top nav, sidebar header, panel header, page header) is 8px + a 32px `--h-control` child + 8px, plus its 1px rule: 49px measured. The height stays emergent on purpose. A `--h-band: 48px` would be the first `--h-*` token above the 36px cap, and `tui/dimension-caps` rejects exactly that: `--h-*` means a control or row height, while a panel or band height is a generic `height` that may exceed 36. A band's child must still be at least `--h-control` tall, which is why the panel header's `<h2>` carries `min-h-[var(--h-control)]`. Replaces four bare `py-2`s, past §7.4's three-use threshold. Added 2026-10-07.

**`--gap-nav-group` (24px) separates sections in a sidebar nav.** Inside a group, item text sits 12px apart: 32px rows with 20px line height. A section label sits 8px above its first item's text: `--gap-bonded` plus the row's 6px. At the 16px `--gap-section` had then, the next group's label sat only 22px below the last item's text, under 2× the in-group rhythm, so groups ran together. At 24px it is 30px, 2.5×. It also separates the project switcher block from the nav below it. Added 2026-10-07.

**`--pad-popup-list` (4px) is a popup's inset around its rows.** Menu, Select and Combobox lists, and the space either side of a separator inside them. It replaces `--gap-chip` (2px), which the three had borrowed. 2px is this system's *bonded* step, for one unit like a badge and its padding, and a popup's border and its rows are two distinct objects, which §7.3 floors at 4px. At 2px the edge was the tightest gap in the popup, so the group label read as stuck to the border. `--pad-popover` (8px) stays the inset for free-form popover content: a list's rows already carry `--pad-cell-x`, so 4px puts row text 12px from the border. Until 2026-10-16 it also made the rows' 2px highlight radius concentric with the popup's 6px corner; every rectangle is square since (§7.7).

**The group label row is 24px**, `--h-row-xs`: 8px above a 14px line (`--text-2xs`) and 2px below. With the 4px inset, the first row starts 28px inside the border and every row after it lands on the 4px grid. The label sits closer to its own rows than to the edge or the group above it, which is what makes it read as their heading. 1px separators sit on grid lines, like the shell's band rules. Raised 2026-10-08 from a review of the org switcher's eyebrow label.

**`--gap-section` is 32px, the component-spacing ceiling.** It was 16px, the same as a card's whole padding plus 4px, so a page's sections read as one run of content rather than separate blocks. The reference product (§7.3 "Frame tier") separates sections by 32px. A section boundary is the largest relationship *inside* a page, so it takes the largest step the cap allows. Anything larger is frame air, not a gap. Raised 2026-10-08. `EmptyState` borrowed this token as its padding until then and now uses its own values, so it did not grow with it.

**Fallback rule.** If a case has no role token, use the primitive scale explicitly (`p-2`, not `var(--pad-cell-x)` misapplied). This keeps the gap visible in review rather than silently miscategorised. If the same fallback appears three times, it needs a role token.

**Optical padding on the icon side.** Phosphor glyphs are drawn inside a 16px grid with internal breathing room, so a rendered icon's visible stroke sits roughly 1px inboard of its box. A control whose leading or trailing child is an icon therefore takes **6px** edge padding on that side instead of `--pad-control-x`'s 8px, or the icon side reads loose against a text edge that starts flush. This is an optical correction, not a token — use the primitive `1.5` step and scope it with `:has()`.

### 7.5 rem versus px — decided

**Type in rem. Spacing, control heights, and radius in px.**

A user who enlarges their browser font wants larger text. If spacing is also rem, enlarging the font inflates the entire grid and they see *fewer* rows — the opposite of what they asked for. In a data-dense product, the grid should hold its geometry while the type scales within it.

This is a deliberate minority position; the accessibility-orthodox default is rem everywhere. It is taken here because the product is a data grid, not a document. It also makes px-valued token names honest.

### 7.6 Control heights — the real definition of density

```
--h-row-xs       24px    dense table rows, log lines, activity feed items
--h-row-sm       28px    default table row
--h-control-sm   24px    control inside a table row
--h-control      32px    default control — input, button, select
--h-control-lg   36px    primary action, page-header control
```

No control above 36px. No table row above 28px in default density.

**`--h-control-sm` exists because a control has to fit inside a row.** A 32px button cannot sit in a 28px row, and the alternative — inlining a smaller styled `<button>` at the call site — is already in the failure log. 24px leaves 2px of clearance top and bottom in a `--h-row-sm` row and matches `--h-row-xs` exactly, so an in-row control and a dense row are the same height by construction. Added 2026-08-02 with the first `Button`.

**All four are heights, so all four are `--h-`.** An earlier revision used `--row-xs` / `--row-sm` / `--h-control` / `--row-lg` — three prefixes for one property, and `--row-lg` named a control rather than a row, which is what it is actually for. Rows and controls are separated by the second segment, not by the prefix.

### 7.7 Radius — square, round, and a taxonomy first

Four objects commonly get conflated. They are not the same thing.

| Object | Interactive | Radius | Treatment |
|---|---|---|---|
| **Status badge** — "passed", "stale", "failed" | No | `--radius-xs` | Tint bg, no border |
| **Filter chip** — "SAP", "Q2 FY2026" | Yes | `--radius-md` | Border, transparent bg, hover state |
| **Count badge** — "3", "12" | No | `--radius-full` | 1–2 characters only |
| **Status dot** — 6px, no text | No | `--radius-full` | A circle because it is a circle |

```
--radius-xs    0px     status badge, cell focus outline, checkbox
--radius-sm    0px     a part inset inside a control (segmented tab, switch thumb)
--radius-md    0px     interactive — input, button, filter chip, tab, switch;
                       card, panel, dropdown, popover
--radius-lg    0px     modal, drawer
--radius-full  9999px  status dot, count badge, avatar, progress track
```

**Every rectangle is square since 2026-10-16 (owner's decision, after a side-by-side in Storybook).** `--radius-xs` through `--radius-lg` are 0px. **Round shapes stay round:** a status dot, avatar, count badge and progress track keep `--radius-full`, because they are circles or capsules by what they are, not by styling. The switch was on that list until 2026-10-23 (below). The system has two corner shapes and nothing between them: a square corner, or a fully round end. A 2–8px corner no longer exists anywhere, so a softened rectangle reads as a defect rather than a choice.

**The switch is square since 2026-10-23 (owner's decision, after a side-by-side in Storybook).** It kept `--radius-full` on 2026-10-16 on the argument that its thumb had to be circular to read as sliding. That does not hold: a switch reads by its track, wider than it is tall, with the thumb parked at one end, and Windows Phone and Windows 8 shipped a square one for years. Round, it was the one control in the system that was not square. Now the line is clean: **controls are square; `--radius-full` is for marks that are read, not operated** — the status dot, count badge, avatar and progress track (an avatar inside a trigger, as in `AccountMenu`, keeps its own shape). The track takes `--radius-md` with the other controls, and the thumb `--radius-sm`, as a part inset inside one. The side-by-side was checked for the one risk the change carries: an off thumb is a small solid square, as a checked `Checkbox` is, and the two sit in the same settings lists. Square was chosen with that in view. `Menu`'s switch indicator shares the variants and changed with it. `apps/storybook/tests/switch.spec.ts` asserts both are 0px.

**The four tiers stay, at one value.** They are roles, not sizes: a component names what it is (`--radius-md` for a control or a popup, `--radius-lg` for a modal), so re-rounding one tier later is a one-line change in `theme.css`, and the side-by-side that decided this was exactly that, four variables overridden at runtime. Collapsing them into one token would lose the taxonomy and need a rename, which is never done (CLAUDE.md). So a new rectangle still takes its tier's token, never `rounded-none`: `rounded-none` is reserved for the few places that strip a control's own radius on purpose (the borderless `Textarea`, `RunLogRow`'s full-bleed row).

**The 8px ceiling stands.** `--radius-xl` through `--radius-4xl` stay stripped to `initial`, and lint still rejects a radius above 8px. With every tier at 0 the cap no longer constrains a token, but it still stops a bracketed `rounded-[12px]` in component code.

**Lint rejects softened corners too — since 2026-10-22, owner's decision, before the kit goes public.** In component code: bare `rounded` and its side forms (`rounded-t`, Tailwind's 4px default), any bracketed radius that isn't a tier token, `inherit` or 0 (`rounded-[6px]`, `rounded-[0.25rem]`), and a non-zero `borderRadius` in an inline style. In CSS, any non-zero `border-radius` length but 9999px. The tier tokens stay the one place a corner can round again, through the spec.

**What changes with the corners.** Focus rings are `outline`, which follows `border-radius`, so every ring on a rectangle is square too; concentric parts (the segmented tab inside its track) are trivially concentric at 0. Nothing else moves: no spacing, height or colour token changed.

*History:* the values were 2/4/6/8px until 2026-10-16. **Controls moved from `--radius-sm` to `--radius-md` on 2026-10-15 (owner's decision)**, so every interactive control took the radius of the dropdowns and popovers it opens, while the checkbox stayed `--radius-xs` (at 16px even 4px read soft) and the segmented tab stayed concentric at 4px inside its 6px track. Those distinctions are moot at 0px; the token assignments they produced are kept.

**Declare these in px explicitly.** Tailwind v4 ships `--radius-xs: 0.125rem` through `--radius-lg: 0.5rem`. Those defaults matched this system's 2/4/6/8px until 2026-10-16, when declaring them was a safeguard against a changed root font size (§7.5). Now they do not match at all: a missing declaration would silently round every rectangle again.

**Status badges are not pills.** In a status column of 30 rows, square badges form a clean vertical left edge (2px corners did too, until 2026-10-16); full-radius pills pull their visual mass inward and produce a scalloped edge that fights the grid's vertical rhythm. Full radius also needs ~10px horizontal padding versus 6px to avoid looking cramped, costing width in a column that repeats on every row. And fully-rounded pills are the strongest single signal that an interface is consumer SaaS — the opposite of the intended tone.

**Do not encode interactivity in radius.** Every rectangle is 0px, so radius cannot carry it (and before 2026-10-16, at an 18px badge height, 2px versus 4px was nearly invisible). Encode it in border and hover instead: static status gets a tint background and no border; an interactive chip gets a border, transparent background, and a hover state. Far stronger signal, zero cost.

If this decision is reversed, reverse it completely — every non-interactive status indicator becomes a pill, no exceptions. Mixed shapes read as an unfinished system rather than a choice.

### 7.8 Border widths

```
--border-width      1px     everything
--border-width-2    2px     agent left rail, focus ring, active tab indicator
```

1px is the default and near-universal. 2px is reserved for those three cases so that a 2px edge always means something.

### Border style — dashed means placeholder

```
solid     content — a real row, a real card, a real control
dashed    a placeholder awaiting content
```

The default is solid and near-universal. **Dashed is reserved for a container that is
waiting to be filled** — an empty upload target, a drop zone before anything lands. The
moment content arrives, the border goes solid.

Same discipline as the 2px width above: a border treatment is only informative while it
is rare. A dashed edge used decoratively — to soften a panel, to suggest "draft", to mark
an optional field — spends the signal and it stops meaning anything.

Dashed changes the **style only**. Width stays `--border-width` (1px) and colour stays
`--color-border`; there is no dashed token, because `border-dashed` is a plain Tailwind
utility and a token would imply the style varies independently, which it does not.

Added 2026-08-23 with `AttachmentRow`'s upload target, the first and so far only user.

### 7.9 Shell widths

```
--w-sidebar     240px    AppShell's sidebar, and any popup sized to match it
--w-panel       440px    AppShell's trailing panel (the chat drawer)
--w-content    1280px    main's content column, gutters included, centred
```

Widths are not density tokens and carry no cap. They exist because the same number was written in more than one place: the sidebar's `w-60` and the context switcher popup's `max-w-60` were one decision held in two literals. 440px comes from the shell sketch (about 440 at 1440 wide). At the 1280px floor with both sides open, main keeps 600px.

**`--w-content` caps the page, not the prose.** On a wide monitor, a page that runs edge to edge has no margins, and the reference product's sense of room comes mostly from the blank space either side of its column. 1280px is that product's column, measured 2026-10-08. It includes the 48px frame gutters, so the content itself is at most 1184px. It only engages once `<main>` is wider than 1280px, which needs a viewport of at least 1520px with the sidebar open. At the 1280px floor it changes nothing. Prose still sets its own, narrower measure inside the column (`AppShell` README).

**The centring offset is width, not frame spacing.** `AppShell` centres the column with padding, not a wrapper (a wrapper would unbound a virtualized table), so on a wide monitor main's computed `padding-inline` runs far past 64px: 375px a side at a 1934px main. That is the column being narrower than main, governed by `--w-content`, not frame air, and §7.3's 64px ceiling does not apply to it. The frame component of that padding is still `--pad-frame-x`. Lint cannot see either part, because both are `var()` inside a `max()`. The pattern is legitimate **only** for centring a `--w-*` column: a `max()`/`calc()` padding anywhere else is a way past the cap and fails review. Added 2026-10-08.

**Table pages opt out: `AppShell contentWidth="full"`.** On a page whose content is a wide data grid, such as a run log, a ledger or a reconciliation table, extra width means extra columns, and capping it hides data the user came to see. `"full"` keeps the frame tier (the 48px gutter and the top inset) and drops only the `--w-content` cap, so the grid runs to main's edges less the gutter. The page header follows the same setting, so the title stays on the grid's x. Everything else stays `"contained"`, the default: prose, forms, dashboards and detail pages, where a wider column only lengthens lines and spreads tiles apart. The test is whether the page's main content is a grid that scrolls sideways, or would, when narrow. Added 2026-10-08, with the first two table pages (`AppShell`'s `WithTable` and `Wide` stories).

`--w-*` is the width counterpart of `--h-*`, but `tui/dimension-caps` does not check it, because nothing in this product caps a region's width. Added 2026-10-07 from the shell design audit.

---

## 8. Typography

### 8.1 Scale — 13px base, rem values

Values are rem (assuming a 16px root); px equivalents shown for reading.

```
--text-2xs        0.625rem  10px / 14px   uppercase column headers, micro-labels
--text-xs         0.6875rem 11px / 16px   timestamps, secondary metadata, help text
--text-sm         0.75rem   12px / 16px   table cells, dense form labels
--text-base       0.8125rem 13px / 20px   body, default UI text
--text-md         0.875rem  14px / 20px   section headings, emphasis
--text-lg         1rem      16px / 24px   page title
--text-xl         1.25rem   20px / 28px   modal titles, empty states — rare
                                          ─── display boundary ───
--text-metric-sm  1.5rem    24px / 28px   secondary KPI, tile in a grid of 4+
--text-metric     2rem      32px / 36px   primary KPI, single hero figure
```

**Line heights are tokens, not comments.** Tailwind v4 pairs a line-height to a size with the `--text-{name}--line-height` suffix, and a size token declared without one inherits whatever `line-height` is in scope — which in a dense table is the difference between a 28px row and a 32px row. Declare both halves:

```
--text-2xs--line-height        0.875rem   14px
--text-xs--line-height         1rem       16px
--text-sm--line-height         1rem       16px
--text-base--line-height       1.25rem    20px
--text-md--line-height         1.25rem    20px
--text-lg--line-height         1.5rem     24px
--text-xl--line-height         1.75rem    28px
--text-metric-sm--line-height  1.75rem    28px
--text-metric--line-height     2.25rem    36px
```

Line heights are in rem because they scale with their type — this is the one geometry value that must not be px, and it is not an exception to §7.5 but a consequence of it. Every value is a whole multiple of 4px at a 16px root, so text still lands on the grid.

13px base, not 14 or 16. The two metric sizes exist because a financial dashboard cannot work without them — a KPI tile rendering `¥34.4bn` at 20px is undersized for the one number the screen exists to show. Nothing above 32px.

**`--text-*` is font-size only.** Colours never live in this namespace — see §4. `--text-base` is a size, `--color-text-body` is a colour, and the two are not variants of one another.

### 8.2 The display boundary — ≥24px

**The boundary is not a size. It is whether text is read or seen.**

Body text is consumed linearly, letter to letter, and generous spacing is what makes that possible. Display text is recognised as a shape in a single fixation — the silhouette matters more than the individual letters, so spacing can tighten without cost. Size correlates with that but does not cause it.

Tests, in priority order:

1. **Does it wrap?** Anything running to a second line is body, at any size.
2. **Is it repeated?** Table cells, chips, sidebar items are UI, not display — they are scanned as a set, and set-scanning needs the legibility affordances of the text optical size.
3. **Is it the hero of its container?** A single figure or title the container exists to present is display.

Optical size adjustments become perceptible above roughly 1.5× body size and clearly justified above 2×. At a 13px base that is ~20px and ~26px, which puts the boundary at **24px**.

`--text-xl` (20px) body text stays sans. It sits adjacent to 13px text in modals and empty states, and a family shift there is a visible seam that buys nothing. **Headings are the exception, by decision (2026-10-16):** every `<h1>`–`<h6>` is serif at any size, 13px included (§8.3). There the seam is the signal, and it is applied by element, so it cannot appear by accident on body text.

### 8.3 Families

```css
--font-sans:    "Source Sans 3 Variable", "Source Sans 3", system-ui, sans-serif;
--font-display: "Source Serif 4 Variable", "Source Serif 4", "Georgia", serif;
--font-heading: var(--font-display);
--font-mono:    "Source Code Pro Variable", "Source Code Pro", "SF Mono", ui-monospace, monospace;
```

Source Sans 3, Source Serif 4 and Source Code Pro replaced Archivo and JetBrains Mono on 2026-10-16 (owner decision). They are one superfamily, drawn to share proportions: the sans for body and UI text, the serif for headings and the metric tier, the mono for identifiers.

**The `Variable` suffix in the first entry is load-bearing, not cosmetic.** `@fontsource-variable/*` registers families under that exact name. An earlier revision of this section listed `"JetBrains Mono"` first; with the package installed, the stack still fell straight through to `SF Mono` and the installed font never rendered — no error, no missing-font warning, just subtly different glyphs. Caught by diffing rendered glyph widths against the explicit family name (2026-08-02). Both are kept: the suffixed name resolves the installed package, the plain name covers a system install.

**Where the serif applies, and nowhere else:**

- **`--font-display`: the metric tier**, `--text-metric-sm` and `--text-metric`, through the `font-display` utility. `MetricTile` is the only consumer.
- **`--font-heading`: every `<h1>`–`<h6>`**, set once in `theme.css`'s base layer. No component sets a heading family. Base UI's `Dialog.Title` and `Popover.Title` render `<h2>`, so dialog and popover titles are covered. Text that should read as a heading is a heading element, which is right for assistive technology anyway. Text that is not a heading never goes serif: `EmptyState`'s title is a `<span>` and stays sans.

**Rule change, 2026-10-16.** Until then `--font-display` applied to the metric tier only, and headings used the sans. The owner moved every heading to the serif. `--font-heading` is the token for it. It reads from `--font-display`, so the two cannot drift apart. It had existed since the shadcn init as an unused alias of `--font-sans` in `shadcn.css`, and it now lives in `theme.css`.

**The display tier no longer narrows.** Archivo's display tier was the same family at `"wdth" 90`. Source Serif 4 has no `wdth` axis, so `--font-display--font-variation-settings` was removed: it would have been inert. The serif tightens at display sizes through its **optical size** instead (§8.4): at 32px the browser picks the display cut, which is drawn tighter than the text cut. At 32px/600, `$847.2M` measures 118.75px in the display cut against 127.78px forced to the text cut (`'opsz' 13`). Archivo at `"wdth" 90` measured 145.7px, so the figure is now about 18% narrower at the same size. The size is unchanged (§8.1).

**Negative tracking is still not a substitute.** `letter-spacing` scales all sidebearings uniformly, including the ones that should not shrink. The optical size adjusts per glyph.

**Requirements on any substitute sans:** real tabular figures, and disambiguated `1 / l / I` and `0 / O`. Account codes and run IDs get misread otherwise. Source Sans 3, measured in the browser from the loaded files 2026-10-16:

- **Tabular figures — met.** At 32px/600 with `tabular-nums`, `111111` and `000000` both measure 98.46px.
- **`1` — met.** Flagged, and unmistakable against `l` and `I`.
- **`0 / O` — met by proportion.** The zero is 497 units wide against the O's 664, an oval against a circle. There is no slashed zero, so `--font-mono` remains the place for identifiers (§8.7).
- **`l / I` — met.** `l` has a tail that turns right at the baseline, and it is 8.5% taller than `I` (712 against 656 units). This is the first sans in this system to meet it: Archivo's `l` and `I` were both plain stems, and Inter's tailed `l` was an alternate the loaded subset did not carry. `--font-mono` is still where identifiers go, because it carries the slashed or dotted zero as well.

**The serif meets the figure requirement as well.** At 32px/600 with `tabular-nums lining-nums`, Source Serif 4 measures `111111` and `000000` at 97.96px each.

**The files must carry the axes.** Each family loads from `packages/ui/src/index.css` through an explicit entry point, with its italic. Source Serif 4 loads from **`opsz.css` and `opsz-italic.css`**, because the package default ships wght-only files that silently make §8.4 a no-op. Source Sans 3 and Source Code Pro load from `wght.css` and `wght-italic.css`. They have no `opsz` axis to lose, and their defaults omit the italics, so a browser would slant the roman instead.

Use `--font-mono` for what this product is built around: dbt model names, SQL, column and table identifiers, account codes, run IDs, lineage paths, JSON. Set mono one step smaller than adjacent sans — mono runs visually larger at equal px. One step down at 13px and 12px (12/13, 11/12) is 0.92em.

**Bare code is 0.9em of its context (2026-10-16).** `<code>`, `<kbd>`, `<samp>` and `<pre>` that carry no size class default to `font-size: 0.9em`, set once in `theme.css`'s base layer. That covers code whose context size is not known in advance, such as inline code in agent prose or a rendered markdown block. It is the same rule as the step down, expressed relative to the surrounding text instead of on the scale. A component that sizes mono from the scale keeps its class, because utilities sit in a later layer than the base rule. `<code>` inside `<pre>` inherits the block's size, so the two do not compound. A component that sets its size on a wrapper and renders a bare `<pre>` inside it must make the `<pre>` inherit, as `CodeView` does. Otherwise the block shrinks twice.

### 8.4 Optical sizing — on, and active on the serif

```css
html { font-optical-sizing: auto; }
```

**Source Serif 4 has an `opsz` axis (8–60), and this declaration drives it.** The browser sets the optical size from the font size, so a 13px panel heading gets the text cut and a 32px metric figure gets the display cut. The axis is only present when the files carry it, so Source Serif 4 must load from `opsz.css` (§8.3). Verified 2026-10-16: `Hamburgefonstiv` at 32px/600 measures 288.35px at `'opsz' 8` and 232.13px at `'opsz' 60`. With wght-only files the two would measure the same. Source Sans 3 and Source Code Pro have no `opsz` axis, so body text is unaffected.

What this costs at small sizes: Source Sans 3's lowercase is short. Its x-height at 13px is 6.32px, against Archivo's 6.84px and Inter's 7.10px, so at the same px, body and table text read about 8% smaller than under Archivo. The type scale (§8.1) was kept unchanged on purpose, by owner decision. If dense cells read too small, the fix is a decision about the scale, not a per-component bump.

### 8.5 Weights

```
--font-normal    400    body, table cells
--font-medium    500    labels, column headers, emphasis
--font-semibold  600    headings, active nav, metric figures
```

**Never 700.** At 13px on a dark canvas, bold weights bloom and reduce legibility rather than increasing emphasis. Use `--color-text-primary` colour *or* `--font-semibold`, not both plus bold.

### 8.6 Numerals — mandatory

```css
--font-numeric: tabular-nums lining-nums;
```

Apply `font-variant-numeric: tabular-nums lining-nums` to **every** element rendering a number: table cells, metric tiles, chart axis labels, variance columns, run durations, row counts. Misaligned figure columns in a financial tool are a correctness hazard, not an aesthetic one.

**Set once, on `html`, and inherited everywhere, prose included.** Decided 2026-10-07. Until then the rule was applied per element, and running text was never in its list. The first agent reply in the shell ("71% of the drop", "above 12%") rendered proportional figures. Agent prose is where this product states the numbers a user then checks against a table, so a reply's "1,284" should sit at the same width as the table's "1,284". The cost is looser figures in sentences. Under Archivo it was negligible, because its proportional `1` was nearly full-width. **Under Source Sans 3 (2026-10-16) it is visible:** at 32px/600, `111111` measures 72.96px proportional against 98.46px tabular, so a `1` in a sentence carries about a third more space around it. The rule stands. Alignment with the table is what it is for, and the gap is smaller at 13px than at 32px. Components that already set `tabular-nums` keep it: inheritance makes those declarations redundant, not wrong, and they still document intent where figures align in columns.

### 8.7 OpenType features

```css
--font-mono--font-feature-settings: "zero" 1;   /* slashed zero, in @theme beside --font-mono */
--font-mono-features: "zero" 1;                 /* deprecated 2026-10-16, see below */
```

Apply `font-feature-settings: "zero"` to `--font-mono`. For account codes, GL references, and run IDs, a slashed zero removes a real class of transcription error.

**The feature rides on the family token, as the display width once did (§8.3).** Decided 2026-10-16. `--font-mono--font-feature-settings` is Tailwind v4's partner for the mono family, and it reaches text two ways. The `font-mono` utility emits it beside `font-family`. Tailwind also passes it to Preflight as `--default-mono-font-feature-settings`, which is what `code`, `kbd`, `samp` and `pre` take by default. So a component that sets the family gets the zero with it, bare `<code>` gets it from Preflight, and no component sets the feature itself.

Until then the feature was `--font-mono-features`, a reference variable outside `@theme` that each component applied with its own `font-feature-settings` declaration. That failed two ways, and no screenshot showed either, because the current family's default zero is already dotted (below):

- **Preflight undid it inside code blocks.** Preflight sets `font-feature-settings` on `code`, `kbd`, `samp` and `pre` itself, so a value set on an ancestor never reaches their text. `CodeView` set the feature on its root, which computed `"zero"`, while every line inside its `<pre>` computed `normal`.
- **Call sites forgot it.** `DataTable`'s `mono` cells and `RunLogRow`'s timestamp set `font-mono` and never set the feature.

**`--font-mono-features` is deprecated, not removed.** A declaration that still reads it is redundant and harmless. New code does not use it. Code that reads `var(--font-mono)` directly, such as an inline `font-family` style, gets the family **without** the feature, unless the element is one of Preflight's four. Use the `font-mono` utility. `apps/storybook/tests/mono-features.spec.ts` checks the computed value on the element that owns each mono text node, since that is where the glyph is drawn.

**Verified 2026-08-02 for JetBrains Mono, and again 2026-10-16 for Source Code Pro:** the default zero is *already* dotted and unambiguous against `O`, and with the loaded Source Code Pro files the toggle draws the same dotted zero. It produces no visible change with the current family. The requirement is satisfied by the typeface's own design, not by the token. Keep the token anyway — it costs nothing and it is what makes the guarantee survive a family change.

### 8.8 Letter spacing

```
--tracking-wide      0.04em    --text-2xs, uppercase only
--tracking-normal    0         --text-xs through --text-md
--tracking-tight    -0.01em    --text-lg, --text-xl
--tracking-display   0         --text-metric-sm, --text-metric
```

**Display tracking is 0, and that is not an oversight.** "Tighter as it gets larger" is the correct instinct when one family serves all sizes. From 24px the display tier renders in Source Serif 4's display optical size (§8.3, §8.4), which is already drawn tighter, so the font has done that work. Applying `--tracking-tight` on top double-counts. The value was set when Archivo narrowed with `"wdth" 90` and is unchanged (2026-10-16). If display text needs adjustment, it goes *positive*, not negative.

---

## 9. Tailwind v4 implementation

### Strip Tailwind's colours

```css
@import "tailwindcss";

@theme {
  --color-red-*: initial;
  --color-orange-*: initial;
  --color-amber-*: initial;
  --color-yellow-*: initial;
  --color-lime-*: initial;
  --color-green-*: initial;
  --color-emerald-*: initial;
  --color-teal-*: initial;
  --color-cyan-*: initial;
  --color-sky-*: initial;
  --color-blue-*: initial;
  --color-indigo-*: initial;
  --color-violet-*: initial;
  --color-purple-*: initial;
  --color-fuchsia-*: initial;
  --color-pink-*: initial;
  --color-rose-*: initial;
  --color-slate-*: initial;
  --color-gray-*: initial;
  --color-zinc-*: initial;
  --color-neutral-*: initial;
  --color-stone-*: initial;
  --color-mauve-*: initial;
  --color-olive-*: initial;
  --color-mist-*: initial;
  --color-taupe-*: initial;
}
```

Every Tailwind colour scale is stripped since the Riso Ledger palette (2026-10-16); until then the five UI hues and `olive` were kept. `mauve`, `mist`, `taupe` and `olive` arrived in Tailwind 4.2, and until 2026-10-08 the first three were missing from this list and so were live utilities. **When Tailwind adds a scale, add it here**, or it ships as a usable hue. `apps/storybook/tests/palette.spec.ts` fails until it is.

### Stock shadows are stripped too

```css
@theme {
  --shadow-*: initial;
  --inset-shadow-*: initial;
  --drop-shadow-*: initial;
  --text-shadow-*: initial;
}
```

Since 2026-10-19 the system has one shadow, `--shadow-overlay` (§4). It is declared in the `@theme inline` block with the colours, so its `--tui-*` references resolve where it's used. In a `data-theme` subtree it takes that subtree's values, as every colour does (failure log: `@theme inline` and `--color-*` overrides). `shadow-none` is a static utility and survives the strip. Until this list existed, Tailwind's whole stock elevation scale was live. `shadow-2xl` (a 50px blur) and `shadow-[0_24px_64px_rgb(0_0_0/0.9)]` both passed lint in a product component. Checked with `eslint --stdin` on 2026-10-19.

### The Riso ramps — `palette.css`

The seven ramps are declared in `packages/ui/src/styles/palette.css`, one `--color-{ramp}-{step}` per step, generated by `packages/ui/scripts/generate-palette.mjs` (never edited by hand), in an `@theme static` block so every step is emitted whether or not anything references it. Two rules:

- **It is imported after `theme.css`** in `packages/ui/src/index.css`. The strip above removes Tailwind's `teal`; a strip that ran after `palette.css` would remove the Riso `teal` ramp too, silently. `apps/storybook/tests/palette.spec.ts` asserts the order, and that `palette.css` matches `docs/palette.json`.
- **Components never name a ramp.** Lint rejects every ramp name, as it does every Tailwind scale; `theme.css` and `palette.css` are the only files that may.

### Mode switching

Follow the Tailwind v4 documented pattern — raw values on `:root` and `[data-theme="dark"]`, then `@theme inline` to expose them as utilities:

```css
:root {
  --tui-canvas: var(--color-ledger-50);
  --tui-text-primary: var(--color-ledger-950);
  --tui-text-interactive: var(--color-sage-700);
  --tui-ring: var(--color-ledger-800);
  /* ... light mode values ... */
}

[data-theme="dark"] {
  --tui-canvas: var(--color-ledger-950);
  --tui-text-primary: var(--color-ledger-50);
  --tui-text-interactive: var(--color-sage-400);
  --tui-ring: var(--color-ledger-200);
  /* ... dark mode values ... */
}

@theme inline {
  --color-canvas: var(--tui-canvas);
  --color-text-primary: var(--tui-text-primary);
  --color-text-interactive: var(--tui-text-interactive);
  /* ... */
}
```

`@theme inline` is required — plain `@theme` would resolve the reference once at build time and break mode switching.

**Two layers, two prefixes, and they are not interchangeable.** The `--tui-*` layer holds raw mode-dependent values and generates nothing. The `--color-*` layer inside `@theme inline` is what emits utilities. A token that skips the `--tui-*` layer stops responding to the mode switch; a token that never reaches the `--color-*` layer produces no utility class. Both failures are silent.

### Alpha tints

Use the `--alpha()` function in CSS, or slash syntax in utilities:

```css
--tui-bg-danger: --alpha(var(--color-vermilion-500) / 10%);
```

Do not hardcode a resolved RGBA — the tint must composite over whatever canvas is active.

**Do not use the raw-hue slash form in component code.** `class="bg-vermilion-500/10"` composites correctly but names a hue, which §0 rule 10 forbids and the lint rule in `tools.md` rejects. It is legal only inside `theme.css` and the generated `palette.css`. In a component the tint is reached through its role token: `class="bg-bg-danger"` (see §4 on the doubled utility names).

### Font loading

This project self-hosts through `@fontsource-variable/*` (§8.3 names the entry points). If the families are ever loaded from Google Fonts instead, the `opsz` axis and the italics must be requested explicitly. A URL that does not name `opsz` serves files without the axis, which silently makes §8.4 a no-op.

```html
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Source+Code+Pro:ital,wght@0,400..600;1,400..600&family=Source+Sans+3:ital,wght@0,400..600;1,400..600&family=Source+Serif+4:ital,opsz,wght@0,8..60,400..600;1,8..60,400..600&display=swap" rel="stylesheet">
```

Self-hosting is preferable for an internal tool — three variable families subset to Latin plus the currency and symbol ranges you actually use. Verify after subsetting that `tnum` and `zero` survived; subsetters strip unused OpenType features by default and both are mandatory here.

### Naming

Semantic names only in component code — `bg-bg-danger`, `text-text-interactive`, `border-border-agent` (§4 explains the doubled word). A component should never reference `federal-400` directly; if it does, the mode switch and any future hue change break silently.

See §4 for the full naming pattern and the rejected alternatives.

---

## 10. Verification checklist

Before the token set is considered done:

- [x] **Riso Ledger re-verification (2026-10-16). Human checks done 2026-10-22 (owner, in Storybook, both modes).** Automated contrast passes: `packages/ui/scripts/check-contrast.mjs` and `apps/storybook/tests/contrast.spec.ts`, both modes, every ground in §4. Passed by eye: the five role colours read as equal weight in both modes (§2); ochre reads as warning, apart from vermilion; paper-on-paper menus separate by border alone (§3); dark menus on `ledger-925` lift off the page; the 6% hover is visible over paper and ink, and the inverse overlay shows on the ink and paper primary buttons; a sage selected row (`Select`) reads as selected beside the ink controls; grayscale `RunLogRow` keeps every state distinct; under deuteranopia simulation, chart series 1 and 4 and danger beside success stay separable; sustained reading on `ledger-950` is comfortable. Two findings, below, stay open.
- [x] **Light-mode warning reads brownish (owner, 2026-10-22). Decided the same day: keep it.** `ochre-700` text reads as equal weight but on the brownish side, and the `ochre-500` fill read brownish under ink text. A side-by-side in Storybook compared four fills beside the other roles, as a label and as a progress bar: today's `ochre-500` with ink (4.89:1, fill 3.35:1 on paper), `ochre-500` with `ochre-950` text (4.93:1), `ochre-600` with paper (4.97:1) and `ochre-700` with paper (6.74:1). The owner kept today's. The deeper steps read browner still, and the yellower ones fail the 3:1 a fill needs. The text step is fixed by §0 rule 4.
- [x] **The ink focus ring read heavy, in both modes (owner, 2026-10-22). Resolved the same day.** The 2px width read right; full-strength ink (16.39:1) did not. After a side-by-side of four steps per mode, the ring is `ledger-800` in light (9.10:1 on paper) and `ledger-200` in dark (12.68:1 on the canvas), the gentlest of the candidates (§4).
- [x] **`DataTable` checked rows take no selection tint — decided 2026-10-22 (owner), after a side-by-side in both modes.** The ink checkbox marks a checked row, and the row keeps its status tint (failed, agent proposed). A sage tint would have replaced that status tint on every checked row, and turned an agent proposal green. The sage selection tint stays for single-selection lists: `Select`, `Combobox`, `Chip` and `LineageTree` (§4).
- [x] **Overlay sheet (2026-10-19). Human checks done 2026-10-22 (owner, both modes, at 1x and 2x).** On Dialog and the sidebar peek: the sheet reads as a second sheet, not a heavier border; the peek's sheet reads as a sheet, not a stripe; nothing in a dialog's footer rhymes with the sheet's corner. Automated: `--shadow-overlay`'s two layers compute to `--color-surface-raised` and `--color-border-strong` on both overlays in both modes, in `apps/storybook/tests/elevation.spec.ts`; and no other element in any story paints a shadow layer, in `apps/storybook/.storybook/elevation-sweep.ts`, which runs after every story test in both modes.
- [x] All five `--color-text-{role}` tokens sit within OKLCH L 66–71 in dark mode — verified side by side on the Tokens story 2026-08-02: none dominates. *(Tailwind ramps. Since 2026-10-16 every role is one step per mode, §2; see the re-verification item above.)*
- [x] *(Tailwind ramps; for ochre see the re-verification item above.)* Dark warning reads as warning, not as decorative orange. `amber-600` verified 2026-08-02; reopened 2026-10-09 for contrast on row states and replaced by `amber-500` after a side-by-side, accepting that it reads ~6 L brighter than the other roles (§2).
- [x] Every `--color-on-{role}` / `--color-fill-{role}` pair clears 4.5:1, all six roles, both modes — asserted in `apps/storybook/tests/contrast.spec.ts` and `packages/ui/scripts/check-contrast.mjs`. Every fill clears 3:1 against the canvas (`check-contrast` gates it since 2026-10-16).
- [x] `--color-text-tertiary` appears nowhere as text the user reads — `ledger-400`, 7.37:1 on the dark canvas, and `ledger-600`, 4.89:1 on the light canvas, since 2026-10-16 (it was `olive-500`, 4.60 / 4.12, and `neutral-500`, 4.18 / 4.53, before that).

  **Resolved 2026-10-08: every read use moved to `--color-text-secondary`.** The readiness review switched axe to failing the build, and 25 stories failed on tertiary text: timestamps (`AgentBlock`, `AttachmentRow`, `RunLogRow` durations), `MetricTile` captions, `LineageTree` meta, `Field` help and its required marker, `FilterChip`'s field label, `DataTable`'s and `ComboboxEmpty`'s empty messages, `popupSurface` group labels and `MenuShortcut` hints. All four questionable uses in the table below went the way it recommended, and so did the uses the 2026-08-03 audit had permitted (timestamps, shortcut hints, the marker), because axe measured them under AA on the grounds they actually sit on. What stays tertiary: placeholders (`Input`, `Select`, `Combobox`), icons (carets, the `EmptyState` glyph), and `CodeView`'s `aria-hidden` gutter. The cost is one step of text hierarchy: meta now matches labels, and is told apart by size and position. Placeholders were under AA in light mode (4.12:1 on `olive-50`), an accepted exception; on `ledger-600` since 2026-10-16 they measure 4.89:1 on paper and clear it.

  **Audited 2026-08-03; not yet clean.** Fourteen `--color-text-tertiary` usages. Most are squarely inside the permitted set — placeholders (`Input`, `Select`, `Combobox`), a decorative caret, an `aria-hidden` required marker, `Menu` shortcut hints, `AgentBlock` meta, `RunLogRow` timestamps. Four are arguably text the user must read, and want a decision:

  | Usage | Why it is questionable |
  |---|---|
  | `ComboboxEmpty` message | "No models match X" is the only thing explaining an empty list — the clearest defect of the four |
  | `MetricTile` caption | "vs. H1 FY2025" is what gives the delta its meaning |
  | `FilterChip` field label | The field name is what makes a chip legible out of context — its stated purpose |
  | `popupSurface` group labels | Category headers in a popup; navigational rather than decorative |

  `--color-text-secondary` (8.43:1 dark / 6.68:1 light) is the fix in each case. Left open deliberately: this is a design call about what counts as essential, not bookkeeping.

  **Resolved 2026-10-07: sidebar section labels**, `AppShellNavGroup`'s ("Business") and `ContextSwitcherLabel` ("Project"). They are navigation, and they sit on `--color-surface`, not the canvas, where tertiary measured **3.78:1** in dark mode on `neutral` (**3.98:1** on `olive-900`; light: 4.26:1 on `#fff`). Moved to `--color-text-secondary`, 7.30:1 on the olive sidebar. **The ratios in this section are measured against the canvas. A label on a surface or raised step measures lower**, so the `popupSurface` group labels above, which sit on `--color-surface-raised`, are worse than their row suggests.
- [x] **Light-mode ratios measured against the paper canvas, `ledger-50`, not `#fff`** — asserted in `apps/storybook/tests/contrast.spec.ts`, which fails if `--color-text-interactive`, the tightest role, drifts off 6.23 or if the canvas ever equals white.
- [x] **Role text clears 4.5:1 on its own tint, on every ground it sits on** (canvas, `--color-surface`, hovered row, selected row, both; `--color-surface-raised` and a highlighted popup row since 2026-10-16). Asserted for all six roles in both modes by `apps/storybook/tests/contrast.spec.ts`. **Resolved 2026-10-09:** eight pairs fell short (light interactive and success on hovered rows, down to 3.98:1; agent and info on selected + hovered; dark warning on `--color-surface` and selected + hovered). Fixed by the lightness bands in §0 rule 4: light text moved to emerald-800, violet-700 and sky-800, dark warning to amber-500 (§2). `KNOWN_SHORTFALLS` is empty, and the test fails on any new pair under 4.5:1.
- [x] **No colour token declared under bare `--text-*`** — all 18 `--text-*` declarations in `theme.css` are a size or a `--line-height`. Enforced continuously by the `declaration-property-value-allowed-list` rule scoped to `theme.css`.
- [x] Chart series 6 resolved — **ramp capped at seven, `lime` removed** (2026-08-02). An eighth series means the chart needs grouping, not another colour.
- [x] Chart tokens resolve and clear 3:1, and `--color-chart-8` must not exist — asserted in `apps/storybook/tests/contrast.spec.ts`. *(Literal OKLCH until 2026-10-16; they reference the Riso ramps since, §6.)*
- [x] Hover and press use the `--color-bg-hover` / `--color-bg-active` overlay; the primary button, whose fill is the overlay's own colour, uses the `-inverse` pair (2026-10-16). No per-role hover token exists. The 6% overlay was verified visible on 28px rows over canvas, over `--color-surface`, and over a solid fill (2026-08-02).
- [x] Selection uses `--color-bg-interactive`; no `--color-bg-selected` is declared or used. All four selection sites (Chip, Select, Combobox, LineageTree) use it.
- [x] Every `--text-*` size has its `--line-height` partner — 9 sizes, 9 partners, none missing.
- [x] `--radius-*` declared in px — 0px for `xs` through `lg` plus `9999px` for `full` (2/4/6/8px until 2026-10-16, §7.7); `xl` through `4xl` are stripped to `initial` so the 8px ceiling is structural.
- [x] No chromatic 900/950 background — zero occurrences in `packages/ui/src/`, and `tui/no-deep-chromatic-background` rejects them in CSS including `theme.css` itself.
- [x] Focus rings use `outline` and survive inside `overflow: hidden` — **verified 2026-08-03** by keyboard on three surfaces that put a control against a scroll boundary: `DataTable` (checkbox first column, icon button last), `Chip`/`FilterChip`, and a scrollable `TabsList`. See §4 on why padding and inset offsets — not `outline` itself — are what prevent clipping.
- [x] Numeric cells carry `tabular-nums` and share a right edge — asserted in `apps/storybook/tests/density.spec.ts` on a `DataTable` variance column with mixed-width figures.
- [x] **Source Serif 4 and Source Sans 3 ship `tnum`** — verified 2026-10-16 by glyph-width diff: with `tabular-nums`, `111111` and `000000` both measure 97.96px in the serif and 98.46px in the sans at 32px/600. (Archivo measured 111.17px for both, 2026-10-08, and Inter Tight 121.47px, 2026-08-02.)
- [x] Source Serif 4 is loaded *with* its `opsz` axis, and the metric tier renders in the display cut — verified 2026-10-16: `Hamburgefonstiv` at 32px/600 measures 288.35px at `'opsz' 8` and 232.13px at `'opsz' 60`, and `$847.2M` measures 118.75px with `font-optical-sizing: auto` against 127.78px at the text cut. Asserted in `apps/storybook/tests/density.spec.ts`. **Import `@fontsource-variable/source-serif-4/opsz.css`, not the package default:** the default entry point ships wght-only files and silently turns optical sizing off, the same trap the Google Fonts URL sets in §9. (Until 2026-10-16 this row checked Archivo's `"wdth" 90`, removed with the family, §8.3.)
- [x] No `--tracking-tight` on the metric tier — `MetricTile` uses `--tracking-display` (0); measured `letter-spacing: normal` at 32px.
- [x] The serif renders only on the metric tier and inside `<h1>`–`<h6>` — asserted in `apps/storybook/tests/density.spec.ts` across four stories, along with the sans as the body face and every family loading under its `Variable` name. `MetricTile` is the only consumer of `--font-display`. (Until 2026-10-16: metric tier only, §8.3.)
- [x] `p-px` appears nowhere as spacing — one occurrence in `packages/ui/src/`, `Switch`'s track, where `p-px` and the track's 1px transparent border together make the thumb's 2px inset (#104, asserted in `apps/storybook/tests/switch.spec.ts`). §7.3 names it as the one sanctioned case (2026-10-22).
- [x] Status badges use `--radius-xs` — asserted in `apps/storybook/tests/density.spec.ts` against a rendered status column; every badge measures the token, 0px since 2026-10-16 (2px before). `shape="count"` keeps `--radius-full`, which §7.7 permits.
- [x] Role tokens used over raw primitives — **zero** `p-2` in component source. Recounted 2026-10-08 (the earlier "five" predated `CountBadge` and the shell audit): ten primitive uses, each a documented fallback or a non-spacing case. Fallbacks: `Button`'s `pl-1.5`/`pr-1.5` optical icon-edge correction (§7.4); `Tooltip`'s `py-1` (no vertical popover token exists); `CountBadge`'s `gap-1`, a label-to-figure gap that must exceed the word space; `AppShell`'s `py-3` footer band (12px, one constant serving both footers; the sidebar's is 56px, the panel's grows with `ChatComposer`); `EmptyState`'s `p-4` (16px, since `--gap-section` rose to 32px). `popupLabel`'s `pt-2`/`pb-0.5`, which make the 24px label row (§7.4 `--pad-popup-list`). `popupSpaced`'s `gap-1` between its 36px rows and `pb-1.5` for its 28px label row (Menu's `spaced` density, 2026-10-08; no row-gap token, by decision). Not spacing: `Combobox`'s `data-empty:p-0` (a reset; its `scroll-py-1` became `scroll-py-[var(--h-row-xs)]` with the scroll cue, §4), and `AppShell`'s `m-2` inset on the floating sidebar peek. **Added since, recounted 2026-10-21:** `ChatStarter`'s `gap-1` between its suggestion rows, the same 4px row gap as `popupSpaced` and the same no-token decision; `AgentReasoning`'s `px-1.5 py-0.5` with equal negative margins, padding its trigger's hover ground without moving the label; `Textarea`'s `p-0` on the borderless variant (a reset); and `Switch`'s `p-px` (see the item above). `gap-1` now appears three times, twice as that row gap and once as `CountBadge`'s label-to-figure gap. **Added 2026-10-28:** `InlineCitation`'s `h-4 min-w-4 px-0.5`, the 16px inline mark (no token names an inline mark's size; one use). §7.4's rule counts the same fallback, so the row gap is at two. **A third row-gap use reopens the no-row-gap-token decision.**
- [x] Grayscale test — **verified 2026-08-03** on `RunLogRow`'s Grayscale story: all nine run states stay distinguishable by icon and label with hue removed.
- [x] *(Tailwind ramps; the Riso chart is in the re-verification item above.)* Deuteranopia simulation on a 7-series chart. Confirm series 2 and 3 (amber, teal) remain separable. **Verified 2026-10-11 (human review):** separable; no change.
- [x] No component spacing above 32px, radius above 8px or control height above 36px — all 39 geometry tokens in `theme.css` are within cap (recounted 2026-10-08: 36 within the 32px / 8px / 36px caps, `--radius-full`'s 9999px being the permitted exception, plus the 3 `--pad-frame-*` within 64px; the 31 quoted until then predated the shell audit), and the lint gate rejects violations in component code. Frame spacing (`--pad-frame-*`, §7.3) is capped at 64px instead, and the gate rejects it outside `AppShell`, `EmptyState` and `apps/*/src/App.tsx`.
- [x] Sustained-reading check — **passed 2026-08-03**. 30 minutes on the dark table view with no edge bloom; `neutral-950` canvas and the text steps are confirmed for multi-hour use. Re-check on `olive-950` below.
- [x] **Palette change re-verification (2026-10-08).** The checks above dated 2026-08-02 and 2026-08-03 were made on `neutral` with blue as the accent. Re-run on the olive canvas with six roles present: the six foregrounds read as equal weight (§2); dark warning, `amber-500` since 2026-10-09 (§2), still reads as warning beside an emerald accent; the 6% hover is visible over canvas, surface and an emerald fill; sustained reading on `olive-950`; and the grayscale pass on `RunLogRow` with running now on `info`. **Verified 2026-10-11 (human review):** all pass; no change.
- [x] Chart series 3 and 6 (`teal`, `cyan`) are emerald's palette neighbours, which the pairing rule in §1 rejects for anything sitting next to the accent. Decide whether to replace them; until then, a chart beside an emerald primary action is the case to watch. **Decided 2026-10-11 (human review): keep them.** A chart beside an emerald primary action remains the case to watch.
- [x] Icon weight reads as hierarchy, not as uniform heaviness — **verified 2026-08-03** on the `RunLogRow` run-log screen with nav, row and status icons present. `bold` as the effective default at this density is confirmed; the `regular`-at-one-step-larger fallback in §11.2 is withdrawn.
- [x] Above 16px, icon stroke weight matches the weight of its adjacent type (§11.2). Check a page-header control and an empty state — an icon at `regular` beside 600 type, or `bold` beside 400 type, is the defect this rule exists to catch. **Verified 2026-10-11 (human review):** matches; no change.
- [x] Phosphor is the only icon library — `@phosphor-icons/react` is the sole icon dependency and the sole icon import across `packages/ui/src/`.

---

## 11. Icons

Section numbered after the checklist deliberately: §10 is referenced by name from `CLAUDE.md` and elsewhere, and renumbering would break every one of those references.

**Library: `@phosphor-icons/react` (MIT).** Chosen for the six-weight system — weight is a hierarchy channel, not decoration. The product is fintech that shouldn't read as a bank.

Phosphor is the only icon library. `lucide` and `hugeicons` are excluded from the stack; `components.json` carries `"iconLibrary": "phosphor"`, which makes `shadcn add` vendor Phosphor imports directly and requires no hand-rewriting.

### 11.1 Rules

- Phosphor only. Never mix icon libraries. Never hand-roll an SVG to fill a gap. If no Phosphor icon fits, stop and ask. **One exception, asked and approved:** `Spinner`'s square tracer (§11.5, 2026-10-20). It is a drawn mark because Phosphor has no square activity glyph, and it lives in the one component that may draw it.
- **Never use color *alone* to convey state.** Weight and shape carry it too, so the distinction survives grayscale and color-blind users (§5, §10). Colour still means state per §0 rule 1 — it is never decorative and never brand. An icon in a failed row takes `--color-text-danger`; an icon in a sidebar is neutral.
- Icons inherit `currentColor`, so they pick up `--color-text-*` from their context automatically. Never hardcode a hex value and never set colour on the icon that differs from its label.
- Decorative icons: `aria-hidden="true"`. Icon-only buttons need an `aria-label` on the **button**, not the icon.
- Duotone: do not use. A second colour inside one icon has no state meaning available to it under §0 rule 1.

### 11.2 Weight

**The governing principle: icon stroke weight matches the weight of the type it sits with.** An icon beside a 400 label and an icon beside a 600 heading are not the same object, and drawing both at one stroke weight makes the pairing read as two systems bolted together. Matching them is what produces visual harmony, and harmony is what makes an icon legible as part of a phrase rather than as an interruption in it.

Two things override that principle, and both are optical rather than aesthetic. They are applied in this order:

**1 — State treatments win outright.**

| State | Weight | Why it is not a weight decision |
|---|---|---|
| Active nav / selected tab | `fill` | Solid vs outline is the state signal; it is a shape change, not a stroke change |
| Disabled or de-emphasized | `light` | Pairs with the recessive ground: a disabled control's whole-box `opacity-50` (`controlBase`), or `--color-text-disabled` on disabled text. Deliberately recessive |
| Destructive / error / alert | `bold` | A redundant non-colour channel so the state survives grayscale (§5, §10) |

**When two states apply, disabled wins.** A disabled destructive button draws `light`, not `bold`. The `bold` exists so a warning survives grayscale, and an inert control has nothing to warn about. Its label still names the action. Above both, an explicit `weight` passed on the icon wins over everything.

**Disabled controls get two signals: the fade and the stroke.** `controlBase` fades the whole control to 50%, because a dimmed label on a full-strength fill still reads as enabled. The fade alone, though, leaves the icon at full weight, a bold mark on a ghost control. `light` makes the icon recede too. `Button` (through Phosphor's `IconContext`) and `IconButton` (through its weight mapping) apply it themselves, so no call site passes it. Together they draw roughly 0.6px strokes at 50% opacity, about half the enabled weight. Shapes stay recognisable at 1× in both modes (checked 2026-10-07 on the Disabled stories). The faintest case is the trash icon on the disabled destructive fill. That is acceptable: WCAG 1.4.3 exempts inactive controls, and the label carries the meaning. Until 2026-10-07 the code applied only the fade, and this row went unenforced.

**2 — Then the size bands.**

| Icon size | Weight | Reason |
|---|---|---|
| **≤16px** | `bold` | Legibility floor |
| 17–47px | match adjacent type: 400 → `regular`, 500 → `regular`, 600 → `bold` | Harmony |
| ≥48px (empty state) | `thin` | Optical compensation |

**Why ≤16px overrides harmony.** Phosphor is drawn on a 16px grid and reads lighter than most sets; at ≤16px `regular` goes muddy, and on a `ledger-950` canvas it goes muddier still. Legibility is not negotiable in a dense product, so the floor wins over the pairing.

**Why ≥48px does too.** A stroke tuned to read at 16px looks heavy at 48px. This is the same correction the type system already makes — §8.4's optical sizing redraws Source Serif 4 tighter above 24px because spacing drawn for 13px text reads loose at 32px. **Icons and type are being corrected by the same optical logic, in the same direction.** That is the deeper sense in which they harmonise.

**500 rounds down to `regular`.** Phosphor has no medium stroke. Rounding 500 up would give column headers and labels the same stroke as headings and collapse the distinction the type scale draws. The practical cost is near zero: labels and headers in this product are almost always ≤16px, where the floor applies anyway.

**Consequence at Tabular UI's density.** With 24/28px rows and 32px controls, most icons land at ≤16px and take `bold`. Harmony therefore governs a real but narrow band — page-header controls at `--size-icon-lg`, and empty states. **In the dense core of the product the hierarchy channel is `fill` vs `bold`** (active vs inactive), not `regular` vs `fill`.

**Confirmed in situ, 2026-08-03.** Verified on the `RunLogRow` run-log screen with nav, row and status icons present: `bold` as the effective default does *not* read too heavy at this density, and the hierarchy still lands. The `regular`-at-one-step-larger fallback is withdrawn — do not reintroduce it without a new side-by-side on a real screen.

### 11.3 Size

**Two mechanisms, by role:**

- **Inline with text** — icons inside a sentence, a cell beside its label, a badge beside its text: leave the `1em` default. The icon scales with its type, which is what a user enlarging their browser font is asking for. This is not a violation of §7.5 — an inline icon *is* type-adjacent.
- **Standalone** — toolbar buttons, sidebar rails, status columns, anything sized by the grid rather than by adjacent text: pass an explicit `--size-icon-*` token, in px per §7.5.

```
--size-icon-xs   12px    chip interiors — badge marks go one step below, at 10px (table below)
--size-icon-sm   14px    popup rows, tabs, dense rows — --h-row-xs (24px), --h-row-sm (28px)
--size-icon-md   16px    icon-only controls (32px), nav and list rows
--size-icon-lg   20px    --h-control-lg (36px), page-header controls
--size-icon-display 48px display icon — `EmptyState` only
```

**By role — which size a given icon takes.** An earlier revision labelled `--size-icon-md` "controls (32px)", which contradicted the inline rule above for a labelled `Button`: the code followed the inline rule, and a sidebar ended up mixing 16px nav icons with a 13px account icon in one column, labels 3px out of line. Settled 2026-10-07:

| Role | Size | Where |
|---|---|---|
| **Labelled control** — the icon is a word in the button's phrase | `1em` (13px at `--text-base`, 12px at `--text-sm`) | `Button`, `AppBar` actions |
| **Icon-only control** — no label, sized by the control | `--size-icon-sm` / `md` / `lg` by control height | `IconButton` sm / default / lg |
| **Nav and list rows** — the icon is the scan anchor of a column | `--size-icon-md` (16px) | `AppShellNavItem`, `AttachmentRow` |
| **Popup, tab and dense rows** | `--size-icon-sm` (14px) | `Menu`, `Select`, `Combobox` items, `Tabs` |
| **Chip interiors, and a signal icon beside a `--text-2xs` label** | `--size-icon-xs` (12px) | `Chip`, `FilterChip` |
| **Badge marks** — beside `--text-2xs` uppercase | `size-2.5` (10px), primitive, below the scale on purpose | `Badge`, `StatusBadge` |

**Why nav rows are larger than labelled controls.** A labelled control is read as a phrase, so its icon stays at type size, about 1.1× the cap height. A nav column is scanned icon-first, down the column, so its icon is bigger than the label's caps (about 1.3–1.4×). The bigger icon only works if every row in the column uses it.

**10px is for simple marks only.** A check, a cross or a dot survives at 10px because it has no inner detail. A glyph with interior detail does not: at 10px on a 1× monitor, Phosphor's robot loses its eyes and mouth and reads as a box. An icon that carries a required signal, or that accepts any glyph through a prop, takes 12px at minimum. Checked by rendering pixel for pixel, 2026-10-07, on `AgentBlock`'s header icon, which was both until it was removed on 2026-10-14 (§5).

**A control placed in a nav column takes the nav row's 16px slot**, even if it is a `Button` (the sidebar's account row, for example). Otherwise its label starts 3px left of the nav labels above it.

`--size-icon-display` landed with `EmptyState` (2026-08-03), as this section anticipated. It is the only size that leaves the density grid, and the only one that takes `thin` weight (§11.2). Do not reach for it outside an empty state — a 48px icon anywhere in a dense screen is a mistake, not an emphasis.

**Both `size="var(--size-icon-sm)"` and `size={14}` work.** Phosphor forwards `size` to the SVG `width`/`height`, which are parsed as CSS values, so a `var()` reference resolves — verified in Chromium, rendering 14×14. Prefer the token form. If a target browser ever fails to resolve it, the numeric fallback is the same value, not a different one.

`currentColor` inheritance is verified in the same way: an icon inside `text-text-success` renders sage, inside `text-text-warning` ochre, with no colour set on the icon itself.

**Icon weight is not font weight.** Phosphor's `bold` is a stroke axis on an SVG and is unrelated to §8.5's "never 700". Do not "correct" `weight="bold"` to `semibold`; do not read the §8.5 cap as applying here.

### 11.4 Imports and bundling

- **Named imports with the `Icon` suffix**: `import { HouseIcon } from "@phosphor-icons/react"`. Phosphor exports both `House` and `HouseIcon`; the suffixed form is what `shadcn add` vendors, and one convention keeps the codebase greppable. Never `import * as`.
- The package is one barrel with ~3,000 exports. It is listed in `optimizeDeps.include` in `vite.config.ts` so Vite pre-bundles it once instead of discovering it mid-session and forcing a reload. Production tree-shaking is unaffected — the package sets `sideEffects: false`.
- `shadcn add` writes Phosphor imports but does **not** install the package. It is a direct dependency for that reason; do not remove it as "unused" because no source file appears to import it yet.
- The `@phosphor-icons/react/ssr` entry point exists for React Server Components. This project is a Vite SPA with `"rsc": false` — it does not apply. Revisit only if the consuming app moves to RSC.

### 11.5 The working indicator: `Spinner`

**Decided 2026-10-20 (owner), replacing Phosphor's `CircleNotch` with `animate-spin`.** The exploration, with the eight variants weighed and the reasons the others lost, is `docs/explorations/working-indicator-brainstorm.md`.

**The mark is a square tracer.** It is the notch spinner redrawn at 0px radius: three quarters of a square outline, with the gap travelling clockwise round it at constant speed. It keeps the four things a spinner does well: it is recognised in under a second without a label, it promises nothing about how long, it sits where the result will appear, and it moves continuously. What it adds is that it belongs to this product. The round notch broke no rule (`--radius-full` keeps round marks round), but it was the one mark on the page that could belong to any app.

**Geometry**, in Phosphor's own terms, so it sits beside Phosphor icons as one of them:

| | Value | Why |
|---|---|---|
| Box | 16 units, sized `1em` | Phosphor's grid, and §11.3's inline default |
| Square | 10.5 units a side, centred | The same area as `CircleNotch`'s 12-unit circle (side = r√π). Drawn at the circle's diameter, a square reads a size larger. |
| Segment | 75% of the perimeter | Carries the same ink as the notch. A quarter reads as a tick at 10px, and half as a crop mark. |
| Stroke | Phosphor's weight scale: `bold` 1.5 units, `regular` 1, `light` 0.75, `thin` 0.5 | Read from `IconContext`, so §11.2 applies unchanged; `bold` when nothing sets it |
| Lap | 1.2s, linear | The speed approved in the exploration story. The perimeter is 11% longer than the notch's circle, so the gap travels at about the speed the notch turned at 1s (35 units a second against 38). |

**Still frame.** Under reduced motion, and as frame 0 of the animation, the segment is centred on the top-right corner, with the gap at the bottom left. That frame is what a reduced-motion user sees for as long as the work runs, and what screenshot tests record (Playwright resets an infinite animation to frame 0). It reads as a notch, not as an empty square, which is a checkbox.

**Where it ships.** The `ChatThread` turn before its first token, `AgentReasoning` while it streams, `AgentPlan` while it drafts a step, `StatusBadge` `running` and `AI working`, and `apps/demo`'s `StageTracker`. It takes the colour of its label (§11.1) and the size of the icon it replaces (§11.3): `1em` inline, 10px as a badge mark, `--size-icon-xs` in the plan's number column.

**`running` and `AI working` share the mark (owner decision, 2026-10-20).** Until then `agent-working` spun Phosphor's robot, which tumbled: a rotating glyph that is not radially symmetric reads as falling, not working. Every working state now moves the same way. The cost, accepted: in a badge, the two differ only by hue and label. In dark mode a deuteranope sees federal and orchid at about 3 (§1), so the label ("running", "AI working") is what tells them apart. In a row, the agent rail still carries it (§5).

**Decorative by default.** The mark is `aria-hidden`; the label beside it says what is happening. A `Spinner` given an `aria-label` becomes `role="status"`, for the rare place with no visible label.

**The elapsed figure.** Where a working state has a label (chat, reasoning, a plan step), the label gains a ticking figure once the work has run for **3 seconds**: `Working…` becomes `Working · 0:07`. The figure is `m:ss` in `tabular-nums`, so it never changes width under 10 minutes, and the ellipsis goes when it appears, because the ticking figure now says "in progress". The reason is labour perception: people trust a result more when they can see the time and effort that went into it. Below 3 seconds the figure would only be noise.

- **It counts from when the work started.** The component takes `startedAt` (epoch ms) where the caller knows it, so a reload mid-run carries on rather than restarting at 0:00. Without it, it counts from when the working state appeared.
- **It keeps ticking under reduced motion.** A changing number is not movement, and for a reduced-motion user it is the only sign that the work is still going.
- **It is never announced.** The figure is `aria-hidden`, and assistive technology reads the label alone ("Working"), which does not change. A figure inside a live region would otherwise be read out every second.
- **Not in a badge.** A run's duration belongs to its row (`RunLogRow`), not to its status mark.

---

## Appendix A. Superseded colour decisions (Tailwind ramps, to 2026-10-15)

Moved here verbatim on 2026-10-16, when the Riso Ledger palette replaced the Tailwind ramps (§1). **Nothing in this appendix is current.** It records why the old values were chosen, for anyone weighing a change back. Section numbers and cross-references inside it refer to the spec as it stood then. Every colour it names (`olive`, `emerald`, `red`, `amber`, `sky`, `violet`, the chart literals) is stripped and no longer exists.

### A. §1 — The Five, the hue choices and the colour-vision table (Tailwind ramps)

Five hues, six roles. Interactive and success share `emerald` on purpose: the accent is also the "good" green.

| Role | Hue | Applies to |
|---|---|---|
| **Interactive** | `emerald` | Focus ring, selected row, active nav item, links, primary action |
| **Danger** | `red` | Failed run, validation error, destructive action, negative variance, reconciliation mismatch |
| **Warning** | `amber` | Stale data, degraded run, needs review, unverified figure, approaching threshold |
| **Success** | `emerald` | Passed test, verified figure, deployed, positive variance, numbers match |
| **Agent** | `violet` | Agent-authored content, generated dbt code, agent questions, agent activity, pending human review |
| **Info** | `sky` | "Running" state, work in progress, informational notices |

**Palette change, 2026-10-08 (user decision).** The accent moved from `blue` to `emerald`, the neutral scale from `neutral` to `olive` (§3), and `sky` returned as the `info` role. `blue` is stripped from UI and survives only as the chart literal in §6.

##### Why these and not the alternatives

**emerald as the accent, shared with success.** One green for "act here" and "this is good" is a deliberate brand choice, not an accident of the token map. The cost is that a primary button and a success badge are the same hue, so **shape carries the difference**: a solid fill at control height is an action, a tinted 18px badge is a state. Interactive and success stay separate tokens with identical values, so they can diverge later without touching a component.

**Running moved off interactive, to info.** With interactive on emerald, a "running" spinner would read as "passed" in a run log, which is the one screen where that confusion is unaffordable. That is the reason `info` exists.

**sky for info, and the pairing rule.** The accent pairs with a hue two or three steps away in Tailwind's palette order, never a neighbour: from `emerald`, `sky` or `blue`, never `teal` or `cyan`. Sky was chosen over blue because of agent. Under deuteranopia simulation `blue` and `violet` are indistinguishable (OKLab ΔE 0.3 dark, 0.4 light). Sky separates cleanly in light mode (`sky-700` vs `violet-600`, ΔE 12.9), **but not in dark mode**: `sky-500` vs `violet-400` is ΔE 1.4. Info always carries its spinner, and agent carries a rail and a label (§5); those, not hue, are what a deuteranope reads. `sky-400` would separate better (ΔE 5.6) but sits at L 74.6, outside §2's band.

**red over rose.** `rose-500` sits at hue 16.4 versus `red-500` at 25.3 — rose skews pink and softens the alarm. Negative variance in a financial tool must not look decorative.

**amber over yellow.** Yellow cannot get dark enough for light mode without turning olive: `yellow-700` is `oklch(55.4% 0.135 66.442)`, effectively brown, and `yellow-600` on white is only 2.93:1 — unusable as text. Amber darkens toward burnt orange and holds: `amber-700` on white is 5.05:1.

**emerald over green.** Emerald sits at hue ~163 versus green's ~150, putting more distance between it and amber. In a peripheral scan of a run log, a "passed" chip and a "warning" chip must not blur together. Emerald is also cooler, which reads quieter.

**violet over purple and fuchsia.** `purple-500` at chroma 0.265 is too loud for a state that appears constantly. `violet-400` is the last hue before the range starts reading as consumer-AI marketing.

##### Colour-vision limits of this palette

Measured as OKLCH distance ×100 after Machado (2009) simulation at full severity. Below ~10 is hard to tell apart.

| Pair | Typical | Protan | Deutan | Tritan |
|---|---|---|---|---|
| red-400 vs emerald-500 (dark text) | 32.5 | 13.9 | **4.5** | 34.8 |
| red-700 vs emerald-700 (fills) | 29.7 | 15.6 | **8.8** | 31.3 |
| red-700 vs emerald-800 (light text) | 29.2 | **8.4** | 13.3 | 31.7 |
| red-700 vs amber-800 (light text) | **9.5** | **1.9** | **4.4** | **9.6** |
| amber-800 vs emerald-800 (light text) | 20.2 | **7.2** | **9.9** | 24.4 |
| sky-800 vs emerald-800 (light text) | 12.4 | 11.9 | 11.9 | **2.9** |
| sky-800 vs violet-700 (light text) | 22.2 | 15.6 | 14.5 | **8.1** |
| amber-500 vs emerald-500 (dark text) | 25.3 | **8.4** | 14.5 | 27.8 |
| red-400 vs amber-500 (dark text) | 15.1 | 14.7 | 10.2 | 10.4 |
| sky-500 vs emerald-500 (dark text) | 20.6 | 19.5 | 19.5 | **3.5** |
| sky-500 vs violet-400 (dark text) | 15.3 | **6.0** | **1.4** | 11.5 |

Red vs emerald is the serious one: gain and loss, destructive and primary, converge for deuteranopes. Success already had this property; making emerald the accent spreads it across the interface. **Every hue-coded state carries an icon or label as well** — that is what §10's grayscale check enforces.

##### Explicitly excluded from UI

Hues: `orange` · `yellow` · `lime` · `green` · `teal` · `cyan` · `blue` · `indigo` · `purple` · `fuchsia` · `pink` · `rose`

Greys: `neutral` · `slate` · `gray` · `zinc` · `stone` · `mauve` · `mist` · `taupe` — `olive` is the only grey.

Set these to `initial` in `@theme` to strip them from the CSS output. Some return in the chart ramp only (§6) and should be defined under chart-specific token names rather than re-enabled as general utilities.

### A. §2 — The lightness-band problem (Tailwind ramps)

#### 2. The lightness-band problem — read this before generating accent tokens

The 400 step is **not** perceptually equal across hues. Measured on `olive-950`:

```
lime-400    12.76:1     amber-400   11.41:1     emerald-400  10.13:1
cyan-400    10.82:1     sky-400      8.97:1     orange-400    8.24:1
fuchsia-400  7.58:1     blue-400     7.43:1     pink-400      7.10:1
violet-400   6.87:1     red-400      6.77:1     indigo-400    6.28:1
```

Nearly a 2× spread. A uniform `{hue}-400` foreground token makes amber shout and violet whisper, producing a false visual hierarchy in a run log — the exact screen where accurate hierarchy matters most.

**Fix: match OKLCH lightness, not step index.** Target band **L 66–71**:

| Token | Step | OKLCH L | On `olive-950` |
|---|---|---|---|
| `--color-text-interactive` | `emerald-500` | 69.6% | 7.95:1 |
| `--color-text-danger` | `red-400` | 70.4% | 6.77:1 |
| `--color-text-agent` | `violet-400` | 70.2% | 6.87:1 |
| `--color-text-success` | `emerald-500` | 69.6% | 7.95:1 |
| `--color-text-info` | `sky-500` | 68.5% | 7.22:1 |
| `--color-text-warning` | `amber-500` | 76.9% | 9.17:1 |

Five land within 1.9 percentage points of lightness, 6.77–7.95:1. Note that **emerald and sky use 500** — this is the correction, not a typo. Warning is the one exception to the band, below.

**Dark warning is `amber-500`, the band's one exception — reopened and decided 2026-10-09.** Until then it was `amber-600` (L 66.6, 6.14:1), locked on 2026-08-02 after a check that it read as warning and that the five foregrounds read as equal weight; that note said not to revisit without a new side-by-side. The reason to revisit: `amber-600` text on its own 10% tint measured **4.41:1 over `--color-surface`** (the AppShell sidebar and chat panel) and **3.87:1 over a selected, hovered row**, under AA. No in-band step fixes it, and dropping the tint does not either (4.14:1 at 6%). `amber-500` measures 9.17:1 on canvas and 5.79:1 at worst. **The side-by-side (2026-10-09, Tokens §1, every `StatusBadge`, a DataTable, both modes) was reviewed and approved.** What it showed: warning moves from burnt orange to clear amber and reads more plainly as warning; it separates further from danger (red-400 vs amber 10.4 → 15.1 typical, 3.1 → 10.4 tritan); and it is about 6 points brighter than the other roles, so the five no longer read as strictly equal weight. That last point is the accepted cost. Protan distance from emerald drops 15.6 → 8.4 (§1).

### A. §3 — Neutral foundation (olive)

#### 3. Neutral foundation

**The neutral scale is Tailwind `olive`** (adopted 2026-10-08, replacing `neutral`). Olive is not achromatic: chroma runs 0.003–0.031 at hue ~107, a faint warm yellow-green cast that peaks at the 500 step. Every value below is measured on the olive steps.

##### Dark mode (canonical)

| Token | Value | Contrast on canvas |
|---|---|---|
| `--color-canvas` | `olive-950` `oklch(15.3% 0.006 107.1)` | — |
| `--color-surface` | `olive-900` `oklch(22.8% 0.013 107.4)` | 1.16:1 |
| `--color-surface-raised` | `olive-800` `oklch(28.6% 0.016 107.4)` | 1.37:1 |
| `--color-border` | `olive-800` `oklch(28.6% 0.016 107.4)` | 1.37:1 |
| `--color-border-strong` | `olive-700` `oklch(39.4% 0.023 107.4)` | 2.08:1 |
| `--color-text-primary` | `olive-100` `oklch(96.6% 0.005 106.5)` | **17.76:1** |
| `--color-text-body` | `olive-200` `oklch(93% 0.007 106.5)` | **15.96:1** |
| `--color-text-secondary` | `olive-400` `oklch(73.7% 0.021 106.9)` | **8.43:1** |
| `--color-text-tertiary` | `olive-500` `oklch(58% 0.031 107.3)` | **4.60:1** ← floor |

`olive-500` clears 4.5:1 on the canvas, but only just, and drops to 3.98:1 on `--color-surface`. Restrict it to non-essential text: placeholder text, disabled labels, decorative metadata. Never use it for a value the user must read.

Reserve `olive-50` / `#fff` for the single element per screen that must win — usually one metric or one active row.

##### Light mode

| Token | Value | On canvas (`olive-50`) | On `#fff` surface |
|---|---|---|---|
| `--color-canvas` | `olive-50` `oklch(98.8% 0.003 106.5)` | — | — |
| `--color-surface` | `#fff` | — | — |
| `--color-surface-raised` | `#fff` + shadow | — | — |
| `--color-border` | `olive-200` `oklch(93% 0.007 106.5)` | — | — |
| `--color-border-strong` | `olive-300` `oklch(88% 0.011 106.6)` | — | — |
| `--color-text-primary` | `olive-900` `oklch(22.8% 0.013 107.4)` | **16.38:1** | 16.95:1 |
| `--color-text-body` | `olive-800` `oklch(28.6% 0.016 107.4)` | **13.79:1** | 14.27:1 |
| `--color-text-secondary` | `olive-600` `oklch(46.6% 0.025 107.3)` | **6.68:1** | 6.91:1 |
| `--color-text-tertiary` | `olive-500` `oklch(58% 0.031 107.3)` | **4.12:1** | 4.26:1 |

**Two columns because the canvas is not white.** Light mode canvas is `olive-50` with `#fff` surfaces, not white-on-white — cards need to separate from the ground without relying on shadow, which is unreliable in dense layouts. The consequence is that text on the canvas measures lower than the same text on a card. Design against the canvas column; the surface column is the bonus.

`--color-text-tertiary` at **4.12:1** on canvas **fails AA** in light mode. Under `neutral` it was 4.53:1, a bare pass; `olive-500` is lighter than `neutral-500` in luminance, and the move cost it. The restriction is the same in both modes and absolute: **placeholder text, disabled labels, and non-text marks** (icons, which need 3:1 under WCAG 1.4.11; `aria-hidden` line numbers) only. Never text the user reads. Metadata is read: timestamps, durations, captions, help text, shortcut hints, group labels and empty-state messages are all `--color-text-secondary` (decided 2026-10-08; see §10). On a surface, a tint or the raised step tertiary measures lower still, 3.6–4.3:1 in dark mode.

`olive-400` is 2.25:1 on the canvas and 2.32:1 on white. Decorative only — dividers, icon outlines, never text.

**Accepted tradeoff of the `olive` scale:** the previous decision was that the neutral scale stays at chroma 0, and that large dark surfaces reading "flat" was the price. Olive reverses that deliberately, trading the pure black-and-white look for warmth. It is low-chroma enough to stay neutral in role — §0 rule 1 still treats every olive token as "no hue" — but its yellow-green cast sits about 56° from emerald, so an emerald accent reads as related to the ground rather than against it.

### A. §4 — Accent tables and light-mode decisions (Tailwind ramps)

##### Dark mode

Text ratios are against the dark canvas `olive-950`. `--color-on-*` ratios are against their own fill.

| Role | `--color-text-` | on canvas | `--color-fill-` | `--color-on-` | on fill | `--color-bg-` | `--color-border-` |
|---|---|---|---|---|---|---|---|
| interactive | `emerald-500` | 7.95:1 | `emerald-700` | `#fff` | 5.37:1 | `emerald-500 / 10%` | `emerald-500 / 25%` |
| danger | `red-400` | 6.77:1 | `red-700` | `#fff` | 6.42:1 | `red-500 / 10%` | `red-500 / 25%` |
| warning | `amber-500` | 9.17:1 | `amber-500` | `olive-950` | **9.13:1** | `amber-500 / 10%` | `amber-500 / 25%` |
| success | `emerald-500` | 7.95:1 | `emerald-700` | `#fff` | 5.37:1 | `emerald-500 / 10%` | `emerald-500 / 25%` |
| agent | `violet-400` | 6.87:1 | `violet-600` | `#fff` | 5.88:1 | `violet-500 / 10%` | `violet-500 / 25%` |
| info | `sky-500` | 7.22:1 | `sky-700` | `#fff` | 5.85:1 | `sky-500 / 10%` | `sky-500 / 25%` |

**Solid-fill text rule.** `amber` is the only hue whose fill takes dark text — white on `amber-500` is 2.15:1 and fails badly, so `--color-on-warning` is `olive-950`, which measures 9.13:1 and is the strongest pair in the set. `--color-fill-success` and `--color-fill-interactive` must be `emerald-700`, not `-600`: white on `emerald-600` is 3.67:1 and fails; on `emerald-700` it is 5.37:1 and passes. `--color-fill-info` is `sky-700` for the same reason: white on `sky-600` is 4.02:1.

##### Light mode

**Ratios are against the light canvas `olive-50`, not `#fff`.** §3 defines `--color-canvas` as `olive-50` and reserves `#fff` for `--color-surface`. An earlier revision of this table measured against `#fff`, which overstated every light-mode figure by roughly 4%. The numbers below are the canvas figures. Where an element actually sits on a `#fff` surface the ratio is slightly better, so the canvas figure is the safe one to design against.

| Role | `--color-text-` | on canvas | on `#fff` | `--color-fill-` | `--color-on-` | `--color-bg-` | `--color-border-` |
|---|---|---|---|---|---|---|---|
| interactive | `emerald-800` | 7.35:1 | 7.61:1 | `emerald-700` | `#fff` | `emerald-500 / 8%` | `emerald-500 / 20%` |
| danger | `red-700` | 6.21:1 | 6.42:1 | `red-700` | `#fff` | `red-500 / 8%` | `red-500 / 20%` |
| warning | `amber-800` | 6.84:1 | 7.09:1 | `amber-500` | `olive-950` | `amber-500 / 10%` | `amber-500 / 25%` |
| success | `emerald-800` | 7.35:1 | 7.61:1 | `emerald-700` | `#fff` | `emerald-500 / 8%` | `emerald-500 / 20%` |
| agent | `violet-700` | 7.04:1 | 7.30:1 | `violet-600` | `#fff` | `violet-500 / 8%` | `violet-500 / 20%` |
| info | `sky-800` | 7.25:1 | 7.51:1 | `sky-700` | `#fff` | `sky-500 / 8%` | `sky-500 / 20%` |

All six clear 4.5:1 on canvas. **Danger (`red-700`) is the tightest role at 6.21:1.** Text and fill now differ for four roles: fills stay at 600–700 because white text must clear 4.5:1 on them, while text sits in the L 43–51 band (§0 rule 4). Interactive and success held the tightest place at 5.19:1 until 2026-10-09, and warning at 4.88:1 before that. Do not darken the light canvas below `olive-50` without re-measuring it first.

**Canvas is the best case.** Role text also sits on its own tint (every `StatusBadge`), on hovered rows, on a selected row, and on `--color-surface`. `apps/storybook/tests/contrast.spec.ts` measures all six roles on each of those grounds, in both modes. Pairs measured under 4.5:1 there and not yet decided are listed in the test as known shortfalls; see §10.

**Light-mode warning text is `amber-800`, not `amber-700` — decided 2026-10-08.** 6.84:1 on canvas, 7.09:1 on `#fff`. *As first shipped this broke §0 rule 4, which then read "light from 600–700"; nobody flagged it at the time. Since 2026-10-09 the rule is a lightness band, L 43–51, and `amber-800` (L 47.3) sits inside it.*

*Why.* 4.88:1 is measured on the bare canvas, and warning text rarely sits there. It sits in table rows and on its own tint. Measured as axe computes it, with 8-bit sRGB composites:

| Ground | `amber-700` text | `amber-700` badge (+ 10% tint) | `amber-800` text | `amber-800` badge |
|---|---|---|---|---|
| canvas | 4.86 | **4.49** | 6.84 | 6.33 |
| `#fff` surface | 5.03 | 4.66 | 7.09 | 6.57 |
| row, hover (`--color-bg-hover`) | **4.29** | **4.03** | 6.05 | 5.68 |
| row, selected (`--color-bg-interactive`) | 4.51 | **4.21** | 6.36 | 5.93 |
| row, selected + hover | **3.98** | **3.74** | 5.61 | 5.27 |

So every `needs-review` and `stale` badge failed AA in light mode (4.49:1, found 2026-10-08 by the first light-mode axe run), and plain warning text fails on any hovered row. A lighter tint cannot fix it: dropping the tint to 8%, the other roles' value, gives 4.56:1 on canvas and still fails on every row state, because `amber-700` alone fails there. The text colour is the fix. `amber-800` is the next Tailwind step, and the only one: there is no step between, and `orange` would be a sixth hue.

*The cost.* Distance from danger (`red-700`), measured as in §1:

| Pair | Typical | Protan | Deutan | Tritan |
|---|---|---|---|---|
| red-700 vs amber-700 (before) | 8.7 | 9.4 | 4.3 | 4.5 |
| red-700 vs amber-800 | 9.5 | **1.9** | 4.4 | 9.6 |
| amber-800 vs emerald-700 | 21.5 | 13.9 | 8.2 | 25.9 |

For protanopes, light-mode warning and danger text become nearly the same colour, against 9.4 today. Typical vision and tritanopia improve. §1 already makes colour never the only signal: `StatusBadge` pairs each state with its own icon and label (Warning triangle and "NEEDS REVIEW", XCircle and "FAILED"), and §10's grayscale check enforces it. A warning carried by text colour *alone* would now be invisible to protanopes as distinct from danger. That was already true for deuteranopes (4.3).

*Unchanged by this decision.* Dark mode (then `amber-600`, 6.14:1; it moved to `amber-500` on 2026-10-09, §2). `--color-fill-warning` (`amber-500`) and `--color-on-warning`. The tint stays at 10%: at 8% its visibility against the canvas drops from 1.08:1 to 1.06:1, the faintest of the six roles.

**Danger is `red-700`, not `red-600` — decided 2026-10-08.** Beside an emerald accent, `red-600` overpowered every other hue on the light canvas. That was not a hue problem but a lightness and chroma one: `red-600` sits at L 57.7 and chroma 0.245 against `emerald-700`'s L 50.8 and 0.118, so it was both lighter and twice as saturated. `red-700` (L 50.5, chroma 0.213) matches emerald's lightness almost exactly and narrows the chroma gap. Tailwind's reds at equal lightness are always about twice as chromatic as its greens, so the gap cannot close fully without leaving Tailwind's ramps. Contrast rose as a side effect: text 4.61 → 6.21:1, fill 4.76 → 6.42:1. **Rejected alternatives:** `rose` is *more* chromatic than red (`rose-600` is 0.253), skews pink, and fails as light text at 4.36:1; `red-500` is lighter and fails both as text (3.69:1) and under white (3.82:1). **The cost:** danger moves closer to warning in light text (ΔE 10.2 → 8.7; see §1's table), so the icons on both states carry more of the load. Dark-mode text stays `red-400`, which already matches `emerald-500` (L 70.4 vs 69.6). The fill is `red-700` in both modes, because fills are mode-independent.

**Since 2026-10-09 emerald text is `emerald-800` (L 43.2),** and the lightness match above holds for fills, not text. `red-700` (L 50.5) is now the lightest light-mode role, the light edge of the band, and the side-by-side showed it a little brighter beside the darker greens. It was kept: `red-800` (L 44.4) would match, but against `amber-800` it narrows typical distance 9.5 → 7.0, deutan 4.4 → 2.7 and tritan 9.6 → 3.5, while widening only protan (1.9 → 7.0). Re-check that "FAILED" does not read louder than "PASSED" whenever the light palette moves.

Note `emerald-600` (3.54:1), `sky-600` (3.88:1) and `amber-600` (3.19:1 on `#fff`, worse on canvas) **fail** as light-mode text. The 700 steps pass on the canvas but not on a role's own tint over a hovered row, which is why the band (§0 rule 4) puts light text at 700–800.

### A. §6 — Chart ramp (Tailwind literals)

#### 6. Chart ramp

Governed separately from UI state color. Categorical series **exclude `red` and `emerald`** so financial polarity stays unambiguous inside plots.

Ordered by maximum hue separation, because most charts carry two or three series.

**These must be written as literal OKLCH values, not as `var(--color-teal-400)`.** §9 strips `blue`, `teal`, `pink`, `cyan` and `fuchsia` to `initial`, so those variables do not exist at the point the chart tokens are declared. The literals are given below so that no implementer has to source a value from outside this document.

##### Dark mode

| # | Step | Literal OKLCH | Hex | Hue | On `olive-950` |
|---|---|---|---|---|---|
| 1 | `blue-400` | `oklch(70.7% 0.165 254.624)` | `#51a2ff` | 254.6 | 7.43:1 |
| 2 | `amber-500` | `oklch(76.9% 0.188 70.08)` | `#fe9a00` | 70.1 | 9.13:1 |
| 3 | `teal-400` | `oklch(77.7% 0.152 181.912)` | `#00d5be` | 181.9 | 10.50:1 |
| 4 | `pink-400` | `oklch(71.8% 0.202 349.761)` | `#fb64b6` | 349.8 | 7.10:1 |
| 5 | `violet-400` | `oklch(70.2% 0.183 293.541)` | `#a684ff` | 293.5 | 6.87:1 |
| 6 | `cyan-400` | `oklch(78.9% 0.154 211.53)` | `#00d3f2` | 211.5 | 10.82:1 |
| 7 | `fuchsia-400` | `oklch(74% 0.238 322.16)` | `#ed6aff` | 322.2 | 7.58:1 |

##### Light mode

| # | Step | Literal OKLCH | Hex | Hue | On `olive-50` |
|---|---|---|---|---|---|
| 1 | `blue-600` | `oklch(54.6% 0.245 262.881)` | `#155dfc` | 262.9 | 5.08:1 |
| 2 | `amber-600` | `oklch(66.6% 0.179 58.318)` | `#e17100` | 58.3 | **3.09:1** |
| 3 | `teal-600` | `oklch(60% 0.118 184.704)` | `#009689` | 184.7 | 3.54:1 |
| 4 | `pink-600` | `oklch(59.2% 0.249 0.584)` | `#e60076` | 0.6 | 4.39:1 |
| 5 | `violet-600` | `oklch(54.1% 0.281 293.009)` | `#7f22fe` | 293.0 | 5.68:1 |
| 6 | `cyan-600` | `oklch(60.9% 0.126 221.723)` | `#0092b8` | 221.7 | 3.48:1 |
| 7 | `fuchsia-600` | `oklch(59.1% 0.293 322.896)` | `#c800de` | 322.9 | 4.50:1 |

Define these as `--color-chart-1` … `--color-chart-7`, not as re-enabled Tailwind hue utilities. That prevents `teal` and `pink` leaking into UI components. §9 uses the same prefix.

**The ramp is capped at seven series — decided 2026-08-02.** `lime` is removed entirely, not darkened. `lime-600` measured 2.93:1 on the `neutral-50` canvas and failed the 3:1 graphical minimum; the alternative was dropping it to `lime-700`, which clears but darkens the series noticeably relative to its neighbours. Seven maximally-separated hues are enough, and **an eighth series is a signal that the chart needs grouping rather than another colour.**

A previous revision claimed all eight passed with a range of 3.06–5.88:1; that range was computed against `#fff`, not the actual canvas, and is withdrawn. The true canvas range across the seven shipped series is **3.09–5.68:1** on `olive-50` (it was 3.06–5.63:1 on `neutral-50`).

Series 2 at 3.09:1 clears by 0.09 and is now the most fragile in the ramp. It sits on the warm-to-yellow side of the wheel, where light-mode contrast is structurally hardest — a property of the hue, not a mistake in the ramp. **Do not add a hue here to replace lime**; the cap is the decision.

**Hue angles shift between modes.** The angles above are per-step, not per-hue. Series 4 moves from 349.8 (dark) to 0.6 (light) and series 2 from 70.1 to 58.3 — both rotate toward red. The "ordered by maximum separation" claim was derived from the dark steps; in light mode series 2 and 4 sit closer to the danger hue than the dark ramp implies. Acceptable inside a plot frame, but do not reuse these angles to justify a hue decision elsewhere.

**Two cautions:**

- Series 2 and 3 (amber, teal) can converge under deuteranopia. Vary lightness across series and use direct labels or distinct dash patterns — never hue alone. (Removing lime took the third member of this cluster out of the ramp, which narrows but does not eliminate the risk.)
- Amber and violet double as warning and agent states. Acceptable inside a plot frame because the context is unambiguous, but avoid amber as series 2 on any chart that also renders threshold-breach markers.

**Sequential and diverging ramps** for heatmaps and variance matrices: build from a single hue's own scale (`sky-100` → `sky-900`) or `red` ↔ `emerald` through `olive-800`. Never build a sequential ramp by walking the categorical list.
