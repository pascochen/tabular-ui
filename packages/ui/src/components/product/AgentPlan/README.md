# AgentPlan

Product. A plan the agent proposes: a title, one sentence, numbered steps, then Run plan and Edit.

```tsx
<AgentBlock authorship="AI" meta="14:22">
  <AgentPlan
    title="Rebuild revenue model"
    description="Switch revenue to net_amount and check the monthly totals still reconcile."
    steps={steps}
    status="ready"
    onRun={run}
    onEdit={edit}
  />
</AgentBlock>
```

## A part of an `AgentBlock`, not a `Card`

Like `AgentReasoning`, it draws no rail or authorship label. The `AgentBlock` around it carries both §5 signals. CLAUDE.md is explicit that agent output is never a generic card, which is what AI Elements' Plan is.

## States

| `status` | Steps | After the last step | Actions |
|---|---|---|---|
| `streaming` | those that have arrived | Drafting step N…, with a `Spinner`; after 3s, Drafting step N · 0:07 | disabled |
| `ready` | all | nothing | enabled |

While streaming the section is `aria-busy`, so a screen reader can wait for the finished plan instead of hearing each step as it lands. The drafting row is not a list item: the list holds only real steps. Its elapsed figure (§11.5) starts again with each step, counted from `startedAt` when given, else from when the row appeared, and it is `aria-hidden`.

## Anatomy

| Part | Treatment |
|---|---|
| Title | `<h3>`, `--text-md`, 600, `--color-text-primary`. The panel header above is the `<h2>`. |
| Description | `--text-sm`, `--color-text-secondary`, `--gap-bonded` below the title. Wraps; one sentence is a copy rule, not a truncation. |
| Steps | `<ol role="list">`. The number is an `aria-hidden` span in a 16px column (`w-4`, primitive: no token fits), right-aligned, secondary. Labels are `--text-base` body. `--gap-field` between steps. |
| `label` | A node, so identifiers can be set in `--font-mono` one step smaller (§8.3). |
| Actions | Right-aligned. Edit is `ghost`, Run plan is `default`, both `size="sm"`, matching `AgentBlock`'s Reject / Accept pair. `Button` has no "secondary" variant. |

Groups are `--gap-group` (12px) apart.

## Copy

Follows `docs/agent-voice.md`, whose *Fixed strings* table sets the forms used here: the title is a verb phrase with no period, the description one sentence, each step an imperative with one action, and the buttons are verbs ("Run plan", "Edit"). "Drafting step N…" is the in-progress status form.

## Not here

- No per-step state (running, done, failed). A plan that is executing is a different object; add it when a screen needs it.
- No collapse. AI Elements' Plan collapses its steps; four to ten lines in a 440px panel do not need it.
- No shimmer on the title while streaming (AI Elements). The drafting row carries the state.
