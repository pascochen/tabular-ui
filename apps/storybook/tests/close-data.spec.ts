import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { expect, test } from '@playwright/test';

/**
 * The Kasane app's generated data (apps/demo/data/close.json, people.json,
 * checks.json, sources.json) must agree with the rest of the demo's data. The export script
 * checks each figure against the Kasane dataset, which isn't in this
 * repository. This checks what CI can see: that every id, file, person,
 * account and amount one file names exists in, and matches, the others.
 *
 * Nothing here needs a browser; it reads tracked files.
 */

const dataDir = path.resolve(import.meta.dirname, '../../demo/data');
const read = <T>(name: string): T => JSON.parse(readFileSync(path.join(dataDir, name), 'utf8')) as T;

type Line = { account: string; name: string; debit: number; credit: number };
type Reply = { author: string; text: string };
type Citation = { source: string; exhibit: string; record: string; locator: string; backs: 'rule' | 'evidence' };
type Exception = {
  id: string;
  summary: string;
  agent: string;
  channel: string;
  scope: string;
  rule: string;
  evidence: string;
  sources: string[];
  citations: Citation[];
  replies: Reply[];
  resolution?: { by: string; log: string };
  waiting?: { on: string };
  notChecked: string[];
};
type Agent = {
  key: string;
  name: string;
  checks: string;
  finding: string;
  reads: string[];
  starters: { question: string; answer: string; sources: string[]; notChecked: string[] }[];
};
type Channel = { id: string; topic: string; owner: string; members: string[] };
type Close = {
  period: { open: string; locked: string; reopened: string };
  agentRules: { never: string[]; setUpBy: string };
  agents: Agent[];
  channels: Channel[];
  directMessages: string[];
  exceptions: Exception[];
  hero: {
    exception: string;
    authorship: { asked: string };
    tool: { running: string; done: string };
    options: { id: string; description: string }[];
    entry: { lines: Line[] };
    delegate: { reason: string };
  };
};
type TableExcerpt = {
  type: 'table';
  count: string;
  columns: { key: string }[];
  rows: Record<string, string>[];
  citedRows: number[];
};
type TextExcerpt = { type: 'text'; count: string; lines: { n: number; text: string; cited?: boolean }[] };
type Source = {
  id: string;
  name: string;
  kind: 'document' | 'csv';
  covers: string;
  total: { count: number; unit: string } | null;
  records: string[];
  excerpt: TableExcerpt | TextExcerpt;
};

const close = read<Close>('close.json');
const people = read<Record<string, { id: string; name: string }>>('people.json');
const checks = read<{ id: string; before: number; after: number }[]>('checks.json');
const sources = read<Source[]>('sources.json');
const pack = new Set(read<{ name: string }[]>('pack.json').map((f) => f.name));
const members = new Set([...Object.keys(people), ...close.agents.map((a) => a.key)]);

test('each finding rests on pack files', () => {
  for (const e of close.exceptions) for (const s of e.sources) expect(pack, `${e.id}: ${s}`).toContain(s);
  for (const a of close.agents) for (const f of a.reads) expect(pack, `${a.key} reads ${f}`).toContain(f);
});

test('everyone who speaks, resolves or belongs is a person in people.json', () => {
  const named = [
    ...close.exceptions.flatMap((e) => [...e.replies.map((r) => r.author), ...(e.resolution ? [e.resolution.by] : [])]),
    ...close.channels.flatMap((c) => c.members),
    ...close.directMessages,
    ...close.channels.map((c) => c.owner),
    close.agentRules.setUpBy,
  ];
  for (const key of named) expect(members, key).toContain(key);
});

test("every exception says what wasn't checked, [] for nothing", () => {
  for (const e of close.exceptions) expect(Array.isArray(e.notChecked), e.id).toBe(true);
});

test('an unresolved exception says what it waits on', () => {
  for (const e of close.exceptions.filter((x) => !x.resolution)) expect(e.waiting?.on, e.id).toBeTruthy();
});

