#!/usr/bin/env bash
# Installs Chromium and the system libraries it needs, for ci.yml and
# visual-baselines.yml.
#
#   bash .github/scripts/install-chromium.sh
#
# `playwright install --with-deps` runs apt, and GitHub's Ubuntu runners send
# apt to azure.archive.ubuntu.com first (/etc/apt/apt-mirrors.txt, with
# Ubuntu's own archive listed after it). On 2026-11-11 that name stopped
# resolving on the runners for over an hour. apt kept retrying it and never
# moved on to the next mirror, so the step failed after ten minutes, three
# runs in a row, on a PR that changed two images and a Markdown file. GitHub's
# status page showed nothing.
#
# So: if the Azure mirror does not resolve, it is taken out of the list before
# the install, and apt uses the mirrors left. If the install fails anyway, the
# mirror is taken out (if it is still there) and the install runs once more.
# A second failure fails the step: two attempts, never a loop.
set -euo pipefail

MIRRORS="${APT_MIRRORS:-/etc/apt/apt-mirrors.txt}"
AZURE=azure.archive.ubuntu.com
FALLBACK=http://archive.ubuntu.com/ubuntu/

install() {
  pnpm --filter tabular-ui-storybook exec playwright install --with-deps chromium
}

# Removes the Azure mirror from apt's list. Says so in the run's annotations,
# because a run that needed this is worth knowing about.
drop_azure_mirror() {
  [ -f "$MIRRORS" ] && grep -q "$AZURE" "$MIRRORS" || return 0
  echo "::warning::$AZURE $1. Removed it from $MIRRORS; apt will use the other mirrors."
  sudo sed -i "/$AZURE/d" "$MIRRORS"
  # A list with nothing left in it would leave apt with no mirror at all.
  grep -q '[^[:space:]]' "$MIRRORS" || echo "$FALLBACK" | sudo tee "$MIRRORS" >/dev/null
}

if ! getent hosts "$AZURE" >/dev/null 2>&1; then
  drop_azure_mirror "does not resolve"
fi

if install; then
  exit 0
fi

echo "::warning::Installing Chromium failed. Trying once more."
drop_azure_mirror "was still listed when the install failed"
install
