#!/bin/bash
# SessionStart hook: makes `pnpm lint`, `pnpm build` and `pnpm test` work in a
# Claude Code cloud session. Does nothing on a local machine. See tools.md.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

# Exactly what pnpm-lock.yaml pins, never rewriting it, as CI does.
pnpm install --frozen-lockfile >&2

# The container's preinstalled Chromium does not match the pinned Playwright, so
# install the revision this branch pins. About 1s when it is already present.
# Needs cdn.playwright.dev in the environment's allowed domains.
pnpm --filter tabular-ui-storybook exec playwright install chromium --no-progress >&2

echo "SessionStart hook: dependencies and the pinned Chromium are installed."
