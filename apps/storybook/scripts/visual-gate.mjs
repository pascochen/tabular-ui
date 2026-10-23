#!/usr/bin/env node
// Runs the screenshot suite, then sorts what changed into declared and undeclared.
//
//   node scripts/visual-gate.mjs             run `pnpm test:visual`, then sort
//   node scripts/visual-gate.mjs --no-run    sort the last run's report again
//
// A PR declares the story files it expects to change in its description, under a
// "Visual changes" heading (CONTRIBUTING.md, "Visual changes"). When every changed screenshot is in
// a declared file, this step passes and leaves the new images in visual-gate/accept/ for
// ci.yml's "Visual changes" job to commit. Anything else fails, exactly as `pnpm test:visual`
// does on its own, and the `update-visual-baselines` label stays the way to approve it.
//
// Sorting only happens with VISUAL_GATE=pr (same-repo pull requests). Without it the script
// is `pnpm test:visual` and nothing more.
//
// Inputs, all from the environment:
//   PR_BODY          the PR description as it was when the run started
//   PRIOR_COMMENT    this PR's last "Visual changes" comment, if any: it remembers which
//                    files have already needed review here, and a declaration added after
//                    that does not count (a declaration is a prediction, not an approval)
//   OTHER_STEPS_OK   'true' when every earlier Verify step passed; nothing is accepted
//                    otherwise, since the commit made from it is marked as verified
//   RUN_URL          link to this run, for the comment
//
// Outputs, in visual-gate/: result.json, comment.md, accept/*.png, orphans.txt. And
// `gate`, `accept`, `comment` in $GITHUB_OUTPUT.

