#!/usr/bin/env bash
# Installs Chromium and the system libraries it needs, for ci.yml and
# visual-baselines.yml.
#
#   bash .github/scripts/install-chromium.sh
#
# `playwright install --with-deps` runs apt, and apt needs Ubuntu's archive:
# azure.archive.ubuntu.com first on a GitHub runner, then archive.ubuntu.com
# and security.ubuntu.com (/etc/apt/apt-mirrors.txt).
#
# On 2026-11-11 the runners' own DNS resolver stopped answering for those
# names, for hours, while it answered for others (packages.microsoft.com
# downloaded in the same step) and while public resolvers answered for all
# three. GitHub's status page showed nothing. apt retried for ten minutes and
# the step failed, on every run.
#
# The first version of this script took the Azure mirror out of apt's list, on
# the reading that one mirror was down. Its first run on a runner showed the
# next name failing the same way: the fault was the resolver, not a mirror.
#
# So: a name the runner cannot resolve is looked up over DNS-over-HTTPS, at a
# resolver reached by IP address so that the lookup needs no DNS itself, and
# pinned in /etc/hosts for this job. The mirrors, and what apt verifies about
# them, are unchanged. If the install still fails, every name is pinned and it
# runs once more. A second failure fails the step: two attempts, never a loop.
set -euo pipefail

HOSTS_FILE="${HOSTS_FILE:-/etc/hosts}"
NAMES=(azure.archive.ubuntu.com archive.ubuntu.com security.ubuntu.com)

install() {
  pnpm --filter tabular-ui-storybook exec playwright install --with-deps chromium
}

resolves() {
  getent hosts "$1" >/dev/null 2>&1
}

# Prints one IPv4 address for a name, from a public resolver reached by IP.
# The answer can end in an address after one or more CNAMEs; type 1 is A.
public_address() {
  local url answer
  for url in "https://1.1.1.1/dns-query?name=$1&type=A" "https://8.8.8.8/resolve?name=$1&type=A"; do
    answer=$(curl -fsS -m 10 -H 'accept: application/dns-json' "$url" 2>/dev/null |
      jq -r '[.Answer[]? | select(.type == 1) | .data][0] // empty' 2>/dev/null) || continue
    if [ -n "$answer" ]; then
      echo "$answer"
      return 0
    fi
  done
  return 1
}

# Pins a name in the hosts file, once. Says so in the run's annotations,
# because a run that needed this is worth knowing about.
pin() {
  local name=$1 address
  grep -q "[[:space:]]$name\$" "$HOSTS_FILE" 2>/dev/null && return 0
  if address=$(public_address "$name"); then
    echo "$address $name" | sudo tee -a "$HOSTS_FILE" >/dev/null
    echo "::warning::Pinned $name to $address in the hosts file for this job."
  else
    echo "::warning::Could not pin $name: no public resolver gave an address for it."
  fi
}

for name in "${NAMES[@]}"; do
  resolves "$name" || pin "$name"
done

if install; then
  exit 0
fi

echo "::warning::Installing Chromium failed. Pinning apt's mirrors and trying once more."
for name in "${NAMES[@]}"; do
  pin "$name"
done
install
