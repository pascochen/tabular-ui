## What and why

<!-- What changes, and the problem it solves. Link the issue or decision if there is one. -->

## How it was checked

<!-- Delete what doesn't apply. Say what you ran, not what you meant to run. -->

- [ ] `pnpm lint`
- [ ] `pnpm test`
- [ ] `pnpm build`
- [ ] `pnpm test:playwright`

## UI changes

<!-- Delete this section if nothing renders differently. -->

- [ ] Ran the §10 checklist in `docs/design-system.md`
- [ ] Looked at the stories in dark **and** light
- Checks that need a person (side-by-side colour, grayscale, colour blindness), done or not done:

## Visual changes

<!-- Story files whose screenshots this PR should change, one bullet each, by component name (Dialog) or path. Declared changes are committed by CI; anything else fails until the owner adds the `update-visual-baselines` label. Declare before you push: a declaration added after a run showed the change doesn’t count. CONTRIBUTING.md, "Visual changes". -->

- None

## Needs sign-off?

<!-- Tick any that apply; these need the design system owner's OK (CONTRIBUTING.md, "Ask before you…"). -->

- [ ] New or changed **foundational** component
- [ ] New **token**, or `theme.css` edited
- [ ] New **dependency**, or `package.json`, lockfile or CI changed

## Docs

- [ ] Component `README.md`, `docs/components.md` or the spec updated, if this changes them
- [ ] If this fixes a mistake that shipped: an entry in `CLAUDE.md`'s failure log
