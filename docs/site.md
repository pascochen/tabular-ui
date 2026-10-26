# tabularui.com — site spec

**Status: draft, 2026-10-25. Not approved.** Nothing in `apps/site` exists yet, and nothing here is built until the decisions below are settled.

This spec replaces two earlier drafts, the site build prompt and the site patterns doc, which are retired. Every claim here points at a file in this repository or at a frame in the wireframes. Where neither supports a claim, it is marked as a proposal.

---

## Decisions needed

Each decision has a recommendation. The sections below are written as if each recommendation is accepted, and say where a different answer would change them.

### Design

**D1. Status words: the library's, or new ones?** The wireframes use "Needs your review", "Needs your answer", "Thinking…", "Searched 3 files" and "Posted" (Vocabulary, Status words; Components, Status badge). `StatusBadge` ships nine statuses in `packages/ui/src/components/product/StatusBadge/statuses.ts`: queued, running, passed, failed, stale, needs review, agent working, proposed and skipped. Specimens render the real `StatusBadge`, so they will show the library's words, and a Vocabulary page with other words would contradict the specimens on the next page.
*Recommendation:* decide the words in the library first, as their own PR (a library change, so it needs the owner's yes). The Vocabulary page then reads its Use column from `runStatuses`, and can never disagree with the components (§5).

**D2. The before/after pair: drop "Agent mark" and "Person mark".** The Agent block wireframe (`78:595`) heads its two plates "Agent mark" (orchid) and "Person mark" (sage). The library gives no colour to a person, and sage already means success and links (`docs/design-system.md` §1). Those two colours are the wordmark's, which §1 "Brand assets" says nothing may be derived from.
*Recommendation:* the plates differ by state only. The left is the proposal: `AgentBlock` with its orchid rail and its authorship label, "AI · Awaiting review" (`docs/agent-voice.md`). The right is the posted entry, with its status from D1. Neither plate carries a heading naming an actor.

**D3. Grounds: rules only, or dark plates?** The wireframes draw grey section bands and grey specimen plates. In light mode, canvas, surface and raised are all `ledger-50` (§3, "Paper on paper"), so the theme has no second paper tone. A band or plate tint would need a new token, and lint rejects raw ramp names in `apps/`.
- *(a) Rules and borders only (recommended for v1).* Sections are separated by a 1px `--color-border` rule and plates by a 1px frame. This is §0 rule 7, "Borders do the work whitespace does elsewhere", and it needs nothing new.
- *(b) Dark plates.* Each specimen plate sets `data-theme="dark"`. `theme.css` scopes dark mode as `[data-theme='dark']` rather than `:root[…]`, so it works inside a light page, and the components would show in the mode they were designed for (dark-first).

PR 2 builds both on the Home hero for a side-by-side in screenshots, at 1440 and 390, before either spreads.

**D4. Colour mode: light page; both modes on Foundations.** The page itself is light. It does not call `useTheme()`, and `<html data-theme="light">` ships in the prerendered HTML (`tools.md`, "Styling and tokens"). The Color and Typography pages show each sample in both modes side by side, using the same scoping as D3(b). A dark-first system documented only in light would hide the mode the product lives in.

**D5. The hero story, and every figure in it.** None of the wireframes' figures are in the data. There is no ¥184m gap, no ¥121m Tsukuba variance, no account 5900 and no ¥12.6m rebate accrual. September operating profit was ¥819m against a ¥794m budget, ahead rather than behind (`lastMonth` in `packages/ui/src/fixtures/kasane.ts`). The wireframe Lineage tree's "Operating profit, Sep, ¥312m" isn't in the data either. Two stories the data does support:
- *(a) The September cut-off (recommended for the hero and Agent block).* `apps/demo/data/findings.json`, `revenue-cut-off`: invoice INV-KJP-2609-00363, ¥42.7m net, is dated 30 Sep 2026 but was delivered 2 Oct 2026, so the revenue belongs in October. The controller said the cut-off was clean. Question: "Was the September cut-off clean?" The answer cites the two source files the finding names. The proposed entry moves that revenue from 2026-09 to 2026-10. A person posts it.
- *(b) The H1 operating profit gap (recommended for Lineage tree and Agent reasoning).* `kasane.ts`: H1 operating profit was ¥2.2bn against a ¥2.5bn budget, ¥355m under, and `operatingBridge` splits that gap into six named steps. Exchange rates account for ¥317m of it (the two FX steps, summed in code).

  Two figures still need a source:
  - The posted entry's journal number. The site may not invent one. The export script can compute the next number in the KJP October sequence from `manual_journal_entries_fy2026_h1.csv`, in the format `JE-KUK-2608-00055` uses.
  - `money()` in `packages/ui/src/fixtures/format.ts` rounds amounts of ¥10m or more to whole millions, so the invoice shows as "¥43m", not the finding's "¥42.7m". Pick one rule. I'd keep the formatter's.

**D6. The hero rests; it does not autoplay.** The wireframe note says the hero "Plays once on load". The hero is the first screen. If it autoplays, the prerendered page shows the decision frame, then JavaScript rewinds it to frame 1 and plays it: a visible jump on the most-viewed frame of the site. The hero's motion is the visitor's own: pressing Post entry. Specimens lower down play once when they scroll into view (§6).

**D7. Closing band copy.** The wireframe says "See every component in a working dashboard" and "Its September close runs on these components". `demo.tabularui.com` is the onboarding journey: an agent reads Kasane's finance files and reports what it learned and what doesn't add up (`apps/demo/data/discovery.json`, `findings.json`). Neither line is true of it. *Draft:* heading "Watch an agent learn a company's books."; line "Kasane is a fictional printer maker. In the demo, an agent reads its finance files and reports what doesn't add up."; action "Open the demo ↗". To be checked against `docs/agent-voice.md` and the copywriter review.

**D8. A solid nav.** The wireframes' v3 notes call for a floating nav at 80% white. Text over whatever scrolls behind it has no fixed contrast to measure. And a fixed bar that covers a focused element fails WCAG 2.2's 2.4.11 Focus Not Obscured (Minimum), which is AA. *Recommendation:* solid `--color-canvas` with a 1px `--color-border` bottom rule, and `scroll-padding-top` on `<html>` equal to the nav's height, so anchor jumps and keyboard focus land below it.

**D9. Page set.** The wireframes' Foundations tabs are Color, Typography and Constants, with elevation and shape folded into Constants. This spec follows them: there is no Depth page. It adds one page with no wireframe, **Getting started**: the README's install commands need a public page to point to (§3).

### Approvals, collected once

`CLAUDE.md` requires a yes before each of these. They are listed together so one answer covers them.

**A1. Dependencies, all for `apps/site`:**
- The same as `apps/demo/package.json`.
- `react-router` and `@react-router/dev`, for prerendering.
- `@playwright/test`, already used by `apps/storybook`.
- `@axe-core/playwright`, for page-level accessibility checks. Storybook's a11y addon runs on stories, not on pages.

**A2. Configuration:**
- `apps/site/package.json` and the lockfile.
- Root scripts `dev:site` and `build:site`, with `build` extended to build the site.
- `apps/site/vercel.json` (§9).

**A3. Lint (§8):**
- An `eslint.config.js` block for `apps/site/src/**` that lifts the spacing cap to the site's tokens and keeps every other rule.
- Stylelint extended to `apps/site/src/**/*.css`. Today `pnpm lint` runs Stylelint on `packages/ui/src/**/*.css` only, so app CSS, including a raw hex, is not checked.

**A4. CI (§10):** a `site_only` flag in `ci.yml`'s Scope step, and site steps inside the existing `Verify` job.

**A5. Fixture export:** `apps/demo/scripts/export-fixtures.mjs` also writes `apps/site/data/*.json` (§5). It reads the full Kasane dataset, which lives outside the repo, so the owner runs it.

---

## 1. What the site is for

tabularui.com is the public front of Tabular UI for designers and engineers deciding whether to use its agent components. A visitor should leave knowing three things: the three principles, what each of the 15 agent components does (seen working on realistic data), and how to install one.

It is not the reference. Storybook (`storybook.tabularui.com`) holds every component, prop and state, and the site links to it rather than repeating it. It is not a sales page: there is no pricing, no sign-up, and no analytics, cookies or tracking.

**The 15 are a subset.** The library has 44 components: 18 foundational and 26 product (`docs/components.md`). The site presents the 15 that make up an agent run, grouped into five moments, 10 built and 5 to build. The Components page says so in one line and links to Storybook for the rest.

## 2. Sources of truth

| Question | Answered by |
|---|---|
| Colour, type, spacing, radius, elevation values | `packages/ui/src/styles/theme.css` and `palette.css`, through the package |
| Rules and rationale | `CLAUDE.md`, `docs/design-system.md` |
| Copy the agents in specimens say | `docs/agent-voice.md` |
| What a component is and does | `docs/components.md`, its README, Storybook |
| Layout of each page | The wireframes, file `g9GhecaKWExGaobkm59tgo`, page "Main layouts · v3" (`73:324`) |
| Everything the site decides for itself | This spec |

**The wireframes give layout, not values.** They are greyscale, and they predate this spec. Their frame names and notes cite "P" numbers from the retired patterns doc, and their Color page shows placeholders and the wordmark's colours. Ignore both. Where a wireframe and the library disagree on how a component looks, the library wins: the hero's agent block is drawn as a bordered card, and the real `AgentBlock` is a neutral box with an orchid rail. The wireframe says where the specimen goes; the component decides how it looks.

**Never retype a value that exists in the repo.** A site that copies values drifts. The wireframes' Color page, drawn nine days after Riso Ledger shipped and still waiting for "the ramp pass", is the example (§5).

## 3. Routes

Every route is prerendered to static HTML at build time.

| Path | Page | Wireframe |
|---|---|---|
| `/` | Home | `76:23` desktop, `77:96` mobile |
| `/principles` | Principles | `77:230` |
| `/components` | Components | `78:191` |
| `/components/<name>` | One page per **built** component | `78:595` (Agent block) |
| `/vocabulary` | Vocabulary | `79:345` |
| `/foundations/color` | Color | `79:537` |
| `/foundations/typography` | Typography | none; same shell as Color |
| `/foundations/constants` | Constants: spacing tiers, control heights, shape, elevation | none; same shell as Color |
| `/getting-started` | Install, set up the stylesheet, set up the app root | none (D9) |
| `/r/*` | Rewrite to `storybook.tabularui.com/r/*`, the shadcn registry | — |
| anything else | 404 | none |

**`<name>` is the registry item name** in `packages/ui/registry.json`: `agent-block`, `chat-thread` and so on. A component page exists only when the registry has the item, so a to-build component has a card but no page. Previous and next follow run order.

**Foundations is a reference layer**, reached from the nav and footer, never from the Home body (wireframe note on `79:537`). Its three pages share one shell with `Tabs` from the library, linking between routes. Each tab is a real link to a prerendered page.

## 4. Pages

Layout comes from each wireframe frame. This section records what the frames don't: where each part's content comes from, and where the frame changes.

**Shared.** The nav holds the wordmark (`brand/tabular-wordmark.svg`, as an `<img>`, unchanged), then Components, Vocabulary and Foundations; on the right, Storybook ↗, GitHub ↗ and Demo ↗ (primary). It has no search. The footer has columns Guide, Foundations and Try it, the byline "By Pascal Chenier ↗" linking to pascalchenier.com, and a row with the version (from `packages/ui/package.json`), the license (MIT, `LICENSE`) and Changelog ↗ (`packages/ui/CHANGELOG.md` on GitHub). The favicon is `brand/favicon.svg`. A skip link to `<main>` is the first focusable element.

**Home** (`76:23`, `77:96`):
- The hero: heading, lead, two actions, and the live specimen (D5, D6).
- The outline: "3 principles", "5 moments" and "15 components", each jumping to its section or page and moving focus there.
- The 3 principles as cards, each with its Check line and the chips of the components that carry it.
- The 5 moments, each with its built count.
- The closing band (D7).

Counts are computed from the component list (§5), never typed. On mobile the outline moves under the hero's actions.

**Principles** (`77:230`). The three rules, each with its why, its Check line and the components that carry it. A to-build component's chip is dashed, and its label carries the state as text, since the dash alone is a visual signal (§0 rule 1; `docs/design-system.md` §7.8, "Border style"). The wireframe marks the Check lines as drafts; they are owner copy.

**Components** (`78:191`). A title and lead, a filter for All, Built and To build, and a jump index grouped by moment. Then one section per moment, holding a card per component: the specimen in its frame, the name, and the decision line. A to-build card has a dashed frame and the text "Not built yet". "Try each one with data from Kasane, a fictional printer maker" stays in the lead.

**Component page** (`78:595`):
- A jump menu, built with the library's `Menu`.
- The name as `<h1>`, and the decision line.
- The before/after pair in one frame (D2).
- A link to that component's stories in Storybook.
- Previous and next.

The pair is static. It shows two states, not a sequence.

**Vocabulary** (`79:345`):
- The 5 moments, compact.
- "Three ways the agent waits for you": Question, Confirmation and Agent block, each with what the agent needs, what the person can do, and a Kasane example. The wireframe marks these definitions as drafts.
- Status words, as a table. The Use column comes from `runStatuses` (D1). It is not tinted: colour for emphasis is hierarchy (§0 rule 1). It is distinguished by being first and by weight.

**Color** (`79:537`, content replaced). Three sections:
- *Roles:* the six roles of §1 (interactive, danger, warning, success, agent, info), each as text, fill and tint, in both modes (D4). Every swatch paints the real token (`bg-fill-danger`, not a copied value). Each label names the ramp step and its contrast on the canvas, read from `docs/palette.json`.
- *Neutral:* the `ledger` roles of §3, canvas to tertiary text, both modes.
- *Ramps:* all seven ramps from `palette.json`, with `teal` marked as chart-only.

The wireframe's Surface 2, Rule, Text muted, Person mark, Inverse and State swatches are not carried over: their names aren't tokens, and the colours shown are the wordmark's.

**Typography.** Rendered from the tokens: the §8.1 scale with each size's line height, the three families of §8.3, the display boundary (§8.2), and numerals with `tabular-nums` (§8.6). It also states the site's own reading sizes, and that they are site-only (§7).

**Constants.** Rendered from the tokens: the spacing tiers and their caps (§7.3), control heights (§7.6), shape (square corners, `--radius-full` for round marks, §7.7), border widths (§7.8) and elevation (§4, the overlay sheet).

**Getting started.** The README's three steps, quoted from `packages/ui/README.md`: install, set up the stylesheet, set up the app root. Then the registry commands in the URL form the README uses (`pnpm dlx shadcn@latest add https://tabularui.com/r/agent-block.json`), which works without the user configuring anything.

**404.** One line saying the page doesn't exist, and links to Home and Components. Draft copy.

## 5. Content

The site has three kinds of content, and each has one source.

**Read from the repo at build time:**

| Content | Source |
|---|---|
| Ramp steps, hex, OKLCH, contrast on paper and ink | `docs/palette.json` |
| Which step each role takes, per mode | `--tui-*` in `packages/ui/src/styles/theme.css`, parsed for the step name. The swatch itself paints the token. |
| Status words, tones and icons | `runStatuses`, imported from `tabular-ui` |
| Built or to build | Whether `packages/ui/registry.json` has the item |
| Version, license, changelog | `packages/ui/package.json`, `LICENSE`, `CHANGELOG.md` |

**Live:** the specimens, rendering components imported from `tabular-ui` (§6).

**Written:** one content module, `apps/site/src/content.ts`, holds everything the owner writes:
- The principles, each with its why, its Check line and the names of the components that carry it.
- The five moments, each with its one line.
- The 15 components, each with its moment and decision line.
- The Vocabulary definitions.
- Page titles and meta descriptions.

A test fails if a name in it is neither a registry item nor marked as to build.

**Kasane data.** Every figure, ID, file name and date in a specimen comes from data. The site never imports `packages/ui/src/fixtures/kasane.ts`: fixtures are story data and are not in the package's `dist` (`tools.md`, "Package and releases"). `apps/demo/data/*.json` belongs to the demo. Instead, `export-fixtures.mjs` writes `apps/site/data/*.json` with exactly the records the specimens use (A5): the cut-off invoice, the operating bridge, the pack's file names and sizes, and the next journal number. It is the one generator for all three consumers.

A test scans `apps/site/src` for currency figures and long digit runs outside `data/`, so a typed figure fails the build instead of passing silently.

**Formatting** goes through one formatter. Format strings belong in the export, or in a copy of `format.ts`'s rules kept in `apps/site` with a test against the same inputs.

## 6. Specimens

**One player for every live specimen.** A specimen is a list of states, each with a time, rendered with real components. The last state is the **rest frame**: the decision the specimen exists to show.

- **The prerendered HTML is the rest frame.** Visitors without JavaScript, search crawlers, link previews and reduced-motion users all see the decision.
- **A specimen below the first screen plays once** when half of it first enters the viewport, from the first state to the rest frame, and then stops. Nothing loops.
- **5 seconds or less.** A sequence that starts on its own and runs over 5 seconds needs a pause control (WCAG 2.2.2). Under 5 seconds it doesn't, so the cap removes the control instead of adding one.
- **Replay** is a library `Button`, `variant="outline"` `size="sm"`, inside the plate at the bottom right, named for its specimen: "Replay Agent block".
- **Reduced motion:** the rest frame only. Replay jumps to the rest frame.
- **One announcement.** A polite live region announces the final state once ("Posted"), never each step. It empties after it has been read, as `AgentReasoning` does with its own region.
- **No randomness, no network, no AI.** A specimen is a script.

**The hero** (D5, D6) rests on the proposal: the question, the cited answer, and the `AgentBlock` with Post entry, Edit entry and Don't post. Pressing Post entry turns the block to its posted state and writes a run log row beneath it. That is the hero's one sequence, and the visitor starts it. Reset returns it to the proposal.

**What each built specimen shows** (proposals; owner copy and D5's data):

| Component | Shows | Data |
|---|---|---|
| Chat starter | Suggested questions; a pick fills the composer and never sends | Written questions, no figures |
| Chat composer | A file attaching, Send held until it uploads | A file name and size from the pack |
| Agent reasoning | Folded summary; open, it lists the files read | Pack file names; the gap and FX figures |
| Agent plan | A plan's steps, ticking through | Pack file names |
| Lineage tree | H1 operating profit down to the bridge's six steps | `operatingBridge` |
| Attachment row | Three source files, name as link | The pack |
| Agent block | The cut-off entry, proposed | `revenue-cut-off` |
| Chat thread | A question, and the answer growing in place | As Agent reasoning |
| Run log row | The run's steps, one failed and opened | **Open:** the stories use dbt model names, which aren't Kasane data. The export should produce the run's steps from what the agent read. |
| Status badge | Each status in `runStatuses` | The library |

## 7. Site layout and type

The site is a reading page, not dense product UI, so it keeps a few values of its own. **They live in `apps/site`, never in `packages/ui`.** They cover only space and size. Every colour, radius, border, shadow, weight and font comes from the library's tokens.

**Grid** (from the wireframes):
- 12 columns with 24px gutters.
- Page margins of 16px under 768px, 32px from 768px, and 48px from 1200px.
- A 1344px content width.
- A 1040px reading column for Principles and component pages, and 680px prose blocks.
- Cards span 4 columns (432px), the hero splits 5/7, and the five moments are their own 5-up row with 16px gaps.

**Rhythm:** sections are padded 48px under 768px, 64px from 768px and 96px from 1200px, and separated by a full-width 1px `--color-border` rule.

**Tokens.** These are the site's only custom properties. The `--site-` prefix keeps them apart from the library's names, so none can shadow a library token:

```
--site-pad-x        16px · 32px ≥768 · 48px ≥1200
--site-section-y    48px · 64px ≥768 · 96px ≥1200
--site-gap          24px
--site-gap-tight    16px
--site-w-wide       1344px
--site-w-reading    1040px
--site-w-prose      680px
```

**Type.** Headings are serif with no extra work: `theme.css` sets every `<h1>`–`<h6>` in `--font-heading` (§8.3). The library's scale stops at 32px (§8.1), so the site adds reading sizes in `apps/site`, in rem (§0 rule 10):
- Display: 64px desktop, 40px mobile.
- Section heading: 44px and 30px.
- Card title: 20px and 18px.
- Lead: 18px.
- Body: 16px.
- Small: 14px.

Weight never exceeds 600. Each size is declared with its line height. Each is also added to the site's tailwind-merge config, or `cn()` will read it as a colour and drop the text colour (failure log, `text-metric`).

**Inside a specimen, nothing is scaled.** Components render at their own 13px base and 32px control height. A specimen shows the product as it is.

**Mono shows data only:** IDs, file names, tokens and times. Labels are sans.

## 8. Library rules on the site

`eslint.config.js` already applies the full design gate to `apps/*/src/**`, and allows frame spacing only in `apps/*/src/App.tsx`, capped at 64px. The site's 96px section padding fails it, as it should until this spec is approved.

**The change (A3).**
- A block for `apps/site/src/**` lifts only the spacing cap, and only to the `--site-*` tokens.
- It keeps every other rule: raw hues and hex, 900/950 backgrounds, weights over 600, softened corners, shadows, inline styles, hand-made `<button>`, and `tone` not `role`.
- The config warns that a block which redeclares `no-restricted-syntax` must restate every selector, or it loses the rest of the gate. The block is built by spreading the same arrays.
- A probe file run through `eslint --stdin` proves the kept rules still fail in `apps/site`. A regex gate fails open, and silence looks like a pass.
- Stylelint runs on `apps/site/src/**/*.css` with the same rules, and the frame cap is raised only for `--site-*`.

**Never change `packages/ui` to make the site work.** If a component is missing something, stop and raise it: a library change is its own decision.

## 9. Deployment

A third Vercel project, `apps/site`, at `tabularui.com`, with `www.tabularui.com` redirecting to it. The owner creates the project and attaches the domain.

- **Today** `tabularui.com` resolves to Vercel and answers `DEPLOYMENT_NOT_FOUND`. If the domain is still attached to another project, detach it there first.
- **`apps/site/vercel.json`** rewrites `/r/:path*` to `https://storybook.tabularui.com/r/:path*`. It ships in the first deploy. It makes the README's install commands and every `registryDependencies` URL work (`tools.md`, "shadcn registry"); today they return 404.
- **`tools.md`** "Platform / delivery" calls tabularui.com "the owner's private site". The first site PR corrects it to three projects.
- **Preview deployments** sit behind Vercel's login by default. Check `/r/button.json` on a preview in a logged-in browser; a plain `curl` gets 401.

## 10. CI

`Verify` is the one required check. A separate workflow that runs only when certain paths change can't be required, because GitHub waits for it forever on PRs where it doesn't run. So the site runs inside `Verify` (A4):

- **The Scope step** sets `site_only` when every changed file is under `apps/site/` or is Markdown.
- **Site-only PR:** install, lint, type-check, build the site, run the site's Playwright tests. The story tests, visual regression and design system specs are skipped. Target: under 6 minutes, against 25–27 for the full run.
- **Any other PR:** the full run as today, plus the site build. The site consumes the package, so a library change can break it.
- **Off the PR gate:** external link checks and Lighthouse. Both depend on other servers and fail for reasons that aren't the PR. Run them on demand and before a release.

**Site tests run on their own port**, derived from the checkout's path as `apps/storybook/tests/storybook-port.mjs` does. Otherwise a run in one worktree can test another checkout's server (failure log, 2026-10-08).

## 11. Accessibility — WCAG 2.2 AA

Components already pass axe in Storybook in both modes. These checks are what the site adds at page level.

**Automated, on every route at 1440 and 390:**
- No axe violations at the WCAG 2.2 AA tags. An exception needs the owner's approval and a written reason, as `packages/ui/src/fixtures/a11y-exceptions.ts` does.
- One `<h1>`, headings in order, and landmarks: `header`, a labelled `nav`, `main` and `footer`.
- The skip link is the first focusable element. Every page has a unique `<title>` and `lang="en"`.
- At 320px wide the document doesn't scroll sideways. A data table may scroll inside its own container (1.4.10 exempts two-dimensional data).
- Every target is at least 24×24px, or has the spacing 2.5.8 allows. Stacked footer links need checking.
- With reduced motion, no element animates.
- A focused element is never fully hidden under the nav (2.4.11; D8).

**Keyboard and focus (scripted):**
- After a client-side route change, focus moves to the new page's `<h1>` and the new title is announced. React Router does not do this.
- Outline links move focus to their section.
- The jump menu and Foundations tabs are the library's `Menu` and `Tabs`, with their keyboard behaviour.

**Content:**
- Links make sense out of context, and no two links share a name but go to different places.
- ↗ marks a link to another site. The arrow is `aria-hidden`, and the name doesn't depend on it.
- Contrast is measured on the ground the text sits on, including dark plates if D3(b) is chosen.
- To build versus built is carried by text and a dashed border, not tone alone.

**Manual, by the owner:** a VoiceOver pass in Safari on Home, Components and one component page, following a written 10-step script delivered with the final PR.

## 12. Performance and metadata

- **Lighthouse** on Home and Components at mobile settings: Performance and Accessibility both 95 or above.
- **Fonts** come from the package's stylesheet. Preload only the faces the first screen uses: the serif heading and the sans body.
- **Metadata:** a title and description per page, canonical URLs, `sitemap.xml` and `robots.txt`.
- **Social preview:** one shared Open Graph image built from `brand/tabular-wordmark.svg`. Per-page images need a renderer, which is a new dependency, so not in v1.
- **No analytics, cookies or tracking.**

## 13. Order of work

Each step is one PR, ending with the preview URL, screenshots at 1440 and 390 beside the matching frame, the checks run and their results, and anything uncertain.

0. **This spec**, approved, with D1–D9 and A1–A5 answered.
1. **Registry forward and a bare site.** Create `apps/site`, add the rewrite, an empty Home and a deploy, and correct `tools.md`. Done when `/r/button.json` on the preview returns the registry item.
2. **Shell.** Nav, footer, page containers, sections and the specimen frame, plus the `--site-*` tokens, the lint and Stylelint changes with their probe, and Home with static specimens. D3's side-by-side.
3. **Content read from the repo.** Color, Typography, Constants, the Components index and the computed counts, with the content module and its test.
4. **Specimens.** The player, the ten specimens, the hero's Post entry, reduced motion and the live region. Needs A5's data export first.
5. **The rest, and the quality pass.** Principles, the component pages, Vocabulary, Getting started, the 404, §11 and §12 with evidence, and `apps/site/README.md`: how to run it, where data comes from, and how to add a page when a to-build component ships.

The library PR for D1, if chosen, can run in parallel with steps 1–3. It must merge before Vocabulary is built.
