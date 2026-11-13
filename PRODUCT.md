# Product

This file says who Tabular UI is for and what it holds to. Where it and another file disagree, `docs/agent-voice.md` wins on voice, `docs/design-system.md` on design rules, and `packages/ui/src/styles/theme.css` on values.

## Register

product

## Users

Two audiences, in this order.

**Builders.** Designers and engineers making software where an AI agent does work a person has to sign off on: finance, data, operations. They install components through the shadcn registry and read the docs and Storybook to decide whether the library fits. They know React, Tailwind and shadcn. They judge a component by its edge cases: the failed tool call, the file still uploading, the question nobody answered.

**Reviewers.** The people those apps serve: experts checking agent output before it reaches a ledger, a report or a customer. In the demo, that's Kasane's Group Controller. They read fast, know the domain better than the agent, and answer for what they approve. The agent components exist to make their review faster and their approval deserved.

## Product Purpose

Tabular UI is a design system for the human in the loop. Its agent components show how an agent reasoned, what it proposes, and what a person approved, across the five moments of a run: asking, thinking, showing, waiting, recording. The rest of the library is the dense finance and ops tooling around them: tables, run logs, metric tiles, lineage.

It's built on shadcn/ui with Base UI primitives and distributed through a shadcn registry from a public, MIT-licensed repo. Its agent components were benchmarked against AI Elements and depart from it on purpose in places.

Kasane, a fictional printer maker, is the demo company. Its generated data drives the stories, site and demo. No component imports it, and it isn't in the package build.

Success looks like this: a reviewer can trace any figure to the entry behind it, sees what an action changes and who it reaches before it runs, and never mistakes a proposal for something already done. A builder drops in a component and gets those guarantees without designing them.

## Brand Personality

Plain, level, exact. These words set the voice. The look comes from the references below.

Inside its own block, the agent says "I". Status labels have no subject. The agent writes in American English, with no reassurance and no hype. Warmth means respect: it says what failed and what happens next. "Couldn't read the columns in `bank_export_kjp_2026-09.csv`: it has no header row." "I'll take both payments as the invoice file records them." One answer per string, so the same situation always reads the same way.

## References

- Dieter Rams's product work: every control says what it does.
- Risograph-printed matter: flat ink, few colors, honest about how it was made.
- Accounting statements and ledgers: aligned figures, totals that open down to their entries, nothing unaccounted for.

## Anti-references

- Chatbots that hide the work behind a typing indicator and a confident paragraph.
- Confidence percentages, scores or meters. They look precise, aren't, and invite gaming.
- Error styling for uncertainty. Not knowing is a caution, not an error.
- "AI magic": sparkle icons, gradient glows, "Let me help you with that!"
- An agent that reports "done" before the action ran.
- Approval dialogs that ask "Are you sure?" without saying what changes.
- Dashboards that open on KPI tiles instead of what needs a decision.
- Component sites that demo with lorem ipsum or toy data.

## Design Principles

**Show the work.** Reasoning, plan, file reads and sources stay inspectable. Every figure names what it rests on, and every answer says what wasn't checked.

**Every number opens down to the entry behind it.** A figure nobody can trace is a figure nobody can sign.

**Stop before it counts.** Anything that posts, sends or changes records waits for a person. The gate says exactly what changes and who it reaches.

**Report what happened, not what was meant to.** An action says it's done only after it ran. A failure says what failed, why if known, and what happens next.

**Status labels name the state.** A role tag may say who, as AI. No status label has a subject.

**Confidence comes from scope, not a score.** No percentages. Each answer says what it rests on and what wasn't checked. An unchecked figure is flagged as a caution, never as an error.

**Nothing moves while you read.** Answers grow in place. Thinking stays folded until opened. A failed run opens its error where it happened, so the reader keeps their spot.

## Accessibility & Inclusion

Accessibility is a lens on the agent loop, not an addendum to it.

- Status never relies on color alone. Every status carries a word.
- Streaming and in-place growth are announced to screen readers without flooding them.
- Every question, confirmation and approval gate can be reached and answered by keyboard.
- Replay and streaming animations respect reduced-motion settings.
- Target: WCAG 2.2 AA.
- English only for now. Fixed strings are in each component's source.

## Site and demo

These apply to tabularui.com and the Kasane demo, not to the library's stories.

- Demos run on data that's wrong somewhere. Review UI only proves itself on data that contains contradictions.
- shadcn/ui documentation is the baseline builders expect for install, API and examples. Storybook holds the API, and the site links to it.