test('the proposed reversal balances and moves exactly the revenue the cut-off check finds', () => {
  const { lines } = close.hero.entry;
  const total = (k: 'debit' | 'credit') => lines.reduce((t, l) => t + l[k], 0);
  expect(total('debit')).toBe(total('credit'));
  const revenue = lines.find((l) => l.account === '4000');
  const cutOff = checks.find((c) => c.id === close.hero.exception);
  expect(revenue?.debit).toBeGreaterThan(0);
  expect(revenue?.debit).toBe(cutOff?.before);
  expect(cutOff?.after).toBe(0);
});

test('every check belongs to an exception and has something to fix', () => {
  for (const c of checks) {
    expect(close.exceptions.map((e) => e.id)).toContain(c.id);
    expect(c.before).toBeGreaterThan(c.after);
  }
});

test('no authored token is left unfilled', () => {
  for (const name of ['close.json', 'people.json', 'checks.json', 'sources.json']) {
    expect(readFileSync(path.join(dataDir, name), 'utf8')).not.toMatch(/\{[a-zA-Z]+\}/);
  }
});

test('each answer says what it does before it is pressed', () => {
  for (const option of close.hero.options) expect(option.description, option.id).toBeTruthy();
});

// The basis says the policy doesn't settle a locked month, so the reason for
// "Choose for me" must not read as if it did.
test('a choice the policy leaves open is said to be the agent’s own', () => {
  expect(close.hero.delegate.reason).toMatch(/^The policy doesn’t decide this\. I chose/);
});

test('the decision comes first in the channel, so it opens above the fold', () => {
  // User tests, 2026-11: every tester missed the options when it was fourth.
  expect(close.exceptions[0].id).toBe(close.hero.exception);
});

// ---------------------------------------------------------------------------
// The Kasane app: the decisions in its pages spec, D1 to D6
// ---------------------------------------------------------------------------

test('D1: four agents, each a role word and "AI", and "AI" comes last', () => {
  expect(close.agents.map((a) => a.name)).toEqual(['Cut-off AI', 'Payments AI', 'Approvals AI', 'Credit AI']);
  expect(close.hero.authorship.asked).toBe('Cut-off AI · Awaiting your answer');
});

test('each agent raises one finding, and every finding has one agent', () => {
  expect(close.agents.map((a) => a.finding).sort()).toEqual(close.exceptions.map((e) => e.id).sort());
  for (const e of close.exceptions) {
    expect(close.agents.find((a) => a.key === e.agent)?.finding, e.id).toBe(e.id);
  }
});

test('D2: the visitor is Daisuke Onodera, and Mei is a teammate', () => {
  expect(people.visitor).toMatchObject({ id: 'E0010', name: 'Daisuke Onodera' });
  expect(Object.values(people).map((p) => p.name)).toContain('Mei Tachibana');
  expect(close.agentRules.setUpBy).toBe('visitor');
});

test('each finding states a rule and what the books show, and quotes nobody', () => {
  for (const e of close.exceptions) {
    expect(e.rule, e.id).toBeTruthy();
    expect(e.evidence, e.id).toBeTruthy();
    expect(`${e.rule} ${e.evidence} ${e.summary}`, e.id).not.toMatch(/\b(you said|says|said)\b/i);
  }
});

test('a finding’s rule cites a document, unless no document states it', () => {
  const backing = Object.fromEntries(close.exceptions.map((e) => [e.id, e.citations.map((c) => c.backs)]));
  expect(backing).toEqual({
    'revenue-cut-off': ['rule', 'evidence'],
    'duplicate-payment': ['evidence', 'evidence'],
    'self-approved-entry': ['rule', 'evidence'],
    'credit-limit': ['rule', 'evidence'],
  });
});

