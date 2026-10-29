# Question

Product. One question the agent can't settle alone, with options the person can answer in a word, and two ways out: Skip, and Choose for me.

```tsx
<AgentBlock authorship="AI · Awaiting your answer">
  <Question
    title="Which entities should the variance cover: all of them, or KJP only?"
    options={[
      { id: 'all', label: 'All entities' },
      { id: 'kjp', label: 'KJP only' },
    ]}
    onAnswer={answer}
    outcome={outcome}
  />
</AgentBlock>
```

## A part of an `AgentBlock`, not a `Card`

The agent is the one asking, so the question is agent output, and CLAUDE.md is explicit that agent output is never a generic card. Like `Confirmation`, it draws no rail or label of its own: the `AgentBlock` around it carries both §5 signals, in the turn that asks.

## What it is for, and what not

| Wait | Use |
|---|---|
| A fact or a choice the agent can't work out alone | **Question** |
| Permission for one action before it runs | `Confirmation` |
| A change to the books, which the person reviews and can edit | An `AgentBlock` proposal |

`docs/agent-voice.md` (*Vague and out-of-scope requests*) sets when to ask: one narrowing question that names the options, only when no reading is far more likely. If one is, the agent answers it and says which reading it took, and asks nothing.

## The decision: one press answers

| Options | Shown as | Sent by |
|---|---|---|
| 1 to 4 | `outline` buttons, left-aligned, wrapping | The press itself |
| 5 or more | A `Select` labelled by the question, full width | Answer |
| none, with `text` | A `Field` with an `Input` | Answer, or Enter |

- **Up to four, buttons** (owner, 2026-10-28). An option is an answer that stands on its own, so it is `outline` (§4, *Button groups*), and pressing it is the answer. Nothing stays selected and nothing waits to be sent, so this is not a radio group, which CLAUDE.md rules out.
- **Five or more, a `Select`.** A row of buttons per option stops being "answer in a word", and the `Select` costs one row however long the list (Select's README).
- **`text`** is for a fact the options can't hold. It can sit beside up to four buttons, for anything else. Answer sends the typed text when there is some, and otherwise the `Select`'s pick.

The options are named by the question (`role="group"` with `aria-labelledby`, or the `Select`'s own label), so each is heard as one of its answers.

## Skip and Choose for me

Both are always there: the person can "Answer, skip, or let the agent decide" (tabularui.com's Vocabulary, signed off 2026-10-28). They step back from answering, so they are `ghost` at the trailing edge. When there is a field, Answer is the filled action after them (§4, *Button groups*).

`onAnswer` reports which of four happened, so the agent knows what it got:

```ts
type QuestionAnswer =
  | { kind: 'option'; id: string }
  | { kind: 'text'; text: string }
  | { kind: 'skip' }
  | { kind: 'delegate' }; // Choose for me
```

## Once

- The first answer disables every control. Buttons stay focusable (`focusableWhenDisabled`) and the text field turns read-only, so focus stays where it was, and a double press can't answer twice.
- `outcome`, once set, replaces the controls. If an answer put it there, focus moves to it. A Question that mounts already answered takes no focus.
- To ask again, render a new one (a new `key`).

## Anatomy

| Part | Treatment |
|---|---|
| Title | `<h3>`, `--text-md`, 600, `--color-text-primary`, and the section's name. As in `Confirmation` and `AgentPlan`. |
| Options | `Button size="sm" variant="outline"`, `--gap-inline` apart, wrapping. Or a full-width `Select`. |
| Text | `Field` with `Input`. |
| Ways out | Right-aligned, `size="sm"`: Skip and Choose for me `ghost`, then Answer `default` when there is a field. |
| Outcome | `--text-base`, `--color-text-secondary`, where the controls were. A focus target with `tabIndex={-1}` and no ring. |

Groups are `--gap-group` (12px) apart.

## Copy

- **Title:** one question, sentence case, with its question mark. It names the options: "all of them, or KJP only?" (`docs/agent-voice.md`).
- **Options:** a word or a few, each the whole answer: "All entities", "KJP only". Never "Yes" and "No" to a question that names two things.
- **Fixed strings:** "Skip", "Choose for me", "Answer", and the `Select`'s placeholder, "Choose an answer".
- **Outcome:** what was answered, by whom. "Answered by you: KJP only." For Skip, what the agent does instead: "Skipped by you. I'll cover all entities, and say so in the summary." For Choose for me, what it chose and why: "I chose all entities: KJP alone leaves out the KUS invoices."
- **The block's label** says the state: "AI · Awaiting your answer", then "AI · Answered" or "AI · Skipped".

## Not here

- No radio buttons and no checkboxes. One answer per question; a question that needs several is more than one question.
- No "Other" option that opens a field. Pass `text`, and the field is there from the start.
- No countdown. Nothing is chosen for the person until they press Choose for me.
