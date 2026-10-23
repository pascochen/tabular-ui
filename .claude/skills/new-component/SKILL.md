---
name: new-component
description: Add a component to the Tabular UI design system. Use when the user asks to build, create, or add a component, a table, badge, chip, tile, dialog, form control, or any UI element; when a screen needs something that does not exist yet; or when the user asks how to add a component to Tabular UI.
---

# New component

The ordered procedure for adding a component to `tabular-ui`. Steps get skipped or reordered otherwise, and the result is a component nobody can find and nothing can verify.

## Step 1 — Check whether it already exists

```bash
cat docs/components.md
```

Also grep, because the inventory can lag reality:

```bash
ls packages/ui/src/components/foundational packages/ui/src/components/product
```

**If it exists, stop.** Use it, or extend it with a variant. Writing a second `StatusBadge` is in the failure log for a reason.

If something close exists but not exact, prefer adding a variant to the existing component over creating a sibling. Two components that differ by one padding value is how the system fragments.

## Step 2 — Decide the layer. This changes everything downstream.

**Foundational** — a primitive. Button, Input, Checkbox, Tooltip. Generic, no domain knowledge, could ship in any product.

**Product** — a domain composite. DataTable, RunLogRow, AgentBlock. Knows about pipelines, finance, or agents. Built *from* foundational components.

> **If foundational: STOP and ask the user.**
> Adding a foundational component changes the system contract. `CLAUDE.md` requires explicit approval. Do not proceed on your own judgment.

If product: continue without asking. Product components should proliferate — that is what the layer is for.

## Step 3 — Foundational only: install from shadcn

```bash
pnpm dlx shadcn@latest add <component>
```

Pull from `https://ui.shadcn.com/docs/components/base/*`. **Never** `/docs/components/radix/*`. We are on Base UI.

Do not author primitive behavior. Focus trapping, roving tabindex, and ARIA wiring are solved upstream — our work is the token layer.

If shadcn does not have it, that is a signal it may not be foundational. Reconsider step 2 before writing one from scratch.

> **Exception: the components on `CLAUDE.md`'s foundational list are foundational by decision, not by shadcn's catalogue.**
> If the component is on that list, its absence from shadcn is not a signal — build it from `packages/ui/src/components/foundational/controlBase.ts` and the token layer instead. `IconButton` is the worked example: shadcn folds icon-only buttons into `Button`'s `size="icon"`, but ours is separate because it is square, its icon is sized by the grid rather than by adjacent type, and its `aria-label` is mandatory. Those are different contracts, and merging them is how the label silently goes missing.
>
> The heuristic above applies only to components **not** on the list.

## Step 4 — Read the surrounding code first

Before writing anything, open two or three neighbouring components and state out loud what you observe: spacing density, which hues appear, control heights, border usage, how variants are structured.

Match it. Do not invent a new pattern unless asked. This step is in `CLAUDE.md` under Preferences and it is the difference between a component that belongs and one that merely works.

## Step 5 — Build

Location:
- `packages/ui/src/components/foundational/[Name]/`
- `packages/ui/src/components/product/[Name]/`

Files, all three:
```
index.tsx
[Name].stories.tsx
README.md
```

Rules while writing:

- **Semantic tokens first.** `--pad-cell-x` before `p-2`. `--color-text-danger` before `text-vermilion-400`. If no role token fits, use the primitive scale explicitly and say so — three uses of the same fallback means it needs a role token.
- **Never reference a raw hue.** `blue-400` in component code breaks mode switching.
- **Compose from foundational.** Never inline a styled `<button>`, `<input>`, or `<select>`.
- **Every number carries `tabular-nums`.**
- **Font weight ≤ 600.**
- **Focus rings use `outline` with `outline-offset`**, never `box-shadow` — box-shadow gets clipped by `overflow: hidden` on scrolling tables.
- **Density caps:** no spacing above 32px, radius above 8px, control height above 36px. The frame tier (`--pad-frame-*`) is not for new components: only `AppShell`, `EmptyState` and each workspace app's `App.tsx` use it (§7.3).
- **Agent-authored content uses `AgentBlock`**, never a generic card.

Consult `docs/design-system.md` for values. Do not guess a token — look it up.

## Step 6 — Story

Cover, at minimum:
- **Both modes.** Dark is canonical; a light-only story is incomplete.
- **All five semantic roles**, if the component takes a state — interactive, danger, warning, success, agent.
- **The dense case.** For anything appearing in a table, show it in a 28px row with realistic neighbours, not floating on a blank canvas. Density problems are invisible in isolation.
- **Overflow and truncation**, if it holds text. Truncated cells are the norm, not the edge case.

## Step 7 — Register it

Three places, all required:

1. `packages/ui/src/index.ts` — export it. Anything the app consumes goes through the public surface.
2. `docs/components.md` — add the row, with its status.
3. `packages/ui/scripts/build-registry.mjs` — add its one-line description to `descriptions`. The registry build stops without it, and the component is then missing from the shadcn registry.

A component that exists but is not in the inventory will be rebuilt by someone else within a month.

## Step 8 — Verify

```bash
pnpm lint
pnpm build
pnpm storybook
```

Then run the `design-review` skill against the diff.

Report what you could not verify. Do not claim a check you did not run.

## Step 9 — Update the failure log if something went wrong

If you hit a rule you nearly violated, or a spec ambiguity that could mislead the next person, add a line to the **Failure log** in `CLAUDE.md`.

## Ask, don't guess

Stop and ask the user if:

- The component might be foundational (step 2)
- It needs a token that does not exist — adding a token requires approval
- The spec is ambiguous or two sections appear to disagree
- It needs a sixth hue, or a value above the density caps — the answer is no, but the underlying need may be real and worth discussing

A flagged question costs a minute. A wrong assumption baked into a component costs a refactor.
