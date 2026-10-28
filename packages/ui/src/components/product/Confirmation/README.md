# Confirmation

Product. Permission for one action before it runs: the action as a question, what it changes and who it reaches, then a button that runs it once and one that stops it.

```tsx
<AgentBlock authorship="AI · Awaiting confirmation">
  <Confirmation
    title="Send the variance summary to the controller?"
    changes="Nothing in the books. One message goes out, with the September summary."
    reaches="The controller, by email. No one else."
    confirmLabel="Send summary"
    stopLabel="Don’t send"
    onConfirm={send}
    onStop={stop}
    outcome={outcome}
  />
</AgentBlock>
```

## A part of an `AgentBlock`, not a `Card`

The agent is the one asking, so the question is agent output, and CLAUDE.md is explicit that agent output is never a generic card. Like `AgentPlan`, it draws no rail or label of its own: the `AgentBlock` around it carries both §5 signals. One block per agent turn, so a Confirmation sits in the turn that asks, beside the text that leads up to it, never in a block of its own.

## What it is for, and what not

| Wait | Use |
|---|---|
| Permission for one action that doesn't post to the books: send, notify, rebuild, export | **Confirmation** |
| A change to the books, which the person reviews and can edit | An `AgentBlock` proposal, with buttons that name the change (Post entry, Edit entry, Don't post) |
| A choice between readings or scopes | Question (planned) |

A posting is never a Confirmation. It needs the entry itself, open to edit, which is what the Agent block proposal shows.

## The decision: you see what it changes and who it reaches

`changes` and `reaches` are **required**. An action whose effects the person can't see is one they approve by habit. Say them even when the answer is nothing: "Nothing in the books." and "No one else." are claims the person relies on. A system counts as a reach when people read it: a rebuild reaches no one directly, but everyone on the dashboards sees new figures (the `ReachesThroughASystem` story).

## Once

The permission covers one run, so there is no "Always allow".

- The first press disables both buttons. They stay focusable (`focusableWhenDisabled`), so the pressed one keeps focus, and a double click or a second press can't run the action again.
- `outcome`, once set, replaces the buttons. If a press put it there, focus moves to it, so focus is never dropped on the page. A Confirmation that mounts already decided takes no focus.
- To ask again, render a new one (a new `key`). The lock doesn't reset itself, because a confirmation that quietly re-arms is one the person never gave.

## Anatomy

| Part | Treatment |
|---|---|
| Title | `<h3>`, `--text-md`, 600, `--color-text-primary`, and the section's name. As in `AgentPlan`. |
| What changes · Who it reaches | A `<dl>`: labels in `--color-text-secondary`, values in `--color-text-body`, both `--text-base`. Two columns, the label column as wide as its longest label, `--gap-group` between them and `--gap-field` between rows. Long values wrap under themselves. |
| Actions | Right-aligned, `size="sm"`: the stop button `ghost`, the action `default`, as `AgentPlan`'s Edit and Run plan. |
| Outcome | `--text-base`, `--color-text-secondary`, where the buttons were. A focus target with `tabIndex={-1}` and no ring, as `AppShell`'s `<main>`. |

Groups are `--gap-group` (12px) apart.

## Copy

`docs/agent-voice.md` sets the forms.

- **Title:** the action as a yes-or-no question, sentence case, with its question mark.
- **Buttons name what happens** (*Fixed strings*): "Send summary" and "Don't send", never a bare "Allow", "Confirm" or "OK". A bare pair reads the same on every confirmation, so it trains the person to press without reading.
- **Outcome:** past tense only once it ran (principle 3): "Sent once, by you. The next send asks again." Stopping is recorded the same way: "Not sent. The summary stays here."
- **The block's label** says the state: "AI · Awaiting confirmation" while it waits, then "AI · Sent" or "AI · Not sent".

The labels "What changes" and "Who it reaches" are fixed by the component.

## Actions only where they exist

Today the agent changes nothing (`docs/agent-voice.md`, *Vague and out-of-scope requests*), so no conversation shows a Confirmation yet. Its stories document it for when that changes, and say so.

## Not here

- No "Always allow" or "Don't ask again". The definition is "Let it run once, or stop it" (tabularui.com's Vocabulary, signed off 2026-10-28).
- No editing. If the person should change what runs, it is a proposal in an `AgentBlock`, not a Confirmation.
- No countdown or auto-run. Nothing runs until a person presses the button.
