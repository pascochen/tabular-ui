// What a pull request's changed files let Verify skip (ci.yml, the Scope step).
//
//   echo "$files" | node .github/scripts/ci-scope.mjs
//
// prints `docs_only=<bool>` and `site_only=<bool>`, one per line, in the form
// $GITHUB_OUTPUT takes.
//
// It is a module so a test can call it: the rule lived inline in ci.yml as two
// greps until 2026-11-10, under a comment saying "no test, build or story reads
// a .md file". By then the site read two kinds of README and a spec read a
// skill, so a Markdown-only PR could pass Verify in a minute and break main.
// apps/storybook/tests/ci-scope.spec.ts checks these lists against the code.

/** Markdown the site reads at build time and in its tests. A change needs the site's build and tests. */
export const READ_BY_SITE = [
  /^packages\/ui\/README\.md$/, // apps/site/src/routes/getting-started.tsx
  /^packages\/ui\/src\/components\/product\/[^/]+\/README\.md$/, // apps/site/src/component-usage.ts
];

/** Markdown the library's specs read. A change needs the full run. */
export const READ_BY_SPECS = [
  /^\.claude\/skills\/design-review\/SKILL\.md$/, // apps/storybook/tests/palette.spec.ts
];

const isMarkdown = (file) => /\.md$/.test(file);
const any = (patterns, file) => patterns.some((pattern) => pattern.test(file));

/**
 * @param {string[]} files Paths changed by the PR, from the repo root.
 * @returns {{ docs_only: boolean, site_only: boolean }}
 *   `docs_only`: every file is Markdown that nothing builds or tests, so
 *   Verify skips everything. `site_only`: every file is in apps/site or is
 *   Markdown the library's specs don't read, so Verify runs lint, type-check,
 *   the site build and the site tests. Neither: the full run. An empty list is
 *   the full run, because a diff that can't be read proves nothing.
 */
export function scope(files) {
  const changed = files.map((file) => file.trim()).filter(Boolean);
  if (changed.length === 0) return { docs_only: false, site_only: false };
  const inert = (file) => isMarkdown(file) && !any(READ_BY_SITE, file) && !any(READ_BY_SPECS, file);
  const docs_only = changed.every(inert);
  const site_only =
    !docs_only &&
    changed.every((file) => file.startsWith('apps/site/') || (isMarkdown(file) && !any(READ_BY_SPECS, file)));
  return { docs_only, site_only };
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  let input = '';
  process.stdin.setEncoding('utf8');
  for await (const chunk of process.stdin) input += chunk;
  const result = scope(input.split('\n'));
  console.log(`docs_only=${result.docs_only}\nsite_only=${result.site_only}`);
}