test('the data stays on checks and ledgers: no interview source, no claim, no gap or question list', () => {
  const names = readdirSync(dataDir);
  for (const gone of ['discovery.json', 'findings.json']) expect(names).not.toContain(gone);
  for (const name of names) {
    const text = readFileSync(path.join(dataDir, name), 'utf8');
    expect(text, name).not.toMatch(/\.txt"|"claim"|"gaps"|"followUp"|contradict|interview|transcript/i);
  }
});

test('D2: nobody replies or resolves as the visitor but the visitor’s own decision', () => {
  for (const e of close.exceptions) {
    for (const r of e.replies) expect(r.author, e.id).not.toBe('visitor');
    if (e.id !== close.hero.exception && e.resolution) expect(e.resolution.by, e.id).not.toBe('visitor');
  }
});

test('D3: four findings, the two resolved at landing are gone', () => {
  expect(close.exceptions.map((e) => e.id)).toEqual([
    'revenue-cut-off',
    'duplicate-payment',
    'self-approved-entry',
    'credit-limit',
  ]);
});

test('each finding sits in its channel, with its entity and period', () => {
  const where = Object.fromEntries(close.exceptions.map((e) => [e.id, [e.channel, e.scope]]));
  expect(where).toEqual({
    'revenue-cut-off': ['revenue', 'KJP, Sep 2026'],
    'duplicate-payment': ['payables', 'KUS, Jul 2026'],
    'self-approved-entry': ['close', 'KUK, Aug 2026'],
    'credit-limit': ['receivables', 'KUS, up to Sep 2026'],
  });
});

test('six channels, in the sidebar’s order, each with a topic and an owner', () => {
  expect(close.channels.map((c) => c.id)).toEqual([
    'close',
    'cash',
    'receivables',
    'payables',
    'revenue',
    'intercompany',
  ]);
  for (const c of close.channels) {
    expect(c.topic, c.id).toBeTruthy();
    expect(Object.keys(people), c.id).toContain(c.owner);
    expect(c.members, c.id).toContain('visitor');
  }
});

test('every channel’s owner belongs to it', () => {
  for (const c of close.channels) expect(c.members, c.id).toContain(c.owner);
});

test('the quiet channels hold no finding', () => {
  const quiet = close.channels.filter((c) => !close.exceptions.some((e) => e.channel === c.id)).map((c) => c.id);
  expect(quiet).toEqual(['cash', 'intercompany']);
});

test('direct messages are people only, and the visitor isn’t one of them', () => {
  expect(close.directMessages).toEqual(['fpaHead', 'apLead']);
});

test('two suggested questions an agent, 8 in all, each with its sources and what wasn’t checked', () => {
  expect(close.agents.flatMap((a) => a.starters)).toHaveLength(8);
  for (const a of close.agents) {
    expect(a.starters, a.key).toHaveLength(2);
    for (const q of a.starters) {
      expect(q.answer, q.question).toBeTruthy();
      expect(q.sources.length, q.question).toBeGreaterThan(0);
      expect(Array.isArray(q.notChecked), q.question).toBe(true);
      for (const f of q.sources) expect(a.reads, q.question).toContain(f);
    }
  }
});

test('the hero’s tool line claims only what the material holds', () => {
  // The material has an invoice's delivery date and no delivery note, as "not checked" says.
  const { tool } = close.hero;
  expect(tool.done).toMatch(/^Read the delivery date on /);
  expect(tool.running).toMatch(/^Reading the delivery date on /);
  expect(close.exceptions.find((e) => e.id === close.hero.exception)?.notChecked[0]).toMatch(/^The delivery note: /);
});

test('D6: the binder is 9 files, deduplicated, in a fixed order', () => {
  const names = sources.map((s) => s.name);
  expect(names).toHaveLength(9);
  expect(new Set(names).size).toBe(9);
  expect(sources.map((s) => s.id)).toEqual(names.map((_, i) => `S-${i + 1}`));
  const ranges = { document: [1, 4], csv: [5, 9] };
  for (const s of sources) {
    const n = Number(s.id.slice(2));
    expect(n, s.name).toBeGreaterThanOrEqual(ranges[s.kind][0]);
    expect(n, s.name).toBeLessThanOrEqual(ranges[s.kind][1]);
  }
  expect(sources.find((s) => s.id === 'S-7')?.name).toBe('sales_invoices_2026-09.csv');
  expect(names).not.toContain('trial_balance_monthly.csv');
  expect(names).not.toContain('company_profile.md');
});

test('D6: every file a finding cites or an agent reads is in the binder, and nothing else is', () => {
  const cited = [...close.exceptions.flatMap((e) => e.sources), ...close.agents.flatMap((a) => a.reads)];
  expect([...new Set(cited)].sort()).toEqual(sources.map((s) => s.name).sort());
});

test('every citation names a real exhibit and a record its excerpt shows', () => {
  for (const e of close.exceptions) {
    expect(
      e.citations.map((c) => c.source),
      e.id,
    ).toEqual(e.sources);
    for (const c of e.citations) {
      const s = sources.find((x) => x.id === c.exhibit);
      expect(s?.name, c.locator).toBe(c.source);
      expect(s?.records, c.locator).toContain(c.record);
      expect(c.locator.startsWith(`${c.exhibit}, `), c.locator).toBe(true);
      if (s?.excerpt?.type === 'table') {
        const values = s.excerpt.citedRows.flatMap((i) => Object.values((s.excerpt as TableExcerpt).rows[i]));
        expect(values, c.locator).toContain(c.record);
      } else {
        const [from, to] = c.record.slice(1).split('-').map(Number);
        const cited = (s?.excerpt as TextExcerpt).lines.filter((l) => l.cited).map((l) => l.n);
        for (let n = from; n <= (to ?? from); n++) expect(cited, c.locator).toContain(n);
      }
    }
  }
});

test('an excerpt’s count is the truth about what it shows', () => {
  for (const s of sources) {
    const shown = s.excerpt.type === 'table' ? s.excerpt.rows.length : s.excerpt.lines.length;
    expect(s.excerpt.count, s.name).toContain(
      `${shown.toLocaleString('en-US')} of ${s.total?.count.toLocaleString('en-US')} ${s.total?.unit}`,
    );
    // The trim: never a whole file, and a row is no wider than the columns it says it keeps.
    expect(shown, s.name).toBeLessThanOrEqual(s.total!.count);
    if (s.excerpt.type === 'table') {
      const columns = s.excerpt.columns.map((c) => c.key).sort();
      for (const row of s.excerpt.rows) expect(Object.keys(row).sort(), s.name).toEqual(columns);
    }
  }
});

test('a CSV excerpt is the cited record and up to 10 rows either side, or every row for one customer', () => {
  const excerpt = (id: string) => sources.find((s) => s.id === id)?.excerpt as TableExcerpt;
  // The cited invoice is the file's last row, so only the rows above it exist.
  expect(excerpt('S-7').rows).toHaveLength(11);
  expect(excerpt('S-7').rows[excerpt('S-7').citedRows[0]].invoice_id).toBe('INV-KJP-2609-00363');
  // Its eight month-ends over the limit aren't next to each other.
  expect(excerpt('S-5').count).toContain('every row for Great Lakes Duplicating Supply');
  expect(excerpt('S-5').citedRows).toHaveLength(8);
  for (const row of excerpt('S-5').rows) expect(row.customer_id).toBe('C-KUS-0001');
  // The two payments of the duplicate, in the payment file.
  const paid = excerpt('S-9');
  expect(paid.citedRows.map((i) => paid.rows[i].ap_invoice_id)).toEqual(['API-KUS-2607-00007', 'API-KUS-2607-00011']);
});

test('a document’s excerpt marks the lines a rule rests on, inside the section it shows', () => {
  const lines = (sources.find((s) => s.id === 'S-1')?.excerpt as TextExcerpt).lines;
  expect(lines.filter((l) => l.cited).map((l) => l.n)).toEqual([26]);
  expect(lines.find((l) => l.n === 26)?.text).toContain('revenue belongs to the period in which delivery occurs');
  const memo = (sources.find((s) => s.id === 'S-3')?.excerpt as TextExcerpt).lines;
  expect(memo.filter((l) => l.cited).map((l) => l.n)).toEqual([37, 38, 39]);
  expect(memo.find((l) => l.n === 39)?.text).toContain('credit hold since 10 Sep');
});

test('the period lines say what #close’s panel and the header show (D7)', () => {
  expect(close.period).toEqual({
    open: 'October 2026, open',
    locked: 'Locked 8 Oct 2026, business day 6',
    reopened: 'Reopened 16 Oct 2026',
  });
});