import { spawnSync } from 'node:child_process';
import {
  appendFileSync,
  copyFileSync,
  existsSync,
  globSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// The stories live in the library, beside their components.
const ui = resolve(root, '../../packages/ui');
const snapshotDir = resolve(root, 'tests/visual.spec.ts-snapshots');
const resultsFile = resolve(root, 'visual-results/results.json');
const outDir = resolve(root, 'visual-gate');

export const COMMENT_MARKER = '<!-- tui-visual-changes -->';
const STATE_PREFIX = '<!-- tui-visual-changes:state ';
const themes = ['dark', 'light'];

// ---------------------------------------------------------------------------
// Story files. A key is the path under packages/ui/src/ without `.stories.tsx`,
// which is also how tests/visual.spec.ts titles its tests: `<key> · <theme>`.
// ---------------------------------------------------------------------------
export function storyKeys() {
  return globSync('src/**/*.stories.tsx', { cwd: ui })
    .map((f) => f.replace(/^src\//, '').replace(/\.stories\.tsx$/, ''))
    .sort();
}

const label = (key) => basename(key);

// ---------------------------------------------------------------------------
// Declarations: bullets under a "Visual changes" heading, up to the next heading.
//
//   ## Visual changes
//   - Dialog
//   - `foundational/Menu`: spaced menus, light mode
//
// The first word of a bullet names a story file: its name, its folder, or its path. The
// rest is a note. "None" declares nothing. HTML comments (the template's hints) are ignored.
// ---------------------------------------------------------------------------
export function parseDeclarations(body) {
  const lines = (body ?? '').replace(/<!--[\s\S]*?-->/g, '').split(/\r?\n/);
  const start = lines.findIndex((l) => /^\s{0,3}#{1,6}\s+visual changes\s*#*\s*$/i.test(l));
  if (start === -1) return [];
  const names = [];
  for (const line of lines.slice(start + 1)) {
    if (/^\s{0,3}#{1,6}\s/.test(line)) break;
    const bullet = line.match(/^\s*[-*+]\s+`?([\w./-]+)`?/);
    if (bullet && bullet[1].toLowerCase() !== 'none') names.push(bullet[1]);
  }
  return [...new Set(names)];
}

// `Dialog`, `foundational/Dialog`, `src/components/foundational/Dialog/Dialog.stories.tsx`
// and the same path under `packages/ui/`
// all name the same file. A name that matches more than one file matches none.
export function resolveDeclarations(names, keys) {
  const files = new Set();
  const unknown = [];
  for (const name of names) {
    const n = name.replace(/^\.?\/?(packages\/ui\/)?src\//, '').replace(/\.stories\.tsx$/, '');
    const hits = keys.filter((k) => [k, dirname(k)].some((p) => p === n || p.endsWith(`/${n}`)));
    if (hits.length === 1) files.add(hits[0]);
    else unknown.push(name);
  }
  return { files, unknown };
}

export function priorState(comment) {
  const at = (comment ?? '').lastIndexOf(STATE_PREFIX);
  if (at === -1) return { needsReview: [] };
  try {
    const json = comment.slice(at + STATE_PREFIX.length, comment.indexOf(' -->', at));
    const state = JSON.parse(json);
    return {
      needsReview: Array.isArray(state.needsReview) ? state.needsReview.filter((k) => typeof k === 'string') : [],
    };
  } catch {
    return { needsReview: [] };
  }
}

// ---------------------------------------------------------------------------
// Playwright's JSON report → one entry per test (story file × theme).
//
// A screenshot that differs attaches `<name>-actual.png` and `<name>-expected.png`, and the
// expected attachment's path is the baseline file itself. CI retries a failed test once
// (playwright.config.ts), so a real change is rendered twice: the two renders must be
// byte-identical, or the story is not deterministic and no image of it can be a baseline.
//
// A screenshot with no baseline (a new story) attaches nothing under CI's
// `updateSnapshots: 'none'`; its error names the baseline path. Those are rendered in a
// second pass (see `renderMissing`).
// ---------------------------------------------------------------------------
const stripAnsi = (s) => s.replace(/\x1b\[[0-9;]*m/g, '');
const errorText = (e) => stripAnsi(e.message ?? e.value ?? '');
const missingPath = (e) => errorText(e).match(/A snapshot doesn't exist at (.+?\.png)/)?.[1];
const isMismatch = (e) => /toHaveScreenshot/.test(errorText(e)) && !missingPath(e);
const shotName = (baseline) => basename(baseline).replace(/-[a-z]+-[a-z0-9]+\.png$/, '');

function tests(report) {
  const out = [];
  const walk = (suite) => {
    for (const spec of suite.specs ?? []) for (const t of spec.tests) out.push({ title: spec.title, ...t });
    for (const child of suite.suites ?? []) walk(child);
  };
  for (const s of report.suites ?? []) walk(s);
  return out;
}

function screenshotsOf(result) {
  const byName = new Map();
  for (const a of result.attachments ?? []) {
    const m = a.name.match(/^(.*)-(actual|expected)\.png$/);
    if (!m || !a.path) continue;
    byName.set(m[1], { ...byName.get(m[1]), [m[2]]: a.path });
  }
  return byName;
}

export function classifyTest(t) {
  if (t.status !== 'unexpected') return { state: t.status === 'flaky' ? 'flaky' : 'ok' };
  const attempts = t.results.filter((r) => r.status !== 'skipped');
  const firstError = (r) => (errorText(r.errors?.[0] ?? r.error ?? {}).split('\n')[0] ?? '').trim();
  const missing = attempts.map((r) => (r.errors ?? []).map(missingPath).filter(Boolean).sort());
  for (const [i, r] of attempts.entries()) {
    const errors = r.errors ?? [];
    const mismatches = errors.filter(isMismatch).length;
    if (
      errors.length === 0 ||
      mismatches + missing[i].length !== errors.length ||
      mismatches !== screenshotsOf(r).size
    ) {
      return { state: 'error', detail: firstError(r) || r.status };
    }
  }
  const [first, ...rest] = attempts.map(screenshotsOf);
  for (const [i, other] of rest.entries()) {
    if (other.size !== first.size || missing[i + 1].join() !== missing[0].join()) return { state: 'unstable' };
    for (const [name, { actual }] of first) {
      const twin = other.get(name)?.actual;
      if (!twin || !readFileSync(actual).equals(readFileSync(twin))) return { state: 'unstable' };
    }
  }
  return {
    state: 'changed',
    screenshots: [
      ...[...first].map(([name, { actual, expected }]) => ({ name, actual, baseline: expected })),
      ...missing[0].map((baseline) => ({ name: shotName(baseline), actual: null, baseline })),
    ],
  };
}

// Baselines whose story no longer exists. Committed with an accepted change so a removed
// or renamed story leaves nothing behind (the label workflow regenerates everything instead).
function orphans(platformSuffix) {
  const index = resolve(root, 'storybook-static/index.json');
  if (!existsSync(index)) return [];
  const ids = Object.values(JSON.parse(readFileSync(index, 'utf8')).entries)
    .filter((e) => e.type === 'story')
    .map((e) => e.id);
  const live = new Set(ids.flatMap((id) => themes.map((t) => `${id}--${t}${platformSuffix}`)));
  return readdirSync(snapshotDir).filter((f) => f.endsWith(platformSuffix) && !live.has(f));
}

// ---------------------------------------------------------------------------
// The decision.
// ---------------------------------------------------------------------------
export function decide({ report, keys, body, prior, otherStepsOk }) {
  const { files: declared, unknown } = resolveDeclarations(parseDeclarations(body), keys);
  const known = new Set(priorState(prior).needsReview);
  const perFile = new Map();
  for (const t of tests(report)) {
    const m = t.title.match(/^(.*) · (dark|light)$/);
    if (!m) continue;
    const [, key, theme] = m;
    perFile.set(key, { ...perFile.get(key), [theme]: classifyTest(t) });
  }

  const accepted = [];
  const review = [];
  for (const [key, byTheme] of perFile) {
    const results = themes.map((th) => byTheme[th]).filter(Boolean);
    const states = results.map((r) => r.state);
    if (states.every((s) => s === 'ok' || s === 'flaky')) continue;
    const errored = results.find((r) => r.state === 'error');
    const changedThemes = themes.filter((th) => byTheme[th]?.state === 'changed');
    if (errored) review.push({ key, why: 'error', detail: errored.detail });
    else if (states.includes('unstable')) review.push({ key, why: 'unstable' });
    else if (!declared.has(key)) review.push({ key, why: 'undeclared', themes: changedThemes });
    else if (known.has(key)) review.push({ key, why: 'late', themes: changedThemes });
    else
      accepted.push({
        key,
        themes: changedThemes,
        screenshots: changedThemes.flatMap((th) => byTheme[th].screenshots),
      });
  }

  const predicted = [...declared].filter(
    (key) => perFile.has(key) && themes.every((th) => ['ok', 'flaky'].includes(perFile.get(key)[th]?.state)),
  );
  const reportErrors = (report.errors ?? []).map((e) => stripAnsi(e.message ?? '').split('\n')[0]);
  const pass = review.length === 0 && reportErrors.length === 0;
  const needsReview = [
    ...new Set([...known, ...review.filter((r) => r.why === 'undeclared').map((r) => r.key)]),
  ].sort();
  return {
    pass,
    accept: pass && accepted.length > 0 && otherStepsOk,
    declared: [...declared],
    unknown,
    accepted,
    predicted,
    review,
    reportErrors,
    otherStepsOk,
    needsReview,
  };
}

// ---------------------------------------------------------------------------
// The PR comment. ci.yml's "Visual changes" job replaces the ACCEPT_OUTCOME line with what
// happened to the commit, and posts it, editing the previous one in place.
// ---------------------------------------------------------------------------
const count = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
const why = {
  undeclared: 'Changed, and not declared',
  late: 'Declared only after an earlier run on this PR had shown it changing',
  unstable: 'Renders differently each time: the two screenshots of one run differ',
  error: 'Did not finish',
};

export function renderComment(d, runUrl) {
  const out = [COMMENT_MARKER, '### Visual changes', ''];
  if (d.accepted.length) {
    const rows = d.accepted.map((a) => {
      const n = (th) => a.screenshots.filter((s) => s.name.endsWith(`--${th}`)).length;
      return `| ${label(a.key)} | ${n('dark') || '–'} | ${n('light') || '–'} |`;
    });
    const heading = d.accept
      ? `**Accepted: ${count(d.accepted.length, 'declared story file')} changed.**`
      : `**Declared and changed, not accepted:** ${
          d.pass
            ? 'Verify failed in an earlier step. These are accepted on a run where everything else passes.'
            : 'nothing is accepted while anything below needs your review.'
        }`;
    out.push(heading, '', '| Story file | Dark | Light |', '|---|---|---|', ...rows, '');
    if (d.accept) out.push('ACCEPT_OUTCOME', '');
  }
  if (d.review.length || d.reportErrors.length) {
    out.push(
      `**Needs your review.** Verify failed. Open \`visual-diff-report\` from [the run](${runUrl}): each changed story shows expected, actual and a diff. If the change is intended, add the \`update-visual-baselines\` label.`,
      '',
      '| Story file | Why |',
      '|---|---|',
      ...d.review.map(
        (r) =>
          `| ${label(r.key)} | ${why[r.why]}${r.themes?.length ? ` (${r.themes.join(', ')})` : ''}${r.detail ? `: ${r.detail.replace(/\|/g, '\\|')}` : ''} |`,
      ),
      ...d.reportErrors.map((e) => `| (whole run) | ${e.replace(/\|/g, '\\|')} |`),
      '',
    );
  }
  if (d.predicted.length) {
    out.push(
      '**Declared, no change.** Every screenshot of these matched. If the change should show, no story shows it yet:',
      '',
      ...d.predicted.map((k) => `- ${label(k)}`),
      '',
    );
  }
  if (d.unknown.length) {
    out.push(
      '**Not a story file.** These declared names match no story file (or more than one):',
      '',
      ...d.unknown.map((n) => `- \`${n}\``),
      '',
    );
  }
  if (!d.declared.length && !d.unknown.length && !d.review.length && !d.reportErrors.length) {
    out.push('Every screenshot matched, and nothing was declared.', '');
  }
  out.push(
    `<sub>Declarations come from this PR's "Visual changes" section as it was when [this run](${runUrl}) started; a change to it applies from the next push. Once a file has needed your review on this PR, later changes to it need the label too. CONTRIBUTING.md, "Visual changes".</sub>`,
    `${STATE_PREFIX}${JSON.stringify({ needsReview: d.needsReview })} -->`,
  );
  return out.join('\n');
}

// A new story's screenshot is rendered by a second, narrow pass over just the tests that
// lack one, writing missing baselines. The changed images already accepted are put in
// place first, so they are checked again too. Playwright turns retries off while it writes
// baselines, so each test runs twice, one after the other: the first run writes the
// baseline (and fails, as a missing baseline always does), and the second must match it.
// No passing run means the story does not render the same twice.
function renderMissing(accepted) {
  const missingIn = (a, th) => a.screenshots.some((s) => !s.actual && s.name.endsWith(`--${th}`));
  const titles = accepted.flatMap((a) => themes.filter((th) => missingIn(a, th)).map((th) => `${a.key} · ${th}`));
  if (!titles.length) return [];
  const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const file = resolve(root, 'visual-results/missing.json');
  rmSync(file, { force: true });
  console.log(`\nvisual-gate: rendering new screenshots for ${titles.join(', ')}`);
  spawnSync(
    'pnpm',
    [
      'test:visual',
      '--update-snapshots=missing',
      '--repeat-each=2',
      '--workers=1',
      '--reporter=json',
      `--grep=${titles.map(escape).join('|')}`,
    ],
    { cwd: root, stdio: 'inherit', env: { ...process.env, PLAYWRIGHT_JSON_OUTPUT_FILE: file } },
  );
  const results = existsSync(file) ? tests(JSON.parse(readFileSync(file, 'utf8'))) : [];
  return titles.filter((title) => !results.some((t) => t.title === title && ['expected', 'flaky'].includes(t.status)));
}

// ---------------------------------------------------------------------------
// Main.
// ---------------------------------------------------------------------------
function output(name, value) {
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`);
}

function main() {
  let code = 0;
  if (!process.argv.includes('--no-run')) {
    rmSync(resultsFile, { force: true });
    const run = spawnSync('pnpm', ['test:visual', ...process.argv.slice(2)], { cwd: root, stdio: 'inherit' });
    code = run.status ?? 1;
  }
  if (process.env.VISUAL_GATE !== 'pr') process.exit(code);
  if (!existsSync(resultsFile)) {
    console.error('visual-gate: no JSON report, so nothing to sort. Failing as the suite did.');
    process.exit(code || 1);
  }

  const report = JSON.parse(readFileSync(resultsFile, 'utf8'));
  const d = decide({
    report,
    keys: storyKeys(),
    body: process.env.PR_BODY,
    prior: process.env.PRIOR_COMMENT,
    otherStepsOk: process.env.OTHER_STEPS_OK === 'true',
  });
  // The suite failing with nothing this script can account for (a crash before any test
  // ran, a webServer that never came up) is never a pass.
  if (code !== 0 && d.pass && d.accepted.length === 0) d.pass = d.accept = false;

  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(resolve(outDir, 'accept'), { recursive: true });
  const shots = d.accepted.flatMap((a) => a.screenshots);
  if (d.accept) {
    for (const s of shots.filter((s) => s.actual)) {
      copyFileSync(s.actual, resolve(outDir, 'accept', basename(s.baseline)));
      copyFileSync(s.actual, s.baseline);
    }
    const unstable = renderMissing(d.accepted);
    if (unstable.length) {
      d.accept = d.pass = false;
      const keys = new Set(unstable.map((title) => title.replace(/ · (dark|light)$/, '')));
      d.review.push(...[...keys].map((key) => ({ key, why: 'unstable' })));
    } else {
      for (const s of shots.filter((s) => !s.actual)) {
        copyFileSync(s.baseline, resolve(outDir, 'accept', basename(s.baseline)));
      }
      const suffix = (basename(shots[0].baseline).match(/-[a-z]+-[a-z0-9]+\.png$/) ?? [''])[0];
      writeFileSync(resolve(outDir, 'orphans.txt'), suffix ? orphans(suffix).join('\n') : '');
    }
  }
  const comment = renderComment(d, process.env.RUN_URL ?? '');
  writeFileSync(resolve(outDir, 'comment.md'), comment);
  writeFileSync(resolve(outDir, 'result.json'), JSON.stringify(d, null, 2));
  if (process.env.GITHUB_STEP_SUMMARY)
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, comment.replace('ACCEPT_OUTCOME', ''));

  const noteworthy = d.declared.length > 0 || d.unknown.length > 0 || !d.pass;
  output('gate', 'true');
  output('accept', String(d.accept));
  output('comment', String(noteworthy));

  console.log(
    `\nvisual-gate: ${d.pass ? 'pass' : 'FAIL'}. Declared ${d.declared.length}, declared changes ${d.accepted.length} ` +
      `(${shots.length} screenshots${d.accept ? '' : ', not committed'}), needs review ${d.review.length}, ` +
      `predicted with no change ${d.predicted.length}, unknown names ${d.unknown.length}.`,
  );
  process.exit(d.pass ? 0 : 1);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
