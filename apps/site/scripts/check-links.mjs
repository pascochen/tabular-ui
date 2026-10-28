/**
 * Checks every link from the built site to another site (docs/site.md §10):
 * reads each prerendered page in build/client, collects the external hrefs,
 * and requests each one once. Off the PR gate, because it depends on other
 * servers: run it on demand and before a release, after `pnpm build:site`.
 *
 *   node apps/site/scripts/check-links.mjs
 *
 * Internal links and their #fragments are checked on every PR, by
 * tests/quality.spec.ts.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../build/client', import.meta.url));

// Sites that refuse requests that don't come from a browser. A refusal from
// one of them is reported, not failed: open the link by hand.
const blocksScripts = new Set(['www.linkedin.com']);

function pages(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return pages(path);
    return name.endsWith('.html') && !name.startsWith('__') ? [path] : [];
  });
}

const found = new Map();
for (const file of pages(root)) {
  const html = readFileSync(file, 'utf8');
  for (const [, href] of html.matchAll(/<a\b[^>]*\bhref="(https?:\/\/[^"]+)"/g)) {
    const url = href.replaceAll('&amp;', '&');
    if (!found.has(url)) found.set(url, new Set());
    found.get(url).add(`/${relative(root, file)}`.replace(/(index)?\.html$/, ''));
  }
}

async function check(url) {
  for (const method of ['HEAD', 'GET']) {
    try {
      const response = await fetch(url, {
        method,
        redirect: 'follow',
        headers: { 'user-agent': 'tabularui.com link check' },
        signal: AbortSignal.timeout(15_000),
      });
      // Some servers answer HEAD with 404 or 405 but serve GET.
      if (method === 'HEAD' && response.status >= 400) continue;
      return response.status;
    } catch (error) {
      if (method === 'GET') return error.name === 'TimeoutError' ? 'timed out' : error.message;
    }
  }
}

// Storybook answers any ?path= with its app and a 200, so a story that doesn't
// exist still looks fine. Its index.json lists every story and docs page.
let storybookIds;
async function checkStory(url) {
  const id = new URL(url).searchParams.get('path')?.replace(/^\/(docs|story)\//, '');
  if (!id) return check(url);
  storybookIds ??= fetch(new URL('/index.json', url))
    .then((r) => r.json())
    .then((index) => new Set(Object.keys(index.entries)));
  return (await storybookIds).has(id) ? 200 : `no story "${id}"`;
}

let failed = 0;
const results = await Promise.all(
  [...found.keys()].map(async (url) => [
    url,
    new URL(url).host === 'storybook.tabularui.com' ? await checkStory(url) : await check(url),
  ]),
);
for (const [url, status] of results.toSorted(([a], [b]) => a.localeCompare(b))) {
  const ok = typeof status === 'number' && status < 400;
  const blocked = !ok && blocksScripts.has(new URL(url).host);
  if (!ok && !blocked) failed++;
  const mark = ok ? 'ok     ' : blocked ? 'by hand' : 'FAILED ';
  console.log(`${mark} ${status}  ${url}  (${[...found.get(url)].length} pages)`);
}
console.log(`\n${found.size} external links, ${failed} failed.`);
process.exitCode = failed > 0 ? 1 : 0;
