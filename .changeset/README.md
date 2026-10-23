# Changesets

Each change to `packages/ui` that a consumer would notice comes with a changeset: a small Markdown file that names the bump (patch, minor or major) and says what changed, in a sentence a consumer can act on.

```bash
pnpm changeset
```

At release time, `pnpm version-packages` turns the pending changesets into a version number and a `CHANGELOG.md` entry, and `pnpm release` builds and publishes the package. The Storybook and demo apps are private and never versioned.
